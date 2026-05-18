import * as assert from 'assert';
import * as vscode from 'vscode';
import { normalizeDeclarationKinds } from '../configuration';
import { DeclarationCache } from '../declarationCache';
import { mapDocumentSymbolsToDeclarations } from '../documentSymbolMapper';
import { classifyExportStatus } from '../exportStatus';
import { createInlayHints, ScopeGopherInlayHintProvider } from '../inlayHintProvider';

suite('Export Status', () => {
	test('classifies conventional ASCII declaration names', () => {
		assert.strictEqual(classifyExportStatus('LoginToSystem'), 'exported');
		assert.strictEqual(classifyExportStatus('loginToSystem'), 'unexported');
		assert.strictEqual(classifyExportStatus('_helper'), 'unexported');
	});
});

suite('Configuration', () => {
	test('normalizes enabled declaration kinds', () => {
		assert.deepStrictEqual(normalizeDeclarationKinds(['function', 'method', 'function', 'nope']), ['function', 'method']);
	});

	test('falls back to default declaration kinds when no configured values are valid', () => {
		assert.deepStrictEqual(normalizeDeclarationKinds(['nope']), ['function', 'method']);
	});
});

suite('Document Symbol Mapper', () => {
	test('maps package functions and concrete methods when enabled', () => {
		const functionSymbol = symbol('LoginToSystem', vscode.SymbolKind.Function, range(1, 5, 1, 18));
		const methodSymbol = symbol('logout', vscode.SymbolKind.Method, range(3, 20, 3, 26));

		const declarations = mapDocumentSymbolsToDeclarations([functionSymbol, methodSymbol], ['function', 'method']);

		assert.deepStrictEqual(declarations.map(declaration => [declaration.name, declaration.exportStatus, declaration.declarationKind]), [
			['LoginToSystem', 'exported', 'function'],
			['logout', 'unexported', 'method'],
		]);
	});

	test('classifies receiver-qualified method names by declaration identifier', () => {
		const declarations = mapDocumentSymbolsToDeclarations([
			symbol('(*Server).ListenAndServe', vscode.SymbolKind.Method, range(1, 17, 1, 31)),
			symbol('(*Server).listen', vscode.SymbolKind.Method, range(3, 17, 3, 23)),
		], ['method']);

		assert.deepStrictEqual(declarations.map(declaration => [declaration.name, declaration.exportStatus]), [
			['ListenAndServe', 'exported'],
			['listen', 'unexported'],
		]);
	});

	test('does not include disabled declaration kinds', () => {
		const declarations = mapDocumentSymbolsToDeclarations([
			symbol('LoginToSystem', vscode.SymbolKind.Function, range(1, 5, 1, 18)),
			symbol('logout', vscode.SymbolKind.Method, range(3, 20, 3, 26)),
		], ['method']);

		assert.deepStrictEqual(declarations.map(declaration => declaration.name), ['logout']);
	});

	test('distinguishes interface methods from concrete methods', () => {
		const interfaceSymbol = symbol('Authenticator', vscode.SymbolKind.Interface, range(1, 5, 1, 18), [
			symbol('LoginToSystem', vscode.SymbolKind.Method, range(2, 2, 2, 15)),
		]);

		const declarations = mapDocumentSymbolsToDeclarations([interfaceSymbol], ['interfaceMethod']);

		assert.deepStrictEqual(declarations.map(declaration => [declaration.name, declaration.declarationKind]), [
			['LoginToSystem', 'interfaceMethod'],
		]);
	});

	test('skips local declarations and unusable name ranges', () => {
		const localVariable = symbol('helper', vscode.SymbolKind.Variable, range(2, 1, 2, 7));
		const localConstant = symbol('maxRetries', vscode.SymbolKind.Constant, range(3, 1, 3, 11));
		const localType = symbol('requestState', vscode.SymbolKind.Struct, range(4, 6, 4, 18));
		const functionSymbol = symbol('LoginToSystem', vscode.SymbolKind.Function, range(1, 5, 1, 18), [localVariable]);
		functionSymbol.children.push(localConstant, localType);
		const unusableFunction = new vscode.DocumentSymbol(
			'broken',
			'',
			vscode.SymbolKind.Function,
			range(4, 0, 4, 10),
			range(4, 3, 4, 3),
		);

		const declarations = mapDocumentSymbolsToDeclarations([functionSymbol, unusableFunction], ['function', 'variable', 'constant', 'struct']);

		assert.deepStrictEqual(declarations.map(declaration => declaration.name), ['LoginToSystem']);
	});

	test('includes package variables and constants only when enabled', () => {
		const variableSymbol = symbol('defaultTimeout', vscode.SymbolKind.Variable, range(1, 4, 1, 18));
		const constantSymbol = symbol('MaxRetries', vscode.SymbolKind.Constant, range(2, 6, 2, 16));

		assert.deepStrictEqual(
			mapDocumentSymbolsToDeclarations([variableSymbol, constantSymbol], ['variable']).map(declaration => [declaration.name, declaration.declarationKind]),
			[['defaultTimeout', 'variable']],
		);
		assert.deepStrictEqual(
			mapDocumentSymbolsToDeclarations([variableSymbol, constantSymbol], ['constant']).map(declaration => [declaration.name, declaration.declarationKind]),
			[['MaxRetries', 'constant']],
		);
	});

	test('includes struct fields only when field kind is enabled', () => {
		const structSymbol = symbol('Config', vscode.SymbolKind.Struct, range(1, 5, 1, 11), [
			symbol('Host', vscode.SymbolKind.Field, range(2, 1, 2, 5)),
			symbol('port', vscode.SymbolKind.Field, range(3, 1, 3, 5)),
		]);

		assert.deepStrictEqual(
			mapDocumentSymbolsToDeclarations([structSymbol], ['struct']).map(declaration => [declaration.name, declaration.declarationKind]),
			[['Config', 'struct']],
		);
		assert.deepStrictEqual(
			mapDocumentSymbolsToDeclarations([structSymbol], ['field']).map(declaration => [declaration.name, declaration.exportStatus, declaration.declarationKind]),
			[
				['Host', 'exported', 'field'],
				['port', 'unexported', 'field'],
			],
		);
	});
});

