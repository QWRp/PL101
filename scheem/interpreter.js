if (typeof module !== 'undefined') {
    var PEG = require('pegjs');
    var fs = require('fs');
    var parse = PEG.buildParser(fs.readFileSync(
        'scheem.peg', 'utf-8')).parse;
} else {
    var parse = SCHEEM.parse;
}

var scheem = {
    Environment:function (vars, evalFunc) {
        "use strict";

        this.name_lookup = [ (vars || {})];
        this.names_depth = 0;

        this.evalFunc = evalFunc;
    },

    validateParamsNum:{
        exact:function (expr, num) {
            var params = expr.length - 1;
            if (params !== num) {
                throw "Function '" + expr[0] + "' requires " + num + " params, " + params + "was given!";
            }
            return params;
        },
        min:function (expr, min) {
            var params = expr.length - 1;
            if (params < min) {
                throw "Function '" + expr[0] + "' requires at least " + min + " params, " + params + "was given!";
            }
            return params;
        },
        max:function (expr, max) {
            var params = expr.length - 1;
            if (params > max) {
                throw "Function '" + expr[0] + "' at most " + max + " params, " + params + "was given!";
            }
            return params;
        },
        minmax:function (expr, min, max) {
            var params = expr.length - 1;
            if (params < min || params > max) {
                throw "Function '" + expr[0] + "' requires between " + min + " and " + max + " params, " + params + " was given!";
            }
            return params;
        }
    },

    validateParamType:{
        getType:function (param) {
            if (Array.isArray(param)) {
                return 'array';
            } else {
                return typeof param;
            }
        },
        'array':function (param, fn_name) {
            if (!Array.isArray(param)) {
                throw "Function '" + fn_name + "' expects argument to be array, " + this.getType(param) + " was given.";
            }
            return param;
        },
        'string':function (param, fn_name) {
            if (typeof param !== 'string') {
                throw "Function '" + fn_name + "' expects argument to be string, " + this.getType(param) + " was given.";
            }
            return param;
        },
        'number':function (param, fn_name) {
            if (typeof param !== 'number') {
                throw "Function '" + fn_name + "' expects argument to be number, " + this.getType(param) + " was given.";
            }
            return param;
        },
        'boolean':function (param, fn_name) {
            if (typeof param !== 'boolean') {
                throw "Function '" + fn_name + "' expects argument to be boolean, " + this.getType(param) + " was given.";
            }
            return param;
        }
    },

    evalScheem:(function () {
        "use strict";

        function evalExpr(expr, env) {
            if (Array.isArray(expr)) {
                var fun = env.function_lookup[expr[0]];
                if (fun === undefined) {
                    throw "Unknown function '" + expr[0] + "'!";
                }
                if (fun[1] !== undefined) {
                    scheem.validateParamsNum[fun[1][0]](expr, fun[1][1]);
                    /* no minmax support! to lazy... */
                }
                return fun[0](expr, env);
            } else if (typeof expr === 'string') {
                return env.resolveName(expr);
            } else {
                return expr;
            }
        }

        function evalScheem(expr, env) {
            if (!(env instanceof scheem.Environment)) {
                env = new scheem.Environment(env, evalExpr);
            } else {
                env.evalFunc = evalExpr;
            }

            return evalExpr(expr, env);
        }

        return evalScheem;
    }()),

    evalString:function (string) {
        var parsed, result;
        try {
            parsed = parse(string);
        } catch (exc) {
            throw { msg:'' + exc, type:'Parsing error' };
        }

        try {
            result = this.evalScheem(parsed);
        } catch (exc) {
            throw { msg:exc, type:'Evaluation error' };
        }

        return result;
    }
};

