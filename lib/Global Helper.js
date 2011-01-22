/*global Node, Options, state, Tab, Undo */

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

    Array.prototype.moveTabs = function (id, to, undo) {
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

        var list = this.filter(function (item, i) {
            var tab = item.tab;
//
//            delete item.undoState.windowId;
//            delete item.undoState.index;

            if (tab.windowId === id && (to === null || tab.index === to)) {
                return false;
            }

            var title = state.list.find(function (item) {
                return item.window === tab.window;
            }); //! HACKY

            item.undoState.windowId = tab.windowId;
            item.undoState.index = tab.index;
            item.undoState.windowName = title.tabIcon.indexText.value;
//
//            console.log(item.undoState.windowName);
//
//            console.log(tab.window.index, state.titles[tab.window.index], state.titles.slice());
//
//            index -= 1;
//

            var index = (to === null) ? 9999999 : to;

            if (tab.windowId === id) {
                if (tab.index < index) {
//                    item.undoState.index += 1;
                    index -= 1;
    //                item.undoState.index += 1;
    //                item.undoState.index -= 1;
//                    index += 1;
    //                console.log(tab.index, index);
                } else {
//                    item.undoState.index += i;
                    index += i;
                }
            } else {
                index += i;
            }

            Tab.move(item, {
                windowId: id,
                index: index
            });

            return true;
        });


        if (list.length) {
            if (undo !== false && Options.get("undo.move-tabs")) {
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
