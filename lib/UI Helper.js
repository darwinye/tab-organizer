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
    parent.scrollTop = node.offsetTop - (parent.clientHeight / 2) + (node.offsetHeight / 2) + 3;
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
//            document.body.appendChild(modal);
            info.parent.appendChild(modal);

            var trigger = document.createEvent("Event");
            trigger.initEvent("UI-modal-on", false, false);
            element.dispatchEvent(trigger);

            function remove(event) {
                modal.removeEventListener("contextmenu", remove, true);
                modal.removeEventListener("click", remove, true);
                removeEventListener("keydown", keydown, true);

                event.preventDefault();

                element.style.zIndex = info.zIndex;
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
                if (typeof action === "function") {
                    action();
                }

                var trigger = document.createEvent("Event");
                trigger.initEvent("UI-modal-off", false, false);
                element.dispatchEvent(trigger);
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
            modal.addEventListener("contextmenu", remove, true);
            modal.addEventListener("click", remove, true);
//            modal.addEventListener("contextmenu", function anon(event) {
//                this.removeEventListener(event.type, anon, false);
//                event.preventDefault();

//                remove(event);
//            }, false);
        } else if (info.parent) {
            //remove();
            var event = document.createEvent("Event");
            event.initEvent("click", false, false);
            modal.dispatchEvent(event);
            info.parent = null;
        }
    };
}());

