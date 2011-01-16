/*global action, events, localStorage, Options, Platform, Queue, Tab, UI, Undo, Window */
"use strict";

if (Options.get("popup.type") === "bubble") {
    document.body.style.width = Options.get("popup.width") + "px";
    document.body.style.height = Options.get("popup.height") + "px";
}


var state = {
    titles: Options.get("windows.titles"),
    macros: Options.get("macros.list"),
    favorites: Options.get("tabs.favorites.urls"),
    list: [],
    windows: {},
    bookmarksByID: {},
    bookmarksByURL: {},
    tabsByID: {},
    tabsByURL: {},
    visitedByURL: Options.get("tabs.visited.byURL"),
//    indent: Options.get("windows.indent-level"),
//    indentByID: {},

    /*queues: {
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
    },*/

    sortWindows: (function () {
        function rearrange() {
            var fragment = document.createDocumentFragment();
            state.sorted.forEach(function (item) {
//                state.windowList.appendChild(item);
                fragment.appendChild(item);
            });
            state.windowList.appendChild(fragment);
        }

        function sort(func) {
            state.sorted = state.list.slice().sort(func);
            rearrange();
        }

        var sorters = {
            "date-created": function () {
                state.sorted = state.list;
                rearrange();
    //                            console.log(state.list);
//                Options.set("windows.sort.type", "date-created");
            },
            "tab-number": function () {
                sort(function (a, b) {
                    return b.tabList.children.length -
                           a.tabList.children.length;
                });
            },
            /*"starting-tab": function () {
                sort(function (a, b) {
                    return b.
                });
            }*/
        };

        var hooks = {
            "tab-number": function () {
                Platform.event.on("tab-create", sorters["tab-number"]);
                Platform.event.on("tab-remove", sorters["tab-number"]);
                Platform.event.on("tab-attach", sorters["tab-number"]);
            }
        };

        return function (name) {
            Platform.event.remove("tab-create", sorters["tab-number"]);
            Platform.event.remove("tab-remove", sorters["tab-number"]);
            Platform.event.remove("tab-attach", sorters["tab-number"]);

            if (hooks[name]) {
                hooks[name]();
            }

            if (sorters[name]) {
                sorters[name]();
                Options.set("windows.sort.type", name);
            }
        };
    }()),

    createSearchList: function () {
        return Array.slice(document.getElementsByClassName("tab"));
    },

    createView: function (windows) {
        var fragment = document.createDocumentFragment();

        windows.forEach(function (win) {
            if (win.type === "normal") {
                fragment.appendChild(Window.proxy(win));
            }
        });

        state.windowList.appendChild(fragment);
    },

    urlBar: UI.create("div", function (container) {
        container.id = "URL-bar";
        container.setAttribute("hidden", "");
        document.body.appendChild(container);
    }),

    placeholder: UI.create("div", function (container) {
        container.id = "placeholder";
    })
};

state.sorted = state.list;


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
    }
};


if (localStorage["window.titles"]) {
    state.titles.push.apply(state.titles, Options.getObject(localStorage["window.titles"]));
    delete localStorage["window.titles"];

    state.titles.forEach(function (item, i) {
        if (+item === i + 1) {
            delete state.titles[i];
        }
    });
}


