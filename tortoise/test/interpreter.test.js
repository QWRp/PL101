/* No node.js support */
var assert = chai.assert;

suite('evalExpression', function () {
    var env = { bindings:
    {x: 5, y: 24, f: function(a) { return 3 * a + 1; } },
        outer: { bindings: {x: 3, z: 101}, outer: { } } };
    test('number', function () {
        var expr = parse('5', 'expression');
        assert.deepEqual(evalExpr(expr, env), 5);
    });
    test('2<3', function () {
        var expr = parse('2 < 3', 'expression');
        assert.deepEqual(evalExpr(expr, env), true);
    });
    test('2>3', function () {
        var expr = parse('2 > 3', 'expression');
        assert.deepEqual(evalExpr(expr, env), false);
    });
    test('2+2', function () {
        var expr = parse('2 + 2', 'expression');
        assert.deepEqual(evalExpr(expr, env), 4);
    });
    test('2+3*4', function () {
        var expr = parse('2 + 3 * 4', 'expression');
        assert.deepEqual(evalExpr(expr, env), 14);
    });
    test('(2+3)*4', function () {
        var expr = parse('(2 + 3) * 4', 'expression');
        assert.deepEqual(evalExpr(expr, env), 20);
    });
    test('inner ident x', function () {
        var expr = parse('x', 'expression');
        assert.deepEqual(evalExpr(expr, env), 5);
    });
    test('outer ident z', function () {
        var expr = parse('z', 'expression');
        assert.deepEqual(evalExpr(expr, env), 101);
    });
    test('x+y', function () {
        var expr = parse('x + y', 'expression');
        assert.deepEqual(evalExpr(expr, env), 29);
    });
    test('f(3)', function () {
        var expr = parse('f(3)', 'expression');
        assert.deepEqual(evalExpr(expr, env), 10);
    });
    test('f(f(3)+1)*2', function () {
        var expr = parse('f(f(3)+1)*2', 'expression');
        assert.deepEqual(evalExpr(expr, env), 68);
    });
});

suite('evalStatement', function () {
    var env = { bindings:
    {x: 5, y: 24, f: function(a) { return 3 * a + 1; }, i : 5 },
        outer: { bindings: {x: 3, z: 101}, outer: null } };
    test('x;', function () {
        var stmt = parse('x;', 'statement');
        assert.deepEqual(evalStatement(stmt, env), 5);
    });
    test('x := 3;', function () {
        var stmt = parse('x := 3;', 'statement');
        assert.deepEqual(evalStatement(stmt, env), 3);
        assert.deepEqual(lookup(env, 'x'), 3);
    });
    test('x := f(3) + 1;', function () {
        var stmt = parse('x := f(3) + 1;', 'statement');
        assert.deepEqual(evalStatement(stmt, env), 11);
        assert.deepEqual(lookup(env, 'x'), 11);
    });
    test('declare var', function () {
        var stmt = parse('var a;', 'statement');
        assert.deepEqual(evalStatement(stmt, env), 0);
        assert.deepEqual(lookup(env, 'a'), 0);
    });
    test('repeat increment', function () {
        evalStatement(parse('x:=10;', 'statement'), env);
        var stmt = parse('repeat(4) { x := x + 1; }', 'statement');
        assert.deepEqual(evalStatement(stmt, env), 14);
        assert.deepEqual(lookup(env, 'x'), 14);
    });
    test('repeat two statements', function () {
        evalStatement(parse('x:=10;', 'statement'), env);
        var stmt = parse('repeat(4) { x := x + 1; y:=x;}', 'statement');
        assert.deepEqual(evalStatement(stmt, env), 14);
        assert.deepEqual(lookup(env, 'y'), 14);
    });
    test('simple if taken', function () {
        var stmt = parse('if(1 < 2) { x := 55; }', 'statement');
        assert.deepEqual(evalStatement(stmt, env), 55);
        assert.deepEqual(lookup(env, 'x'), 55);
    });
    test('simple if not taken', function () {
        var stmt = parse('if(2 < 1) { x := 77; }', 'statement');
        assert.deepEqual(evalStatement(stmt, env), undefined);
        assert.notDeepEqual(lookup(env, 'x'), 77);
    });
    test('simple else', function () {
        var stmt = parse('if(2 < 1) { x := 77; } else { x := 55; }', 'statement');
        assert.deepEqual(evalStatement(stmt, env), 55);
        assert.deepEqual(lookup(env, 'x'), 55);
    });
    test('while', function () {
        var stmt = parse('while (i > 0) { i := i - 1; }', 'statement');
        assert.deepEqual(evalStatement(stmt, env), 0);
        assert.deepEqual(lookup(env, 'i'), 0);
    });
    test('simple define', function () {
        var stmt = parse('define g(a) { x:=a; } g(-3);', 'statements');
        assert.deepEqual(evalStatements(stmt, env), -3);
        assert.deepEqual(lookup(env, 'x'), -3);
    });
    test('factorial', function () {
        var stmt = parse('define fac(n) { if (n > 0) { n * fac(n - 1); } else { 1; } } fac(5);');
        assert.deepEqual(evalStatements(stmt, env), 120);
    });
});

suite('evalStatements', function () {
    var env = { bindings:
    {x: 5, y: 24, f: function(a) { return 3 * a + 1; } },
        outer: { bindings: {x: 3, z: 101}, outer: { } } };
    test('3; f(3);', function () {
        var stmt = parse('3; f(3);', 'statements');
        assert.deepEqual(evalStatements(stmt, env), 10);
    });
    test('simple define sequenced', function () {
        var stmt = parse('define g() {} 100;', 'statements');
        assert.deepEqual(evalStatements(stmt, env), 100);
    });
});