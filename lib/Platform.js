/*global chrome, Options */

var Platform = (function () {
    "use strict";

    return {
        getURL: function (name) {
            return chrome.extension.getURL(name);
        },


        getBackgroundPage: function () {
            return chrome.extension.getBackgroundPage();
        },


        idle: {
            queryState: function (seconds, action) {
                return chrome.idle.queryState(seconds, action);
            }
        },


        bookmarks: {
            getTree: function (action) {
                chrome.bookmarks.getTree(action);
            },
            on: function (name, action) {
                switch (name) {
                case "change":
                    chrome.bookmarks.onChanged.addListener(action);
                    break;
                case "create":
                    chrome.bookmarks.onCreated.addListener(action);
                    break;
                case "remove":
                    chrome.bookmarks.onRemoved.addListener(action);
                }
            }
        },


        message: {
            send: function (json) {
            },
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
                switch (name) {
                default:
                    chrome.extension.onConnect.addListener(function (port) {
                        if (port.name === name) {
                            port.onMessage.addListener(action);
                        }
                    });
                }
            }
        },


        tabs: {
            get: function (id, action) {
                chrome.tabs.get(id, action);
            },
            getSelected: function (id, action) {
                chrome.tabs.getSelected(id, action);
            },
            getAllInWindow: function (id, action) {
                chrome.tabs.getAllInWindow(id, action);
            },
            create: function (info, action) {
                chrome.tabs.create(info, action);
            },
            remove: function (id) {
                chrome.tabs.remove(id);
            },
            update: function (id, info, action) {
                chrome.tabs.update(id, info, action);
            },
            focus: function (tab, action) {
                Platform.tabs.update(tab.id, { selected: true });
                if (Options.get("window.lastfocused") !== tab.windowId) {
                    Platform.windows.update(tab.windowId, { focused: true }, action);
                }
            },
            move: function (id, info, action) {
                chrome.tabs.move(id, info, action);
            },
            on: function (name, action) {
                switch (name) {
                case "create":
                    chrome.tabs.onCreated.addListener(action);
                    break;
                case "update":
                    chrome.tabs.onUpdated.addListener(action);
                    break;
                case "move":
                    chrome.tabs.onMoved.addListener(action);
                    break;
                case "detach":
                    chrome.tabs.onDetached.addListener(action);
                    break;
                case "attach":
                    chrome.tabs.onAttached.addListener(action);
                    break;
                case "focus":
                    chrome.tabs.onSelectionChanged.addListener(action);
                    break;
                case "remove":
                    chrome.tabs.onRemoved.addListener(action);
                }
            },
            removeListener: function (name, action) {
                switch (name) {
                case "create":
                    chrome.tabs.onCreated.removeListener(action);
                    break;
                case "update":
                    chrome.tabs.onUpdated.removeListener(action);
                    break;
                case "move":
                    chrome.tabs.onMoved.removeListener(action);
                    break;
                case "detach":
                    chrome.tabs.onDetached.removeListener(action);
                    break;
                case "attach":
                    chrome.tabs.onAttached.removeListener(action);
                    break;
                case "focus":
                    chrome.tabs.onSelectionChanged.removeListener(action);
                    break;
                case "remove":
                    chrome.tabs.onRemoved.removeListener(action);
                }
            }
        },


        windows: {
            get: function (id, action) {
                chrome.windows.get(id, action);
            },
            getAll: function (info, action) {
                chrome.windows.getAll(info, action);
            },
            create: function (info, action) {
                chrome.windows.create(info, action);
                Platform.message.connect("lib.action", function (port) {
                    port.sendMessage({ type: "focus" });
                });
            },
            remove: function (id) {
                chrome.windows.remove(id);
            },
            update: function (id, info, action) {
                chrome.windows.update(id, info, action);
            },
            on: function (name, action) {
                function wrapper(id) {
                    if (id === chrome.windows.WINDOW_ID_NONE) {
                        action(null);
                    } else {
                        action(id);
                    }
                }

                switch (name) {
                case "create":
                    chrome.windows.onCreated.addListener(action);
                    break;
                case "focus":
                    chrome.windows.onFocusChanged.addListener(wrapper);
                    break;
                case "remove":
                    chrome.windows.onRemoved.addListener(wrapper);
                }
            }
        },


        icon: {
            setBackgroundColor: function (info) {
                chrome.browserAction.setBadgeBackgroundColor(info);
            },
            setText: function (info) {
                chrome.browserAction.setBadgeText({
                    text: info.text + ""
                });
            },
            setPopup: function (info) {
                chrome.browserAction.setPopup(info);
            },
            setTitle: function (info) {
                chrome.browserAction.setTitle(info);
            },
            on: function (name, action) {
                switch (name) {
                case "click":
                    chrome.browserAction.onClicked.addListener(action);
                }
            }
        }
    };
}());
