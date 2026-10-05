'use strict';

// Repro for SafeString behaving unlike a string in templates.
// Run: node repro/904.cjs
const ROOT = require('path').resolve(__dirname, '..');
const nunjucks = require(ROOT + '/nunjucks/index.js');

const env = new nunjucks.Environment(null, { autoescape: true });
const runtime = nunjucks.runtime;

function render(str, ctx) {
  return new nunjucks.Template(str, env).render(ctx);
}

const ctx = {
  code: runtime.markSafe('A-1024'),
  title: runtime.markSafe('<b>Hi</b>'),
  plain: '<b>Hi</b>'
};

const cases = [
  // [template, expected, description]
  ['{{ code[0] }}', 'A', 'SafeString index access'],
  ['{{ title[0] == "<" }}', 'true', 'SafeString char equals primitive char'],
  ['{{ plain[0] == "<" }}', 'true', 'plain string char equals primitive char'],
  ['{{ "Hi" in title }}', 'true', 'substring check on SafeString'],
  ['{{ "Hi" in plain }}', 'true', 'substring check on plain string'],
  ['{% if "1024" in code %}internal{% else %}external{% endif %}',
    'internal', 'branch on substring of SafeString'],
  ['{{ code | first }}', 'A', 'first filter on SafeString'],
  ['{{ code | last }}', '4', 'last filter on SafeString'],
  ['{{ (code | list) | length }}', '6', 'list filter length on SafeString'],
  ['{{ code | list | join }}', 'A-1024', 'list filter chars of SafeString'],
  ['{{ code | reverse }}', '4201-A', 'reverse filter on SafeString'],
  ['{{ title | reverse }}', '>b/<iH>b<', 'reverse filter keeps safe output'],
  ['{{ (code | random) | length }}', '1', 'random char length on SafeString'],
];

let failures = 0;

cases.forEach(([tmpl, expected, desc]) => {
  let actual;
  try {
    actual = render(tmpl, ctx);
  } catch (e) {
    actual = 'THREW: ' + e.message;
  }
  const ok = actual === expected;
  if (!ok) {
    failures++;
  }
  console.log(`${ok ? 'ok' : 'BAD'}  ${desc}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
});

// The last three cases only make sense with the jinja compatibility layer.
nunjucks.installJinjaCompat();

const sliceCases = [
  ['{{ code[2:] }}', '1024', 'SafeString slice keeps safe'],
  ['{{ title[0:3] }}', '<b>', 'SafeString slice output unescaped'],
  ['{{ plain[0:3] }}', '&lt;b&gt;', 'plain string slice gets escaped'],
];

sliceCases.forEach(([tmpl, expected, desc]) => {
  let actual;
  try {
    actual = render(tmpl, ctx);
  } catch (e) {
    actual = 'THREW: ' + e.message;
  }
  const ok = actual === expected;
  if (!ok) {
    failures++;
  }
  console.log(`${ok ? 'ok' : 'BAD'}  ${desc}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
});

process.exit(failures === 0 ? 0 : 1);
