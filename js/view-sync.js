/*global Options */

(function () {
    "use strict";

    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";


    function href(value) {
        return "/views/" + value + ".css";
    }

    link.href = href(Options.get("windows.type"));
//            link.href = ""
//            link.href = Options.get("windows.type");
/*
    link.addEventListener("beforeload", function () {
        console.log(link.href);
    }, true);*/


    function find(text, func) {
        var rules = link.sheet.cssRules;

        for (var i = 0; i < rules.length; i += 1) {
            if (rules[i].selectorText === text) {
                func(rules[i]);
                return;
            }
        }
/*
        setTimeout(function () {
            find(text, func);
        }, 50);*/
    }

    var types = {
        "grid": function () {
            find(".window", function (rule) {
                var width = Options.get("windows.grid.columns");
                rule.style.width = 100 / width + "%";

                var height = Options.get("windows.grid.rows");
                rule.style.height = 100 / height + "%";
            });
        }
    };
//
//            var state = {};
//
//            function update(done) {
///*                    if (state.loaded) {
//
//                        if (typeof done === "function") {
//                            done();
//                        }
//                    } else {
//                    }*/
////                    (function anon() {
////                    if () {
//
////                    } else {
////                        console.warn("Timeouting!");
////
////                        setTimeout(anon, 50);
////                    }
////                    }());
//                /*} else if (typeof done === "function") {
//                    done();
//                }*/
//            }
/*
    addEventListener("DOMContentLoaded", function (event) {
        console.log(event.type);
    }, true);*/

    var update = (function () {
        var url, done, value;

        var request = new XMLHttpRequest();

        request.addEventListener("load", function () {
//                    if (this.readyState === 4) {
//                        this.removeEventListener(event.type, anon, true);
//
//                        state.loaded = true;
//
//
            link.href = url;
//
//                    console.log(request.status);

            var action = types[value];
            if (action) {
                action();
            }

            if (typeof done === "function") {
                done();
            }
//                if (request.readyState === 4) {
                /*if (request.status === 200) {
                    dump(request.responseText);
                } else {
                    dump("Error loading page\n");
                }*/
//                }
//                    }
        }, true);

        return function (action) {
            value = Options.get("windows.type");
            url = href(value);
//                link.href = url;
//
            done = action;

/*
            console.log(link.href, url);

            if (link.href === url) {
                run();
            } else {*/
//
//                state.loaded = false;
//                state.url = url;
            request.open("GET", url, true);
            request.send(null);
//                    }
        };
    }());
/*
    addEventListener("DOMContentLoaded", function () {

    }, true);*/
//            addEventListener("DOMContentLoaded", update, true);


    Options.event.on("change", function (event) {
        var columns = (event.name === "windows.grid.columns"),
            rows = (event.name === "windows.grid.rows"),
            type = (event.name === "windows.type");
/*
        if (type) {
            href(event.value);
        }*/

        if (columns || rows || type) {
            update(function () {
                state.search({ scroll: true, focused: true, nodelay: true });
            });
/*
            update(function () {

            });*/
        }
    });

    document.head.appendChild(link);
    update();
}());
