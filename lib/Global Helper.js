"use strict";
/*global chrome, Node */

/*Math.range = function (a, b) {
    var min = +a;
    var max = +b;

    var i, array = [];
    if (min < max) {
        for (i = min; i <= max; i += 1) {
            array.push(i);
        }
    } else {
        for (i = min; i >= max; i -= 1) {
            array.push(i);
        }
    }
    return array;
};*/

/*Node.prototype.hide = function () {
    var old = this.style.display;
    if (old !== "none") {
        this.style.display = "none !important";

        this.show = function () {
            this.style.display = old;
        };
    }
};
Node.prototype.show = function () {};*/

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
    var escape = {};
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
Array.prototype.add = function (item) {
    var index = this.indexOf(item);
    if (index === -1) {
        return this.push(item);
    }
};
Array.prototype.remove = function (item) {
    var index = this.indexOf(item);
    if (index !== -1) {
        return this.splice(index, 1);
    }
};
Array.prototype.toggle = function (item) {
    var index = this.indexOf(item);
    if (index === -1) {
        this.push(item);
        return true;
    } else {
        this.splice(index, 1);
        return false;
    }
};
Array.prototype.has = function (item) {
    return this.indexOf(item) !== -1;
};
Array.prototype.reset = function () {
    this.forEach(function (item) {
        item.removeAttribute("data-queued");
    });
    this.length = 0;
    //state.search();
};

Array.prototype.moveTabs = function (id, index) {
    if (typeof index !== "number" || index < 0) {
        index = 9999999;
    }

    this.sort(function (a, b) {
        return b.tab.index - a.tab.index;
    });

    this.forEach(function (item) {
        var tab = item.tab;
        Platform.tabs.move(tab.id, {
            windowId: id,
            index: index
        }, function () {
            //!
            Platform.tabs.get(tab.id, function (tab) {
                item.tab = tab;
            });
        });
    });
};

["forEach", "indexOf", "reduce", "slice"].forEach(function (key) {
    if (typeof Array[key] !== "function") {
        Array[key] = function (array) {
            var args = Array.prototype.slice.call(arguments, 1);
            return Array.prototype[key].apply(array, args);
        };
    }
});
