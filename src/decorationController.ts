import * as vscode from 'vscode';
import type { ScopeGopherConfiguration } from './configuration';
import type { Declaration } from './declaration';

export class DecorationController implements vscode.Disposable {
	private exportedDecorationType: vscode.TextEditorDecorationType;
	private unexportedDecorationType: vscode.TextEditorDecorationType;

	constructor(configuration: ScopeGopherConfiguration) {
		this.exportedDecorationType = createDecorationType(configuration.exportedColor);
		this.unexportedDecorationType = createDecorationType(configuration.unexportedColor);
	}

	apply(editor: vscode.TextEditor, declarations: readonly Declaration[] | undefined, configuration: ScopeGopherConfiguration): void {
		if (!configuration.highlightingEnabled || !declarations) {
			this.clear(editor);
			return;
		}

		const exportedRanges = declarations.filter(declaration => declaration.exportStatus === 'exported').map(declaration => declaration.range);
		const unexportedRanges = declarations.filter(declaration => declaration.exportStatus === 'unexported').map(declaration => declaration.range);
		editor.setDecorations(this.exportedDecorationType, exportedRanges);
		editor.setDecorations(this.unexportedDecorationType, unexportedRanges);
	}

	clear(editor: vscode.TextEditor): void {
		editor.setDecorations(this.exportedDecorationType, []);
		editor.setDecorations(this.unexportedDecorationType, []);
	}

	recreateDecorationTypes(configuration: ScopeGopherConfiguration): void {
		this.exportedDecorationType.dispose();
		this.unexportedDecorationType.dispose();
		this.exportedDecorationType = createDecorationType(configuration.exportedColor);
		this.unexportedDecorationType = createDecorationType(configuration.unexportedColor);
	}

	dispose(): void {
		this.exportedDecorationType.dispose();
		this.unexportedDecorationType.dispose();
	}
}

function createDecorationType(color: string): vscode.TextEditorDecorationType {
	return vscode.window.createTextEditorDecorationType({ color });
}
