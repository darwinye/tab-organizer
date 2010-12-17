"use strict";
/*global Options, Platform, state, Tab, UI, Window */

var events = {
    disable: function (event) {
        event.preventDefault();
    },
    stop: function (event) {
        event.stopPropagation();
    }
};

var action = {
    search: (function () {
        //! var state = {};

        /*! function removeParentheses(string) {
            return Object(/^\((\S+)\)$/.exec(string))[1];
        }*/

        function defaultSearch(array, match) {
            var regexp = new RegExp(match.escape(), "i");
            return array.filter(function (item) {
                return regexp.test(item.tab.title) || regexp.test(item.tab.url);
            });
        }

        /*! function resetAllTabs(array) {
            array.forEach(function (item) {
                item.tabText.textContent = item.tab.title || item.tab.url;
            });
            delete state.shouldReset;
        }*/

        function findCaller(string, keywords, ignore) {
            for (var i = 1; i <= string.length; i += 1) {
                var slice = string.slice(0, i);

                if (ignore) {
                    var test = ignore.some(function (item) {
                        return item === slice;
                    });

                    if (test) {
                        return function (array) {
                            return [];
                        };
                    }
                }

                var action = keywords[slice];
                if (typeof action === "function") {
                    var match = string.slice(i);

                    return function (array) {
                        var result = action(array, match, ignore);
                        if (result !== null) {
                            return result;
                        } else {
                            return defaultSearch(array, string);
                        }
                    };
                }
            }
            return function (array) {
                return defaultSearch(array, string);
            };
        }

//!!!!!!
/*
        var parser = new Parser();

        parser.prefix('"', 100, {
            type: "exact",
            parse: parser.match('"')
        });

        parser.prefix("(", 90, {
            parse: parser.match(")")
        });

        parser.infix(" ", 80, { type: "AND" });

        parser.infix("OR", 70, { type: "OR" });

        parser.infix("|", 70, { type: "OR" });

        parser.prefix("-", 60, { type: "NOT" });

        parser.symbol("is:image", 50, {
            run: function (array, match) {
                //if (match) { return null; }

                //! var url = /\.(bmp|gif|jpe?g|mng|a?png|raw|tga|tiff?)(?=\?|$)/i;
                var title = /\(\d+×\d+\)$/;
                var url = /\.\w+(?=\?|$)/;
                return array.filter(function (item) {
                    return url.test(item.tab.url) && title.test(item.tab.title);
                });
            }
        });

        parser.symbol("is:selected", 50, {});

        parser.symbol("same:url", 50, {});

        parser.symbol("same:title", 50, {});

        parser.prefix("inurl:", 50, {
            parse: parser.match("(value)")
        });

        parser.prefix("intitle:", 50, {
            parse: parser.match("(value)")
        });
*/
//!!!!!!

//        parser.prefix("window:", 50, {
//            parse: function (info) {
//                this.values = [];
//                this.values.push(this);
//                this.values.push(parser.value(0));
//            }
//        });

        var keywords = {
            /*! "\"": function (array, match) {
                if ((match = /([^"]+)"/.exec(match))) {
                    return defaultSearch(array, match[1].replace(/\\(\s+)/g, "$1"));
                }
                return array;
            },*/
            "-": function (array, match, ignore) {
                if (!match) { return null; }

                var normal = findCaller(match, keywords, ignore)(array);
                return array.filter(function (item) {
                    return normal.indexOf(item) === -1;
                });
            },
            "has:bookmark": function (array, match) {
                if (match) { return null; }

                return array.filter(function (item) {
                    return state.bookmarksByURL[item.tab.url] > 0;
                });
            },
            "has:macro": function (array, match) {
                if (match) { return null; }

                var macros = [];

                var info = {
                    ignore: ["has:macro"]
                };

                state.macros.forEach(function (item) {
                    macros = macros.concat(action.search(array, item.search, info));
                });

                array = array.filter(function (item) {
                    return macros.indexOf(item) !== -1;
                });

//                console.log(macros.length, array.map(function (item) {
//                    return item.tab.title + " " + item.tab.url + "\n";
//                }));

                return array;
            },
            "is:favorite": function (array, match) {
                if (match) { return null; }

                return array.filter(function (item) {
                    return item.hasAttribute("data-favorited");
                });
            },
            "is:image": function (array, match) {
                if (match) { return null; }

                //! var url = /\.(bmp|gif|jpe?g|mng|a?png|raw|tga|tiff?)(?=\?|$)/i;
                var title = /\(\d+×\d+\)$/;
                var url = /\.\w+(?=\?|$)/;
                return array.filter(function (item) {
                    return url.test(item.tab.url) && title.test(item.tab.title);
                });
            },
            /*! "is:vector": function (array, match) {
                if (match) { return null; }

                var regexp = /\.(odg|pdf|svg|swf|vml)(?=\?|$)/i;
                return array.filter(function (item) {
                    return regexp.test(item.tab.url);
                });
            },*/
            "is:selected": function (array, match) {
                if (match) { return null; }

                return array.filter(function (item) {
                    return item.hasAttribute("data-selected");
                });
            },
            "inurl:": function (array, match) {
                if (!match) { return null; }

                var regexp = new RegExp(match.escape(), "i");
                return array.filter(function (item) {
                    return regexp.test(item.tab.url);
                });
            },
            "intitle:": function (array, match) {
                if (!match) { return null; }

                var regexp = new RegExp(match.escape(), "i");
                return array.filter(function (item) {
                    return regexp.test(item.tab.title);
                });
            },
            /*! "bookmark:": function (array, match) {
                var bookmarks = Platform.bookmarks.search(match, function (matches) {
                    console.log(matches);
                });
                return array;
                return array.filter(function (item) {
                    return regexp.test(item.tab.title);
                });
            },*/
            "same:url": function (array, match) {
                if (match) { return null; }

                var data = {};
                var regexp = /^([^#]+?)\/?(#.*)?$/;

                array.forEach(function (item) {
                    var url = regexp.exec(item.tab.url)[1];
                    //console.log(url);
                    data[url] = data[url] + 1 || 1;
                });

                return array.filter(function (item) {
                    var url = regexp.exec(item.tab.url)[1];
                    return data[url] > 1;
                });
            },
            "same:title": function (array, match) {
                if (match) { return null; }

                var data = {};

                array.forEach(function (item) {
                    data[item.tab.title] = data[item.tab.title] + 1 || 1;
                });

                return array.filter(function (item) {
                    return data[item.tab.title] > 1;
                });
            },
            "same:domain": function (array, match) {
                if (match) { return null; }

                var data = {};
                var regexp = /^[^:]+:\/\/([^\/]*)/;

                array.forEach(function (item) {
                    var url = regexp.exec(item.tab.url)[1];
                    //console.log(url);
                    data[url] = data[url] + 1 || 1;
                });

                return array.filter(function (item) {
                    var url = regexp.exec(item.tab.url)[1];
//                    if (data[url] > 1) {
//                        console.log(url);
//                    }
                    return data[url] > 1;
                });
            },
            /*! "is:crashed": function (array, match) {
                if (match) { return null; }


            },*/
            "window:": function (array, match) {
                if (!match) { return null; }

                array = match.split(/,/).map(function (match) {
                    //! match = removeParentheses(match);

                    var items, split = match.split(/\-/);

                    if (split[0]) {
                        var min = new RegExp("^" + split[0].escape(), "i");

                        if (split[1]) {
                            var max = new RegExp("^" + split[1].escape(), "i");

                            var focused =
                                (split[0] === "focused") ||
                                (split[1] === "focused");

                            //if (split[0] === "focused") {
                            items = state.list.range(function (item) {
                                var name = item.tabIcon.indexText.value;

                                if (focused && item.hasAttribute("data-focused")) {
                                    return true;
                                } else if (min && min.test(name)) {
                                    min = null;
                                    return true;
                                } else if (max && max.test(name)) {
                                    max = null;
                                    return true;
                                }
                            });
//                            } else if (split[1] === "focused") {
//                                items = state.list.range(function (item) {
//                                    var name = item.tabIcon.indexText.value;
//                                    if (min && min.test(name)) {
//                                        min = null;
//                                        return true;
//                                    } else if (item.hasAttribute("data-focused")) {
//                                        return true;
//                                    }
//                                });
//                            } else {
//                                items = state.list.range(function (item) {
//                                    var name = item.tabIcon.indexText.value;
//                                    if (min && min.test(name)) {
//                                        min = null;
//                                        return true;
//                                    } else if (max && max.test(name)) {
//                                        max = null;
//                                        return true;
//                                    }
//                                });
//                            }
                        } else if (split[0] === "focused") {
                            items = state.list.filter(function (item) {
                                return item.hasAttribute("data-focused");
                            });
                        } else {
                            items = state.list.filter(function (item) {
                                return min.test(item.tabIcon.indexText.value);
                            });
                        }
                    } else {
                        return [];
                    }

                    var tabs = items.map(function (item) {
                        item = Array.slice(item.tabList.children);

                        return item.filter(function (item) {
                            return array.indexOf(item) !== -1;
                        });
                    });

                    return tabs.concat.apply([], tabs);
                });

                return array.concat.apply([], array);
            }/*! ,
            "show:url": function (array, match) {
                if (!match) {
                    array.forEach(function (item) {
                        item.tabText.textContent = item.tab.url;
                    });
                    state.shouldReset = true;
                }
                return array;
            }*/
        };

        /*!

        "foo OR bar" OR qux corge
           >    <  >    < > <
           > <> <         > <
                   >    < > <

        ("foo OR bar") OR ("qux" AND "corge")
        ["foo OR bar", " OR qux corge"]
        ["", "qux corge"]
        ["qux", "corge"]


        name | name name
        (name OR (name AND name))

        (name | name) name
        ((name OR name) AND name)

        name: {
            OR: {
                name: {
                    AND: {
                        name
                    }
                }
            }
        }



        "foo OR bar" qux
           >    <  > <
           > <> <  > <
                   > <

        ("foo OR bar" AND qux)
        ["foo OR bar", " qux"]
        ["", "qux"]

        */

//        var lexer = new RegExp([
//            ///"/.source,
//            ///([^\s"]*(?=")(?:[^"\n\\]|\\[\s\S])*(?="))/.source,
//            /"((?:[^"\n\\]|\\[\s\S])*)"/.source,
//            /\s*(\s(?:\||OR)\s)\s*/.source,
//            /(\s)\s*/.source
//            ///(.*)/.source
//        ].join("|"));

        //! console.log(lexer);

/*!
        goo OR vid

        array = array;
        array = array(goo)
        OR
        array = array + array(vid)


        goo vid

        array = array;
        array = array(goo)
        AND
        array = array(vid)


        goo vid OR foo

        array(goo, [vid, foo])

        [[goo, vid], [foo]]
        [[goo], [vid, foo]]


        array = array;
        array = array(goo)
        AND
        array = array(vid)
        OR
        array = array + array(foo)
*/


        /*symbol(" OR ");
        symbol(" ");

        prefix("window:", function () {

        });*/

//!!!!!!
        var queries = [
            [/^inurl:(?=\S)/, function (array, match) {
                //var value = new RegExp(match.escape(), "i");
                return array.filter(function (item) {
                    return match.some(function (value) {
                        value.test(item.tab.url);
                    });
                });
            }]
        ];

        var rules = (function () {
            var scope = [];
            var items = [];

            function blank() {}
            function pushScope(array) {
                array.push(scope);
                scope = [];
            }
            function pushItems() {
                scope.push(items);
                items = [];
            }
            function pushBoth(array) {
                pushItems();
                pushScope(array);
            }
            return [
                [/^"((?:[^"\n\\]|\\[\s\S])*)"/, function (array, match) {
                    scope.push(new RegExp(match[1].escape()));
                    return ;
                }],
                [/^,/, function (array, match) {
                    //scope.push(items);
                    //items = [];
                }],
                [/^\((?=[^)]+\))/, pushScope],
                [/^\)/, blank],
                [/^\s+(?:\||OR)\s+/, pushScope/*function (array, match) {
                    //scope = scope.concat(findCaller(key, keywords)(array));
                }*/],
                [/^\s+/, blank],
                [/^[^\s,]+/, function (array, match) {
                    scope.push(new RegExp(match[0].escape(), "i"));
                    return ;
                }],
                [/|/, pushScope]
            ];
        }());

        function findMatch(string, array) {
            for (var i = 0; i < rules.length; i += 1) {
                var match = rules[i][0].exec(string);
                if (match) {
                    return {
                        result: rules[i][1](array, match),
                        length: match[0].length
                    };
                }
            }
            /*return {
                length: string.length
            };*/
        }

        function parse(string) {
            var match, array = [];
            while (string.length) {
                match = findMatch(string, array);
                string = string.slice(match.length);
                console.log(match.result);
            }
            return array;
        }

        //! console.log(parse('video arch OR mdc box'));
