/*global chrome, KAE, Options */

var Platform = (function () {
    "use strict";

    var windowsByID = {};
    var tabsByID = {};

    var obj = {
        getURL: function (name) {
            return chrome.extension.getURL(name);
        },

        getBackgroundPage: function () {
            return chrome.extension.getBackgroundPage();
        },

        event: KAE.make.events()
    };


    obj.bookmarks = {
        getTree: function (action) {
            chrome.bookmarks.getTree(action);
        }
    };

    chrome.bookmarks.onChanged.addListener(function (id, info) {
        obj.event.trigger("bookmark-change", { id: id, info: info });
    });
    chrome.bookmarks.onCreated.addListener(function (id, bookmark) {
        obj.event.trigger("bookmark-create", { id: id, bookmark: bookmark });
    });
    chrome.bookmarks.onRemoved.addListener(function (id, info) {
        obj.event.trigger("bookmark-remove", { id: id, info: info });
    });


    obj.tabs = {
        get: function (id) {
            return tabsByID[id];
    //        chrome.tabs.get(id, action);
        },

        getCurrent: function (action) {
            chrome.tabs.getCurrent(action);
        },
    //
    //    getSelected: function (id, action) {
    //        chrome.tabs.getSelected(id, action);
    //    },

        getAllInWindow: function (id, action) {
            chrome.tabs.getAllInWindow(id, action);
        },

        create: function (info, action) {
            chrome.tabs.create(info, action);
        },

        remove: function (tab) {
            chrome.tabs.remove(tab.id);
        },

        update: function (tab, info, action) {
            chrome.tabs.update(tab.id, info, action);
        },

        focus: function (tab, focus) {
            chrome.tabs.update(tab.id, { selected: true });
    //        Platform.tabs.update(tab, { selected: true });

            if (focus) {
    //        if (Options.get("window.lastfocused") !== tab.windowId) {
                chrome.windows.update(tab.windowId, { focused: true });
    //            Platform.windows.update(tab.windowId, { focused: true });
            }
        },

        move: function (tab, info, action) {
            chrome.tabs.move(tab.id, info, action);
        }
    };

    chrome.tabs.onCreated.addListener(function (tab) {
        tabsByID[tab.id] = tab;
        obj.event.trigger("tab-create", tab);
    });

    chrome.tabs.onUpdated.addListener(function (id, info, tab) {
        tabsByID[tab.id] = tab;
        obj.event.trigger("tab-update", tab);
    });

    chrome.tabs.onMoved.addListener(function (id, info) {
        var tab = tabsByID[id];
        tab.index = info.toIndex;
        obj.event.trigger("tab-move", tab, info);
    });

    chrome.tabs.onDetached.addListener(function (id, info) {
        obj.event.trigger("tab-detach", tabsByID[id]);
    });

    chrome.tabs.onAttached.addListener(function (id, info) {
        var tab = tabsByID[id];
        tab.windowId = info.newWindowId;
        tab.index = info.newPosition;
        obj.event.trigger("tab-attach", tab);
    });

    chrome.tabs.onSelectionChanged.addListener(function (id, info) {
        obj.event.trigger("tab-focus", tabsByID[id]);
    });

    chrome.tabs.onRemoved.addListener(function (id, info) {
        obj.event.trigger("tab-remove", tabsByID[id], info);
        delete tabsByID[id];
    });


    obj.idle = {
        queryState: function (seconds, action) {
            return chrome.idle.queryState(seconds, action);
        }
    };


    obj.message = {
//        send: function (json) {
//        },
        connect: function (name, action) {
            var port = chrome.extension.connect({ name: name });
            if (typeof action === "function") {
                action({
                    sendMessage: function (json) {
                        port.postMessage(json);
                    }
                });
            }
        },
        on: function (name, action) {
            chrome.extension.onConnect.addListener(function (port) {
                if (port.name === name) {
                    port.onMessage.addListener(action);
                }
            });
        }
    };
//
//
//    Platform.message.on("lib.action", function (json, port) {
//        switch (json.type) {
//        case "focus":
//            Platform.tabs.focus(port.tab);
//            break;
//        case "remove":
//            Platform.tabs.remove(port.tab.id);
//        }
//    });


    obj.windows = {
    //
    //    get = function (id, action) {
    //        return
    ////        chrome.windows.get(id, action);
    //    },

        getAll: function (info, action) {
            chrome.windows.getAll(info, action);
        },

        create: function (info, action) {
            chrome.windows.create(info, action);
    //
    //        Platform.message.connect("lib.action", function (port) {
    //            port.sendMessage({ type: "focus" });
    //        });
        },

        remove: function (win) {
            chrome.windows.remove(win.id);
        },

        update: function (win, info, action) {
            chrome.windows.update(win.id, info, action);
        }
    };

    chrome.windows.onCreated.addListener(function (win) {
        windowsByID[win.id] = win;
        obj.event.trigger("window-create", win);
    });

    chrome.windows.onFocusChanged.addListener(function (id) {
        if (id !== chrome.windows.WINDOW_ID_NONE) {
            obj.event.trigger("window-focus", windowsByID[id]);
        }
    });

    chrome.windows.onRemoved.addListener(function (id) {
        obj.event.trigger("window-remove", windowsByID[id]);
        delete windowsByID[id];
    });


    obj.icon = {
        setBackgroundColor: function (info) {
            chrome.browserAction.setBadgeBackgroundColor(info);
        },

        setText: function (info) {
            chrome.browserAction.setBadgeText({ text: info.text + "" });
        },

        setPopup: function (info) {
            chrome.browserAction.setPopup(info);
        },

        setTitle: function (info) {
            chrome.browserAction.setTitle(info);
        }
    };

    chrome.browserAction.onClicked.addListener(function (tab) {
        obj.event.trigger("icon-click", tab);
    });

    return obj;
}());