scheem.Environment.prototype = {
    isNameDefined:function (name) {
        for (var i = this.names_depth; i >= 0; i--) {
            if (name in this.name_lookup[i]) {
                return true;
            }
        }

        return false;
    },
    resolveName:function (name) {
        for (var i = this.names_depth; i >= 0; i--) {
            if (name in this.name_lookup[i]) {
                return this.name_lookup[i][name];
            }
        }

        throw "Symbol '" + name + "' is not defined!";
    },
    setName:function (name, value) {
        for (var i = this.names_depth; i >= 0; i--) {
            if (name in this.name_lookup[i]) {
                this.name_lookup[i][name] = value;
                return;
            }
        }

        throw "Symbol '" + name + "' is not defined!";
    },
    defineName:function (name, value) {
        if (name in this.name_lookup[this.names_depth]) {
            throw "Symbol '" + name + "' is already defined!";
        }
        this.name_lookup[this.names_depth][name] = value;
    },
    pushNames:function () {
        this.names_depth++;
        this.name_lookup.push({});
    },
    popNames:function () {
        this.names_depth--;
        this.name_lookup.pop();
    },
    function_lookup:{
        /* Arithmetic */
        '+':[function (expr, env) {
            return scheem.validateParamType.number(env.evalFunc(expr[1], env), expr[0]) + scheem.validateParamType.number(env.evalFunc(expr[2], env), expr[0]);
        }, ['exact', 2]],
        '-':[function (expr, env) {
            return scheem.validateParamType.number(env.evalFunc(expr[1], env), expr[0]) - scheem.validateParamType.number(env.evalFunc(expr[2], env), expr[0]);
        }, ['exact', 2]],
        '*':[function (expr, env) {
            return scheem.validateParamType.number(env.evalFunc(expr[1], env), expr[0]) * scheem.validateParamType.number(env.evalFunc(expr[2], env), expr[0]);
        }, ['exact', 2]],
        '/':[function (expr, env) {
            return scheem.validateParamType.number(env.evalFunc(expr[1], env), expr[0]) / scheem.validateParamType.number(env.evalFunc(expr[2], env), expr[0]);
        }, ['exact', 2]],

        /* Predicates */
        '=':[function (expr, env) {
            return scheem.validateParamType.number(env.evalFunc(expr[1], env), expr[0]) === scheem.validateParamType.number(env.evalFunc(expr[2], env), expr[0]);
        }, ['exact', 2]],
        '>':[function (expr, env) {
            return scheem.validateParamType.number(env.evalFunc(expr[1], env), expr[0]) > scheem.validateParamType.number(env.evalFunc(expr[2], env), expr[0]);
        }, ['exact', 2]],
        '<':[function (expr, env) {
            return scheem.validateParamType.number(env.evalFunc(expr[1], env), expr[0]) < scheem.validateParamType.number(env.evalFunc(expr[2], env), expr[0]);
        }, ['exact', 2]],
        '>=':[function (expr, env) {
            return scheem.validateParamType.number(env.evalFunc(expr[1], env), expr[0]) >= scheem.validateParamType.number(env.evalFunc(expr[2], env), expr[0]);
        }, ['exact', 2]],
        '<=':[function (expr, env) {
            return scheem.validateParamType.number(env.evalFunc(expr[1], env), expr[0]) <= scheem.validateParamType.number(env.evalFunc(expr[2], env), expr[0]);
        }, ['exact', 2]],

        /* Lists related */
        'quote':[function (expr, env) {
            return expr[1];
        }, ['exact', 1]],
        'cons':[function (expr, env) {
            var list = scheem.validateParamType.array(env.evalFunc(expr[2], env), expr[0]);
            list.unshift(env.evalFunc(expr[1], env));
            return list;
        }, ['exact', 2]],
        'car':[function (expr, env) {
            var list = scheem.validateParamType.array(env.evalFunc(expr[1], env), expr[0]);
            if (list.length === 0) {
                throw "Can't use 'car' on empty list!";
            }
            return list[0];
        }, ['exact', 1]],
        'cdr':[function (expr, env) {
            var list = scheem.validateParamType.array(env.evalFunc(expr[1], env), expr[0]);
            list.shift();
            return list;
        }, ['exact', 1]],

        /* Variable manipulation */
        'define':[function (expr, env) {
            env.defineName(scheem.validateParamType.string(expr[1], expr[0]), env.evalFunc(expr[2], env));
            return 0;
        }, ['exact', 2]],
        'set!':[function (expr, env) {
            env.setName(scheem.validateParamType.string(expr[1], expr[0]), env.evalFunc(expr[2], env));
            return 0;
        }, ['exact', 2]],

        /* Control flow */
        'if':[function (expr, env) {
            if (scheem.validateParamType['boolean'](env.evalFunc(expr[1], env), expr[0])) {
                return env.evalFunc(expr[2], env);
            } else {
                return env.evalFunc(expr[3], env);
            }
        }, ['exact', 3]],

        /* Code structure */
        'begin':[function (expr, env) {
            env.pushNames();

            var params = expr.length - 1;
            for (var i = 1; i < params; i++) {
                env.evalFunc(expr[i], env);
            }
            var result = env.evalFunc(expr[params], env);

            env.popNames();
            return result;
        }, ['min', 1]]
    }
};

if (typeof module !== 'undefined') {
    exports.scheem = scheem;
}