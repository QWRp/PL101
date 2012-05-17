/* No node.js support */
var parse = TORTOISE.parse;
var assert = chai.assert;

suite('parse', function() {
    test('numbers', function() {
        assert.deepEqual(parse('42', 'number'), 42);
        assert.deepEqual(parse('-101', 'number'), -101);
        assert.deepEqual(parse('-101.25', 'number'), -101.25);
    });
    test('identifiers', function() {
        assert.deepEqual(parse('x', 'identifier'), 'x');
        assert.deepEqual(parse('forward', 'identifier'), 'forward');
    });
    test('expressions', function() {
        var res =
        {
            "tag": "+",
            "left": {
                "tag": "ident",
                "name": "x"
            },
            "right": {
                "tag": "*",
                "left": 2,
                "right": {
                    "tag": "ident",
                    "name": "y"
                }
            }
        };
        assert.deepEqual(parse('x+2*y', 'expression'), res);
        assert.deepEqual(parse('x + 2*y', 'expression'), res);
        assert.deepEqual(parse('x+ (2 *\ny)', 'expression'), res);
    });
    test('statement', function() {
        var res = { tag:"ignore", body:
        {
            "tag": "+",
            "left": {
                "tag": "ident",
                "name": "x"
            },
            "right": {
                "tag": "*",
                "left": 2,
                "right": {
                    "tag": "ident",
                    "name": "y"
                }
            }
        } };
        assert.deepEqual(parse('x + 2*y;', 'statement'), res);
    });
    test('statements', function() {
        var res = [
            { tag: 'ignore', body: 3 },
            { tag: 'ignore', body: 5 } ];
        assert.deepEqual(parse('3;\n5;', 'statements'), res);
    });
    test('function application', function() {
        var res;
        res = { tag: "call", name: "f", args: [] };
        assert.deepEqual(parse('f()', 'expression'), res);
        res = { tag: "call", name: "f", args: [3] };
        assert.deepEqual(parse('f(3)', 'expression'), res);
        res = { tag: "call", name: "f", args: [3, 5] };
        assert.deepEqual(parse('f(3, 5)', 'expression'), res);
    });
    test('less than', function() {
        var res =
        {
            "tag": "<",
            "left": {
                "tag": "ident",
                "name": "x"
            },
            "right": 20
        };
        assert.deepEqual(parse('x < 20', 'expression'), res);
    });
    test('if', function() {
        var txt = 'if(x<20) {\n  x:=x+3;\n}';
        var res =
            [
                {
                    "tag": "if",
                    "expr": {
                        "tag": "<",
                        "left": {
                            "tag": "ident",
                            "name": "x"
                        },
                        "right": 20
                    },
                    "body": [
                        {
                            "tag": ":=",
                            "left": "x",
                            "right": {
                                "tag": "+",
                                "left": {
                                    "tag": "ident",
                                    "name": "x"
                                },
                                "right": 3
                            }
                        }
                    ]
                }
            ];
        assert.deepEqual(parse(txt), res);
    });
    test('var', function() {
        var res =
            [
                {
                    "tag": "var",
                    "vars": [ {name:"x", expr:0} ]
                },
                {
                    "tag": ":=",
                    "left": "x",
                    "right": 3
                }
            ];
        assert.deepEqual(parse("var x;\nx := 3;\n", 'statements'), res);
    });
    test('define', function() {
        var txt = "define foo(x, y) {\n}";
        var res =
            [
                {
                    "tag": "define",
                    "name": "foo",
                    "args": [
                        "x",
                        "y"
                    ],
                    "body": []
                }
            ];
        assert.deepEqual(parse(txt, 'statements'), res);
    });
    test('repeat', function() {
        var txt = "repeat(4) {}";
        var res =
            [
                {
                    "tag": "repeat",
                    "expr": 4,
                    "body": []
                }
            ];
        assert.deepEqual(parse(txt, 'statements'), res);
    });
    test('while', function () {
        var txt = "while (5) {}";
        var res =
            [
                {
                    tag: "while",
                    expr: 5,
                    body: []
                }
            ];
    });
    test('spiral example', function() {
        var txt = (
            'define spiral(size) {' +
                '    if (size < 30) {' +
                '        fd(size);' +
                '        rt(15);' +
                '        var newsize;' +
                '        newsize := size * 1.02;' +
                '        spiral(newsize);' +
                '    }' +
                '}');
        var res =
        {
            "tag": "define",
            "name": "spiral",
            "args": [
                "size"
            ],
            "body": [
                {
                    "tag": "if",
                    "expr": {
                        "tag": "<",
                        "left": {
                            "tag": "ident",
                            "name": "size"
                        },
                        "right": 30
                    },
                    "body": [
                        {
                            "tag": "ignore",
                            "body": {
                                "tag": "call",
                                "name": "fd",
                                "args": [
                                    {
                                        "tag": "ident",
                                        "name": "size"
                                    }
                                ]
                            }
                        },
                        {
                            "tag": "ignore",
                            "body": {
                                "tag": "call",
                                "name": "rt",
                                "args": [
                                    15
                                ]
                            }
                        },
                        {
                            "tag": "var",
                            "vars": [{name:"newsize", expr:0}]
                        },
                        {
                            "tag": ":=",
                            "left": "newsize",
                            "right": {
                                "tag": "*",
                                "left": {
                                    "tag": "ident",
                                    "name": "size"
                                },
                                "right": 1.02
                            }
                        },
                        {
                            "tag": "ignore",
                            "body": {
                                "tag": "call",
                                "name": "spiral",
                                "args": [
                                    {
                                        "tag": "ident",
                                        "name": "newsize"
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        };
        assert.deepEqual(parse(txt, 'statement'), res);
    });
});