/*global action, parser, state */

(function () {
    "use strict";

    var cache = {}, ignore, tabs;

    parser.prefix({ priority: 50, token: "-",
        output: function (right) {
            return function (item) {
                if (right(item)) {
                    return "";
                }
                return "NOT";
            };
        }
    });


    parser.infix({ priority: 50, token: "-",
        output: function (left, right) {
            var seen, seenL, seenR;

            var focused = left({ literal: "focused" }) ||
                          right({ literal: "focused" });

            return function (item) {
                if (!cache.range) {
                    seen = 0;

                    seenL = seenR = null;

                    cache.range = state.sorted.filter(function (item) {
                        if (seen === 2) {
                            return false;
                        }

                        var name = item.window.title;

                        if (focused && item.hasAttribute("data-focused")) {
                            seen += 1;
                        } else if (!seenL && left(name)) {
                            seenL = true;
                            seen += 1;
                        } else if (!seenR && right(name)) {
                            seenR = true;
                            seen += 1;
                        }

                        return seen > 0;
                    });
                }

                if (seen === 2) {
                    for (var i = 0; i < cache.range.length; i += 1) {
                        var icon = cache.range[i];
                        if (icon.window.title === item) {
                            return true;
                        }
                    }
                }
            };
        }
    });


    parser.prefix({ priority: 30, token: ",",
        output: function (right) {
            return right;
        }
    });


    parser.infix({ priority: 30, token: ",",
        output: function (left, right) {
            return function (item) {
                var res = left(item);
                if (res === "" || (res && res !== "NOT")) {
                    return res;
                } else {
                    return right(item);
                }
            };
        }
    });


    function dictionary(queries) {
        var keys = Object.keys(queries);

        return function (right) {
            var actions = [];

            keys.forEach(function (key) {
                if (!ignore[key]) {
                    var result = right(key);
                    if (result && result !== "NOT") {
                        actions.push(queries[key]);
                    } else if (result === "") {
                        actions.push(function (item) {
                            return !queries[key](item);
                        });
                    }
                }
            });

            return function (item) {
                for (var i = 0; i < actions.length; i += 1) {
                    if (actions[i](item)) {
                        return true;
                    }
                }
            };
        };
    }

    parser.prefix({ priority: 20, token: "has:",
        output: dictionary({
            "macro": function (item) {
                ignore.macro = true;

                if (!cache.macros) {
                    cache.macros = state.macros.filter(function (item) {
                        return item.search;
                    });

                    cache.macros = cache.macros.map(function (item) {
                        return parser.output(item.search);
                    });
                }

                for (var i = 0; i < cache.macros.length; i += 1) {
                    if (cache.macros[i](item)) {
                        return true;
                    }
                }
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
                return right(item.tab.url);
            };
        }
    });


    parser.prefix({ priority: 20, token: "is:",
        output: dictionary({
            "bookmarked": function (item) {
                return state.bookmarksByURL[item.tab.url] > 0;
            },

            "child": function (item) {
                return item.style.marginLeft;
            },

            "favorited": function (item) {
                return item.hasAttribute("data-favorited");
            },

            "image": (function () {
                //! var url = /\.(bmp|gif|jpe?g|mng|a?png|raw|tga|tiff?)(?=\?|$)/i;
                var title = /\(\d+×\d+\)$/;
                var url = /\.\w+(?=[#?]|$)/;

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
    });


    parser.prefix({ priority: 20, token: "last:",
        output: dictionary({
            "moved": function (item) {
                if (state.last.moved) {
                    return state.last.moved.indexOf(item) !== -1;
                }
            }
        })
    });


    parser.prefix({ priority: 20, token: "same:",
        output: dictionary({
            "domain": (function () {
                var regexp = /^[^:]+:\/\/([^\/]*)/;

                return function (item) {
                    if (!cache.domain) {
                        cache.domain = {};

                        tabs.forEach(function (item) {
                            var url = regexp.exec(item.tab.url);
                            if (url) {
                                url = url[1];
                                cache.domain[url] = cache.domain[url] + 1 || 1;
                            }
                        });
                    }

                    var url = regexp.exec(item.tab.url)[1];
                    return cache.domain[url] > 1;
                };
            }()),

            "title": function (item) {
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
                    if (!cache.urls) {
                        cache.urls = {};

                        tabs.forEach(function (item) {
                            var url = regexp.exec(item.tab.url);
                            if (url) {
                                url = url[1];
                                cache.urls[url] = cache.urls[url] + 1 || 1;
                            }
                        });
                    }

                    var url = regexp.exec(item.tab.url)[1];
                    return cache.urls[url] > 1;
                };
            }())
        })
    });


    parser.prefix({ priority: 20, token: "seen:",
        output: dictionary({
            "url": function (item) {
                return state.visitedByURL.has(item.tab.url);
            }
        })
    });


    parser.prefix({ priority: 20, token: "window:",
        output: function (right) {
            var focused = right({ literal: "focused" });

            return function (item) {
                var win = item.parentNode.container;

                if (focused === "" || typeof focused === "boolean") {
                    if (win.hasAttribute("data-focused")) {
                        return focused;
                    }
                }

                return right(win.window.title);
            };
        }
    });


    parser.infix({ priority: 20, token: " ", match: /( ) */,
        output: function (left, right) {
            return function (item) {
                return left(item) && right(item);
            };
        }
    });



    function OR(left, right) {
        return function (item) {
            return left(item) || right(item);
        };
    }
    parser.infix({ priority: 10, token: " | ", match: / *( \| ) */, output: OR });
    parser.infix({ priority: 10, token: " OR ", match: / *( OR ) */, output: OR });


    function tester(regexp, value) {
        return function (item) {
            if (item instanceof Object) {
                if (item.literal) {
                    if (item.literal === value) {
                        return true;
                    }
                } else {
                    return regexp.test(item.tab.title) ||
                           regexp.test(item.tab.url);
                }
            } else {
                return regexp.test(item);
            }
        };
    }

    parser.quotes({ token: '"', match: /(")((?:[^"\n\\]|\\[\s\S])*)(")/,
        output: function (right) {
            return tester(new RegExp("\\b" + right.escape() + "\\b", "i"));
        }
    });


    parser.quotes({
        open: "r/", close: "/",
        match: /(r\/)((?:[^\/\\]|\\[\s\S])+\/[i]{0,1})/,
        output: function (right) {
            var split = right.split(/\/(?=[i]{0,1}$)/);
            return tester(new RegExp(split[0], split[1]));
        }
    });


    parser.literal.nud = function () {
        var value = this.name.escape();
        return tester(new RegExp(value, "i"), this.name);
    };


    parser.braces({ open: "(", close: ")" });


    function split(array, test) {
        var output = [];
        output.inverse = [];

        for (var i = 0; i < array.length; i += 1) {
            var item = array[i];
            if (test(item)) {
                output.push(item);
            } else {
                output.inverse.push(item);
            }
        }
        return output;
    }

    action.parse = function (string) {
        ignore = {};

        var filter = parser.output(string);

        return function (array) {
            tabs = array;
            cache = {};

            return split(tabs, filter);
        };
    };

    action.search = function (array, string) {
        return action.parse(string)(array);
    };
}());
