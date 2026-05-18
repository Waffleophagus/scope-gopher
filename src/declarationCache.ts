import * as vscode from 'vscode';
import type { Declaration } from './declaration';
import { mapDocumentSymbolsToDeclarations } from './documentSymbolMapper';
import type { ScopeGopherConfiguration } from './configuration';
import type { SymbolProvider } from './symbolProvider';

interface CacheEntry {
	version: number;
	declarations: readonly Declaration[] | undefined;
}

export class DeclarationCache {
	private readonly entries = new Map<string, CacheEntry>();

	constructor(private readonly symbolProvider: SymbolProvider) {}

	async getDeclarations(document: vscode.TextDocument, configuration: ScopeGopherConfiguration): Promise<readonly Declaration[] | undefined> {
		const key = document.uri.toString();
		const cached = this.entries.get(key);
		if (cached?.version === document.version) {
			return cached.declarations;
		}

		const symbols = await this.symbolProvider.getDocumentSymbols(document);
		const declarations = symbols ? mapDocumentSymbolsToDeclarations(symbols, configuration.enabledDeclarationKinds) : undefined;
		this.entries.set(key, { version: document.version, declarations });
		return declarations;
	}

	invalidateAll(): void {
		this.entries.clear();
	}
}
