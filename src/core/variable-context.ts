import { Node, SourceFile } from 'ts-morph';

export class VariableContext {
  readonly variableName: string;
  readonly declaration: Node;
  readonly declarationIdentifier: Node | undefined;
  readonly sourceFile: SourceFile;

  constructor(
    variableName: string,
    declaration: Node,
    declarationIdentifier: Node | undefined,
    sourceFile: SourceFile
  ) {
    this.variableName = variableName;
    this.declaration = declaration;
    this.declarationIdentifier = declarationIdentifier;
    this.sourceFile = sourceFile;
  }
}