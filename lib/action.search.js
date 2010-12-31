(function () {
    "use strict";
    /*global action, parser, state */

    //var action = Object(action);

    (function () {
        var cache, ignore, tabs; ///*input, */;

//        function noop() {}

//            function literal(args, func) {
//                func.literal = function (name) {
//                    for (var i = 0; i < args.length; i += 1) {
//                        //console.log(args);
//                        var action = args[i] && args[i].literal;
//                        if (action && action(name)) {
//                            return true;
//                        }
//                    }
//                };
//                return func;
//            }
//            function literal(args, func) {
//                return func;
//            }

//            parser.prefix({ token: "focused",
//                priority: 0,
//                output: function (right) {
//                    console.log(right);
//                }
//            });

        parser.prefix({ priority: 50, token: "-",// match: /-(?=\S)/,
            output: function (right) {
                //console.warn(right);
                return function (item) {
                    if (right(item)) {
                        return "";
                    }
                    return "NOT";
//                    return array.filter(function (item) {
//                        return !a;
                        //return a.indexOf(item) === -1;
//                    });
                };
//                    return tabs.filter(function (item) {
//                        return right.indexOf(item) === -1;
//                    });
            }
        });

        parser.infix({ priority: 50, token: "-",
            output: function (left, right) {
//                    console.log(focused, range.map(function (item) {
//                        return item.tabIcon.indexText.value;
//                    }), seen);
                var seen, seenL, seenR;

                var focused = left({ literal: "focused" }) ||
                              right({ literal: "focused" });

                return function (item) {
//                    return false;
//                    console.log(focused);

                    if (!cache.range) {
                        seen = 0;

        //                    var focused = left("focused") ||
        //                                  right("focused");

                        //console.log(, );

                        //console.log(left.original, right.original, focused);

                        seenL = seenR = null;

                        cache.range = state.list.filter(function (item) {
                            if (seen === 2) {
                                return false;
                            }

                            var name = item.tabIcon.indexText.value;

                            if (focused && item.hasAttribute("data-focused")) {
                                seen += 1;
                            } else if (!seenL && left(name)) {
                                seenL = true;
                                seen += 1;
                            } else if (!seenR && right(name)/* || right(item, "data-focused")*/) {
                                seenR = true;
                                //console.error(name);
                                seen += 1;
                            }
                            //console.log(item, seenA, seenB);

                            return seen > 0;
                        });
                    }
//                        if (item === "focused") {
//                            return left("focused") || right("focused");
//                        }
                    if (seen === 2) {
                        //console.error(item);

                        for (var i = 0; i < cache.range.length; i += 1) {
                            //console.log(args[i], item.windowName);
                            //console.log(range[i], item);
                            //console.error(range[i].tabIcon.indexText.value, item);
                            var icon = cache.range[i].tabIcon;
                            if (icon.indexText.value === item) {
                                return true;
                            }
                        }
                    }
                };
                //return "(RANGE " + left + " " + right + ")";
            }
        });

        /*parser.token[","] = {
            priority: 30,
            prefix: function (right) {
                return function (item) {
                    return right(item);
                };
            },
            infix: function (left, right) {
                return function (item) {
                    if (right) {
                        return left(item) || right(item);
                    } else {
                        return left(item);
                    }
                };
            }
        };*/

        parser.prefix({ priority: 30, token: ",",
            output: function (right) {
                return right;
//                    return function (item) {
//                        return right(item);
//                    };
            }
        });

        parser.infix({ priority: 30, token: ",",/* match: /(,)(?!\s)/,*/// output: OR
            output: function (left, right) {
                return function (item) {
                    var res = left(item);
                    if (res === "" || (res && res !== "NOT")) {
                        return res;
                    } else {
                        return right(item);
                    }
                };
//                return function (keys, queries) {
//                    var actions = [];

//                    function test(func, key) {
//                        if (!ignore[key]) {
//                            var result = func(key);
//                            //console.log(result);
//                            if (result && result !== "NOT") {
//                                actions.push(queries[key]);
//                            } else if (result === "") {
//    //                                actions.push(queries[key]);
//        //                        return right(key) && !ignore[key];
//                                actions.push(function (item) {
//                                    return !queries[key](item);
//                                });
//                            }
//        //                                                   for (var i = 0; i < args.length; i += 1)
//        //                                                    {
//        //                                                     if (args[i](key))
//        //                                                      {
//        //                                                       return true;
//        //                                                      }
//        //                                                    }
//        //                                                   return false;
//                        }
//                    }

//                    keys.forEach(function (key) {
//                        return test(left, key) && test(right, key);
////                        if () {
////                            actions.push();
////                        }
//                    });

//                    console.log(keys, actions);

//                    return actions;
////                        if (item === "focused") {
////                            return left.literal === "focused" ||
////                                   right.literal === "focused";
////                            //item.hasAttribute("data-focused")
////                        }
////                        return left(item) || right(item);
////                        if (right) {
////                            return left(item) || right(item);
////                        } else {
////                            return left(item);
////                        }
//                };
//                    output.literal = function (name) {
//                        return left.literal(name) || right.literal(name);
//                    };
//                    return output;
                //return left.concat(right);
            }
        });


        function dictionary(queries) {
            var keys = Object.keys(queries);

            return function (right) {
                //console.warn(arguments);
                //var args = arguments;
                //console.log(args);

                //  ["i", "aim", "title"]
                //> ["domain", "title"]

                //  same:url,-title
                //> same:url | -same:title

//                var actions = right(keys, queries);

                var actions = [];

//                console.log(actions);

                keys.forEach(function (key) {
                    if (!ignore[key]) {
                        var result = right(key);
                        //console.log(result);
                        if (result && result !== "NOT") {
                            actions.push(queries[key]);
    //                        return right(key) && !ignore[key];
                        } else if (result === "") {
                            actions.push(function (item) {
                                return !queries[key](item);
                            });
                        }
    //                                                   for (var i = 0; i < args.length; i += 1)
    //                                                    {
    //                                                     if (args[i](key))
    //                                                      {
    //                                                       return true;
    //                                                      }
    //                                                    }
    //                                                   return false;
                    }
                });

//                    ignore = [];

//                    actions.forEach(function (key) {
//                        ignore.push(key);
//                    });

                //console.log(actions);

                //console.log(evaluate(args[0]));
                return function (item) {
//                    return actions(item);
                    for (var i = 0; i < actions.length; i += 1) {
//                        var key = actions[i];
                        //console.log(key, ignore[key]);
                        //if (!ignore[key]) {
                        if (actions[i](item)) {
                            return true;
                        }
                        //}
                    }

        //                    for (var i = 0; i < args.length; i += 1) {
        //                        for (var j = 0; j < keys.length; j += 1) {
        //                            var key = keys[j];
        //                            if (args[i](key)) {
        //                                if (queries[key](item)) {
        //                                    return true;
        //                                }
        //                            }
        //                        }

        ////                        keys.some(function (key) {
        ////                            return
        ////                        });

        ////                        if (args[i][0] === "value") {
        ////                            var name = args[i][1];
        ////                            if (queries[name] && queries[name](item)) {
        ////                                //console.log(item);
        ////                                return true;
        ////                            }
        ////                        }
        //                    }

                        //console.log("foo!");
        //                        return list.some(function (key) {
        //                            //console.log(args);
        //                            for (var i = 0; i < args.length; i += 1) {
        //                                if (args[i]({ title: key })) {
        //                                    return queries[key](item);
        //                                }
        //                            }
        //                        });
                };
    //                    match.split(/,/).forEach(function (name) {
    //                        if (queries[name]) {
    //                            output = output.concat(queries[name](array));
    //                        }
    //                        //console.log(output.length);
    //                    });

    //                    return output;
            };
    //            (function () {


    //                //var list = Object.keys(queries);

    //            }()),
        }

        parser.prefix({ priority: 20, token: "has:",
            output: dictionary({
                "macro": function (item) {
                    ignore.macro = true;//.push("macro");

                    //var macros = [];

//                        if (ignore["macro"]) {
//                            return false;
//                        }



//                        if (ignore.indexOf("has:macro") !== -1) {
//                            return false;
//                        } else {
//                        }

                    //var info = {
                        //ignore: ["has:macro"]
                    //};

                    if (!cache.macros) {
//                            cache.macros = [];
                        cache.macros = state.macros.map(function (item) {
                            return parser.output(item.search);
                            //macros = macros.concat(action.search(array, item.search, info));
                        });
                    }

                    for (var i = 0; i < cache.macros.length; i += 1) {
                        //try {
                        if (cache.macros[i](item)) {
                            return true;
                        }
                        //} catch (e) {
                            //continue;
                        //}
                    }

//                        array = array.filter(function (item) {
//                            return macros.indexOf(item) !== -1;
//                        });

    //                console.log(macros.length, array.map(function (item) {
    //                    return item.tab.title + " " + item.tab.url + "\n";
    //                }));

//                        return array;
                }
            })
        });

        parser.prefix({ priority: 20, token: "intitle:",
            output: function (right) {
                return function (item) {
                    return right(item.tab.title);
                };
            }
        });

        parser.prefix({ priority: 20, token: "inurl:",
            output: function (right) {
                return function (item) {
//                    console.log(right, item);
                    return right(item.tab.url);
                };
//                    console.warn(right, state.token);
//                    var regexp = new RegExp(right.escape(), "i");
//                    return tabs.filter(function (item) {
//                        return regexp.test(item.tab.url);
//                    });
            }
        });

        parser.prefix({ priority: 20, token: "is:",
            output: dictionary({
                "bookmarked": function (item) {
                    return state.bookmarksByURL[item.tab.url] > 0;
                },
                "favorited": function (item) {
                    return item.hasAttribute("data-favorited");
                },
                "image": (function () {
                    //! var url = /\.(bmp|gif|jpe?g|mng|a?png|raw|tga|tiff?)(?=\?|$)/i;
                    var title = /\(\d+×\d+\)$/;
                    var url = /\.\w+(?=\?|$)/;

                    return function (item) {
                        return url.test(item.tab.url) && title.test(item.tab.title);
                    };
                }()),
                "pinned": function (item) {
                    return item.tab.pinned;
                },
                "selected": function (item) {
                    return item.hasAttribute("data-selected");
                }
//                "visited": function (item) {
//                    return state.visitedByURL[item.tab.url];
//                }
            })
//            function (right) {
//                    return ;
////                    return tabs.filter(function (item) {
////                        return item.hasAttribute("data-favorited");
////                    });
//                }
        });

        parser.prefix({ priority: 20, token: "same:",
            output: dictionary({
                "domain": (function () {
                    var regexp = /^[^:]+:\/\/([^\/]*)/;

                    return function (item) {
                        //var data = {};

                        if (!cache.domain) {
                            cache.domain = {};

                            tabs.forEach(function (item) {
    //                            console.log("loop");
                                var url = regexp.exec(item.tab.url);
                                if (url) {
                                    url = url[1];
                                    //console.log(url);
                                    cache.domain[url] = cache.domain[url] + 1 || 1;
                                }
                            });
                        }

                        var url = regexp.exec(item.tab.url)[1];
    //                    if (cache.domain[url] > 1) {
    //                        console.log(url);
    //                    }
                        return cache.domain[url] > 1;
                    };
                }()),
                "title": function (item) {
                    //var data = {};

                    if (!cache.titles) {
                        cache.titles = {};

                        tabs.forEach(function (item) {
                            cache.titles[item.tab.title] = cache.titles[item.tab.title] + 1 || 1;
                        });
                    }

                    return cache.titles[item.tab.title] > 1;
                },
                "url": (function () {
                    var regexp = /^([^#]+?)\/?(#.*)?$/;

                    return function (item) {
                        //var data = {};

                        //var cache = state.cache;

                        if (!cache.urls) {
                            cache.urls = {};

                            tabs.forEach(function (item) {
                                var url = regexp.exec(item.tab.url);
                                if (url) {
                                    url = url[1];
                                    //console.log(url);
                                    cache.urls[url] = cache.urls[url] + 1 || 1;
                                }
                            });
                        }

                        var url = regexp.exec(item.tab.url)[1];
                        return cache.urls[url] > 1;
                    };
                }())
            })
//                        function (right)
//                         {
//                             //return "(" + this.name + " " + right + ")";
//                         }
        });

        parser.prefix({ priority: 20, token: "seen:",
            output: dictionary({
                "url": function (item) {
                    return state.visitedByURL[item.tab.url];
                }
            })
        });

        parser.prefix({ priority: 20, token: "window:",
            output: function (right) {
////                    if (right) {
//                    //var args = arguments;
//                    //console.error(right);

//                //console.log();

//                var focused = right({ literal: "focused" });

////                    console.log(input, focused);

////                var range = [];

//                var range = state.list.filter(function (item) {
//                    //console.error(item);
////                        if (focused) {
////                            return item.hasAttribute("data-focused");
////                        }
////                        switch (focused) {
////                        case true:
////                            break;
////                        case false:
////                        }

////                        if (focused === true) {
////                        } else if (focused === false) {
////                        }

//                    if (item.hasAttribute("data-focused")) {
//                        if (typeof focused !== "undefined") {
//                            return focused;
//                        }
//                    }

////                        if (focused && ) {
////                            return true;
////                        } else if (focused === false && item.hasAttribute("data-focused")) {
////                            return false;
////                        }
//                    return right(item.tabIcon.indexText.value);/* ||
//                            right(item, "data-focused");*/

////                        for (var i = 0; i < args.length; i += 1) {
////                            if (args[i](item)) {
////                                return true;
////                            }
////                        }
////                        return args.some(function (action) {
////                            return action(item);
////                        });
//                });

//                //console.error(right, range);

//                var total = [];

//                var slice = Array.prototype.slice;

//                range.forEach(function (item) {
//                    var children = item.tabList.children;
//                    total = total.concat(slice.call(children));
//                });

                var focused = right({ literal: "focused" });

                return function (item) {
                    //console.log(range);

//                    return false;

                    var win = item.parentNode.container;

                    if (focused === "" || typeof focused === "boolean") {
                        if (win.hasAttribute("data-focused")) {
                            return focused;
                        }
                    }

//                    console.log(win.tabIcon.indexText.value, focused);

                    return right(win.tabIcon.indexText.value);

//                    for (var i = 0; i < range.length; i += 1) {
//                        if (range[i](item)) {
//                            return true;
//                        }
//                    }

//                    return total.indexOf(item) !== -1;

//                        for (var i = 0; i < range.length; i += 1) {
//                            //console.log(range[i], item.windowName);
//                            //console.log(range[i], item);
//                            if (range[i].title === item.windowName) {
//                                return true;
//                            }
//                        }
                };
//                    } else {
//                        return noop;
//                    }
                //return "(" + this.name + " " + right + ")";
            }
        });

        parser.infix({ priority: 20, token: " ", match: /( ) */,
            output: function (left, right) {
                return function (item) {
                    return left(item) && right(item);
                };
//                    return right.filter(function (item) {
//                        return left.indexOf(item) !== -1;
//                    });
            }
        });


        function OR(left, right) {
            return function (item) {
//                    if (!right) {
//                        return left(item):
//                    } else {
//                console.log(left, right);
                return left(item) || right(item);
//                    }
            };
            //return left.concat(right);
        }
        parser.infix({ priority: 10, token: " | ", match: / *( \| ) */, output: OR });
        parser.infix({ priority: 10, token: " OR ", match: / *( OR ) */, output: OR });


        function tester(regexp, value) {
            return function (item) {
                // (and value attr (eq value attr))
                // return value && attr && attr === value;
//                    if (value && attr) {
//                        if (attr === value) {
//                            return true;
//                        }
//                        //return attr === value;
//                    }
                if (item instanceof Object) {
                    if (item.literal) {
                        if (item.literal === value) {
                            return true;
                        }
                    } else {

//                            console.log(item);

//                            return item.hasAttribute(attr);
//                        } else {
                        return regexp.test(item.tab.title) ||
                               regexp.test(item.tab.url);
//                        }
                    }
                } else {
                    return regexp.test(item);
                }
            };
        }

        parser.quotes({ token: '"', match: /(")((?:[^"\n\\]|\\[\s\S])*)(")/,
            output: function (right) {
                //console.warn(right, new RegExp("\\b" + right.escape() + "\\b", "i"));
                return tester(new RegExp("\\b" + right.escape() + "\\b", "i"));
                //return new RegExp(right.escape());
                //var regexp = new RegExp(right.escape());
                //return tabs.filter(function (item) {
                    //return regexp.test(item.tab.title) || regexp.test(item.tab.url);
                //});
            }
        });

        parser.quotes({ token: "r/", match: /(r\/)((?:[^\/\\]|\\[\s\S])+\/[i]{0,1})$/,
            output: function (right) {
                var split = right.split(/\/(?=[i]{0,1}$)/);
                //console.warn(split);
                return tester(new RegExp(split[0], split[1]));
                //return new RegExp(right.escape());
                //var regexp = new RegExp(right.escape());
                //return tabs.filter(function (item) {
                    //return regexp.test(item.tab.title) || regexp.test(item.tab.url);
                //});
            }
        });

        parser.literal.nud = function () {
            //console.log(this.name);
            var value = this.name.escape();
            var output = tester(new RegExp(value, "i"), this.name);
            //output.literal = this.name;

//                var self = this;
//                output.literal = function (name) {
//                    return self.name === name;
//                };

            return output;
                //return new RegExp(this.value.escape(), "i");
                //var regexp = new RegExp(this.value.escape(), "i");
                //return tabs.filter(function (item) {
                    //return regexp.test(item.tab.title) || regexp.test(item.tab.url);
                //});
        };

        parser.braces({ open: "(", close: ")" });

//        action.searchchain = function (string) {
//            return parser.output(string);
//        };

        function split(array, test) {
//            var output = {
//                "false": [],
//                "true": []
//            };
            var output = [];
            output.inverse = [];
//            output.windows = [];

            for (var i = 0; i < array.length; i += 1) {
                var item = array[i];
                if (test(item)) {
                    output.push(item);
//                    item.parentNode.container.removeAttribute("hidden");
//                    output.windows..push();
                } else {
                    output.inverse.push(item);
                }
            }
            return output;
        }

        action.parse = function (string) {
//            input = string;
            ignore = {};

            var filter = parser.output(string);

            return function (array) {
                tabs = array;
//                ignore = {};
                cache = {};

//                state.list.forEach(function (item) {
//                    item.setAttribute("hidden", "");
//                    item.removeAttribute("data-last");
//                });
//                return filter;
    //            if (filter === undefined) {
    //                console.error(filter);
    //            }
                return split(tabs, filter);
            };
        };

        action.search = function (array, string) {
            return action.parse(string)(array);
        };
    }());
}());
