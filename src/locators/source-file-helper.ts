import { SourceFile, Node } from 'ts-morph';

export class SourceFileHelper {
  static findDescendant(sourceFile: SourceFile, predicate: (node: Node) => boolean): Node | undefined {
    let foundNode: Node | undefined;
    sourceFile.forEachDescendant((node: Node) => {
      if (predicate(node)) {
        foundNode = node;
        return true;
      }
    });
    return foundNode;
  }
}