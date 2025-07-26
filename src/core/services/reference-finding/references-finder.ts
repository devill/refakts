import {Node} from "ts-morph";

import {SearchContext} from "./search-context";

export interface ReferenceFinder {
    findReferences(targetNode: Node, context: SearchContext): Node[];
}