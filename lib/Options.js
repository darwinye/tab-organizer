"use strict";
/*global chrome, localStorage, window */

var Options = (function () {
    var page = Platform.getBackgroundPage();

    if (typeof page.Options === "function") {
        console.warn("Replacing with background Options!");
        return page.Options;
    }

    var Options = function () {};

    var events = {
        false: {},
        true: {}
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

        if (event[name].indexOf(action) === -1) {
            event[name].push(action);
        }
    };
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

        function execute(array, info) {
            if (array) {
                array.forEach(function (item) {
                    item.call(Options, info);
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
            info = Object(info);
            info.type = name;

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
            execute(events[true][name], info);

            if (info.bubbles && !state.shouldStop) {
                state.eventPhase = Event.BUBBLING_PHASE;
                execute(events[false][name], info);
            }
        };
    }());

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
        });
        Options.saveConfig();
    };

    Options.isDefault = function (name) {
        return !(name in config.user);
    };

    Options.sync = function (name, elem, property) {
        var defaultValue = Options.getDefault(name);

        function highlight(name) {
            //console.log(Options.isDefault(name));
            if (Options.isDefault(name)) {
                elem.removeAttribute("data-options-changed");
            } else {
                elem.setAttribute("data-options-changed", "");
            }
        }
        highlight(name);

        elem.title = "Default: " + defaultValue;

        property = property || "value";
        if (typeof property !== "function") {
            elem[property] = Options.get(name);
        }

//        if (typeof elem[property] === "string") {
//            elem[property] = +elem[property];
//        }
        //highlight(name, elem[property]);

        Options.addEventListener("change", function (event) {
            if (event.name === name) {
                if (elem[property] !== (event.value + "")) {
                    elem[property] = event.value;
                }
                highlight(name);
                //console.log(name);
                //highlight(event.name, event.value);
            }
        }, true);

        return function () {
            if (typeof property === "function") {
                property.call(elem, name, property);
            } else {
                Options.set(name, elem[property]);
            }
        };
    };

    var cache = {};
    Options.on = function (type) {
        if (typeof cache[type] !== "function") {
            cache[type] = function (name, elem, property) {
                elem.addEventListener(type, Options.sync(name, elem, property), false);
            };
        }
        return cache[type];
    };

    Options.toggleDisplay = (function () {
        function hideElement(elem, value) {
            elem.style.display = (value) ? "" : "none";
        }
        return function (name, elem) {
            hideElement(elem, Options.get(name));
            Options.addEventListener("change", function (event) {
                if (event.name === name) {
                    hideElement(elem, event.value);
                }
            }, true);
        };
    }());

    return Options;
}());

(function () {
    var old = Options.snapshot();

    Options.cancelConfig = function () {
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

Options.window = window;

Options.createContainer = (function () {
    var document = Options.window.document;

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
        input: function (type, info) {
            info = Object(info);

            var line = document.createElement("div");

            var span = document.createElement("span");
            if (info.text) {
                span.textContent = info.text;
            }

            var input = document.createElement("input");
            input.type = type;

            switch (type) {
            case "checkbox":
                Options.on("change")(info.option, input, "checked");

                var label = document.createElement("label");

                label.appendChild(input);
                label.appendChild(span);
                line.appendChild(label);
                break;
            case "text":
                Options.on("change")(info.option, input);

                input.style.width = info.width;
                input.maxLength = info.maxlength;
                line.appendChild(span);
                line.appendChild(input);
            }

            this["DOM.Element"].appendChild(line);
            return input;
        },
        space: function (info) {
            info = Object(info);

            var item = document.createElement("div");
            item.style.width = info.width;
            item.style.height = info.height;

            this["DOM.Element"].appendChild(item);
            return item;
        },
        addText: function (text) {
            var item = document.createTextNode(text);
            this["DOM.Element"].appendChild(item);
            return item;
        },
        seperator: function () {
            var item = document.createElement("hr");
            this["DOM.Element"].appendChild(item);
            return item;
        }
    };

    var make = {
        container: (function () {
            var prototype = {
                addCategory: function (name, initialize) {
                    var self = this;

                    var clone = Object.create(category, {
                        "DOM.Element": { value: document.createElement("div") }
                    });

                    if (typeof initialize === "function") {
                        initialize(clone);
                    }


                    var content = clone["DOM.Element"];
                    this["DOM.Element"].appendChild(content);

                    this.minWidth = Math.max(this.minWidth, content.offsetWidth);
                    this.minHeight = Math.max(this.minHeight, content.offsetHeight);

                    content.parentNode.removeChild(content);

                    this.categories.forEach(function (item) {
//                        console.log(item);
//                        console.log(self.minWidth, self.minHeight);
                        item.style.width = self.minWidth + "px";
                        item.style.height = self.minHeight + "px";
                    });

                    this.categories.push(content);


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
                        select();
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
                clone.categoryList.style.position = "relative";
                clone.categoryList.style.zIndex = "9001";
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
                clone.display.style.width = "100%";

                item.appendChild(clone.categoryList);
                item.appendChild(clone.display);

                clone["DOM.Element"] = item;

                return clone;
            };
        }())
    };

    return function (initialize) {
        var container = document.createElement("table");
        container.id = "Options-container";
        container.addEventListener("selectstart", function (event) {
            event.preventDefault();
        }, true);

        var contents = document.createElement("td");
        contents.id = "Options-contents";

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
            Options.window.close();
        }, true);

        buttons.appendChild(reset);
        buttons.appendChild(cancel);

        bottom.appendChild(buttons);
        outer.appendChild(bottom);

        return container;
    };
}());

Options.addEventListener = (function () {
    var saved = Options.addEventListener;
    var events = [];

    addEventListener("unload", function () {
        events.forEach(function (item) {
            Options.removeEventListener(item.name, item.action, item.type);
        });
    }, true);
    return function (name, action, type) {
        events.push({
            name: name,
            action: action,
            type: type
        });
        saved(name, action, type);
    };
}());

addEventListener("unload", Options.saveConfig, false);
