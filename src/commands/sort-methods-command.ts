import { RefactoringCommand, CommandOptions } from '../command';
import { ASTService } from '../services/ast-service';
import { ClassMethodFinder, MethodInfo } from '../services/class-method-finder';
import { MethodDependencyAnalyzer } from '../services/method-dependency-analyzer';
import { MethodSorter } from '../services/method-sorter';
import { LocationRange } from '../core/location-parser';
import { ClassDeclaration, SyntaxKind, ClassMemberTypes } from 'ts-morph';

export class SortMethodsCommand implements RefactoringCommand {
  readonly name = 'sort-methods';
  readonly description = 'Sort methods according to the step down rule';
  readonly complete = true;

  private astService = new ASTService();
  private methodFinder = new ClassMethodFinder();
  private dependencyAnalyzer = new MethodDependencyAnalyzer();
  private methodSorter = new MethodSorter();

  async execute(file: string, options: CommandOptions): Promise<void> {
    this.validateOptions(options);
    const sourceFile = this.astService.loadSourceFile(file);
    const targetClass = this.findTargetClass(options);
    await this.performMethodSorting(targetClass);
    await this.astService.saveSourceFile(sourceFile);
  }

  private findTargetClass(options: CommandOptions): ClassDeclaration {
    const targetNode = this.astService.findNodeByLocation(options.location as LocationRange);
    
    if (targetNode.isKind(SyntaxKind.ClassDeclaration)) {
      return targetNode as ClassDeclaration;
    }
    
    const parentClass = targetNode.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);
    if (!parentClass) {
      throw new Error('Target location must be within a class');
    }
    
    return parentClass as ClassDeclaration;
  }

  validateOptions(options: CommandOptions): void {
    if (!options.location) {
      throw new Error('Location format must be specified');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts sort-methods "[src/file.ts 5:1-5:10]"';
  }

  private async performMethodSorting(targetClass: ClassDeclaration): Promise<void> {
    const methods = this.methodFinder.findMethods(targetClass);
    
    if (methods.length <= 1) {
      return;
    }
    
    const methodsWithDeps = this.dependencyAnalyzer.analyzeDependencies(methods);
    
    const sortedMethods = this.methodSorter.sortByStepDownRule(methodsWithDeps);
    
    this.reorderMethodsInClass(targetClass, sortedMethods);
  }

  private reorderMethodsInClass(targetClass: ClassDeclaration, sortedMethods: MethodInfo[]): void {
    const allMembers = targetClass.getMembers();
    const nonMethodCount = this.countNonMethodMembers(allMembers);
    
    sortedMethods.forEach((method, index) => {
      const targetIndex = nonMethodCount + index;
      method.getNode().setOrder(targetIndex);
    });
  }
  
  private countNonMethodMembers(allMembers: ClassMemberTypes[]): number {
    return allMembers.filter(member => 
      !member.isKind(SyntaxKind.MethodDeclaration) && 
      !member.isKind(SyntaxKind.Constructor)
    ).length;
  }
}