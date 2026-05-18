import * as vscode from 'vscode';

export type ExportStatus = 'exported' | 'unexported';

export type DeclarationKind =
	| 'function'
	| 'method'
	| 'interfaceMethod'
	| 'struct'
	| 'interface'
	| 'type'
	| 'field'
	| 'variable'
	| 'constant';

export interface Declaration {
	name: string;
	exportStatus: ExportStatus;
	declarationKind: DeclarationKind;
	range: vscode.Range;
}
