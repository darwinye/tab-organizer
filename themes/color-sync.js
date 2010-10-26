"use strict";
/*global Options */

(function () {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";

    function href(value) {
        link.href = "/themes/" + value + ".css";
    }
    href(Options.get("color.theme"));

    Options.addEventListener("change", function (event) {
        if (event.name === "color.theme") {
            href(event.value);
        }
    }, true);

    document.head.appendChild(link);
}());
