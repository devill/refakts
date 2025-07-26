import {CallExpression, Node, Project, SourceFile, Symbol, SyntaxKind} from "ts-morph";

import path from "path";

export class ModuleImportReferenceFinder {
    constructor(private project: Project) {
    }

    findReferences(targetNode: Node): Node[] {
        const symbol = targetNode.getSymbol();
        const moduleFilePath = targetNode.getSourceFile().getFilePath()
        if (!symbol || !moduleFilePath) {
            return [];
        }

        const symbolName = this.getSymbolName(symbol);
        const nodes: Node[] = [];
        const sourceFiles = this.project.getSourceFiles();

        for (const file of sourceFiles) {
            const requireNodes = this.findRequireNodes(file, moduleFilePath, symbolName);
            nodes.push(...requireNodes);

            const importNodes = this.findDynamicImportNodes(file, moduleFilePath, symbolName);
            nodes.push(...importNodes);
        }

        return nodes;
    }

    private getSymbolName(symbol: Symbol): string {
        const declarations = symbol.getDeclarations();
        if (declarations && declarations.length > 0) {
            const firstDeclaration = declarations[0];
            if (firstDeclaration.getKind() === SyntaxKind.Identifier) {
                return firstDeclaration.getText();
            }
            const firstIdentifier = firstDeclaration.getChildrenOfKind(SyntaxKind.Identifier)[0];
            return firstIdentifier ? firstIdentifier.getText() : symbol.getName();
        }
        return symbol.getName();
    }

    private findRequireNodes(file: SourceFile, moduleFilePath: string, symbolName: string): Node[] {
        const nodes: Node[] = [];
        const requireCalls = file.getDescendantsOfKind(SyntaxKind.CallExpression)
            .filter(call => {
                const expression = call.getExpression();
                return expression.getKind() === SyntaxKind.Identifier &&
                    expression.getText() === 'require';
            });

        for (const requireCall of requireCalls) {
            const moduleNodes = this.handleModuleCall(requireCall, moduleFilePath, symbolName, file, 'require');
            nodes.push(...moduleNodes);
        }

        return nodes;
    }

    private findDynamicImportNodes(file: SourceFile, moduleFilePath: string, symbolName: string): Node[] {
        const nodes: Node[] = [];
        const importCalls = file.getDescendantsOfKind(SyntaxKind.CallExpression)
            .filter(call => {
                const expression = call.getExpression();
                return expression.getKind() === SyntaxKind.ImportKeyword ||
                    (expression.getKind() === SyntaxKind.Identifier && expression.getText() === 'import');
            });

        for (const importCall of importCalls) {
            const moduleNodes = this.handleModuleCall(importCall, moduleFilePath, symbolName, file, 'import');
            nodes.push(...moduleNodes);
        }

        return nodes;
    }

    private handleModuleCall(call: CallExpression, moduleFilePath: string, symbolName: string, file: SourceFile, callType: 'require' | 'import'): Node[] {
        const nodes: Node[] = [];
        const args = call.getArguments();
        if (args.length === 0) return nodes;

        const moduleArg = args[0];
        if (moduleArg.getKind() !== SyntaxKind.StringLiteral) return nodes;

        const requiredPath = moduleArg.getText().slice(1, -1);
        if (this.isRequirePathReferencingModule(requiredPath, moduleFilePath, file.getFilePath())) {
            if (callType === 'import') {
                let parent = call.getParent();
                while (parent && parent.getKind() !== SyntaxKind.VariableDeclaration) {
                    parent = parent.getParent();
                }

                if (parent && parent.getKind() === SyntaxKind.VariableDeclaration) {
                    const nameNode = parent.getChildAtIndex(0);
                    if (nameNode && nameNode.getKind() === SyntaxKind.ObjectBindingPattern) {
                        const destructuringNodes = this.extractDestructuredSymbols(nameNode, symbolName, file);
                        nodes.push(...destructuringNodes);
                    }
                }
            } else {
                const parent = call.getParent();
                if (parent && parent.getKind() === SyntaxKind.VariableDeclaration) {
                    const nameNode = parent.getChildAtIndex(0);
                    if (nameNode && nameNode.getKind() === SyntaxKind.ObjectBindingPattern) {
                        const destructuringNodes = this.extractDestructuredSymbols(nameNode, symbolName, file);
                        nodes.push(...destructuringNodes);
                    }
                }
            }
        }

        return nodes;
    }

    private extractDestructuredSymbols(bindingPattern: Node, symbolName: string, file: SourceFile): Node[] {
        const nodes: Node[] = [];
        const identifiers = bindingPattern.getDescendantsOfKind(SyntaxKind.Identifier);

        for (const identifier of identifiers) {
            if (identifier.getText() === symbolName) {
                nodes.push(identifier);
                const localUsages = this.findLocalVariableUsages(file, identifier);
                nodes.push(...localUsages);
            }
        }

        return nodes;
    }

    private findLocalVariableUsages(sourceFile: SourceFile, variableIdentifier: Node): Node[] {
        const nodes: Node[] = [];
        const variableName = variableIdentifier.getText();
        const allIdentifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);

        for (const identifier of allIdentifiers) {
            if (identifier.getText() === variableName && identifier !== variableIdentifier) {
                const parent = identifier.getParent();
                if (parent && (
                    parent.getKind() === SyntaxKind.CallExpression ||
                    parent.getKind() === SyntaxKind.PropertyAccessExpression ||
                    parent.getKind() === SyntaxKind.BinaryExpression ||
                    parent.getKind() === SyntaxKind.TemplateExpression ||
                    parent.getKind() === SyntaxKind.ParenthesizedExpression
                )) {
                    nodes.push(identifier);
                }
            }
        }

        return nodes;
    }

    private isRequirePathReferencingModule(requirePath: string, targetModulePath: string, requirerPath: string): boolean {
        if (requirePath.startsWith('./') || requirePath.startsWith('../')) {
            const resolvedPath = path.resolve(path.dirname(requirerPath), requirePath);
            return resolvedPath === targetModulePath.replace(/\.ts$/, '') ||
                resolvedPath + '.ts' === targetModulePath;
        }

        return false;
    }
}