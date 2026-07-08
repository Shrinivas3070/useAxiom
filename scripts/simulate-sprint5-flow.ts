import { MockLlmProvider } from '../packages/ai-providers';
import { InMemoryMemory } from '../packages/ai-memory';
import { AiOrchestrator, runAgentWithTools } from '../packages/ai-core';
import {
  GetEmployeeWorkloadsTool,
  GetEmployeeSkillsTool,
  UpdateTaskStatusTool,
  SendWhatsappMessageTool,
  FlagProjectAtRiskTool
} from '../packages/ai-tools';

async function runSprint5Simulation() {
  console.log('================================================================================');
  console.log('               STARTING SPRINT 5 E2E INTEGRATION FLOW SIMULATOR                 ');
  console.log('================================================================================\n');

  // Initialize Core Services
  const provider = new MockLlmProvider();
  const memory = new InMemoryMemory();
  const orchestrator = new AiOrchestrator({ provider, memory });

  // Instantiate tools with real console callbacks representing DB operations
  const workloadsTool = new GetEmployeeWorkloadsTool(async () => {
    console.log('[DB Operation] get_employee_workloads: Querying team workloads...');
    return [
      { id: 'dev-2', name: 'Bob', workload: 2 },
      { id: 'dev-3', name: 'Alice', workload: 0 }
    ];
  });

  const skillsTool = new GetEmployeeSkillsTool(async () => {
    console.log('[DB Operation] get_employee_skills: Querying team skills list...');
    return [
      { id: 'dev-2', name: 'Bob', skills: ['NestJS'] },
      { id: 'dev-3', name: 'Alice', skills: ['Tailwind', 'Next.js'] }
    ];
  });

  const updateStatusTool = new UpdateTaskStatusTool(async (taskId, status, reason) => {
    console.log(`[DB Operation] update_task_status: Set task "${taskId}" status to "${status}" (reason: ${reason || 'none'})`);
    return { success: true };
  });

  const sendMsgTool = new SendWhatsappMessageTool(async (employeeId, message) => {
    console.log(`[WhatsApp SDK] send_whatsapp_message to "${employeeId}": "${message}"`);
    return { success: true, messageId: 'wa-msg-8877' };
  });

  const flagProjectTool = new FlagProjectAtRiskTool(async (projectId, riskScore, reasoning) => {
    console.log(`[DB Operation] flag_project_at_risk: Project "${projectId}" flagged with risk ${riskScore}%: "${reasoning}"`);
    return { success: true };
  });

  const tools = [workloadsTool, skillsTool, updateStatusTool, sendMsgTool, flagProjectTool];

  // ---------------------------------------------------------------------------
  // PHASE 1: MANAGER DEFINES OBJECTIVE & PLANNER AGENT RUNS
  // ---------------------------------------------------------------------------
  console.log('--- PHASE 1: Manager defines objective & PlannerAgent runs (with RAG lookups) ---');
  const objective = 'Create marketing campaign';
  console.log(`[Dashboard UX] Manager entered objective: "${objective}"`);

  // This will trigger long-term memory query because 'Create marketing campaign' matches the tags we seeded!
  const plannerOutput = await orchestrator.getPlanner().run({ objective });
  console.log('[PlannerAgent Output]:\n', JSON.stringify(plannerOutput, null, 2));

  // Extract tasks for next phase
  const tasksToAssign = plannerOutput.milestones.flatMap((m) =>
    m.tasks.map((t, idx) => ({
      id: `task-${100 + idx}`,
      name: t.name,
      requiredSkills: t.requiredSkills
    }))
  );

  // ---------------------------------------------------------------------------
  // PHASE 2: ASSIGNMENT AGENT MAPS TASKS TO TEAM MEMBERS
  // ---------------------------------------------------------------------------
  console.log('\n--- PHASE 2: AssignmentAgent maps tasks to team members ---');
  const team = [
    { id: 'dev-2', name: 'Bob', skills: ['NestJS', 'Copywriting'], workload: 2 },
    { id: 'dev-3', name: 'Alice', skills: ['Tailwind', 'Next.js', 'Deployment'], workload: 0 }
  ];

  const assignResult = await orchestrator.getAssigner().run({
    tasks: tasksToAssign,
    team: team
  });
  console.log('[AssignmentAgent Output]:\n', JSON.stringify(assignResult, null, 2));

  // ---------------------------------------------------------------------------
  // PHASE 3: EMPLOYEE DIALOGUE & CONTEXT CONVERSATION LOOP
  // ---------------------------------------------------------------------------
  console.log('\n--- PHASE 3: Employee dialog loop via WhatsApp (parsing & context tracking) ---');
  const threadId = 'whatsapp-thread-bob';

  console.log('\n[WhatsApp Receive] Bob sends message: "Starting the copy draft now"');
  const convReply1 = await orchestrator.getConversation().run({
    threadId,
    message: 'Starting the copy draft now'
  });
  console.log('[ConversationAgent Response]:\n', JSON.stringify(convReply1, null, 2));

  // Simulate Bob sending a block update, executing ReAct loop runner to flag risk
  console.log('\n[WhatsApp Receive] Bob sends blocker message: "I am blocked on graphics, link is broken"');
  const contextMessages = [
    {
      role: 'system' as const,
      content: 'You are useAxiom\'s Conversation parsing agent. Classify the user update and run tools if they are blocked or need escalation.'
    },
    // We append the bob thread history retrieved from memory!
    ...(await memory.getShortTermContext(threadId)).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    })),
    {
      role: 'user' as const,
      content: 'I am blocked on graphics, link is broken'
    }
  ];

  // Execute using runAgentWithTools ReAct runner to invoke update_task_status / flag_project_at_risk!
  console.log('[ReAct Executor] Starting tool-calling execution loop...');
  const executorResult = await runAgentWithTools(
    contextMessages,
    { provider, tools }
  );
  console.log('[ReAct Executor Final Response]:', executorResult);

  // ---------------------------------------------------------------------------
  // PHASE 4: RISK & REPORTING AGENT SUMMARIZES STATE
  // ---------------------------------------------------------------------------
  console.log('\n--- PHASE 4: Risk & Reporting Agent summarizes project execution state ---');
  const updatedTasks = [
    { id: 'task-100', name: 'Draft Email Copy', status: 'IN_PROGRESS', estimatedHours: 4 },
    { id: 'task-101', name: 'Configure Audience', status: 'PENDING', estimatedHours: 2 },
    { id: 'task-102', name: 'Load Graphics', status: 'BLOCKED', estimatedHours: 2 }
  ];

  const reportResult = await orchestrator.getReporting().run({
    projectId: 'project-q3-campaign',
    tasks: updatedTasks
  });
  console.log('[ReportingAgent Output]:\n', JSON.stringify(reportResult, null, 2));

  console.log('\n================================================================================');
  console.log('              SPRINT 5 E2E INTEGRATION FLOW SIMULATOR COMPLETE                  ');
  console.log('================================================================================');
}

runSprint5Simulation().catch(console.error);
