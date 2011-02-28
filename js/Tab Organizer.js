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
        }
    },


    move: function (item, info, action) {
        Platform.tabs.move(item.tab, info, action);
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
                var is = container.parentNode.queue.remove(container);
                container.undoState.selected = is;

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

//!            container.addEventListener("DOMNodeRemovedFromDocument", container.queueRemove, true); //! Hacky


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

                                    var text = [];

                                    text.push(Platform.i18n.message("undo_message_selected"));

                                    text.push(range.length);
//
//                                    var text =  +
//                                                range.length +
//                                                (range.length === 1
//                                                    ? " tab."
//                                                    : " tabs.");

                                    text.push(Platform.i18n.message("global_tab"));

                                    if (range.length !== 1) {
                                        text.push(Platform.i18n.message("global_plural"));
                                    }

                                    text.push(Platform.i18n.message("global_end"));

                                    state.undoBar.show(text.join(""));
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


///*                var prev, next;
//*/

///*                var prev, next;

            container.addEventListener("dragover", function (event) {
                state.placeholder.remove();
                var parent = this.parentNode;
                var check = state.placeholder.check;

                var alpha = (this.offsetHeight / 5),
                    omega = (this.offsetHeight - alpha);

                var prev = this.previousSibling,
                    next = this.nextSibling;

                var test = (prev || state.draggedTab !== this);

                if (event.offsetY < alpha && test && check(null, prev)) {
                    parent.insertBefore(state.placeholder, this);
                } else if (event.offsetY > omega && check(this, next)) {
                    parent.insertBefore(state.placeholder, next);
                } else if (check(this)) {
                    this.setAttribute("data-dropindent", "");
                }
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

                    element.src = "chrome://favicon/" + tab.url;
                }),

                favorite: UI.create("div", function (element) {
                    element.className = "tab-favorite";
                    element.title = Platform.i18n.message("tab_favorite");

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
                    element.title = Platform.i18n.message("tab_close") + "(Alt Click)";
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


                var indent = state.indent[tab.window.index];
                if (indent && (indent = indent[tab.index])) {
                    container.indent(indent);
                }


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
                win.title = info.title;
            }

            if (array) {
                array.moveTabs(win, { undo: info.undo });
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


            function iter(element, which) {
                element = (which
                            ? element.previousSibling
                            : element.nextSibling);

                if (element) {
                    if (!element.hasAttribute("hidden")) {
                        return element;
                    } else {
                        return iter(element, which);
                    }
                }
            }

            container.addEventListener("keydown", function (event) {
                var query;

                if (event.target.localName === "input") {
                    return;
                }

                if (event.which === 38 || event.which === 40) { //* Up/Down
                    query = this.querySelector(".tab[data-focused]");
                    if (query) {
                        event.preventDefault();

                        var element = iter(query, event.which === 38);
                        if (element) {
                            state.event.trigger("tab-focus", element.tab);
                        }
                    }
                } else if (event.which === 37 || event.which === 39) { //* Left/Right
                    query = this.querySelector(".tab[data-focused]");
                    if (query) {
                        event.preventDefault();

                        if (query.previousSibling) {
                            if (event.which === 37) {
                                state.indent.sub(query.tab);
                            } else {
                                state.indent.add(query.tab);
                            }
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

                var last = list.lastChild;
                if (last === state.placeholder) {
                    last = last.previousSibling;
                }

                var alpha = list.firstChild.getBoundingClientRect(),
                    omega = last.getBoundingClientRect();

                var check = state.placeholder.check;

                if (event.clientY > omega.bottom) {
                    if (check(last)) {
                        list.appendChild(state.placeholder);
                        state.placeholder.update();
                    }
                } else if (event.clientY < alpha.top) {
                    if (check(list.firstChild)) {
                        list.insertBefore(state.placeholder, list.firstChild);
                        state.placeholder.update();
                    }
                }
            }, true);

            container.addEventListener("drop", function (event) {
                var index = 0;

                var node = document.querySelector(".tab[data-dropindent]");
                if (node) {
                    index = node.tab.index + 1;
                } else {
                    var sib = state.placeholder.previousSibling;
                    if (sib) {
                        index = sib.tab.index + 1;
                    }
                }

                if (state.currentQueue) {
                    state.currentQueue.moveTabs(win, { index: index, child: !!node });
                }
            }, true);


            container.appendChild(UI.create("div", function (element) {
                element.className = "tab-icon-border";


                container.updateTooltip = function () {
                    var length = win.tabs.length;
                    if (length && win.title) {
                        var text = [ win.title ];

                        text.push(" (");
                        text.push(length);

                        text.push(Platform.i18n.message("global_tab"));

                        if (length !== 1) {
                            text.push(Platform.i18n.message("global_plural"));
                        }

                        text.push(")");

                        element.title = text.join("");
                    } else {
                        element.title = "";
                    }
                };


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


                            Object.defineProperty(win, "title", {
                                get: function () {
                                    return element.value;
                                },
                                set: function (value) {
                                    if (value) {
                                        state.titles[index] = value;
                                    } else {
                                        delete state.titles[index];
                                    }
                                    element.value = action.returnTitle(index);

                                    Platform.event.trigger("window-rename");
                                },
                                configurable: true
                            });

                            container.updateTooltip();


                            function select() {
                                if (this.selectionStart === this.selectionEnd) {
                                    this.select();
                                }
                            }

                            element.addEventListener("mousedown", function (event) {
                                this.removeEventListener("click", select, true);

                                if (container.hasAttribute("data-focused")) {
                                    this.addEventListener("click", select, true);
                                } else {
                                    container.focus();

                                    event.preventDefault();
                                }
                            }, true);

                            element.addEventListener("focus", function (event) {
                                value = this.value;
                            }, true);

                            element.addEventListener("blur", function (event) {
                                if (this.value !== value) {
                                    win.title = this.value;

                                    if (Options.get("undo.rename-window")) {
                                        Undo.push("rename-window", {
                                            window: win,
                                            value: value,
                                            node: this
                                        });

                                        var text =
                                                Platform.i18n.message("undo_message_rename") +
                                                Platform.i18n.message("global_window") +
                                                " \"" + this.value + "\"" +
                                                Platform.i18n.message("global_end");

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
                    }));
                }));
            }));


            container.appendChild(UI.create("div", function (element) {
                element.className = "tab-icon-dropdown";
                element.title = Platform.i18n.message("window_menu_open") + "(Ctrl M)";

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
                                event.preventDefault();
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

                    menu.addItem(Platform.i18n.message("window_menu_new_tab"), {
                        keys: ["T"],
                        action: function () {
                            Platform.tabs.create({
                                windowId: win.id
                            }, function (tab) {
                                if (Options.get("undo.new-tab")) {
                                    Undo.push("new-tab", {
                                        tab: tab
                                    });
                                    state.undoBar.show(Platform.i18n.message("undo_message_create_new") +
                                                       Platform.i18n.message("global_tab") +
                                                       Platform.i18n.message("global_end"));
                                }
                            });
                        }
                    });

                    menu.separator();

                    menu.addItem(Platform.i18n.message("window_menu_rename_window"), {
                        keys: ["R"],
                        action: function (event) {
                            event.preventDefault();
                            container.tabIcon.indexText.select();
                        }
                    });

                    menu.separator();

                    menu.addItem(Platform.i18n.message("window_menu_select_all"), {
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

                                    var text = [];

                                    text.push(Platform.i18n.message("undo_message_selected"));

                                    text.push(range.length);

                                    text.push(Platform.i18n.message("global_tab"));

                                    if (range.length !== 1) {
                                        text.push(Platform.i18n.message("global_plural"));
                                    }

                                    text.push(Platform.i18n.message("global_end"));

                                    state.undoBar.show(text.join(""));
                                }
                            }
                            delete container.tabList.queue.shiftNode;
                        }
                    });

                    menu.addItem(Platform.i18n.message("window_menu_select_none"), {
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

                                    var text = [];

                                    text.push(Platform.i18n.message("undo_message_unselected"));

                                    text.push(range.length);

                                    text.push(Platform.i18n.message("global_tab"));

                                    if (range.length !== 1) {
                                        text.push(Platform.i18n.message("global_plural"));
                                    }

                                    text.push(Platform.i18n.message("global_end"));

                                    state.undoBar.show(text.join(""));
                                }
                            }
                            delete container.tabList.queue.shiftNode;
                        }
                    });

                    menu.separator();

                    menu.submenu(Platform.i18n.message("window_menu_selected"), {
                        keys: ["S"],
                        onshow: function (menu) {
                            if (container.tabList.queue.length) {
                                menu.enable();
                            } else {
                                menu.disable();
                            }
                        },
                        create: function (menu) {
                            menu.addItem(Platform.i18n.message("window_menu_selected_reload"), {
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


                            menu.addItem(Platform.i18n.message("window_menu_selected_close"), {
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

                            menu.addItem(Platform.i18n.message("window_menu_selected_favorite"), {
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

                            menu.addItem(Platform.i18n.message("window_menu_selected_unfavorite"), {
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

                    menu.submenu(Platform.i18n.message("window_menu_move_selected_to"), {
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

                            menu.addItem(Platform.i18n.message("toolbar_menu_new_window"), {
                                keys: ["N"],
                                action: function () {
                                    Window.create(container.tabList.queue);
                                }
                            });

                            if (state.sorted.length) {
                                menu.separator();

                                state.sorted.forEach(function (item, i) {
                                    var name = item.window.title;
                                    if (item === container) {
                                        name = "<strong>" + name + "</strong>";
                                    }

                                    menu.addItem(name, {
                                        action: function () {
                                            container.tabList.queue.moveTabs(item.window);
                                        }
                                    });
                                });
                            }
                        }
                    });
                });

                element.appendChild(contextMenu);
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
