"use strict";
/*global Platform */

Object.copy = function (object, filter) {
    var copy = {};

    Object.keys(object).forEach(function (key) {
        var value = object[key];
        if (typeof filter === "function") {
            value = filter.call(object, key, value);
            if (typeof value !== "undefined") {
                copy[key] = value;
                //value = object[key];
            }
        } else {
            copy[key] = value;
        }
    });

    return copy;
//    var json = JSON.stringify(object, function (key, value) {
//        if (key && value instanceof Object) {
//            return null;
//        } else {
//            return value;
//        }
//    });
//    return JSON.parse(json);
};

Platform.message.connect("lib.keyboard", function (port) {
    function sendMessage(event) {
        var object = Object.copy(event, function (key, value) {
            if (value instanceof Object) {
                return;
            }
            return value;
        });
//        console.log(object);
//        object.message = "HIYA";
        port.sendMessage(object);
    }

    addEventListener("keydown", sendMessage, true);
    addEventListener("keyup", sendMessage, true);
});
