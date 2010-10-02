"use strict";
/*global action, events, Options, Platform, state, UI, window */

var Tab = {
    create: function (tab) {
        return UI.create("table", function (container) {
            container.className = "tab";
            container.draggable = true;
            //container.tabIndex = -1; //!

            //container.title = tab.title;

            if (state.favorites[tab.url]) {
                container.setAttribute("data-favorited", "");
            }

            state.tabsByURL[tab.url] = state.tabsByURL[tab.url] || [];
            state.tabsByURL[tab.url].push(container);

            state.tabs[tab.id] = container;
            container.tab = tab;

            container.undoState = {};

            container.queueAdd = function () {
                var is = container.parentNode.queue.add(container);
                container.undoState.selected = !is;

                container.setAttribute("data-selected", "");
                //state.search();
            };
            container.queueRemove = function () {
                var is = container.parentNode.queue.remove(container);;
                container.undoState.selected = is;

                container.removeAttribute("data-selected");
                //state.search();
            };
            container.queueToggle = function () {
                var toggle = container.parentNode.queue.toggle(container);
                container.undoState.selected = toggle;

                if (toggle) {
                    container.setAttribute("data-selected", "");
                } else {
                    container.removeAttribute("data-selected");
                }
                //state.search();
            };

            if (tab.selected) {
                container.setAttribute("data-focused", "");
            }

            var url = UI.create("span", function (element) {
                //element.style.whiteSpace = "pre";

                var url = decodeURI(tab.url);
                var match = /^([^:]+)(:\/\/)([^\/]*)([^?#]*\/)([^#]*)(#.*)?$/.exec(url);
                var secure = {
                    //"chrome": true,
                    "https": true
                };

                //console.log(match);

                if (match) {
//                    if (match[1] === "file") {
//                        element.textContent = url;
//                    } else {
                        if (match[1] !== "http") {
                            element.appendChild(UI.create("span", function (element) {
                                element.className = "protocol";
                                if (secure[match[1]]) {
                                    element.setAttribute("data-secure", "");
                                }
                                element.textContent = match[1]/* + ":"*/;
                            }));
                            element.appendChild(document.createTextNode(match[2]/* + ""*/));
                        }
                        element.appendChild(UI.create("span", function (element) {
                            element.className = "domain";
                            element.textContent = match[3];
                        }));

                        element.appendChild(document.createTextNode(match[4]));
                        //element.appendChild(document.createTextNode(match[4].replace(/\/(?=[^\/]+$)/g, "/ ")));

//                        //if (match[5]) {
//                            element.appendChild(UI.create("span", function (element) {
//                                //element.style.color = "darkred";
//                                element.textContent = match[5];
//                            }));
//                        //}
                        if (match[5]) {
                            element.appendChild(UI.create("span", function (element) {
                                element.className = "query";
                                element.textContent = /*"" + */match[5];
                            }));
                        }
                        if (match[6]) {
                            element.appendChild(UI.create("span", function (element) {
                                element.className = "fragment";
                                element.textContent = /*"" + */match[6];
                            }));
                        }
//                    }
                }
            });
            container.addEventListener("mouseover", function (event) {
                var bar = state.urlBar;

                if (bar.firstChild) {
                    bar.removeChild(bar.firstChild);
                }
                bar.appendChild(url);

                bar.removeAttribute("hidden");
            }, true);
            container.addEventListener("mouseout", function (event) {
                //state.urlBar.hide();
                state.urlBar.setAttribute("hidden", "");
            }, true);

            container.addEventListener("click", function (event) {
                //event.preventDefault();

                var range, parent = this.parentNode;

                if (event.button === 0) {
                    if (event.ctrlKey || event.metaKey) {
                        this.queueToggle();

                        if (this.hasAttribute("data-selected")) {
                            parent.queue.shiftNode = this;
                        } else {
                            delete parent.queue.shiftNode;
                        }

//                        if (Options.get("undo.select-tabs")) {
//                            Undo.push("select-tabs", {
//                                list: [ this ]
//                            });

//                            if (this.undoState.selected) {
//                                state.undoBar.show("You selected 1 tab.");
//                            } else {
//                                state.undoBar.show("You unselected 1 tab.");
//                            }
//                        }
                    } else if (event.shiftKey) {
                        parent.queue.reset();
//                        if (parent.shiftRange) {
//                            parent.shiftRange.forEach(function (item) {
//                                item.queueRemove();
//                            });
//                        }

//                        if (parent !== parent.shiftNode.parentNode) {
//                            delete parent.shiftNode;
//                        }

                        if (parent.queue.shiftNode) {
//                            var range = document.createRange();
//                            range.setStart(parent.shiftNode);
//                            range.setEnd(this);
//                            console.log(range);

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
                                        list: range
                                    });

                                    if (range.length === 1) {
                                        state.undoBar.show("You selected " + range.length + " tab.");
                                    } else {
                                        state.undoBar.show("You selected " + range.length + " tabs.");
                                    }
                                }
                            } else {
                                delete parent.queue.shiftNode;
                            }
//                            alert(range);
                        } else {
                        //if (!parent.shiftNode) {
                            parent.queue.shiftNode = this;
                            this.queueAdd();

//                            if (Options.get("undo.select-tabs")) {
//                                Undo.push("select-tabs", {
//                                    list: [ this ]
//                                });
//                                state.undoBar.show("You selected 1 tab.");
//                            }
                        }
                    } else if (event.altKey) {
                        Platform.tabs.remove(tab.id);
                    } else {
                        if (!parent.queue.has(this)) {
                            parent.queue.reset();
                            delete parent.queue.shiftNode;
                        }
                        Platform.tabs.focus(tab);
                    }
                }
            }, false);
            container.addEventListener("mouseup", function (event) {
                if (event.button === 1) {
                    Platform.tabs.remove(tab.id);
                }
            }, false);
            /*container.addEventListener("focus", function (event) {
                this.draggable = false;
            }, true);
            container.addEventListener("mouseup", function () {
                this.draggable = true;
            }, true);*/

            /*container.addEventListener("drop", function (event) {
                state.queue.reset();
            }, true);*/

            /*container.addEventListener("dragover", function anon(event) {
                return;
                var parent = this.parentNode;
                //if (this === parent.firstChild || this === parent.lastChild) {
                    swapnodes.call(this, event);
                //}
            }, true);*/
            container.addEventListener("dragover", function swapnodes(event) {
                //clearTimeout(swapnodes.timeout);

                //swapnodes.timeout = setTimeout(function () {
                    var parent = this.parentNode;
                    //if (this !== state.highlighted && !state.queue.has(this)) {
                        //if (/**/event.offsetY < (this.offsetHeight / 2) + 1) {
                        if (/*this.previousSibling !== state.highlighted && !state.queue.has(this.previousSibling) && */event.offsetY < (this.offsetHeight / 2)) {
                            parent.insertBefore(state.placeholder, this);
                        } else/* if (this.nextSibling !== state.highlighted && !state.queue.has(this.nextSibling))*/ {
                            parent.insertBefore(state.placeholder, this.nextSibling);
                        }
                        //console.log((this.offsetHeight / 2), event.offsetY);
//                        if (this.nextSibling === state.placeholder) {
//                        //if (!state.queue.has(this)) {

//                        //}
//                        } else if (this.previousSibling === state.placeholder) {

//                        } else {

//                        }
                    //}
                    //state.old = this;
                //}.bind(this), 25);
            }, true);

            /*container.addEventListener("dragenter", function anon(event) {
                return;
                if (!state.queue.has(this)) {
                    var index = Array.indexOf(this.parentNode.children, this);
                    //! var index = Array.slice(this.parentNode.children).indexOf(this);

                    //state.queue.add(state.highlighted);

                    if (false) { //!
                        if (anon.screenY && false) {
                            if (event.screenY < anon.screenY) {
                                state.queue.sort(function (a, b) {
                                    return b.tab.index - a.tab.index;
                                });
                                //! state.queue.reverse();
//                                state.queue.sort(function (a, b) {
//                                    return a.tab.index - b.tab.index;
//                                    console.log((b.tab.index + 1) - a.tab.index);
//                                    return (b.tab.index + 1) - a.tab.index;
//                                });
                                //! this.parentNode.insertBefore(state.highlighted, this);
                            } else {
                                state.queue.sort(function (a, b) {
                                    return a.tab.index - b.tab.index;
                                });
                                //! state.queue.reverse();
//                                state.queue.sort(function (a, b) {
//                                    return b.tab.index - a.tab.index;
//                                });
                                //! this.parentNode.insertBefore(state.highlighted, this.nextSibling);
                            }
                        }

//                        state.queue.forEach(function (item) {
//                            if (item.parentNode) {
//                                item.parentNode.removeChild(item);
//                            }
//                        });
                    }

                    state.queue.moveTabs(container.tab.windowId, index);
                }
                //! anon.screenY = event.screenY;
            }, true);*/

            //container.addEventListener("dragover", events.disable, true);
            container.addEventListener("dragstart", function (event) {
                //! container.removeEventListener("dragover", events.disable, true);

                //state.urlBar.hide();
                state.urlBar.setAttribute("hidden", "");

                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/uri-list", tab.url);
                event.dataTransfer.setData("text/plain", tab.url);

                state.highlighted = this;
                state.currentQueue = this.parentNode.queue;

                if (!state.currentQueue.length) {
                    state.currentQueue.add(state.highlighted);
                }

//                this.setAttribute("data-selected", "");

//                state.dragBox.innerHTML = "";

//                var fragment = document.createDocumentFragment();

//                state.currentQueue.forEach(function (item, i) {
//                    var clone = item.cloneNode(true);
//                    clone.setAttribute("data-queue", "");
//                    fragment.appendChild(clone);
//                });

//                console.log(fragment);

//                event.dataTransfer.setDragImage(this, 0, 0);

                //document.body.appendChild(state.dragBox);

//                console.log(state.dragBox);


            }, true);
            /*! container.addEventListener("dragend", function (event) {
                container.addEventListener("dragover", events.disable, true);
            }, true);*/


            var text = tab.title || tab.url;

            var cell = {
                favicon: UI.create("td", function (element) {
                    element.className = "tab-favicon";
                    element.title = text;

                    element.appendChild(UI.create("img", function (element) {
                        element.className = "stretch";
                        element.setAttribute("alt", "");

                        if (tab.favIconUrl) {
    //                            element.src = tab.favIconUrl;
                            element.src = "chrome://favicon/" + tab.url;
    //                            console.log(element.src);
                        } else {
                            element.src = "images/blank.png";
                        }
                    }));
                }),
                favorite: UI.create("td", function (element) {
                    element.className = "tab-favorite";
                    element.title = "Favorite this tab";

                    element.addEventListener("click", events.stop, true);

                    element.addEventListener("click", function () {
                        if (container.hasAttribute("data-favorited")) {
                            delete state.favorites[tab.url];

                            state.tabsByURL[tab.url].forEach(function (item) {
                                item.removeAttribute("data-favorited");
                            });
                        } else {
                            state.favorites[tab.url] = true;

                            state.tabsByURL[tab.url].forEach(function (item) {
                                item.setAttribute("data-favorited", "");
                            });
                            //this.style.backgroundImage = "url(images/unfavorite.png)";
                        }
                        state.search();
                        document.body.setAttribute("hidden", "");
                        document.body.removeAttribute("hidden");
                    }, true);

                    /*element.appendChild(UI.create("img", function (element) {
                        element.className = "stretch";
                        element.setAttribute("alt", "");

                        element.src = "images/favorite.png";
                    }));*/
                }),
                text: UI.create("td", function (element) {
                    element.className = "tab-text";
                    element.title = text;

                    element.appendChild(UI.create("span", function (span) {
                        span.textContent = text;

                        container.tabText = span;

                        /*container.editURL = function () {

                        };*/

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
                    }));
                }),
                close: UI.create("td", function (element) {
                    element.className = "tab-button-close";
                    element.title = "Close (Alt Click)";

                    //element.appendChild(UI.create("img", function (element) {
                        //element.src = "images/button-close.png";
                        element.draggable = true;

                        //element.addEventListener("mousedown", events.stop, true);
                        //element.addEventListener("click", events.stop, true);
                        //element.addEventListener("mouseup", events.stop, true);
                        element.addEventListener("dragstart", events.disable, true);

                        element.addEventListener("click", function (event) {
                            event.stopPropagation();
                            Platform.tabs.remove(tab.id);
                        }, true);

                        /*element.appendChild(UI.create("img", function (element) {
                            element.src = "images/button-close.png";

                        }));*/
                    //}));
                })
            };

            function blur() {
                cell.close.setAttribute("hidden", "");
            }
            function focus() {
                //var parent = container.parentNode;
                //var query = parent.querySelector(".tab[data-focused]");
                cell.close.removeAttribute("hidden");
            }

            container.updateButtonPositions = function () {
                cell.close.removeAttribute("data-display-hover");
                cell.close.removeAttribute("hidden");

                container.removeEventListener("Platform-blur", blur, true);
                container.removeEventListener("Platform-focus", focus, true);

                switch (Options.get("tabs.close.display")) {
                case "hover":
//                        cell.close.setAttribute("hidden", "");

//                        container.addEventListener("mouseover", function () {
//                            cell.close.removeAttribute("hidden");
//                        }, true);
//                        container.addEventListener("mouseout", function () {
//                            cell.close.setAttribute("hidden", "");
//                        }, true);
                    cell.close.setAttribute("data-display-hover", "");
                    break;
                case "focused":
                    if (!container.hasAttribute("data-focused")) {
                        cell.close.setAttribute("hidden", "");
                    }
                    container.addEventListener("Platform-blur", blur, true);
                    container.addEventListener("Platform-focus", focus, true);
//                        break;
//                    case "every":
//                        cell.close.style.display = "table-cell !important";
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
    },
    move: function (item, info, action) {
        var tab = item.tab;
        Platform.tabs.move(tab.id, info, function () {
            Platform.tabs.get(tab.id, function (tab) {
                item.tab = tab;
                if (typeof action === "function") {
                    action();
                }
            });
        });
    }
//    gotoURL: function (tab, url) {
//        if (url !== tab.url) {
//            if (!/^[^:]+:\/\//.test(url)) {
//                url = "http://" + url;
//            }
//            Platform.tabs.update(tab.id, { url: url });
//        }
//    },
//    editURL: function (tab) {
//        var container = state.tabs[tab.id];

//        var span = container.tabText;
//        var parent = span.parentNode;

//        container.draggable = !container.draggable;

//        var input = document.createElement("input");
//        input.className = "url-input";
//        input.type = "text";

//        input.value = tab.url;
//        input.tabIndex = -1;

//        input.addEventListener("keyup", function (event) {
//            if (event.which === 13 || event.which === 27) {
//                if (event.which === 13) {
//                    Tab.gotoURL(tab, this.value);
//                }
//                container.parentNode.focus();
//            }
//        }, true);
//        input.addEventListener("blur", function (event) {
//            parent.replaceChild(span, input);

//            container.draggable = !container.draggable;
//        }, true);

//        //input.addEventListener("mousedown", events.stop, true);
//        input.addEventListener("click", events.stop, true);

//        parent.replaceChild(input, span);
//        input.select();
//    }
};

var Window = {
    create: function (win) {
        var fragment = document.createDocumentFragment();

        fragment.appendChild(UI.create("td", function (container) {
            container.className = "window";

            state.windows[win.id] = container;
            state.list.add(container);

            container.window = win;
            container.tabIndex = -1; //! 2


            function scrollTo() {
                UI.scrollIntoView(this.tabList, document.body, 41);
            }
            container.addEventListener("mouseup", scrollTo, true);


            container.select = function () {
                action.unselectWindow();

                container.setAttribute("data-focused", "");
            };

            container.unselect = function () {
                var id = Options.get("window.lastfocused");
                if (state.windows[id]) {
                    state.windows[id].select();
                }
            };

            container.setWindowFocus = function () {
                //Options.set("window.lastfocused", win.id);

                container.select();

//                container.setAttribute("data-selected", "");
//                addEventListener("blur", function anon(event) {
//                    this.removeEventListener(event.type, anon, true);

//                    container.removeAttribute("data-selected");
//                }, true);

//                setTimeout(function () {
                    scrollTo.call(container);
//                }, 0);
            };


            container.addEventListener("blur", function (event) {
                this.removeAttribute("data-selected");

                container.unselect();
            }, true);
            container.addEventListener("focus", function (event) {
                //console.log(event.type);
                //if (event.target === this) { //!
                    //this.tabList.focus();

                    /*! if (!state.dragging) {
                        scrollTo.call(this);
                    }*/
                //}
                this.setAttribute("data-selected", "");

                container.select();
            }, true);


            container.addEventListener("keydown", function (event) {
                var query;

                if (event.target.localName === "input") {
                    return;
                }

                if (event.which === 38 || event.which === 40) {
                    query = this.querySelector(".tab[data-focused]");
                    if (query) {
                        var element = (event.which === 38) ?
                            query.previousSibling :
                            query.nextSibling;

                        if (element) {
                            event.preventDefault();

                            //element.scrollIntoView();
                            //UI.scrollTo(query, this.tabList.scroll);
                            //UI.scrollIntoView(element, this.tabList.scroll, 110);

                            Platform.tabs.focus(element.tab);
                        }
                    }
                } else if (event.which === 32 || event.which === 13) {
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

            //container.addEventListener("mousedown", container.blur, true);

            container.addEventListener("dragstart", function (event) {
                //! container.removeEventListener("dragover", events.disable, true);

                addEventListener("blur", function anon(event) {
                    this.removeEventListener(event.type, anon, true);
                    event.stopPropagation();
                }, true);
            }, true);
            /*container.addEventListener("dragend", function (event) {
                //! container.addEventListener("dragover", events.disable, true);
            }, true);*/

            //container.addEventListener("dragenter", events.disable, true);
            container.addEventListener("dragenter", container.focus, true);
            container.addEventListener("dragover", events.disable, true);
            //container.addEventListener("dragover", events.stop, true);
            container.addEventListener("dragenter", function (event) {
                var list = this.tabList;
                var coords = list.getBoundingClientRect();
                //console.log(event.clientX, coords.left, coords.right);
                if (!list.contains(event.target)) {
                    if (event.clientX > coords.left && event.clientX < coords.right) {
                        if (event.clientY < coords.top) {
                            list.insertBefore(state.placeholder, list.firstChild);
                        } else {
                            list.appendChild(state.placeholder);
                        }
                    }
                }
                //if (event.target === element) {


                    /*state.queue.add(state.highlighted);
                    state.queue.moveTabs(win.id);
                    //! state.queue.reset();
                    */
                //}
            }, true);
            container.addEventListener("drop", function (event) {
                //if (event.dataTransfer.dropEffect !== "none") {
                    var index = Array.indexOf(this.tabList.children, state.placeholder);

                    //if (!this.tabList.contains(event.target)) {
                        //state.queue.add(state.highlighted);
                        state.currentQueue.moveTabs(win.id, index);
                        state.currentQueue.reset();
                        delete state.currentQueue.shiftNode;
                    //}
                    //state.placeholder.parentNode.removeChild(state.placeholder);
                //}
            }, true);

            container.appendChild(UI.create("div", function (element) {
                element.className = "window-div";

                element.appendChild(UI.create("table", function (element) {
                    element.className = "stretch";

                    element.appendChild(UI.create("tr", function (element) {

                        element.appendChild(UI.create("div", function (element) {
                            element.className = "tab-icon-border";

                            function invalid(event) {
                                var box = this.getBoundingClientRect();
                                return event.pageY > box.bottom
                                    || !container.hasAttribute("data-selected")
                                    || !Options.get("windows.middle-close");
                            }

                            element.addEventListener("mousedown", function (event) {
                                if (invalid.call(this, event)) {
                                    return;
                                }

                                if (event.button === 1) {
                                    Platform.windows.remove(win.id);
                                }
                            }, true);

                            element.appendChild(UI.create("div", function (stack) {
                                stack.className = "tab-icon-container";

                                stack.appendChild(UI.create("div", function (icon) {
                                    icon.className = "tab-icon";

                                    container.tabIcon = icon;

                                    icon.appendChild(UI.create("table", function (element) {
                                        element.className = "tab-icon-table";

                                        element.appendChild(UI.create("td", function (element) {

                                            element.appendChild(UI.create("input", function (element) {
                                                element.setAttribute("spellcheck", "false");
                                                element.className = "tab-icon-text";
                                                element.type = "text";
                                                element.tabIndex = -1;

                                                icon.indexText = element;

                                                var index = state.list.indexOf(container);
                                                element.value = action.returnTitle(index);

                                                var value;

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
                                                    this.value = this.value || index + 1;

                                                    if (this.value !== value) {
                                                        if (Options.get("undo.rename-window")) {
                                                            Undo.push("rename-window", {
                                                                focus: container.tabList.scroll,
                                                                value: value,
                                                                node: this
                                                            });
                                                            state.undoBar.show("You renamed the window \""/* <span style='font-variant: small-caps;'>" */
                                                                + this.value + "\".");
                                                        }
                                                    }

                                                    //container.tabList.scroll.focus();
                                                }, true);
                                                element.addEventListener("keyup", function (event) {
                                                    if (event.which === 13 || event.which === 27) {
                                                        if (event.which === 27) {
                                                            this.value = value;

                                                            container.tabList.scroll.focus();
                                                            //! container.tabList.focus();
                                                        }
                                                        this.blur();
                                                    }
                                                }, true);
                                            }));
                                        }));

                                        element.appendChild(UI.create("td", function (element) {
                                            element.appendChild(UI.create("div", function (element) {
                                                element.className = "tab-icon-dropdown";
                                                element.title = "Open menu (Ctrl M)";

                                                var contextMenu = UI.contextMenu(function (menu) {
//                                                    menu["DOM.Element"].title = "\0";

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
                                                        //console.log(event.target);
                                                        /*if (event.target === element) {
                                                            return;
                                                        }*/

                                                        event.preventDefault();

//                                                        var style = UI.style(contextMenu, {
//                                                            position: "fixed",
//                                                            left: event.clientX + 5 + "px",
//                                                            top: event.clientY + 7 + "px"
//                                                        });

//                                                        var x = event.clientX,
//                                                            y = event.clientY;

                                                        //document.body.appendChild(contextMenu);

                                                        menu.show({
                                                            x: event.clientX,
                                                            y: event.clientY
//                                                            onhide: function () {
//                                                                //console.log(info);
//                                                                //style.reset();

//    //                                                            if (contextMenu.style.position !== info.position) {
//    //                                                            }
//    //                                                            if (contextMenu.style.left !== info.left) {
//    //                                                            }
//    //                                                            if (contextMenu.style.top !== info.top) {
//    //                                                            }

//                                                                //element.appendChild(contextMenu);
//                                                                //container.focus();
//                                                            }
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
                                                                //url: "chrome://newtab/",
                                                                windowId: win.id
                                                            }, function (tab) {
                                                                if (Options.get("undo.new-tab")) {
                                                                    Undo.push("new-tab", {
                                                                        id: tab.id
                                                                    });
                                                                    state.undoBar.show("You created a new tab.");
                                                                }
                                                                //console.log("onEnded!", state.tabs[tab.id].parentNode);
                                                                //console.log(state.tabs[tab.id].parentNode);
//                                                                setTimeout(function () {
//                                                                    Tab.editURL(tab);//state.tabs[tab.id].editURL();
//                                                                }, 1000);
                                                            });
                                                        }
                                                    });

                                                    menu.separator();

                                                    menu.addItem("<u>R</u>ename window", {
                                                        keys: ["R"],
                                                        action: function (event) {
                                                            event.preventDefault();
                                                            //console.warn(event);
                                                            //var text = ;
                                                            //text.addEventListener("keydown", events.stop, true);
                                                            //text.addEventListener("keyup", events.stop, true);
                                                            container.tabIcon.indexText.select();
                                                        }
                                                    });

                                                    menu.separator();

                                                    menu.addItem("Select <u>a</u>ll", {
                                                        keys: ["A"],
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
                                                        action: function (menu) {
                                                            menu.addItem("Re<u>l</u>oad selected", {
                                                                keys: ["L"],
                                                                action: function () {
                                                                    container.tabList.queue.forEach(function (item) {
                                                                        Platform.tabs.update(item.tab.id, {
                                                                            url: item.tab.url
                                                                        });
                                                                    });

                                                                    container.tabList.queue.reset();
                                                                }
                                                            });

//                                                            menu.separator();

                                                            menu.addItem("<u>C</u>lose selected", {
                                                                keys: ["C"],
                                                                action: function () {
                                                                    container.tabList.queue.forEach(function (item) {
                                                                        Platform.tabs.remove(item.tab.id);
                                                                    });
                                                                    container.tabList.queue.reset();
                                                                    delete container.tabList.queue.shiftNode;
                                                                    /*var length = container.tabList.children.length;
                                                                    var text = "Do you want to close " + length + " tabs?";

                                                                    if (length === 1 || confirm(text)) {
                                                                        Platform.windows.remove(win.id);
                                                                    }*/
                                                                }
                                                            });

//                                                            menu.addItem("<u>C</u>lose selected");
//                                                            menu.addItem("<u>C</u>lose selected");
//                                                            menu.addItem("<u>C</u>lose selected");
//                                                            menu.addItem("<u>C</u>lose selected");
//                                                            menu.addItem("<u>C</u>lose selected");
//                                                            menu.addItem("<u>C</u>lose selected");
//                                                            menu.addItem("<u>C</u>lose selected");
//                                                            menu.separator();
//                                                            menu.addItem("<u>C</u>lose selected");
                                                        }
                                                    });

                                                    menu.separator();

                                                    menu.addItem("<u>M</u>ove all selected", {
                                                        keys: ["M"],
                                                        action: function () {
                                                            state.queues.moveAllTabs(win.id);
                                                            state.queues.resetAll();
                                                        }
                                                    });
                                                });

                                                element.appendChild(contextMenu);
                                            }));
//                                            element.appendChild(UI.create("div", function (dropdown) {
//                                                dropdown.className = "tab-icon-dropdown";

//                                                /*var img = document.createElement("img");
//                                                img.src = "images/button-menu.png";*/

//                                                dropdown.addEventListener("mousedown",  {
//                                                    build: function (menu) {

//                                                    }
//                                                }), true);

//                                                //dropdown.appendChild(element);
//                                                //dropdown.appendChild(img);
////                                                UI.create("ul", function (element) {
////                                                    element.className = "tab-icon-buttons";

////                                                    function menuitem(name, action) {
////                                                        element.appendChild(UI.create("li", function (element) {
////                                                            element.textContent = name;
////                                                            element.addEventListener("mouseup", action, true);
////                                                        }));
////                                                    }
////                                                    function separator() {
////                                                        element.appendChild(document.createElement("hr"));
////                                                    }

////                                                    function hide() {
////                                                        element.style.display = "none !important";
////                                                    }
////                                                    hide();

////                                                    /*element.addEventListener("click", function () {
////                                                        UI.modal(false);
////                                                    }, true);*/

////                                                    dropdown.addEventListener("mousedown", function () {
////                                                        element.style.display = "";

////                                                        UI.modal(element, hide);

////                                                        /*addEventListener("mousedown", events.disable, true);
////                                                        addEventListener("mousedown", events.stop, true);
////                                                        addEventListener("click", hide, true);*/
////                                                    }, true);
////                                                    dropdown.addEventListener("mouseup", function (event) {
////                                                        if (event.target.localName === "li") {
////                                                            UI.modal(null);
////                                                        }
////                                                    }, true);
////                                                    /*dropdown.addEventListener("click", function () {
////                                                        element.style.display = "";

////                                                        UI.modal(element, hide);
////                                                    }, false);*/

////                                                    /*element.appendChild(UI.create("li", function (element) {
////                                                        element.textContent = "New Tab";

////                                                        element.addEventListener("mouseup", function () {

////                                                        }, true);
////                                                    }));

////                                                    element.appendChild(document.createElement("hr"));

////                                                    element.appendChild(UI.create("li", function (element) {
////                                                        element.textContent = "Close All";

////                                                        element.addEventListener("mouseup", function () {
////                                                            var length = container.tabList.children.length;
////                                                            var text = "Do you want to close " + length + " tabs?";

////                                                            if (length === 1 || confirm(text)) {
////                                                                Platform.windows.remove(win.id);
////                                                            }
////                                                        }, true);
////                                                    }));*/

////                                                    /*element.innerHTML += "\
////                                                        <li><u>B</u>ack</li>\
////                                                        <li disabled><u>F</u>orward</li>\
////                                                        <li>Re<u>l</u>oad</li>\
////                                                        <hr />\
////                                                        <li>Save <u>A</u>s...</li>\
////                                                        <li>P<u>r</u>int...</li>\
////                                                        <li><u>T</u>ranslate to English</li>\
////                                                        <li><u>V</u>iew Page Source</li>\
////                                                        <li>View Page <u>I</u>nfo</li>\
////                                                        <hr />\
////                                                        <li>I<u>n</u>spect Element</li>\
////                                                        <hr />\
////                                                        <li disabled>Input <u>M</u>ethods</li>\
////                                                    "*/

////                                                    /*element.appendChild(UI.create("li", function (element) {
////                                                        element.textContent = "Back";
////                                                    }));
////                                                    element.appendChild(UI.create("li", function (element) {
////                                                        element.textContent = "Forward";
////                                                    }));*/
////                                                }));
//                                            }));
                                        }));
                                    }));
                                }));
                            }));
                        }));
                    }));

                    element.appendChild(UI.create("tr", function (element) {
                        element.className = "stretch";

                        element.appendChild(UI.create("div", function (element) {
                            element.className = "stretch";

                            element.appendChild(UI.create("div", function (element) {
                                element.className = "tab-list-border";

                                element.appendChild(UI.create("div", function (element) {
                                    element.className = "tab-list";
                                    element.tabIndex = 1;

                                    element.appendChild(UI.create("div", function (list) {
                                        container.tabList = list;
                                        list.scroll = element;

                                        list.queue = [];

                                        //list.addEventListener("DOMNodeInserted", state.search, true);
                                        //list.addEventListener("DOMNodeRemoved", state.search, true);

//                                        /*addEventListener("keydown", function (event) {
//                                            console.warn(event);
//                                        }, true);*/

                                        /*! var update = function anon(event) {
                                            clearTimeout(anon.timeout);

                                            var self = this;
                                            anon.timeout = setTimeout(function () {
                                                container.tabIcon.title = "Tabs: " + self.children.length;
                                            }, 2000);
                                        };
                                        list.addEventListener("DOMNodeInserted", update, true);
                                        list.addEventListener("DOMNodeRemoved", update, true);*/

                                        win.tabs.forEach(function (tab) {
//                                            var element = Tab.create(tab);

//                                            /*if (tab.selected) {
//                                                setTimeout(function () {
//                                                    UI.scrollTo(element, list);
//                                                }, 0);
//                                            }*/

                                            list.appendChild(Tab.create(tab));
                                        });
                                    }));
                                }));
                            }));
                        }));
                    }));
                }));
            }));
        }));

        return fragment;
    }
};
