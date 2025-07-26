import {Node, Project, ReferencedSymbol} from "ts-morph";

export class SemanticReferenceFinder {
    constructor(private project: Project) {
    }

    findReferences(targetNode: Node): Node[] {
        return this.project
            .getLanguageService()
            .findReferences(targetNode)
            .flatMap(referencedSymbol => this.findReferencesFor(referencedSymbol));
    }

    private findReferencesFor(referencedSymbol: ReferencedSymbol) {
        return referencedSymbol
            .getReferences()
            .map(reference => reference.getNode());
    }
}