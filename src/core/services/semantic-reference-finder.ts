import {ReferenceFinder} from "./references-finder";
import {Node, Project} from "ts-morph";

import {SearchContext} from "./search-context";

export class SemanticReferenceFinder implements ReferenceFinder {
    constructor(private project: Project) {
    }

    findReferences(targetNode: Node, context: SearchContext): Node[] {
        const languageService = this.project.getLanguageService();
        const referencedSymbols = languageService.findReferences(targetNode);
        const nodes: Node[] = [];

        for (const referencedSymbol of referencedSymbols) {
            for (const reference of referencedSymbol.getReferences()) {
                const referenceSourceFile = reference.getSourceFile();
                if (!referenceSourceFile) continue;

                const referenceNode = referenceSourceFile.getDescendantAtPos(reference.getTextSpan().getStart());
                if (!referenceNode) continue;

                if (this.isNodeInScope(referenceNode, context.scopeDirectory)) {
                    nodes.push(referenceNode);
                }
            }
        }

        return nodes;
    }

    private isNodeInScope(node: Node, scopeDirectory?: string): boolean {
        if (!scopeDirectory) {
            return true;
        }
        const normalizedScope = require('path').resolve(scopeDirectory);
        return node.getSourceFile().getFilePath().startsWith(normalizedScope);
    }
}