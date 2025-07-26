import {Node, Project} from 'ts-morph';
import {SemanticReferenceFinder} from "./semantic-reference-finder";
import {ModuleImportReferenceFinder} from "./module-import-reference-finder";

export class CrossFileReferenceFinder {
  private semanticFinder: SemanticReferenceFinder;
  private moduleImportFinder: ModuleImportReferenceFinder;

  constructor(private _project: Project) {
    this.semanticFinder = new SemanticReferenceFinder(_project);
    this.moduleImportFinder = new ModuleImportReferenceFinder(_project);
  }

  findAllReferences(targetNode: Node): Node[] {
    return this.deduplicateNodes([
      ...(this.semanticFinder.findReferences(targetNode)),
      ...(this.moduleImportFinder.findReferences(targetNode))
    ]);
  }

  private deduplicateNodes(nodes: Node[]): Node[] {
    const seen = new Set<string>();
    return nodes.filter(node => {
      const key = CrossFileReferenceFinder.nodeKey(node);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private static nodeKey(node: Node) {
    return `${node.getSourceFile().getFilePath()}:${(node.getStart())}`;
  }
}