UI.contextMenu = function (initialize) {
    var container = document.createElement("ul");
    container.className = "UI-contextMenu";
    container.title = "\0";

    /*function hide() {
        container.style.display = "none !important";
    }
    hide();*/
    //container.hide();
    container.setAttribute("hidden", "");

    container.addEventListener("contextmenu", function (event) {
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

    function hoverin() {
        this.setAttribute("data-selected", "");
    }
    function hoverout() {
        this.removeAttribute("data-selected");
        //item.style.color = item.style.backgroundImage = "";
        //item.style.borderColor = "transparent";
    }

    var root = document.documentElement;

    var menu = {
        "DOM.Element": container,
        //items: container,
        clear: function () {
            var element = this["DOM.Element"];
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        },
        show: function (info) {
            if (!container.hasAttribute("hidden")) {
                return;
            }

            info = Object(info);

//            var old = {
//                position: container.style.position,
//                left: container.style.left,
//                top: container.style.top
//            };

            if ("x" in info || "y" in info) {
                container.style.position = "fixed";
                container.style.left = info.x + 5 + "px";
                container.style.top = info.y + 7 + "px";
            }

            //container.show();
            container.removeAttribute("hidden");

            var width = container.offsetWidth;
            var height = container.offsetHeight;

            if (width + info.x > root.clientWidth) {
                container.style.left = info.x - width - 2 + "px";
            }
            if (height + info.y > root.clientHeight) {
                container.style.top = info.y - height + "px";
            }

            addEventListener("keydown", keydown, true);
            UI.modal(container, function () {
                removeEventListener("keydown", keydown, true);
                //container.hide();
                container.setAttribute("hidden", "");

                if (typeof info.onhide === "function") {
                    info.onhide();
                }

                container.style.position = "";
                container.style.left = "";
                container.style.top = "";
            });

            /*addEventListener("mousedown", events.disable, true);
            addEventListener("mousedown", events.stop, true);
            addEventListener("click", hide, true);*/
        },
        submenu: function (name, info) {
            info = Object(info);

            var element = this["DOM.Element"];

            var item = document.createElement("li");
            item.className = "UI-contextMenu-submenu";
            item.innerHTML = name;

            var padding = document.createElement("div");
            padding.className = "UI-contextMenu-submenu-padding";

            var list = document.createElement("ul");
            list.className = "UI-contextMenu-submenu-list";

//            this.items = list;

            var mask = document.createElement("div");
            mask.className = "UI-contextMenu-submenu-mask";

            var image = document.createElement("img");
            image.className = "UI-contextMenu-arrow";
            image.src = "/images/context-menu-arrow.png";

//            var mask2 = document.createElement("div");
//            mask2.className = "UI-contextMenu-submenu-mask num2";

            container.addEventListener("UI-modal-off", function () {
                item.removeAttribute("data-selected");
                mask.removeAttribute("data-overflow-x");
                mask.removeAttribute("data-overflow-y");
                padding.removeAttribute("data-overflow-x");
                padding.removeAttribute("data-overflow-y");
            }, true);

//            var timer;

//            var RAD_TO_DEG = Math.PI / 180;

//            function computeAngle(x, y) {
//                var angle = Math.atan(y / x) / RAD_TO_DEG;
//                if (x < 0) {
//                    angle += 180;
//                } else if (y < 0) {
//                    angle += 360;
//                }
//                return angle;
//            }

//            function mousemove(event) {
//                var x = event.clientX - mousemove.oldX,
//                    y = event.clientY - mousemove.oldY;

//                var angle = computeAngle(x, y);

//                //var ratio = x / y;
//                //console.log(angle, mousemove.oldX, mousemove.oldY);
//                //item.removeAttribute("data-selected");

////                if (!item.contains(event.target) && ratio < 1.5) {
//                if (!item.contains(event.target) && (angle < 0 || angle > 50)) {
//                    removeEventListener("mousemove", mousemove, true);
//                    item.removeAttribute("data-selected");
//                }
//            }

            var clone = Object.create(menu, {
                "DOM.Element": { value: list }
            });

            function hoverin(event) {
//                clearTimeout(timer);

                //console.log(event.relatedTarget);

                if (!item.contains(event.relatedTarget)) {
                    if (!item.hasAttribute("data-selected")) {
//                        console.log("info.onopen");
                        if (typeof info.onopen === "function") {
                            info.onopen(clone);
                        }
                    }
                }

                item.setAttribute("data-selected", "");

                var box = padding.getBoundingClientRect();
                if (box.right > root.clientWidth) {
                    mask.setAttribute("data-overflow-x", "");
                    padding.setAttribute("data-overflow-x", "");
                }
                if (box.bottom > root.clientHeight) {
                    mask.setAttribute("data-overflow-y", "");
                    padding.setAttribute("data-overflow-y", "");
                }

//                padding.setAttribute("hidden", "");
//                padding.removeAttribute("hidden");

                //console.log(box.right, pageXOffset, root.clientWidth);
//                addEventListener("mousemove", mousemove, true);

                //console.log(event.clientX, event.clientY);

                //if (event.target === this) {
//                    mousemove.oldX = event.clientX;
//                    mousemove.oldY = event.clientY;
                //}

//                list.style.opacity = "0";

//                timer = setTimeout(function () {
//                    item.setAttribute("data-selected", "");

//                    list.style.opacity = "1";
//                }, 200);
            }
            function hoverout(event) {
//                clearTimeout(timer);

                if (!item.contains(event.relatedTarget)) {
//                    removeEventListener("mousemove", mousemove, true);
                    item.removeAttribute("data-selected");

                    if (typeof info.onclose === "function") {
                        info.onclose(clone);
                    }
                }
            }

            clone.enable = function () {
                item.addEventListener("mouseover", hoverin, true);
                item.addEventListener("mouseout", hoverout, true);
                item.removeAttribute("data-disabled");
            };
            clone.disable = function () {
                item.removeEventListener("mouseover", hoverin, true);
                item.removeEventListener("mouseout", hoverout, true);
                item.setAttribute("data-disabled", "");
            };
            clone.enable();

            if (typeof info.onshow === "function") {
                container.addEventListener("UI-modal-on", function () {
                    info.onshow(clone);
                }, true);
            }

            if (info.keys instanceof Array) {
                info.keys.forEach(function (key) {
                    keys[key] = function () {
                        element.addEventListener("mouseout", function anon(event) {
                            if (!item.contains(event.relatedTarget)) {
                                this.removeEventListener(event.type, anon, true);
                                item.removeAttribute("data-selected");
                            }
                        }, true);

                        hoverin({});
                    };
                });
            }

            if (typeof info.create === "function") {
                info.create(clone);
            }

            padding.appendChild(list);
            item.appendChild(image);
            item.appendChild(padding);
            item.appendChild(mask);
//            item.appendChild(mask2);
            element.appendChild(item);
        },
        addItem: function (name, info) {
            info = Object(info);

            var item = document.createElement("li");
            item.className = "UI-contextMenu-item";
            item.innerHTML = name;

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

            var actions = {
                enable: function () {
                    //item.removeEventListener("click", disable, true);
                    item.addEventListener("mouseup", modal, true);
                    item.addEventListener("contextmenu", modal, true);
                    item.addEventListener("mouseover", hoverin, true);
                    item.addEventListener("mouseout", hoverout, true);

                    item.removeAttribute("data-disabled");

                    //item.style.color = "black";
                },
                disable: function () {
                    //item.addEventListener("click", disable, true);
                    item.removeEventListener("mouseup", modal, true);
                    item.removeEventListener("contextmenu", modal, true);
                    item.removeEventListener("mouseover", hoverin, true);
                    item.removeEventListener("mouseout", hoverout, true);

                    item.setAttribute("data-disabled", "");

                    hoverout.call(item);
                    //item.style.color = "#aaaaaa";
                }
            };
            actions.enable();

            if (typeof info.onshow === "function") {
                container.addEventListener("UI-modal-on", function () {
                    info.onshow(actions);
                }, true);
            }

            this["DOM.Element"].appendChild(item);
            return actions;
        },
        separator: function () {
            var item = document.createElement("hr");
            item.className = "UI-contextMenu-separator";

            this["DOM.Element"].appendChild(item);
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

    return container;
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
