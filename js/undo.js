/*global Undo */

(function () {
    "use strict";

    Undo.setHook("move-tabs", function (info) {
        if (info.list.length) {
            state.last.moved = info.list;
        }
    });
    Undo.setHook("macro-trigger", function (info) {
        if (info.moved.length) {
            state.last.moved = info.moved;
        }
    });


    Undo.setRule("new-tab", function (info) {
        Platform.tabs.remove(info.tab);
        Undo.reset();
    });

    Undo.setRule("rename-window", function (info) {
        info.window.title = info.value;
//        state.titles[info.index] = info.node.value = info.value;
        info.node.select();
        Undo.reset();
    });

    Undo.setRule("select-tabs", function (info) {
        info.list.forEach(function (item) {
            if (item.undoState.selected) {
                item.queueAdd();
            } else {
                item.queueRemove();
            }
        });

        delete info.queue.shiftNode;

        Undo.reset();
    });

    function move(info) {
        var proxy = {};
        var length = info.list.length - 1;

        info.list.forEach(function (item, i) {
            Queue.sync(function (queue) {
                var undo = item.undoState;
                var info = {
                    index: undo.index
                };

                var tab = item.tab;
                if (tab.windowId === undo.windowId && tab.index < info.index) {
                    info.index += length - i;
                }

                if (state.windows[undo.windowId]) {
                    info.windowId = undo.windowId;
                } else {
                    info.windowId = proxy[undo.windowId];
                }

                function reindent(tab) {
                    var level = state.indent[tab.window.index];
                    if (level) {
                        level[tab.index] = undo.indentLevel;
                        Platform.event.trigger("tab-indent", tab, level[tab.index]);
                    }

                    item.queueAdd();
                }

                if (info.windowId) {
                    Tab.move(item, info, reindent);
                    queue.next();
                } else {
                    Window.create(null, {
                        title: undo.windowName,
                        action: function (win) {
                            info.windowId = proxy[undo.windowId] = win.id;
                            Tab.move(item, info, reindent);
                            queue.next();
                        }
                    });
                }
            });
        });
        Undo.reset();
    }

    Undo.setRule("move-tabs", move);
    Undo.setRule("macro-trigger", function (info) {
        info.list = info.moved;
        move(info);
    });
}());
