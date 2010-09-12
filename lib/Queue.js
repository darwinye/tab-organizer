"use strict";
function Queue() {}

Queue.push = (function () {
    var stack = [];
    function buildControl(func) {
        return { next: function () {
            stack.shift();
            if (typeof stack[0] === "function") {
                stack[0](buildControl(stack[0]));
            }
            this.next = function () {};
        }};
    }
    return function (func) {
        if (typeof func === "function") {
            stack.push(func);
            if (stack.length === 1) {
                func(buildControl(func));
            }
        }
    };
}());
