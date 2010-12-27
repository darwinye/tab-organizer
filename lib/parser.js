var parser = (function () {
    "use strict";

    var state = {
        symbols: {},
        tokens: [],
        next: function () {
            state.tokens.shift();
            return state.tokens[0];
        }
    };

    var base = {
        nud: function () {
            //throw new Error("Undefined: " + this.name);
        },
        led: function () {
            //throw new Error("Missing operator: " + this.name);
        }
    };

    function noop() {}

    /*!function log(token) {
        if (token) {
            return token.name || token.value;
        }
    }*/

    function advance(name) {
        if (!state.token) {
            console.error("End of stream.");
        }
        //console.log(state.token);
        /*if (name && state.token.name !== name) {
            throw new Error("Expected " + name + " but got " + state.token.name);
        }*/
        state.token = state.next();
        return state.token;
    }

    function expression(num) {
        num = num || 0;

        var left, token;

        token = state.token;
        advance();
        //state.token = state.next();

//!        console.log(log(token), log(state.token));

        if (token.macro) {
            left = token.macro(state.token);
        } else {
            //if (token.nud) {
            left = token.nud();
            //}
        }

//!        console.log(log(token), log(state.token), left);

        while (state.token && num < state.token.priority) {
            token = state.token;
            //state.token = state.next();
            advance();

            if (token.macro) {
//                console.warn(token);
                left = token.macro(left);
            } else {
                left = token.led(left);
            }

//!            console.log(log(token), log(state.token), left, "INNER");
        }

//!        console.log("");

        return left;
    }

    var parser = {
        expression: expression,
        literal: {
            nud: function () {
                return this.name;
            }
        },
        symbol: function (info) {
            //info = Object(info);
            info.priority = info.priority || 0;

            var name = info.token;//RegExp(name).source;

            var object = state.symbols[name];

            if (!object) {
                if (!info.match) {
                    info.match = new RegExp("(" + name.replace(/\W/g, "\\$&") + ")");
                }
                /*if (priority > object.priority) {
                    object.priority = priority;
                }
            } else {*/
                object = Object.create(base);
                object.regexp = info.match;
                object.name = name;
                object.priority = info.priority;
                state.symbols[name] = object;

                /*if (info.nud) {
                    object.nud = info.nud;
                }
                if (info.led) {
                    object.led = info.led;
                }*/
                /*if (!info.led && info.output) {
                    object.led = function (left) {
                        return led(left, expression(priority));
                    };
                }*/
            }

            return object;
        },
//        ignore: function (name) {
//            var object = parser.symbol(name);

//            object.nud = function (left) {
//                return expression();
//            };

//            return object;

//            /*var object = parser.infix(name, 0, function (left, right) {
//                console.log(right);
//                advance();
//                return right;
//            });
//            return;*/
//            var object = parser.symbol(name);
//            //object.ignore = true;
//            object.nud = function () {
//                //advance("(");
//                //return expression();
//                //return state.next();
//                //state.token = state.next();
//                var result = expression();
//                //console.log(result);
//                //advance();
//                return result;
//            };
//            /*object.led = function (left) {
//                console.log(left);
//                var result = expression();
//                //advance("+");
//                return result;
//            };*/

//            return object;
//        },
        braces: function (info) {
            parser.symbol({ token: info.close });
            parser.symbol({ token: info.open }).nud = function () {
                //return expression();
                //console.log("FOO");
                var result = expression();
                //console.log(result);
                advance(close);
                return result;
            };
        },
        infix: function (info) {
            var object = parser.symbol(info);

            //object.nud = function () {};
            object.led = function (left) {
                var result = expression(info.priority);

//                console.error(/*state.tokens.map(function (item) {
//                    return item.name;
//                }), */state.input, left, result, object.name);

                if (!result) {
                    //result = function () { return true; };
                    result = noop;
                    //result = parser.literal.nud.call({ name: "" });
                    //console.error(left, result);
                }

                var output = info.output(left, result);

                //output.original = left.original || result.original;

                //console.log(left.original, result.original);

//                if (result) {
                return output;
//                }

//                return function () { return true };
//                return noop;
//                return parser.literal.nud.call(object);
            };

            return object;
        },
        prefix: function (info) {
            var object = parser.symbol(info);

            object.nud = function () {
                var result = expression(info.priority);

//                if (!result) {
//                    //result = function () { return true; };
//                    result = noop;
//                    //result = parser.literal.nud;
//                    //result = parser.literal.nud.call({ name: "" });
//                    //console.error(left, result);
//                }

                if (result) {
                    return info.output.call(this, result);
                }

                //console.error(object);
                //object.value = object.name;
                //return noop;
                //return function () { return true; };
                return parser.literal.nud.call(object);
            };
            /*object.led = function (left) {
                //return expression(info.priority);
            };*/

            return object;
        },
        quotes: function (info) {
            var object = parser.symbol(info);

            object.nud = function () {
                //return expression();
                //console.log("FOO");
//                console.error(state.token);
                if (state.token.name) {
                    var result = info.output(state.token.name);
    //                var result = expression();
    //                //console.log(result);
                    expression();
                    advance(info.token);
                    //console.log(state.token);
                    return result;
                }

                //return noop;
//                //var result = expression();

//                console.log(state.token);
//                //console.log(result);
//                //;
//                /*while (state.token.name !== name) {
//                    advance(name)
//                    console.log(state.token);
//                }*/
//                //return result;
//                //return action.call(this, left, expression(priority));
//                return expression();
            };
            /*object.led = function (left) {
                console.log(left);
                return left + expression(info.priority);
                //console.log(expression(priority));
                //return expression();
            };*/

            return object;
        },
//        any: function (info) {
//            info.token = "";
//            parser.symbol(info).nud = function () {
//                //return expression();
//                //console.log("FOO");
//                var result = expression();
//                //console.log(result);
//                //advance();
//                return info.output(result);
//            };
//        },
        suffix: function (info) {
            //if (!(info.priority > 1)) {
            info.priority = 1;
            //}

            var object = parser.symbol(info);

//            object.nud = function () {
//                //advance();
//                return expression();
//            };
            object.led = function (left) {
                //console.log(info.token);
                //var result = ;
                //var result = expression();
                //advance();
                //console.warn(expression(9000));
                return info.output(left);
            };

            return object;
        }
    };

    function literal(value) {
        var object = Object.create(parser.literal);
        //var object = Object.create(parser.symbol("(literal)"));
        object.name = value;
        //object.original = value;
        return object;
        /*return {
            value: value,
            nud: function () {
                return this.name;
            }
        };*/
    }

    /*function getMatches(regexp, string) {
        var match, elements = [];

        while ((match = regexp.exec(string)) !== null) {
            var info = {
                text: match[0],
                match: match,
                regexp: regexp,
                start: match.index,
                end: match.index + match[0].length
            };

            elements.push(info);

            // This stops infinite loops.
            if (regexp.lastIndex === 0) {
                break;
            }
        }
        return elements;
    }*/

    function tokenize(input) {
        /*var matches = [];

        Object.keys(state.symbols).forEach(function (item) {
            var match = getMatches(RegExp(item, "g"), input);
            matches = matches.concat(match);
        });

        matches.sort(function (a, b) {
            return a.start - b.start || b.end - a.end;
        });

        console.log(matches);*/

        var list = Object.keys(state.symbols).map(function (key) {
            return state.symbols[key].regexp.source;
            //return item.replace(/\W+/g, "\\$&");
        });

        //console.log(list);

        list = list.sort(function (a, b) {
            return b.length - a.length;
        });
        /*.filter(function (item) {
            return item !== "(literal)";
        })*/

        //console.log(findCaller(input));

        var pattern = new RegExp(list.join("|"));

//!        console.log(pattern);

        var tokens = input.split(pattern).filter(function (name) {
            return name;
        });

//!        console.log(tokens);

        if (tokens.length) {
            tokens = tokens.map(function (name) {
                if (state.symbols[name]) {
                    return state.symbols[name];
                } else {
                    return literal(name);
                }
            });
        } else {
            tokens = [literal("")];
        }

        tokens.push(Object.create(base));
        //tokens.push(parser.symbol({ priority: 0, token: "(end)" }));

//!        console.log(tokens.slice());

        return tokens;
    }

    parser.output = function (string) {
        state.tokens = tokenize(string);
        state.token = state.tokens[0];
        state.input = string;
        return expression();
    };

    /*var literal = parser.symbol("(literal)");
    literal.nud = function () {
        return this.name;
    };*/

    return parser;
}());

