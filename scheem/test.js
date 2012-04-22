var PEG = require('pegjs');
var assert = require('assert');
var fs = require('fs');


fs.readFile('scheem.peg', 'ascii', function(err, data) {
	var total_tests = 0, failed_tests = 0;
	var parse = PEG.buildParser(data).parse;
	
	console.log("Testing started");
	
	/* TESTS START */
	test("", undefined, "don't parse empty string");
	test(";;only comment", undefined, "don't parse comment only");
	test(";; (+ x 3)", undefined, "don't parse commented expressions");
	test("atom", "atom", "parse atom");
	test("(+ x 3)", ["+", "x", "3"]);
	test("(+ x (* 3 y))", ["+", "x", ["*", "3", "y"]]);
	test("    (\n  + \n\t 2   5    \n)  ", ["+", "2", "5"], "parsing whitespace test: '    (\n  + \n\t 2   5    \n)  '");
	test("(* 3 1) ;;(+ 1 2)", ["*", "3", "1"]);
	test("'(1 2 3)", ["quote", ["1", "2", "3"]]);
	test("(* 1 2) (+ 3 4)", [ ["*", "1", "2"], ["+", "3", "4"] ]);
	/* TESTS END */
	
	console.log("Testing finished");
	console.log("Results:", total_tests, "total tests,", failed_tests, "failed", total_tests - failed_tests, "succeded");
	
	/* Testing function */
	function test(code, result, message) {
		total_tests++;
		message = message || "parsing " + code;
		var r;
		try {
			try {
				r = parse(code);
			}
			catch(exc) {
			    r = undefined;
			}
			
		    assert.deepEqual( r, result );
		}
		catch(err)
		{
			failed_tests++;
			console.log("FAILED " + message);
			return;
		}
		
		console.log("OK " + message);
	}
});