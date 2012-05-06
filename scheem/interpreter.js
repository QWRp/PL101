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

        this.names_depth = 1;
        this.names_lookup = [{
            /* Arithmetic */
            '+':function (x, y) {
                return scheem.validateParamType.number(x, '+') + scheem.validateParamType.number(y, '+');
            },
            '-':function (x, y) {
                return scheem.validateParamType.number(x, '-') - scheem.validateParamType.number(y, '-');
            },
            '*':function (x, y) {
                return scheem.validateParamType.number(x, '*') * scheem.validateParamType.number(y, '*');
            },
            '/':function (x, y) {
                return scheem.validateParamType.number(x, '/') / scheem.validateParamType.number(y, '/');
            },

            /* Predicates */
            '=':function (x, y) {
                return scheem.validateParamType.number(x, '=') === scheem.validateParamType.number(y, '=');
            },
            '>':function (x, y) {
                return scheem.validateParamType.number(x, '>') > scheem.validateParamType.number(y, '>');
            },
            '<':function (x, y) {
                return scheem.validateParamType.number(x, '<') < scheem.validateParamType.number(y, '<');
            },
            '>=':function (x, y) {
                return scheem.validateParamType.number(x, '>=') >= scheem.validateParamType.number(y, '>=');
            },
            '<=':function (x, y) {
                return scheem.validateParamType.number(x, '<=') <= scheem.validateParamType.number(y, '<=');
            },

            /* Lists related */
            'cons':function (value, list) {
                scheem.validateParamType.array(list, 'cons').unshift(value);
                return list;
            },
            'car':function (list) {
                scheem.validateParamType.array(list, 'car');
                if (list.length === 0) {
                    throw "Can't use 'car' on empty list!";
                }
                return list[0];
            },
            'cdr':function (list) {
                scheem.validateParamType.array(list, 'cdr').shift();
                return list;
            }
        }, vars || {}];

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
                    var fn = evalExpr(expr[0], env),
                        params_count = fn.length, params;

                    scheem.validateParamsNum.exact(expr, params_count);

                    params = expr.slice(1);
                    for (var i = 0; i < params_count; i++) {
                        params[i] = evalExpr(params[i], env);
                    }

                    return fn.apply(this, params);
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

    /* Very slow... */
    traceScheem:(function () {
        "use strict";

        function traceValueString(value) {
            if (Array.isArray(value)) {
                var string = "(";

                for(var i = 0; i < value.length; i++) {
                    string += traceValueString(value[i]) + " ";
                }

                string = string.substr(0, string.length - 1) + ")";
                return string;
            } else if (typeof value == 'boolean') {
                return (value) ? '#t' : '#f';
            } else if (typeof value === 'function') {
                return '(function)';
            } else {
                return "" + value;
            }
        }

		function traceQuote(expr, env) {
			var parent = env.trace_tree,
                current = { 'expr': expr, 'children': [], 'env': env.dumpNames() },
                ret_result;

            parent.children.push(current);
            env.trace_tree = current;
			
			var env_dump = env.dumpNames();
			
			for(var i = 0; i < expr.length; i++) {
				if (Array.isArray(expr[i])) {
					traceQuote(expr[i], env);
				} else if(typeof expr[i] === 'string') {
					if (env.isNameDefined(expr[i])) {
						current.children.push({ expr: expr[i], value: env.resolveName(expr[i]), env: env_dump, children: [] });
					} else {
						current.children.push({ expr: expr[i], value: null, env: env_dump, children: [] });
					}
				} else {
					current.children.push({ expr: expr[i], value: expr[i], env: env_dump, children: [] });
				}
			}
			
			current.value = expr;
            env.trace_tree = parent;
		}
		
        function traceExpr(expr, env) {
            var parent = env.trace_tree,
                current = { 'expr': expr, 'children': [], 'env': env.dumpNames() },
                ret_result;

            parent.children.push(current);
            env.trace_tree = current;

            if (Array.isArray(expr)) {
                var fun = env.function_lookup[expr[0]];
                if (fun === undefined) {
                    var fn = traceExpr(expr[0], env),
                        params_count = fn.length, params;

                    current.string = "(" + current.children[0].string;
                    current.children.shift();

                    scheem.validateParamsNum.exact(expr, params_count);

                    params = expr.slice(1);
                    for (var i = 0; i < params_count; i++) {
                        params[i] = traceExpr(params[i], env);
                        current.string += " " + current.children[i].string;
                    }

                    current.string += ")";

                    ret_result = fn.apply(this, params);
                } else {
                    if (fun[1] !== undefined) {
                        scheem.validateParamsNum[fun[1][0]](expr, fun[1][1]);
                        /* no minmax support! to lazy... */
                    }
                    ret_result = fun[0](expr, env);

                    if (expr[0] === 'quote') {
                        traceQuote(ret_result, env);
                    } else if(expr[0] === 'define' || expr[0] === 'set!') {
                        var val = env.resolveName(expr[1]);
                        current.children.unshift({ expr: expr[1], value: val, env: env.dumpNames(), children: [], string: expr[1], value_string: traceValueString(val) });
                    }

                    if (expr[0] === 'quote') {
                        current.string = "'" + traceValueString(ret_result);
                    } else {
                        current.string = "(" + expr[0];

                        for (var i = 0; i < current.children.length; i++) {
                            current.string += " " + current.children[i].string;
                        }

                        current.string += ")";
                    }
                }
            } else if (typeof expr === 'string') {
                ret_result = env.resolveName(expr);
                current.string = expr;
            } else {
                ret_result = expr;
                current.string = expr;
            }

            current.value = ret_result;
            current.value_string = traceValueString(ret_result);
            env.trace_tree = parent;

            return ret_result;
        }

        function traceScheem(expr, env) {
            if (!(env instanceof scheem.Environment)) {
                env = new scheem.Environment(env, traceExpr);
            } else {
                env.evalFunc = traceExpr;
            }

            env.trace_tree = { children: [] };

            traceExpr(expr, env);

            return env.trace_tree.children[0];
        }

        return traceScheem;
    }()),

    evalString:function (string, trace) {
        "use strict";

        var parsed, result;
        try {
            parsed = parse(string);
        } catch (exc) {
            throw { msg:'' + exc, type:'Parsing error' };
        }

        try {
            if(trace === true){
                result = this.traceScheem(parsed);
            }
            else {
                result = this.evalScheem(parsed);
            }
        } catch (exc) {
            throw { msg:exc, type:'Evaluation error' };
        }

        return result;
    }
};

