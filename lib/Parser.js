"use strict";

function Parser() {
    this.rules = [];
    this.symbols = {};
    this.parser = this;
}
Parser.prototype.find = function (name) {
};
Parser.prototype.value = function (value) {
};
Parser.prototype.match = function (name) {
    return function () {
        var value = this.parser.value(0);
        this.parser.find(name);
        return value;
    };
};
Parser.prototype.symbol = function (name, bind, info) {
    info = Object(info);

    var symbol = this.symbols[name];

    bind = bind || 0;

    if (symbol) {
        if (bind >= symbol.bind) {
            symbol.bind = bind;
        }
    } else {
        symbol = {
            name: name,
            bind: bind
        };
        this.symbols[name] = symbol;
    }
    return symbol;
};
Parser.prototype.prefix = function (name, bind, info) {
};
Parser.prototype.infix = function (name, bind, info) {
    info = Object(info);

    var parser = this.parser;
    var infix = parser.symbol(name, bind);

    if (typeof info.parse !== "function") {
        info.parse = function (left) {
            this.values = [];
            this.values.push(left);
            this.values.push(parser.value(bind));
            return this;
        };
    }
    infix.parse = info.parse;

    return infix;
};
