"use strict";
/*global chrome */

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

(function () {
    var port = chrome.extension.connect({ name: "lib.keyboard" });
//Options.linkToPage(function () {
//Platform.message.connect("lib.keyboard", function (port) {
    function sendMessage(event) {
        var object = Object.copy(event, function (key, value) {
            if (value instanceof Object) {
                return;
            }
            return value;
        });
//        console.log(object);
//        object.message = "HIYA";
        //port.sendMessage(object);
        port.postMessage(object);
    }

    //! addEventListener("keydown", sendMessage, true);
    addEventListener("keyup", sendMessage, true);

//        addEventListener("keyup", function (event) {
//            var ctrl = Options.get("popup.hotkey.ctrl");
//            var letter = String.fromCharCode(event.which);

//            //console.log(event);

//            if (event.ctrlKey === ctrl || event.metaKey === ctrl) {
//                if (event.shiftKey === Options.get("popup.hotkey.shift")) {
//                    if (event.altKey === Options.get("popup.hotkey.alt")) {
//                        if (letter === Options.get("popup.hotkey.letter")) {
//                            port.sendMessage({});
//                        }
//                    }
//                }
//            }
//        }, true);
//});
}());
//});