//!!!!!!


        return function (array, string, info) {
            //! console.log("-------");
            /*! string = string.replace(/"(?:[^"\n\\]|\\[\s\S])*"/g, function (str) {
                return str.replace(/\s+/g, "\\$&");
            });*/

            //var scope = array.slice();
            info = Object(info);

            var tokens = [];

//            var scope = [];
//            string.split(lexer).forEach(function (key, i, array) {
//                if (key === " OR " || key === " | ") {
//                    tokens.push(scope);
//                    scope = [];
//                }
//                /*var next = array[i + 1];

//                if (next) {
//                    if (next === " OR " || next === " | ") {

//                    }
//                } else {
//                    tokens.push(scope);
//                }*/
//                if (key) {
//                    if (key !== " " && key !== " OR " && key !== " | ") {
//                        console.log(key);
//                        scope.push(key);
//                    }
//                }
//            });
//            tokens.push(scope);

            string.split(/"((?:[^"\n\\]|\\[\s\S])*)"/).forEach(function (string) {
                string.split(/\s+(?:\||OR)\s+/).forEach(function (string) {
                    //var or = [];

                    tokens.push(string.split(/\s+/));

                    /*string.split(/(\s)\s+/).forEach(function (key) {
                        if (key === " ") {

                        } else {
                            tokens.push(key);
                        }
                    });*/

                    //tokens.push(or);
                });
            });

            //! console.log(tokens);

            var tabs = [];
            //var scope = array;

            tokens.forEach(function (item) {
                var scope = array.slice();
                item.forEach(function (key) {
                    scope = findCaller(key, keywords, info.ignore)(scope);
                });
                tabs = tabs.concat(scope);
            });
            //console.log(tabs);

            return tabs;

            /*console.log(string, string.split(lexer).forEach(function (key) {
                console.log(key);
                if (key && key !== " ") {
                    scope = findCaller(key, keywords)(scope);
                    return scope;
                }
                return [];
            }).map(function (item) {
                return item.map(function (item) {
                    return item.tab.title;
                });
            }));*/

            return array;

            var state = {};

            var scope = array.slice();

            string.split(lexer).forEach(function (key) {
                if (key) {
                    //console.log(key);
                    switch (key) {
                    case " ":
                        state.or = false;
                        break;
                    case " | " || " OR ":
                        state.or = true;
                        //scope = array.slice();
                        break;
                    default:
                        if (state.or) {
                            scope = scope.concat(findCaller(key, keywords)(scope));
                        } else {
                            scope = findCaller(key, keywords)(scope);
                        }

                        state.or = false;
                    }
                    /*console.log(scope.map(function (item) {
                        return item.tab.title.slice(0, 5);
                    }));*/
                }
            });

            return scope;

            var tabs = string.split(lexer).map(function (key) {
                if (key) {
                    console.log(key);
                    switch (key) {
                    case " ":
                        state.or = false;
                        break;
                    case " | " || " OR ":
                        state.or = true;
                        //scope = array.slice();
                        break;
                    default:
                        if (state.or) {
                            scope = scope.concat(findCaller(key, keywords)(scope));
                        } else {
                            scope = findCaller(key, keywords)(scope);
                        }

                        state.or = false;
                    }
                    /*console.log(scope.map(function (item) {
                        return item.tab.title.slice(0, 5);
                    }));*/
                    return scope;
                }
                return scope;
            });
            console.log(string, tabs.map(function (item) {
                return item.map(function (item) {
                    return item.tab.title;
                });
            }));
