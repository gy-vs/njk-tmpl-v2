(function() {
  'use strict';

  var util;
  var equal;
  var finish;
  var runtime;
  var expect;
  var nunjucks;

  if (typeof require !== 'undefined') {
    util = require('./util');
    runtime = require('../nunjucks/src/runtime');
    expect = require('expect.js');
    nunjucks = require('../nunjucks/index.js');
  } else {
    util = window.util;
    runtime = nunjucks.runtime;
    expect = window.expect;
  }

  equal = util.jinjaEqual;
  finish = util.finish;

  describe('jinja-compat', function() {
    var arr = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    it('should support array slices with start and stop', function(done) {
      equal('{% for i in arr[1:4] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'bcd');
      finish(done);
    });
    it('should support array slices using expressions', function(done) {
      equal('{% for i in arr[n:n+3] %}{{ i }}{% endfor %}',
        {
          n: 1,
          arr: arr
        },
        'bcd');
      finish(done);
    });
    it('should support array slices with start', function(done) {
      equal('{% for i in arr[3:] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'defgh');
      finish(done);
    });
    it('should support array slices with negative start', function(done) {
      equal('{% for i in arr[-3:] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'fgh');
      finish(done);
    });
    it('should support array slices with stop', function(done) {
      equal('{% for i in arr[:4] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'abcd');
      finish(done);
    });
    it('should support array slices with negative stop', function(done) {
      equal('{% for i in arr[:-3] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'abcde');
      finish(done);
    });
    it('should support array slices with step', function(done) {
      equal('{% for i in arr[::2] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'aceg');
      finish(done);
    });
    it('should support array slices with negative step', function(done) {
      equal('{% for i in arr[::-1] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'hgfedcba');
      finish(done);
    });
    it('should support array slices with start and negative step', function(done) {
      equal('{% for i in arr[4::-1] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'edcba');
      finish(done);
    });
    it('should support array slices with negative start and negative step', function(done) {
      equal('{% for i in arr[-5::-1] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'dcba');
      finish(done);
    });
    it('should support array slices with stop and negative step', function(done) {
      equal('{% for i in arr[:3:-1] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'hgfe');
      finish(done);
    });
    it('should support array slices with start and step', function(done) {
      equal('{% for i in arr[1::2] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'bdfh');
      finish(done);
    });
    it('should support array slices with start, stop, and step', function(done) {
      equal('{% for i in arr[1:7:2] %}{{ i }}{% endfor %}',
        {
          arr: arr
        },
        'bdf');
      finish(done);
    });

    describe('string slices', function() {
      var uninstall;
      var render = util.render;
      var code;
      var title;
      var plain;

      beforeEach(function() {
        uninstall = util.installCompat();
        code = runtime.markSafe('A-1024');
        title = runtime.markSafe('<b>Hi</b>');
        plain = '<b>Hi</b>';
      });

      afterEach(function() {
        uninstall();
      });

      function renderAuto(str, ctx) {
        var env = new nunjucks.Environment(null, { autoescape: true });
        return new nunjucks.Template(str, env).render(ctx);
      }

      it('returns a string, not an array of chars', function() {
        expect(renderAuto('{{ code[2:] }}', { code: code })).to.be('1024');
      });

      it('keeps the safe marking of safe strings', function() {
        expect(renderAuto('{{ code[2:] }}', { code: code })).to.be('1024');
        expect(renderAuto('{{ title[0:3] }}', { title: title })).to.be('<b>');
        expect(renderAuto('{{ code[::-1] }}', { code: code })).to.be('4201-A');
      });

      it('matches python slicing semantics', function() {
        expect(renderAuto('{{ code[::2] }}', { code: code })).to.be('A12');
        expect(renderAuto('{{ code[:] }}', { code: code })).to.be('A-1024');
        expect(renderAuto('{{ code[2:2] }}', { code: code })).to.be('');
        expect(renderAuto('{{ code[100:200] }}', { code: code })).to.be('');
        expect(renderAuto('{{ code[-4:] }}', { code: code })).to.be('1024');
      });

      it('escapes slices of plain strings on output', function() {
        expect(renderAuto('{{ plain[0:3] }}', { plain: plain }))
          .to.be('&lt;b&gt;');
        expect(renderAuto('{{ plain[::-1] }}', { plain: plain }))
          .to.be('&gt;b/&lt;iH&gt;b&lt;');
      });

      it('produces a value that stays a string when used further', function() {
        expect(renderAuto('{% for c in code[2:] %}{{ c }},{% endfor %}',
          { code: code })).to.be('1,0,2,4,');
      });

      it('outputs raw text when autoescape is off', function() {
        expect(render('{{ plain[0:3] }}', { plain: plain },
          { autoescape: false })).to.be('<b>');
      });
    });
  });
}());
