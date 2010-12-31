"use strict";
/*global */

document.body.appendChild(UI.create("div", function (element) {
    element.className = "window-list";
    //element.className = "stretch";
    //element.style.display = "none !important";

    state.windowList = element;

    action.attachEvents(element);

//            state.update = function anon(event) {
//                //if (event.target.className) {
//                    clearTimeout(anon.timeout);
//                    anon.timeout = setTimeout(state.search, 50);
//                //}
//            };

    //var windowlist = document.getElementById("window-list");

//            setTimeout(function () {
//                Options.event.addListener("change", function () {
//                });
//            }, 0);
}));

//state.createSearchList = function () {
//    return ;
//};

state.createView = function (windows) {
    var fragment = document.createDocumentFragment();

//    element.appendChild(UI.create("td"));
    windows.forEach(function (win) {
        if (win.type === "normal") {
            fragment.appendChild(Window.proxy(win));
        }
    });
//    element.appendChild(UI.create("td"));

    state.windowList.appendChild(fragment);
};
