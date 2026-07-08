import { BaseAgent } from '../agent.base';

export interface MilestoneTask {
  name: string;
  description: string;
  estimatedHours: number;
  requiredSkills: string[];
}

export interface MilestonePlan {
  name: string;
  tasks: MilestoneTask[];
}

export interface ProjectPlanResponse {
  milestones: MilestonePlan[];
}

// Strictly typed JSON schema for Planner Agent structured outputs including requiredSkills
const plannerJsonSchema = {
  type: 'object',
  properties: {
    milestones: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                estimatedHours: { type: 'number' },
                requiredSkills: {
                  type: 'array',
                  items: { type: 'string' }
                }
              },
              required: ['name', 'description', 'estimatedHours', 'requiredSkills'],
              additionalProperties: false
            }
          }
        },
        required: ['name', 'tasks'],
        additionalProperties: false
      }
    }
  },
  required: ['milestones'],
  additionalProperties: false
};

export class PlannerAgent extends BaseAgent {
  async run(input: { objective: string; targetDeadline?: string }): Promise<ProjectPlanResponse> {
    const historicalContext = await this.memory.getLongTermContext(input.objective);
    const contextPrompt =
      historicalContext.length > 0
        ? `\n\nUse the following historical reference projects for similar scope and estimations:\n${historicalContext.join('\n')}`
        : '';

    const messages = [
      {
        role: 'system' as const,
        content:
          (this.systemPrompt ||
            'You are useAxiom\'s AI Project Planner. Break down the user\'s objective into a clean list of chronological milestones, and map concrete execution tasks with estimated hours and a list of required technical skills for each task. Be realistic and pragmatic.') +
          contextPrompt
      },
      {
        role: 'user' as const,
        content: `Objective: "${input.objective}"${
          input.targetDeadline ? `\nTarget Deadline: ${input.targetDeadline}` : ''
        }`
      }
    ];

    return this.provider.generateStructuredResponse<ProjectPlanResponse>(
      messages,
      plannerJsonSchema,
      {
        temperature: 0.1, // Keep it deterministic for planning
        model: 'gpt-4o-mini' // Standard cost-efficient reasoning model
      }
    );
  }
}
