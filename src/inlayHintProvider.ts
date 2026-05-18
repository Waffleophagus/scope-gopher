import * as vscode from 'vscode';
import type { ScopeGopherConfiguration } from './configuration';
import type { DeclarationCache } from './declarationCache';
import type { Declaration, ExportStatus } from './declaration';

export class ScopeGopherInlayHintProvider implements vscode.InlayHintsProvider {
	private readonly changeEmitter = new vscode.EventEmitter<void>();
	readonly onDidChangeInlayHints = this.changeEmitter.event;

	constructor(
		private readonly declarationCache: DeclarationCache,
		private readonly getConfiguration: () => ScopeGopherConfiguration,
	) {}

	async provideInlayHints(document: vscode.TextDocument): Promise<vscode.InlayHint[]> {
		const configuration = this.getConfiguration();
		if (!configuration.inlayHintsEnabled) {
			return [];
		}

		const declarations = await this.declarationCache.getDeclarations(document, configuration);
		return createInlayHints(declarations ?? [], configuration);
	}

	refresh(): void {
		this.changeEmitter.fire();
	}

	dispose(): void {
		this.changeEmitter.dispose();
	}
}

export function createInlayHints(
	declarations: readonly Declaration[],
	configuration: Pick<ScopeGopherConfiguration, 'exportedInlayHintLabel' | 'unexportedInlayHintLabel'>,
): vscode.InlayHint[] {
	return declarations.map(declaration => {
		const hint = new vscode.InlayHint(
			declaration.range.start,
			labelForExportStatus(declaration.exportStatus, configuration),
			vscode.InlayHintKind.Type,
		);
		hint.paddingRight = true;
		return hint;
	});
}

function labelForExportStatus(
	exportStatus: ExportStatus,
	configuration: Pick<ScopeGopherConfiguration, 'exportedInlayHintLabel' | 'unexportedInlayHintLabel'>,
): string {
	return exportStatus === 'exported' ? configuration.exportedInlayHintLabel : configuration.unexportedInlayHintLabel;
}
