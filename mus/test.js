var PEG = require('pegjs');
var assert = require('assert');
var fs = require('fs');
var compiler = require('./compiler');


fs.readFile('mus.peg', 'ascii', function(err, data) {
    var total_tests = 0, failed_tests = 0;
	var parse = PEG.buildParser(data).parse;
	
	console.log("Testing started");
	
	/* TESTS START */
	test("(d100 c4)", [ n('c4', 0, 100) ]);
	test("(d600 (d1 300))", [ n('d1', 0, 300) ]);
	test("(d30 (a7 (* 10)))", [ n('a7', 0, 300) ]);
	test("(d100 (s c1 (r (/ 2)) g3 (a3 50)))", [ n('c1', 0, 100), n('g3', 150, 100), n('a3', 250, 50) ]);
	test("(d250 (p c1 c2 (c3 (800 /))))", [ n('c1', 0, 250), n('c2', 0, 250), n('c3', 0, 3.2) ] );
	test("(d100 (s c1 (d250 (s f1 (d350 a1)))))", [ n('c1', 0, 100), n('f1', 100, 250), n('a1', 350, 350) ]);
	test("(d150 (d50 c1) c2)", [ n('c1', 0, 50), n('c2', 50, 150) ]);
	test("(d150 (d (* 2) a1) a2)", [ n('a1', 0, 300), n('a2', 300, 150) ]);
	/* TESTS END */
	
	console.log("Testing finished");
	console.log("Results:", total_tests, "total tests,", failed_tests, "failed", total_tests - failed_tests, "succeded");
	
	/* Testing function */
	function test(code, expected_result, message) {
	    total_tests++;
		message = message || "parsing " + code;
		var mus_expr, result;
		try {
			try {
				mus_expr = parse(code);
			}
			catch(exc) {
			    mus_expr = undefined;
			}
			
		    if (mus_expr === undefined) {
				result = undefined;
			} else {
				try {
					result = compiler.compile(mus_expr);
				}
				catch (exc) {
					result = undefined;
				}
			}
			
			assert.deepEqual( result, expected_result );
		}
		catch(err)
		{
			failed_tests++;
			console.log("FAILED " + message + ", returned result: ", result);
			return;
		}
		
		console.log("OK " + message);
	}
});

/* Helper dunction for quicker note construction */
function Note(pitch, start, duration) {
	this.tag = 'note';
	this.pitch = compiler.convertPitch(pitch);
	this.start = start;
	this.dur = duration;
}

function n(pitch, start, duration) {
	return new Note(pitch, start, duration);
}
