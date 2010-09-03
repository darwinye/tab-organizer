"use strict";
/*global chrome */

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

var port = chrome.extension.connect({ name: "lib.keyboard" });

function sendMessage(event) {
    port.postMessage(JSON.removeObjects(event));
    //chrome.extension.sendRequest();
}

addEventListener("keydown", sendMessage, true);
addEventListener("keyup", sendMessage, true);
