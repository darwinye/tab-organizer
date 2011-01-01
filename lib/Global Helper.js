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


    String.prototype.fromBase = function (base) {
        return parseInt(this, base);
    };

    (function () {
        //var escape = {};
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

    Array.prototype.moveTabs = function (id, index, undo) {
        if (typeof index !== "number" || index < 0) {
            index = null;
        }

        this.sort(function (a, b) {
            return b.tab.index - a.tab.index;
        });

        var list = this.filter(function (item) {
            var tab = item.tab;

            if (tab.windowId === id && (index === null || tab.index === index)) {
                return false;
            }

            item.undoState.windowId = tab.windowId;
            item.undoState.index = tab.index;

            Tab.move(item, {
                windowId: id,
                index: (index === null) ? 9999999 : index
            });

            return true;
        });


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

        return list;
    };
}());
