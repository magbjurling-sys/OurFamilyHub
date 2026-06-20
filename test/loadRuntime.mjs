// Loader that extracts the pure, side-effect-free helpers out of the vendored
// `support.js` bundle so they can be unit tested in isolation.
//
// `support.js` is a generated bundle (`// GENERATED from dc-runtime/src/*.ts`)
// wrapped in an IIFE that exposes nothing useful for testing — it only assigns
// a `window.__dc*` API and then boots by loading React over the network. All
// the interesting logic (the expression resolver, the template/prop parsers,
// the encoders) lives as functions inside that closure.
//
// Rather than copy that logic into the test tree (which would immediately drift
// from the shipped bundle), we read the real file, slice out the IIFE body up
// to the two boot statements at the very end (`hideRawTemplate();` and
// `loadReactUmd()...`), and re-export the closure's pure functions. Everything
// before those two statements is plain `function`/`var`/`class` declarations,
// so evaluating it has no side effects and never touches the network.
//
// If the bundle is regenerated and this loader can no longer find its anchors,
// the tests fail loudly here — which is the signal to re-point the loader.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE_PATH = join(__dirname, "..", "support.js");

// Functions captured from the closure and re-exported for testing.
const EXPORTS = [
  "resolve",
  "resolvePath",
  "findTopLevelEquality",
  "parensWrapWhole",
  "parseDataProps",
  "parseDcText",
  "parseDcDocument",
  "dcNameFromPath",
  "safeDecode",
  "cssToObj",
  "kebabToCamel",
  "compileAttr",
  "encodeCase",
  "hintToMin",
  "shallowEqual",
];

function extractRuntime() {
  const source = readFileSync(BUNDLE_PATH, "utf8");

  const openToken = "(() => {";
  const start = source.indexOf(openToken);
  if (start === -1) {
    throw new Error(
      "loadRuntime: could not find IIFE opener '(() => {' in support.js — " +
        "the bundle format changed; update test/loadRuntime.mjs.",
    );
  }

  // The only top-level executable statements in the IIFE are the two boot
  // calls at the end. Slice everything before the first of them so we keep
  // pure declarations only.
  const bootAnchor = "hideRawTemplate();";
  const bootIdx = source.lastIndexOf(bootAnchor);
  if (bootIdx === -1 || bootIdx < start) {
    throw new Error(
      "loadRuntime: could not find boot anchor 'hideRawTemplate();' in " +
        "support.js — the bundle format changed; update test/loadRuntime.mjs.",
    );
  }

  const body = source.slice(start + openToken.length, bootIdx);
  const factory = new Function(
    `"use strict";\n${body}\nreturn { ${EXPORTS.join(", ")} };`,
  );

  const runtime = factory();
  for (const name of EXPORTS) {
    if (typeof runtime[name] !== "function") {
      throw new Error(
        `loadRuntime: expected '${name}' to be a function in support.js, ` +
          `got ${typeof runtime[name]} — the bundle changed.`,
      );
    }
  }
  return runtime;
}

export const runtime = extractRuntime();
