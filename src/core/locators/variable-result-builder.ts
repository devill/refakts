import {Node} from 'ts-morph';
import {UsageTypeDetector} from '../../locators/usage-type-detector';
import {LocationRange} from '../ast/location-range';
import * as path from "path";

export interface VariableLocation {
  kind: 'declaration' | 'usage';
  usageType?: 'read' | 'write' | 'update';
  location: LocationRange;
  text: string;
}

export class VariableLocationResult {
  public readonly variable: string;
  public readonly declaration: VariableLocation;
  public readonly usages: VariableLocation[];

  constructor(variable: string, declaration: VariableLocation, usages: VariableLocation[]) {
    this.variable = variable;
    this.declaration = declaration;
    this.usages = usages;
  }

  formatAsLocationStrings(): string[] {
    const locations: string[] = [];
    this.addDeclarationLocation(locations);
    this.addUsageLocations(locations);
    return locations;
  }

  private addDeclarationLocation(locations: string[]): void {
    if (this.declaration) {
      locations.push(`${this.declaration.location.toString()} ${this.declaration.text}`);
    }
  }

  private addUsageLocations(locations: string[]): void {
    if (this.usages) {
      for (const usage of this.usages) {
        locations.push(`${usage.location.toString()} ${usage.text}`);
      }
    }
  }
}

export interface VariableNodeResult {
  variable: string;
  declaration: Node;
  usages: Array<{node: Node; usageType: 'read' | 'write' | 'update'}>;
}

export class VariableResultBuilder {
  private usageTypeDetector = new UsageTypeDetector();

  buildLocationResult(variableName: string, declaration: Node, usages: Node[]): VariableLocationResult {
    return new VariableLocationResult(
      variableName,
      this.createLocation(declaration, 'declaration'),
      usages.map(usage => this.createUsageLocation(usage))
    );
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
    return {
      kind,
      location: this.createLocationRange(node),
      text: node.getText()
    };
  }

  private createLocationRange(node: Node): LocationRange {
    const sourceFile = node.getSourceFile();
    return new LocationRange(
      path.basename(sourceFile.getFilePath()),
      sourceFile.getLineAndColumnAtPos(node.getStart()),
      sourceFile.getLineAndColumnAtPos(node.getEnd())
    );
  }

  private createUsageLocation(node: Node): VariableLocation {
    const location = this.createLocation(node, 'usage');
    const usageType = this.usageTypeDetector.determineUsageType(node);
    
    return {
      ...location,
      usageType
    };
  }

}