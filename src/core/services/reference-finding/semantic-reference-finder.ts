import {ReferenceFinder} from "./references-finder";
import {Node, Project, ReferencedSymbol} from "ts-morph";
import {SearchContext} from "./search-context";

export class SemanticReferenceFinder implements ReferenceFinder {
    constructor(private project: Project) {
    }

    findReferences(targetNode: Node, _context: SearchContext): Node[] {
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