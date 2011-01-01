"use strict";
/*global */

document.body.appendChild(UI.create("div", function (element) {
    element.className = "window-list";

    state.windowList = element;

    action.attachEvents(element);



}));


state.createView = function (windows) {
    var fragment = document.createDocumentFragment();

    windows.forEach(function (win) {
        if (win.type === "normal") {
            fragment.appendChild(Window.proxy(win));
        }
    });

    state.windowList.appendChild(fragment);
};
