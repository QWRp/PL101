var PEG = require('pegjs');
var assert = require('assert');
var fs = require('fs');


fs.readFile('scheem.peg', 'ascii', function(err, data) {
	console.log(data);
	
	var parse = PEG.buildParser(data).parse;
	
	function test_parser(code, result, message) {
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
			console.log("FAILED " + message);
			return;
		}
		
		console.log("OK " + message);
	}
	
	test_parser("", undefined, "don't parse empty string");
	test_parser(";;only comment", undefined, "don't parse comment only");
	test_parser(";; (+ x 3)", undefined, "don't parse commented expressions");
	test_parser("atom", "atom", "parse atom");
	test_parser("(+ x 3)", ["+", "x", "3"]);
	test_parser("(+ x (* 3 y))", ["+", "x", ["*", "3", "y"]]);
	test_parser("    (\n  + \n\t 2   5    \n)  ", ["+", "2", "5"], "parsing whitespace test: '    (\n  + \n\t 2   5    \n)  '");
	test_parser("(* 3 1) ;;(+ 1 2)", ["*", "3", "1"]);
	test_parser("'(1 2 3)", ["quote", ["1", "2", "3"]]);
	test_parser("(* 1 2) (+ 3 4)", [ ["*", "1", "2"], ["+", "3", "4"] ]);
});