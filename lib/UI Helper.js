"use strict";
/*global Element */

function UI() {}

UI.create = function (name, initialize) {
    var element = document.createElement(name);
    if (typeof initialize === "function") {
        initialize(element);
    }
    return element;
};
UI.scrollTo = function (node, parent) {
    parent.scrollTop = node.offsetTop - (parent.clientHeight / 2) + node.offsetHeight;
};
UI.scrollIntoView = (function () {
    var timer, html = document.documentElement;
    return function (node, parent, offset) {
        //if (!timer) {
            var rect = node.getBoundingClientRect();

            var doubleoff = offset * 2;
            var coord = {
                left: rect.left - doubleoff,
                right: rect.right + offset,
                top: rect.top - doubleoff,
                bottom: rect.bottom + offset
            };

            if (coord.left < 0) {
                parent.scrollLeft += coord.left;
                //timer = true;
            } else if (coord.right > html.clientWidth) {
                parent.scrollLeft += coord.right - html.clientWidth;
                //timer = true;
            }

            if (coord.top < 0) {
                parent.scrollTop += coord.top;
                //timer = true;
            } else if (coord.bottom > html.clientHeight) {
                parent.scrollTop += coord.bottom - html.clientHeight;
                //timer = true;
            }

            /*setTimeout(function () {
                timer = false;
            }, 500);*/
        //}
    };
}());

/*UI.style = function (element, styles) {
    styles = Object(styles);

    var reset = {};

    if (element instanceof Element) {
        for (var key in styles) {
            if (Object.prototype.hasOwnProperty.call(styles, key)) {
                reset[key] = element.style[key];
                element.style[key] = styles[key];
            }
        }
    }

    return {
        reset: function () {
            for (var key in reset) {
                if (Object.prototype.hasOwnProperty.call(reset, key)) {
                    element.style[key] = reset[key];
                }
            }
        }
    };
};*/

UI.modal = (function () {
    var modal = document.createElement("div");
    modal.title = "\0";

    modal.style.position = "fixed !important";
    modal.style.left = modal.style.top = "0px !important";
    modal.style.width = modal.style.height = "100% !important";
    modal.style.cursor = "default !important";
    modal.style.zIndex = "9001 !important";
    //modal.style.backgroundColor = "black !important";
    //modal.style.opacity = "0.009 !important";
    //modal.style.backgroundColor = "white !important";
    //modal.style.opacity = "0.15 !important";

    var info = {};

    return function (element, action) {
        if (element instanceof Element) {
            info.parent = element.parentNode;
            info.zIndex = element.style.zIndex;

            element.style.zIndex = "9002 !important";
            info.parent.appendChild(modal);

            function remove(event) {
                modal.removeEventListener("contextmenu", remove, false);
                modal.removeEventListener("click", remove, false);
                removeEventListener("keydown", keydown, true);

                event.preventDefault();

                element.style.zIndex = info.zIndex;
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
                if (typeof action === "function") {
                    action();
                }
            }

            function keydown(event) {
                if (event.which === 27) {
                    remove(event);
                }
            }
            addEventListener("keydown", keydown, true);

            /*parent.addEventListener("mousedown", function anon(event) {
                this.removeEventListener(event.type, anon, true);

                console.log(event.target === this);

                if (event.target === this) {
                    parent.addEventListener("mouseup", function anon(event) {
                        this.removeEventListener(event.type, anon, true);

                        event.stopPropagation();
                    }, true);
                }
            }, true);*/
            //modal.addEventListener("click", remove, true);
            //element.addEventListener("click", remove, true);
            modal.addEventListener("contextmenu", remove, false);
            modal.addEventListener("click", remove, false);
//            modal.addEventListener("contextmenu", function anon(event) {
//                this.removeEventListener(event.type, anon, false);
//                event.preventDefault();

//                remove(event);
//            }, false);
        } else if (info.parent) {
            //remove();
            var event = document.createEvent("Event");
            event.initEvent("click", true, false);
            modal.dispatchEvent(event);
            info.parent = null;
        }
    };
}());

