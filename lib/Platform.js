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

    function add(list, tab) {
/*!
        if (list.length < tab.index) {
            list.length = tab.index;
        }
*/
        list.splice(tab.index, 0, tab);
    }

    function update(list, i) {
//        console.log(i);
//        console.log(tab.index, list.length);
        for (i; i < list.length; i += 1) {
//            console.log(i, list[i]);
            list[i].index = i;
        }
/*        list.forEach(function (item, i) {
            item.index = i;
        });*/
    }

    function assign(tab) {
        var win = windowsByID[tab.windowId];
        var list = win.tabs;

        tab.window = win;
//        console.log(win);

        add(list, tab);
        update(list, tab.index);
    }

    function remove(list, tab) {
        list.splice(tab.index, 1);
//        var index = list.indexOf(tab);
//        if (list !== -1) {
//            list.splice(index, 1);
//        }
    }
//    function move(list, tab, index) {
//    }

    addEventListener("load", function () {
        chrome.windows.getAll({ populate: true }, function (array) {
//            var index = 0;
//
            array.forEach(function (win, i) {
                if (win.focused) {
                    lastfocused = win;
                }
                win.index = i;
//                win.index = windows.push(win) - 1;

                windows.push(win);

                windowsByID[win.id] = win;

                win.tabs.forEach(function (tab) {
//                    tab.globalIndex = index;
//                    index += 1;
//
                    if (tab.selected) {
                        focusedByID[win.id] = tab;
                    }
                    tab.window = win;

                    tabsByID[tab.id] = tab;
                });
            });


            chrome.tabs.onCreated.addListener(function (tab) {
//                console.log("tab-onCreated");
        //        try {
                assign(tab);
//                console.log(tab.selected);
/*
                if (tab.selected) {
                    focusedByID[tab.windowId] = tab;
                }*/
        //
        //        try {
        //        console.log(tab.window);
        //        } catch (e) {
        //            console.error(e);
        //        }
        //        } catch (e) {
        //            console.error(e);
        //        }

                tabsByID[tab.id] = tab;

                Platform.event.trigger("tab-create", tab);
            });

            chrome.tabs.onUpdated.addListener(function (id, info, tab) {
                var saved = tabsByID[id];
        //
        //        console.log(info, tab);
        //
        //        saved.window = windowsByID[saved.windowId];

                var old = {
                    favIconUrl: saved.favIconUrl,
                    pinned: saved.pinned,
                    status: saved.status,
                    title: saved.title,
                    url: saved.url
                };
/*!
                var old = {};

                ["favIconUrl", "pinned", "status", "title", "url"].forEach(function (name) {
                    if (saved[name] !== tab[name]) {
                        old[name] = saved[name];
                    }
                    saved[name] = tab[name];
                });*/

                saved.favIconUrl = tab.favIconUrl;
                saved.pinned = tab.pinned;
                saved.status = tab.status;
                saved.title = tab.title;
                saved.url = tab.url;

                Platform.event.trigger("tab-update", saved, old);
            });

            chrome.tabs.onMoved.addListener(function (id, info) {
                var tab = tabsByID[id];
                var list = windowsByID[tab.windowId].tabs;
        //
        //        console.log(tab.index, info.toIndex);

                remove(list, tab);

                tab.index = info.toIndex;
                add(list, tab);

                update(list, Math.min(info.fromIndex, info.toIndex));
        //
        //        console.log(list.indexOf(tab) === info.toIndex);
        //        list.splice(info.toIndex, 0, tab);

                Platform.event.trigger("tab-move", tab, info);
            });

            chrome.tabs.onDetached.addListener(function (id, info) {
                var tab = tabsByID[id];
                var list = windowsByID[tab.windowId].tabs;

                tab.selected = false;
/*!
                if (focusedByID[tab.windowId] === tab) {
                    delete focusedByID[tab.windowId];
                }*/

                remove(list, tab);
                update(list, tab.index);
        //
        //        delete tab.windowId;
        //        delete tab.window;

                Platform.event.trigger("tab-detach", tab);
            });

            chrome.tabs.onAttached.addListener(function (id, info) {
                var tab = tabsByID[id];
                tab.windowId = info.newWindowId;
                tab.index = info.newPosition;
        //
        //        add(windowsByID[tab.windowId].tabs, tab, info.newPosition);

                assign(tab);
        //        var win = windowsByID[tab.windowId];
        //        add(win.tabs, tab);
        //        win.tabs.splice(tab.index, 0, tab);
        //
        //        tab.window = win;

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
                var list = windowsByID[tab.windowId].tabs;

                remove(list, tab);
                update(list, tab.index);
                delete tabsByID[id];

                Platform.event.trigger("tab-remove", tab);
            });


            chrome.windows.onCreated.addListener(function (win) {
//                console.log("window-onCreated");
                if (!win.tabs) {
                    win.tabs = [];
                }
                win.index = windows.push(win) - 1;

                windowsByID[win.id] = win;

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
                update(windows, win.index);
                delete windowsByID[id];

                Platform.event.trigger("window-remove", win);
            });


            Platform.event.trigger("load", windows);
        });
    }, true);


