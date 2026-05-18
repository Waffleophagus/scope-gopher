## Problem Statement

Go communicates declaration export status through identifier casing. Developers coming from languages with explicit access modifiers can miss the difference between declarations like `LoginToSystem` and `loginToSystem`, especially when scanning unfamiliar code. Scope Gopher should make exported and unexported declarations visible in the editor without changing source files, without adding visual judgment, and without maintaining its own Go parser.

The current extension is still scaffold-level. The MVP needs to replace the scaffold behavior with a passive Go-focused extension that marks eligible declarations by export status, using the official Go extension and `gopls` document symbols as the source of truth.

## Solution

Scope Gopher will activate for Go documents, depend on the official Go extension, query VS Code document symbols backed by `gopls`, classify eligible declarations as exported or unexported by conventional identifier casing, and mark declaration names in the editor.

Highlighting will be enabled by default and will use two configurable foreground colors of equal visual weight. Inlay hints will be available but disabled by default. When enabled, inlay hints will show plain Go-native labels, `exported` or `unexported`, before the declaration name. Scope Gopher will mark declaration names only, not call sites, references, full declaration signatures, gutters, minimaps, or overview rulers.

Functions and methods are enabled by default. Additional enabled declaration kinds can be configured when the official Go extension exposes them distinctly enough through document symbols. Scope Gopher must not parse Go source text to create finer declaration categories.

## User Stories