UI.contextMenu = function (initialize) {
    var element = document.createElement("ul");
    element.className = "UI-contextMenu";
    element.title = "\0";

    element.style.webkitBoxShadow = "dimgray 0px 1px 5px"; //! 1px 1px 4px

    element.style.position = "absolute";
    element.style.top = "100%";
    element.style.padding = "2px 2px"; // "2px 2px"
    element.style.marginLeft = "-2px";
    //element.style.marginTop = "13px";
    element.style.marginTop = "-5px";

    element.style.font = "menu";
    element.style.fontSize = "13px";
    //element.style.fontVariant = "small-caps";
    //element.style.textTransform = "capitalize";
    //element.style.textAlign = "right";
    //element.style.letterSpacing = "1px";

    element.style.backgroundColor = "white";
    element.style.border = "1px solid dimgray"; /*dimgray #aaaaaa*/

    element.style.whiteSpace = "nowrap";
    element.style.listStyle = "none";
    element.style.cursor = "default";

    /*function hide() {
        element.style.display = "none !important";
    }
    hide();*/
    //element.hide();
    element.setAttribute("hidden", "");

    element.addEventListener("contextmenu", function (event) {
        event.preventDefault();
    }, true);

    var keys = {};

    function keydown(event) {
        event.preventDefault();
        event.stopPropagation();

        //var key = ;
        var action = keys[String.fromCharCode(event.which)/*.toLowerCase()*/];
        if (typeof action === "function") {
            action(event);
        }
    }

    var menu = {
        "DOM.Element": element,
        show: function (action) {
            //element.show();
            element.removeAttribute("hidden");

            addEventListener("keydown", keydown, true);
            UI.modal(element, function () {
                removeEventListener("keydown", keydown, true);
                //element.hide();
                element.setAttribute("hidden", "");

                if (typeof action === "function") {
                    action();
                }
            });

            /*addEventListener("mousedown", events.disable, true);
            addEventListener("mousedown", events.stop, true);
            addEventListener("click", hide, true);*/
        },
        addItem: function (name, info) {
            info = Object(info);

            var item = document.createElement("li");
            item.innerHTML = name;
            item.style.padding = "1px 6px 2px"; // "1px 6px 2px"
            //item.style.margin = "-1px";
            item.style.border = "1px solid transparent";
            item.style.cursor = "pointer";

//                function disable(event) {
//                    event.stopPropagation();
//                }
            function modal(event) {
                UI.modal(null);
                info.action(event);
            }
            if (info.keys instanceof Array) {
                info.keys.forEach(function (item) {
                    keys[item/*.toLowerCase()*/] = modal;
                });
            }

            function hoverin() {
                item.style.color = "white";
                item.style.backgroundImage = "-webkit-gradient(linear, 0% 0%, 0% 100%, from(#99c5fb), to(#5fa0f0))";
                item.style.borderColor = "#375C89";
            }
            function hoverout() {
                item.style.color = item.style.backgroundImage = "";
                item.style.borderColor = "transparent";
            }

            var actions = {
                enable: function () {
                    //item.removeEventListener("click", disable, true);
                    item.addEventListener("mouseup", modal, true);
                    item.addEventListener("contextmenu", modal, true);
                    item.addEventListener("mouseover", hoverin, true);
                    item.addEventListener("mouseout", hoverout, true);

                    item.style.color = "black";
                },
                disable: function () {
                    //item.addEventListener("click", disable, true);
                    item.removeEventListener("mouseup", modal, true);
                    item.removeEventListener("contextmenu", modal, true);
                    item.removeEventListener("mouseover", hoverin, true);
                    item.removeEventListener("mouseout", hoverout, true);

                    hoverout();
                    item.style.color = "#aaaaaa";
                }
            };
            actions.enable();

            element.appendChild(item);
            return actions;
        },
        separator: function () {
            var item = document.createElement("hr");
            item.style.border = "none";
            item.style.borderTop = "1px solid #dcdcdc"; //! #acacac
            //item.style.borderColor = "";
            item.style.margin = "3px 4px"; // "3px -1px"

            element.appendChild(item);
        }
    };

    /*dropdown.addEventListener("mouseup", function (event) {
        if (event.target.localName === "li") {
            UI.modal(null);
        }
    }, true);*/

    if (typeof initialize === "function") {
        initialize(menu);
    }

    return element;
};

/*(function () {
    function mouseEvent(element, name, info) {
        var event = document.createEvent("MouseEvents");

        event.initMouseEvent(name, true, true, info.view, info.detail,
            info.screenX, info.screenY, info.clientX, info.clientY,
            info.ctrlKey, info.altKey, info.shiftKey, info.metaKey,
            info.button, info.target);

        return element.dispatchEvent(event);
    }

    function dragstart(event) {
        mouseEvent(event.target, "KAE-dragstart", event);
    }

    //addEventListener("dragstart", dragstart, false);
    addEventListener("mousedown", dragstart, false);

    addEventListener("KAE-dragstart", function (event) {
        var element = event.target;

        //console.log(event.type);

        function drag(event) {
            mouseEvent(element, "KAE-drag", event);
        }
        function dragend(event) {
            mouseEvent(element, "KAE-dragend", event);
        }

        if (!event.defaultPrevented) {
            //addEventListener("blur", dragend, false);
            //addEventListener("dragover", drag, false);
            addEventListener("mousemove", drag, false);
            addEventListener("mouseup", dragend, false);
            //addEventListener("dragend", dragend, false);

            //var endEvents = ["mouseup", "blur"];
            //endEvents.forEach(function (name) {
                //addEventListener(name, dragend, false);
            //});

            addEventListener("KAE-dragend", function anon(event) {
                //console.log(event.type);

                if (!event.defaultPrevented) {
                    this.removeEventListener(event.type, anon, false);

                    //removeEventListener("blur", dragend, false);
                    //removeEventListener("dragover", drag, false);
                    removeEventListener("mousemove", drag, false);
                    removeEventListener("mouseup", dragend, false);
                    //removeEventListener("dragend", dragend, false);

                    //endEvents.forEach(function (name) {
                        //removeEventListener(name, dragend, false);
                    //});

                    console.assert(!anon.hasRun);
                    anon.hasRun = true;
                }
            }, false);
        }
    }, false);
}());*/
