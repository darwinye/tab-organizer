"use strict";
/*global Event, localStorage, Platform, window */

var Options = (function () {
    var page = Platform.getBackgroundPage();
    var exists = (page.Options && typeof page.Options === "object");
    //    var self = this;

    var Options = (exists) ? Object.create(page.Options) : { root: page };

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

    if (exists) {
        console.warn("Replacing with background Options!");

        //Options.window = window;

        Options.addEventListener = (function () {
//            return Options.addEventListener;


            var saved = Options.addEventListener;
            var events = [];
//            var stop;

//            Options.addEventListener("unload", function anon(event) {
//                this.removeEventListener(event.type, anon, true);

//            }, true);

            function remove() {
                removeEventListener("beforeunload", remove, true);
                removeEventListener("unload", remove, true);

                Options.addEventListener = function () {
                    Options.root.console.warn("Not doing anything");
                };
                //stop = true;
            //setTimeout(function () {
//                Options.root.console.warn(event.type);
//                Options.triggerEvent("unload");


                //alert("unload");
        //        this.removeEventListener(event.type, anon, true);

        //        Options.root.console.log(location.href, events.length, events);
                events.forEach(function (item) {
//                    Options.root.console.log(item.action);
                    Options.removeEventListener(item.name, item.action, item.type);
                });
                //Options.root.console.log(location.pathname, event.type);
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
    //                Options.root.console.log(document.readyState);
                events.push({
                    name: name,
                    action: action,
                    type: type
                });
                //console.log(self);
                saved(name, action, type);
    //                }, 0);
                    //alert("addEventListener");
                    //Options.root.console.log(location.pathname, events);
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
                    item.textContent = text;

                    line.appendChild(item);
                    this["DOM.Element"].appendChild(line);
                    return item;
                },
                indent: function (initialize) {
                    var item = document.createElement("div");
                    item.style.marginLeft = "15px";

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

                            info.property = "checked";
                            Options.on(info.on)(input, info);
                        },
                        "text": function (info, span) {
                            var input = document.createElement("input");
                            input.type = "text";
                            input.style.width = info.width;
                            input.maxLength = info.maxlength;

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
                            this.minHeight = Math.max(this.minHeight, content.scrollHeight);

                            this["DOM.Element"].style.display = "";
                            this.minWidth = Math.max(this.minWidth, content.scrollWidth);

                            this["DOM.Element"].removeChild(content);

                            this.categories.push(content);

                            this.categories.forEach(function (item) {
        //                        console.log(item);
        //                        console.log(self.minWidth, self.minHeight);
                                item.style.width = self.minWidth + "px !important";
                                item.style.height = self.minHeight + "px !important";
                            });


                            var item = document.createElement("li");
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

                        clone.categoryList = document.createElement("ul");
                        clone.categoryList.id = "Options-list";
                        clone.categoryList.tabIndex = 0;
                        clone.categoryList.addEventListener("keydown", function (event) {
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
                        }, true);

                        clone.display = document.createElement("td");
                        clone.display.id = "Options-content";

                        item.appendChild(clone.categoryList);
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

                var reset = document.createElement("button");
                reset.className = "custom";
                reset.textContent = "Reset to Defaults";
                reset.addEventListener("click", Options.resetConfig, true);

                var cancel = document.createElement("button");
                cancel.className = "custom";
                cancel.textContent = "Cancel";
                cancel.addEventListener("click", function () {
                    Options.cancelConfig();
                    /*Options.window.*/close();
                }, true);

                buttons.appendChild(reset);
                buttons.appendChild(cancel);

                bottom.appendChild(buttons);
                outer.appendChild(bottom);

                return container;
            };
        }());

        Options.sync = function (elem, info) {
            info = Object(info);

            elem.title = "Default: " + Options.getDefault(info.option);

            function highlight(name) {
                //console.log(Options.isDefault(name));
                if (Options.isDefault(name)) {
                    elem.removeAttribute("data-options-changed");
                } else {
                    elem.setAttribute("data-options-changed", "");
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

            Options.addEventListener("change", function (event) {
                if (event.name === info.option) {
                    if (elem[info.property] !== (event.value + "")) {
                        elem[info.property] = event.value;
                    }
                    highlight(info.option);
                    //console.log(info.option);
                    //highlight(event.name, event.value);
                }
            }, true);

            return function () {
                if (typeof info.modify === "function") {
                    Options.set(info.option, info.modify.call(elem, info));
                    //elem[info.property] = info.modify.call(elem);
                } else {
                    Options.set(info.option, elem[info.property]);
                }


                //if (typeof property === "function") {
                    //property.call(elem, name, property);
                //} else {
                //}
            };
        };

        //Options.sync = (function () {
        //    var saved = Options.sync;

        //    return function (elem, info) {
        //        info = Object(info);

        //        Options.addEventListener("change", function (event) {
        //            if (event.name === info.option) {
        //                if (elem[info.property] !== (event.value + "")) {
        //                    elem[info.property] = event.value;
        //                }
        //                highlight(info.option);
        //                //console.log(info.option);
        //                //highlight(event.name, event.value);
        //            }
        //        }, true);

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


    var events = {
        "false": {},
        "true": {}
    };

    Options.addEventListener = function (name, action, type) {
        if (typeof action !== "function") {
            throw new TypeError("The 2nd argument must be a function.");
        }
        if (typeof type !== "boolean") {
            throw new TypeError("The 3rd argument must be a boolean.");
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
    };



//    Options.addEventListener = (function () {
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
//                    //Options.root.console.log(window);
//                    //Options.root.console.log(url, contexts[url].length, contexts[url]);
//                    contexts[url].forEach(function (item) {
//                        Options.removeEventListener(item.name, item.action, item.type);
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


    Options.removeEventListener = function (name, action, type) {
        if (typeof action !== "function") {
            throw new TypeError("The 2nd argument must be a function.");
        }
        if (typeof type !== "boolean") {
            throw new TypeError("The 3rd argument must be a boolean.");
        }

        var event = events[type][name];
        if (event) {
            var index = event.indexOf(action);
            if (index !== -1) {
                //event[index] = null;
                event.splice(index, 1);
            }
        }
    };
    Options.triggerEvent = (function () {
        function noop() {}

        var state = {};

        var target = {
            value: Options
        };
        var properties = {
            preventDefault: {
                value: function () {
                    if (this.cancelable) {
                        state.defaultPrevented = true;
                    }
                }
            },
            stopPropagation: {
                value: function () {
                    state.shouldStop = true;
                }
            },
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
            },
            currentTarget: target,
            target: target
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
                        item.call(Options, info);
                    } catch (e) {
//                        var phase =
//                            (info.eventPhase === Event.CAPTURING_PHASE) ||
//                            !(info.eventPhase === Event.BUBBLING_PHASE);

                        //console.log(phase);
//                        Options.removeEventListener(info.type, item, phase);
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
            var debug = events[true][name];
            if (debug) {
                console.log(name, debug.length);
            }

            if (typeof info.bubbles !== "boolean") {
                info.bubbles = true;
            }
            if (typeof info.cancelable !== "boolean") {
                info.cancelable = true;
            }

            //var clone = Object.create(info, properties);
            Object.defineProperties(info, properties);
            Object.freeze(info);

            state.shouldStop = state.defaultPrevented = false;

            state.eventPhase = Event.CAPTURING_PHASE;
            execute(events[true][name], info, true);

            if (info.bubbles && !state.shouldStop) {
                state.eventPhase = Event.BUBBLING_PHASE;
                execute(events[false][name], info, false);
            }
        };
    }());

    var config = {
        base: Options.getObject(localStorage["Options.config.base"]),
        user: Options.getObject(localStorage["Options.config.user"])
    };

    Options.getAll = function () {
        var object = {};
        Object.keys(config.base).forEach(function (key) {
            object[key] = config.base[key];
        });
        Object.keys(config.user).forEach(function (key) {
            object[key] = config.user[key];
        });
        return object;
    };

    Options.snapshot = function () {
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
    };

    Options.saveConfig = function () {
        localStorage["Options.config.base"] = JSON.stringify(config.base);
        localStorage["Options.config.user"] = JSON.stringify(config.user);
    };

    Options.resetConfig = function () {
        if (confirm("Do you want to reset everything to the default settings?")) {
            Object.keys(config.user).forEach(function (key) {
                Options.set(key, config.base[key]);
                Options.triggerEvent("reset", {
                    cancelable: false,
                    value: config.base[key],
                    name: key
                });
            });
            Options.saveConfig();
            //! Options.cancelConfig = function () {};
        }
    };

    Options.get = function (name) {
        return (name in config.user) ? config.user[name] : config.base[name];
    };

    Options.set = (function () {
        function set(name, value) {
            if (value !== config.user[name]) {
                if (value === config.base[name]) {
                    delete config.user[name];
                } else {
                    config.user[name] = value;
                }
                Options.triggerEvent("change", {
                    cancelable: false,
                    value: value,
                    name: name
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

    Options.getDefault = function (name) {
        return config.base[name];
    };
    Options.setDefaults = function (object) {
        Object.keys(object).forEach(function (key) {
            config.base[key] = object[key];

            if (config.user[key] === config.base[key]) {
                delete config.user[key];
            }
        });
        Options.saveConfig();
    };
    Options.isDefault = function (name) {
        return !(name in config.user);
    };

//    Options.toggleDisplay = (function () {
//        function hideElement(elem, value) {
//            elem.style.display = (value) ? "" : "none";
//        }
//        return function (name, elem) {
//            hideElement(elem, Options.get(name));
//            Options.addEventListener("change", function (event) {
//                if (event.name === name) {
//                    hideElement(elem, event.value);
//                }
//            }, true);
//        };
//    }());

    return Options;
}());

//addEventListener("beforeunload", Options.saveConfig, true);
addEventListener("unload", Options.saveConfig, true);
