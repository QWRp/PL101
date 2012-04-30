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
                ['+', 'x', '3']
            );
        });
    });
});
