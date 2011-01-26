/*global Node, Options, Platform, state, Tab, Undo */

(function () {
    "use strict";

    Node.prototype.remove = function () {
        var parent = this.parentNode;
        if (parent) {
            parent.removeChild(this);
        }
    };

    Node.prototype.moveChild = function (node, index) {
        this.insertBefore(node, this.children[index]);
    };

    Node.prototype.triggerEvent = function (type, bubble, cancel) {
        var event = document.createEvent("Event");
        event.initEvent(type, bubble, cancel);
        this.dispatchEvent(event);
    };


    Number.prototype.toBase = function (base) {
        return this.toString(base);
    };

/*
    String.prototype.equals = function () {
        for (var i = 0; i < arguments.length; i += 1) {
            if (this === arguments[i]) {
                return true;
            }
        }
    };*/

    String.prototype.fromBase = function (base) {
        return parseInt(this, base);
    };

    (function () {
        String.prototype.escape = function (type) {
            return this.replace(/[\\.\^$*+?{\[\]|()]/g, "\\$&");
        };

        var unescape = {
            "%": function (string) {
                return string.replace(/%([0-9a-fA-F]{1,2})/g, function (match, $1) {
                    var decimal = parseInt($1, 16);
                    return (decimal < 128) ? String.fromCharCode(decimal) : match;
                });
            }
        };
        String.prototype.unescape = function (type) {
            if (typeof unescape[type] === "function") {
                return unescape[type](this);
            }
            return this;
        };
    }());


    Array.prototype.range = function (min, max) {
        var add, value, array = [];

        for (var i = 0; i < this.length; i += 1) {
            if (typeof min === "function") {
                value = min(this[i]);
            } else {
                value = (this[i] === min || this[i] === max);
            }

            if (value === true || add) {
                array.push(this[i]);

                if (value === true && add) {
                    return array;
                }
                add = true;
            }
        }
        return [];
    };

    Array.prototype.reset = function () {
        this.forEach(function (item) {
            item.removeAttribute("data-selected");
        });
        this.length = 0;

        var top = Undo.top();
        var name = (top.name === "select-tabs");
        var type = (top.info.type === "select");
        var queue = (top.info.queue === this);

        if (name && type && queue) {
            state.undoBar.hide();
        }
    };
/*
    Array.prototype.undoMove = function () {
        var list = this.filter(function (item) {
            var tab = item.tab;

            if (tab.windowId === id && (index === null || tab.index === index)) {
                return false;
            }

            item.undoState.windowId = tab.windowId;
            item.undoState.index = tab.index;
//
            index = (index === null) ? 9999999 : index;

            if (tab.index < index) {
                index -= 1;
//                console.log(tab.index, index);
            }

            Tab.move(item, {
                windowId: id,
                index: index
            });

            return true;
        });
    };*/

    Array.prototype.moveTabs = function (win, info) {
        info = Object(info);

        var to = info.index;

        if (typeof to !== "number" || to < 0) {
            to = null;
        }

        this.sort(function (a, b) {
            return a.tab.index - b.tab.index;
        });
/*
        console.log(this.map(function (item) {
            return item.tab.title;
        }));*/

        var indent, level = state.indent[win.index];

        if (level) {
            indent = level[to - 1];
        }
        indent = indent || 0;
//
//        var old = level[to - 1];
/*
        Queue.sync(function (queue) {
            console.log(to - 1, slice);
            queue.next();
        });*/

        if (info.indent && to !== 0) {
            indent += 1;
        }
//
//        var slice = level.slice();
//
//        console.log(indent, to - 1, slice);
//

        var first, previous = 0;
//
//        var slice = level.slice();
//
//        var self = this;

        var list = this.filter(function (item, i) {
            var tab = item.tab;
//
//            delete item.undoState.windowId;
//            delete item.undoState.index;

            if (tab.window === win && /*(*/to === null/* || tab.index === to)*/) {
//                if (to !== null) {
//                    Platform.event.trigger("tab-indent", tab, (level[tab.index] = indent));
//                }
//
                return false;
            }

            var title = state.list.find(function (item) {
                return item.window === tab.window;
            }); //! HACKY

            item.undoState.windowId = tab.windowId;
            item.undoState.index = tab.index;
            item.undoState.windowName = title.tabIcon.indexText.value;

            var push = 0;

//            try {
            (function () {
                var level = state.indent[tab.window.index];
                if (level) {
                    item.undoState.indentLevel = level[tab.index];
                }

                level = item.undoState.indentLevel || 0;

                if (i === 0) {
                    first = previous = level;
//                    push = level - previous;
                } else {
                    var diff = level - previous;
//                    console.log(level, previous);
                    if (diff > 1) {
                        previous += 1;
                        push = previous;
                    } else {
                        previous += diff;
                        push = previous - first;
                    }
//
//                    console.log(push, diff, level, previous);
//                    console.log(diff, previous);
//                    console.log(diff, level, previous, first);
//                    console.log(push, first);
                }
//
//                console.log(push);
//
//                console.log(push);
//                console.log(push);
//                previous = level;
//                console.log(level, previous, push);
//
//                previous = level;
//
            }());
//            } catch (e) {
//                console.error(e);
//            }
//
//            console.log(item.undoState.windowName);
//
//            console.log(tab.window.index, state.titles[tab.window.index], state.titles.slice());
//
//            index -= 1;
//

            var index = (to === null) ? 9999999 : to;
//
//            if (
//
//            console.log(index);
//            console.log(tab.index, index - 1, i);

            var test = (i === 0
                         ? tab.index + 1 < index
                         : tab.index + 1 <= index);
//
//            console.log(tab.index + 1, index, test);

            if (tab.window === win) {
//                if (i === self.length - 1) {
                if (test) {
//                    item.undoState.index += 1;
                    index -= 1;
//                    console.log(index);
//                    index += i;
    //                item.undoState.index += 1;
    //                item.undoState.index -= 1;
//                    index += 1;
    //                console.log(tab.index, index);
                } else {//if (tab.index !== index - 1) {
//                    console.log(i, tab.title, tab.index, index - 1);
//                    item.undoState.index += i;
                    index += i;
//                    console.log(index);
                }
            } else {
                index += i;
//                console.log(index);
            }
/*
            if (i === 0 && tab.index + 1 === index) {
                return;
            }*/
//
//
//            console.log(index, indent + push);

//            (function (push) {
            Tab.move(item, {
                windowId: win.id,
                index: index
            }, function (tab) {
//                var index = ;// - (item.undoState.indentLevel || 0);
//                console.log(indent, push);
//                console.log(push);
/*
                if (level[tab.index] < indent) {
                    level[tab.index] = indent;
                }

                if (info.indent) {

                }*/
//                console.log(indent);
//
//                console.log(index);
//
//                console.log(slice, indent, to - 1);
//                console.log(indent, info.index - 1, level.slice());
//
//                console.log(indent, push);
//
/*
                if (level) {
                    old = level[tab.index];
                }*/
                var index = tab.window.index;

                var level = state.indent[index];
                if (!level) {
                    level = state.indent[index] = [];
                }

                var to = indent + push;

                if (to <= 0) {
                    delete level[tab.index];
                } else {
                    level[tab.index] = to;
                }
//
//                console.log(indent, to);

                if (level[tab.index] !== item.undoState.indentLevel) {
                    Platform.event.trigger("tab-indent", tab, level[tab.index]);
                }
/*
                if (typeof info.action === "function") {
                    info.action(tab, item);
                }*/
//                console.log(i, indent, push);
//                console.log(indent, to - 1, index, level.slice());
//                console.log(tab.index, level[tab.index]);
            });
//            }(push));

            return true;
        });
//
//        var list = Platform.tabs.moveArray(this, info);

        if (list.length) {
            if (info.undo !== false && Options.get("undo.move-tabs")) {
                Undo.push("move-tabs", {
                    list: list
                });

                if (list.length === 1) {
                    state.undoBar.show("You moved " + list.length + " tab.");
                } else {
                    state.undoBar.show("You moved " + list.length + " tabs.");
                }
            }

            this.reset();
            delete this.shiftNode;
        }

        return list;
    };
}());
