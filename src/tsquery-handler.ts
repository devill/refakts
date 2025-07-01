import { Node } from 'ts-morph';
import { tsquery } from '@phenomnomnominal/tsquery';

export class TSQueryHandler {
  findNodeByQuery(sourceFile: any, query: string): Node {
    const matches = this.executeQuery(sourceFile, query);
    this.validateMatches(matches, query);
    
    if (matches.length > 1) {
      return this.handleMultipleMatches(sourceFile, matches, query);
    }
    
    return this.convertToMorphNode(sourceFile, matches[0]);
  }

  findNodesByQuery(sourceFile: any, query: string): Node[] {
    const matches = this.executeQuery(sourceFile, query);
    return matches.map(match => this.convertToMorphNode(sourceFile, match));
  }

  private executeQuery(sourceFile: any, query: string) {
    return tsquery(sourceFile.compilerNode, query);
  }

  private validateMatches(matches: any[], query: string): void {
    if (matches.length === 0) {
      throw new Error(`No matches found for query: ${query}`);
    }
  }

  private handleMultipleMatches(sourceFile: any, matches: any[], query: string): Node {
    const firstNode = this.convertToMorphNode(sourceFile, matches[0]);
    if (!Node.isIdentifier(firstNode)) {
      throw new Error(`Multiple matches found for query: ${query}. Please be more specific.`);
    }
    
    this.validateSameVariable(sourceFile, matches, firstNode.getText(), query);
    return firstNode;
  }

  private validateSameVariable(sourceFile: any, matches: any[], variableName: string, query: string): void {
    for (let i = 1; i < matches.length; i++) {
      const node = this.convertToMorphNode(sourceFile, matches[i]);
      if (!Node.isIdentifier(node) || node.getText() !== variableName) {
        throw new Error(`Multiple matches found for query: ${query}. Please be more specific.`);
      }
    }
  }

  private convertToMorphNode(sourceFile: any, match: any): Node {
    // Use getDescendantAtStartWithWidth to get the exact node, not a child
    const start = match.getStart();
    const end = match.getEnd();
    const width = end - start;
    
    const node = sourceFile.getDescendantAtStartWithWidth(start, width);
    if (!node) {
      // Fallback to getDescendantAtPos if the exact match fails
      const fallback = sourceFile.getDescendantAtPos(start);
      if (!fallback) {
        throw new Error(`Could not find ts-morph node for query match`);
      }
      return fallback;
    }
    return node;
  }
}