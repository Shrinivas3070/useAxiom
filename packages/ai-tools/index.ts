export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export const tools: ToolDefinition[] = [
  {
    name: 'createTask',
    description: 'Create a new task in the project management system',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['title'],
    },
  },
];
