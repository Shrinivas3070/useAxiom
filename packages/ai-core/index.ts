export interface Agent {
  id: string;
  name: string;
  run(task: string): Promise<string>;
}

export class PlannerAgent implements Agent {
  constructor(public id: string, public name: string) {}

  async run(task: string): Promise<string> {
    return `Planner agent ${this.name} processed task: ${task}`;
  }
}
