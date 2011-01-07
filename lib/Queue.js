var Queue = (function () {
    "use strict";

    var results = [];
    var stack = [];
    var queue = [];

    function buildControl(func, queue) {
        return {
            next: function () {
                this.next = function () {};
                stack.shift();

                if (stack[0]) {
                    stack[0](buildControl(stack[0], queue));
                } else {
                    queue();
                }
            }
        };
    }

    return {
        sync: function (func) {
            if (typeof func === "function") {
                stack.push(func);

                if (stack.length === 1) {
                    func(buildControl(func, this.async()));
                }
            }
        },

        async: function (func) {
            var index = queue.push(func) - 1;
            return function () {
                var args = Array.prototype.slice.call(arguments);
                results.splice(index, 0, args);

                if (results.length === queue.length) {
                    for (var i = 0; i < queue.length; i += 1) {
                        if (typeof queue[i] === "function") {
                            queue[i].apply(this, results[i]);
                        }
                    }
                    queue.length = results.length = 0;
                }
            };
        },

        run: function (func) {
            return this.async(func)();
        }
    };
}());
