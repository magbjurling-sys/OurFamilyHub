# Tests

Unit tests for the pure logic in the vendored `support.js` bundle — a generated
build of the `dc-runtime` client-side templating engine.

```sh
npm install
npm test          # one-shot run
npm run test:watch
```

## What is covered

`support.js` carries the header `// GENERATED from dc-runtime/src/*.ts`, so its
TypeScript source lives in another repository. These tests are
**characterization tests against the committed bundle**: they exercise the real
shipped code so we catch regressions whenever the bundle is re-vendored.

The bundle is an IIFE that exposes nothing testable directly (it only assigns a
`window.__dc*` API and then boots by fetching React over the network).
`test/loadRuntime.mjs` reads the file, slices out the IIFE body up to the two
boot statements at the end, and re-exports the closure's **pure** helpers:

- `resolve` / `resolvePath` / `findTopLevelEquality` / `parensWrapWhole` —
  the expression evaluator (equality operators, negation, literals, dotted and
  bracket property access).
- `parseDataProps` / `parseDcText` — prop and template parsing, including
  malformed-JSON and missing-element paths.
- `dcNameFromPath` / `safeDecode` — path → component-name derivation.
- `cssToObj` / `kebabToCamel` / `compileAttr` / `encodeCase` — the
  CSS/attribute/HTML encoders.
- `hintToMin` / `shallowEqual` — placeholder sizing and prop comparison.

## When the bundle changes

If `support.js` is regenerated in a way that renames these helpers or changes
the IIFE shape, the loader throws a descriptive error instead of silently
testing nothing. Update the anchors/export list in `test/loadRuntime.mjs` to
match.

## Not covered yet

The React rendering layer (`createComponentFactory`, `walkFor`/`walkIf`/
`walkComponent`) needs a full DOM + React mount and is a good follow-up, ideally
as Playwright tests once the pure layer is locked in.
