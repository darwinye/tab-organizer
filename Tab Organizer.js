/*global action, events, Options, Platform, state, UI, Undo, window */
"use strict";

var Tab, Window;

Tab = {
    focus: function (tab, focus) {
        var focused = Options.get("window.lastfocused");
        var should = (focus !== false && focused !== tab.windowId);

        Platform.tabs.focus(tab, should);

        if (should && Options.get("popup.type") !== "tab") {
            Platform.tabs.getCurrent(function (tab) {
                Platform.tabs.focus(tab, true);
            });
//            Platform.message.connect("lib.action", function (port) {
//                port.sendMessage({ type: "focus" });
//            });
        }
    },


    move: function (item, info, action) {
//        var tab = item.tab;
        Platform.tabs.move(item.tab, info, action);
/*        Platform.tabs.move(tab, info, function () {
//            Platform.tabs.get(tab.id, function (tab) {
//            item.tab = tab;
            if (typeof action === "function") {
                action();
            }
//            });
        });*/
    },


    proxy: function (tab) {
        return UI.create("div", function (container) {
            container.className = "tab";
            container.draggable = true;
            container.tab = tab;
            container.undoState = {};

            if (state.favorites.get(tab.url)) {
                container.setAttribute("data-favorited", "");
            }
            if (tab.pinned) {
                container.setAttribute("data-pinned", "");
            }
            if (tab.selected) {
                container.setAttribute("data-focused", "");
            }

            state.tabsByURL.add(tab.url, container);
            state.tabsByID[tab.id] = container;


            container.indent = function (indent) {
                if (indent && Options.get("tabs.tree-style.enabled")) {
                    container.style.marginLeft = indent * 5 + "px";
                } else {
                    container.style.marginLeft = "";
                }
            };


            container.queueAdd = function () {
                var is = container.parentNode.queue.add(container);
                container.undoState.selected = !is;

                container.setAttribute("data-selected", "");

                state.search();
            };

            container.queueRemove = function () {
//                try {
                var is = container.parentNode.queue.remove(container);
                container.undoState.selected = is;
//                } catch (e) {
//                    console.error(e);
//                }

                container.removeAttribute("data-selected");

                state.search();
            };

            container.queueToggle = function () {
                var toggle = container.parentNode.queue.toggle(container);
                container.undoState.selected = toggle;

                if (toggle) {
                    container.setAttribute("data-selected", "");
                } else {
                    container.removeAttribute("data-selected");
                }

                state.search();
            };

            container.addEventListener("DOMNodeRemovedFromDocument", container.queueRemove, true); //! Hacky


            var url = UI.create("span", function (element) {
                var url = tab.url;
                try {
                    url = decodeURI(url);
                } catch (e) {}

                var match = /^([^:]+)(:\/\/)([^\/]*)([^?#]*\/)([^#]*)(#.*)?$/.exec(url);
                var secure = {
                    "https": true
                };

                if (match) {
                    if (match[1] !== "http") {
                        element.appendChild(UI.create("span", function (element) {
                            element.className = "protocol";
                            if (secure[match[1]]) {
                                element.setAttribute("data-secure", "");
                            }
                            element.textContent = match[1];
                        }));
                        element.appendChild(document.createTextNode(match[2]));
                    }
                    element.appendChild(UI.create("span", function (element) {
                        element.className = "domain";
                        element.textContent = match[3];
                    }));

                    element.appendChild(document.createTextNode(match[4]));

                    if (match[5]) {
                        element.appendChild(UI.create("span", function (element) {
                            element.className = "query";
                            element.textContent = match[5];
                        }));
                    }
                    if (match[6]) {
                        element.appendChild(UI.create("span", function (element) {
                            element.className = "fragment";
                            element.textContent = match[6];
                        }));
                    }
                }
            });

            container.addEventListener("mouseout", function (event) {
                state.urlBar.setAttribute("hidden", "");
            }, true);

            container.addEventListener("mouseover", function (event) {
                var bar = state.urlBar;

                if (bar.firstChild) {
                    bar.removeChild(bar.firstChild);
                }
                bar.appendChild(url);

                bar.removeAttribute("hidden");
            }, true);


            container.addEventListener("click", function (event) {
                var range, parent = this.parentNode;

                if (event.button === 0) {
                    if (event.ctrlKey || event.metaKey) {
                        this.queueToggle();

                        if (this.hasAttribute("data-selected")) {
                            parent.queue.shiftNode = this;
                        } else {
                            delete parent.queue.shiftNode;
                        }
                    } else if (event.shiftKey) {
                        parent.queue.reset();

                        if (parent.queue.shiftNode) {

                            range = Array.slice(parent.children);
                            range = range.range(this, parent.queue.shiftNode);

                            if (range.length) {
                                range.forEach(function (item) {
                                    if (!item.hasAttribute("hidden")) {
                                        item.queueAdd();
                                    }
                                });

                                if (Options.get("undo.select-tabs")) {
                                    Undo.push("select-tabs", {
                                        queue: parent.queue,
                                        type: "select",
                                        list: range
                                    });

                                    var text = "You selected " +
                                                range.length +
                                                (range.length === 1
                                                    ? " tab."
                                                    : " tabs.");

                                    state.undoBar.show(text);
                                }
                            } else {
                                delete parent.queue.shiftNode;
                            }
                        } else {
                            parent.queue.shiftNode = this;
                            this.queueAdd();
                        }
                    } else if (event.altKey) {
                        Platform.tabs.remove(tab);
                    } else {
                        switch (Options.get("tabs.click.type")) {
                        case "select-focus":
                            if (this.hasAttribute("data-selected")) {
                                Tab.focus(container.tab);
                            } else {
                                parent.queue.reset();
                                parent.queue.shiftNode = this;
                                this.queueAdd();
                            }
                            break;
                        case "focus":
                            if (!this.hasAttribute("data-selected")) {
                                parent.queue.reset();
                                delete parent.queue.shiftNode;
                            }
                            Tab.focus(container.tab); //! `tab` object is replaced after moving
                        }
                    }
                }
            }, false);

            container.addEventListener("mouseup", function (event) {
                if (event.button === 1) {
                    Platform.tabs.remove(tab);
                }
            }, false);


//            function check(node, has) {
///*                var prev, next;
//
//                if ((prev = node.previousSibling)) {
//                    prev = (prev === state.draggedTab ||
//                            prev.hasAttribute("data-selected"));
//                }
//
//                if ((next = node.nextSibling)) {
//                    next = (next === state.draggedTab ||
//                            next.hasAttribute("data-selected"));
//                }
//
//                return prev || next ||
//                       node === state.draggedTab ||
//                       node.hasAttribute("data-selected");
//*/
//                if (node) {
//                    if (node === state.draggedTab || (!has && node.hasAttribute("data-selected"))) {
////                        if (node.hasAttribute("data-selected")) {
//                        state.placeholder.remove();
//                        return;
////                        }
//                    }// else if (node === state.draggedTab) {
////                        state.placeholder.remove();
////                        return;
////                    }
//                }
//
//                return true;
//            }
//
//            function attr(node) {
///*                var prev, next;
//
//                if ((prev = node.previousSibling)) {
//                    prev = (has
//                             ? prev === state.draggedTab
//                             : prev.hasAttribute("data-selected"));
//                }
//
//                if ((next = node.nextSibling)) {
//                    next = (has
//                             ? next === state.draggedTab
//                             : next.hasAttribute("data-selected"));
//                }
//
//                return prev || next;*/
////
//                if (node) {
//                    if (node === state.draggedTab) {
////                        if (node.hasAttribute("data-selected")) {
//                        state.placeholder.remove();
//                        return;
////                        }
//                    }// else if (node === state.draggedTab) {
////                        state.placeholder.remove();
////                        return;
////                    }
//                }
//
//                return true;
//            }
//
//            function attr(node, has) {
//                if (node) {
//                    if (node === state.draggedTab || (!has && node.hasAttribute("data-selected"))) {
////                        if (node.hasAttribute("data-selected")) {
////                        state.placeholder.remove();
//                        return;
////                        }
//                    }// else if (node === state.draggedTab) {
////                        state.placeholder.remove();
////                        return;
////                    }
//                }
//
//                return true;
////                return node === state.draggedTab || node.hasAttribute("data-selected");
//            }
//
//
//            var oldnode;
//
//            state.placeholder.
//            container.addEventListener("dragend", state.placeholder.remove, true);

            container.addEventListener("dragover", function (event) {
                state.placeholder.remove();
//                this.removeAttribute("data-dropindent");
//
//                var has = !state.draggedTab.hasAttribute("data-selected");
//
//                if (/*attr(this, has) || */has && this === state.draggedTab) {
//                    state.placeholder.remove();
//                } else {

                var parent = this.parentNode;
                var check = state.placeholder.check;

                var alpha = (this.offsetHeight / 5), // 3
                    omega = (this.offsetHeight - alpha);

                var prev = this.previousSibling,
                    next = this.nextSibling;
//
//                console.log(top, omega);

                var test = (prev || state.draggedTab !== this);

                if (event.offsetY < alpha && test && check(null, prev)) {
//                    if () {
                    parent.insertBefore(state.placeholder, this);
//                    }
                } else if (event.offsetY > omega && check(this, next)) {
//                    if () {
                    parent.insertBefore(state.placeholder, next);
//                    }
                } else if (check(this)) {
//                    parent.insertBefore(state.placeholder, this);
//                    state.placeholder.style.marginTop = this.offsetHeight / 2 - 4 + "px";
                    this.setAttribute("data-dropindent", "");
//                    this.tab.dropIndent = true;
//                    oldnode = this;
//                    this.setAttribute("data-dropindent", "");
                }
//                }
//
//                document.body.setAttribute("hidden", "");
//                document.body.removeAttribute("hidden");
            }, true);
/*!

            function findtop(node, top) {
//                console.log(node);
//                try {
                if (node === top) {
                    return null;
                } else if (node.className === "tab") {
                    return node;
                } else {
                    return findtop(node.parentNode, top);
                }
//                } catch (e) {
//
//                }
            }

            container.addEventListener("drag", function (event) {
//                if (oldnode) {
//
//                }
                removeHighlight();
                delete this.tab.dropIndent;

                var target = document.elementFromPoint(event.clientX, event.clientY);

                var node = findtop(target, this.parentNode);
//                console.log(node);
                if (node) {
                    node.setAttribute("data-dropindent", "");
                    this.tab.dropIndent = true;
                    oldnode = node;
                }// else {
//                    console.log(event.type);
//                }
            }, true);*/
//
//            container.addEventListener("
/*
            container.addEventListener("dragenter", function (event) {
                var query = document.body.querySelector(".tab[data-dropindent]");
                if (query) {
                    query.removeAttribute("data-dropindent");
                }

//                console.log(event.type, this);
                this.setAttribute("data-dropindent", "");
//                event.preventDefault();
            }, true);*/
/*
            container.addEventListener("dragleave", function (event) {
//                console.log(event.type, this);
                this.removeAttribute("data-dropindent");
            }, true);*/


            container.addEventListener("dragstart", function (event) {
                //! container.removeEventListener("dragover", events.disable, true);

                state.urlBar.setAttribute("hidden", "");

                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/uri-list", tab.url);
                event.dataTransfer.setData("text/plain", tab.url);

                state.highlighted = this;
                state.currentQueue = this.parentNode.queue;

                if (!state.currentQueue.length) {
                    state.currentQueue.add(state.highlighted);
                }

                state.draggedTab = this;
//
//                this.tab.dropIndent = true;
            }, true);

            /*! container.addEventListener("dragend", function (event) {
                container.addEventListener("dragover", events.disable, true);
            }, true);*/


            var text = tab.title || tab.url;

            var cell = {
                favicon: UI.create("img", function (element) {
                    element.className = "tab-favicon";
                    element.title = text;
                    element.setAttribute("alt", "");

                    if (tab.favIconUrl) {
                        element.src = "chrome://favicon/" + tab.url;
                    } else {
                        element.src = "/images/blank.png";
                    }
                }),
                favorite: UI.create("div", function (element) {
                    element.className = "tab-favorite";
                    element.title = "Favorite this tab";

                    element.addEventListener("click", events.stop, true);

                    element.addEventListener("click", function () {
                        if (container.hasAttribute("data-favorited")) {
                            state.favorites.set(tab.url, null);
                        } else {
                            state.favorites.set(tab.url, state.tabsByURL[tab.url].length);
                        }
                    }, true);
                }),
                text: UI.create("div", function (element) {
                    element.className = "tab-text";
                    element.title = text;
                    element.textContent = text;

                    container.tabText = element;

                    /*! container.addEventListener("dblclick", function (event) {
                        if (false) {
                        //! if (event.button === 0 && container.hasAttribute("data-focused")) {
                            container.draggable = false;

                            element.replaceChild(UI.create("input", function (input) {
                                input.className = "url-input";
                                input.type = "text";

                                input.value = tab.url;
                                input.tabIndex = -1;

                                input.addEventListener("keyup", function (event) {
                                    if (event.which === 13 || event.which === 27) {
                                        if (event.which === 13) {
                                            Tab.gotoURL(tab, this.value);
                                        }
                                        container.parentNode.focus();
                                    }
                                }, true);
                                input.addEventListener("blur", function (event) {
                                    element.replaceChild(span, input);

                                    container.draggable = true;
                                }, true);

                                setTimeout(function () {
                                    input.select();
                                }, 0);
                            }), span);
                        }
                    }, true);*/
                }),
                close: UI.create("div", function (element) {
                    element.className = "tab-button-close";
                    element.title = "Close (Alt Click)";
                    element.draggable = true;

                    element.addEventListener("dragstart", events.disable, true);

                    element.addEventListener("click", function (event) {
                        event.stopPropagation();
                        Platform.tabs.remove(tab);
                    }, true);
                })
            };

            function blur() {
                cell.close.setAttribute("hidden", "");
            }
            function focus() {
                cell.close.removeAttribute("hidden");
            }

            container.updateButtonPositions = function () {
                cell.close.removeAttribute("data-display-hover");
                cell.close.removeAttribute("hidden");

                container.removeEventListener("Platform-blur", blur, true);
                container.removeEventListener("Platform-focus", focus, true);


//                if (Options.get("tabs.tree-style.enabled")) {
                var indent = state.indent[tab.window.index];
                /*var parent = state.tabsByID[tab.parentId];*/
                if (indent && (indent = indent[tab.index])) {
    //                console.log(indent, tab.index);
                    container.indent(indent);
                }
//                }


                switch (Options.get("tabs.close.display")) {
                case "hover":
                    cell.close.setAttribute("data-display-hover", "");
                    break;
                case "focused":
                    if (!container.hasAttribute("data-focused")) {
                        cell.close.setAttribute("hidden", "");
                    }
                    container.addEventListener("Platform-blur", blur, true);
                    container.addEventListener("Platform-focus", focus, true);
                }


                switch (Options.get("tabs.close.location")) {
                case "left":
                    container.appendChild(cell.close);
                    container.appendChild(cell.text);
                    container.appendChild(cell.favicon);
                    container.appendChild(cell.favorite);
                    break;
                case "right":
                    container.appendChild(cell.favicon);
                    container.appendChild(cell.favorite);
                    container.appendChild(cell.text);
                    container.appendChild(cell.close);
                }
            };
            container.updateButtonPositions();
        });
    }
};



Window = {
    create: function (array, info) {
        info = Object(info);

        Platform.windows.create({ url: "lib/remove.html" }, function (win) {
            if (info.title) {
                var proxy = state.windows[win.id];
                proxy.tabIcon.indexText.value = info.title;

                var index = state.list.indexOf(proxy);
                if (index !== -1) {
                    state.titles[index] = info.title;
                }
            }

            if (array) {
/*                console.log(array.map(function (item) {
                    return item.tab.title;
                }));*/
                array.moveTabs(win, { undo: info.undo/*,
                    action: function (tab, item) {
                        var old = level[tab.index];

                        var undo = item.undoState.indentLevel;
                        if (undo) {
                            level[tab.index] = undo;
                        }

                        var to = indent + push;
                        if (to <= 0) {
                            delete level[tab.index];
                        } else {
                            level[tab.index] = to;
                        }

                        if (old !== level[tab.index]) {
                            Platform.event.trigger("tab-indent", tab, level[tab.index]);
                        }
                    }*/ });
//                array.reset();
//                delete array.shiftNode;
            }

            if (typeof info.action === "function") {
                info.action(win);
            }
        });
    },


    proxy: function (win) {
        var fragment = document.createDocumentFragment();

        fragment.appendChild(UI.create("div", function (container) {
            container.className = "window";

            state.windows[win.id] = container;
            state.list.add(container);

            container.window = win;
            container.tabIndex = -1; //! 2


            function scrollTo() {
                UI.scrollIntoView(container.tabContainer, document.body);
                //! UI.scrollIntoView(container.tabList, document.body, 41);
            }

            container.select = function () {
                action.unselectWindow();

                container.setAttribute("data-focused", "");
            };

            container.unselect = function () {
                var id = Options.get("window.lastfocused");
                if (id === null) {
                    action.unselectWindow();
                } else if (state.windows[id]) {
                    state.windows[id].select();
                }
            };

            container.setWindowFocus = function () {
                container.select();
                scrollTo();
            };
//
//            container.update = function () {
//
//            };


            container.addEventListener("blur", function (event) {
                this.removeAttribute("data-selected");

                container.unselect();

                state.placeholder.remove();
            }, true);

            container.addEventListener("focus", function (event) {
                /*! if (!state.dragging) {
                    scrollTo.call(this);
                }
*/
                this.setAttribute("data-selected", "");

                container.select();
            }, true);


            container.addEventListener("keydown", function (event) {
                var query;

                if (event.target.localName === "input") {
                    return;
                }

                if (event.which === 38 || event.which === 40) { //* Up/Down
                    query = this.querySelector(".tab[data-focused]");
                    if (query) {
                        var element = (event.which === 38
                                        ? query.previousSibling
                                        : query.nextSibling);

                        if (element) {
                            event.preventDefault();

                            Tab.focus(element.tab, false);
                        }
                    }
                } else if (event.which === 37 || event.which === 39) { //* Left/Right
                    query = this.querySelector(".tab[data-focused]");
                    if (query && query.previousSibling) {
                        event.preventDefault();

                        if (event.which === 37) {
                            state.indent.sub(query.tab);
                        } else {
                            state.indent.add(query.tab);
                        }
                    }
                } else if (event.which === 32 || event.which === 13) { //* Space/Enter
                    event.preventDefault();

                    query = this.querySelector(".tab[data-focused]");
                    if (query) {
                        var info = document.createEvent("MouseEvents");
                        info.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0,
                            event.ctrlKey, event.altKey, event.shiftKey, event.metaKey, 0, null);

                        query.dispatchEvent(info);
                    }
                }
            }, true);


            container.addEventListener("dragstart", function (event) {
                //! container.removeEventListener("dragover", events.disable, true);

                addEventListener("blur", function anon(event) {
                    this.removeEventListener(event.type, anon, true);
                    event.stopPropagation();
                }, true);
            }, true);

            container.addEventListener("dragenter", container.focus, true);
            container.addEventListener("dragover", events.disable, true);

            container.addEventListener("dragover", function (event) {
                var list = this.tabList;
//                var coords = list.getBoundingClientRect();

                var last = list.lastChild;
                if (last === state.placeholder) {
                    last = last.previousSibling;
                }

                var alpha = list.firstChild.getBoundingClientRect(),
                    omega = last.getBoundingClientRect();

                var check = state.placeholder.check;

//                var last = list.lastChild.getBoundingClientRect();
                if (event.clientY > omega.bottom) {
                    if (check(last)) {
                        list.appendChild(state.placeholder);
                        state.placeholder.update();
                    }/* else {

                    }*/
                } else if (event.clientY < alpha.top) {
                    if (check(list.firstChild)) {
                        list.insertBefore(state.placeholder, list.firstChild);
                        state.placeholder.update();
                    }/* else {
                        state.placeholder.remove();
                    }*/
                }
/*
                if (event.clientX > coords.left - 2 && event.clientX < coords.right - 2) {
                    if (event.clientY <= coords.top + 2) {
//                        if (!list.contains(event.target)) {
                            list.insertBefore(state.placeholder, list.firstChild);
                            state.placeholder.update();
//                        }
                    } else if (list === event.target) {
                        list.appendChild(state.placeholder);
                        state.placeholder.update();
                    }
                }*/
            }, true);
/*
            container.addEventListener("dragleave", function (event) {
                state.placeholder.remove();
            }, true);*/

            container.addEventListener("drop", function (event) {
                var node = document.querySelector(".tab[data-dropindent]");
/*                if (!node) {
                    node = state.placeholder;
                }*/

                var children = Array.slice(this.tabList.children);

                var index = children.indexOf(node || state.placeholder);
                if (index !== -1) {
                    if (node) {
                        index += 1;
                    }
//
//                    console.log(index, node.hasAttribute("data-dropindent"));
    //
    //                console.log(index);

                    state.currentQueue.moveTabs(win, { index: index, indent: !!node });
    //                state.currentQueue.reset();
    //                delete state.currentQueue.shiftNode;
                }
            }, true);


            container.appendChild(UI.create("div", function (element) {
                element.className = "tab-icon-border";

                function invalid(element, event) {
                    var box = element.getBoundingClientRect();

                    var height = event.pageY > box.bottom;
                    var options = !Options.get("windows.middle-close");
                    var selected = !container.hasAttribute("data-selected");

                    return height || options || selected;
                }

                element.addEventListener("mousedown", function (event) {
                    if (invalid(this, event)) {
                        return;
                    }

                    if (event.button === 1) {
                        Platform.windows.remove(win);
                    }
                }, true);

                element.appendChild(UI.create("div", function (stack) {
                    stack.className = "tab-icon-container";

                    stack.appendChild(UI.create("div", function (icon) {
                        icon.className = "tab-icon";

                        container.tabIcon = icon;

                        icon.appendChild(UI.create("input", function (element) {
                            element.setAttribute("spellcheck", "false");
                            element.className = "tab-icon-text";
                            element.type = "text";
                            element.tabIndex = -1;

                            icon.indexText = element;


                            var value, index = state.list.indexOf(container);

                            element.value = action.returnTitle(index);

                            element.addEventListener("mousedown", function (event) {
                                if (container.hasAttribute("data-focused")) {
                                    element.addEventListener("click", element.select, true);
                                } else {
                                    element.removeEventListener("click", element.select, true);
                                    container.focus();

                                    event.preventDefault();
                                }
                            }, true);

                            element.addEventListener("focus", function (event) {
                                value = this.value;
                            }, true);

                            element.addEventListener("blur", function (event) {
                                if (this.value) {
                                    state.titles[index] = this.value;
                                } else {
                                    delete state.titles[index];
                                }
                                this.value = action.returnTitle(index);

                                if (this.value !== value) {
                                    if (Options.get("undo.rename-window")) {
                                        Undo.push("rename-window", {
                                            focus: container.tabList,
                                            value: value,
                                            index: index,
                                            node: this
                                        });

                                        var text =
                                                "You renamed the window \"" +
                                                this.value +
                                                "\".";

                                        state.undoBar.show(text);
                                    }
                                }
                            }, true);

                            element.addEventListener("keydown", function (event) {
                                if (event.which === 27) { //* Escape
                                    event.preventDefault();
                                }
                            }, true);

                            element.addEventListener("keyup", function (event) {
                                if (event.which === 13 || event.which === 27) { //* Enter/Escape
                                    if (event.which === 27) { //* Escape
                                        this.value = value;

                                        container.tabList.focus();
                                        //! container.tabList.focus();
                                    }
                                    this.blur();
                                }
                            }, true);
                        }));

                        icon.appendChild(UI.create("div", function (element) {
                            element.className = "tab-icon-dropdown";
                            element.title = "Open menu (Ctrl M)";

                            var contextMenu = UI.contextMenu(function (menu) {
                                element.addEventListener("mousedown", function (event) {
                                    if (event.button !== 2) {
                                        menu.show();
                                    }
                                }, true);

                                container.addEventListener("contextmenu", function (event) {
                                    if (event.target.localName === "input") {
                                        return;
                                    } else if (event.defaultPrevented) {
                                        return;
                                    }

                                    event.preventDefault();

                                    menu.show({
                                        x: event.clientX,
                                        y: event.clientY
                                    });
                                }, false);

                                container.addEventListener("keypress", function (event) {
                                    if (event.which === 13 && (event.ctrlKey || event.metaKey)) {
                                        if (!event.altKey && !event.shiftKey) {
                                            menu.show();
                                        }
                                    }
                                }, true);


                                /*! menu.addItem("<u>B</u>ack", function () {
                                    alert("Back");
                                }).disable();
                                menu.addItem("<u>F</u>orward", function () {
                                    alert("Forward");
                                }).disable();
                                menu.addItem("Re<u>l</u>oad");
                                menu.separator();
                                menu.addItem("Save <u>A</u>s...");
                                menu.addItem("P<u>r</u>int...");
                                menu.addItem("<u>T</u>ranslate to English").disable();
                                menu.addItem("<u>V</u>iew Page Source");
                                menu.addItem("View Page <u>I</u>nfo");
                                menu.separator();
                                menu.addItem("I<u>n</u>spect Element");
                                menu.separator();
                                menu.addItem("Input <u>M</u>ethods").disable();
                                return;*/

                                menu.addItem("New <u>T</u>ab", {
                                    keys: ["T"],
                                    action: function () {
                                        Platform.tabs.create({
                                            windowId: win.id
                                        }, function (tab) {
                                            if (Options.get("undo.new-tab")) {
                                                Undo.push("new-tab", {
                                                    tab: tab
                                                });
                                                state.undoBar.show("You created a new tab.");
                                            }
                                        });
                                    }
                                });

                                menu.separator();

                                menu.addItem("<u>R</u>ename window", {
                                    keys: ["R"],
                                    action: function (event) {
                                        event.preventDefault();
                                        container.tabIcon.indexText.select();
                                    }
                                });

                                menu.separator();

                                menu.addItem("Select <u>a</u>ll", {
                                    keys: ["A"],
                                    onshow: function (menu) {
                                        var queue = container.tabList.queue.length;
                                        var tabs = container.tabList.children.length;

                                        if (queue === tabs) {
                                            menu.disable();
                                        } else {
                                            menu.enable();
                                        }
                                    },
                                    action: function () {
                                        var range = [];

                                        Array.slice(container.tabList.children).forEach(function (item) {
                                            if (!item.hasAttribute("hidden")) {
                                                if (!item.hasAttribute("data-selected")) {
                                                    range.push(item);
                                                    item.queueAdd();
                                                }
                                            }
                                        });

                                        if (Options.get("undo.select-tabs")) {
                                            if (range.length) {
                                                Undo.push("select-tabs", {
                                                    queue: container.tabList.queue,
                                                    type: "select",
                                                    list: range
                                                });

                                                if (range.length === 1) {
                                                    state.undoBar.show("You selected " + range.length + " tab.");
                                                } else {
                                                    state.undoBar.show("You selected " + range.length + " tabs.");
                                                }
                                            }
                                        }
                                        delete container.tabList.queue.shiftNode;
                                    }
                                });

                                menu.addItem("Select <u>n</u>one", {
                                    keys: ["N"],
                                    onshow: function (menu) {
                                        if (container.tabList.queue.length) {
                                            menu.enable();
                                        } else {
                                            menu.disable();
                                        }
                                    },
                                    action: function () {
                                        var range = [];

                                        Array.slice(container.tabList.children).forEach(function (item) {
                                            if (!item.hasAttribute("hidden")) {
                                                if (item.hasAttribute("data-selected")) {
                                                    range.push(item);
                                                    item.queueRemove();
                                                }
                                            }
                                        });

                                        if (Options.get("undo.select-tabs")) {
                                            if (range.length) {
                                                Undo.push("select-tabs", {
                                                    queue: container.tabList.queue,
                                                    type: "unselect",
                                                    list: range
                                                });

                                                if (range.length === 1) {
                                                    state.undoBar.show("You unselected " + range.length + " tab.");
                                                } else {
                                                    state.undoBar.show("You unselected " + range.length + " tabs.");
                                                }
                                            }
                                        }
                                        delete container.tabList.queue.shiftNode;
                                    }
                                });

                                menu.separator();

                                menu.submenu("<u>S</u>elected...", {
                                    keys: ["S"],
                                    onshow: function (menu) {
                                        if (container.tabList.queue.length) {
                                            menu.enable();
                                        } else {
                                            menu.disable();
                                        }
                                    },
                                    create: function (menu) {
                                        menu.addItem("Re<u>l</u>oad selected", {
                                            keys: ["L"],
                                            action: function () {
                                                container.tabList.queue.forEach(function (item) {
                                                    Platform.tabs.update(item.tab, {
                                                        url: item.tab.url
                                                    });
                                                });

                                                container.tabList.queue.reset();
                                            }
                                        });


                                        menu.addItem("<u>C</u>lose selected", {
                                            keys: ["C"],
                                            action: function () {
                                                container.tabList.queue.forEach(function (item) {
                                                    Platform.tabs.remove(item.tab);
                                                });

                                                container.tabList.queue.reset();
                                                delete container.tabList.queue.shiftNode;
                                            }
                                        });

                                        menu.separator();

                                        menu.addItem("<u>F</u>avorite selected", {
                                            keys: ["F"],
                                            onshow: function (menu) {
                                                var some = container.tabList.queue.some(function (item) {
                                                    return !item.hasAttribute("data-favorited");
                                                });

                                                if (some) {
                                                    menu.enable();
                                                } else {
                                                    menu.disable();
                                                }
                                            },
                                            action: function () {
                                                container.tabList.queue.forEach(function (item) {
                                                    var url = item.tab.url;
                                                    state.favorites.set(url, state.tabsByURL[url].length);
                                                });

                                                container.tabList.queue.reset();
                                            }
                                        });

                                        menu.addItem("<u>U</u>nfavorite selected", {
                                            keys: ["U"],
                                            onshow: function (menu) {
                                                var some = container.tabList.queue.some(function (item) {
                                                    return item.hasAttribute("data-favorited");
                                                });

                                                if (some) {
                                                    menu.enable();
                                                } else {
                                                    menu.disable();
                                                }
                                            },
                                            action: function () {
                                                container.tabList.queue.forEach(function (item) {
                                                    state.favorites.set(item.tab.url, null);
                                                });

                                                container.tabList.queue.reset();
                                            }
                                        });
                                    }
                                });

                                menu.separator();

                                menu.submenu("<u>M</u>ove selected to...", {
                                    keys: ["M"],
                                    onshow: function (menu) {
                                        if (container.tabList.queue.length) {
                                            menu.enable();
                                        } else {
                                            menu.disable();
                                        }
                                    },
                                    onopen: function (menu) {
                                        menu.clear();

                                        menu.addItem("New Window", {
                                            action: function () {
                                                Window.create(container.tabList.queue);
                                            }
                                        });

                                        if (state.sorted.length) {
                                            menu.separator();

                                            state.sorted.forEach(function (item, i) {
                                                var name = item.tabIcon.indexText.value;
                                                if (item === container) {
                                                    name = "<strong>" + name + "</strong>";
                                                }

                                                menu.addItem(name, {
                                                    action: function () {
                                                        container.tabList.queue.moveTabs(item.window);
//                                                        container.tabList.queue.reset();
//                                                        delete container.tabList.queue.shiftNode;
                                                    }
                                                });
                                            });
                                        }
                                    }
                                });
                            });

                            element.appendChild(contextMenu);
                        }));
                    }));
                }));
            }));


            container.appendChild(UI.create("div", function (element) {
                element.className = "tab-list-border";

                container.tabContainer = element;

                element.appendChild(UI.create("div", function (list) {
                    list.className = "tab-list";
                    list.tabIndex = 1;

                    list.container = container;
                    list.queue = [];

                    container.tabList = list;

                    /*! var update = function anon(event) {
                        clearTimeout(anon.timeout);

                        var self = this;
                        anon.timeout = setTimeout(function () {
                            container.tabIcon.title = "Tabs: " + self.children.length;
                        }, 2000);
                    };
                    list.addEventListener("DOMNodeInserted", update, true);
                    list.addEventListener("DOMNodeRemoved", update, true);*/

                    if (win.tabs) {
                        win.tabs.forEach(function (tab) {
                            list.appendChild(Tab.proxy(tab));
                        });
                    }
                }));
            }));
        }));

        return fragment;
    }
};
