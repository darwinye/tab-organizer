"use strict";
/*global action, events, Options, Platform, Tab, UI, Undo, Window */


if (Options.get("popup.type") === "bubble") {
    document.body.style.width = Options.get("popup.width") + "px";
    document.body.style.height = Options.get("popup.height") + "px";
    //document.body.style.overflowY = "hidden";
    //document.body.style.maxWidth = "100%";
}


(function () {
    Undo.setRule("new-tab", function (info) {
        Platform.tabs.remove(info.id);
        Undo.reset();
    });

    //addEventListener("blur", function anon(event) {
    //    //this.removeEventListener(event.type, anon, true);

    //    console.warn(event.type, event.target, state.focused);
    //    //event.stopPropagation();
    //}, true);
    //addEventListener("focus", function anon(event) {
    //    //this.removeEventListener(event.type, anon, true);

    //    console.warn(event.type, event.target, state.focused);
    //    //event.stopPropagation();
    //}, true);

    Undo.setRule("rename-window", function (info) {
        /*addEventListener("blur", function anon(event) {
            //this.removeEventListener(event.type, anon, true);
            event.preventDefault();
            event.stopPropagation();
        }, true);*/
    //    addEventListener("blur", function (event) {
    //        console.warn(event.type, event.target);
    //        event.stopPropagation();
    //    }, true);

        //console.log(state.focused);

        state.titles[info.index] = info.node.value = info.value;
        //info.node.focus();
        info.node.select();
        //info.node.select();
        //info.focus.focus();
        Undo.reset();
    });

    Undo.setRule("select-tabs", function (info) {
        info.list.forEach(function (item) {
            //console.log(item.undoState.selected);
            if (item.undoState.selected) {
                item.queueAdd();
            } else {
                item.queueRemove();
            }
        });
        Undo.reset();
    });

    function move(info) {
        var proxy = {};

        info.list.forEach(function (item) {
            Queue.push(function (queue) {
                var undo = item.undoState;
                var info = {
                    index: undo.index
                };

                if (state.windows[undo.windowId]) {
                    info.windowId = undo.windowId;
                } else {
                    info.windowId = proxy[undo.windowId];
                }

                if (info.windowId) {
                    Tab.move(item, info, item.queueAdd);
                    queue.next();
                } else {
                    Platform.windows.create({ url: "lib/remove.html" }, function (win) {
                        info.windowId = proxy[undo.windowId] = win.id;
                        Tab.move(item, info, item.queueAdd);
                        queue.next();
                    });
                }
            });
        });
        Undo.reset();
    }

    Undo.setRule("move-tabs", move);
    Undo.setRule("macro-trigger", function (info) {
        info.list = info.moved;
        move(info);
    });

    //        Undo.setRule("close-tabs", function (info) {
    //            Undo.reset();
    //        });
}());


//        Options.event.trigger("change");

//        delete localStorage["search.lastinput"];
//        delete localStorage["window.titles"];

//        Options.set("titles", []);
//        Options.set("search.lastinput", "window:foob");

//        Options.set("titles", null);
//        Options.set("search.lastinput", null);


//!CLEANUP:
//        if (!"window.titles" in localStorage) {
//            localStorage["window.titles"] = JSON.stringify(Options.get("titles"));// || "";
//        }
//        if (!"search.lastinput" in localStorage) {
//            localStorage["search.lastinput"] = Options.get("search.lastinput") || "";
//        }

//delete localStorage["tabs.favorites.urls"];

//Options.setDefault("tabs.favorites.urls", Options.getObject(localStorage["tabs.favorites.urls"]));

//Options.set("tabs.favorites.urls", {});

var state = {
    //titles: Options.getObject(localStorage["window.titles"]),
    titles: Options.get("windows.titles"),
    //macros: Options.getArray(localStorage["macros.list"]),
    macros: Options.get("macros.list"),
    //favorites: Options.getObject(localStorage["tabs.favorites.urls"]),
    favorites: Options.get("tabs.favorites.urls"),
    list: [],
    windows: {},
    //tabs: [],
    //bookmarks: [],
    bookmarksByID: {},
    bookmarksByURL: {},
    tabsByID: {},
    tabsByURL: {},
    queues: {
        moveAllTabs: function (id, index) {
            var queue = [];
            state.list.forEach(function (item) {
                queue = queue.concat(item.tabList.queue);
                item.tabList.queue.moveTabs(id, index, false);
            });

            if (queue.length && Options.get("undo.move-tabs")) {
                Undo.push("move-tabs", {
                    list: queue
                });

                if (queue.length === 1) {
                    state.undoBar.show("You moved " + queue.length + " tab.");
                } else {
                    state.undoBar.show("You moved " + queue.length + " tabs.");
                }
            }
        },
        resetAll: function () {
            state.list.forEach(function (item) {
                item.tabList.queue.reset();
                delete item.tabList.queue.shiftNode;
            });
        }
    },
    urlBar: UI.create("div", function (container) {
        container.id = "URL-bar";

        /*container.show = function () {
            container.style.display = "";
        };
        container.hide = function () {
            container.style.display = "none !important";
        };
        container.hide();*/
        container.setAttribute("hidden", "");

        document.body.appendChild(container);
    }),
    placeholder: UI.create("div", function (container) {
        container.id = "placeholder";
    })/*,
    dragBox: UI.create("div", function (element) {
        element.style.width = "380px";
        element.style.height = "auto";
        element.style.cssFloat = "left";
        element.style.padding = "2px";
        element.style.overflow = "hidden";
        element.style.backgroundColor = "transparent";
        element.style.height = "100px";
    })*/
};


if (localStorage["window.titles"]) {
    state.titles.push.apply(state.titles, Options.getObject(localStorage["window.titles"]));
    delete localStorage["window.titles"];

    state.titles.forEach(function (item, i) {
        if (+item === i + 1) {
            delete state.titles[i];// = null;
        }
    });
}


Platform.bookmarks.getTree(function recurse(array) {
    var url = state.bookmarksByURL;
    array.forEach(function (item) {
        if (item.children) {
            recurse(item.children);
        } else {
            //state.bookmarks.push(item);
            state.bookmarksByID[item.id] = item;
            url[item.url] = url[item.url] + 1 || 1;
        }
    });
    if (state.loaded) {
        state.search();
        //! state.search({ scroll: true, focused: true, nodelay: true });
    }
    //console.log(state.loaded);
    //console.log(Object.keys(state.bookmarksByURL).length);
    //console.log(state.bookmarks.length);
});

