"use strict";
/*global chrome */

function Platform() {}
Platform.getBackgroundPage = function () {
    return chrome.extension.getBackgroundPage();
};
Platform.message = {
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
    addEventListener: function (name, action, type) {
        if (typeof type !== "boolean") {
            throw new TypeError("3rd argument must be a boolean.");
        }

        switch (name) {
        default:
            chrome.extension.onConnect.addListener(function (port) {
                if (port.name === name) {
                    port.onMessage.addListener(action);
                }
            });
        }
    }
};
Platform.tabs = {
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
    update: function (id, info) {
        chrome.tabs.update(id, info);
    },
    move: function (id, info, action) {
        chrome.tabs.move(id, info, action);
    },
    addEventListener: function (name, action, type) {
        if (typeof type !== "boolean") {
            throw new TypeError("3rd argument must be a boolean.");
        }

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
    }
};
Platform.windows = {
    ID_NONE: chrome.windows.WINDOW_ID_NONE,
    get: function (id, action) {
        chrome.windows.get(id, action);
    },
    getAll: function (info, action) {
        chrome.windows.getAll(info, action);
    },
    create: function (info, action) {
        chrome.windows.create(info, action);
    },
    remove: function (id) {
        chrome.windows.remove(id);
    },
    update: function (id, info) {
        chrome.windows.update(id, info);
    },
    addEventListener: function (name, action, type) {
        if (typeof type !== "boolean") {
            throw new TypeError("3rd argument must be a boolean.");
        }

        switch (name) {
        case "create":
            chrome.windows.onCreated.addListener(action);
            break;
        case "focus":
            chrome.windows.onFocusChanged.addListener(action);
            break;
        case "remove":
            chrome.windows.onRemoved.addListener(action);
        }
    }
};
Platform.icon = {
    setPopup: function (info) {
        chrome.browserAction.setPopup(info);
    },
    setTitle: function (info) {
        chrome.browserAction.setTitle(info);
    },
    addEventListener: function (name, action, type) {
        if (typeof type !== "boolean") {
            throw new TypeError("3rd argument must be a boolean.");
        }

        switch (name) {
        case "click":
            chrome.browserAction.onClicked.addListener(action);
        }
    }
};
