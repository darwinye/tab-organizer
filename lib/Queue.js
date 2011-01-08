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
//
//    function every() {
//        for (var i = 0; i < queue.length; i += 1) {
//            if (!results[i]) {
//                return false;
//            }
//        }
//        return true;
//    }
//
//    function executeAll() {
//        for (var i = 0; i < queue.length; i += 1) {
//            if (typeof queue[i] === "function") {
//                queue[i].apply(null, results[i]);
//            }
//        }
//    }

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
                results[index] = Array.prototype.slice.call(arguments);

                for (var i = 0; i < queue.length; i += 1) {
                    if (results[i]) {
                        if (typeof queue[i] === "function") {
                            queue[i].apply(null, results[i]);
                            delete queue[i];
    //                            queue.splice(i, 1);
    //                            results.splice(i, 1);
    //                            i -= 1;
                        }
                    } else {
                        return;
                    }
                }

//                if (every()) {
//                    executeAll();
                queue.length = results.length = 0;
//                }
            };
        },

        run: function (func) {
            return obj.async(func)();
        }
    };
    return obj;
}());
