import { ClassDeclaration, ClassMemberTypes, Node, SyntaxKind } from 'ts-morph';
import { CommandOptions, RefactoringCommand } from './command';
import { LocationRange } from '../ast/location-range';
import { ConsoleOutput } from '../../command-line-parser/output-formatter/console-output';
import { RefactoringCommandResult } from './result-types/refactoring-result';
import { ASTService } from '../ast/ast-service';
import { ClassMethodFinder, MethodInfo } from '../services/class-method-finder';
import { MethodDependencyAnalyzer } from '../services/method-dependency-analyzer';
import { MethodSorter } from '../transformations/method-sorter';

export class SortMethodsCommand implements RefactoringCommand {
  readonly name = 'sort-methods';
  readonly description = 'Sort methods according to the step down rule';
  readonly complete = true;

  private consoleOutput!: ConsoleOutput;
  private astService!: ASTService;
  private methodFinder = new ClassMethodFinder();
  private dependencyAnalyzer = new MethodDependencyAnalyzer();

  async execute(file: string, options: CommandOptions): Promise<RefactoringCommandResult> {
    this.validateOptions(options);
    const location = LocationRange.from(options.location as LocationRange);
    this.astService = ASTService.createForFile(file);
    const targetClass = this.findTargetClass(this.astService.findNodeByLocation(location));
    const { className, methodCount } = await this.performMethodSorting(targetClass);
    await this.astService.saveSourceFile(this.astService.loadSourceFile(file));
    return new RefactoringCommandResult(
      `Successfully sorted ${methodCount} method${methodCount === 1 ? '' : 's'} in class '${className}'`
    );
  }

  private findTargetClass(targetNode: Node): ClassDeclaration {
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
  }

  private async performMethodSorting(targetClass: ClassDeclaration): Promise<{ className: string; methodCount: number }> {
    const methods = this.methodFinder.findMethods(targetClass);
    const className = targetClass.getName() ?? 'unknown';
    if (!this.shouldSkipSorting(methods)) {
      this.reorderMethodsInClass(targetClass, this.getSortedMethods(methods));
    }
    return { className, methodCount: targetClass.getMethods().length };
  }
  
  private shouldSkipSorting(methods: MethodInfo[]): boolean {
    return methods.length <= 1;
  }
  
  private getSortedMethods(methods: MethodInfo[]): MethodInfo[] {
    return MethodSorter.sortByStepDownRule(this.dependencyAnalyzer.analyzeDependencies(methods));
  }

  private reorderMethodsInClass(targetClass: ClassDeclaration, sortedMethods: MethodInfo[]): void {
    sortedMethods.forEach((method, index) => method.getNode().setOrder(this.countNonMethodMembers(targetClass.getMembers()) + index));
  }
  
  private countNonMethodMembers(allMembers: ClassMemberTypes[]): number {
    return allMembers.filter(member => 
      !member.isKind(SyntaxKind.MethodDeclaration) && 
      !member.isKind(SyntaxKind.Constructor)
    ).length;
  }
}