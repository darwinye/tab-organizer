"use strict";
/*global Platform */

JSON.removeObjects = function (object) {
    var json = JSON.stringify(object, function (key, value) {
        if (key && value instanceof Object) {
            return null;
        } else {
            return value;
        }
    });
    return JSON.parse(json);
};

Platform.message.connect("lib.keyboard", function (port) {
    function sendMessage(event) {
        port.sendMessage(JSON.removeObjects(event));
    }

    addEventListener("keydown", sendMessage, true);
    addEventListener("keyup", sendMessage, true);
});
