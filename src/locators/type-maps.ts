import {SyntaxKind} from "ts-morph";

export const SYNTAX_KIND_TO_DECLARATION_TYPE = new Map([
    [SyntaxKind.FunctionDeclaration, 'function'],
    [SyntaxKind.ClassDeclaration, 'class'],
    [SyntaxKind.InterfaceDeclaration, 'interface'],
    [SyntaxKind.TypeAliasDeclaration, 'type'],
    [SyntaxKind.EnumDeclaration, 'enum'],
    [SyntaxKind.VariableDeclaration, 'variable'],
    [SyntaxKind.MethodDeclaration, 'method'],
    [SyntaxKind.PropertyDeclaration, 'property'],
    [SyntaxKind.Parameter, 'parameter']
]);