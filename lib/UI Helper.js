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


UI.link = function (initialize) {
    var element = document.createElement("button");
    element.className = "UI-link";

//    element.addEventListener("keydown", function (event) {
//        if (event.which === 13 || event.which === 32) { //* Enter/Space
//            var trigger = document.createEvent("Event");
//            trigger.initEvent("click", false, false);
//            element.dispatchEvent(trigger);
//        }
//    }, true);

//    element.addEventListener("mousedown", function (event) {
//        event.preventDefault();
//    }, true);

    if (typeof initialize === "function") {
        initialize(element);
    }

    if (element.href) {
        element.addEventListener("click", function anon() {
//            if (anon.popup) {
//                anon.popup.close();
//            }
            anon.popup = open(this.href, this.target);
        }, true);
    }

    return element;
};


UI.scrollTo = function (node, parent) {
    var rect = node.getBoundingClientRect();
//    console.log(rect.left - parent.clientWidth / 2);
//    console.log((parent.clientWidth / 2) + (node.offsetWidth / 2));
    parent.scrollLeft += rect.left - (parent.clientWidth / 2) + (rect.width / 2); // + 91
    parent.scrollTop = rect.top - (parent.clientHeight / 2) + (rect.height / 2) + 3;

    /*(function () {
        var rect = node.getBoundingClientRect();
        console.log(node, rect.left, parent.clientWidth - rect.right);
    }());*/
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
                bottom: rect.bottom + offset,
                width: (rect.width / 2),
                height: (rect.height / 2)
            };

            if (coord.left < 0) {
                parent.scrollLeft += coord.left + coord.width;
                //timer = true;
            } else if (coord.right > html.clientWidth) {
                parent.scrollLeft += coord.right - html.clientWidth + coord.width;
                //timer = true;
            }

            if (coord.top < 0) {
                parent.scrollTop += coord.top + coord.height;
                //timer = true;
            } else if (coord.bottom > html.clientHeight) {
                parent.scrollTop += coord.bottom - html.clientHeight + coord.height;
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
    //modal.style.border = "1px solid red";
    //modal.style.outline = "none !important";
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

            function drag(event) {
                modal.style.display = "none !important";
                var target = document.elementFromPoint(event.clientX, event.clientY);
                modal.style.display = "";

                if (!info.parent.contains(target)) {
                    remove();
                }
                //console.log();
                //if (event.target === this) {
                    //remove();
                //modal.addEventListener("dragenter", remove, true);
                //}
            }

            function remove(event) {
                //info.parent.removeEventListener("dragleave", drag, true);
                //info.parent.removeEventListener("dragenter", drag, true);
                modal.removeEventListener("dragover", drag, true);
                modal.removeEventListener("contextmenu", remove, true);
                //modal.removeEventListener("dragenter", remove, true);
                modal.removeEventListener("click", remove, true);
                removeEventListener("keydown", keydown, true);

                if (event) {
                    event.preventDefault();
                }

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
            //info.parent.addEventListener("dragover", drag, true);
            //element.addEventListener("dragenter", drag, true);
            modal.addEventListener("dragover", drag, true);
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

//    container.addEventListener("click", function (event) {
//        event.stopPropagation();
//    }, true);

    container.keys = {};


    function close() {
        UI.modal(null);
    }

    function findEnabled(element, forward) {
        var next = (forward) ?
            element.previousSibling :
            element.nextSibling;

        if (!next) {
            return null;
        }

        if (next.localName !== "li" || next.hasAttribute("data-disabled")) {
            return findEnabled(next, forward);
        } else {
            return next;
        }
    }

    function unhover() {
        var query = container.querySelector(".UI-contextMenu-item[data-selected]");
        if (query) {
            query.removeAttribute("data-selected");
        }
    }

    function select() {
//        unhover();
//        this.setAttribute("data-selected", "");

//        console.log("select");

        var name = this.className;
        var query = container.querySelector("." + name + "[data-selected]");
        if (query) {
            query.removeAttribute("data-selected");
        }

        this.setAttribute("data-selected", "");
    }
    function unselect() {
        this.removeAttribute("data-selected");
        //item.style.color = item.style.backgroundImage = "";
        //item.style.borderColor = "transparent";
    }

    function keydown(event) {
        event.preventDefault();
        event.stopPropagation();

//        console.log(event.which);

        if (event.which === 38 || event.which === 40) { //* Up/Down
            var next, item, query = container.querySelector("[data-selected]");

            if (query) {
                if (query.className === "UI-contextMenu-submenu") {
                    item = query.querySelector(".UI-contextMenu-item[data-selected]");
                    if (item) {
                        query = item;
                    }
                }
                next = findEnabled(query, event.which === 38);
            } else if (event.which === 40) {
                next = container.firstChild;
            }

            if (next) {
                if (next.className === "UI-contextMenu-submenu") {
                    var trigger = document.createEvent("Event");
                    trigger.initEvent("UI-selected", false, false);
                    next.dispatchEvent(trigger);
                }

                //                console.log(query, next);
                next.setAttribute("data-selected", "");
                next.scrollIntoViewIfNeeded(false);

                if (!next.previousSibling) {
                    next.parentNode.scrollTop -= 9001;
                } else if (!next.nextSibling) {
                    next.parentNode.scrollTop += 9001;
                }

                if (query) {
                    query.removeAttribute("data-selected");
                }
            }
        } else if (event.which === 37 || event.which === 39) { //* Left/Right
            var submenu = container.querySelector(".UI-contextMenu-submenu[data-selected]");
            if (submenu) {
                if (event.which === 37) {
                    unhover();
                } else {
                    var query = submenu.list.querySelector(".UI-contextMenu-item[data-selected]");

                    if (!query) {
                        var child = submenu.list.firstChild;
                        if (child) {
                            child.setAttribute("data-selected", "");
                        }
                    }
                }
            }
        } else if (event.which === 13 || event.which === 32) { //* Enter/Space
            var query = container.querySelector(".UI-contextMenu-item[data-selected]");
            if (query) {
                var trigger = document.createEvent("Event");
                trigger.initEvent("mouseup", false, false);
                query.dispatchEvent(trigger);
            }
        } else {
            var keys = container.keys;

            var submenu = container.querySelector(".UI-contextMenu-submenu[data-selected]");
            if (submenu) {
                if (submenu.querySelector(".UI-contextMenu-item[data-selected]")) {
                    keys = submenu.list.keys;
//                    console.log(submenu.list.keys);
                }
            }

            //var key = ;
            var info = keys[String.fromCharCode(event.which)/*.toLowerCase()*/];
//            console.log(container.keys);
            if (info && !info.item.hasAttribute("data-disabled")) {
                if (typeof info.action === "function") {
                    unhover();
                    info.action(event);
                }
            }
        }
    }


    var root = document.documentElement;

    var menu = {
        "DOM.Element": container,
        //items: container,
        clear: function () {
            var parent = this["DOM.Element"];
            while (parent.firstChild) {
                parent.removeChild(parent.firstChild);
            }
        },
        hide: close,
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
            addEventListener("dragend", close, true);

            UI.modal(container, function () {
                removeEventListener("keydown", keydown, true);
                removeEventListener("dragend", close, true);

                //container.hide();
                container.setAttribute("hidden", "");

                if (typeof info.onhide === "function") {
                    info.onhide();
                }

                unhover();

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

            var parent = this["DOM.Element"];

            var item = document.createElement("li");
            item.className = "UI-contextMenu-submenu";
            item.innerHTML = name;

            var padding = document.createElement("div");
            padding.className = "UI-contextMenu-submenu-padding";

            var list = document.createElement("ul");
            list.className = "UI-contextMenu-submenu-list";
            list.keys = {};

            item.list = list;

            var mask = document.createElement("div");
            mask.className = "UI-contextMenu-submenu-mask";

            var image = document.createElement("img");
            image.className = "UI-contextMenu-arrow";
            image.src = "/images/context-menu-arrow.png";

//            var mask2 = document.createElement("div");
//            mask2.className = "UI-contextMenu-submenu-mask num2";

            container.addEventListener("UI-modal-off", function () {
                item.removeAttribute("data-selected");
//                mask.removeAttribute("data-overflow-x");
//                mask.removeAttribute("data-overflow-y");
//                padding.removeAttribute("data-overflow-x");
//                padding.removeAttribute("data-overflow-y");
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

            item.addEventListener("UI-selected", function (event) {
                if (!item.hasAttribute("data-selected")) {
                    if (typeof info.onopen === "function") {
                        info.onopen(clone);
                    }
                }

                padding.removeAttribute("data-overflow-x");
//                padding.removeAttribute("data-overflow-y");

                list.style.overflowY = "";
                padding.style.height = "";
//                padding.style.position = "";
//                padding.style.left = "";
//                padding.style.bottom = "";
                padding.style.top = "";
                //list.style.marginRight = "";

                var box = padding.getBoundingClientRect();

                if (box.right > root.clientWidth) {
//                    mask.setAttribute("data-overflow-x", "");
                    padding.setAttribute("data-overflow-x", "");
                }

                if (box.height > root.clientHeight) {
                    //padding.style.overflow = "auto";
                    padding.style.height = root.clientHeight + "px";
                    //padding.style.left = box.left + "px";
                    //padding.style.position = "fixed";
                    //padding.style.top = "0px";

                    //padding.style.top = ;

                    //console.log(box);

                    //padding.setAttribute("data-overflow-y", "");

                    //box = padding.getBoundingClientRect();
                    //console.log(box.top, root.clientHeight);

                    padding.style.top = -box.top + "px";

                    //padding.removeAttribute("data-overflow-y");
                    //if (box.top < 0) {
                        //padding.style.bottom = box.top + "px";
                    //}
                    //padding.style.bottom = box.top + "px";
                    //padding.style.top = box.top - root.clientHeight + "px";
                    //list.style.overflowY = "scroll !important";
                    //list.style.marginRight = "20px";
                    //padding.style.bottom = "";
                    //console.dir(padding);
                } else {
                    list.style.overflowY = "visible";

                    if (box.bottom > root.clientHeight) {
    //                    mask.setAttribute("data-overflow-y", "");
    //                    padding.setAttribute("data-overflow-y", "");

                        //padding.style.overflow = "";

                        padding.style.top = root.clientHeight - box.bottom + "px";

                        //console.log(box, diff);
                    }
                }

//                document.body.style.display = "none !important";
//                document.body.style.display = "";
            }, true);

            function hoverin(event) {
//                clearTimeout(timer);

                //console.log(event.relatedTarget);

                if (!item.contains(event.relatedTarget)) {
                    var trigger = document.createEvent("Event");
                    trigger.initEvent("UI-selected", false, false);
                    item.dispatchEvent(trigger);

                    select.call(item);

//                    item.setAttribute("data-selected", "");
//                    if (!item.hasAttribute("data-selected")) {
////                        console.log("info.onopen");
//                        if (typeof info.onopen === "function") {
//                            info.onopen(clone);
//                        }
//                    }
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
                //item.addEventListener("dragenter", hoverin, true);
                item.addEventListener("mouseout", hoverout, true);
                //item.addEventListener("dragleave", hoverout, true);
                item.removeAttribute("data-disabled");
            };
            clone.disable = function () {
                item.removeEventListener("mouseover", hoverin, true);
                //item.removeEventListener("dragenter", hoverin, true);
                item.removeEventListener("mouseout", hoverout, true);
                //item.removeEventListener("dragleave", hoverout, true);
                item.setAttribute("data-disabled", "");
            };
            clone.enable();


            container.addEventListener("UI-modal-on", function () {
                if (typeof info.onshow === "function") {
                    info.onshow(clone);
                }
                padding.style.height = "0px";
            }, true);

            if (info.keys instanceof Array) {
                info.keys.forEach(function (key) {
                    parent.keys[key] = {
                        item: item,
                        action: function () {
                            parent.addEventListener("mouseover", function anon(event) {
                                if (!item.contains(event.relatedTarget)) {
                                    this.removeEventListener(event.type, anon, true);
                                    item.removeAttribute("data-selected");
                                }
                            }, true);

                            hoverin({});

                            var child = list.firstChild;
                            if (child) {
                                child.setAttribute("data-selected", "");
                            }
                        }
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
            parent.appendChild(item);
        },
        addItem: function (name, info) {
            info = Object(info);

            var parent = this["DOM.Element"];

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
                info.keys.forEach(function (key) {
                    parent.keys[key/*.toLowerCase()*/] = {
                        action: modal,
                        item: item
                    };
                });
            }

            var actions = {
                enable: function () {
                    //item.removeEventListener("click", disable, true);
                    item.addEventListener("mouseup", modal, true);
                    item.addEventListener("contextmenu", modal, true);
                    item.addEventListener("mouseover", select, true);
                    item.addEventListener("dragenter", select, true);
                    item.addEventListener("mouseout", unselect, true);
                    item.addEventListener("dragleave", unselect, true);

                    item.removeAttribute("data-disabled");

                    //item.style.color = "black";
                },
                disable: function () {
                    //item.addEventListener("click", disable, true);
                    item.removeEventListener("mouseup", modal, true);
                    item.removeEventListener("contextmenu", modal, true);
                    item.removeEventListener("mouseover", select, true);
                    item.removeEventListener("dragenter", select, true);
                    item.removeEventListener("mouseout", unselect, true);
                    item.removeEventListener("dragleave", unselect, true);

                    item.setAttribute("data-disabled", "");

                    unselect.call(item);
                    //item.style.color = "#aaaaaa";
                }
            };
            actions.enable();

            if (typeof info.onshow === "function") {
                container.addEventListener("UI-modal-on", function () {
                    info.onshow(actions);
                }, true);
            }

            if (typeof info.ondrop === "function") {
                item.addEventListener("drop", info.ondrop, true);
                item.addEventListener("dragover", function (event) {
                    event.preventDefault();
                }, true);
            }

            parent.appendChild(item);
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


UI.scrollBar = function (parent, info) {
    info = Object(info);

    var scroller = document.createElement("div");
    scroller.className = "UI-scrollBar";

    if (info.side === "left") {
        scroller.style.left = "0px";
        //scroller.style.cssFloat = "left";
    } else {
        scroller.style.right = "0px";
        //scroller.style.cssFloat = "right";
    }

    scroller.appendChild(UI.create("div", function (element) {
        element.className = "UI-scrollBar-marker";
    }));

    scroller.appendChild(UI.create("div", function (element) {
        element.className = "UI-scrollBar-track";

        function height() {
            return (element.offsetHeight / scroller.offsetHeight) * 100;
        }

        function center() {
            return ((element.offsetHeight / scroller.offsetHeight) / 2) * 100;
        }

        function cap(number) {
            return Math.min(Math.max(number, 0), 100 - height());
        }

//        function getRange(child, offset) {
//            var range = {};
//            range.width = offset.height - child.offsetHeight;
//            range.min = offset.top + (child.clientHeight / 2);
//            range.max = range.min + range.width;
//            return range;
//        }

/*!
        state.video.addEventListener("timeupdate", function () {
            var width = div.offsetWidth - slider.offsetWidth;
            var point = this.currentTime / this.duration;
            var percentage = (width + 1) / div.offsetWidth;

            slider.style.left = point * 100 * percentage + "%";
        }, true);
*/
        var state = {};

        scroller.addEventListener("KAE-dragstart", function anon(event) {
            parent.scrollTop += state.y;

            state.timer = setTimeout(anon, 25);
        }, true);

        scroller.addEventListener("KAE-drag", function (event) {
            if (event.button === 0) {
                element.style.webkitTransition = "";

                //var element = document.getElementById(state.namespace + "volume-container"),
                    //slider = document.getElementById(state.namespace + "volume-slider");

                var box = scroller.getBoundingClientRect();

                var middle = center();

                var number = cap(event.clientY/* - box.top*/ / box.height * 100 - middle);

                //console.log(number - (50 - middle));

                state.y = (number - (50 - middle))/* * 2*/;
                //parent.scrollTop += (number - (50 - middle)) * 2;

                element.style.top = number + "%";
                //console.log((event.clientY - box.top) / box.height);

//                return;

//                var range = getRange(element, box);
//                var number = cap(event.pageY, [ range.min, range.max ]) - range.min;

//                element.style.top = number + "%";
//                //state.video.volume = number / range.width;

//                //colorize(element);
            } else {
                event.preventDefault();
            }

            //element.style.top = scroller.offsetHeight / event.clientY + "%";
        }, true);

        function normalize(event) {
            element.style.top = 50 - center() + "%";
        }
        setTimeout(normalize, 0);

        scroller.addEventListener("KAE-dragend", function () {
            clearTimeout(state.timer);

            element.style.webkitTransition = "top, 0.5s";
            normalize();
        }, true);
    }));

    parent.insertBefore(scroller, parent.firstChild);
};


(function () {
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
        mouseEvent(event.target, "KAE-drag", event);
    }

    //addEventListener("dragstart", dragstart, false);
    addEventListener("mousedown", dragstart, false);

    addEventListener("KAE-dragstart", function (event) {
        var element = event.target;

        //console.log(event.type);

        function drag(event) {
            mouseEvent(element, "KAE-dragmove", event);
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
}());