suite('Declaration Cache', () => {
	test('reuses declarations for the same document version and invalidates explicitly', async () => {
		let calls = 0;
		const symbols = [symbol('LoginToSystem', vscode.SymbolKind.Function, range(1, 5, 1, 18))];
		const cache = new DeclarationCache({
			async getDocumentSymbols() {
				calls += 1;
				return symbols;
			},
		} as never);
		const document = documentStub('file:///tmp/login.go', 1);
		const configuration = {
			highlightingEnabled: true,
			exportedColor: '#fff',
			unexportedColor: '#000',
			inlayHintsEnabled: false,
			exportedInlayHintLabel: 'exported',
			unexportedInlayHintLabel: 'unexported',
			enabledDeclarationKinds: ['function'] as const,
		};

		assert.strictEqual((await cache.getDeclarations(document, configuration))?.length, 1);
		assert.strictEqual((await cache.getDeclarations(document, configuration))?.length, 1);
		assert.strictEqual(calls, 1);

		cache.invalidateAll();
		assert.strictEqual((await cache.getDeclarations(document, configuration))?.length, 1);
		assert.strictEqual(calls, 2);
	});

	test('requests symbols again when document version changes', async () => {
		let calls = 0;
		const symbols = [symbol('LoginToSystem', vscode.SymbolKind.Function, range(1, 5, 1, 18))];
		const cache = new DeclarationCache({
			async getDocumentSymbols() {
				calls += 1;
				return symbols;
			},
		} as never);
		const configuration = {
			highlightingEnabled: true,
			exportedColor: '#fff',
			unexportedColor: '#000',
			inlayHintsEnabled: false,
			exportedInlayHintLabel: 'exported',
			unexportedInlayHintLabel: 'unexported',
			enabledDeclarationKinds: ['function'] as const,
		};

		await cache.getDeclarations(documentStub('file:///tmp/login.go', 1), configuration);
		await cache.getDeclarations(documentStub('file:///tmp/login.go', 2), configuration);

		assert.strictEqual(calls, 2);
	});
});

suite('Inlay Hint Provider', () => {
	test('creates Type hints before declaration names with configured labels', () => {
		const hints = createInlayHints([
			{
				name: 'LoginToSystem',
				exportStatus: 'exported',
				declarationKind: 'function',
				range: range(1, 5, 1, 18),
			},
			{
				name: 'loginToSystem',
				exportStatus: 'unexported',
				declarationKind: 'function',
				range: range(3, 5, 3, 18),
			},
		], {
			exportedInlayHintLabel: 'exp',
			unexportedInlayHintLabel: 'unexp',
		});

		assert.deepStrictEqual(hints.map(hint => [hint.label, hint.position.line, hint.position.character, hint.kind, hint.paddingRight]), [
			['exp', 1, 5, vscode.InlayHintKind.Type, true],
			['unexp', 3, 5, vscode.InlayHintKind.Type, true],
		]);
		assert.strictEqual(hints[0].tooltip, undefined);
	});

	test('returns no hints when Scope Gopher inlay hints are disabled', async () => {
		const provider = new ScopeGopherInlayHintProvider({
			async getDeclarations() {
				throw new Error('disabled provider should not request declarations');
			},
		} as never, () => ({
			highlightingEnabled: true,
			exportedColor: '#fff',
			unexportedColor: '#000',
			inlayHintsEnabled: false,
			exportedInlayHintLabel: 'exported',
			unexportedInlayHintLabel: 'unexported',
			enabledDeclarationKinds: ['function'],
		}));

		assert.deepStrictEqual(await provider.provideInlayHints(documentStub('file:///tmp/login.go', 1)), []);
		provider.dispose();
	});
});

function symbol(
	name: string,
	kind: vscode.SymbolKind,
	selectionRange: vscode.Range,
	children: vscode.DocumentSymbol[] = [],
): vscode.DocumentSymbol {
	const documentSymbol = new vscode.DocumentSymbol(name, '', kind, range(0, 0, 20, 0), selectionRange);
	documentSymbol.children = children;
	return documentSymbol;
}

function range(startLine: number, startCharacter: number, endLine: number, endCharacter: number): vscode.Range {
	return new vscode.Range(startLine, startCharacter, endLine, endCharacter);
}

function documentStub(uri: string, version: number): vscode.TextDocument {
	return {
		uri: vscode.Uri.parse(uri),
		version,
	} as vscode.TextDocument;
}
