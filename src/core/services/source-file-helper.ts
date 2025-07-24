import { SourceFile, Node } from 'ts-morph';

export class SourceFileHelper {
  static findDescendant(sourceFile: SourceFile, predicate: (_: Node) => boolean): Node | undefined {
    let foundNode: Node | undefined;
    sourceFile.forEachDescendant((node) => {
      if (predicate(node)) {
        foundNode = node;
        return true;
      }
    });
    return foundNode;
  }
}