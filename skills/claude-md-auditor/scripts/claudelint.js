#!/usr/bin/env node
// claudelint — deterministic mechanical checks for an agent context file
// (CLAUDE.md / AGENTS.md / GEMINI.md) and its @import tree. Pure Node, no deps.
//
// Usage:  node claudelint.js <path-to-context-file> [--json]
//         node claudelint.js --selftest
//
// Emits the Validity block of the auditor report: one line per failure,
// "[Error] <desc> — <path>" / "[Warning] <desc> — <path>", or a clean pass.
// Judgment scores (conciseness/specificity/etc.) are NOT done here — the agent
// does those; this only covers the pass/fail claudelint family.

"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");

const SIZE_WARN = 40 * 1024; // 40 KB — Claude Code degraded-perf threshold
const HEADING_WARN = 40; // > 40 headings in the top-level file
const DEPTH_MAX = 5; // @import nesting A→B→C→D→E→F

const homeExpand = (p) =>
  p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p;

// Strip fenced code blocks (``` and ~~~) so we never parse their contents as
// imports/headings/refs. Returns array of {line, inFence} per source line.
function tagFences(text) {
  const out = [];
  let fence = null; // current fence marker or null
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(```+|~~~+)/);
    if (m) {
      const mark = m[1][0];
      if (!fence) fence = mark;
      else if (mark === fence) fence = null;
      out.push({ line, inFence: true }); // the fence line itself counts as fenced
      continue;
    }
    out.push({ line, inFence: fence !== null });
  }
  return out;
}

// Extract @import targets from a file's tagged lines (skip fenced).
// Supports both "@import <path>" and native "@<path>.md".
function parseImports(tagged) {
  const targets = [];
  for (const { line, inFence } of tagged) {
    if (inFence) continue;
    let m = line.match(/^\s*@import\s+(.+?)\s*$/);
    if (m) {
      targets.push(m[1].replace(/^["']|["']$/g, ""));
      continue;
    }
    const re = /(?:^|\s)@([^\s@]+\.(?:md|markdown))\b/g;
    let g;
    while ((g = re.exec(line))) targets.push(g[1]);
  }
  return targets;
}

// Inline-backtick + bash-block file references that look like real paths.
// Conservative: must contain "/" and a file extension, no glob/url/var chars.
function parseFileRefs(tagged) {
  const refs = new Set();
  const skip = (t) =>
    /:\/\//.test(t) || // URL
    /[*?[\]{}$<>]/.test(t) || // glob / template var
    t.startsWith("-") || // flag
    /^\d+(\.\d+)+/.test(t) || // version string
    !t.includes("/") ||
    !/\.[a-z0-9]{1,8}$/i.test(t);
  for (const { line } of tagged) {
    const re = /`([^`]+)`/g; // inline `code` (bash blocks are fenced → excluded)
    let g;
    while ((g = re.exec(line))) {
      const tok = g[1].trim().split(/\s+/)[0];
      if (!skip(tok)) refs.add(tok);
    }
  }
  return [...refs];
}

// Index every file under the root file's tree (bounded) for suffix-matching
// prose refs. Prose pointers have no fixed base ("read rules/x.md" means
// .claude/rules/x.md), so a ref is valid if SOME file path ends with it.
function indexRepoFiles(rootDir) {
  const SKIP = new Set(["node_modules", ".git", "dist", "build", ".next", ".turbo", "coverage"]);
  const out = new Set();
  const stack = [rootDir];
  let budget = 20000;
  while (stack.length && budget > 0) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (budget-- <= 0) break;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!SKIP.has(e.name)) stack.push(full);
      } else {
        out.add(full.replace(/\\/g, "/"));
      }
    }
  }
  return out;
}

