"use strict";
/*global */

document.body.appendChild(UI.create("div", function (element) {
    element.className = "window-list";

    UI.scrollBar(element, { side: "left" });

    state.createView = function (windows) {
        var fragment = document.createDocumentFragment();

    //    element.appendChild(UI.create("td"));
        windows.forEach(function (win) {
            if (win.type === "normal") {
                fragment.appendChild(Window.proxy(win));
                element.appendChild(Window.proxy(win));
            }
        });
    //    element.appendChild(UI.create("td"));

        state.windowList.appendChild(fragment);
    };
}));

document.body.appendChild(UI.create("div", function (element) {
    element.className = "window-list";

    UI.scrollBar(element, { side: "right" });

    state.windowList = element;

    action.attachEvents(element);
}));
