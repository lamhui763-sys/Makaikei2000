#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOCS_DIR="$ROOT_DIR/docs/reference"

mkdir -p "$DOCS_DIR/functions" "$DOCS_DIR/types"

# Scan JS/TS for exported symbols
js_out="$DOCS_DIR/functions/js-ts.md"
echo "# JavaScript/TypeScript Public API" > "$js_out"
if command -v rg >/dev/null 2>&1; then
	rg --glob '!node_modules' --type-add 'ts:*.{ts,tsx}' --type-add 'js:*.{js,jsx,mjs,cjs}' -n "^export (?:default )?(?:function|const|class|interface|type)" "$ROOT_DIR" | sed "s|$ROOT_DIR/||" >> "$js_out" || true
else
	echo "ripgrep (rg) not found; skipping JS/TS scan" >> "$js_out"
fi

# Scan Python for def with no leading underscore
py_out="$DOCS_DIR/functions/python.md"
echo "# Python Public API" > "$py_out"
if command -v rg >/dev/null 2>&1; then
	rg -n "^def ([a-zA-Z][a-zA-Z0-9_]+)\(" --glob "**/*.py" "$ROOT_DIR" | sed "s|$ROOT_DIR/||" >> "$py_out" || true
else
	echo "ripgrep (rg) not found; skipping Python scan" >> "$py_out"
fi

# Scan Go for exported functions (capitalized)
go_out="$DOCS_DIR/functions/go.md"
echo "# Go Public API" > "$go_out"
if command -v rg >/dev/null 2>&1; then
	rg -n "^func [A-Z][A-Za-z0-9_]*\(" --glob "**/*.go" "$ROOT_DIR" | sed "s|$ROOT_DIR/||" >> "$go_out" || true
else
	echo "ripgrep (rg) not found; skipping Go scan" >> "$go_out"
fi

# Scan Rust for pub items
rs_out="$DOCS_DIR/functions/rust.md"
echo "# Rust Public API" > "$rs_out"
if command -v rg >/dev/null 2>&1; then
	rg -n "\bpub (?:fn|struct|enum|trait|mod|const|type)\b" --glob "**/*.rs" "$ROOT_DIR" | sed "s|$ROOT_DIR/||" >> "$rs_out" || true
else
	echo "ripgrep (rg) not found; skipping Rust scan" >> "$rs_out"
fi

# Add timestamp
printf "\nGenerated on: %s\n" "$(date -u)" >> "$DOCS_DIR/functions/README.md"

echo "Docs generation completed: $DOCS_DIR"