//parser.symbol("(literal)").nud =

//parser.braces("(", ")");
/*
parser.literal.nud = function () {
    return +this.name;
};

parser.ignore(" ");
//parser.ignore(")");

parser.symbol(",");
//parser.symbol(")");

//        parser.unary(" ", 0, function (right) {
//            return right;
//        });

parser.unary("-", 10, function (right) {
    console.log(right);
    return -right;
});

parser.infix("-", 20, function (left, right) {
    return left - right;
});

parser.infix("+", 20, function (left, right) {
    return left + right;
});

parser.infix("*", 30, function (left, right) {
    return left * right;
});

parser.infix("/", 30, function (left, right) {
    return left / right;
});

//console.log(parser.output("2^+ 3 * 6 / 5"));
console.log(parser.output("-(2 + 3) * 6 / 5"));
//console.log(parser.output("-(2+3)*6/5-5"));
*/

/*parser.symbol("-", 20, {
    nud: function () {
        return "(NOT" + right + ")";
    },
    output: function (left, right) {
        return "(NOT" + right + ")";
    }
});*/

//      (OR (NOT (window: (OR foo (RANGE 5 5))) (AND bar qux))
//      (OR (AND (NOT (WINDOW (NOT "5,106,1"))) "foo") (AND (OR "bar" "qux") "corge"))
//      (OR (AND (NOT (WINDOW (OR (NOT 5) (RANGE 10 6) 1))) "foo") (AND (OR "bar" "qux") "corge"))
//console.log(parser.output("-window:foo,5-5 OR bar qux"));
//console.log(parser.output("-window:-5,106,1 foo OR (bar OR qux) corge"));
//console.log(parser.output("-window:-5,10-6,1 foo OR (bar OR qux) corge"));