Platform.bookmarks.addEventListener("change", function (id, info) {
    var bookmark = state.bookmarksByID[id],
        url = state.bookmarksByURL;

    if (info.url) {
//        var tabs = [];

        url[bookmark.url] -= 1;
        bookmark.title = info.title;
        bookmark.url = info.url;
        url[info.url] = url[info.url] + 1 || 1;

        state.search();
    }
}, true);

Platform.bookmarks.addEventListener("create", function (id, bookmark) {
    var url = state.bookmarksByURL;
    if (bookmark.url) {
        state.bookmarksByID[id] = bookmark;
        url[bookmark.url] = url[bookmark.url] + 1 || 1;
        state.search({ tabs: state.tabsByURL[bookmark.url] });
    }
}, true);

Platform.bookmarks.addEventListener("remove", function (id, info) {
    var bookmark = state.bookmarksByID[id];
    if (bookmark) {
        state.bookmarksByURL[bookmark.url] -= 1;
        delete state.bookmarksByID[id];
        state.search({ tabs: state.tabsByURL[bookmark.url] });
    }
}, true);


//if (!(state.macros instanceof Array)) {
//    state.macros = [];
//}

//console.log(state.macros);

//if (!state.macros.length) {
//    state.macros.push({
//        search: "file: | is:image",
//        action: "require",
//        //index: "window",
//        window: "Images"
//    }, {
//        search: "wikipedia",
//        action: "require",
//        window: "Wikipedia"
//    }, {
//        search: "inurl:youtube.com",
//        action: "require",
//        window: "YouTube"
//    }, {
//        search: "stackoverflow",
//        action: "require",
//        window: "StackOverflow"
//    }, {
//        search: "lisp | arclanguage",
//        action: "require",
//        window: "Lisp"
//    }, {
//        search: "python",
//        action: "require",
//        window: "Python"
//    }, {
//        search: "javascript",
//        action: "require",
//        window: "JavaScript"
//    }, {
//        search: "starcraft | teamliquid",
//        action: "require",
//        window: "StarCraft"
//    }, {
//        search: "mozilla | firefox",
//        action: "require",
//        window: "Mozilla"
//    }/*, {
//        search: "window:stackoverflow -stackoverflow",
//        action: "move"
//    }, {
//        search: "window:wikipedia -wikipedia",
//        action: "move"
//    }, {
//        search: "window:images -file: -is:image",
//        action: "move"
//    }*/, {
//        search: "inurl:chrome://newtab/",
//        action: "close"
//    });
//}

//addEventListener("unload", function () {
//    localStorage["macros.list"] = JSON.stringify(state.macros);
//}, true);


state.tabsByURL.add = function (url, node) {
    state.tabsByURL[url] = state.tabsByURL[url] || [];
    state.tabsByURL[url].push(node);
    state.tabsByURL.update(url);
};
state.tabsByURL.remove = function (url, node) {
    state.tabsByURL[url].remove(node);
    state.tabsByURL.update(url);
};
state.tabsByURL.update = function (url) {
    if (state.favorites.has(url)) {
        state.favorites.set(url, state.tabsByURL[url].length);
//        if (state.favorites[url] !== state.tabsByURL[url].length) {
//            state.favorites[url] = state.tabsByURL[url].length;

//            Options.event.trigger("change", {
//                name: "tabs.favorites.urls",
//                value: url
//            });
//        }
    }
};

//addEventListener("unload", function () {
//    localStorage["tabs.favorites.urls"] = JSON.stringify(state.favorites);
//}, true);

//        Options.setDefaults({
//            titles: []
//        });


//        addEventListener("contextmenu", events.disable, true);
//        addEventListener("contextmenu", function (event) {
//            if (event.target.localName !== "input") {
//                event.preventDefault();
//            }
//        }, true);

/*document.body.addEventListener("focus", function (event) {
    console.log(event.target);
}, true);*/

document.body.tabIndex = -1;

addEventListener("focus", function (event) {
    var target = event.target;

    //console.log(event.type, target);

    //console.log(event.type);
    //console.log(document.activeElement, target);
    if (target.setAttribute) {
        target.setAttribute("data-selected", "");
        //if (target.className === "window") {
        //delete state.focused;
        //}
    }

    if (target === this && state.focused) { //! Fixes a bug with the window titles.
        state.focused.triggerEvent("blur", false, false);
        //delete state.focused;
    }

    //delete state.focused;
}, true);
addEventListener("blur", function (event) {
    var target = event.target;

    //console.log(event.type, target);

    if (target.removeAttribute) {
        target.removeAttribute("data-selected");

        if (state.windowList.contains(target)) {
            state.focused = target;
        } else {
            delete state.focused;
        }
    }

    //console.log("FOCUSED", state.focused);

    //console.log(document.activeElement, target);
    //console.log(event.type);
    if (target === this && state.focused) {

        //console.log(state.focused);
        //this.focus();
        //state.focused.setAttribute("data-selected", "");
        //state.focused.setWindowFocus();
        //state.focused.blur();
        //state.focused.focus();
        state.focused.triggerEvent("focus", false, false);
        //delete state.focused;
    }// else {
        //delete state.focused;
    //}
}, true);

addEventListener("dragstart", function () {
    state.dragging = true;
}, true);
addEventListener("dragover", function (event) {
    if (!event.defaultPrevented) {
        document.activeElement.blur();
    }
}, false);
addEventListener("dragend", function () {
    state.placeholder.remove();
    state.dragging = false;
}, true);

addEventListener("keydown", function (event) {
    if (event.which === 27) { //* Escape
        if (!event.defaultPrevented) {
            if (Options.get("popup.close.escape")) {
                close();
            }
        }
    }
}, false);


var fragment = document.createDocumentFragment();

//fragment.appendChild(UI.create("div", function (element) {
//    //element.id = "views-wrapper";

//    //element.appendChild(UI.create("button", function (element) {
//        element.id = "views-list";
//        element.tabIndex = 1;

//        element.addEventListener("mousedown", events.disable, true);

//        var selected;

//        function select(target) {
//            if (selected) {
//                selected.removeAttribute("data-selected");
//            }
//            target.setAttribute("data-selected", "");
//            selected = target;
//        }

//        function register(name, info) {
//            element.appendChild(UI.create("div", function (element) {
//                element.className = "views-item";
//                element.textContent = name;
//                if (!selected) {
//                    element.setAttribute("data-selected", "");
//                    selected = element;
//                }

//                if (typeof info.action === "function") {
//                    element.addEventListener("click", function (event) {
//                        select(element);
//                        info.action.call(element);
//                    }, true);
//                }
//            }));
//        }

