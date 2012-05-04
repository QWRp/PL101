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

        this.setName = function (name, value) {
            for (var i = this.names_depth; i >= 0; i--) {
                if ( name in this.name_lookup[i] ) {
                    this.name_lookup[i][name] = value;
                    return;
                }
            }

            throw "Symbol '" + name + "' is not defined!";
        }

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
                var params = expr.length - 1;
                if (params !== num) {
                    throw "Function '" + expr[0] + "' requires " + num + " params, " + params + "was given!";
                }
                return params;
            },
            min : function (expr, min) {
                var params = expr.length - 1;
                if (params < min) {
                    throw "Function '" + expr[0] + "' requires at least " + min + " params, " + params + "was given!";
                }
                return params;
            },
            max : function (expr, max) {
                var params = expr.length - 1;
                if (params > max) {
                    throw "Function '" + expr[0] + "' at most " + max + " params, " + params + "was given!";
                }
                return params;
            },
            minmax : function (expr, min, max) {
                var params = expr.length - 1;
                if (params < min || params > max) {
                    throw "Function '" + expr[0] + "' requires between " + min + " and " + max + " params, " + params + " was given!";
                }
                return params;
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
                    throw "Function '" + fn_name + "' expects argument to be array, " + this.getType(param) + " was given.";
                }
                return param;
            },
            string : function (param, fn_name) {
                if (typeof param !== 'string') {
                    throw "Function '" + fn_name + "' expects argument to be string, " + this.getType(param) + " was given.";
                }
                return param;
            },
            number : function (param, fn_name) {
                if (typeof param !== 'number') {
                    throw "Function '" + fn_name + "' expects argument to be number, " + this.getType(param) + " was given.";
                }
                return param;
            },
            boolean : function(param, fn_name) {
                if (typeof param !== 'boolean') {
                    throw "Function '" + fn_name + "' expects argument to be boolean, " + this.getType(param) + " was given.";
                }
                return param;
            }
        };

        function evalExpr(expr, env) {
            var result, list, params, i;
            if (Array.isArray(expr)) {
                switch(expr[0]) {
                    case '*':
                        params = validateParamsNum.exact(expr, 2);
                        return validateParamType.number(evalExpr(expr[1], env), expr[0]) * validateParamType.number(evalExpr(expr[2], env), expr[0]);
                    case '/':
                        params = validateParamsNum.exact(expr, 2);
                        return validateParamType.number(evalExpr(expr[1], env), expr[0]) / validateParamType.number(evalExpr(expr[2], env), expr[0]);
                    case '+':
                        params = validateParamsNum.exact(expr, 2);
                        return validateParamType.number(evalExpr(expr[1], env), expr[0]) + validateParamType.number(evalExpr(expr[2], env), expr[0]);
                    case '-':
                        params = validateParamsNum.exact(expr, 2);
                        return validateParamType.number(evalExpr(expr[1], env), expr[0]) - validateParamType.number(evalExpr(expr[2], env), expr[0]);
                    case 'quote':
                        validateParamsNum.exact(expr, 1);
                        return expr[1];
                    case '=':
                        validateParamsNum.exact(expr, 2);

                        return validateParamType.number(evalExpr(expr[1], env), expr[0]) === validateParamType.number(evalExpr(expr[2], env), expr[0]);
                    case '>':
                        validateParamsNum.exact(expr, 2);

                        return validateParamType.number(evalExpr(expr[1], env), expr[0]) > validateParamType.number(evalExpr(expr[2], env), expr[0]);
                    case '<':
                        validateParamsNum.exact(expr, 2);

                        return validateParamType.number(evalExpr(expr[1], env), expr[0]) < validateParamType.number(evalExpr(expr[2], env), expr[0]);
                    case '>=':
                        validateParamsNum.exact(expr, 2);

                        return validateParamType.number(evalExpr(expr[1], env), expr[0]) >= validateParamType.number(evalExpr(expr[2], env), expr[0]);
                    case '<=':
                        validateParamsNum.exact(expr, 2);

                        return validateParamType.number(evalExpr(expr[1], env), expr[0]) <= validateParamType.number(evalExpr(expr[2], env), expr[0]);
                    case 'if':
                        validateParamsNum.exact(expr, 3);

                        if (validateParamType.boolean(evalExpr(expr[1], env), expr[0])) {
                            return evalExpr(expr[2], env);
                        } else {
                            return evalExpr(expr[3], env);
                        }
                    case 'begin':
                        validateParamsNum.min(expr, 1);
                        env.pushNames();

                        params = expr.length - 1;
                        for (i = 1; i < params; i++) {
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
                    case 'car':
                        validateParamsNum.exact(expr, 1);
                        list = validateParamType.array(evalExpr(expr[1], env), expr[0]);
                        if (list.length === 0) {
                            throw "Can't use 'car' on empty list!";
                        }
                        return list[0];
                    case 'cdr':
                        validateParamsNum.exact(expr, 1);
                        list = validateParamType.array(evalExpr(expr[1], env), expr[0]);
                        list.shift();
                        return list;
                    case 'define':
                        validateParamsNum.exact(expr, 2);
                        env.defineName(validateParamType.string(expr[1], expr[0]), evalExpr(expr[2], env));
                        return 0;
                    case 'set!':
                        validateParamsNum.exact(expr, 2);
                        env.setName(validateParamType.string(expr[1], expr[0]), evalExpr(expr[2], env));
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