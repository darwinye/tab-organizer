"use strict";

function ASYNC() {}

ASYNC.timer = function (action, ms) {
    return setTimeout(action, ms);
};
ASYNC.stop = function (num) {
    clearInterval(num);
    clearTimeout(num);
};
