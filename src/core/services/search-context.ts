export class SearchContext {
    constructor(
        public readonly scopeDirectory?: string,
        public readonly moduleFilePath?: string
    ) {
    }
}