function Color() {}

Color.toHex = (function () {
    function toHex(num) {
        if (typeof num === "number" && num > 0) {
            return Math.min(255, num).toString(16);
        } else {
            return "00";
        }
    }
    return function (r, g, b) {
        return "#" + toHex(r) + toHex(g) + toHex(b);
    };
}());

Color.toRGB = (function () {
    function toRGB(num) {
        return parseInt(num, 16);
    }
    return function (hex) {
        if (typeof hex !== "string") {
            throw new TypeError("1st argument must be a string.");
        }
        if (hex[0] !== "#") {
            throw new Error("1st character must be a hash (#)");
        }

        if (hex.length === 4) {
            return [
                hex.slice(1, 2),
                hex.slice(2, 3),
                hex.slice(3, 4)
            ].map(function (item) {
                return toRGB(item + item);
            });
        } else if (hex.length === 7) {
            return [
                toRGB(hex.slice(1, 3)),
                toRGB(hex.slice(3, 5)),
                toRGB(hex.slice(5, 7))
            ];
        } else {
            throw new Error("Number must be 3 or 6 characters long.");
        }
    };
}());
