/*global state */

(function () {
    "use strict";

    var indent = state.indent;

    var focusedByID = {};

    function make(tab) {
        var index = tab.window.index;
//                                } catch (e) {
//                                    console.error(e);
//                                }

        if (!indent[index]) {
            indent[index] = [];
        }
        return indent[index];
    }

    function insert(tab, index) {
//                var level = indent[tab.window.index];
        var level = make(tab);
//                if (level) {
//                var index = tab.index;
/*                if (index < 1) {
                index = null;
            } else {

            }*/

//                console.log(level[index]);
//
        index = (index < 1 ? null : level[index]);
//
//                console.log(tab.dropIndent);
/*
        if (tab.dropIndent) {
            index = index + 1 || 1;
            delete tab.dropIndent;
        }*/

//                if (index) {
        level.splice(tab.index, 0, index);
//                }

        Platform.event.trigger("tab-indent", tab, index);
//                }
    }

    function sub(level, list, value, i) {
        for (i; i < level.length; i += 1) {
//                    console.log(level[i], value);
            if (!level[i] || level[i] <= value) {
                break;
            }

            level[i] -= 1;

            if (level[i] === 0) {
                delete level[i];
            }

            Platform.event.trigger("tab-indent", list[i], level[i]);
        }
    }

    function moveup(tab, index) {
        var level = indent[tab.window.index];
        if (level) {
            var parent = level[index - 1],
                value = level[index];

            level.splice(index, 1);
//
//            console.log(index, value, level.slice());
/*
            Queue.run(function (queue) {
//                queue.next();
            });*/

            if (value > (parent || 0)) {
                sub(level, tab.window.tabs, value, index);
            }
        }
    }
/*
    chrome.history.onVisited.addListener(function (result) {
        console.log("visited", result.url);
    });

    chrome.tabs.onCreated.addListener(function (tab) {
        console.log("created", tab.url);
    });

    chrome.tabs.onUpdated.addListener(function (id, info, tab) {
        console.log("updated", tab.url);
    });*/

    function equals(string) {
        for (var i = 1; i < arguments.length; i += 1) {
            if (string === arguments[i]) {
                return true;
            }
        }
    }

    function check(tab, focused) {
//                console.log(tab, focused);
//                try {
        if (tab.index !== focused.index) {
//                if (tab.status === "loading") {
//                    console.log("checked", tab.url);
            Platform.history.lastVisit(tab.url, function (visit) {
//                        console.log(visit.transition);
//                        switch (visit.transition) {
//                        case "link":          //* FALLTHRU
//                        case "reload":        //* FALLTHRU
//                        case "auto_bookmark":
                if (equals(visit.transition, "link", "reload", "auto_bookmark")) {
//                            console.log(visit.referringVisitId);
//
//                                try {
                    var level = make(tab);
//
//                            console.log(tab);

                    if (level.length < tab.index) {
                        level.length = tab.index;
                    }
//
//                                console.log(tab.index);

                    level.splice(tab.index, 0, null);

                    var amount = level[focused.index] + 1 || 1,
                        parent = level[tab.index - 1] || 0;
//
//                            console.log(amount, parent);
//!                            var reload = visit.transition === "reload";
                    if (amount - 1 > parent || /*!(reload && */amount < parent) { //* 2+ levels deep
//                                console.log("too big", parent, amount);
                        amount = parent + 1;
                    }
//
//                            console.log(focused.index, tab.index, level[focused.index]);

                    level[tab.index] = amount;
//                                tab.parentId = focused.id;

                    Platform.event.trigger("tab-indent", tab, amount);
//                            console.log(tab, focused);
                }
//                        console.log(visit.transition);
            });
        }
//                } catch (e) {
//                    console.error(e);
//                }
    }
//
//            function add(level, list, parent, index) {
//            }


    indent.sub = function (tab) {
        var level = indent[tab.window.index];
        if (level) {
            var index = tab.index;
//                    var parent = level[index];
//                    level[index] -= 1;
//
//                    level.splice(index, 1);

            if (level[index]) {
                sub(level, tab.window.tabs, level[index], index + 1);

                Platform.event.trigger("tab-indent", tab, level[index] -= 1);
            }
        }
    };
//
//            function add(level, list, value, index) {
//
//            }

    indent.add = function (tab) {
//                var index = tab.window.index;
//
//                if (!indent[index]) {
//                    indent[index] = [];
//                }
        var index = tab.index;
        if (index === 0) {
            return;
        }

        var i, level = make(tab);//indent[index];

        var list = tab.window.tabs;
        var value = level[index];
//
//                console.log(level[index - 1]);

        if (value && value > (level[index - 1] || 0)) {
            var prev, curr;
            /*for (var i = index; i > 0; i -= 1) {
                if (level[i - 1] >= level[i]) {
                    level[i] += 1;

                    Platform.event.trigger("tab-indent", list[i], level[i]);
                    break;
                }
            }

            if (i === 0) {
                return;
            }*/
//
            for (i = index - 1; i > 0; i -= 1) {
                prev = level[i - 1],
                curr = level[i];

                if ((prev || 0) >= (curr || 0)) {
//                            console.log(i, index, prev || 0, curr || 0);
//                            console.log(i, index);
//                            var value = level[i];
                    for (i; i <= index; i += 1) {
                        level[i] = level[i] + 1 || 1;
                        Platform.event.trigger("tab-indent", list[i], level[i]);
                    }
//                            level[i] += 1;
//                            add(level, list, level[i] + 1, i);
//                            Platform.event.trigger("tab-indent", list[i], level[i]);
                    break;
                }
            }
/*
            if (i === index) {
                return;
            }*/
        } else {
//
//                if (value && value > level[index - 1]) {
//
//                } else {
//                var index = tab.index;
//                    var parent = level[index];
//                    var list = tab.window.tabs;
//                if (value) {
//                    console.log(value, index + 1, level.length);
        //                console.log(index, level.length);
//
//                    add(level, list, value, index + 1);
//                }
            for (i = index + 1; i < level.length; i += 1) {
                if (!level[i] || level[i] <= value) {
                    break;
                }

                Platform.event.trigger("tab-indent", list[i], level[i] += 1);
            }

            level[index] = value + 1 || 1;

            Platform.event.trigger("tab-indent", tab, level[index]);
//                    level[index] -= 1;
//
//                    level.splice(index, 1);
//
//                    sub(level, list, level[index], index + 1);
/*
        if (level[index]) {


            Platform.event.trigger("tab-indent", tab, level[index]);
        }*/
        }
    };


    Platform.event.on("window-remove", function (win) {
//                var level = indent[win.index];
//                if (level) {
//                    console.log("foo");
        indent.splice(win.index, 1);
//                undone.splice(win.index, 1);
//                }
    });

    Platform.event.on("tab-move", function (tab, info) {
//                var level = indent[tab.window.index];
//                if (level) {
////                    var parent = level[info.fromIndex];
////                    var index = tab.index;
////
////                    level.splice(info.fromIndex, 1);
        moveup(tab, info.fromIndex);
        insert(tab, tab.index - 1);
//                }
    });

    Platform.event.on("tab-detach", function (tab) {
        moveup(tab, tab.index);
//                var level = indent[tab.window.index];
//                if (level) {
//                    level.splice(tab.index, 1);

        Platform.event.trigger("tab-indent", tab);
//                }
    });

    Platform.event.on("tab-attach", function (tab) {
//                var level = indent[tab.window.index];
//                if (level) {
        insert(tab, tab.index - 1);
/*                    var index = ;
            if (index < 1) {
                index = null;
            } else {
                index = level[index];
            }

            level.splice(tab.index, 0, index);

            Platform.event.trigger("tab-indent", tab, index);*/
//                }
    });
/*
    Platform.event.on("tab-indent", function (tab, indent) {
        console.log(indent, tab.url);
    });*/

    Platform.event.on("tab-remove", function (tab) {
        moveup(tab, tab.index);
    });
/*
    Platform.event.on("tab-indent", function (tab, indent) {
//                var level = indent[tab.window.index];
//                if (level) {
        console.log(tab, indent);
//                }
    });*/

    Platform.event.on("tab-update", function (tab) {
        var focused = focusedByID[tab.id];
        if (focused) {
            check(tab, focused);
            delete focusedByID[tab.id];
        }
    });

    Platform.event.on("tab-create", function (tab) {
//                focused = focused || Platform.tabs.getSelected(tab.windowId);
//
//                console.log(tab.id);
        var focused = Platform.tabs.getSelected(tab.windowId);
        if (focused) {
            if (tab.url) {
//                        console.log("tab-create");
                check(tab, focused);
            } else {
                focusedByID[tab.id] = focused;
/*                    console.log("Refreshing");
                setTimeout(function () {
                    anon(tab, focused);
                }, 25);*/
//                    console.error(tab);
            }
        }// else {
//                    console.error(tab);
//                }
    });
}());
