function add_binding(env, name, val) {
    "use strict";
    if (name in env.bindings) {
        throw "Variable '" + name + "' is already defined!";
    }

    env.bindings[name] = val;
}

function update(env, name, val) {
    "use strict";
    var search = env;
    while (search !== null) {
        if (name in search.bindings) {
            search.bindings[name] = val;
            return;
        }

        search = search.outer;
    }

    throw "Variable '" + name + "' is not defined!";
}

function lookup(env, name) {
    "use strict";

    var search = env;
    while (search !== null) {
        if (name in search.bindings) {
            return search.bindings[name];
        }

        search = search.outer;
    }

    throw "Variable '" + name + "' is not defined!";
}

function expand_bindings(env) {
    "use strict";
    return { bindings: {}, outer: env };
}

function evalExpr(expr, env) {
    "use strict";
    if (typeof expr === "number") {
        return expr;
    }

    var left, right;

    switch (expr.tag) {
    case 'call':
        left = lookup(env, expr.name);
        return left.apply(null, expr.args.map(function (arg) {
            return evalExpr(arg, env);
        }));
    case 'ident':
        return lookup(env, expr.name);
    /* Comparison operators */
    case '<':
        return evalExpr(expr.left, env) < evalExpr(expr.right, env);
    case '>':
        return evalExpr(expr.left, env) > evalExpr(expr.right, env);
    case '<=':
        return evalExpr(expr.left, env) <= evalExpr(expr.right, env);
    case '>=':
        return evalExpr(expr.left, env) >= evalExpr(expr.right, env);
    case '==':
        return evalExpr(expr.left, env) === evalExpr(expr.right, env);
    case '!=':
        return evalExpr(expr.left, env) !== evalExpr(expr.right, env);
    /* Arithmetic operators */
    case '+':
        return evalExpr(expr.left, env) + evalExpr(expr.right, env);
    case '-':
        return evalExpr(expr.left, env) - evalExpr(expr.right, env);
    case '*':
        return evalExpr(expr.left, env) * evalExpr(expr.right, env);
    case '/':
        return evalExpr(expr.left, env) / evalExpr(expr.right, env);
    }

    throw "Bad expression: " + expr;
}

function evalStatements(seq, env) {
    "use strict";

    var i, val, seq_len = seq.length;
    for (i = 0; i < seq_len; i++) {
        val = evalStatement(seq[i], env);
    }
    return val;
}

function evalStatement(stmt, env) {
    "use strict";

    var val, times, i;

    switch (stmt.tag) {
    case 'ignore':
        return evalExpr(stmt.body, env);
    case 'var':
        times = stmt.names.length;
        for (i = 0; i < times; i++) {
            add_binding(env, stmt.names[i], 0);
        }
        return 0;
    case ':=':
        val = evalExpr(stmt.right, env);
        update(env, stmt.left, val);
        return val;
    case 'if':
        val = evalExpr(stmt.expr, env);
        if (typeof val !== 'boolean') {
            throw "Expected boolean value in 'if' condition!";
        }

        if (val) {
            return evalStatements(stmt.body, env);
        }
        return undefined;
    case 'repeat':
        times = evalExpr(stmt.expr, env);
        if (typeof times !== 'number') {
            throw "Expected number value in 'repeat'!";
        }

        for (i = 0; i < times; i++) {
            val = evalStatements(stmt.body, env);
        }
        return val;
    case 'define':
        val = eval("function " + stmt.name + "(" + stmt.args.join(",") + ") { var new_env = expand_bindings(env); " + stmt.args.map(function (arg) {
            return "add_binding(new_env, '" + arg + "', " + arg + ");";
        }).join("") + " return evalStatements(stmt.body, new_env);} " + stmt.name + ";");
        add_binding(env, stmt.name, val);
        return 0;
    }

    throw "Unknown statement '" + stmt.tag + "'!";
}