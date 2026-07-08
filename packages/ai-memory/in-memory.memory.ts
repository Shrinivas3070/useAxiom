import { IAiMemory, IMemoryMessage } from './memory.interface';

export class InMemoryMemory implements IAiMemory {
  private shortTerm = new Map<string, IMemoryMessage[]>();
  private longTerm: Array<{ key: string; value: string; tags: string[] }> = [];

  constructor() {
    this.longTerm.push(
      {
        key: 'Build a monorepo',
        value: 'Milestone 1: Scaffold (Setup Monorepo, Configs). Milestone 2: API Integration (Scaffold NestJS API, Prisma db migrations).',
        tags: ['monorepo', 'scaffold', 'nestjs']
      },
      {
        key: 'Create marketing campaign',
        value: 'Milestone 1: Copywriting (Draft Email Copy). Milestone 2: Deployment (Configure Audience, Load Graphics).',
        tags: ['marketing', 'campaign', 'launch']
      }
    );
  }

  async getShortTermContext(threadId: string): Promise<IMemoryMessage[]> {
    return this.shortTerm.get(threadId) || [];
  }

  async appendShortTermMessage(threadId: string, message: IMemoryMessage): Promise<void> {
    if (!this.shortTerm.has(threadId)) {
      this.shortTerm.set(threadId, []);
    }
    this.shortTerm.get(threadId)!.push(message);
  }

  async getLongTermContext(query: string, limit: number = 5): Promise<string[]> {
    const queryLower = query.toLowerCase();
    return this.longTerm
      .filter(
        (m) =>
          m.key.toLowerCase().includes(queryLower) ||
          m.value.toLowerCase().includes(queryLower) ||
          m.tags.some((t) => t.toLowerCase().includes(queryLower))
      )
      .slice(0, limit)
      .map((m) => `${m.key}: ${m.value}`);
  }

  async appendLongTermMemory(key: string, value: string, tags: string[] = []): Promise<void> {
    this.longTerm.push({ key, value, tags });
  }

  async clearContext(threadId: string): Promise<void> {
    this.shortTerm.delete(threadId);
  }
}
