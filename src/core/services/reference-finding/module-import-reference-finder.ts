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
        return this.project.getSourceFiles()
            .flatMap(file => this.findModuleImportsInFile(file, moduleFilePath, symbolName));
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

    private findModuleImportsInFile(file: SourceFile, moduleFilePath: string, symbolName: string): Node[] {
        return this.findModuleCalls(file)
            .filter(call => this.isCallReferencingModule(call, moduleFilePath, file.getFilePath()))
            .flatMap(call => this.extractDestructuredReferences(call, symbolName, file));
    }

    private findModuleCalls(file: SourceFile): CallExpression[] {
        return file.getDescendantsOfKind(SyntaxKind.CallExpression)
            .filter(call => this.isRequireOrImportCall(call));
    }

    private isRequireOrImportCall(call: CallExpression): boolean {
        const expression = call.getExpression();
        return expression.getKind() === SyntaxKind.Identifier && expression.getText() === 'require' ||
               expression.getKind() === SyntaxKind.ImportKeyword ||
               (expression.getKind() === SyntaxKind.Identifier && expression.getText() === 'import');
    }

    private isCallReferencingModule(call: CallExpression, moduleFilePath: string, requirerPath: string): boolean {
        const args = call.getArguments();
        if (args.length === 0) return false;

        const moduleArg = args[0];
        if (moduleArg.getKind() !== SyntaxKind.StringLiteral) return false;

        const requiredPath = moduleArg.getText().slice(1, -1);
        return this.isRequirePathReferencingModule(requiredPath, moduleFilePath, requirerPath);
    }

    private extractDestructuredReferences(call: CallExpression, symbolName: string, file: SourceFile): Node[] {
        const variableDeclaration = this.findVariableDeclaration(call);
        if (!variableDeclaration) return [];

        const nameNode = variableDeclaration.getChildAtIndex(0);
        if (!nameNode || nameNode.getKind() !== SyntaxKind.ObjectBindingPattern) return [];

        return this.extractSymbolReferences(nameNode, symbolName, file);
    }

    private findVariableDeclaration(call: CallExpression): Node | undefined {
        let parent = call.getParent();
        while (parent && parent.getKind() !== SyntaxKind.VariableDeclaration) {
            parent = parent.getParent();
        }
        return parent?.getKind() === SyntaxKind.VariableDeclaration ? parent : undefined;
    }

    private extractSymbolReferences(bindingPattern: Node, symbolName: string, file: SourceFile): Node[] {
        return bindingPattern.getDescendantsOfKind(SyntaxKind.Identifier)
            .filter(identifier => identifier.getText() === symbolName)
            .flatMap(identifier => [identifier, ...this.findLocalVariableUsages(file, identifier)]);
    }

    private findLocalVariableUsages(sourceFile: SourceFile, variableIdentifier: Node): Node[] {
        const variableName = variableIdentifier.getText();
        return sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
            .filter(identifier => 
                identifier.getText() === variableName && 
                identifier !== variableIdentifier &&
                this.isVariableUsage(identifier)
            );
    }

    private isVariableUsage(identifier: Node): boolean {
        const parent = identifier.getParent();
        return Boolean(parent && (
            parent.getKind() === SyntaxKind.CallExpression ||
            parent.getKind() === SyntaxKind.PropertyAccessExpression ||
            parent.getKind() === SyntaxKind.BinaryExpression ||
            parent.getKind() === SyntaxKind.TemplateExpression ||
            parent.getKind() === SyntaxKind.ParenthesizedExpression
        ));
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