/*!    [
//        "tab-update",
//        "tab-create", "tab-focus",
//        "window-focus", "window-create"
    ].forEach(function (name) {
        Platform.event.on(name, function () {
            console.warn(name);
        });
    });*/


    Platform.bookmarks = {
        getTree: function (action) {
            chrome.bookmarks.getTree(action);
        }
    };

    chrome.bookmarks.onChanged.addListener(function (id, info) {
        Platform.event.trigger("bookmark-change", id, info);
    });
    chrome.bookmarks.onCreated.addListener(function (id, bookmark) {
        Platform.event.trigger("bookmark-create", id, bookmark);
    });
    chrome.bookmarks.onRemoved.addListener(function (id, info) {
        Platform.event.trigger("bookmark-remove", id, info);
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
//
//        getAllInWindow: function (id, action) {
//            chrome.tabs.getAllInWindow(id, action);
//        },

        create: function (info, action) {
            chrome.tabs.create(info, function (tab) {
//                console.log("tab-create");
                if (typeof action === "function") {
                    action(tabsByID[tab.id]);
                }
            });
//            chrome.tabs.create(info, action);
        },

        remove: function (tab) {
            chrome.tabs.remove(tab.id);
        },

        update: function (tab, info) {
            chrome.tabs.update(tab.id, info);
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
//            var index = info.index;
////
////            console.log(index);
///*
//            if (tab.index > index) {
//                index += 1;
//            }*/
//
//            if (typeof index !== "number" || index < 0) {
//                index = 9999999;
//            }/* else if (tab.index < index) {
//                index -= 1;
////                console.log(tab.index, index);
//            }*//* else if (tab.index > index) {
//                index += 1;
//            }
//            if (index < 0) {
//                console.error(index);
//                index = 0;
//            }*/
//
//            info.index = index;
            chrome.tabs.move(tab.id, info, function (tab) {
                if (typeof action === "function") {
                    action(tabsByID[tab.id]);
                }
            });
        }
    };


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
        get: function (id) {
            return windowsByID[id];
    //        chrome.windows.get(id, action);
        },

        getAll: function () {
            chrome.windows.getAll({ populate: true }, function (array) {
                array.forEach(function (win) {
                    win.tabs.forEach(function (tab) {
                        var saved = tabsByID[tab.id];
                        saved.favIconUrl = tab.favIconUrl;
                        saved.title = tab.title;
                        saved.url = tab.url;
                    });
                });
            });
            return windows;
        },
//
//        getAll: function (info, action) {
//            chrome.windows.getAll(info, action);
//        },

        create: function (info, action) {
            chrome.windows.create(info, function (win) {
//                console.log("window-create");
                if (typeof action === "function") {
                    action(windowsByID[win.id]);
                }
            });
    //
    //        Platform.message.connect("lib.action", function (port) {
    //            port.sendMessage({ type: "focus" });
    //        });
        },

        remove: function (win) {
            chrome.windows.remove(win.id);
        },

        update: function (win, info) {
            chrome.windows.update(win.id, info);
        }
    };


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

//
//    var visitsByURL = {};

    Platform.history = {
        lastVisit: function (url, action) {
            chrome.history.getVisits({ url: url }, function (visits) {
//                var saved = visitsByURL[url];
//                console.log(saved, visits.length);
//                if (saved && visits.length <= saved) {
////                    console.log("aborting");
//                    return;
//                }
//
                var visit = visits[visits.length - 1];
                if (visit) {
//                    visitsByURL[url] = visits.length;
                    action(visit);
                }
            });
        }
    };

    return Platform;
}());
