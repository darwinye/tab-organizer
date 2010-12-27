(function () {
    "use strict";
    /*global action, parser, state */

    //var action = Object(action);

    action.search = (function () {
        var cache, ignore, /*input, */tabs;

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

                var actions = keys.filter(function (key) {
                    return right(key) && !ignore[key];
//                                                   for (var i = 0; i < args.length; i += 1)
//                                                    {
//                                                     if (args[i](key))
//                                                      {
//                                                       return true;
//                                                      }
//                                                    }
//                                                   return false;
                });

//                    ignore = [];

//                    actions.forEach(function (key) {
//                        ignore.push(key);
//                    });

                //console.log(actions);

                //console.log(evaluate(args[0]));
                return function (item) {
                    for (var i = 0; i < actions.length; i += 1) {
                        var key = actions[i];
                        //console.log(key, ignore[key]);
                        //if (!ignore[key]) {
                        if (queries[key](item)) {
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

//            parser.prefix({ token: "focused",
//                priority: 0,
//                output: function (right) {
//                    console.log(right);
//                }
//            });

        parser.infix({ priority: 50, token: "-",
            output: function (left, right) {
                var seen = 0;

//                    var focused = left("focused") ||
//                                  right("focused");
                var focused = left({ literal: "focused" }) ||
                              right({ literal: "focused" });

                //console.log(, );

                //console.log(left.original, right.original, focused);

                var range = state.list.filter(function (item) {
                    if (seen === 2) {
                        return false;
                    }

                    var name = item.tabIcon.indexText.value;

                    if (focused && item.hasAttribute("data-focused")) {
                        seen += 1;
                    } else if (left && left(name)) {
                        left = null;
                        seen += 1;
                    } else if (right && right(name)/* || right(item, "data-focused")*/) {
                        right = null;
                        //console.error(name);
                        seen += 1;
                    }
                    //console.log(item, seenA, seenB);

                    return seen > 0;
                });

//                    console.log(focused, range.map(function (item) {
//                        return item.tabIcon.indexText.value;
//                    }), seen);

                return function (item) {
//                        if (item === "focused") {
//                            return left("focused") || right("focused");
//                        }
                    if (seen === 2) {
                        //console.error(item);

                        for (var i = 0; i < range.length; i += 1) {
                            //console.log(args[i], item.windowName);
                            //console.log(range[i], item);
                            //console.error(range[i].tabIcon.indexText.value, item);
                            if (range[i].tabIcon.indexText.value === item) {
                                return true;
                            }
                        }
                    }
                };
                //return "(RANGE " + left + " " + right + ")";
            }
        });

        parser.prefix({ priority: 50, token: "-",// match: /-(?=\S)/,
            output: function (right) {
                //console.warn(right);
                return function (item) {
                    return !right(item);
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

        parser.infix({ priority: 30, token: ",",/* match: /(,)(?!\s)/,*/ output: OR
//                output: function (left, right) {
//                    return function (item) {
////                        if (item === "focused") {
////                            return left.literal === "focused" ||
////                                   right.literal === "focused";
////                            //item.hasAttribute("data-focused")
////                        }
//                        return left(item) || right(item);
////                        if (right) {
////                            return left(item) || right(item);
////                        } else {
////                            return left(item);
////                        }
//                    };
////                    output.literal = function (name) {
////                        return left.literal(name) || right.literal(name);
////                    };
////                    return output;
//                    //return left.concat(right);
//                }
        });

        parser.prefix({ priority: 20, token: "window:",
            output: function (right) {
//                    if (right) {
                    //var args = arguments;
                    //console.error(right);

                //console.log();

                var focused = right({ literal: "focused" });

//                    console.log(input, focused);

                var range = state.list.filter(function (item) {
                    //console.error(item);
//                        if (focused) {
//                            return item.hasAttribute("data-focused");
//                        }
//                        switch (focused) {
//                        case true:
//                            break;
//                        case false:
//                        }

//                        if (focused === true) {
//                        } else if (focused === false) {
//                        }

                    if (item.hasAttribute("data-focused")) {
                        if (typeof focused !== "undefined") {
                            return focused;
                        }
                    }

//                        if (focused && ) {
//                            return true;
//                        } else if (focused === false && item.hasAttribute("data-focused")) {
//                            return false;
//                        }
                    return right(item.tabIcon.indexText.value);/* ||
                            right(item, "data-focused");*/

//                        for (var i = 0; i < args.length; i += 1) {
//                            if (args[i](item)) {
//                                return true;
//                            }
//                        }
//                        return args.some(function (action) {
//                            return action(item);
//                        });
                });

                //console.error(right, range);

                var total = [];

                var slice = Array.prototype.slice;

                range.forEach(function (item) {
                    var children = item.tabList.children;
                    total = total.concat(slice.call(children));
                });

                return function (item) {
                    //console.log(range);

                    return total.indexOf(item) !== -1;

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

        parser.prefix({ priority: 20, token: "has:",
            output: dictionary({
                "macro": function (item) {
                    //var macros = [];

//                        if (ignore["macro"]) {
//                            return false;
//                        }

                    ignore.macro = true;//.push("macro");

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
            })
//            function (right) {
//                    return ;
////                    return tabs.filter(function (item) {
////                        return item.hasAttribute("data-favorited");
////                    });
//                }
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

        parser.prefix({ priority: 20, token: "intitle:",
            output: function (right) {
                return function (item) {
                    return right(item.tab.title);
                };
            }
        });

        parser.prefix({ priority: 20, token: "same:",
            output: dictionary({
                "url": (function () {
                    var regexp = /^([^#]+?)\/?(#.*)?$/;

                    return function (item) {
                        //var data = {};

                        //var cache = state.cache;

                        if (!cache.urls) {
                            cache.urls = {};

                            tabs.forEach(function (item) {
                                var url = regexp.exec(item.tab.url)[1];
                                //console.log(url);
                                cache.urls[url] = cache.urls[url] + 1 || 1;
                            });
                        }

                        var url = regexp.exec(item.tab.url)[1];
                        return cache.urls[url] > 1;
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
                "domain": (function () {
                    var regexp = /^[^:]+:\/\/([^\/]*)/;

                    return function (item) {
                        //var data = {};

                        if (!cache.domain) {
                            cache.domain = {};

                            tabs.forEach(function (item) {
    //                            console.log("loop");
                                var url = regexp.exec(item.tab.url)[1];
                                //console.log(url);
                                cache.domain[url] = cache.domain[url] + 1 || 1;
                            });
                        }

                        var url = regexp.exec(item.tab.url)[1];
    //                    if (cache.domain[url] > 1) {
    //                        console.log(url);
    //                    }
                        return cache.domain[url] > 1;
                    };
                }())
            })
//                        function (right)
//                         {
//                             //return "(" + this.name + " " + right + ")";
//                         }
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

        parser.infix({ priority: 10, token: " | ", match: / *( \| ) */, output: OR });
        parser.infix({ priority: 10, token: " OR ", match: / *( OR ) */, output: OR });

        return function (array, string) {
//            input = string;
            tabs = array;
            ignore = {};
            cache = {};

            var test = parser.output(string);
//            if (test === undefined) {
//                console.error(test);
//            }
            return tabs.filter(test);
        };
    }());
}());