# Build Scope Gopher On Official Go Extension Symbols

Scope Gopher depends on the official Go VS Code extension (`golang.go`) and uses VS Code document symbols backed by `gopls` as the source of truth for Go declarations. This keeps the extension small and aligned with official Go tooling, and explicitly avoids maintaining a custom Go parser or parsing source text to invent finer declaration categories.
