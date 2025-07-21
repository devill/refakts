import { ModuleA } from '../a';

export class ModuleB {
  private moduleA?: ModuleA;

  isActive(): boolean {
    return true;
  }

  setModuleA(moduleA: ModuleA): void {
    this.moduleA = moduleA;
  }

  getModuleA(): ModuleA | undefined {
    return this.moduleA;
  }
}