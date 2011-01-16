/*global chrome, KAE, Options */

var Platform = (function () {
    "use strict";

    var exists, page, Platform;

//    try {
    page = chrome.extension.getBackgroundPage();
//    } catch (e) {
//    }

    exists = (page.Platform && typeof page.Platform === "object");

    if (exists) {
        Platform = Object.create(page.Platform);
//        page.console.log(this);
        Platform.event = Platform.event.decouple(this);
//        Platform.event = Object.create(Platform.event);
    } else {
        Platform = {
            getURL: function (name) {
                return chrome.extension.getURL(name);
            },

            getBackgroundPage: function () {
                return chrome.extension.getBackgroundPage();
            },

            event: KAE.make.events()
        };
    }

    if (exists) {
        console.warn("Replacing with background Platform!");

        Platform.tabs.getCurrent = function (action) {
            return chrome.tabs.getCurrent(action);
        };

        return Platform;
    }

    var focusedByID = {},
        windowsByID = {},
        tabsByID = {};

    var windows = [];
    var lastfocused;

    function remove(list, tab) {
        var index = list.indexOf(tab);
        if (list !== -1) {
            list.splice(index, 1);
        }
    }
//    function move(list, tab, index) {
//    }

    addEventListener("load", function () {
        chrome.windows.getAll({ populate: true }, function (array) {
//            var index = 0;
//
            array.forEach(function (win) {
                if (win.focused) {
                    lastfocused = win;
                }

                windowsByID[win.id] = win;

                win.tabs.forEach(function (tab) {
//                    tab.globalIndex = index;
//                    index += 1;
//
                    if (tab.selected) {
                        focusedByID[win.id] = tab;
                    }

                    tabsByID[tab.id] = tab;
                });

                windows.push(win);
            });

            Platform.event.trigger("load", windows);
        });
    }, true);


    Platform.bookmarks = {
        getTree: function (action) {
            chrome.bookmarks.getTree(action);
        }
    };

    chrome.bookmarks.onChanged.addListener(function (id, info) {
        Platform.event.trigger("bookmark-change", { id: id, info: info });
    });
    chrome.bookmarks.onCreated.addListener(function (id, bookmark) {
        Platform.event.trigger("bookmark-create", { id: id, bookmark: bookmark });
    });
    chrome.bookmarks.onRemoved.addListener(function (id, info) {
        Platform.event.trigger("bookmark-remove", { id: id, info: info });
    });


    Platform.tabs = {
//        get: function (id) {
//            return tabsByID[id];
//    //        chrome.tabs.get(id, action);
//        },
    //
        getSelected: function (id) {
            return focusedByID[id];
//            chrome.tabs.getSelected(id, action);
        },

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

//        try {
        var list = windowsByID[tab.windowId].tabs;
        list.splice(tab.index, 0, tab);
//        } catch (e) {
//            console.error(e);
//        }

        Platform.event.trigger("tab-create", tab);
    });

    chrome.tabs.onUpdated.addListener(function (id, info, tab) {
        var old = tabsByID[id];

        old.pinned = tab.pinned;
        old.status = tab.status;
        old.url = tab.url;

        Platform.event.trigger("tab-update", old);
    });

    chrome.tabs.onMoved.addListener(function (id, info) {
        var tab = tabsByID[id];
        tab.index = info.toIndex;

        var list = windowsByID[tab.windowId].tabs;
        remove(list, tab);
        list.splice(info.toIndex, 0, tab);

        Platform.event.trigger("tab-move", tab, info);
    });

    chrome.tabs.onDetached.addListener(function (id, info) {
        var tab = tabsByID[id];

        remove(windowsByID[tab.windowId].tabs, tab);
        delete tab.windowId;

        Platform.event.trigger("tab-detach", tab);
    });

    chrome.tabs.onAttached.addListener(function (id, info) {
        var tab = tabsByID[id];
        tab.windowId = info.newWindowId;
        tab.index = info.newPosition;
//
//        add(windowsByID[tab.windowId].tabs, tab, info.newPosition);

        var list = windowsByID[tab.windowId].tabs;
        list.splice(info.newPosition, 0, tab);

        Platform.event.trigger("tab-attach", tab);
    });

    chrome.tabs.onSelectionChanged.addListener(function (id, info) {
//        try {
        var old = focusedByID[info.windowId];
        if (old) {
            old.selected = false;
        }
//        } catch (e) {
//            console.error(e);
//        }

        var tab = tabsByID[id];
        tab.selected = true;

        focusedByID[info.windowId] = tab;

        Platform.event.trigger("tab-focus", tab, old);
    });

    chrome.tabs.onRemoved.addListener(function (id, info) {
        var tab = tabsByID[id];

        remove(windowsByID[tab.windowId].tabs, tab);
        delete tabsByID[id];

        Platform.event.trigger("tab-remove", tab, info);
    });


    Platform.idle = {
        queryState: function (seconds, action) {
            return chrome.idle.queryState(seconds, action);
        }
    };


    Platform.message = {
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


    Platform.windows = {
    //
    //    get = function (id, action) {
    //        return
    ////        chrome.windows.get(id, action);
    //    },
        getAll: function () {
            return windows;
        },
//
//        getAll: function (info, action) {
//            chrome.windows.getAll(info, action);
//        },

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
        if (!win.tabs) {
            win.tabs = [];
        }
        windowsByID[win.id] = win;
        windows.push(win);

        Platform.event.trigger("window-create", win);
    });

    chrome.windows.onFocusChanged.addListener(function (id) {
        if (id !== chrome.windows.WINDOW_ID_NONE) {
            var old = lastfocused;
            if (old) {
                old.focused = false;
            }

            var win = windowsByID[id];
            win.focused = true;

            lastfocused = win;

            Platform.event.trigger("window-focus", win, old);
        }
    });

    chrome.windows.onRemoved.addListener(function (id) {
        var win = windowsByID[id];

        remove(windows, win);
        delete windowsByID[id];

        Platform.event.trigger("window-remove", win);
    });


    Platform.icon = {
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
        Platform.event.trigger("icon-click", tab);
    });


    Platform.history = {
        lastVisit: function (url, action) {
            chrome.history.getVisits({ url: url }, function (visits) {
                var visit = visits[visits.length - 1];
                if (visit) {
                    action(visit);
                }
            });
        }
    };

    return Platform;
}());
