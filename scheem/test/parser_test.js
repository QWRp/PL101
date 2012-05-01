if (typeof module !== 'undefined') {
	var chai = require('chai');
	var PEG = require('pegjs');
	var fs = require('fs');
	var parse = PEG.buildParser(fs.readFileSync(
		'scheem.peg', 'utf-8')).parse;
} else {
	var parse = SCHEEM.parse;
}

var assert = chai.assert;
var expect = chai.expect;

suite('Parser', function () {
	suite('not parsable', function () {
		test("don't parse empty string", function () {
			expect(function () {
				parse("");
			}).to.throw();
		});
		test("don't parse comment only", function () {
			expect(function () {
				parse(";;only comment");
			}).to.throw();
		});
		test("don't parse commented expression only", function () {
			expect(function () {
				parse(";; (+ x 3)");
			}).to.throw();
		});
	});
    suite('simple expressions', function () {
        test('parse atom', function () {
            assert.deepEqual(
                parse("atom"),
                "atom"
            );
        });
        test('parse (+ x 3)', function () {
            assert.deepEqual(
                parse('(+ x 3)'),
                ['+', 'x', 3]
            );
        });
        test("parse quote '(1 2.1 3)", function () {
            assert.deepEqual(
                parse("'(1 2.1 3)"),
                ['quote', [1, 2.1, 3]]
            );
        });
        test('parse empty list', function () {
            assert.deepEqual(
                parse('()'),
                []
            );
        });
        test('parse #t', function () {
            assert.deepEqual(
                parse('#t'),
                true
            );
        });
        test('parse #f', function () {
            assert.deepEqual(
                parse('#f'),
                false
            );
        });
    });
    suite('complex expressions', function () {
        test('expression and comment', function () {
            assert.deepEqual(
                parse(";;Comment\n(1 2 3);;Comment"),
                [1, 2, 3]
            );
        });
        test('complex expression with whitespaces', function () {
            assert.deepEqual(
                parse("(begin \n\t(define s 10)\n\t(if (> s 5) (set! s 5) (set! s 0)))"),
                ['begin', ['define', 's', 10], ['if', ['>', 's', 5], ['set!', 's', 5], ['set!', 's', 0]]]
            );
        });
    });
});
