'use strict';

// Repro: SafeString values (markSafe) should behave like plain strings
// for indexing, `in`, filters (first/last/list/reverse/random) and,
// once installJinjaCompat() is active, slicing. Expectations were
// verified against Jinja2 3.1.6 with autoescape enabled.

const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const nunjucks = require(ROOT);

const env = new nunjucks.Environment(null, { autoescape: true });

const ctx = {
  code: nunjucks.runtime.markSafe('A-1024'),
  title: nunjucks.runtime.markSafe('<b>Hi</b>'),
  plain: '<b>Hi</b>'
};

let failures = 0;

function check(name, template, expected) {
  let actual;
  try {
    actual = env.renderString(template, ctx);
  } catch (err) {
    actual = 'ERROR: ' + err.message;
  }
  const ok = actual === expected;
  if (!ok) {
    failures++;
  }
  console.log(`${ok ? 'ok ' : 'BAD'} ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

// Indexing
check('code[0]', '{{ code[0] }}', 'A');
check('plain[0] == "<"', '{% if plain[0] == "<" %}true{% else %}false{% endif %}', 'true');
check('title[0] == "<"', '{% if title[0] == "<" %}true{% else %}false{% endif %}', 'true');

// Substring search with `in`
check('"Hi" in plain', '{% if "Hi" in plain %}true{% else %}false{% endif %}', 'true');
check('"Hi" in title', '{% if "Hi" in title %}true{% else %}false{% endif %}', 'true');
check('"1024" in code', '{% if "1024" in code %}internal{% else %}external{% endif %}', 'internal');

// Filters
check('code|first', '{{ code|first }}', 'A');
check('code|last', '{{ code|last }}', '4');
check('code|list|length', '{{ code|list|length }}', '6');
check('code|list|join', '{{ code|list|join }}', 'A-1024');
check('code|reverse', '{{ code|reverse }}', '4201-A');
check('title|reverse', '{{ title|reverse }}', '>b/<iH>b<');
check('code|random|length', '{{ code|random|length }}', '1');

// Slicing is only available with the jinja compat layer installed
nunjucks.installJinjaCompat();

check('code[2:]', '{{ code[2:] }}', '1024');
check('title[0:3]', '{{ title[0:3] }}', '<b>');
check('plain[0:3]', '{{ plain[0:3] }}', '&lt;b&gt;');

if (failures) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
