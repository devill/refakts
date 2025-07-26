import {Node, Project} from 'ts-morph';
import {SemanticReferenceFinder} from "./semantic-reference-finder";
import {SearchContext} from "./search-context";
import {ModuleImportReferenceFinder} from "./module-import-reference-finder";

export class CrossFileReferenceFinder {
  private semanticFinder: SemanticReferenceFinder;
  private moduleImportFinder: ModuleImportReferenceFinder;

  constructor(private _project: Project) {
    this.semanticFinder = new SemanticReferenceFinder(_project);
    this.moduleImportFinder = new ModuleImportReferenceFinder(_project);
  }

  findAllReferences(targetNode: Node, scopeDirectory?: string): Node[] {
    const symbol = targetNode.getSymbol();
    if (!symbol) {
      throw new Error('No symbol found for target node');
    }

    const moduleFilePath = targetNode.getSourceFile().getFilePath();
    const context = new SearchContext(scopeDirectory, moduleFilePath);

    const semanticNodes = this.semanticFinder.findReferences(targetNode, context);
    const moduleImportNodes = this.moduleImportFinder.findReferences(targetNode, context);

    const allNodes = [...semanticNodes, ...moduleImportNodes];
    return this.deduplicateNodes(allNodes);
  }

  private deduplicateNodes(nodes: Node[]): Node[] {
    const seen = new Set<string>();
    return nodes.filter(node => {
      const sourceFile = node.getSourceFile();
      const start = node.getStart();
      const key = `${sourceFile.getFilePath()}:${start}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

}