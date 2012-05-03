if (typeof module !== 'undefined') {
    var PEG = require('pegjs');
    var fs = require('fs');
    var parse = PEG.buildParser(fs.readFileSync(
        'scheem.peg', 'utf-8')).parse;
} else {
    var parse = SCHEEM.parse;
}

var scheem = {
    Environment : function (vars) {
        "use strict";

        this.name_lookup = [ (vars || {})];
        this.names_depth = 0;

        this.isNameDefined = function (name) {
            for (var i = this.names_depth; i >= 0; i--) {
                if ( name in this.name_lookup[i] ) {
                    return true;
                }
            }

            return false;
        };

        this.resolveName = function (name) {
            for (var i = this.names_depth; i >= 0; i--) {
                if ( name in this.name_lookup[i] ) {
                    return this.name_lookup[i][name];
                }
            }

            throw "Symbol '" + name + "' is not defined!";
        };

        this.defineName = function (name, value) {
            if (name in this.name_lookup[this.names_depth]) {
                throw "Symbol '" + name + "' is already defined!";
            }
            this.name_lookup[this.names_depth][name] = value;
        };

        this.pushNames = function () {
            this.names_depth++;
            this.name_lookup.push({});
        };

        this.popNames = function () {
            this.names_depth--;
            this.name_lookup.pop();
        };
    },

    evalScheem : (function () {
        "use strict";

        var validateParamsNum = {
            exact : function (expr, num) {
                if (expr.length -1 !== num) {
                    throw "Function '" + expr[0] + "' requires " + num + " params, " + (expr.length - 1) + "was given!";
                }
            },
            min : function (expr, min) {
                if (expr.length - 1 < min) {
                    throw "Function '" + expr[0] + "' requires at least " + min + " params, " + (expr.length - 1) + "was given!";
                }
            },
            max : function (expr, max) {
                if (expr.length - 1 > max) {
                    throw "Function '" + expr[0] + "' at most " + max + " params, " + (expr.length - 1) + "was given!";
                }
            },
            minmax : function (expr, min, max) {
                var params = expr.length - 1;
                if (params < min || params > max) {
                    throw "Function '" + expr[0] + "' requires between " + min + " and " + max + " params, " + params + "was given!";
                }
            }
        };

        var validateParamType = {
            getType : function (param) {
                if (Array.isArray(param)) {
                    return 'array';
                } else {
                    return typeof param;
                }
            },
            array : function (param, fn_name) {
                if (!Array.isArray(param)) {
                    throw "Function '" + fn_name + "' expects argument too be array, " + this.getType(param) + " was given.";
                }
                return param;
            },
            string : function (param, fn_name) {
                if (typeof param !== 'string') {
                    throw "Function '" + fn_name + "' expects argument too be string, " + this.getType(param) + " was given.";
                }
                return param;
            }
        };

        function evalExpr(expr, env) {
            var result, list, params;
            if (Array.isArray(expr)) {
                switch(expr[0]) {
                    case 'quote':
                        validateParamsNum.exact(expr, 1);
                        return expr[1];
                    case 'begin':
                        validateParamsNum.min(expr, 1);
                        env.pushNames();

                        params = expr.length - 1;
                        for (var i = 1; i < params; i++) {
                            evalExpr(expr[i], env);
                        }
                        result = evalExpr(expr[params], env);

                        env.popNames();
                        return result;
                    case 'cons':
                        validateParamsNum.exact(expr, 2);
                        list = validateParamType.array(evalExpr(expr[2], env), expr[0]);
                        list.unshift(evalExpr(expr[1], env));
                        return list;
                    case 'cdr':
                        validateParamsNum.exact(expr, 1);
                        list = validateParamType.array(evalExpr(expr[1], env), expr[0]);
                        list.shift();
                        return list;
                    case 'define':
                        validateParamsNum.exact(expr, 2);
                        env.defineName(validateParamType.string(expr[1], expr[0]), evalExpr(expr[2], env));
                        return 0;
                    default:
                        throw "Unknown function '" + expr[0] + "'!";
                }
            } else if (typeof expr === 'string') {
                return env.resolveName(expr);
            } else {
                return expr;
            }
        }

        function evalScheem(expr, env) {
            if ( !(env instanceof scheem.Environment) ){
                env = new scheem.Environment(env);
            }

            return evalExpr(expr, env);
        }

        return evalScheem;
    }()),

    evalString : function (string) {
        var parsed, result;
        try {
            parsed = parse(string);
        } catch (exc) {
            throw { msg: '' + exc, type: 'Parsing error' };
        }

        try {
            result = this.evalScheem(parsed);
        } catch (exc) {
            throw { msg: exc, type: 'Evaluation error' };
        }

        return result;
    }
}

if (typeof module !== 'undefined') {
    exports.scheem = scheem;
}