//        /*element.addEventListener("click", function (event) {
//            var target = event.target;
//            switch (target.className) {
//            case "views-item":
//                select(target);
//            }
//        }, true);*/

//        register("WINDOW", {
//            action: function () {
//                var tabs = Array.slice(document.getElementsByClassName("tab"));
//                //var tabs = Array.slice(document.getElementsByClassName("tab"));
//            }
//        });

//        register("DOMAIN", {
//            action: function () {
//                var tabs = Array.slice(document.getElementsByClassName("tab"));
////                var tabs = Object.keys(state.tabsByID).map(function (key) {
////                    return state.tabsByID[key];
////                });

//                var windows = {};

//                var regexp = /^[^:]+:\/\/([^\/]*)/;

//                tabs.forEach(function (item) {
//                    var url = regexp.exec(item.tab.url)[1];
//                    //console.log(url);
//                    windows[url] = windows[url] || [];
//                    windows[url].push(item);
//                });

//                var fragment = document.createDocumentFragment();

//                state.list.length = 0;

//                var view = Object.keys(windows).map(function (key) {
//                    var info = {
//                        name: key,
//                        tabs: windows[key].map(function (item) {
//                            return item.tab;
//                        })
//                    };
//                    return info;
//                });

//                view.sort(function (a, b) {
//                    return b.tabs.length - a.tabs.length;
//                });

//                console.log(view);

//                view.slice(0, 10).forEach(function (info) {
//                    fragment.appendChild(Window.proxy(info));
//                });

////            //    element.appendChild(UI.create("td"));
////                windows.forEach(function (win) {
////                    if (win.type === "normal") {

////                    }
////                });
////            //    element.appendChild(UI.create("td"));

//                state.windowList.innerHTML = "";
//                state.windowList.appendChild(fragment);

//                state.search({ scroll: true });

//                removeEventListener("unload", state.saveTitles, true);
//            }
//        });

//        register("TIME", {
//            action: function () {
//            }
//        });

//    //}));
//}));



