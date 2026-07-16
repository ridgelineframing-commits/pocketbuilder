/*
 * Unit tests for the PocketBuilder calculator engine (js/engine.js).
 *
 * The engine is a UMD module: it does `module.exports = API` when a `module`
 * object is present, else `global.BT = API`. We load its source and evaluate
 * it with a fake `module` so the tests get the API object directly.
 *
 * Run with:  node --test
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

function loadEngine() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const source = readFileSync(join(root, "js", "engine.js"), "utf8");
  const mod = { exports: {} };
  const factory = new Function(
    "module",
    "globalThis",
    source + "\n;return (module.exports && module.exports.Calc) ? module.exports : globalThis.BT;"
  );
  return factory(mod, {});
}

const BT = loadEngine();

/* Build a value by replaying keypad-style entry, mirroring how the UI drives it. */
function calc(steps) {
  const c = new BT.Calc();
  for (const s of steps) {
    if (/^[0-9]$/.test(s)) c.inputDigit(s);
    else if (s === ".") c.inputDot();
    else if (s === "+") c.operator("+");
    else if (s === "-") c.operator("-");
    else if (s === "*") c.operator("*");
    else if (s === "/") c.operator("/");
    else if (s === "=") c.equals();
    else if (s === "frac") c.inputFrac();
    else c.inputUnit(s); // ft, in, yd, m, cm, mm
  }
  return c;
}

test("exports the expected public API", () => {
  for (const name of ["SCALAR", "LINEAR", "AREA", "VOLUME", "Calc", "combine", "fold", "fmtFtIn"]) {
    assert.ok(name in BT, `missing export: ${name}`);
  }
});

test("formats inches as feet-inch-fraction", () => {
  assert.equal(BT.fmtFtIn(12.5, 16), "1' 1/2\"");
  assert.equal(BT.fmtFtIn(100, 16), "8' 4\"");
  assert.equal(BT.fmtFtIn(0, 16), '0"');
  assert.equal(BT.fmtFtIn(-6, 16), '-6"');
});

test("reduces fractions to lowest terms", () => {
  // 8/16 -> 1/2, 12/16 -> 3/4
  assert.equal(BT.fmtInchesOnly(0.5, 16), '1/2"');
  assert.equal(BT.fmtInchesOnly(0.75, 16), '3/4"');
});

test("adds feet and inches", () => {
  // 12'6" + 3'8" = 16'2"
  const c = calc(["1", "2", "ft", "6", "in", "+", "3", "ft", "8", "in", "="]);
  assert.equal(BT.fmtFtIn(c.result().acc.n, 16), "16' 2\"");
});

test("length x length promotes to area", () => {
  const acc = calc(["3", "ft", "*", "4", "ft", "="]).result().acc;
  assert.equal(acc.dim, BT.AREA);
  assert.equal(Math.round(acc.n / 144), 12); // 12 sq ft
});

test("area x length promotes to volume", () => {
  const acc = calc(["2", "ft", "*", "3", "ft", "*", "4", "ft", "="]).result().acc;
  assert.equal(acc.dim, BT.VOLUME);
  assert.equal(Math.round(acc.n / 1728), 24); // 24 cu ft
});

test("rejects unit-incompatible addition", () => {
  // area + linear is meaningless and must surface an error, not a wrong number
  const res = calc(["2", "ft", "*", "2", "ft", "+", "3", "ft", "="]).result();
  assert.ok(res.error, "expected an error folding area + linear");
});

test("multiplying past volume errors instead of overflowing dimension", () => {
  const r = BT.combine({ n: 1, dim: BT.VOLUME }, "*", { n: 2, dim: BT.LINEAR });
  assert.ok(r.error);
});

test("divide by zero errors", () => {
  const r = BT.combine({ n: 5, dim: BT.SCALAR }, "/", { n: 0, dim: BT.SCALAR });
  assert.ok(r.error);
});

test("board feet from a lumber volume", () => {
  // 2in x 6in x 8ft = 8 board feet (evaluate first, as the UI does)
  const c = calc(["2", "in", "*", "6", "in", "*", "8", "ft", "="]);
  const bf = c.boardFeet();
  assert.ok(!bf.error);
  assert.equal(Math.round(bf.n), 8);
});

test("board feet rejects a non-volume input", () => {
  const c = calc(["8", "ft", "="]); // linear, not a volume
  assert.ok(c.boardFeet().error);
});

test("circle derives circumference and area from a diameter", () => {
  const c = calc(["1", "0", "ft"]); // 10 ft diameter
  const { diam, circ, area } = c.circle();
  assert.equal(diam.dim, BT.LINEAR);
  assert.equal(circ.dim, BT.LINEAR);
  assert.equal(area.dim, BT.AREA);
  assert.ok(Math.abs(circ.n - Math.PI * 120) < 1e-6); // pi * d, in inches
});

test("sqrt of an area returns a length", () => {
  const c = calc(["1", "0", "0", "in", "*", "1", "0", "0", "in", "="]); // 10000 sq in
  const out = c.sqrt();
  assert.equal(out.dim, BT.LINEAR);
  assert.ok(Math.abs(out.n - 100) < 1e-6);
});

test("percent of a running total", () => {
  // 100 + 10% = 110
  const c = new BT.Calc();
  ["1", "0", "0"].forEach((d) => c.inputDigit(d));
  c.operator("+");
  ["1", "0"].forEach((d) => c.inputDigit(d));
  c.percent();
  c.equals();
  assert.equal(c.result().acc.n, 110);
});

test("memory accumulates and recalls", () => {
  // M+/M- operate on the current value; a value is settled with "=" first,
  // which is how the keypad drives it (M+ deliberately keeps the entry open).
  const c = new BT.Calc();
  c.inputDigit("5");
  c.equals();
  c.memPlus();
  c.inputDigit("3");
  c.equals();
  c.memPlus();
  assert.equal(c.memory.n, 8);
  c.inputDigit("2");
  c.equals();
  c.memMinus();
  assert.equal(c.memory.n, 6);
  c.recall();
  assert.equal(c.current().n, 6);
});

test("metric formatting switches mm/m by magnitude", () => {
  assert.ok(BT.fmtMetric({ n: 39.37007874015748, dim: BT.LINEAR }).endsWith("m"));
  assert.ok(BT.fmtMetric({ n: 1, dim: BT.LINEAR }).endsWith("mm")); // < 1 m
});
