import { ClassDeclaration, ClassMemberTypes, Node, SyntaxKind } from 'ts-morph';
import { CommandOptions, RefactoringCommand } from './command';
import { LocationRange } from '../location-range';
import { ConsoleOutput } from '../../interfaces/ConsoleOutput';
import { ASTService } from '../../services/ast-service';
import { ClassMethodFinder, MethodInfo } from '../../services/class-method-finder';
import { MethodDependencyAnalyzer } from '../../services/method-dependency-analyzer';
import { MethodSorter } from '../../services/method-sorter';
import { SelectOutputHandler } from '../../services/selection/output-handler';

export class SortMethodsCommand implements RefactoringCommand {
  readonly name = 'sort-methods';
  readonly description = 'Sort methods according to the step down rule';
  readonly complete = true;

  private consoleOutput!: ConsoleOutput;
  private astService = new ASTService();
  private methodFinder = new ClassMethodFinder();
  private dependencyAnalyzer = new MethodDependencyAnalyzer();
  private outputHandler!: SelectOutputHandler;

  async execute(file: string, options: CommandOptions): Promise<void> {
    this.validateOptions(options);
    this.astService = ASTService.createForFile(file);
    const sourceFile = this.astService.loadSourceFile(file);
    const targetClass = this.findTargetClass(options);
    await this.performMethodSorting(targetClass);
    await this.astService.saveSourceFile(sourceFile);
  }

  private findTargetClass(options: CommandOptions): ClassDeclaration {
    const targetNode = this.astService.findNodeByLocation(options.location as LocationRange);
    return this.resolveClassFromNode(targetNode);
  }
  
  private resolveClassFromNode(targetNode: Node): ClassDeclaration {
    if (targetNode.isKind(SyntaxKind.ClassDeclaration)) {
      return targetNode;
    }
    return this.findParentClass(targetNode);
  }
  
  private findParentClass(targetNode: Node): ClassDeclaration {
    const parentClass = targetNode.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);
    if (!parentClass) {
      throw new Error('Target location must be within a class');
    }
    return parentClass;
  }

  validateOptions(options: CommandOptions): void {
    if (!options.location) {
      throw new Error('Location format must be specified');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts sort-methods "[src/file.ts 5:1-5:10]"';
  }

  setConsoleOutput(consoleOutput: ConsoleOutput): void {
    this.consoleOutput = consoleOutput;
    this.outputHandler = new SelectOutputHandler(consoleOutput);
  }

  private async performMethodSorting(targetClass: ClassDeclaration): Promise<void> {
    const methods = this.methodFinder.findMethods(targetClass);
    if (this.shouldSkipSorting(methods)) return;
    
    const sortedMethods = this.getSortedMethods(methods);
    this.reorderMethodsInClass(targetClass, sortedMethods);
  }
  
  private shouldSkipSorting(methods: MethodInfo[]): boolean {
    return methods.length <= 1;
  }
  
  private getSortedMethods(methods: MethodInfo[]): MethodInfo[] {
    const methodsWithDeps = this.dependencyAnalyzer.analyzeDependencies(methods);
    return MethodSorter.sortByStepDownRule(methodsWithDeps);
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