fragment.appendChild(UI.create("div", function (container) {
    //element.id = "container-wrapper";

    //element.appendChild(UI.create("div", function (container) {
        container.id = "toolbar";

    //container.appendChild(UI.create("td", function (element) {
        container.appendChild(UI.create("button", function (element) {
            element.id = "button-menu";
            //element.title = "(Ctrl N)";
            element.className = "Options-button";
            element.textContent = "Menu";
            element.tabIndex = 1;

            element.appendChild(UI.create("img", function (element) {
                element.id = "button-menu-arrow";
                element.src = "/themes/Black-button-menu.png";
            }));

            element.appendChild(UI.contextMenu(function (menu) {
                function show(event) {
                    if (menu["DOM.Element"].contains(event.target)) {
                        return;
                    }
                    if (event.button !== 2) {
                        menu.show();
                    }
                }
                element.addEventListener("mousedown", show, true);
                element.addEventListener("dragenter", show, true);
                element.addEventListener("click", show, true);

                element.addEventListener("dragenter", element.focus, true);
                element.addEventListener("dragover", events.stop, false);

                //element.addEventListener("dragleave", element.blur, true);

                menu.addItem("<u>N</u>ew Window", {
                    keys: ["N"],
                    ondrop: function () {
                        Window.create(state.currentQueue);
                    },
                    action: function () {
                        Platform.windows.create({/* url: "chrome://newtab/" */});
                    }
                });


                menu.separator();


                var perform = (function () {
                    function go(macro, info) {
                        //info = Object(info);
                        info.tabs = info.tabs || Array.slice(document.getElementsByClassName("tab"));

                        if (macro.search) {
                            var results = action.parse(macro.search)(info.tabs);

                            if (results.length) {
                                switch (macro.action) {
                                case "require": //* FALLTHRU
                                case "move":
                                    if (macro.window) {
                                        var list = state.list.filter(function (item) {
        //                                    console.log(item.tabIcon.indexText.value, macro.window);
                                            return item.tabIcon.indexText.value === macro.window;
                                        });

                                        if (list.length) {
                                            var moved = results.moveTabs(list[0].window.id, null, false);//!info.moved);

                                            //if (info.moved) {
                                            info.moved = info.moved.concat(moved);
                                            //}

                                            if (macro.action === "require") {
                                                var odd = Array.slice(list[0].tabList.children);

                                                odd = odd.filter(function (item) {
                                                    return info.tabs.indexOf(item) !== -1 && results.indexOf(item) === -1;
                                                });

                                                if (odd.length) {
                                                    info.makeNew = info.makeNew.concat(odd);
                                                    //if (info.moved) {

                                                    //}
                                                    //info.moved = info.moved.concat(odd);

    //                                                tabs = tabs.filter(function (item) {
    //                                                    return odd.indexOf(item) === -1;
    //                                                });
                                                }
                                            }
                                        } else {
                                            Window.create(results, { title: macro.window, undo: false });

                                            //if (info.moved) {
                                            info.moved = info.moved.concat(results);
                                            //}
                                        }
                                    } else {
                                        Window.create(results, { undo: false });

                                        //if (info.moved) {
                                        info.moved = info.moved.concat(results);
                                        //}
                                    }
                                    break;
                                case "close":
                                    results.forEach(function (item) {
                                        Platform.tabs.remove(item.tab.id);
                                    });

                                    info.closed = info.closed.concat(results);
                                }

                                //console.log(results.length, tabs.length);

                                info.makeNew = info.makeNew.filter(function (item) {
                                    return results.indexOf(item) === -1;
                                });

                                info.tabs = info.tabs.filter(function (item) {
                                    return results.indexOf(item) === -1;
                                });
                            }// else {
                                //results.moveTabs();
                            //}
                        }

                        return info;
                    }

                    return function (array) {
                        var info = {
                            makeNew: [],
                            closed: [],
                            moved: []
                        };

                        array.forEach(function (item) {
                            info = go(item, info);
                        });

                        if (info.makeNew.length) {
                            Window.create(info.makeNew, { undo: false });

                            info.moved = info.moved.concat(info.makeNew);
                        }

                        var closed = info.closed;
                        var moved = info.moved;

                        Undo.push("macro-trigger", {
                            closed: closed,
                            moved: moved
                        });

                        var text = [];

                        if (moved.length) {
                            text.push("You moved ", moved.length, " tab");

                            if (moved.length !== 1) {
                                text.push("s");
                            }

    //!                        text.push(" and closed ", closed.length, " tab");

    //!                        if (closed.length !== 1) {
    //!                            text.push("s");
    //!                        }
                            text.push(".");

                            state.undoBar.show(text.join(""));
                        } else {
//                            text.push();
                            state.undoBar.show("Nothing changed.", { undo: false });
                        }
                    };
                }());

                menu.submenu("<u>M</u>acros...", {
                    keys: ["M"],
                    onshow: function (menu) {
                        if (state.macros.length) {
                            menu.enable();
                        } else {
                            menu.disable();
                        }
                    },
                    onopen: function (menu) {
                        menu.clear();

                        menu.addItem("<u>A</u>pply all macros", {
                            keys: ["A"],
                            action: function () {
                                perform(state.macros);
                            }
                        });

                        menu.separator();

                        state.macros.forEach(function (item) {
                            if (!item.search) {
                                return;
                            }

                            var text = [];

                            //console.log(item);

                            text.push(item.action);

                            if (item.search) {
                                text.push("<b>" + item.search + "</b>");
                            } else {
                                text.push("all tabs");
                            }
                            //text.push(item.search);
                            //text.push("'");

                            if (item.action === "move") {
                                text.push("to");
                            } else if (item.action === "require") {
                                text.push("in");
                            }

                            if (item.action !== "close") {
                                if (item.window) {
                                    text.push('"' + item.window + '"');
                                } else {
                                    text.push("new window");
                                }
                            }

                            menu.addItem(text.join(" "), {
                                action: function () {
                                    perform([item]);
                                }
                            });
                        });
                    }
                });
            }));

//            element.addEventListener("click", function (event) {
//                Platform.windows.create({/* url: "chrome://newtab/" */});
//            }, true);

//            element.addEventListener("drop", function (event) {
//                Window.create(state.currentQueue);
////                Platform.windows.create({ url: "lib/remove.html" }, function (win) {
////                    state.currentQueue.moveTabs(win.id);
////                    state.currentQueue.reset();
////                    delete state.currentQueue.shiftNode;
////                });
//            }, true);
        }));

//        container.appendChild(UI.create("span", function (element) {
//            element.className = "separator";
//            //element.textContent = "-";
//        }));

        container.appendChild(UI.link(function (element) {
            element.href = "/options.html";
            element.target = "_blank";
            element.textContent = "Options";
            element.tabIndex = 1;
        })/*UI.create("a", function (element) {


            element.className = "UI-link";



            element.addEventListener("click", function anon() {
//                if (anon.popup) {
//                    anon.popup.close();
//                }
                anon.popup = open(element.href, element.target);
            }, true);
        })*/);

        container.appendChild(UI.create("span", function (element) {
            element.className = "separator";
            element.textContent = "|";
        }));

        container.appendChild(UI.link(function (element) {
            element.href = "http://documentation.tab-organizer.googlecode.com/hg/Tab%20Organizer%20FAQ.html";
            element.target = "_blank";

            //element.className = "UI-link";
            element.textContent = "FAQ";
            element.tabIndex = 1;

            /*element.addEventListener("click", function anon() {
//                if (anon.popup) {
//                    anon.popup.close();
//                }
                anon.popup = open(element.href, element.target);
            }, true);*/
        }));
    //}));


    //container.appendChild(UI.create("div", function (element) {
        //element.id = "Undo-wrapper";
        //element.className = "stretch";

        container.appendChild(UI.create("div", function (element) {
            element.id = "Undo-bar";

            element.appendChild(UI.create("div", function (container) {
                container.id = "Undo-bar-div";

                //var undoButton;

                state.undoBar = container;

                container.hide = function (transition) {
                    if (transition !== true) {
                        container.style.webkitTransitionDuration = "0s";

                        setTimeout(function () {
                            container.style.webkitTransitionDuration = "";
                        }, 0);
                    }

                    container.style.opacity = "0 !important";
                    container.style.visibility = "hidden !important";

/*                        state.undoBar.addEventListener("webkitTransitionEnd", function anon(event) {
                        this.removeEventListener(event.type, anon, true);
                        this.style.webkitTransition = "";
                    }, true);*/
                };
                container.hide();

                var timer = {
                    reset: function () {
                        //console.log("Not timing!");
                        clearTimeout(timer.id);
                    },
                    set: function () {
                        //console.log("Timing!");
                        var ms = Options.get("undo.timer") * 1000;
                        timer.id = setTimeout(function () {
                            container.hide(true);
                        }, ms);
                    }
                };

                addEventListener("mouseover", function (event) {
                    //var element = document.elementFromPoint(event.clientX, event.clientY);
                    //console.log(container.contains(element));

                    var element = event.target;

                    if (container.contains(element)) {
                        if (!timer.mouseover) {
                            timer.mouseover = true;
                            timer.reset();
                        }
                    } else if (timer.mouseover) {
                        timer.mouseover = false;
                        timer.set();
                    }
                }, true);

                //setTimeout(container.show, 2000);
                //setTimeout(container.hide, 4000);

                /*addEventListener("focus", function (event) {
                    if (event.target !== document.body) {
                        container.hide();
                    }
                }, true);*/

                container.appendChild(UI.create("span", function (element) {
                    Object.defineProperty(state.undoBar, "text", {
                        get: function () {
                            return element.innerHTML;
                        },
                        set: function (value) {
                            element.innerHTML = value;
                        }
                    });
                }));

                container.appendChild(UI.link(function (element) {
                    element.id = "Undo-bar-button";
                    //element.className = "UI-link";
                    element.title = "(Ctrl Z)";
                    element.textContent = "Undo";
                    element.tabIndex = 1;

                    var should = true;

                    container.show = function (name, info) {
                        timer.reset();

                        info = Object(info);

                        //container.style.webkitTransitionDuration = "0.01s";

                        if (info.undo === false) {
                            element.setAttribute("hidden", "");
                            should = false;
                        } else {
                            element.removeAttribute("hidden");
                            should = true;
                        }

                        if (container.style.opacity) {
                            state.undoBar.text = name;

                            container.style.opacity = "";
                            container.style.visibility = "";
                        } else {
                            //container.style.webkitTransitionDuration = "0.250s";

                            container.hide();

                            setTimeout(function () {
                                state.undoBar.text = name;

                                container.style.opacity = "";
                                container.style.visibility = "";
                            }, 100);

    //                        setTimeout(function () {
    //                            container.style.webkitTransitionDuration = "";
    //                        }, 0);

    //                        container.addEventListener("webkitTransitionEnd", function anon(event) {
    //                            this.removeEventListener(event.type, anon, true);

    //                            //console.log(event);

    //                            container.style.webkitTransitionDuration = "0s";

    //

    //                            setTimeout(function () {
    //                                container.style.webkitTransitionDuration = "";
    //                            }, 0);
    //                        }, true);
                        }

                        //container.style.webkitTransitionDuration = "";

                        if (!timer.mouseover) {
                            timer.set();
                        }
                    };

                    function undo() {
                        //console.log(state.undoBar.style.opacity);
                        if (should && !state.undoBar.style.opacity) {
                            state.undoBar.hide();
                            Undo.pop();
                        }
                    }
                    element.addEventListener("click", undo, true);

                    addEventListener("keyup", function (event) {
//                        var target = event.target;
//                        if (target.localName === "input" && target.type === "text") {
//                            return;
//                        }

                        if (event.which === 90) {
                            if (event.ctrlKey || event.metaKey) {
                                if (!event.shiftKey && !event.altKey) {
                                    undo();
                                }
                            }
                        }
                    }, true);
                }));
            }));
        }));
    //}));


    //container.appendChild(UI.create("td", function (element) {
        //element.id = "search-cell";

        container.appendChild(UI.create("div", function (span) {
            span.id = "search-box";
            //span.textContent = "Search: ";

            var input = document.createElement("input");
            input.setAttribute("spellcheck", "false");
            input.setAttribute("results", "");
            input.setAttribute("incremental", "");
            input.setAttribute("placeholder", "Search");
            //input.setAttribute("autocomplete", "on");
            //input.setAttribute("autosave", Platform.getURL(""));

            //input.setAttribute("autofocus", "");
            //input.setAttribute("autosave", "foobarqux");
            //input.setAttribute("accessKey", "f");
            //input.name = "search";
            input.title = "(Ctrl F)";
            input.type = "search";
            input.tabIndex = 1;

    //                addEventListener("submit", function (event) {
    //                    alert();
    //                }, true);

            var lastinput = localStorage["search.lastinput"];
            if (typeof lastinput === "string") {
                input.value = lastinput;
            }

            var cache = {
                //windows: document.getElementsByClassName("window"),
                //tabs: document.getElementsByClassName("tab"),
                title: document.title
            };

            var precoded = {
                "h": ["has:macro"],
                "i": ["inurl:", "intitle:", "is:image", "is:pinned", "is:favorited", "is:selected", "is:bookmarked"],
                "s": ["same:url", "same:title", "same:domain"],
                "w": ["window:", "window:focused"]
            };

            function testSpecial(value) {
                input.removeAttribute("data-special");

                var special = precoded[value[0]];
                if (special) {
                    var is = special.some(function (item) {
                        return item === value;
                    });

                    if (is) {
                        input.setAttribute("data-special", "");
                    }
                }
            }

            function search(windows, info) {
                localStorage["search.lastinput"] = input.value;

                //var self = this;

                /*if (search.stop) {
                    console.warn("Stop!");
                    return;
                }
                search.stop = true;*/

                testSpecial(input.value);

//                var array = ;
                //var list = [];

                if (!cache.filter || cache.input !== input.value) {
                    cache.filter = action.parse(input.value);
                    cache.input = input.value;
                }

//                var test = !info.tabs || info.tabs.length;

//                if (test) {
//                    info.tabs = ;
//                }

                var array = Array.slice(document.getElementsByClassName("tab"));

                //if (!has) {

                //}

                var results = cache.filter(array);
                var focused, scroll = [];//, tabs = [];

//                if (test) {
//                    cache.length = results.length;
//                }

//                console.log(results.length);

//                cache.length += results.length;
//                cache.length -= info.tabs.length - results.inverse.length;

//                console.log(results.length, results.inverse.length);

//                windows.forEach(function (item) {
//                    item.setAttribute("hidden", "");
//                    item.removeAttribute("data-last");
//                });

                results.forEach(function (child) {
                    var item = child.parentNode.container;
//                    console.log(item);
//!                    item.setAttribute("data-shouldshow", "");

                    if (child.hasAttribute("data-focused")) {
                        item.selected = child;
                    }

                    child.removeAttribute("hidden");
//                    tabs.push(child);
                });

                results.inverse.forEach(function (child) {
                    child.setAttribute("hidden", "");
                });

                var list = windows.filter(function (item) {
                    item.removeAttribute("data-last");

                    var children = Array.slice(item.tabList.children);

                    var test = children.some(function (child) {
                        return !child.hasAttribute("hidden");
                    });

                    if (test) {
//!                    if (item.hasAttribute("data-shouldshow")) {
//!                        item.removeAttribute("data-shouldshow");
                        item.removeAttribute("hidden");

                        if (info.focused) {
                            var last = Options.get("window.lastfocused");
                            var win = item.window;

                            if (win.focused || last === win.id) {
                                focused = item;
                            }
                        }

                        if (info.scroll) {
                            scroll.push(item);
                        }
                    } else { //* Fixes windows showing up even when empty.
                    // if (results.inverse.length) {
//                        if (results.inverse.length) {
//!                        var children = Array.slice(item.tabList.children);

//!                        var test = children.every(function (child) {
//!                            return child.hasAttribute("hidden");
//!                        });

//!                        if (test) {
                        item.setAttribute("hidden", "");
//!                        }
//                        }
                    }

                    return test;
//!                    return !item.hasAttribute("hidden");
                });

                //var tabs = [];

//                var list = [];

//                var list = windows.filter(function (item) {
//                    var children = item.tabList.children;
//                    item.setAttribute("hidden", "");
//                    item.removeAttribute("data-last");

//                    Array.slice(children).forEach(function (child) {
//                        if (child.hasAttribute("data-focused")) {
//                            /*setTimeout(function () {
//                                UI.scrollTo(child, item.tabList);
//                            }, 0);*/
//                            item.selected = child;
//                        }
//                        if (results.indexOf(child) !== -1) {
//                            child.removeAttribute("hidden");
//                            item.removeAttribute("hidden");
////                            tabs.push(child);
//                        } else {//if (results.inverse.indexOf(child) !== -1) {
//                            child.setAttribute("hidden", "");
//                        }
//                    });

//                    if (info.focused) {
//                        var last = Options.get("window.lastfocused");
//                        var win = item.window;

//                        if (win.focused || last === win.id) {
//                            focused = item;
//                        }
//                    }

//                    if (!item.hasAttribute("hidden")) {
//                        //list.push(item);
//                        //var child = item.querySelector("[data-focused]");
//                        if (info.scroll) {
//                            scroll.push(item);
//                        }
////                        if (info.scroll) {
////                            //UI.scrollTo(item.selected, item.tabList);
////                        }
//                        return true;
//                    }
//                });

                if (list.length) {
                    list[list.length - 1].setAttribute("data-last", "");
                }

                if (focused) {
//                    console.log("scrolling");
                    focused.setWindowFocus();
                }
                scroll.forEach(function (item) {
                    UI.scrollTo(item.selected, item.tabList);
                });

                /*var list = info.windows.length,
                    tabs = info.tabs.length;*/

                var string = [ cache.title, " (" ];

//                var length = info.tabs.length - results.inverse.length;

                var length = results.length;
                string.push(length, (length === 1)
                                      ? " tab in "
                                      : " tabs in ");

                var length = list.length;
                string.push(length, (length === 1)
                                      ? " window)"
                                      : " windows)");



//                var length = results.length;
//                if (length === 1) {
//                    string.push(length, " tab in ");
//                } else {
//                    string.push(length, " tabs in ");
//                }

//                var length = list.length;
//                if (length === 1) {
//                    string.push(length, " window)");
//                } else {
//                    string.push(length, " windows)");
//                }

                document.title = string.join("");

                document.body.scrollTop = 0; //* Issue 87

                //search.stop = false;
            }

            state.search = function anon(info) {
                //if (!anon.delay) {
                    //anon.delay = true;

                    info = Object(info);

                    function wrapper() {
                        console.log("Searching.");

                        /*if (array instanceof Array) {
                            search(array);
                        } else {*/
                        search(state.list, info);
                        //}

                        //setTimeout(function () {
                            //anon.delay = false;
                        //}, 0);
                    }

                    if (info.nodelay) {
                        wrapper();
                    } else if (!anon.delay) {
                        clearTimeout(anon.timer);

                        //anon.delay = true;
                        anon.timer = setTimeout(wrapper, 0);

                        //setTimeout(function () {
                            //anon.delay = false;
                        //}, 1000);
                    }
                //}
            };
            //input.addEventListener("keyup", state.search, true);
            //input.addEventListener("click", state.search, true);
            //input.addEventListener("input", state.search, true);
            input.addEventListener("search", function () {
                state.search({ scroll: true, focused: true });
            }, true);

            addEventListener("keydown", function (event) {
                if (event.which === 70 && (event.ctrlKey || event.metaKey)) {
                    if (!event.altKey && !event.shiftKey) {
                        event.preventDefault();
                        input.focus();
                        input.select();
                    }
                }
            }, true);

            span.appendChild(input);

            setTimeout(function () {
                input.focus();
                input.select();
            }, 0);


//            span.appendChild(UI.create("div", function (element) {
//                element.className = "stretch";

                span.appendChild(UI.create("div", function (container) {
                    container.id = "search-past";
                    container.tabIndex = -1;


                    container.addEventListener("focus", function (event) {
                        this.removeAttribute("hidden");
                        input.focus();
                    }, true);


                    input.addEventListener("blur", function () {
                        container.setAttribute("hidden", "");
                    }, true);

        //            input.addEventListener("focus", function () {
        ////                if (!this.value) {
        ////                    container.reset();
        ////                } else if (container.children.length) {
        ////                    container.removeAttribute("hidden");
        ////                }
        //            }, true);


                    //delete localStorage["search.past-queries"];

                    var saved = Options.getObject(localStorage["search.past-queries"]);

                    addEventListener("unload", function () {
                        localStorage["search.past-queries"] = JSON.stringify(saved);
                    }, true);


                    function filter(value, info) {
                        info = Object(info);
                        value = value.toLowerCase();

                        var keys, letter, regexp, special;
            //                var keys = saved[letter];//Object.keys(saved[letter]);
                        //}

                        container.reset();

                        if (info.all) {
                            keys = [];

                            Object.keys(saved).forEach(function (key) {
                                keys = keys.concat(saved[key]);
                            });
                        } else {
                            letter = value[0];
                            if (!saved[letter]) {
                                saved[letter] = [];
                            }
                            keys = saved[letter];//Object.keys(saved[letter]);
                        }

                        if (letter === '"') {
                            regexp = new RegExp("^" + value);
                        } else {
                            regexp = new RegExp("^" + value, "i");
                        }

                        if (precoded[letter]) {
                            special = precoded[letter];
                        } else if (info.all) {
                            special = [];

                            Object.keys(precoded).forEach(function (key) {
                                special = special.concat(precoded[key]);
                            });
                        }

                        //if (info.list) {
                        keys.sort(function (a, b) {
                            return a.length - b.length || a.localeCompare(b);
                        });

                        keys.forEach(function (key) {
        //                    if (container.children.length >= 5) {
        //                        return;
        //                    }

                            if (regexp.test(key)) {
                                container.add(key);
                            }
                        });

                        testSpecial(value);

                        if (special) {
                            special.forEach(function (key) {
        //                        if (container.children.length >= 5) {
        //                            return;
        //                        }

                                if (info.list || regexp.test(key)) {
                                    container.add(key, true);
                                }
                            });
                        }
                        //}

        //                anon.old = value;

        //                if (container.children.length) {
        //                    console.log(anon.old);
        //                    var text = container.firstChild.textContent;
        //                    this.value = text;
        //                    //this.setSelectionRange(anon.old.length, text.length);
        //                }

        //                if (!container.children.length) {
        //                    container.setAttribute("hidden", "");
        //                }
                    }

                    function remove(text) {
                        var letter = text[0];
                        var array = saved[letter];

                        array.remove(text);
                        if (!array.length) {
                            delete saved[letter];
                        }

                        filter(input.value);
                    }

//                    container.addEventListener("mouseout", function anon(event) {
//                        var target = event.target;
//                        console.log(target);
//                        if (target.localName === "td") {
//                            anon.element = target;
//                        }

//                        var related = event.relatedTarget;
//                        //console.log(event.target, related);
//                        if (related && related.className === "past-queries-close") {
//                            return;
//                        } else if (anon.element) {
//                            anon.element.removeAttribute("data-selected");
//                        }
//                    }, true);

//                    var element = container;

                    //container.appendChild(UI.create("div", function (element) {
                        //container.list = element;

                        function mouseover(event) {
    //                        var target = event.target;
    //                        console.log(target.localName);
    //                        if (target.localName !== "td") {
    //                            return;
    //                        }
                            var query = container.querySelector("[data-selected]");
                            if (query) {
                                query.removeAttribute("data-selected");
                            }
                            this.setAttribute("data-selected", "");
                        }
                        function mouseout(event) {
                            this.removeAttribute("data-selected");
                        }

                        function click(event) {
                            switch (event.target.className) {
                            case "past-queries-close":
                                remove(this.text);
                                break;
                            default:
                                input.value = this.text;
                                input.triggerEvent("search", false, false);

                                container.reset();
                            }
                        }

//                        function close(event) {
//                            var query = container.querySelector("[data-selected]");
//                            if (query) {
////                                console.log(query.textContent);
//                                remove(query.textContent);
//                            }
//                            if (target.className !== "past-queries-close") {
//                                return;
//                            }
//                        }

                        container.add = function (name, special) {
                            var item = document.createElement("div");
                            item.className = "search-past-item";
                            item.text = name;

//                            item.addEventListener("overflow", function () {
//                                item.title = name;
//                            }, true);

                            if (special) {
                                item.setAttribute("data-special", "");
//                                item.className += " special";
                            }

//                            item.textContent = name;

                            item.addEventListener("click", click, true);
                            item.addEventListener("mouseover", mouseover, true);
                            item.addEventListener("mouseout", mouseout, true);
    //                        item.addEventListener("mouseout", mouseout, true);

//                            var table = document.createElement("table");
//                            table.className = "search-past-table";

//                            var row = document.createElement("tr");

                            var text = document.createElement("div");
                            text.className = "search-past-item-text";
                            text.textContent = name;

//                            var span = document.createElement("span");
//                            span.textContent = name;
//                            span.style.overflow = "hidden";
//                            span.style.textOverflow = "ellipsis";

//                            var cell = document.createElement("td");
//                            cell.className = "search-past-item-close";

                            var button = document.createElement("img");
                            button.className = "past-queries-close";
    //                        button.style.verticalAlign = "top";
                            button.src = "/images/button-close.png";

//                            button.addEventListener("click", close, true);

    //                        item.addEventListener("click", function (event) {
    //                            console.log(event.target);
    //                        }, true);

                            //button.setAttribute("hidden", "");

//                            text.appendChild(span);
//                            cell.appendChild(button);
                            item.appendChild(text);
                            item.appendChild(button);
//                            table.appendChild(row);
//                            item.appendChild(table);

/*                            item.appendChild(text);
                            item.appendChild(button);
*/
                            container.appendChild(item); //! element

                            container.removeAttribute("hidden");

    //                        console.log(item.offsetHeight);

                            container.style.maxHeight = item.offsetHeight * Options.get("search.show-number") + "px";
                        };

                        container.reset = function () {
                            container.setAttribute("hidden", "");
                            container.innerHTML = ""; //! element
                        };
                        container.reset();
                    //}));

//                    container.addEventListener("click", function (event) {
//                        var target = event.target;

//                        console.log(target);

//                        switch (target.localName) {
//                        case "td":

//                            break;
//                        case "img":

//                        }
//                    }, true);


                    input.addEventListener("mousedown", function (event) {
                        if (event.button !== 0) {
                            return;
                        }
                        if (event.offsetX < 20) {
                            if (this.value) {
                                filter(this.value);
                            } else {
                                filter("", { all: true });
                            }
                        }
                    }, true);

                    input.addEventListener("keydown", function anon(event) {
                        //console.log(event.which, event.keyIdentifier);
                        if (event.which === 38 || event.which === 40) { //* Up/Down
                            event.preventDefault();

                            var next, query = container.querySelector("[data-selected]");

                            if (query) {
                                next = (event.which === 38) ?
                                    query.previousSibling :
                                    query.nextSibling;

                            } else if (event.which === 40) {
                                next = container.firstChild;
                            }

                            if (next) {
                                next.setAttribute("data-selected", "");
                                next.scrollIntoViewIfNeeded(false);

                                if (query) {
                                    query.removeAttribute("data-selected");
                                }
                            }
                        } else if (event.which === 27) { //* Escape
                            if (!container.hasAttribute("hidden")) {
                                event.preventDefault();
                            }

                            container.reset();
                        } else if (event.which === 13) { //* Enter
                            var query = container.querySelector("[data-selected]");
                            if (query) {
                                query.triggerEvent("click", false, false);
                            }
                        } else if (event.which === 46) { //* Delete
                            var query = container.querySelector("[data-selected]");
                            if (query) {
                                event.preventDefault();

                                var next, children = container.children;
                                var index = Array.indexOf(children, query);
                                //console.log(index);
        //                        var next = query.nextSibling;
        //                        if (next) {
        //                            //next.setAttribute("data-selected", "");
        ////                            anon({ which: 40, preventDefault: function () {} });
        ////                            var custom = document.createEvent("KeyboardEvent");
        ////                            custom.initKeyboardEvent("keydown", false, false, null, "Down", 0, "");
        ////                            //custom.initKeyEvent("keydown", false, false, null, false, false, false, false, 40, 0);
        ////                            next.dispatchEvent(custom);
        //                            //next.setAttribute("data-selected", "");
        //                        }
                                //console.log(next);

                                remove(query.textContent);

                                //var old = this.value;
                                //this.value = text;
//                                filter(this.value);
                                //input.triggerEvent("input", false, false);
                                //this.value = old;
                                //query.remove();

                                if (children[index]) {
                                    next = children[index];
                                } else if (children[index - 1]) {
                                    next = children[index - 1];
                                }

                                if (next) {
                                    next.setAttribute("data-selected", "");
                                }
                            }
                        }
                    }, true);

                    input.addEventListener("keyup", function (event) {
                        if (!container.hasAttribute("hidden")) {
                            return;
                        }

                        if (event.which === 40 || event.which === 46) {
                            if (this.value) {
                                filter(this.value);
                            } else {
                                filter("", { all: true });
                            }
                        }

        //                container.reset();

        //                keys.sort(function (a, b) {
        //                    return a.length - b.length || a.localeCompare(b);
        //                });

        //                keys.forEach(function (item) {
        //                    if (container.children.length >= 5) {
        //                        return;
        //                    }
        //                    container.add(item);
        //                });
                    }, true);

        //            input.addEventListener("keydown", function () {
        //
        //            }, true);

                    input.addEventListener("search", function () {
                        if (!this.value || this.value.length < 2) {
                            //container.reset();
                            return;
                        }

                        var value = this.value.toLowerCase();

                        var letter = value[0];
                        if (!saved[letter]) {
                            saved[letter] = [];
                        }
                        var keys = saved[letter];

        //                if (letter === '"') {
        //                    keys.push(value.trim());
        //                } else {
                            keys.push(value.trim());
        //                }


                                    //if (value) {
        //                for (var i = 1; i < value.length; i += 1) {
        //                    var slice = value.slice(0, i);
        //                    if (saved[letter][slice]) {
        //                        delete saved[letter][slice];
        //                    }
        //                }

        //                keys.sort(function (a, b) {
        //                    return a.length - b.length || a.localeCompare(b);
        //                });

                        keys.sort(function (a, b) {
                            return b.localeCompare(a);
                            //return b.length - a.length || a.localeCompare(b);
                        });

        //                console.log(keys);
        //                console.log(keys.sort());

                        keys.forEach(function anon(key, i) {
                            //console.log(key, value);
        //                    if (key === value) {
        //                        saved[letter].splice(i, 1);
        //                    }
        //                    console.log(key, special[letter].indexOf(key));
                            if (precoded[letter]) {
                                if (precoded[letter].indexOf(key) !== -1) {
                                    keys.splice(i, 1);
                                }
                            }

                            if (anon.key) {
                                //console.warn(anon.key, key, anon.key.indexOf(key));
                                if (anon.key.indexOf(key) === 0) {
                                    keys.splice(i, 1);
                                    //delete saved[letter][key];
                                }
                            }
                            anon.key = key;
                            //console.log(anon.key, key);
                            //var index =  || key.indexOf(value) === 0;
        //                    if (key.length > value.length) {
        //                        if (value.indexOf(key) === 0) {
        //                            delete saved[letter][key];
        //                        }
        //                    } else {
        //                        if (key.indexOf(value) === 0) {
        //                            delete saved[letter][value];
        //                        }
        //                    }
                        });

                        if (!keys.length) {
                            delete saved[letter];
                        }
                    }, true);

                    input.addEventListener("input", function () {
                        //console.log("input");
                        filter(this.value);
                    }, true);
                }));
//            }));
        }));
    //}));
/*!
    container.appendChild(UI.create("button", function (button) {
        button.className = "Options-button";
        button.textContent = "Reopen Closed Tab";
        button.tabIndex = 1;
    }));

    container.appendChild(UI.create("button", function (button) {
        button.className = "Options-button";
        button.textContent = "Foo";
        button.tabIndex = 1;
    }));
*/
    //}));
}));


