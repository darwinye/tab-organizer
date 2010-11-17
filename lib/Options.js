"use strict";
/*global chrome, Event, localStorage, window */

var Options = (function () {
    var config, page, Options;

    var KAE = Object(KAE);
    KAE.make = Object(KAE.make);

    KAE.make.events = function () {
        var events = {
            "false": {},
            "true": {}
        };

        return {
            addListener: function (name, action, type) {
                if (typeof action !== "function") {
                    throw new TypeError("The 2nd argument must be a function.");
                }
                if (typeof type !== "boolean") {
                    type = true;
//                    throw new TypeError("The 3rd argument must be a boolean.");
                }

                var event = events[type];
                if (!event[name]) {
                    event[name] = [];
                }

        //        var self = this;

                if (event[name].indexOf(action) === -1) {
                    event[name].push(action);
        //            event[name].push(action, function anon(event) {
        //                if (self.closed) {
        //                    this.removeEventListener(name, action, type);
        //                    this.removeEventListener(name, anon, type);
        //                }
        //            });
                }
            },
            removeListener: function (name, action, type) {
                if (typeof action !== "function") {
                    throw new TypeError("The 2nd argument must be a function.");
                }
                if (typeof type !== "boolean") {
                    type = true;
//                    throw new TypeError("The 3rd argument must be a boolean.");
                }

                var event = events[type][name];
                if (event) {
                    var index = event.indexOf(action);
                    if (index !== -1) {
                        //event[index] = null;
                        event.splice(index, 1);
                    }
                }
            },
            trigger: (function () {
                function noop() {}

                var state = {};

//                var target = {
//                    value: Options
//                };
                var properties = {
                    defaultPrevented: {
                        get: function () {
                            return state.defaultPrevented;
                        },
                        set: noop
                    },
                    eventPhase: {
                        get: function () {
                            return state.eventPhase;
                        },
                        set: noop
                    }
                };

                function execute(array, info, phase) {
                    if (array) {
        //                array.toString = function () {
        //                    return this.join("\n");
        //                };
        //                console.log(info.type, array.length, array);

                        array.forEach(function (item) {
                            //console.log(item.caller);
                            try {
                                item.call(info.target, info);
                            } catch (e) {
        //                        var phase =
        //                            (info.eventPhase === Event.CAPTURING_PHASE) ||
        //                            !(info.eventPhase === Event.BUBBLING_PHASE);

                                //console.log(phase);
        //                        Options.event.removeListener(info.type, item, phase);
                                console.error(e);
                            }
                        });
                        /*var length = array.length;
                        for (var i = 0; i < length; i += 1) {
                            if (array[i]) {
                                array[i].call(Options, info);
                            }
                        }*/
                    }
                }
                return function (name, info) {
        //            var event = document.createEvent("MutationEvent");
        //            event.initMutationEvent("change", false, false, null, info.value, info.value, info.name, Event.ADDITION);
        //            Options.dispatchEvent(event);
        //            return;

                    info = Object(info);
                    info.type = name;

                    //! DEBUG
                    var debug = events["true"][name];
                    if (debug) {
                        console.log(name, debug.length);
                    }

                    if (typeof info.bubbles !== "boolean") {
                        info.bubbles = true;
                    }
                    if (typeof info.cancelable !== "boolean") {
                        info.cancelable = true;
                    }

//                    console.log(this);

                    info.preventDefault = function () {
                        if (this.cancelable) {
                            state.defaultPrevented = true;
                        }
                    };
                    info.stopPropagation = function () {
                        state.shouldStop = true;
                    };

                    info.currentTarget = info.target = this;

                    //var clone = Object.create(info, properties);
                    Object.defineProperties(info, properties);
                    Object.freeze(info);

                    state.shouldStop = state.defaultPrevented = false;

                    state.eventPhase = Event.CAPTURING_PHASE;
                    execute(events["true"][name], info, true);

                    if (info.bubbles && !state.shouldStop) {
                        state.eventPhase = Event.BUBBLING_PHASE;
                        execute(events["false"][name], info, false);
                    }
                };
            }())
        };
    };


    function dictionary(config) {
        config = Object(config);
        config.base = Object(config.base);
        config.user = Object(config.user);
        return {
            "options.config": config,
//            replace: function (object) {
//                config = object;
//            },
            getAll: function () {
        //        return config.all;
                var object = {};
                Object.keys(config.base).forEach(function (key) {
                    object[key] = config.base[key];
                });
                Object.keys(config.user).forEach(function (key) {
                    object[key] = config.user[key];
                });
                return object;
            },
            snapshot: function () {
                var object = {
                    base: {},
                    user: {}
                };
                Object.keys(config.base).forEach(function (key) {
                    object.base[key] = config.base[key];
                });
                Object.keys(config.user).forEach(function (key) {
                    object.user[key] = config.user[key];
                });
                return object;
            },
            get: function (name) {
        //        return config.all[name];
                return (name in config.user) ? config.user[name] : config.base[name];
            },
            getDefault: function (name) {
                return config.base[name];
            },
            isDefault: function (name) {
                return !(name in config.user) || config.user[name] === config.base[name];
            }
        };
    }


    try {
        page = chrome.extension.getBackgroundPage();
    } catch (e) {
        //* This is for content scripts only:

        Options = dictionary();
//        Options.event = KAE.make.events();

//        config = {};
//        Options.get = function (name) {
//            return (name in config.user) ? config.user[name] : config.base[name];
//        };
        Options.linkToPage =  function (action) {
            if (typeof action !== "function") {
                throw new TypeError("First argument must be a function.");
            }

            if (config) {
                action(Options);
            } else {
                var port = chrome.extension.connect({ name: "lib.Options" });

                port.onMessage.addListener(function (json) {
                    if (json.config) {
                        config = json.config;
                        //Options["options.config"] = config;
                        Options["options.config"].base = config.base;
                        Options["options.config"].user = config.user;
                        //Options.replace(config);
                        action(Options);
//                        console.log("calling");
                    } else if (config) {
                        config.user[json.name] = json.value;
                    }
                });
            }
        };
        return Options;
    }

    var exists = (page.Options && typeof page.Options === "object");
    //    var self = this;

    if (exists) {
        Options = Object.create(page.Options);
        Options.event = Object.create(Options.event);
//        console.log(Options.event === page.Options.event);
    } else {
        Options = dictionary();
        Options.event = KAE.make.events();
    }
//    Options.root = page;


    //* This is for all scripts, except content scripts:

    Options.getObject = function (name) {
        try {
            if (typeof name === "string") {
                name = JSON.parse(name);
            }
        } catch (e) {
            name = undefined;
        } finally {
            return Object(name);
        }
    };


    //* This is for non-background page scripts only:

    if (exists) {
        console.warn("Replacing with background Options!");

        //Options.window = window;

//        console.log(Options === page.Options);

        Options.event.addListener = (function () {
//            return Options.event.addListener;


            var saved = Options.event.addListener;
            var events = [];
//            var stop;

//            Options.event.addListener("unload", function anon(event) {
//                this.removeEventListener(event.type, anon, true);

//            }, true);

            function remove() {
                removeEventListener("beforeunload", remove, true);
                removeEventListener("unload", remove, true);

                Options.event.addListener = function () {
                    page.console.warn("Not doing anything");
                };
                //stop = true;
            //setTimeout(function () {
//                page.console.warn(event.type);
//                Options.event.trigger("unload");


                //alert("unload");
        //        this.removeEventListener(event.type, anon, true);

        //        page.console.log(location.href, events.length, events);
                events.forEach(function (item) {
//                    page.console.log(item.action);
                    Options.event.removeListener(item.name, item.action, item.type);
                });
                //page.console.log(location.pathname, event.type);
            //}, 0);
            }
            addEventListener("beforeunload", remove, true);
            addEventListener("unload", remove, true);
            //addEventListener("pagehide", remove, true);
            //addEventListener("abort", remove, true);
            //addEventListener("close", remove, true);
            return function (name, action, type) {
//                if (stop) {

//                } else {
    //                setTimeout(function () {
    //                if (document.readyState !== "complete") {
    //                    return;
    //                }
    //                page.console.log(document.readyState);
                events.push({
                    name: name,
                    action: action,
                    type: type
                });
                //console.log(self);
                saved(name, action, type);
    //                }, 0);
                    //alert("addEventListener");
                    //page.console.log(location.pathname, events);
//                }
            };
        }());

        Options.cancelConfig = (function () {
            var old = Options.snapshot();

            return function () {
        //        Object.keys(old).forEach(function (key) {
        //            Options.set(key, old[key]);
        //        });
                Object.keys(old.base).forEach(function (key) {
                    Options.set(key, old.base[key]);
                });
                Object.keys(old.user).forEach(function (key) {
                    Options.set(key, old.user[key]);
                });
                Options.saveConfig();
            };
        }());

    //        Options.createContainer = (function () {
    //            var saved = Options.createContainer;

    //            return function (initialize) {
    //                return saved(document, initialize);
    //            };
    //        }());

        Options.createContainer = (function () {
            //var document = Options.window.document;

            var category = {
                header: function (text) {
                    var line = document.createElement("div");
                    line.style.marginBottom = "6px";

                    var item = document.createElement("strong");

                    if (typeof text === "function") {
                        text(Object.create(category, {
                            "DOM.Element": { value: item }
                        }));
                    } else {
                        item.textContent = text;
                    }

                    line.appendChild(item);
                    this["DOM.Element"].appendChild(line);
                    return item;
                },
                indent: function (initialize) {
                    var item = document.createElement("div");
                    item.className = "Options-indent";
                    //item.style.marginLeft = "15px";

                    var clone = Object.create(category, {
                        "DOM.Element": { value: item }
                    });

                    if (typeof initialize === "function") {
                        initialize(clone);
                    }

                    this["DOM.Element"].appendChild(item);
                    return item;
                },
                group: function (initialize) {
                    var item = document.createElement("div");
                    item.className = "Options-group";

                    var clone = Object.create(category, {
                        "DOM.Element": { value: item }
                    });

                    if (typeof initialize === "function") {
                        initialize(clone);
                    }

                    this["DOM.Element"].appendChild(item);
                    return item;
                },
                input: (function () {
                    function limiter(info, type) {
                        var limit = info.limit;
                        var saved = info.modify;

                        if (type === "number") {
                            limit = Object(limit);
                        }
                        if (limit instanceof Object) {
                            //info = limit(info.limit);
                            if (typeof limit.digits === "number") {
                                info.verbatim = true;
                            }

                            info.modify = function (info) {
                                if (typeof saved === "function") {
                                    this.value = saved.call(this, info);
                                }

                                var value = this.value;
                                if (typeof limit.min === "number") {
                                    value = Math.max(limit.min, value);
//                                    console.log(limit.min);
//                                    if (isNaN(value)) {
//                                        value = limit.min;
//                                    }
                                }
                                if (typeof limit.max === "number") {
                                    value = Math.min(limit.max, value);
//                                    if (isNaN(value)) {
//                                        value = limit.max;
//                                    }
                                }
                                value += "";

                                if (typeof limit.digits === "number") {
                                    if (value.length > limit.digits) {
                                        value = value.slice(0, limit.digits);
                                    }
                                    while (value.length < limit.digits) {
                                        value = "0" + value;
                                    }
                                }

//                                console.log(type, +value);
                                if (type === "number") {
                                    if (isNaN(+value)) {
                                        value = Options.getDefault(info.option);
                                    }
                                }
                                return value;
                            };
                        }
                        return info;
                    }

                    var types = {
                        "dropdown-list": (function () {
                            function parseList(parent, array) {
                                if (array instanceof Array) {
                                    array.forEach(function (item) {
                                        item = Object(item);

                                        var option;

                                        if (item.group) {
                                            option = document.createElement("optgroup");
                                            option.label = item.group;
                                            parseList(option, item.list);
                                        } else {
                                            option = document.createElement("option");
                                            option.value = item.value;
                                            option.textContent = item.text;
                                        }

                                        parent.appendChild(option);
                                    });
                                }
                            }
                            return function (info, span) {
                                var select = document.createElement("select");
                                select.disabled = info.disabled;

                                parseList(select, info.list);

                                this.appendChild(select);

                                /*var modify = info.modify;

                                info.modify = function () {
                                    return this.value;
                                };*/

                                Options.on(info.on)(select, info);
                            };
                        }()),
                        "checkbox": function (info, span) {
                            var input = document.createElement("input");
                            input.type = "checkbox";

                            var label = document.createElement("label");

                            input.disabled = info.disabled;
                            if (input.disabled) {
                                label.style.color = "lightgrey !important";
                            }

                            label.appendChild(input);
                            label.appendChild(span);
                            this.appendChild(label);

                            info.tooltip = label;
                            info.property = "checked";
                            Options.on(info.on)(input, info);
                        },
                        "text": function (info, span) {
                            var input = document.createElement("input");
                            input.type = "text";
                            input.style.width = info.width;
                            input.maxLength = info.maxlength;

                            //info = limiter(info);

                            this.appendChild(input);

                            Options.on(info.on)(input, info);
                        },
                        "number": function (info, span) {
                            var input = document.createElement("input");
                            input.type = "text";
                            input.style.width = info.width;
                            input.maxLength = info.maxlength;

                            info = limiter(info, "number");

                            /*input.addEventListener("keydown", function (event) {
                                if (!event.ctrlKey && !event.altKey && !event.metaKey) {
                                    if (/[a-zA-Z ]/.test(String.fromCharCode(event.which))) {
                                        event.preventDefault();
                                    }
                                }
                            }, true);*/

//                            var saved = info.modify;
//                            info.modify = function (info) {
//                                if (typeof saved === "function") {
//                                    this.value = saved.call(this, info);
//                                }
//                                var value = this.value;

//                                return value;
//                            };
                            //if (limit.type === "number") {

                            //}

                            this.appendChild(input);

                            Options.on(info.on)(input, info);
                        },
                        "slider": function (info, span) {
                            var input = document.createElement("input");
                            input.type = "range";
                            input.min = info.min;
                            input.max = info.max;
                            input.step = info.step;

                            span.style.display = "table-cell";
                            span.style.verticalAlign = "middle";
                            span.style.textAlign = "right";
                            span.style.paddingRight = "7px";
                            this.style.display = "table-row";
                            this.appendChild(input);

                            //Options.on(info.on)(input, info);
                        }
                    };
                    return function (type, info) {
                        info = Object(info);
                        info.on = info.on || "change";

                        var line = document.createElement("div");
                        line.style.whiteSpace = "pre";
                        line.style.marginBottom = "4px";

                        var text = document.createElement("span");
                        var unit = document.createElement("span");
                        unit.style.padding = "0 2px";

                        line.appendChild(text);

                        //console.log(type);

                        if (typeof types[type] === "function") {
                            types[type].call(line, info, text);
                        }

                        if (info.text) {
                            text.innerHTML = info.text;
                        }
                        if (info.unit) {
                            unit.innerHTML = info.unit;
                            line.appendChild(unit);
                        }

                        this["DOM.Element"].appendChild(line);
                        return line;
                    };
                }()),
                space: function (info) {
                    info = Object(info);

                    var item = document.createElement("div");
                    item.style.width = info.width;
                    item.style.height = info.height;

                    this["DOM.Element"].appendChild(item);
                    return item;
                },
                button: function (info) {
                    info = Object(info);

                    var item = document.createElement("button");
                    item.className = "Options-button";
                    item.textContent = info.text;
                    item.style.height = info.height;

                    if (typeof info.action === "function") {
                        item.addEventListener("click", info.action, true);
                    }

                    this["DOM.Element"].appendChild(item);
                    return item;
                },
                text: function (text) {
                    var item = document.createElement("div");
                    item.innerHTML = text;

                    this["DOM.Element"].appendChild(item);
                    return item;
                },
                separator: function () {
                    var item = document.createElement("hr");
                    this["DOM.Element"].appendChild(item);
                    return item;
                }
            };

            var make = {
                container: (function () {
                    var prototype = {
                        separator: function () {
                            var element = document.createElement("hr");
                            element.className = "Options-list-separator";
                            this.categoryList.appendChild(element);
                        },
                        category: function (name, initialize) {
                            var self = this;

                            var clone = Object.create(category, {
                                "DOM.Element": { value: document.createElement("div") }
                            });

                            if (typeof initialize === "function") {
                                initialize(clone);
                            }


                            var content = clone["DOM.Element"];
                            this["DOM.Element"].appendChild(content);

                            this["DOM.Element"].style.display = "block !important";
                            this.minHeight = Math.max(this.minHeight, content.offsetHeight);

//                            debugger;

                            this["DOM.Element"].style.display = "";
                            this.minWidth = Math.max(this.minWidth, content.offsetWidth);

//                            debugger;

                            this["DOM.Element"].removeChild(content);

                            this.categories.push(content);

                            this.categories.forEach(function (item) {
        //                        console.log(item);
        //                        console.log(self.minWidth, self.minHeight);
                                item.style.width = self.minWidth + "px !important";
                                item.style.height = self.minHeight + "px !important";
                            });

                            if (this.categories.length < 2) {
                                this.categoryList.setAttribute("hidden", "");
                            } else {
                                this.categoryList.removeAttribute("hidden");
                            }


                            var item = document.createElement("li");
                            item.className = "Options-list-item";
                            item.textContent = name;

                            function select() {
                                if (self.selected) {
                                    self.selected.removeAttribute("data-selected");
                                }
                                self.selected = item;

                                var display = self.display;

        //                        if (display.firstChild) {
        //                            display.removeChild(display.firstChild);
        //                        }
                                display.innerHTML = "";
                                display.appendChild(content);

                                item.setAttribute("data-selected", "");
                            }
                            item.addEventListener("click", select, true);

                            if (!this.selected) {
                                //self.selected = item;
                                //setTimeout(function () {
                                select();
                                //}, 0);
                            }

                            this.categoryList.appendChild(item);
                        }
                    };

                    return function () {
                        var item = document.createElement("table");
                        item.id = "Options-inner";

                        var clone = Object.create(prototype);

                        clone.minWidth = clone.minHeight = 0;

                        clone.categories = [];

                        var list = document.createElement("ul");
                        list.id = "Options-list";
                        list.tabIndex = 0;

                        clone.categoryList = list;

                        list.addEventListener("mousedown", function (event) {
                            event.preventDefault();
                        }, true);

                        //var wrapper = document.createElement("span");
                        //wrapper.className = "Options-list-wrapper";

                        addEventListener("keydown", function (event) {
                            var focused = document.activeElement;
                            if (focused === document.body || focused === list) {
                                if (event.which === 38 || event.which === 40) {
                                    var element = (event.which === 38) ?
                                        clone.selected.previousSibling :
                                        clone.selected.nextSibling;

                                    //console.log(element);

                                    if (element) {
                                        event.preventDefault();

                                        var info = document.createEvent("Event");
                                        info.initEvent("click", true, false);
                                        element.dispatchEvent(info);
                                    }
                                }
                            }
                        }, true);

                        clone.display = document.createElement("td");
                        clone.display.id = "Options-content";

                        //list.appendChild(wrapper);
                        item.appendChild(list);
                        item.appendChild(clone.display);

                        clone["DOM.Element"] = item;

                        return clone;
                    };
                }())
            };

            return function (initialize) {
                var container = document.createElement("table");
                container.id = "Options-root";
                container.addEventListener("selectstart", function (event) {
                    event.preventDefault();
                }, true);

                var contents = document.createElement("td");
                contents.id = "Options-wrapper";

                var outer = document.createElement("div");
                outer.id = "Options-outer";

                var inner = make.container();

        //        var inner = document.createElement("table");
        //        inner.id = "Options-inner";

                var title = document.createElement("div");
                title.id = "Options-title";
                title.textContent = document.title;

                outer.appendChild(title);
                outer.appendChild(inner["DOM.Element"]);

                contents.appendChild(outer);
                container.appendChild(contents);
                //container.appendChild(outer);

                document.body.appendChild(container);

                if (typeof initialize === "function") {
                    initialize(inner/*{
                        addCategory: ,
                        "DOM.element": inner
                    }*/);
                }

                var bottom = document.createElement("div");
                bottom.id = "Options-bottom";
                bottom.textContent = "Your changes are automatically saved.";

                var buttons = document.createElement("div");
                buttons.id = "Options-buttons";

                var button = {
                    reset: document.createElement("button"),
                    close: document.createElement("button")
                };

                button.reset.className = "Options-button";
                button.reset.textContent = "Reset to Defaults";
                button.reset.addEventListener("click", Options.resetConfig, true);

                button.close.className = "Options-button";
                button.close.textContent = "Close";
                button.close.addEventListener("click", function () {
                    close();
                }, true);

//                var cancel = document.createElement("button");
//                cancel.className = "Options-button";
//                cancel.textContent = "Cancel";
//                cancel.addEventListener("click", function () {
//                    Options.cancelConfig();
//                    /*Options.window.*/close();
//                }, true);

                buttons.appendChild(button.reset);
                buttons.appendChild(button.close);
//                buttons.appendChild(cancel);

                bottom.appendChild(buttons);
                outer.appendChild(bottom);

                return container;
            };
        }());

        Options.sync = (function () {
//            var tooltip = document.createElement("div");
//            tooltip.id = "Options-tooltip";

//            var prefix = document.createElement("span");
//            prefix.id = "Options-tooltip-prefix";
//            prefix.textContent = "Default: ";

//            var text = document.createElement("span");
//            text.id = "Options-tooltip-text";

//            tooltip.text = function (string) {
////                if (string === true || string === false) {
////                    text.style.color = "";
////                } else {
////                    //text.style.color = "";
////                }
//                text.textContent = string;
//            };

//            tooltip.addEventListener("mouseover", function (event) {
//                tooltip.removeAttribute("hidden");
//            }, true);

//            tooltip.appendChild(prefix);
//            tooltip.appendChild(text);

//            var timer, shouldshow;

//            function hide() {
//                clearTimeout(timer);

////                timer = setTimeout(function () {
//                    tooltip.setAttribute("hidden", "");
////                }, 500);
////                    return;
////                    var parent = tooltip.parentNode;
////                    if (parent) {
////                        parent.removeChild(tooltip);
////                    }
//            }
//            hide();

//            addEventListener("mouseout", function () {
//                shouldshow = false;
//                hide();
//            }, true);
//            addEventListener("mousemove", function (event) {
//                tooltip.style.left = event.clientX + 15 + "px";
//                tooltip.style.top = event.clientY + 10 + "px";
//                hide();
//            }, true);

            return function (elem, info) {
                info = Object(info);

                info.tooltip = info.tooltip || elem;

                var flags = {
                    verbatim: info.verbatim
                };

//                if (!tooltip.parentNode) {
//                    document.body.appendChild(tooltip);
//                }

//                function timer() {
//                    clearTimeout(timer);

//                    timer = setTimeout(function () {
//                        shouldshow = true;
//                    }, 500);
//                }

//                function show() {
//                    if (shouldshow) {
//                        tooltip.text(Options.getDefault(info.option));
//    //                    tooltip.style.left = event.clientX + "px";
//    //                    tooltip.style.top = event.clientY + "px";
//                        tooltip.removeAttribute("hidden");
//    //                    info.tooltip.appendChild(tooltip);
//                    }
//                }

                function highlight(name) {
                    //console.log(Options.isDefault(name));
                    if (Options.isDefault(name)) {
                        elem.removeAttribute("data-options-changed");

//                        info.tooltip.removeEventListener("mouseover", timer, true);
//                        info.tooltip.removeEventListener("mousemove", show, true);
//                        hide();

                        info.tooltip.title = "";
                    } else {
                        elem.setAttribute("data-options-changed", "");

//                        info.tooltip.addEventListener("mouseover", timer, true);
//                        info.tooltip.addEventListener("mousemove", show, true);
//                        show();

                        info.tooltip.title = "Default: " + Options.getDefault(info.option);
                    }
                }
                highlight(info.option);

                info.property = info.property || "value";
                //if (typeof property !== "function") {
                elem[info.property] = Options.get(info.option);
                //}

            //        if (typeof elem[property] === "string") {
            //            elem[property] = +elem[property];
            //        }
                //highlight(info.option, elem[property]);

                Options.event.addListener("change", function (event) {
                    if (event.name === info.option) {
                        if (elem[info.property] !== (event.value + "")) {
                            elem[info.property] = event.value;
                        }
                        highlight(info.option);
                        //console.log(info.option);
                        //highlight(event.name, event.value);
                    }
                });

                return function () {
                    if (typeof info.modify === "function") {
                        var value = info.modify.call(elem, info);
                        Options.set(info.option, null);
                        Options.set(info.option, value, flags);
                        //elem[info.property] = info.modify.call(elem);
                    } else {
                        Options.set(info.option, elem[info.property], flags);
                    }


                    //if (typeof property === "function") {
                        //property.call(elem, name, property);
                    //} else {
                    //}
                };
            };
        }());

        //Options.sync = (function () {
        //    var saved = Options.sync;

        //    return function (elem, info) {
        //        info = Object(info);

        //        Options.event.addListener("change", function (event) {
        //            if (event.name === info.option) {
        //                if (elem[info.property] !== (event.value + "")) {
        //                    elem[info.property] = event.value;
        //                }
        //                highlight(info.option);
        //                //console.log(info.option);
        //                //highlight(event.name, event.value);
        //            }
        //        });

        //        return saved(elem, info);
        //    };
        //}());

        Options.on = (function () {
            var cache = {};

            return function (type) {
                if (typeof cache[type] !== "function") {
                    cache[type] = function (elem, info) {
                        elem.addEventListener(type, Options.sync(elem, info), false);
                    };
                }
                return cache[type];
            };
        }());

        return Options;
    }


//    Options.event.addListener = (function () {
//        var contexts = {};

//        function addEvent(name, action, type) {
//            if (typeof action !== "function") {
//                throw new TypeError("The 2nd argument must be a function.");
//            }
//            if (typeof type !== "boolean") {
//                throw new TypeError("The 3rd argument must be a boolean.");
//            }

//            var event = events[type];
//            if (!event[name]) {
//                event[name] = [];
//            }

//            if (event[name].indexOf(action) === -1) {
//                event[name].push(action);
//            }
//        }
//        return function (name, action, type) {
//            var url = Options.window.location.href;
//            if (!contexts[url]) {
//                contexts[url] = [];
//                Options.window.addEventListener("unload", function () {
//                    //page.console.log(window);
//                    //page.console.log(url, contexts[url].length, contexts[url]);
//                    contexts[url].forEach(function (item) {
//                        Options.event.removeListener(item.name, item.action, item.type);
//                    });
//                    delete contexts[url];
//                }, true);
//            }
//            contexts[url].push({
//                name: name,
//                action: action,
//                type: type
//            });
//            addEvent(name, action, type);
//        };
//    }());

//    Object.defineProperty(Options, "addEventListener", {
//        get: (function () {

//            return function () {

//                return contexts[url].action;
//            };
//        }()),
//        set: function () {}
//    });



    //* This is for the background page only:

    config = Options["options.config"];
    config.base = Options.getObject(localStorage["Options.config.base"]);
    config.user = Options.getObject(localStorage["Options.config.user"]);

    chrome.extension.onConnect.addListener(function anon(port) {
        if (port.name === "lib.Options") {
//            console.log(port);

            port.postMessage({
                config: config
            });

            if (!anon.ports) {
                anon.ports = [];

                Options.event.addListener("change", function (event) {
                    anon.ports.forEach(function (port) {
                        port.postMessage(event);
                    });
    //                port.postMessage({
    //                    type: event.type,
    //                    name: event.name,
    //                    value: event.value
    //                });
                });
            }

            if (anon.ports.indexOf(port) === -1) {
                anon.ports.push(port);

                port.onDisconnect.addListener(function () {
                    var index = anon.ports.indexOf(port);
                    if (index !== -1) {
                        anon.ports.splice(index, 1);
                    }
                });
            }
//            console.log(anon.ports.length);
            //port.onMessage.addListener(function (json) {
                //port.postMessage({question: "I don't get it."});
            //});
        }
    });

    //config.all = Object.create(config.user);

//    Object.keys(config.user).forEach(function (key) {
//        config.all[key] = config.user[key];
//    });

    Options.saveConfig = function () {
        localStorage["Options.config.base"] = JSON.stringify(config.base);
        localStorage["Options.config.user"] = JSON.stringify(config.user);
    };

//    delete config.base["tabs.favorites.urls"];
//    delete config.user["tabs.favorites.urls"];

//    Options.saveConfig();

    Options.resetConfig = function () {
        if (confirm("Do you want to reset everything to the default settings?")) {
            Object.keys(config.user).forEach(function (key) {
                Options.set(key, config.base[key]);
            });
            Options.saveConfig();
            Options.event.trigger("reset", {
                cancelable: false
            });
            //! Options.cancelConfig = function () {};
        }
    };

    Options.set = (function () {
        function set(name, value) {
            var action;
            if (value !== config.user[name]) {
                if (value === config.base[name]) {
                    delete config.user[name];
                    action = "delete";
                } else {
                    config.user[name] = value;
//                    config.all[name] = value;
                }
                Options.event.trigger("change", {
                    cancelable: false,
                    value: value,
                    name: name,
                    action: action
                });
            }
        }
        return function (name, value, info) {
            info = Object(info);

            if (!info.verbatim) {
                if (value === null) {
                    value = config.base[name];
                } else if (typeof value === "string") {
                    var number = +value;
                    if (!isNaN(number)) {
                        return set(name, number);
                    }
                }
            }
            return set(name, value);
        };
    }());

    Options.setObject = function (name) {
//        console.log(Object.prototype.toString.call(config.base[name]));
//        if (typeof config.base[name] !== "object") {
//        if (Object.prototype.toString.call(config.base[name]) !== "[object Object]") {
        if (typeof config.base[name] !== "object") {
            config.base[name] = {};
        }
//        if (!(name in config.all)) {
//            config.all[name] = config.base[name];
//        }

        var object = config.base[name];
        if (typeof object.data !== "object") {
            object.data = {};
        }
        object.has = function (key) {
            return key in this.data;
        };
        object.get = function (key) {
            return this.data[key];
        };
        object.set = function (key, value) {
            var action;
            if (this.data[key] !== value) {
                if (value === null) {
                    delete this.data[key];
                    action = "delete";
                } else {
                    this.data[key] = value;
                }

                Options.event.trigger("change", {
                    cancelable: false,
                    value: key,
                    name: name,
                    action: action
                });
            }
        };
    };

    Options.setDefault = function (name, value) {
        //if (typeof config.base[name] !== "object") {
        config.base[name] = value;

//        if (!(name in config.all)) {
//            config.all[name] = value;
//        }
        //}
//!        if (config.user[name] === config.base[name]) {
//!            delete config.user[name];
//!        }
    };

    Options.setDefaults = function (object) {
        Object.keys(object).forEach(function (key) {
            Options.setDefault(key, object[key]);
        });
        Options.saveConfig();
    };

//    Options.toggleDisplay = (function () {
//        function hideElement(elem, value) {
//            elem.style.display = (value) ? "" : "none";
//        }
//        return function (name, elem) {
//            hideElement(elem, Options.get(name));
//            Options.event.addListener("change", function (event) {
//                if (event.name === name) {
//                    hideElement(elem, event.value);
//                }
//            });
//        };
//    }());

    return Options;
}());

//addEventListener("beforeunload", Options.saveConfig, true);
addEventListener("unload", Options.saveConfig, true);
