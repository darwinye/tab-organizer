"use strict";

Array.prototype.add = function (item) {
    var index = this.indexOf(item);
    if (index === -1) {
        this.push(item);
        return true;
    }
    return false;
};
Array.prototype.remove = function (item) {
    var index = this.indexOf(item);
    if (index !== -1) {
        this.splice(index, 1);
        return true;
    }
    return false;
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



["forEach", "indexOf", "reduce", "slice"].forEach(function (key) {
    if (typeof Array[key] !== "function") {
        Array[key] = function (array) {
            var args = Array.prototype.slice.call(arguments, 1);
            return Array.prototype[key].apply(array, args);
        };
    }
});