//throw new Error();


/*
function expression(value, priority) {
    this.value = value;
    this.priority = priority || 0;
}
expression.prototype.nud = function () {
    return this.value;
};

function infix(value, priority, led) {
    this.led = led || function (left) {
    };
}


Object.create(infix, { priority: { value: 50 }});

infix("+", 50);

var infix = Object.create(expression);
infix.led = function (left) {
    var right = parse(this.priority);
    return
};

function token() {}

token("-", {
    priority: 90,
    type: "unary"
});

token("-", {
    priority: 90,
    type: "infix"
});

token("-", {
    priority: 90
});
*/



/*
var stack = [];
var output = [];

var tokens = {
    "(":       { type: "open",  priority: 100, remove: true },
    ")":       { type: "close", priority: 100, remove: true },
    "-": {
        type: "unary",
        priority: 90,
        replace: "NOT",

    },
    "-": {
        //type: "separator",
        priority: 90,
        replace: "RANGE",
//        replacer: function (left, right) {
//            if (left === " " || left === " OR ") {
//                return
//            }
//        }
    },
    ",":       { type: "separator", priority: 80, replace: "," },
    "window:": { type: "function", priority: 70 },
    " ":       { priority: 60, replace: "AND" },
    " OR ":    { priority: 50, replace: "OR" },
};

//[" ", "-"]

//"window:(foo-bar),()"

var input = ["-", "window:", "-", "5", ",", "10", "-", "6", ",", "1", " ", "foo", " OR ", "(", "bar", " OR ", "qux", ")", " ", "corge"];

input.forEach(function (token) {
    console.log(token);

    var operator = tokens[token];
    if (operator) {
        operator.token = operator.replace || token;

        switch (operator.type) {
        case "function":
            stack.unshift(operator);
            break;
        case "separator":
            while (stack[0] && stack[0].type !== "separator") {
                output.push(stack[0].token);
                stack.shift();
            }
            break;
        case "open":
            stack.unshift(operator);
            break;
        case "close":
            while (stack[0] && stack[0].type !== "open") {
                output.push(stack[0].token);
                stack.shift();
            }

            stack.shift();
            break;
        default:
            while (stack[0] &&
                    (operator.type === "unary"
                        ? operator.precedence < stack[0].precedence
                        : operator.precedence <= stack[0].precedence)) {

                output.push(stack[0].token);
                stack.shift();
            }

            stack.unshift(operator);
        }
    } else {
        output.push(token);
    }

    console.log(output.slice());
    console.log(stack.map(function (item) {
        return item.token;
    }));
    console.log("");
});

stack.forEach(function (item) {
    if (!item.remove) {
        output.push(item.token);
    }
});

console.log(output);
*/