function refExists(ref, fileDir, rootDir, repoFiles) {
  const e = (p) => fs.existsSync(path.resolve(p, homeExpand(ref)));
  if (e(fileDir) || e(rootDir) || e(process.cwd())) return true;
  const tail = "/" + ref.replace(/\\/g, "/").replace(/^\.?\//, "");
  for (const f of repoFiles) if (f.endsWith(tail)) return true;
  return false;
}

function parseNpmScripts(text) {
  const re = /\bnpm run ([a-zA-Z0-9:_-]+)/g;
  const out = new Set();
  let g;
  while ((g = re.exec(text))) out.add(g[1]);
  return [...out];
}

function nearestPackageJson(startDir) {
  let dir = startDir;
  for (let i = 0; i < 12; i++) {
    const p = path.join(dir, "package.json");
    if (fs.existsSync(p)) return p;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

// Frontmatter `paths:` validation for .claude/rules/* sub-files.
function checkFrontmatterPaths(filePath, text, warn) {
  if (!/[\\/]rules[\\/]/.test(filePath.replace(/\\/g, "/"))) return;
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return;
  const body = fm[1];
  const idx = body.search(/^\s*paths\s*:/m);
  if (idx === -1) return; // absent paths is fine (optional)
  const after = body.slice(idx).replace(/^\s*paths\s*:/, "").trim();
  let items = [];
  if (after.startsWith("[")) {
    const inner = after.slice(1, after.indexOf("]")).trim();
    items = inner === "" ? [] : inner.split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
  } else if (after === "" || after.startsWith("-")) {
    const lines = body.slice(idx).split(/\r?\n/).slice(1);
    for (const l of lines) {
      const m = l.match(/^\s*-\s*(.+?)\s*$/);
      if (m) items.push(m[1].replace(/^["']|["']$/g, ""));
      else if (l.trim() && !/^\s/.test(l)) break;
    }
  } else {
    warn(`Malformed paths (bare string, must be a YAML array)`, filePath);
    return;
  }
  if (items.length === 0) {
    warn(`Malformed paths (empty array)`, filePath);
    return;
  }
  for (const it of items) {
    if (it.includes("\\")) warn(`Backslash glob (use "/" not "\\"): ${it}`, filePath);
    if (it === "**" || it === "*" || it === "**/*")
      warn(`Glob too broad (${it}) — narrow it or move to root CLAUDE.md`, filePath);
  }
}

function lint(rootPath) {
  const errors = [];
  const warnings = [];
  const err = (d, p) => errors.push({ d, p });
  const warn = (d, p) => warnings.push({ d, p });

  rootPath = path.resolve(homeExpand(rootPath));
  if (!fs.existsSync(rootPath)) {
    err("File missing — context file does not exist", rootPath);
    return { errors, warnings };
  }

  // Size + heading thresholds (top-level file only)
  const rootText = fs.readFileSync(rootPath, "utf8");
  const bytes = Buffer.byteLength(rootText, "utf8");
  if (bytes >= SIZE_WARN)
    warn(
      `File too big (${(bytes / 1024).toFixed(1)} KB ≥ 40 KB) — split into .claude/rules/*.md via @import`,
      rootPath
    );
  const rootTagged = tagFences(rootText);
  const headings = rootTagged.filter((t) => !t.inFence && /^#{1,6}\s/.test(t.line)).length;
  if (headings > HEADING_WARN)
    warn(`Too many sections (${headings} > 40 headings) — split via @import`, rootPath);

  // Walk @import tree: missing / unreadable / circular / depth / case clash.
  const caseMap = new Map(); // dir -> Map(lowerBase -> actual)
  const seen = new Set();
  const rootDir = path.dirname(rootPath);
  const repoFiles = indexRepoFiles(rootDir);

  function walk(filePath, text, stack) {
    const dir = path.dirname(filePath);
    const tagged = tagFences(text);

    // file-ref + npm-script checks on this file. Prose refs → Warning (verify),
    // not Error: a stale doc pointer doesn't break file loading.
    for (const ref of parseFileRefs(tagged))
      if (!refExists(ref, dir, rootDir, repoFiles))
        warn(`Invalid file reference (verify): ${ref}`, filePath);
    const scripts = parseNpmScripts(text);
    if (scripts.length) {
      const pkgPath = nearestPackageJson(dir);
      if (pkgPath) {
        let pkg = {};
        try {
          pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        } catch {
          /* unparseable package.json — skip, not our check */
        }
        const have = new Set(Object.keys(pkg.scripts || {}));
        for (const s of scripts)
          if (!have.has(s)) err(`npm script not found: "${s}" (not in ${path.basename(pkgPath)})`, filePath);
      }
    }
    checkFrontmatterPaths(filePath, text, warn);

    if (stack.length - 1 > DEPTH_MAX) {
      err(`Import depth exceeded (> ${DEPTH_MAX} levels)`, filePath);
      return;
    }

    for (const raw of parseImports(tagged)) {
      const target = path.resolve(dir, homeExpand(raw));

      // case clash within the same directory
      const tdir = path.dirname(target);
      const base = path.basename(target);
      if (!caseMap.has(tdir)) caseMap.set(tdir, new Map());
      const dm = caseMap.get(tdir);
      const lower = base.toLowerCase();
      if (dm.has(lower) && dm.get(lower) !== base)
        warn(`Filename case clash: "${base}" vs "${dm.get(lower)}"`, target);
      else dm.set(lower, base);

      if (stack.includes(target)) {
        err(`Circular import (${raw})`, filePath);
        continue;
      }
      let st;
      try {
        st = fs.statSync(target);
      } catch {
        err(`Import missing (${raw})`, filePath);
        continue;
      }
      if (st.isDirectory()) {
        err(`Import unreadable — target is a directory (${raw})`, filePath);
        continue;
      }
      let childText;
      try {
        childText = fs.readFileSync(target, "utf8");
      } catch {
        err(`Import unreadable (${raw})`, filePath);
        continue;
      }
      if (seen.has(target)) continue; // already validated this node
      seen.add(target);
      walk(target, childText, [...stack, target]);
    }
  }

  seen.add(rootPath);
  walk(rootPath, rootText, [rootPath]);
  return { errors, warnings };
}

function report({ errors, warnings }) {
  const lines = [];
  for (const e of errors) lines.push(`[Error]   ${e.d} — ${e.p}`);
  for (const w of warnings) lines.push(`[Warning] ${w.d} — ${w.p}`);
  if (!lines.length) return "All mechanical checks pass.";
  return lines.join("\n");
}

function selftest() {
  const assert = require("assert");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "claudelint-"));
  const w = (n, c) => {
    const p = path.join(tmp, n);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, c);
    return p;
  };
  // missing import
  const root = w("CLAUDE.md", "# x\n@import ./gone.md\n");
  let r = lint(root);
  assert(r.errors.some((e) => /Import missing/.test(e.d)), "should flag missing import");
  // circular
  w("a.md", "@import ./b.md\n");
  w("b.md", "@import ./a.md\n");
  r = lint(w("c.md", "@import ./a.md\n"));
  assert(r.errors.some((e) => /Circular/.test(e.d)), "should flag circular import");
  // size warning
  r = lint(w("big.md", "#h\n" + "x".repeat(41 * 1024)));
  assert(r.warnings.some((e) => /File too big/.test(e.d)), "should warn on size");
  // fenced @import is ignored
  r = lint(w("fenced.md", "# x\n```\n@import ./gone.md\n```\n"));
  assert(!r.errors.length, "fenced @import must be ignored");
  // clean file passes
  assert.strictEqual(report(lint(w("ok.md", "# fine\nplain text\n"))), "All mechanical checks pass.");
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("selftest OK");
}

function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--selftest") return selftest();
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("usage: node claudelint.js <context-file> [--json] | --selftest");
    process.exit(2);
  }
  const res = lint(file);
  if (args.includes("--json")) console.log(JSON.stringify(res, null, 2));
  else console.log(report(res));
  // exit 1 if any Error (Warnings don't fail) — handy for CI
  process.exit(res.errors.length ? 1 : 0);
}

main();
