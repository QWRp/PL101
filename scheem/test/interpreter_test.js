if (typeof module !== 'undefined') {
    var chai = require('chai');
    var PEG = require('pegjs');
    var fs = require('fs');
    var scheem = require('./compiler').scheem;
}

var evalString = scheem.evalString;
var evalScheem = scheem.evalScheem;
var Environment = scheem.Environment;

var assert = chai.assert;
var expect = chai.expect;

suite('Interpreter', function () {
    suite('quote', function () {
       test('a number', function () {
           assert.deepEqual(
               evalScheem(['quote', 3], {}),
               3
           );
       });
       test('an atom', function () {
           assert.deepEqual(
               evalScheem(['quote', 'dog'], {}),
               'dog'
           );
       });
       test('a list', function () {
           assert.deepEqual(
               evalScheem(['quote', [1, 2, 3]], {}),
               [1, 2, 3]
           );
       });
       test('too many arguments', function () {
           expect(function () {
               evalScheem(['quote', 1, 2]);
           }).to.throw();
       });
       test('not enough arguments', function () {
           expect(function () {
               evalScheem(['quote']);
           }).to.throw();
       });
    });
    suite('begin', function () {
        test('return single expression', function () {
            assert.deepEqual(
                evalScheem(['begin', 1], {}),
                1
            );
        });
        test('return last expression', function () {
            assert.deepEqual(
                evalScheem(['begin', 1, 2, 3], {}),
                3
            );
        });
        test('not enough arguments', function () {
            expect(function () {
                evalScheem(['begin'], {});
            }).to.throw();
        });
    });
    suite('cons', function () {
        test('add number to empty list', function () {
            assert.deepEqual(
                evalScheem(['cons', 10, ['quote', []]], {}),
                [10]
            );
        });
        test('add number to non-empty list', function () {
            assert.deepEqual(
                evalScheem(['cons', 10, ['quote', [1, 2, 3]]], {}),
                [10, 1, 2, 3]
            );
        });
        test('add empty list to empty list', function () {
            assert.deepEqual(
                evalScheem(['cons', ['quote', []], ['quote', []]]),
                [[]]
            );
        });
        test('add list to list', function () {
            assert.deepEqual(
                evalScheem(['cons', ['quote', [5]], ['quote', [5]]], {}),
                [[5], 5]
            );
        });
        test('add element to non-list', function () {
            expect(function () {
                evalScheem(['cons', 1, 2]);
            }).to.throw();
        });
        test('too many arguments', function () {
            expect(function () {
                evalScheem(['cons', 1, ['quote', 1, 2], 3], {});
            }).to.throw();
        });
        test('not enough arguments', function () {
            expect(function () {
                evalScheem(['cons', 1], {});
            }).to.throw();
        });
    });
    suite('cdr', function () {
        test('takes the remaining numbers in a list', function () {
            assert.deepEqual(
                evalScheem(['cdr', ['quote', [1, 2, 3]]]),
                [2, 3]
            );
        });
        test('takes empty list from single-element list', function () {
            assert.deepEqual(
                evalScheem(['cdr', ['quote', [1]]]),
                []
            );
        });
        test('gives empty list from empty list', function () {
            assert.deepEqual(
                evalScheem(['cdr', ['quote', []]]),
                []
            );
        });
        test('too many arguments', function () {
            expect(function () {
                evalScheem(['cdr', ['quote', [1, 3, 4]], ['quote', []]]);
            }).to.throw();
        });
        test('not enough arguments', function () {
            expect(function () {
                evalScheem(['cdr']);
            }).to.throw();
        });
        test('pass not-list argument', function () {
            expect(function () {
                evalScheem(['cdr', 1]);
            }).to.throw();
        });
    });
    suite('define', function () {
        test('set x as 16', function () {
            var env = new Environment();
            assert.deepEqual(evalScheem(['define', 'x', 16], env), 0);
            assert.deepEqual(env.resolveName('x'), 16);
        });
        test("set x as '(1 2 3)", function () {
            var env = new Environment();
            assert.deepEqual(evalScheem(['define', 'x', ['quote', [1, 2, 3]]], env), 0);
            assert.deepEqual(env.resolveName('x'), [1, 2, 3]);
        });
        test("cannot redefine", function () {
            var env = new Environment({'x' : 5});
            expect(function (){
                evalScheem(['define', 'x', 10], env);
            }).to.throw();
        });
        test("allow redefine at new scope", function () {
            var env = new Environment({'x' : 5});
            assert.deepEqual(evalScheem(['begin', ['define', 'x', 10], 'x'], env), 10);
            assert.deepEqual(evalScheem(['begin', ['begin', ['define', 'x', 10]], 'x'], env), 5);
        });
        test("too many argumets", function () {
            expect(function () {
                evalScheem(['define', 'x', 5, 10]);
            }).to.throw();
        });
        test("not enough arguments", function () {
            expect(function () {
                evalScheem(['define', 'x']);
            }).to.throw();
        });
        test("must be a valid variable name", function () {
            expect(function () {
                evalScheem(['define', true, 5]);
            }).to.throw();
            expect(function () {
                evalScheem(['define', [1, 2, 3], 5]);
            }).to.throw();
            expect(function () {
                evalScheem(['define', 5, 5]);
            }).to.throw();
        });
    });
    suite('complex expressions', function () {
        test("(begin (define x '(6 7 8)) (define y 13) (cons y (cdr (cdr x))))", function () {
            assert.deepEqual(
                evalScheem(["begin",["define","x",["quote",[6,7,8]]],["define","y",13],["cons","y",["cdr",["cdr","x"]]]], {}),
                [13,8]
            );
        });
    });
});
suite('evalString', function () {
    test('with a single number', function () {
        assert.deepEqual(
            evalString("5.5"),
            5.5
        );
    });
});