(function () {
    Undo.setRule("new-tab", function (info) {
        Platform.tabs.remove(info.tab);
        Undo.reset();
    });

    Undo.setRule("rename-window", function (info) {
        state.titles[info.index] = info.node.value = info.value;
        info.node.select();
        Undo.reset();
    });

    Undo.setRule("select-tabs", function (info) {
        info.list.forEach(function (item) {
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
            Queue.sync(function (queue) {
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
}());


Platform.bookmarks.getTree(function recurse(array) {
    var url = state.bookmarksByURL;
    array.forEach(function (item) {
        if (item.children) {
            recurse(item.children);
        } else {
            state.bookmarksByID[item.id] = item;
            url[item.url] = url[item.url] + 1 || 1;
        }
    });

    if (state.loaded) {
        state.search();
        //! state.search({ scroll: true, focused: true, nodelay: true });
    }
});

Platform.event.on("bookmark-change", function (id, info) {
    var bookmark = state.bookmarksByID[id],
        url = state.bookmarksByURL;

    if (info.url) {
        url[bookmark.url] -= 1;
        bookmark.title = info.title;
        bookmark.url = info.url;
        url[info.url] = url[info.url] + 1 || 1;

        state.search();
    }
});

Platform.event.on("bookmark-create", function (id, bookmark) {
    var url = state.bookmarksByURL;
    if (bookmark.url) {
        state.bookmarksByID[id] = bookmark;
        url[bookmark.url] = url[bookmark.url] + 1 || 1;
        state.search({ tabs: state.tabsByURL[bookmark.url] });
    }
});

Platform.event.on("bookmark-remove", function (id, info) {
    var bookmark = state.bookmarksByID[id];
    if (bookmark) {
        state.bookmarksByURL[bookmark.url] -= 1;
        delete state.bookmarksByID[id];
        state.search({ tabs: state.tabsByURL[bookmark.url] });
    }
});


//document.body.tabIndex = -1;

//addEventListener("focus", function (event) {
//    var target = event.target;

////    console.log(event.type, target);

//    if (target.setAttribute) {
//        target.setAttribute("data-selected", "");
//    }

////    if (!state.focused && state.windowList) {
////        if (state.windowList.contains(target)) {
////            state.focused = target;
////        }
////    }

//    if (target !== this) {
//        if (state.focused === target) {
////            delete state.focused;
//        } else if (target.triggerEvent) {
//            target.triggerEvent("KAE-user-focus", false, false);
//            state.focused = target;
//            console.log(event.type, state.focused);
//        }
//    }

////    if (target === this) {
////        delete state.focused;
////    } else if (state.windowList) {

////    }

////    if (target === state.focused) {
////        delete state.focused;
////    } else if (state.windowList) {

////    }

////    if (target === this && state.focused) { //! Fixes a bug with the window titles.
////        var focused = state.focused;
////        delete state.focused;
////        focused.triggerEvent("blur", false, false);
////        delete state.focused;
////    }
//}, true);

//addEventListener("blur", function anon(event) {
//    var target = event.target;

//    if (target.removeAttribute) {
//        target.removeAttribute("data-selected");
//    }

////    if (target !== this && state.focused === target) {
////        if (target.triggerEvent) {
////            target.triggerEvent("KAE-user-blur", false, false);
////            delete state.focused;
////            console.log(event.type, state.focused);
////        }
////    }
//    if (target.triggerEvent) {
//        target.triggerEvent("KAE-user-blur", false, false);
//    }

//    if (state.focused) {
//        if (target === this) {
//            var focused = state.focused;
//    //            delete state.focused;
//            focused.triggerEvent("KAE-user-focus", false, false);
//    //            delete state.focused;
//    //        console.log(state.focused);
//        }// else {
////            delete state.focused;
////        }
//        delete state.focused;
//    }

////    if (target === state.focused) {
////        console.log(event.type, target);
////        delete state.focused;
////    } else if (target === this && state.focused) {
////        var focused = state.focused;
//////            delete state.focused;
////        focused.triggerEvent("focus", false, false);
//////            delete state.focused;
//////        console.log(state.focused);
////    } else if (state.windowList.contains(target)) {
////        state.focused = target;

////        removeEventListener(event.type, anon, true);

////        function blur(event) {

////        }
////        function focus(event) {
////            removeEventListener("blur", blur, true);
////            removeEventListener("focus", focus, true);
////            addEventListener(event.type, anon, true);
////        }
////        addEventListener("blur", blur, true);
////        addEventListener("focus", focus, true);
////    }// else {
//////            delete state.focused;
//////        }
//}, true);


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

fragment.appendChild(UI.create("div", function (container) {
    container.id = "toolbar";

    container.appendChild(UI.create("button", function (element) {
        element.id = "button-menu";
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


            menu.addItem("<u>N</u>ew Window", {
                keys: ["N"],
                ondrop: function () {
                    Window.create(state.currentQueue);
                },
                action: function () {
                    Platform.windows.create({});
                }
            });

            menu.space();

            menu.submenu("<u>S</u>ort windows by...", {
                keys: ["S"],
                onopen: function (menu) {
                    menu.clear();

                    var keys = {
                        "date-created": "<u>D</u>ate created",
                        "tab-number": "<u>N</u>umber of tabs"
                    };

                    var type = Options.get("windows.sort.type");
                    keys[type] = "<strong>" + keys[type] + "</strong>";

                    function item(name, key) {
                        menu.addItem(keys[name], {
                            keys: [key],
                            action: function () {
                                state.sortWindows(name);
                            }
                        });
                    }

                    item("date-created", "D");
                    item("tab-number", "N");
                }
            });

            menu.separator();


            var perform = (function () {
                function go(macro, info) {
                    info.tabs = info.tabs || Array.slice(document.getElementsByClassName("tab"));

                    if (macro.search) {
//                        var results = action.parse(macro.search)(info.tabs);
                        var results = action.search(info.tabs, macro.search);

//                        action.search = function (array, string) {
//                            return action.parse(string)(array);
//                        };

                        if (results.length) {
                            switch (macro.action) {
                            case "require": //* FALLTHRU
                            case "move":
                                if (macro.window) {
                                    var first = state.list.find(function (item) {
                                        return item.tabIcon.indexText.value === macro.window;
                                    });

                                    if (first) {
                                        var moved = results.moveTabs(first.window.id, null, false);//!info.moved);

                                        info.moved = info.moved.concat(moved);

                                        if (macro.action === "require") {
                                            var odd = Array.slice(first.tabList.children);

                                            odd = odd.filter(function (item) {
                                                return info.tabs.indexOf(item) !== -1 && results.indexOf(item) === -1;
                                            });

                                            if (odd.length) {
                                                info.makeNew = info.makeNew.concat(odd);
                                            }
                                        }
                                    } else {
                                        Window.create(results, { title: macro.window, undo: false });

                                        info.moved = info.moved.concat(results);
                                    }
                                } else {
                                    Window.create(results, { undo: false });

                                    info.moved = info.moved.concat(results);
                                }
                                break;
                            case "close":
                                results.forEach(function (item) {
                                    Platform.tabs.remove(item.tab);
                                });

                                info.closed = info.closed.concat(results);
                            }


                            info.makeNew = info.makeNew.filter(function (item) {
                                return results.indexOf(item) === -1;
                            });

                            info.tabs = info.tabs.filter(function (item) {
                                return results.indexOf(item) === -1;
                            });
                        }
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

                        text.push(item.action);

                        if (item.search) {
                            text.push("<strong>" + item.search + "</strong>");
                        } else {
                            text.push("all tabs");
                        }

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
    }));


    container.appendChild(UI.link(function (element) {
        element.href = "/options.html";
        element.target = "_blank";
        element.textContent = "Options";
        element.tabIndex = 1;
    }));

    container.appendChild(UI.create("span", function (element) {
        element.className = "separator";
        element.textContent = "|";
    }));

    container.appendChild(UI.link(function (element) {
        element.href = "http://documentation.tab-organizer.googlecode.com/hg/Tab%20Organizer%20FAQ.html";
        element.target = "_blank";

        element.textContent = "FAQ";
        element.tabIndex = 1;
    }));


    container.appendChild(UI.create("div", function (element) {
        element.id = "Undo-bar";

        element.appendChild(UI.create("div", function (container) {
            container.id = "Undo-bar-div";

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
            };
            container.hide();

            var timer = {
                reset: function () {
                    clearTimeout(timer.id);
                },
                set: function () {
                    var ms = Options.get("undo.timer") * 1000;

                    timer.id = setTimeout(function () {
                        container.hide(true);
                    }, ms);
                }
            };

            addEventListener("mouseover", function (event) {
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
                element.title = "(Ctrl Z)";
                element.textContent = "Undo";
                element.tabIndex = 1;

                var should = true;

                container.show = function (name, info) {
                    timer.reset();

                    info = Object(info);

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
                        container.hide();

                        setTimeout(function () {
                            state.undoBar.text = name;

                            container.style.opacity = "";
                            container.style.visibility = "";
                        }, 100);
                    }

                    if (!timer.mouseover) {
                        timer.set();
                    }
                };

                function undo() {
                    if (should && !state.undoBar.style.opacity) {
                        state.undoBar.hide();
                        Undo.pop();
                    }
                }
                element.addEventListener("click", undo, true);

                addEventListener("keyup", function (event) {
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


    container.appendChild(UI.create("div", function (span) {
        span.id = "search-box";

        var input = document.createElement("input");
        input.setAttribute("spellcheck", "false");
        input.setAttribute("results", "");
//        input.setAttribute("autosave", Platform.getURL(""));
        input.setAttribute("incremental", "");
        input.setAttribute("placeholder", "Search");

        input.title = "(Ctrl F)";
        input.type = "search";
//        input.name = "s"
        input.tabIndex = 1;


        var lastinput = localStorage["search.lastinput"];
        if (typeof lastinput === "string") {
            input.value = lastinput;
        }

        var cache = {
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

            testSpecial(input.value);

            if (!cache.filter || cache.input !== input.value) {
                cache.filter = action.parse(input.value);
                cache.input = input.value;
            }

            var array = state.createSearchList();

            var results = cache.filter(array);
            var focused, scroll = [];

            results.forEach(function (child) {
                var item = child.parentNode.container;
//!                    item.setAttribute("data-shouldshow", "");

                if (child.hasAttribute("data-focused")) {
                    item.selected = child;
                }

                child.removeAttribute("hidden");
            });

            results.inverse.forEach(function (child) {
                child.setAttribute("hidden", "");
            });

            var list = windows.filter(function (item) {
                item.removeAttribute("data-last");

//                item.update();

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

                        if (win.focused || (!focused && last === win.id)) {
                            focused = item;
                        }
                    }

                    if (info.scroll) {
                        scroll.push(item);
                    }
                } else { //* Fixes windows showing up even when empty.
//!                        var children = Array.slice(item.tabList.children);

//!                        var test = children.every(function (child) {
//!                            return child.hasAttribute("hidden");
//!                        });

//!                        if (test) {
                    item.setAttribute("hidden", "");
//!                        }
                }

                return test;
//!                    return !item.hasAttribute("hidden");
            });


            if (list.length) {
                var last = list[list.length - 1];
                last.setAttribute("data-last", "");
//                last.update();
            }

            if (focused) {
                focused.setWindowFocus();
            }
            scroll.forEach(function (item) {
                if (item.selected) {
                    UI.scrollTo(item.selected, item.tabList);
                }
            });


            var length, string = [ cache.title, " (" ];

            length = results.length;
            string.push(length, (length === 1)
                                  ? " tab in "
                                  : " tabs in ");

            length = list.length;
            string.push(length, (length === 1)
                                  ? " window)"
                                  : " windows)");

            document.title = string.join("");


            if (Options.get("windows.type") === "horizontal") {
                document.body.scrollTop = 0; //* Issue 87
            }
        }

        state.search = function anon(info) {
            info = Object(info);

            function wrapper() {
                console.log("Searching.");

                search(state.sorted, info);
            }

            if (info.nodelay) {
                wrapper();
            } else {//if (!anon.delay) {
                clearTimeout(anon.timer);

                anon.timer = setTimeout(wrapper, 0);
            }
        };

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
//        return;


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


            var saved = Options.getObject(localStorage["search.past-queries"]);

            addEventListener("unload", function () {
                localStorage["search.past-queries"] = JSON.stringify(saved);
            }, true);


            function filter(value, info) {
                info = Object(info);
                value = value.toLowerCase();

                var keys, letter, regexp, special;

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
                    keys = saved[letter];
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

                keys.sort(function (a, b) {
                    return a.length - b.length || a.localeCompare(b);
                });

                keys.forEach(function (key) {
                    if (regexp.test(key)) {
                        container.add(key);
                    }
                });

                testSpecial(value);

                if (special) {
                    special.forEach(function (key) {
                        if (info.list || regexp.test(key)) {
                            container.add(key, true);
                        }
                    });
                }
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


            function mouseover(event) {
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
                if (event.target.className === "past-queries-close") {
                    remove(this.text);
                } else {
                    input.value = this.text;
                    input.triggerEvent("search", false, false);

                    container.reset();
                }
            }


            container.add = function (name, special) {
                var item = document.createElement("div");
                item.className = "search-past-item";
                item.text = name;

                if (special) {
                    item.setAttribute("data-special", "");
                }

                item.addEventListener("click", click, true);
                item.addEventListener("mouseover", mouseover, true);
                item.addEventListener("mouseout", mouseout, true);


                var text = document.createElement("div");
                text.className = "search-past-item-text";
                text.textContent = name;


                var button = document.createElement("img");
                button.className = "past-queries-close";
                button.src = "/images/button-close.png";


                item.appendChild(text);
                item.appendChild(button);

                container.appendChild(item); //! element
                container.removeAttribute("hidden");

                container.style.maxHeight = item.offsetHeight * Options.get("search.show-number") + "px";
            };

            container.reset = function () {
                container.setAttribute("hidden", "");
                container.innerHTML = ""; //! element
            };
            container.reset();


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
                var next, query;

                if (event.which === 38 || event.which === 40) { //* Up/Down
                    event.preventDefault();

                    query = container.querySelector("[data-selected]");

                    if (query) {
                        next = (event.which === 38
                                 ? query.previousSibling
                                 : query.nextSibling);

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
                    query = container.querySelector("[data-selected]");
                    if (query) {
                        query.triggerEvent("click", false, false);
                    }
                } else if (event.which === 46) { //* Delete
                    query = container.querySelector("[data-selected]");
                    if (query) {
                        event.preventDefault();

                        var children = container.children;
                        var index = Array.indexOf(children, query);

                        remove(query.textContent);

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
            }, true);


            input.addEventListener("search", function () {
                if (!this.value || this.value.length < 2) {
                    return;
                }

                var value = this.value.toLowerCase();

                var letter = value[0];

                if (!saved[letter]) {
                    saved[letter] = [];
                }

                var keys = saved[letter];

                keys.push(value.trim());

                keys.sort(function (a, b) {
                    return b.localeCompare(a);
                });

                keys.forEach(function anon(key, i) {
                    if (precoded[letter]) {
                        if (precoded[letter].indexOf(key) !== -1) {
                            keys.splice(i, 1);
                        }
                    }

                    if (anon.key) {
                        if (anon.key.indexOf(key) === 0) {
                            keys.splice(i, 1);
                        }
                    }
                    anon.key = key;
                });

                if (!keys.length) {
                    delete saved[letter];
                }
            }, true);

            input.addEventListener("input", function () {
                filter(this.value);
            }, true);
        }));
    }));
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
}));


(function () {
    var script = document.createElement("script");
    script.src = "/views/" + Options.get("windows.type") + ".js";

//    Options.event.on("change", function (event) {
//        if (event.name === "windows.type") {
//            script.src = "/views/" + event.value + ".js";
//        }
//    });

    fragment.appendChild(script);
}());

document.body.appendChild(fragment);


(function () {
    var windows = Platform.windows.getAll();

    function init() {
    //
    //    windows.forEach(function (win) {
    //        win.tabs.forEach(function (tab) {
    //            indentByID[tab.id] = indent[tab.globalIndex];
    //        });
    //    });
    //
    //    ({ populate: true }, function (windows) {
        state.createView(windows);

        var type = Options.get("windows.sort.type");
        if (type !== "date-created") {
            state.sortWindows(type);
        }

        Options.event.on("change", function (event) {
            if (event.name === "windows.sort.type") {
    //                console.log("foo!");
                state.search({ scroll: true, focused: true, nodelay: true });
            }
        });
    //
    //        state.list.forEach(function (item) {
    //            item.update();
    //        });

        Options.event.on("change", function (event) {
            if (event.name === "window.lastfocused") {
                if (event.value === null) {
                    action.unselectWindow();
                } else {
                    var item = state.windows[event.value];
                    if (item) {
                        item.select();

                        state.search({
                            focused: Options.get("popup.type") !== "tab",
                            nodelay: true,
                            scroll: true
                        });
                    }
                }
            }
        });

        Options.event.on("change", function (event) {
            var location = (event.name === "tabs.close.location"),
                display = (event.name === "tabs.close.display");

            if (location || display) {
                var query = document.querySelectorAll(".tab");
                for (var i = 0; i < query.length; i += 1) {
                    query[i].updateButtonPositions();
                }
            }
        });

        Options.event.on("change", function /*! anon*/(event) {
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
                state.search();
                //! }, 0);

                document.body.setAttribute("hidden", "");
                document.body.removeAttribute("hidden");
    //
    //                document.body.style.display = "none !important";
    //                document.body.style.display = "";
            }
        });


        state.search({ scroll: true, focused: true, nodelay: true });

        state.loaded = true;
    //    });
    }

    if (windows.length) {
        addEventListener("load", init, true); //* Issue 69
    } else {
        Platform.event.on("load", init);
    }
}());