//            var tabs = string.split(/\s+(?:\||OR)\s+/g).map(function (key) {
//                var tabs = array.slice();
//                //! console.log("OR: " + key);
//                key.split(/\s+/g).forEach(function (key) {
//                    //! console.log("AND: " + key);
//                    /*! if (state.shouldReset) {
//                        resetAllTabs(tabs);
//                    }*/
//                    tabs = findCaller(key, keywords)(tabs);
//                });
//                return tabs;
//            });
            return tabs.concat.apply([], tabs);
        };
    }()),
    returnTitle: function (index) {
        var value = state.titles[index];
        return (value) ? value : index + 1;
    },
    unselectWindow: function () {
        var query = document.querySelector(".window[data-focused]");
        if (query) {
            query.removeAttribute("data-focused");
        }
    },
    attachEvents: function (element) {
        Platform.windows.addEventListener("create", function (win) {
            if (win.type === "normal") {
                //var pending = Window.pending[win.id];

                //win.tabs = [];
                element.appendChild(Window.proxy(win/*, pending*/));

                //delete Window.pending[win.id];

                state.search({ nodelay: true }); //! Prevents jittering

//                Platform.tabs.getAllInWindow(win.id, function (array) {
//                    //console.warn("windows.onCreated");



//                    console.log(win.id, pending);

//                    win.tabs = array;
//                    element.appendChild(Window.proxy(win, pending));




//                });
            }
        }, true);

        Platform.tabs.addEventListener("create", function (tab) {
            //console.warn("tabs.onCreated!");

            var node, list = state.windows[tab.windowId];

            if (list && (list = list.tabList)) {
                node = Tab.proxy(tab);
                list.moveChild(node, tab.index);

                /*console.log(tab.url === "chrome://newtab/");
                if (tab.url === "chrome://newtab/") {
                    setTimeout(function () {
                    node.editURL();
                    }, 1000);
                }*/

                //UI.scrollTo(node, list);

                state.search({ scroll: true });
            }
        }, true);

        Platform.tabs.addEventListener("update", function (id, info, tab) {
            var list, node = state.tabsByID[id];

            if (node && (list = node.parentNode)) {
                state.tabsByURL.remove(node.tab.url, node);

                var selected = node.hasAttribute("data-selected");

                var element = Tab.proxy(tab);
                list.replaceChild(element, node);

                if (selected) {
                    element.queueAdd();
                }

                state.search();
            }
        }, true);

        Platform.tabs.addEventListener("move", function (id, info) {
            var list = state.windows[info.windowId],
                node = state.tabsByID[id];

            if (list && node && (list = list.tabList)) {
                if (node.parentNode === list) {
                    list.removeChild(node);
                }
                list.moveChild(node, info.toIndex);

                //! UI.scrollTo(node, list);

                //state.search();
            }
        }, true);

        Platform.tabs.addEventListener("detach", function (id, info) {
            var list = state.windows[info.oldWindowId];

            if (list && (list = list.tabList)) {
                delete list.queue.shiftNode;
            }
        }, true);

        Platform.tabs.addEventListener("attach", function (id, info) {
            var list = state.windows[info.newWindowId],
                node = state.tabsByID[id];

            if (list && node && (list = list.tabList)) {
                node.removeAttribute("data-focused");
                list.moveChild(node, info.newPosition);

                node.tab.windowId = info.newWindowId;

                //console.log(node, node.tab, info.newWindowId);

                //UI.scrollTo(node, list);

                state.search({ scroll: true });
            }
        }, true);

        Platform.tabs.addEventListener("focus", function (id, info) {
            var list = state.windows[info.windowId],
                node = state.tabsByID[id];

            if (list && node) {
                var scroll = list.tabList;

                if ((list = list.querySelector("[data-focused]"))) {
                    list.removeAttribute("data-focused");
                    list.triggerEvent("Platform-blur", false, false);
                }
                node.setAttribute("data-focused", "");
                node.scrollIntoViewIfNeeded(false);

                if (!node.nextSibling) {
                    scroll.scrollTop += 9001;
                } else if (!node.previousSibling) {
                    scroll.scrollTop -= 9001;
                }
                //! UI.scrollTo(node, node.parentNode);

                node.triggerEvent("Platform-focus", false, false);
            }
        }, true);

        Platform.tabs.addEventListener("remove", function (id) {
            var list, node = state.tabsByID[id];

            if (node && (list = node.parentNode)) {
                state.tabsByURL.remove(node.tab.url, node);

                list.removeChild(node);

                state.search();
            }
            delete state.tabsByID[id];
        }, true);

        Platform.windows.addEventListener("remove", function (id) {
            var list = state.windows[id];

            if (list && list.parentNode) {
                list.parentNode.removeChild(list);

                var index = state.list.indexOf(list);
                if (index !== -1) {
                    state.titles.splice(index, 1);
                }
                //state.titles.remove(list.tabIcon.indexText.value);
            }
            delete state.windows[id];

            state.list.remove(list);
            state.list.forEach(function (item, i) {
                var title = action.returnTitle(i);
//                var title = item.tabIcon.indexText.value;//action.returnTitle(i);
//                if (+title === i + 2) {
//                    title = i + 1;
//                }
                item.tabIcon.indexText.value = title;
            });

            state.search({ nodelay: true });
        }, true);
    }
};
