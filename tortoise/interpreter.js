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

function expand_bindings(env, bindings, in_func) {
    "use strict";
    return { bindings: bindings, outer: env, in_function: in_func };
}

function evalExpr(expr, env) {
    "use strict";
    if (typeof expr === "number") {
        return expr;
    } else if (typeof expr === "string") {
        return expr;
    }

    var left, right;

    switch (expr.tag) {
    case 'call':
        left = lookup(env, expr.name);

        if (expr.args.length !== (left.tortoise_length || left.length)) {
            throw "Function '" + expr.name + "' expects " + left.length + " arguments, " + expr.args.length + " given.";
        }

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
    case '%':
        return evalExpr(expr.left, env) % evalExpr(expr.right, env);
    /* Logic operators */
    case '&&':
        return evalExpr(expr.left, env) && evalExpr(expr.right, env);
    case '||':
        return evalExpr(expr.left, env) || evalExpr(expr.right, env);
    case '!':
        return !evalExpr(expr.expr, env);
    case '?:':
        left = evalExpr(expr.expr, env);
        if (left) {
            return evalExpr(expr.left, env);
        } else {
            return evalExpr(expr.right, env);
        }
    }

    throw "Bad expression: " + expr;
}

function evalStatements(seq, env) {
    "use strict";

    var i, val, seq_len = seq.length;
    for (i = 0; i < seq_len; i++) {
        val = evalStatement(seq[i], env);
        if (env.stop === true) {
            return val;
        }
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
        times = stmt.vars.length;
        for (i = 0; i < times; i++) {
            val = stmt.vars[i];
            add_binding(env, val.name, evalExpr(val.expr, env));
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
        } else if (stmt.else_body !== undefined) {
            return evalStatements(stmt.else_body, env);
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
    case 'while':
        do {
            times = evalExpr(stmt.expr, env);
            if (typeof times !== 'boolean') {
                throw "Expected boolen in 'while' condition!";
            }

            if (times) {
                val = evalStatements(stmt.body, env);
            }
        } while (times);
        return val;
    case 'define':
        val = function () {
            var new_env, new_bindings = {}, i;
            for (i = 0; i < stmt.args.length; i++) {
                new_bindings[stmt.args[i]] = arguments[i];
            }
            new_env = expand_bindings(env, new_bindings, true);
            return evalStatements(stmt.body, new_env);
        };
        val.tortoise_length = stmt.args.length;
        add_binding(env, stmt.name, val);
        return 0;
    case 'return':
        if (env.in_function === undefined) {
            throw "'return' statement must be called inside function!";
        }

        env.stop = true;

        return evalExpr(stmt.expr, env);
    }

    throw "Unknown statement '" + stmt.tag + "'!";
}