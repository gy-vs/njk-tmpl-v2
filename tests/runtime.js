(function() {
  'use strict';

  var expect, util, finish, render, runtime, lib;

  if (typeof require !== 'undefined') {
    expect = require('expect.js');
    util = require('./util');
    runtime = require('../nunjucks/src/runtime');
    lib = require('../nunjucks/src/lib');
  } else {
    expect = window.expect;
    util = window.util;
    runtime = nunjucks.runtime;
    lib = nunjucks.lib;
  }

  finish = util.finish;
  render = util.render;

  describe('runtime', function() {
    it('should report the failed function calls to symbols', function(done) {
      render('{{ foo("cvan") }}', {}, {
        noThrow: true
      }, function(err) {
        expect(err).to.match(/Unable to call `foo`, which is undefined/);
      });

      finish(done);
    });

    it('should report the failed function calls to lookups', function(done) {
      render('{{ foo["bar"]("cvan") }}', {}, {
        noThrow: true
      }, function(err) {
        expect(err).to.match(/foo\["bar"\]/);
      });

      finish(done);
    });

    it('should report the failed function calls to calls', function(done) {
      render('{{ foo.bar("second call") }}', {}, {
        noThrow: true
      }, function(err) {
        expect(err).to.match(/foo\["bar"\]/);
      });

      finish(done);
    });

    it('should report full function name in error', function(done) {
      render('{{ foo.barThatIsLongerThanTen() }}', {}, {
        noThrow: true
      }, function(err) {
        expect(err).to.match(/foo\["barThatIsLongerThanTen"\]/);
      });

      finish(done);
    });

    it('should report the failed function calls w/multiple args', function(done) {
      render('{{ foo.bar("multiple", "args") }}', {}, {
        noThrow: true
      }, function(err) {
        expect(err).to.match(/foo\["bar"\]/);
      });

      render('{{ foo["bar"]["zip"]("multiple", "args") }}',
        {},
        {
          noThrow: true
        },
        function(err) {
          expect(err).to.match(/foo\["bar"\]\["zip"\]/);
        });

      finish(done);
    });

    it('should allow for undefined macro arguments in the last position', function(done) {
      render('{% macro foo(bar, baz) %}' +
        '{{ bar }} {{ baz }}{% endmacro %}' +
        '{{ foo("hello", nosuchvar) }}',
      {},
      {
        noThrow: true
      },
      function(err, res) {
        expect(err).to.equal(null);
        expect(typeof res).to.be('string');
      });

      finish(done);
    });

    it('should allow for objects without a prototype macro arguments in the last position', function(done) {
      var noProto = Object.create(null);
      noProto.qux = 'world';

      render('{% macro foo(bar, baz) %}' +
      '{{ bar }} {{ baz.qux }}{% endmacro %}' +
      '{{ foo("hello", noProto) }}',
      {
        noProto: noProto
      },
      {
        noThrow: true
      },
      function(err, res) {
        expect(err).to.equal(null);
        expect(res).to.equal('hello world');
      });

      finish(done);
    });

    it('should not read variables property from Object.prototype', function(done) {
      var payload = 'function(){ return 1+2; }()';
      var data = {};
      Object.getPrototypeOf(data).payload = payload;

      render('{{ payload }}', data, {
        noThrow: true
      }, function(err, res) {
        expect(err).to.equal(null);
        expect(res).to.equal(payload);
      });
      delete Object.getPrototypeOf(data).payload;

      finish(done);
    });
  });

  describe('SafeString', function() {
    it('is a string-like object, not a plain object', function() {
      var s = runtime.markSafe('abc');
      expect(s).to.be.a(runtime.SafeString);
      expect(lib.isString(s)).to.be(true);
      expect(lib.isObject(s)).to.be(false);
    });

    it('supports indexed access like a string', function() {
      var s = runtime.markSafe('A-1024');
      expect(s[0]).to.be('A');
      expect(s[5]).to.be('4');
      expect(s[99]).to.be(undefined);
    });

    it('has the correct length', function() {
      expect(runtime.markSafe('A-1024').length).to.be(6);
      expect(runtime.markSafe('').length).to.be(0);
    });

    it('coerces to the underlying string', function() {
      var s = runtime.markSafe('<b>Hi</b>');
      expect(String(s)).to.be('<b>Hi</b>');
      expect('' + s).to.be('<b>Hi</b>');
      expect(s.toString()).to.be('<b>Hi</b>');
      expect(s.valueOf()).to.be('<b>Hi</b>');
    });

    it('supports substring search and string methods', function() {
      var s = runtime.markSafe('A-1024');
      expect(lib.inOperator('1024', s)).to.be(true);
      expect(lib.inOperator('zzz', s)).to.be(false);
      expect(s.indexOf('1024')).to.be(2);
      expect(s.split('').join('')).to.be('A-1024');
    });

    it('can be built without new', function() {
      // eslint-disable-next-line new-cap
      var s = runtime.SafeString('abc');
      expect(s).to.be.a(runtime.SafeString);
      expect(String(s)).to.be('abc');
    });

    it('marks non-string inputs as empty-safe strings', function() {
      expect(String(new runtime.SafeString(undefined))).to.be('');
      expect(String(new runtime.SafeString(null))).to.be('');
      expect(String(new runtime.SafeString(123))).to.be('123');
    });

    it('passes through non-strings in markSafe', function() {
      expect(runtime.markSafe(42)).to.be(42);
      expect(runtime.markSafe(null)).to.be(null);
      expect(Array.isArray(runtime.markSafe([1, 2]))).to.be(true);
    });
  });
}());
