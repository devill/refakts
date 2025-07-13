import { SourceFile, SyntaxKind, Identifier } from 'ts-morph';

export class ASTNodeFinder {
  static findIdentifierByNameAndParentKind(
    sourceFile: SourceFile,
    name: string,
    parentKind: SyntaxKind
  ): Identifier | undefined {
    return sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
      .find(node => node.getText() === name && node.getParent()?.getKind() === parentKind);
  }
}