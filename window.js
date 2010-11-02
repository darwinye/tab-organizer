"use strict";
/*global action, events, Options, Platform, Tab, UI, Undo, Window */


if (Options.get("popup.type") === "bubble") {
    document.body.style.width = Options.get("popup.width") + "px";
    document.body.style.height = Options.get("popup.height") + "px";
    //document.body.style.overflowY = "hidden";
    //document.body.style.maxWidth = "100%";
}


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

    info.node.value = info.value;
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

Undo.setRule("move-tabs", function (info) {
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
});

//        Undo.setRule("close-tabs", function (info) {
//            Undo.reset();
//        });


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
    titles: Options.getObject(localStorage["window.titles"]),
    //favorites: Options.getObject(localStorage["tabs.favorites.urls"]),
    favorites: Options.get("tabs.favorites.urls"),
    windows: {},
    tabs: {},
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
    list: [],
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

        if (state.focused) {
            state.focused.triggerEvent("blur", false, false);
        }
    }
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
    }
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

fragment.appendChild(UI.create("div", function (container) {
    //element.id = "container-wrapper";

    //element.appendChild(UI.create("div", function (container) {
        container.id = "toolbar";

    //container.appendChild(UI.create("td", function (element) {
        container.appendChild(UI.create("button", function (element) {
            element.id = "button-new-window";
            element.title = "(Ctrl N)";
            element.className = "Options-button";
            element.textContent = "New Window";
            element.tabIndex = 1;

            element.addEventListener("click", function (event) {
                Platform.windows.create({/* url: "chrome://newtab/" */});
            }, true);

            element.addEventListener("dragover", events.disable, true);
            element.addEventListener("dragenter", element.focus, true);

            element.addEventListener("drop", function (event) {
                Window.create(state.currentQueue);
//                Platform.windows.create({ url: "lib/remove.html" }, function (win) {
//                    state.currentQueue.moveTabs(win.id);
//                    state.currentQueue.reset();
//                    delete state.currentQueue.shiftNode;
//                });
            }, true);
        }));

//        container.appendChild(UI.create("span", function (element) {
//            element.className = "separator";
//            //element.textContent = "-";
//        }));

        container.appendChild(UI.create("button", function (element) {
            element.href = "/options.html";
            element.target = "_blank";

            element.className = "Options-link";
            element.textContent = "Options";
            element.tabIndex = 1;

            element.addEventListener("click", function anon() {
//                if (anon.popup) {
//                    anon.popup.close();
//                }
                anon.popup = open(element.href, element.target);
            }, true);
        }));

        container.appendChild(UI.create("span", function (element) {
            element.className = "separator";
            element.textContent = "|";
        }));

        container.appendChild(UI.create("button", function (element) {
            element.href = "http://documentation.tab-organizer.googlecode.com/hg/Tab%20Organizer%20FAQ.html";
            element.target = "_blank";

            element.className = "Options-link";
            element.textContent = "Help";
            element.tabIndex = 1;

            element.addEventListener("click", function anon() {
//                if (anon.popup) {
//                    anon.popup.close();
//                }
                anon.popup = open(element.href, element.target);
            }, true);
        }));
    //}));


    //container.appendChild(UI.create("div", function (element) {
        //element.id = "Undo-wrapper";
        //element.className = "stretch";

        container.appendChild(UI.create("div", function (element) {
            element.id = "Undo-bar";

            element.appendChild(UI.create("div", function (element) {
                element.id = "Undo-bar-div";

                state.undoBar = element;

                element.hide = function (transition) {
                    if (transition !== true) {
                        element.style.webkitTransitionDuration = "0s";

                        setTimeout(function () {
                            element.style.webkitTransitionDuration = "";
                        }, 0);
                    }

                    element.style.opacity = "0 !important";
                    element.style.visibility = "hidden !important";

/*                        state.undoBar.addEventListener("webkitTransitionEnd", function anon(event) {
                        this.removeEventListener(event.type, anon, true);
                        this.style.webkitTransition = "";
                    }, true);*/
                };
                element.hide();

                var timer = {
                    reset: function () {
                        //console.log("Not timing!");
                        clearTimeout(timer.id);
                    },
                    set: function () {
                        //console.log("Timing!");
                        var ms = Options.get("undo.timer") * 1000;
                        timer.id = setTimeout(function () {
                            element.hide(true);
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

                element.show = function (name) {
                    timer.reset();

                    state.undoBar.text = name;

                    element.style.opacity = "";
                    element.style.visibility = "";

                    if (!timer.mouseover) {
                        timer.set();
                    }
                };

                //setTimeout(element.show, 2000);
                //setTimeout(element.hide, 4000);

                /*addEventListener("focus", function (event) {
                    if (event.target !== document.body) {
                        element.hide();
                    }
                }, true);*/

                element.appendChild(UI.create("span", function (element) {
                    Object.defineProperty(state.undoBar, "text", {
                        get: function () {
                            return element.innerHTML;
                        },
                        set: function (value) {
                            element.innerHTML = value;
                        }
                    });
                }));

                element.appendChild(UI.create("button", function (element) {
                    element.id = "Undo-bar-button";
                    element.className = "Options-link";
                    element.title = "(Ctrl Z)";
                    element.textContent = "Undo";
                    element.tabIndex = 1;

                    function undo() {
                        //console.log(state.undoBar.style.opacity);
                        if (!state.undoBar.style.opacity) {
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

            var info = {
                //windows: document.getElementsByClassName("window"),
                //tabs: document.getElementsByClassName("tab"),
                title: document.title
            };

            function search(array, flags) {
                localStorage["search.lastinput"] = input.value;

                //var self = this;

                /*if (search.stop) {
                    console.warn("Stop!");
                    return;
                }
                search.stop = true;*/

                var tabs = Array.slice(document.getElementsByClassName("tab"));
                //var list = [];

                tabs = action.search(tabs, input.value);

                var focused, scroll = [];

                var list = array.filter(function (item) {
                    var children = item.tabList.children;
                    item.setAttribute("hidden", "");
                    item.removeAttribute("data-last");

                    Array.slice(children).forEach(function (child) {
                        if (child.hasAttribute("data-focused")) {
                            /*setTimeout(function () {
                                UI.scrollTo(child, item.tabList);
                            }, 0);*/
                            item.selected = child;
                        }
                        if (tabs.indexOf(child) !== -1) {
                            child.removeAttribute("hidden");
                            item.removeAttribute("hidden");
                        } else {
                            child.setAttribute("hidden", "");
                        }
                    });

                    if (flags.focused) {
                        var last = Options.get("window.lastfocused");
                        var win = item.window;

                        if (win.focused || last === win.id) {
                            focused = item;
                        }
                    }

                    if (!item.hasAttribute("hidden")) {
                        //list.push(item);
                        //var child = item.querySelector("[data-focused]");
                        if (flags.scroll) {
                            scroll.push(item);
                        }
//                        if (flags.scroll) {
//                            //UI.scrollTo(item.selected, item.tabList);
//                        }
                        return true;
                    }
                });

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

                var string = [ info.title, " (" ];

                if (tabs.length === 1) {
                    string.push(tabs.length, " tab in ");
                } else {
                    string.push(tabs.length, " tabs in ");
                }

                if (list.length === 1) {
                    string.push(list.length, " window)");
                } else {
                    string.push(list.length, " windows)");
                }

                document.title = string.join("");

                document.body.scrollTop = 0; //* Issue 87

                //search.stop = false;
            }

            state.search = function (info) {
                console.log("Searching.");

                /*if (array instanceof Array) {
                    search(array);
                } else {*/
                search(state.list, Object(info));
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

                    var precoded = {
                        "i": ["inurl:", "intitle:", "is:image", "is:favorite", "is:selected"],
                        "s": ["same:url", "same:title", "same:domain"],
                        "w": ["window:", "window:focused"]
                    };


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

                        if (special) {
                            var is = special.some(function (item) {
                                return item === value;
                            });

                            if (is) {
                                input.setAttribute("special", "");
                            } else {
                                input.removeAttribute("special");
                            }

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
                                item.className += " special";
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

fragment.appendChild(UI.create("div", function (element) {
    element.id = "window-list";
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
        var fragment = document.createDocumentFragment();

    //    element.appendChild(UI.create("td"));
        windows.forEach(function (win) {
            if (win.type === "normal") {
                fragment.appendChild(Window.proxy(win));
            }
        });
    //    element.appendChild(UI.create("td"));

        state.windowList.appendChild(fragment);

        Options.event.addListener("change", function (event) {
            if (event.name === "window.lastfocused") {
                if (event.value === null) {
                    action.unselectWindow();
                } else {
                    var item = state.windows[event.value];
                    if (item) {
                        item.setWindowFocus();
                        state.search();

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

        Options.event.addListener("change", function (event) {
            if (event.name === "tabs.favorites.urls") {
                if (event.action === "delete") {
                    state.tabsByURL[event.value].forEach(function (item) {
                        item.removeAttribute("data-favorited");
                    });
                } else {
                    state.tabsByURL[event.value].forEach(function (item) {
                        item.setAttribute("data-favorited", "");
                    });
                }
                state.search();
    //            document.body.setAttribute("hidden", "");
    //            document.body.removeAttribute("hidden");
            }
        });

        state.saveTitles = function () {
    //                    Options.event.removeListener("change", update);

            var list = state.list.map(function (item) {
                return item.tabIcon.indexText.value;
            });

            localStorage["window.titles"] = JSON.stringify(list);
        };
        addEventListener("unload", state.saveTitles, true);

    //                element.addEventListener("DOMSubtreeModified", state.update, true);
        //element.addEventListener("DOMNodeInserted", state.update, true);
        //element.addEventListener("DOMNodeRemoved", state.update, true);

    //    setTimeout(function () {
        state.search({ scroll: true, focused: true });
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
    });
}, true);
