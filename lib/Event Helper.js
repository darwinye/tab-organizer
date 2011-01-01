"use strict";
/*global Options, Platform, state, Tab, UI, Window */

var events = {
    disable: function (event) {
        event.preventDefault();
    },
    stop: function (event) {
        event.stopPropagation();
    }
};


var action = {
    returnTitle: function (index) {
        var value = state.titles[index];
        return (value) ? value : index + 1;
    },


    unselectWindow: function () {
        var query = document.querySelector(".window[data-focused]");
        if (query) {
            query.removeAttribute("data-focused");
        }
    },


    attachEvents: function (element) {
        Platform.windows.addEventListener("create", function (win) {
            if (win.type === "normal") {
                element.appendChild(Window.proxy(win));

                state.search({ nodelay: true }); //! Prevents jittering
            }
        }, true);

        Platform.tabs.addEventListener("create", function (tab) {
            var node, list = state.windows[tab.windowId];

            if (list && (list = list.tabList)) {
                node = Tab.proxy(tab);
                list.moveChild(node, tab.index);

                state.search({ scroll: true, tabs: [node] });
            }
        }, true);

        Platform.tabs.addEventListener("update", function (id, info, tab) {
            var list, node = state.tabsByID[id];

            if (node && (list = node.parentNode)) {
                state.tabsByURL.remove(node.tab.url, node);

                var selected = node.hasAttribute("data-selected");

                var element = Tab.proxy(tab);
                list.replaceChild(element, node);

                if (selected) {
                    element.queueAdd();
                }

                state.search({ tabs: [element] });
            }
        }, true);

        Platform.tabs.addEventListener("move", function (id, info) {
            var list = state.windows[info.windowId],
                node = state.tabsByID[id];

            if (list && node && (list = list.tabList)) {
                if (node.parentNode === list) {
                    list.removeChild(node);
                }
                list.moveChild(node, info.toIndex);

                //! UI.scrollTo(node, list);
            }
        }, true);

        Platform.tabs.addEventListener("detach", function (id, info) {
            var list = state.windows[info.oldWindowId];

            if (list && (list = list.tabList)) {
                delete list.queue.shiftNode;
            }
        }, true);

        Platform.tabs.addEventListener("attach", function (id, info) {
            var list = state.windows[info.newWindowId],
                node = state.tabsByID[id];

            if (list && node && (list = list.tabList)) {
                node.removeAttribute("data-focused");
                list.moveChild(node, info.newPosition);

                node.tab.windowId = info.newWindowId;

                state.search({ scroll: true, tabs: [node] });
            }
        }, true);

        Platform.tabs.addEventListener("focus", function (id, info) {
            var list = state.windows[info.windowId],
                node = state.tabsByID[id];

            if (list && node) {
                var scroll = list.tabList;

                if ((list = list.querySelector("[data-focused]"))) {
                    list.removeAttribute("data-focused");
                    list.triggerEvent("Platform-blur", false, false);
                }
                node.setAttribute("data-focused", "");
                node.scrollIntoViewIfNeeded(false);

                if (!node.nextSibling) {
                    scroll.scrollTop += 9001;
                } else if (!node.previousSibling) {
                    scroll.scrollTop -= 9001;
                }
                //! UI.scrollTo(node, node.parentNode);

                node.triggerEvent("Platform-focus", false, false);

                state.search({ tabs: [node] });
            }
        }, true);

        Platform.tabs.addEventListener("remove", function (id) {
            var list, node = state.tabsByID[id];

            if (node && (list = node.parentNode)) {
                state.tabsByURL.remove(node.tab.url, node);

                list.removeChild(node);

                state.search({ tabs: [] });
            }
            delete state.tabsByID[id];
        }, true);

        Platform.windows.addEventListener("remove", function (id) {
            var list = state.windows[id];

            if (list && list.parentNode) {
                list.parentNode.removeChild(list);

                var index = state.list.indexOf(list);
                if (index !== -1) {
                    state.titles.splice(index, 1);
                }
            }
            delete state.windows[id];

            state.list.remove(list);
            state.list.forEach(function (item, i) {
                var title = action.returnTitle(i);
                item.tabIcon.indexText.value = title;
            });

            state.search({ nodelay: true, tabs: [] });
        }, true);
    }
};
