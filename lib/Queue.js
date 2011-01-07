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

//    function test() {
//        for (var i = 0; i < queue.length; i += 1) {
//            if (!results[i]) {
//                return false;
//            }
//        }
//        return true;
//    }

    return {
        /*sync: function (func) {
            if (typeof func === "function") {
                stack.push(func);
                if (stack.length === 1) {
                    func(buildControl(func));
                }
            }
        },*/
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
//            console.log(index);
            return function () {
                var args = Array.prototype.slice.call(arguments);
                results.splice(index, 0, args);

//                console.log(queue.length, results.length);
    //            console.log(test() === (results.length === queue.length));

                if (results.length === queue.length) {
                    for (var i = 0; i < queue.length; i += 1) {
                        if (typeof queue[i] === "function") {
//                            console.log(this);
                            queue[i].apply(this, results[i]);
                        }
//                        delete results[i];
                    }
                    queue.length = results.length = 0;
//                    console.log(results);
                }
            };
        },
        run: function (func) {
//            func();
            return this.async(func)();
        }
    };
}());