1. As a Go newcomer, I want exported and unexported function declarations to look different, so that I can understand Go code more quickly.
2. As a Go newcomer, I want Scope Gopher to use the words exported and unexported, so that I learn Go-native terminology.
3. As a developer coming from C#, I want Go declarations to visually expose export status, so that I get a similar scanning benefit to explicit access modifiers.
4. As a developer reading Go code, I want only declaration names to be marked, so that the extension does not visually dominate the whole file.
5. As a developer reading Go code, I want call sites to remain unmarked, so that normal code flow stays easy to read.
6. As a developer reading package APIs, I want exported functions to have a distinct color, so that I can spot package-facing declarations.
7. As a developer reading package internals, I want unexported functions to have a distinct color, so that I can spot package-internal declarations.
8. As a developer reading methods, I want concrete method declaration names to be marked, so that receiver-based APIs are covered.
9. As a developer reading free functions, I want package-level function declaration names to be marked, so that standalone functions are covered.
10. As a developer reading Go code, I want highlighting enabled by default, so that the main feature works immediately after installation.
11. As a developer who dislikes inlay hints, I want Scope Gopher inlay hints disabled by default, so that the extension starts with a less invasive experience.
12. As a developer who wants modifier-like labels, I want to enable inlay hints, so that I can see `exported` or `unexported` before declaration names.
13. As a developer using inlay hints, I want hints to be virtual editor text, so that source files are never modified.
14. As a developer using inlay hints, I want plain labels without punctuation, so that hints stay visually simple.
15. As a developer using inlay hints, I want hints before the declaration name, so that they behave like lightweight access modifiers.
16. As a developer reading methods with inlay hints enabled, I want the hint before the method name rather than before the receiver, so that export status attaches to the identifier.
17. As a developer reading optional declaration kinds, I want inlay hints to use the same placement rule for every kind, so that behavior is predictable.
18. As a developer configuring the extension, I want exported and unexported colors to be configurable, so that I can fit my theme.
19. As a developer configuring the extension, I want only two colors, so that Scope Gopher communicates export status rather than mixing in declaration kind styling.
20. As a developer configuring the extension, I want highlight colors to have equal visual weight, so that exported and unexported are treated as classification rather than judgment.
21. As a developer configuring the extension, I want to turn highlighting off, so that I can keep only inlay hints if preferred.
22. As a developer configuring the extension, I want to turn Scope Gopher inlay hints on or off independently of global VS Code inlay hints, so that I can control this extension specifically.
23. As a developer configuring the extension, I want inlay hint labels to be configurable, so that I can shorten or customize them while keeping Go-native defaults.
24. As a developer configuring the extension, I want enabled declaration kinds to be configured in one shared setting, so that highlighting and inlay hints agree about eligible declarations.
25. As a developer configuring declaration kinds, I want the default enabled kinds to be function and method, so that the MVP stays focused on function-like declarations.
26. As a developer configuring declaration kinds, I want enum validation for enabled kinds, so that typos in settings are caught.
27. As a developer who wants broader marking, I want to enable additional declaration kinds such as structs, interfaces, fields, variables, constants, and other type declarations when supported, so that Scope Gopher can cover more Go declarations.
28. As a developer reading interface declarations, I want interface methods to be treated separately from concrete methods when the symbol hierarchy supports it, so that enabling methods by default does not unexpectedly color interface member signatures.
29. As a developer reading struct fields, I want fields to be marked only when the field kind is enabled, so that optional visual density is under my control.
30. As a developer reading package variables and constants, I want package-level declarations to be eligible only when their kinds are enabled, so that local names are not misleadingly marked.
31. As a developer reading local variables, I do not want local declarations marked, so that inherently local names are not presented as exported or unexported API surface.
32. As a developer reading generated Go files, I want Scope Gopher to behave the same as in ordinary Go files, so that editor behavior is consistent.
33. As a developer reading test files, I want Scope Gopher to work in Go test files, so that test helpers and exported test declarations are also readable.
34. As a developer reading vendored code or files outside the workspace, I want Scope Gopher to work when document symbols are available, so that the feature is not arbitrarily workspace-limited.
35. As a developer editing an unsaved Go file, I want Scope Gopher to update while I type, so that I do not need to save before seeing markings.
36. As a developer editing quickly, I want refreshes to be debounced, so that the extension does not churn document-symbol requests on every keystroke.
37. As a developer opening a Go file while `gopls` is starting, I want Scope Gopher to quietly show nothing until symbols are available, so that I am not interrupted by transient warnings.
38. As a developer diagnosing extension behavior, I want symbol request failures logged once per document URI in the extension host console, so that silent UI behavior is still debuggable.
39. As a developer using the official Go extension, I want Scope Gopher to build on `gopls` document symbols, so that declaration detection follows official Go tooling.
40. As a contributor, I want Scope Gopher to avoid a custom parser, so that the extension stays small and maintainable.
41. As a contributor, I want classification and symbol-tree mapping isolated in testable modules, so that behavior can be verified without launching VS Code or `gopls`.
42. As a contributor, I want decoration and inlay behavior to share the same declaration source, so that the two features stay consistent.
43. As a contributor, I want a simple per-document/version cache, so that highlighting and inlay hints do not duplicate symbol work.
44. As a contributor, I want configuration changes to invalidate cached declaration data, so that enabled kinds and labels update predictably.
45. As a contributor, I want decoration types recreated when colors change, so that new colors are applied correctly.
46. As a contributor, I want stale decorations cleared when highlighting is disabled or symbols are unavailable, so that users never see outdated markings.
47. As a contributor, I want inlay hint refresh events fired on relevant document and configuration changes, so that hint state updates predictably.
48. As a user reading documentation, I want the README to explain exported and unexported briefly, so that the editor UI can stay minimal.
49. As a user with conventional Go identifiers, I want Scope Gopher to classify names like `LoginToSystem` and `loginToSystem`, so that common Go code works well.
50. As a user with unusual Unicode identifiers, I want the limitation documented, so that I understand full Unicode export-rule correctness is not an MVP goal.

## Implementation Decisions

