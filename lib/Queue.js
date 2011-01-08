var Queue = (function () {
    "use strict";

    var results = [];
    var stack = [];
    var queue = [];

    function buildControl(queue) {
        var obj = {
            next: function () {
                obj.next = function () {};
                stack.shift();

                var first = stack[0];
                if (first) {
                    first(buildControl(queue));
                } else {
                    queue();
                }
            }
        };
        return obj;
    }

    var obj = {
        sync: function (func) {
            if (typeof func === "function") {
                stack.push(func);

                if (stack.length === 1) {
                    func(buildControl(obj.async()));
                }
            }
        },

        async: function (func) {
            var index = queue.push(func) - 1;

            return function () {
                var args = Array.prototype.slice.call(arguments);
                results.splice(index, 0, args);

                /*for (var i = 0; i < queue.length; i += 1) {
                    if (typeof queue[i] === "function") {
                        if (results[i]) {
    //                        console.log(i);
                            queue[i].apply(null, results[i]);
                            queue.splice(i, 1);
                            results.splice(i, 1);
    //                        queue[i] = function () {};
    //                        delete queue[i];
    //                            delete results[i];
                        }
                    } else {
                        break;
                    }
                }*/

                if (results.length === queue.length) {
                    for (var i = 0; i < queue.length; i += 1) {
                        if (typeof queue[i] === "function") {
                            queue[i].apply(null, results[i]);
                        }
                    }
                    queue.length = results.length = 0;
                }
            };
        },

        run: function (func) {
            return obj.async(func)();
        }
    };
    return obj;
}());
