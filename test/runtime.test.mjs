import { describe, it, expect } from "vitest";
import { runtime } from "./loadRuntime.mjs";

const {
  resolve,
  resolvePath,
  findTopLevelEquality,
  parensWrapWhole,
  parseDataProps,
  parseDcText,
  dcNameFromPath,
  safeDecode,
  cssToObj,
  kebabToCamel,
  compileAttr,
  encodeCase,
  hintToMin,
  shallowEqual,
} = runtime;

describe("resolve — expression evaluator", () => {
  it("returns undefined for empty/blank input", () => {
    expect(resolve({}, "")).toBeUndefined();
    expect(resolve({}, "   ")).toBeUndefined();
  });

  it("evaluates numeric literals", () => {
    expect(resolve({}, "42")).toBe(42);
    expect(resolve({}, "-3.5")).toBe(-3.5);
  });

  it("evaluates keyword literals", () => {
    expect(resolve({}, "true")).toBe(true);
    expect(resolve({}, "false")).toBe(false);
    expect(resolve({}, "null")).toBe(null);
    expect(resolve({}, "undefined")).toBeUndefined();
  });

  it("evaluates quoted string literals", () => {
    expect(resolve({}, '"hi"')).toBe("hi");
    expect(resolve({}, "'world'")).toBe("world");
  });

  it("applies logical negation", () => {
    expect(resolve({}, "!true")).toBe(false);
    expect(resolve({ a: 0 }, "!a")).toBe(true);
    expect(resolve({ a: 1 }, "!a")).toBe(false);
  });

  it("unwraps a whole-expression paren group", () => {
    expect(resolve({ a: 5 }, "(a)")).toBe(5);
    expect(resolve({}, "(1 === 1)")).toBe(true);
  });

  it("evaluates strict and loose equality operators", () => {
    expect(resolve({ a: 1, b: 1 }, "a === b")).toBe(true);
    expect(resolve({ a: 1, b: 2 }, "a === b")).toBe(false);
    expect(resolve({ a: 1, b: 2 }, "a !== b")).toBe(true);
    // loose equality: number vs numeric string
    expect(resolve({ a: 1 }, "a == '1'")).toBe(true);
    expect(resolve({ a: 1 }, "a != '1'")).toBe(false);
  });

  it("resolves dotted variable paths", () => {
    expect(resolve({ user: { name: "Mia" } }, "user.name")).toBe("Mia");
  });
});

describe("resolvePath — property access", () => {
  it("reads nested dotted paths", () => {
    expect(resolvePath({ a: { b: { c: 7 } } }, "a.b.c")).toBe(7);
  });

  it("is null-safe through missing intermediates", () => {
    expect(resolvePath({}, "a.b.c")).toBeUndefined();
    expect(resolvePath({ a: null }, "a.b")).toBeUndefined();
  });

  it("resolves computed bracket keys from variables", () => {
    expect(resolvePath({ obj: { x: 5 }, k: "x" }, "obj[k]")).toBe(5);
  });

  it("supports numeric indices via dot and bracket", () => {
    expect(resolvePath({ arr: [10, 20, 30] }, "arr.1")).toBe(20);
    expect(resolvePath({ arr: [10, 20, 30] }, "arr[2]")).toBe(30);
  });

  it("resolves nested bracket expressions", () => {
    expect(
      resolvePath({ a: { y: 9 }, b: { c: "y" }, c: "y" }, "a[b.c]"),
    ).toBe(9);
  });

  it("returns undefined for an unparseable head", () => {
    expect(resolvePath({}, "123abc")).toBeUndefined();
  });
});

