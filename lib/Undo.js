"use strict";

var Undo = {};

(function () {
    var rules = {};
    var stack = [];

    Undo.setRule = function (name, action) {
        if (typeof action === "function") {
            rules[name] = action;
        }
    };
//    Undo.setRule = function (name, info) {
//        info = Object(info);

//        if (typeof info.action === "function") {
//            rules[name] = [ info.action ];
//        }
//    };

    Undo.push = function (name, info) {
        stack.unshift(Object(info));
        stack.unshift(name);
    };
    Undo.pop = function () {
        var action = rules[stack[0]];
        if (typeof action === "function") {
            action(stack[1]);
        }
        stack = stack.slice(2);
    };

    Undo.reset = function () {
        stack.length = 0;
    };

    Object.defineProperty(Undo, "length", {
        configurable: false,
        get: function () {
            return stack.length / 2;
        },
        set: function () {}
    });
}());

Undo.setRule("move-tabs", function (info) {
    info.queue.forEach(function (item) {
        Tab.move(item, item.undoState, item.queueAdd);
    });
    Undo.reset();
});