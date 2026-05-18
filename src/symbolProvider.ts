import * as vscode from 'vscode';

export class SymbolProvider {
	private readonly loggedFailures = new Set<string>();

	async getDocumentSymbols(document: vscode.TextDocument): Promise<readonly vscode.DocumentSymbol[] | undefined> {
		try {
			const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
				'vscode.executeDocumentSymbolProvider',
				document.uri,
			);
			return symbols;
		} catch (error) {
			const key = document.uri.toString();
			if (!this.loggedFailures.has(key)) {
				this.loggedFailures.add(key);
				console.error(
					`Scope Gopher could not get document symbols for ${key}. Scope Gopher depends on the official Go extension and gopls document symbols.`,
					error,
				);
			}
			return undefined;
		}
	}
}
