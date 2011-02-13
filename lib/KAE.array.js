var KAE = Object(KAE);

KAE.array = Object(KAE.array);
/*
KAE.array.stablesort = (function () {
    "use strict";

    function merge(left, right, func) {
        var result = [];

        var length = Math.max(left.length, right.length);

        for (var i = 0; i < length; i += 1) {
            if (func(left[i], right[i]) > 0) {
                result.push(left[i]);
            } else {
                result.push(right[i]);
            }
        }
//
//        while (left.length > 0 || right.length > 0) {
//            if (left.length > 0 && right.length > 0) {

//            } else if (left.length > 0) {
//            } else if (right.length > 0) {
//            }
//        }

        return result;
    }

    return function anon(array, func) {
        if (array.length < 2) {
            return array;
        }

        if (typeof func !== "function") {
            func = function (a, b) {
                return b - a;
            };
        }

        var length = Math.floor(array.length / 2);

        var i;

        var left = [],
            right = [];

        for (i = 0; i < length; i += 1) {
            left.push(array[i]);
        }
        for (i = length; i < array.length; i += 1) {
            right.push(array[i]);
        }

        left = anon(left, func);
        right = anon(right, func);

        return merge(left, right, func);
    };
}());*/

KAE.array.stablesort = function (array, func) {
    "use strict";
//
//    return array.slice().sort(func);

    var result = array.slice();

    if (result.length < 2) {
        return result;
    }

    if (typeof func !== "function") {
        func = function (a, b) {
            return a - b;
        };
    }

    /** insertion sort */

    var prev, value;

    for (var i = 1; i < result.length; i += 1) {
        value = result[i];
        prev = i - 1;

        while (func(result[prev], value) > 0) {
            result[prev + 1] = result[prev];
            prev -= 1;

            if (prev < 0) {
                break;
            }
        }
        result[prev + 1] = value;
    }

    return result;
};