describe("findTopLevelEquality", () => {
  it("finds a top-level === operator", () => {
    expect(findTopLevelEquality("a === b")).toEqual({ index: 2, op: "===" });
  });

  it("distinguishes == from === and != from !==", () => {
    expect(findTopLevelEquality("a == b").op).toBe("==");
    expect(findTopLevelEquality("a != b").op).toBe("!=");
    expect(findTopLevelEquality("a !== b").op).toBe("!==");
  });

  it("ignores operators nested inside brackets", () => {
    const eq = findTopLevelEquality("a[x === y] === b");
    expect(eq).not.toBeNull();
    // the match is the second (top-level) ===, not the one inside [ ]
    expect("a[x === y] ".length).toBe(eq.index);
  });

  it("returns null when there is no equality operator", () => {
    expect(findTopLevelEquality("a.b.c")).toBeNull();
  });

  it("ignores a leading operator with an empty left-hand side", () => {
    expect(findTopLevelEquality("=== b")).toBeNull();
  });
});

describe("parensWrapWhole", () => {
  it("is true when one paren group wraps the whole expression", () => {
    expect(parensWrapWhole("(a + b)")).toBe(true);
  });

  it("is false when parens close before the end", () => {
    expect(parensWrapWhole("(a)(b)")).toBe(false);
    expect(parensWrapWhole("(a) + (b)")).toBe(false);
  });
});

describe("parseDataProps", () => {
  it("returns nulls for missing input", () => {
    expect(parseDataProps(null)).toEqual({ props: null, preview: null });
  });

  it("returns nulls for malformed JSON", () => {
    expect(parseDataProps("{not json")).toEqual({ props: null, preview: null });
  });

  it("rejects non-object JSON (arrays, primitives)", () => {
    expect(parseDataProps("[1,2,3]")).toEqual({ props: null, preview: null });
    expect(parseDataProps("42")).toEqual({ props: null, preview: null });
  });

  it("splits real props from the $preview key", () => {
    const out = parseDataProps('{"title":"Hi","$preview":{"title":"Demo"}}');
    expect(out.props).toEqual({ title: "Hi" });
    expect(out.preview).toEqual({ title: "Demo" });
  });

  it("drops all $-prefixed keys from props", () => {
    const out = parseDataProps('{"a":1,"$x":2}');
    expect(out.props).toEqual({ a: 1 });
    expect(out.preview).toBeNull();
  });

  it("returns null props when nothing non-$ remains", () => {
    expect(parseDataProps("{}").props).toBeNull();
  });

  it("ignores a non-object $preview", () => {
    expect(parseDataProps('{"$preview":5}').preview).toBeNull();
  });
});

describe("dcNameFromPath", () => {
  it("strips a .dc.html extension", () => {
    expect(dcNameFromPath("/components/Card.dc.html")).toBe("Card");
  });

  it("strips a plain .html / .htm extension", () => {
    expect(dcNameFromPath("/pages/Guide.html")).toBe("Guide");
    expect(dcNameFromPath("/pages/Guide.htm")).toBe("Guide");
  });

  it("decodes percent-encoded paths", () => {
    expect(dcNameFromPath("/a%2Fb%2FQux.html")).toBe("Qux");
  });

  it("falls back to Root for empty/trailing-slash paths", () => {
    expect(dcNameFromPath("/")).toBe("Root");
    expect(dcNameFromPath("")).toBe("Root");
  });
});

describe("safeDecode", () => {
  it("decodes valid percent-encoding", () => {
    expect(safeDecode("a%2Fb")).toBe("a/b");
  });

  it("returns the input unchanged on a malformed sequence", () => {
    expect(safeDecode("%E0%A4%A")).toBe("%E0%A4%A");
  });
});

describe("cssToObj", () => {
  it("converts kebab declarations to camelCase keys", () => {
    expect(cssToObj("color: red; font-size: 12px")).toEqual({
      color: "red",
      fontSize: "12px",
    });
  });

  it("preserves CSS custom properties verbatim", () => {
    expect(cssToObj("--brand-color: #fff")).toEqual({
      "--brand-color": "#fff",
    });
  });

  it("skips segments without a colon", () => {
    expect(cssToObj("color: red; ; broken")).toEqual({ color: "red" });
  });
});

