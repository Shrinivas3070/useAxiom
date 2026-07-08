export interface MemoryHandler {
  saveContext(key: string, value: string): Promise<void>;
  getContext(key: string): Promise<string | null>;
}

export class SimpleMemoryHandler implements MemoryHandler {
  private store = new Map<string, string>();

  async saveContext(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async getContext(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }
}
