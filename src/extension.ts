import * as vscode from 'vscode';
import { affectsScopeGopherConfiguration, readConfiguration } from './configuration';
import { DeclarationCache } from './declarationCache';
import { DecorationController } from './decorationController';
import { ScopeGopherInlayHintProvider } from './inlayHintProvider';
import { SymbolProvider } from './symbolProvider';

const editDebounceMs = 200;

export function activate(context: vscode.ExtensionContext) {
	let configuration = readConfiguration();
	const symbolProvider = new SymbolProvider();
	const declarationCache = new DeclarationCache(symbolProvider);
	const decorationController = new DecorationController(configuration);
	const inlayHintProvider = new ScopeGopherInlayHintProvider(declarationCache, () => configuration);
	const refreshTimers = new Map<string, NodeJS.Timeout>();

	async function refreshEditor(editor: vscode.TextEditor): Promise<void> {
		if (!isGoDocument(editor.document)) {
			decorationController.clear(editor);
			return;
		}

		const declarations = await declarationCache.getDeclarations(editor.document, configuration);
		decorationController.apply(editor, declarations, configuration);
	}

	function refreshVisibleGoEditors(): void {
		for (const editor of vscode.window.visibleTextEditors) {
			void refreshEditor(editor);
		}
	}

	function debounceDocumentRefresh(document: vscode.TextDocument): void {
		if (!isGoDocument(document)) {
			return;
		}

		const key = document.uri.toString();
		const existingTimer = refreshTimers.get(key);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		const timer = setTimeout(() => {
			refreshTimers.delete(key);
			for (const editor of vscode.window.visibleTextEditors.filter(visibleEditor => visibleEditor.document.uri.toString() === key)) {
				void refreshEditor(editor);
			}
			inlayHintProvider.refresh();
		}, editDebounceMs);
		refreshTimers.set(key, timer);
	}

	context.subscriptions.push(
		decorationController,
		inlayHintProvider,
		vscode.languages.registerInlayHintsProvider({ language: 'go' }, inlayHintProvider),
		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (editor) {
				void refreshEditor(editor);
			}
		}),
		vscode.window.onDidChangeVisibleTextEditors(refreshVisibleGoEditors),
		vscode.workspace.onDidChangeTextDocument(event => debounceDocumentRefresh(event.document)),
		vscode.workspace.onDidChangeConfiguration(event => {
			if (!affectsScopeGopherConfiguration(event)) {
				return;
			}

			configuration = readConfiguration();
			declarationCache.invalidateAll();
			decorationController.recreateDecorationTypes(configuration);
			refreshVisibleGoEditors();
			inlayHintProvider.refresh();
		}),
		new vscode.Disposable(() => {
			for (const timer of refreshTimers.values()) {
				clearTimeout(timer);
			}
			refreshTimers.clear();
		}),
	);

	refreshVisibleGoEditors();
}

export function deactivate() {}

function isGoDocument(document: vscode.TextDocument): boolean {
	return document.languageId === 'go';
}