describe("kebabToCamel", () => {
  it("camelCases hyphenated names", () => {
    expect(kebabToCamel("font-size")).toBe("fontSize");
    expect(kebabToCamel("background-color")).toBe("backgroundColor");
  });

  it("leaves names without hyphens untouched", () => {
    expect(kebabToCamel("color")).toBe("color");
  });
});

describe("compileAttr — {{ }} interpolation", () => {
  it("returns the raw value for static attributes", () => {
    expect(compileAttr("hello")({})).toBe("hello");
  });

  it("resolves a whole-value interpolation to the real type", () => {
    expect(compileAttr("{{count}}")({ count: 5 })).toBe(5);
  });

  it("stringifies and joins mixed text + interpolation", () => {
    expect(compileAttr("x-{{a}}-y")({ a: 5 })).toBe("x-5-y");
  });

  it("substitutes an empty string for a missing interpolation", () => {
    expect(compileAttr("x-{{a}}-y")({})).toBe("x--y");
  });
});

describe("encodeCase — HTML rewriting", () => {
  it("encodes camelCase attribute names", () => {
    expect(encodeCase('<div tabIndex="1"></div>')).toBe(
      '<div sc-camel-tab-index="1"></div>',
    );
  });

  it("renames <helmet> to <sc-helmet>", () => {
    expect(encodeCase("<helmet><title>x</title></helmet>")).toBe(
      "<sc-helmet><title>x</title></sc-helmet>",
    );
  });

  it("wraps raw table tags so the parser keeps them", () => {
    expect(encodeCase("<table><tr><td>x</td></tr></table>")).toBe(
      "<sc-raw-table><sc-raw-tr><sc-raw-td>x</sc-raw-td></sc-raw-tr></sc-raw-table>",
    );
  });

  it("expands self-closing import tags", () => {
    expect(encodeCase('<x-import src="a"/>')).toBe('<x-import src="a"></x-import>');
  });
});

describe("hintToMin", () => {
  it("returns undefined for an empty hint", () => {
    expect(hintToMin("")).toBeUndefined();
    expect(hintToMin(undefined)).toBeUndefined();
  });

  it("parses a width,height pair", () => {
    expect(hintToMin("100px, 60px")).toEqual({
      minWidth: "100px",
      minHeight: "60px",
    });
  });

  it("leaves height undefined when only width is given", () => {
    expect(hintToMin("100px")).toEqual({
      minWidth: "100px",
      minHeight: undefined,
    });
  });
});

describe("shallowEqual — prop comparison", () => {
  it("is false when the second object is missing", () => {
    expect(shallowEqual({ a: 1 }, null)).toBe(false);
  });

  it("is true for matching primitive props", () => {
    expect(shallowEqual({ a: 1, b: "x" }, { a: 1, b: "x" })).toBe(true);
  });

  it("ignores the children key when comparing", () => {
    expect(shallowEqual({ a: 1, children: 1 }, { a: 1, children: 2 })).toBe(true);
  });

  it("is false when a value differs", () => {
    expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("is false when key counts differ", () => {
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });
});

describe("parseDcText — template extraction", () => {
  it("extracts the inner template of an x-dc element", () => {
    const out = parseDcText("<x-dc><p>hi</p></x-dc>");
    expect(out).not.toBeNull();
    expect(out.template).toBe("<p>hi</p>");
  });

  it("handles an x-dc element that carries attributes", () => {
    const out = parseDcText('<x-dc data-foo="1"><span>x</span></x-dc>');
    expect(out.template).toBe("<span>x</span>");
  });

  it("returns null when no x-dc element is present", () => {
    expect(parseDcText("<div>nope</div>")).toBeNull();
  });

  it("parses props from a data-dc-script tag", () => {
    const html =
      '<x-dc><p>hi</p></x-dc>' +
      '<script data-dc-script data-props=\'{"name":"Mia"}\'></script>';
    const out = parseDcText(html);
    expect(out.props).toEqual({ name: "Mia" });
  });
});