scheem.Environment.prototype = {
    isNameDefined:function (name) {
        for (var i = this.names_depth; i >= 0; i--) {
            if (name in this.names_lookup[i]) {
                return true;
            }
        }

        return false;
    },
    resolveName:function (name) {
        for (var i = this.names_depth; i >= 0; i--) {
            if (name in this.names_lookup[i]) {
                return this.names_lookup[i][name];
            }
        }

        throw "Symbol '" + name + "' is not defined!";
    },
    setName:function (name, value) {
        for (var i = this.names_depth; i >= 0; i--) {
            if (name in this.names_lookup[i]) {
                this.names_lookup[i][name] = value;
                return;
            }
        }

        throw "Symbol '" + name + "' is not defined!";
    },
    defineName:function (name, value) {
        if (name in this.names_lookup[this.names_depth]) {
            throw "Symbol '" + name + "' is already defined!";
        }
        this.names_lookup[this.names_depth][name] = value;
    },
    pushNames:function () {
        this.names_depth++;
        this.names_lookup.push({});
    },
    popNames:function () {
        this.names_depth--;
        this.names_lookup.pop();
    },
    dumpNames:function () {
        var names_dump = {};
        for(var i = 1; i <= this.names_depth; i++) {
            for(var name in this.names_lookup[i]) {
                names_dump[name] = this.names_lookup[i][name];
            }
        }
        return names_dump;
    },
    function_lookup:{
        /* Lists related */
        'quote':[function (expr, env) {
            return expr[1];
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