- Build on the official Go extension and VS Code document symbols backed by `gopls`.
- Add a hard dependency on the official Go extension.
- Activate only for Go language documents.
- Do not build or maintain a custom Go parser.
- Do not inspect Go source text to invent finer declaration categories.
- Use Go-native product language: exported, unexported, declaration, and enabled declaration kind.
- Treat public/private only as explanatory aliases outside the product language.
- Classify export status by the declaration identifier casing rule, targeting conventional ASCII Go identifiers for the MVP.
- Use a simple casing check rather than full Unicode category logic.
- Mark declarations only, not call sites, references, usages, or full declaration signatures.
- Mark only the declaration name range provided by document symbols.
- Skip a declaration if the document symbol does not provide a usable name selection range.
- Determine declaration kind eligibility from the document-symbol tree and symbol kind data.
- Include a declaration kind distinctly when document symbols expose it distinctly enough.
- Map a declaration kind to the nearest logical enabled kind when that mapping is not misleading.
- Skip ambiguous declarations rather than parsing source text or risking false positives.
- Default enabled declaration kinds to function and method.
- Support a shared enabled declaration kinds setting for both highlighting and inlay hints.
- Enum-validate enabled declaration kind values.
- Treat interface methods separately from concrete methods when the document-symbol hierarchy exposes that distinction.
- Exclude local declarations that cannot be exported from their immediate lexical scope.
- Include package-level variables and constants only when their kinds are enabled.
- Include struct fields only when the field kind is enabled and a clean symbol range is available.
- Include embedded fields only when document symbols expose a clean field name and range.
- Handle grouped and multi-name declarations per identifier only when document symbols provide separate symbol ranges.
- Apply Scope Gopher to all Go documents where symbols are available, including test files, generated files, vendored files, dirty files, and files outside the workspace.
- Use VS Code decorations for highlighting rather than semantic tokens.
- Highlight by overriding foreground color for eligible declaration names.
- Use only two highlight colors: exported and unexported.
- Avoid overview ruler, minimap, gutter, border, underline, background, bold, and italic decoration styles for MVP.
- Enable highlighting by default.
- Disable Scope Gopher inlay hints by default.
- Use plain inlay hint labels by default: exported and unexported.
- Allow inlay hint labels to be configured.
- Use VS Code Type inlay hint kind for Scope Gopher hints.
- Place inlay hints before the declaration name for every enabled declaration kind.
- Do not add inlay hint tooltips for MVP.
- Keep educational explanation in README documentation rather than in editor hover UI.
- Refresh visible Go editors immediately when active editor, visible editors, or relevant configuration changes.
- Debounce document-edit refreshes at roughly 200ms.
- Refresh only visible editors for the changed document on document edits.
- Refresh all visible Go editors on relevant configuration changes.
- Use a simple per-document/version cache for classified declarations.
- Share cached declaration results between highlighting and inlay hints.
- Invalidate cached classified declarations on relevant configuration changes.
- Recreate decoration types when highlight colors change.
- Clear stale decorations whenever highlighting is disabled, symbols are unavailable, or eligible ranges change.
- Fire explicit inlay hint refresh events on relevant document and configuration changes.
- If document-symbol requests fail, do not notify the user.
- Log document-symbol request failures once per document URI per activation, including the URI, error, and dependency on official Go extension and `gopls` document symbols.
- Remove scaffold command behavior from the extension manifest and activation flow.
- Keep the extension passive for MVP; no user commands are required.

Major modules to build or modify:

- Configuration module: reads and validates Scope Gopher settings, exposes stable defaults, and centralizes setting keys.
- Declaration model module: defines declaration data returned to the rest of the extension, including name, export status, declaration kind, and range.
- Export-status classifier module: a deep module with a small interface that classifies declaration names as exported or unexported.
- Document-symbol mapping module: a deep module that walks document-symbol trees, filters eligible declarations, handles parent context, and skips ambiguous symbols.
- Symbol provider adapter: wraps VS Code document-symbol command calls, error logging, and unavailable-symbol behavior.
- Declaration cache module: stores classified declarations per document URI and version and invalidates on configuration changes.
- Decoration controller: owns decoration types, applies exported and unexported ranges to visible Go editors, clears stale decorations, and rebuilds decorations on color changes.
- Inlay hint provider: uses classified declarations to produce Type hints before declaration names when Scope Gopher inlay hints are enabled.
- Refresh coordinator: wires editor, document, configuration, debounce, cache invalidation, decoration refresh, and inlay refresh events together.
- Extension activation module: composes the modules, registers providers/listeners, and removes scaffold command behavior.
- Documentation module is already established through the glossary, ADR, README, and changelog and should be kept aligned with implemented settings.

