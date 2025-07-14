import { ModuleB } from './b/b';

export class ModuleA {
  private moduleB: ModuleB;

  constructor() {
    this.moduleB = new ModuleB();
  }

  isReady(): boolean {
    return this.moduleB.isActive();
  }

  getModuleB(): ModuleB {
    return this.moduleB;
  }
}