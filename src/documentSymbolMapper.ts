import * as vscode from 'vscode';
import type { Declaration, DeclarationKind } from './declaration';
import { classifyExportStatus } from './exportStatus';

interface ParentContext {
	kind: vscode.SymbolKind;
	declarationKind?: DeclarationKind;
}

export function mapDocumentSymbolsToDeclarations(
	symbols: readonly vscode.DocumentSymbol[],
	enabledDeclarationKinds: readonly DeclarationKind[],
): Declaration[] {
	const enabled = new Set(enabledDeclarationKinds);
	const declarations: Declaration[] = [];

	for (const symbol of symbols) {
		visitSymbol(symbol, undefined, enabled, declarations);
	}

	return declarations;
}

function visitSymbol(
	symbol: vscode.DocumentSymbol,
	parent: ParentContext | undefined,
	enabled: ReadonlySet<DeclarationKind>,
	declarations: Declaration[],
): void {
	const declarationKind = declarationKindForSymbol(symbol, parent);

	if (declarationKind && enabled.has(declarationKind) && isUsableNameSelectionRange(symbol)) {
		const declarationName = declarationNameForSymbol(symbol);
		declarations.push({
			name: declarationName,
			exportStatus: classifyExportStatus(declarationName),
			declarationKind,
			range: symbol.selectionRange,
		});
	}

	const nextParent = declarationKind ? { kind: symbol.kind, declarationKind } : { kind: symbol.kind };
	for (const child of symbol.children) {
		visitSymbol(child, nextParent, enabled, declarations);
	}
}

function declarationKindForSymbol(symbol: vscode.DocumentSymbol, parent: ParentContext | undefined): DeclarationKind | undefined {
	switch (symbol.kind) {
		case vscode.SymbolKind.Function:
			return parent ? undefined : 'function';
		case vscode.SymbolKind.Method:
			return parent?.declarationKind === 'interface' ? 'interfaceMethod' : 'method';
		case vscode.SymbolKind.Struct:
			return parent ? undefined : 'struct';
		case vscode.SymbolKind.Interface:
			return parent ? undefined : 'interface';
		case vscode.SymbolKind.Class:
			return parent ? undefined : 'type';
		case vscode.SymbolKind.Field:
			return parent?.declarationKind === 'struct' ? 'field' : undefined;
		case vscode.SymbolKind.Variable:
			return parent ? undefined : 'variable';
		case vscode.SymbolKind.Constant:
			return parent ? undefined : 'constant';
		default:
			return undefined;
	}
}

function isUsableNameSelectionRange(symbol: vscode.DocumentSymbol): boolean {
	return !symbol.selectionRange.isEmpty && symbol.range.contains(symbol.selectionRange);
}

function declarationNameForSymbol(symbol: vscode.DocumentSymbol): string {
	const lastQualifierIndex = symbol.name.lastIndexOf('.');
	return lastQualifierIndex === -1 ? symbol.name : symbol.name.slice(lastQualifierIndex + 1);
}