(function () {
    var script = document.createElement("script");
    script.src = "/views/" + Options.get("windows.type") + ".js";

    fragment.appendChild(script);
}());

document.body.appendChild(fragment);

//addEventListener("scroll", function anon(event) {
//    //this.removeEventListener(event.type, anon, true);

//    //setTimeout(function () {
//    //}, 0);
//    //document.scrollLeft = 0; //* Issue 87

//    //event.preventDefault();
//    console.log(event.timeStamp, event.target, document.scrollLeft, document.scrollTop);
//}, true);

//addEventListener("DOMContentLoaded", function (event) {
//    console.log(event.timeStamp, event.type);
//}, true);

addEventListener("load", function (event) { //* Issue 69
    //    console.log(event.timeStamp, event.type);
    Platform.windows.getAll({ populate: true }, function (windows) {
        state.createView(windows);

        Options.event.addListener("change", function (event) {
            if (event.name === "window.lastfocused") {
                if (event.value === null) {
                    action.unselectWindow();
                } else {
                    var item = state.windows[event.value];
                    if (item) {
//                        if (Options.get("popup.type") === "tab") {
                            item.select();
//                        } else {
//                            item.setWindowFocus();
//                        }

                        state.search({
                            focused: Options.get("popup.type") !== "tab",
                            nodelay: true,
                            scroll: true
                        });

        //                Platform.message.connect("lib.action", function (port) {
        //                    port.sendMessage({ type: "focus" });
        //                });
                    }
                }
            }
        });

        Options.event.addListener("change", function (event) {
            var location = (event.name === "tabs.close.location"),
                display = (event.name === "tabs.close.display");

            if (location || display) {
//                console.warn("UPDATING!");
                var query = document.querySelectorAll(".tab");
                for (var i = 0; i < query.length; i += 1) {
                    query[i].updateButtonPositions();
                }
            }
        });

        Options.event.addListener("change", function /*! anon*/(event) {
            if (event.name === "tabs.favorites.urls") {
                //! clearTimeout(anon.timer);

                if (event.action === "delete") {
                    state.tabsByURL[event.value].forEach(function (item) {
                        item.removeAttribute("data-favorited");
                    });
                } else {
                    state.tabsByURL[event.value].forEach(function (item) {
                        item.setAttribute("data-favorited", "");
                    });
                }

                //! anon.timer = setTimeout(function () {
                state.search(/*{ tabs: state.tabsByURL[event.value] }*/);
                //! }, 0);
    //            document.body.setAttribute("hidden", "");
    //            document.body.removeAttribute("hidden");
            }
        });


//        state.saveTitles = function () {
//    //                    Options.event.removeListener("change", update);

//            var list = state.list.map(function (item, i) {
//                var text = item.tabIcon.indexText.value;
//                if (+text === i + 1) {
//                    text = undefined;
//                }
//                return text;
//            });

//            localStorage["window.titles"] = JSON.stringify(list);
//        };
//        addEventListener("unload", state.saveTitles, true);

    //                element.addEventListener("DOMSubtreeModified", state.update, true);
        //element.addEventListener("DOMNodeInserted", state.update, true);
        //element.addEventListener("DOMNodeRemoved", state.update, true);

        //console.log(Object.keys(state.bookmarksByURL).length);

    //    setTimeout(function () {
        state.search({ scroll: true, focused: true, nodelay: true });
    //        scrollTo(0, 0);
    //    }, 0);

    //    document.body.setAttribute("hidden", "");
    //    document.body.removeAttribute("hidden");
    //    document.body.style.margin = "0px";
    //    document.body.style.margin = "";
        //document.body.className += "foo";
    //    getComputedStyle(document.body, null).height;
    //    document.body.style.display = 'none';
    //    document.body.style.display = 'block';
    //    document.body.offsetHeight;
    //    document.body.style.maxHeight = "0px";
    //    document.body.style.maxHeight = "";

    //    var height = document.body.style.height;
    //    document.body.style.height = "0px";
    //    setTimeout(function () {
    //        //document.body.style.height = height;

    //    }, 100);

    //    addEventListener("load", function () {
    ////        alert();
    //        document.body.style.height = Options.get("popup.height") + "px";
    //    }, true);

        state.loaded = true;
    });
}, true);
