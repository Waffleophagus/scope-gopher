import * as vscode from 'vscode';
import type { DeclarationKind } from './declaration';

export const sectionName = 'scopeGopher';

export const allDeclarationKinds: readonly DeclarationKind[] = [
	'function',
	'method',
	'interfaceMethod',
	'struct',
	'interface',
	'type',
	'field',
	'variable',
	'constant',
];

const defaultEnabledDeclarationKinds: readonly DeclarationKind[] = ['function', 'method'];

export interface ScopeGopherConfiguration {
	highlightingEnabled: boolean;
	exportedColor: string;
	unexportedColor: string;
	inlayHintsEnabled: boolean;
	exportedInlayHintLabel: string;
	unexportedInlayHintLabel: string;
	enabledDeclarationKinds: readonly DeclarationKind[];
}

export function readConfiguration(): ScopeGopherConfiguration {
	const config = vscode.workspace.getConfiguration(sectionName);
	return {
		highlightingEnabled: config.get('highlighting.enabled', true),
		exportedColor: config.get('highlighting.exportedColor', '#4EC9B0'),
		unexportedColor: config.get('highlighting.unexportedColor', '#C586C0'),
		inlayHintsEnabled: config.get('inlayHints.enabled', false),
		exportedInlayHintLabel: config.get('inlayHints.exportedLabel', 'exported'),
		unexportedInlayHintLabel: config.get('inlayHints.unexportedLabel', 'unexported'),
		enabledDeclarationKinds: normalizeDeclarationKinds(config.get('enabledDeclarationKinds', [...defaultEnabledDeclarationKinds])),
	};
}

export function normalizeDeclarationKinds(values: readonly unknown[]): readonly DeclarationKind[] {
	const valid = new Set(allDeclarationKinds);
	const normalized: DeclarationKind[] = [];

	for (const value of values) {
		if (typeof value === 'string' && valid.has(value as DeclarationKind) && !normalized.includes(value as DeclarationKind)) {
			normalized.push(value as DeclarationKind);
		}
	}

	return normalized.length > 0 ? normalized : [...defaultEnabledDeclarationKinds];
}

export function affectsScopeGopherConfiguration(event: vscode.ConfigurationChangeEvent): boolean {
	return event.affectsConfiguration(sectionName);
}
