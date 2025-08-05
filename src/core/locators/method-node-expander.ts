import { 
  createWrappedNode, 
  MethodDeclaration, 
  ConstructorDeclaration, 
  Node, 
  SourceFile, 
  ts,
  Decorator,
  JSDoc
} from 'ts-morph';

export class MethodNodeExpander {
  expandWithMetadata(
    method: MethodDeclaration | ConstructorDeclaration,
    sourceFile: SourceFile
  ): Node {
    return this.createWrapperNode(method, this.locateMethodMetadata(method), sourceFile);
  }
  
  private locateMethodMetadata(method: MethodDeclaration | ConstructorDeclaration): ts.Node[] {
    return [
      ...this.getDecoratorNodes(method),
      ...this.getJsDocNodes(method)
    ];
  }

  private getJsDocNodes(method: MethodDeclaration | ConstructorDeclaration): ts.Node[] {
    return method.getJsDocs().map((jsDoc: JSDoc) => jsDoc.compilerNode);
  }

  private getDecoratorNodes(method: MethodDeclaration | ConstructorDeclaration): ts.Node[] {
    if (!Node.isMethodDeclaration(method)) return [];
    return method.getDecorators().map((decorator: Decorator) => decorator.compilerNode);
  }

  private createWrapperNode(
    method: MethodDeclaration | ConstructorDeclaration,
    metadata: ts.Node[],
    sourceFile: SourceFile
  ): Node {
    const allNodes = [...metadata, method.compilerNode];
    const wrapperNode = this.createBlockNode(allNodes);
    this.setWrapperRange(wrapperNode, allNodes, sourceFile);
    return createWrappedNode(wrapperNode, { sourceFile: sourceFile.compilerNode });
  }

  private setWrapperRange(
    wrapperNode: ts.Block,
    allNodes: ts.Node[],
    sourceFile: SourceFile
  ): void {
    if (allNodes.length === 0) return;
    
    this.setNodePosition(wrapperNode, this.calculateStartPosition(allNodes, sourceFile));
    this.setNodeEnd(wrapperNode, this.calculateEndPosition(allNodes));
  }

  private calculateEndPosition(allNodes: ts.Node[]): number {
    return Math.max(...allNodes.map(node => node.end));
  }

  private setNodeEnd(node: ts.Node, endPosition: number): void {
    Object.defineProperty(node, 'end', { value: endPosition, writable: false });
  }

  private calculateStartPosition(allNodes: ts.Node[], sourceFile: SourceFile): number {
    return Math.min(...allNodes.map(node => {
      const leadingComments = ts.getLeadingCommentRanges(sourceFile.getFullText(), node.pos) || [];
      return leadingComments.length > 0 
        ? Math.min(...leadingComments.map(c => c.pos))
        : node.pos;
    }));
  }

  private setNodePosition(node: ts.Node, position: number): void {
    Object.defineProperty(node, 'pos', { value: position, writable: false });
  }

  private createBlockNode(allNodes: ts.Node[]): ts.Block {
    return ts.factory.createBlock(
      allNodes.map(node => this.nodeToStatement(node)),
      false
    );
  }


  private nodeToStatement(node: ts.Node): ts.Statement {
    if (ts.isStatement(node)) {
      return node;
    }
    return ts.factory.createExpressionStatement(node as ts.Expression);
  }
}