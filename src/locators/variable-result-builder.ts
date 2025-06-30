import { Node } from 'ts-morph';
import { UsageTypeDetector } from './usage-type-detector';

export interface VariableLocation {
  kind: 'declaration' | 'usage';
  usageType?: 'read' | 'write' | 'update';
  line: number;
  column: number;
  text: string;
}

export interface VariableLocationResult {
  variable: string;
  declaration: VariableLocation;
  usages: VariableLocation[];
}

export interface VariableNodeResult {
  variable: string;
  declaration: Node;
  usages: Array<{node: Node; usageType: 'read' | 'write' | 'update'}>;
}

export class VariableResultBuilder {
  private usageTypeDetector = new UsageTypeDetector();

  buildLocationResult(variableName: string, declaration: Node, usages: Node[]): VariableLocationResult {
    return {
      variable: variableName,
      declaration: this.createLocation(declaration, 'declaration'),
      usages: usages.map(usage => this.createUsageLocation(usage))
    };
  }

  buildNodeResult(variableName: string, declaration: Node, usages: Node[]): VariableNodeResult {
    return {
      variable: variableName,
      declaration,
      usages: usages.map(usage => ({
        node: usage,
        usageType: this.usageTypeDetector.determineUsageType(usage)
      }))
    };
  }

  private createLocation(node: Node, kind: 'declaration' | 'usage'): VariableLocation {
    const position = this.getNodePosition(node);
    
    return {
      kind,
      line: position.line,
      column: position.column,
      text: node.getText()
    };
  }

  private createUsageLocation(node: Node): VariableLocation {
    const location = this.createLocation(node, 'usage');
    const usageType = this.usageTypeDetector.determineUsageType(node);
    
    return {
      ...location,
      usageType
    };
  }

  private getNodePosition(node: Node): {line: number; column: number} {
    const start = node.getStart();
    const sourceFile = node.getSourceFile();
    return sourceFile.getLineAndColumnAtPos(start);
  }
}