## Testing Decisions

- Good tests should assert externally observable behavior of owned modules, not VS Code implementation details or private helper structure.
- Tests should focus on pure logic because that is the behavior Scope Gopher owns.
- The export-status classifier should be tested for conventional exported and unexported Go declaration names.
- The classifier should document and test the MVP behavior around unusual identifiers only to the extent needed to preserve the stated conventional-ASCII scope.
- The document-symbol mapping module should be tested with constructed symbol trees that represent functions, concrete methods, interface methods, structs, interfaces, type declarations, fields, variables, and constants.
- The document-symbol mapping module should be tested to skip local variables, local constants, local types, parameters, receiver names, labels, short declarations, and ambiguous nested symbols.
- The document-symbol mapping module should be tested to distinguish concrete methods from interface methods when parent hierarchy exposes that distinction.
- The document-symbol mapping module should be tested to include only enabled declaration kinds.
- The document-symbol mapping module should be tested to skip symbols without a usable name selection range.
- The declaration cache should be tested for document URI/version reuse, version invalidation, and configuration invalidation.
- The configuration module should be tested for defaults, label values, colors, highlight enablement, inlay enablement, and enabled declaration kinds.
- The decoration controller should be tested where practical through public behavior or thin integration seams, especially that exported and unexported ranges are separated and stale ranges are cleared.
- The inlay hint provider should be tested with mocked classified declarations to confirm labels, positions, hint kind, enablement behavior, and no tooltip behavior.
- Extension activation should keep a minimal smoke test that confirms the extension can activate.
- Full `gopls` behavior should be manually verified in the Extension Development Host because VS Code extension tests involving the official Go extension can be environment-sensitive.
- Prior art in the repo is currently only the scaffold VS Code extension test, so most meaningful tests should be introduced around new pure modules rather than extending the scaffold sample test.

## Out of Scope

- Marking call sites, references, usages, or every occurrence of an identifier.
- Highlighting full declaration signatures, lines, blocks, or function bodies.
- Semantic token provider implementation.
- Custom Go parsing or source-text inspection for declaration classification.
- Full Unicode category correctness for Go identifier export rules.
- Inlay hint tooltips or educational hover UI.
- User commands such as refresh or diagnostics commands.
- Path-based exclusions for generated files, vendored files, tests, or files outside the workspace.
- Per-kind colors or per-kind inlay labels.
- Font style customization such as bold, italic, underline, borders, or backgrounds.
- Overview ruler, minimap, gutter, or diagnostic-style markers.
- Notifications or status messages when `gopls` is unavailable or still indexing.
- Supporting alternative Go tooling beyond compatible VS Code document symbols from the official Go extension.
- Persisted caches or cross-session state.
- Publishing marketplace assets, screenshots, or release packaging beyond the MVP implementation.

## Further Notes

The product glossary defines Scope Gopher as a VS Code extension that marks Go declarations by export status. The implementation should preserve that language and avoid user-facing terms like public/private, visibility, symbols, tokens, and usages except as explanatory aliases in documentation.

The architectural decision to build on official Go extension document symbols is recorded in the repository ADRs. Future implementation work should respect that decision unless a new ADR supersedes it.

The recommended implementation order is two slices. First, build core declaration classification and highlighting. Second, add inlay hints using the same declaration source and cache.

The current repo has documentation and planning artifacts in place, but the extension implementation is still scaffold-level. The first implementation slice should replace scaffold command behavior with passive Go document behavior.
