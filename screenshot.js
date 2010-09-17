"use strict";
/*global */

Platform.windows.getAll = (function () {
    function Window(info, tabs) {
        Window.index += 1;
        return {
            id: Window.index,
            type: "normal",
            focused: info.focused,
            tabs: tabs.map(function (item) {
                item.id = Window.index + 9001;
                item.windowId = Window.index;
                return item;
            })
        };
    }
    Window.index = 9001;

    var saved = Platform.windows.getAll;

    return function (info, action) {
        setTimeout(function () {
//        saved(info, function (windows) {
//            windows.forEach(function (win) {
//                //console.warn(win.tabs);
//                console.warn(win.tabs.map(function (item) {
//                    return JSON.stringify(item, ["favIconUrl", "title", "url"]);
//                }));
////                win.tabs.forEach(function (tab) {
////                    console.warn(JSON.stringify(tab, ["favIconUrl, title, url"]));
////                });
//            });
//            action(windows);
//        });
//        return;
            state.titles = ["Main", "Wikipedia", "Mozilla", "YouTube"];
            action([
                Window({}, [{
                    favIconUrl: "http://wordsmith.org/favicon.ico",
                    title: "pleiad_large.jpg (800\u00d7577)",
                    url: "http://wordsmith.org/words/images/pleiad_large.jpg"
                }, {
                    favIconUrl: "https://mail.google.com/mail/images/favicon.ico",
                    title: "Gmail - Inbox (4) - pcxunlimited@gmail.com",
                    url: "https://mail.google.com/mail/?shva=1#inbox"
                }, {
                    favIconUrl: "http://images10.newegg.com/WebResource/Themes/2005/Nest/Newegg.ico",
                    title: "Newegg.com - Computer Parts, PC Components, Laptop Computers, LED LCD TV, Digital Cameras and more!",
                    url: "http://www.newegg.com/"
                }, {
                    favIconUrl: "http://www.gstatic.com/codesite/ph/images/phosting.ico",
                    title: "Issues - tab-organizer - Project Hosting on Google Code",
                    url: "http://code.google.com/p/tab-organizer/issues/list"
                }, {
                    favIconUrl: "https://chrome.google.com/extensions/images/chrome-16.png",
                    title: "Tab Organizer - Google Chrome extension gallery",
                    url: "https://chrome.google.com/extensions/detail/gbaokejhnafeofbniplkljehipcekkbh"
                }, {
                    favIconUrl: "https://chrome.google.com/extensions/images/chrome-16.png",
                    title: "tabWheeler - Google Chrome extension gallery",
                    url: "https://chrome.google.com/extensions/detail/dhnmobobhmhfglpooaceblmodafejbfc"
                }, {
                    favIconUrl: "http://www.codinghorror.com/favicon.ico",
                    title: "Coding Horror: How To Achieve Ultimate Blog Success In One Easy Step",
                    url: "http://www.codinghorror.com/blog/2007/10/how-to-achieve-ultimate-blog-success-in-one-easy-step.html"
                }, {
                    favIconUrl: "http://sstatic.net/stackoverflow/img/favicon.ico",
                    title: "Changing website favicon dynamically - Stack Overflow",
                    url: "http://stackoverflow.com/questions/260857/changing-website-favicon-dynamically",
                    selected: true
                }, {
                    favIconUrl: "http://sstatic.net/so/favicon.ico",
                    title: "Careers - Stack Overflow",
                    url: "http://careers.stackoverflow.com/"
                }, {
                    favIconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAKUlEQVQ4jWNkYGD4z0ABYKJE86gBUAP+UxQHVPEC4wC7gJFhNCUOvAEA2ocEHFKUJVUAAAAASUVORK5CYII=",
                    title: "DEFENDER of the favicon | Mathieu 'p01' Henri | July 2008",
                    url: "http://www.p01.org/releases/DEFENDER_of_the_favicon/"
                }, {
                    favIconUrl: "http://store.steampowered.com/favicon.ico",
                    title: "Recettear: An Item Shop's Tale on Steam",
                    url: "http://store.steampowered.com/app/70400"
                }, {
                    favIconUrl: "http://www.minecraft.net/favicon.png",
                    title: "Minecraft",
                    url: "http://www.minecraft.net/"
                }, {
                    favIconUrl: "http://studioeres.com/immortal/files/gespaa_favicon.ico",
                    title: "| Is there anything you'd give up everything to defend?",
                    url: "http://studioeres.com/immortal/"
                }, {
                    favIconUrl: "http://forum.mobrulestudios.com/favicon.ico",
                    title: "Drop Shock :: View topic - TinyWarz 3D!",
                    url: "http://forum.mobrulestudios.com/viewtopic.php?p=122289#122289"
                }, {
                    favIconUrl: "http://paulirish.com/favicon.ico",
                    title: "My harmonious background canvas \u00ab Paul Irish",
                    url: "http://paulirish.com/2010/my-harmonious-background-canvas/"
                }, {
                    favIconUrl: "http://www.tdv.com/favicon.ico",
                    title: "Douglas Adams",
                    url: "http://www.tdv.com/html/douglas_a.html"
                }, {
                    title: "The Future of the Internet\u2014And How to Stop It \u00bb Chapter 3: Cybersecurity and the Generative Dilemma",
                    url: "http://yupnet.org/zittrain/archives/11#65"
                }]),
                Window({}, [{
                    favIconUrl: "http://en.wikipedia.org/favicon.ico",
                    title: "Option key - Wikipedia, the free encyclopedia",
                    url: "http://en.wikipedia.org/wiki/Option_key"
                }, {
                    favIconUrl: "http://en.wikipedia.org/favicon.ico",
                    title: "Clothespin - Wikipedia, the free encyclopedia",
                    url: "http://en.wikipedia.org/wiki/Clothespin"
                }, {
                    favIconUrl: "http://en.wikipedia.org/favicon.ico",
                    title: "Free energy suppression - Wikipedia, the free encyclopedia",
                    url: "http://en.wikipedia.org/wiki/Free_energy_suppression",
                    selected: true
                }, {
                    favIconUrl: "http://en.wikipedia.org/favicon.ico",
                    title: "Thermodynamic free energy - Wikipedia, the free encyclopedia",
                    url: "http://en.wikipedia.org/wiki/Thermodynamic_free_energy"
                }, {
                    favIconUrl: "http://en.wikipedia.org/favicon.ico",
                    title: "First law of thermodynamics - Wikipedia, the free encyclopedia",
                    url: "http://en.wikipedia.org/wiki/First_law_of_thermodynamics"
                }, {
                    favIconUrl: "http://en.wikipedia.org/favicon.ico",
                    title: "Energy conversion efficiency - Wikipedia, the free encyclopedia",
                    url: "http://en.wikipedia.org/wiki/Energy_conversion_efficiency"
                }, {
                    favIconUrl: "http://en.wikipedia.org/favicon.ico",
                    title: "Carnot heat engine - Wikipedia, the free encyclopedia",
                    url: "http://en.wikipedia.org/wiki/Carnot_heat_engine"
                }, {
                    favIconUrl: "http://en.wikipedia.org/favicon.ico",
                    title: "Cox's timepiece - Wikipedia, the free encyclopedia",
                    url: "http://en.wikipedia.org/wiki/Cox%27s_timepiece"
                }, {
                    favIconUrl: "http://en.wikipedia.org/favicon.ico",
                    title: "Brownian ratchet - Wikipedia, the free encyclopedia",
                    url: "http://en.wikipedia.org/wiki/Brownian_ratchet"
                }, {
                    favIconUrl: "http://en.wikipedia.org/favicon.ico",
                    title: "Cold fusion - Wikipedia, the free encyclopedia",
                    url: "http://en.wikipedia.org/wiki/Cold_fusion"
                }, {
                    favIconUrl: "http://en.wikipedia.org/favicon.ico",
                    title: "Gasoline pill - Wikipedia, the free encyclopedia",
                    url: "http://en.wikipedia.org/wiki/Gasoline_pill"
                }, {
                    favIconUrl: "http://en.wikipedia.org/favicon.ico",
                    title: "History of perpetual motion machines - Wikipedia, the free encyclopedia",
                    url: "http://en.wikipedia.org/wiki/History_of_perpetual_motion_machines"
                }, {
                    favIconUrl: "http://en.wikipedia.org/favicon.ico",
                    title: "Chemical free - Wikipedia, the free encyclopedia",
                    url: "http://en.wikipedia.org/wiki/Chemical_free"
                }, {
                    favIconUrl: "http://en.wikipedia.org/favicon.ico",
                    title: "Hyperlink - Wikipedia, the free encyclopedia",
                    url: "http://en.wikipedia.org/wiki/Hyperlink"
                }, {
                    favIconUrl: "http://en.wikipedia.org/favicon.ico",
                    title: "Hexadecimal - Wikipedia, the free encyclopedia",
                    url: "http://en.wikipedia.org/wiki/Hexadecimal"
                }, {
                    favIconUrl: "http://en.wikipedia.org/favicon.ico",
                    title: "ASCII - Wikipedia, the free encyclopedia",
                    url: "http://en.wikipedia.org/wiki/ASCII"
                }]),
                Window({}, [{
                    title: "Jetpack SDK Documentation",
                    url: "https://jetpack.mozillalabs.com/sdk/0.1/docs/#guide/getting-started"
                }, {
                    favIconUrl: "https://wiki.mozilla.org/favicon.ico",
                    title: "Tabbed Browsing/User Interface Design - MozillaWiki",
                    url: "https://wiki.mozilla.org/Tabbed_Browsing/User_Interface_Design"
                }, {
                    favIconUrl: "https://developer.mozilla.org/skins/mozilla/Fox3/favicon.ico",
                    title: "-moz-box-align - MDC",
                    url: "https://developer.mozilla.org/en/CSS/-moz-box-align"
                }, {
                    favIconUrl: "https://developer.mozilla.org/skins/mozilla/Fox3/favicon.ico",
                    title: "event.eventPhase - MDC",
                    url: "https://developer.mozilla.org/en/DOM/event.eventPhase"
                }, {
                    favIconUrl: "https://developer.mozilla.org/skins/mozilla/Fox3/favicon.ico",
                    title: "window.open - MDC",
                    url: "https://developer.mozilla.org/en/DOM/window.open"
                }, {
                    favIconUrl: "https://developer.mozilla.org/skins/mozilla/Fox3/favicon.ico",
                    title: "window.sizeToContent - MDC",
                    url: "https://developer.mozilla.org/en/DOM/window.sizeToContent"
                }, {
                    favIconUrl: "https://developer.mozilla.org/skins/mozilla/Fox3/favicon.ico",
                    title: "Mozilla CSS Extensions - MDC",
                    url: "https://developer.mozilla.org/en/CSS_Reference/Mozilla_Extensions"
                }, {
                    favIconUrl: "https://developer.mozilla.org/skins/mozilla/Fox3/favicon.ico",
                    title: "display - MDC",
                    url: "https://developer.mozilla.org/en/CSS/display",
                    selected: true
                }, {
                    favIconUrl: "https://developer.mozilla.org/skins/mozilla/Fox3/favicon.ico",
                    title: "Drag Operations - MDC",
                    url: "https://developer.mozilla.org/En/DragDrop/Drag_Operations"
                }, {
                    favIconUrl: "https://developer.mozilla.org/skins/mozilla/Fox3/favicon.ico",
                    title: "DataTransfer - MDC",
                    url: "https://developer.mozilla.org/en/DragDrop/DataTransfer"
                }, {
                    favIconUrl: "https://developer.mozilla.org/skins/mozilla/Fox3/favicon.ico",
                    title: "Drag and drop - MDC",
                    url: "https://developer.mozilla.org/En/DragDrop/Drag_and_Drop"
                }, {
                    favIconUrl: "https://developer.mozilla.org/skins/mozilla/Fox3/favicon.ico",
                    title: "Migrate apps from Internet Explorer to Mozilla - MDC",
                    url: "https://developer.mozilla.org/en/Migrate_apps_from_Internet_Explorer_to_Mozilla"
                }, {
                    favIconUrl: "https://developer.mozilla.org/skins/mozilla/Fox3/favicon.ico",
                    title: "document.elementFromPoint - MDC",
                    url: "https://developer.mozilla.org/En/DOM:document.elementFromPoint"
                }, {
                    favIconUrl: "https://developer.mozilla.org/skins/mozilla/Fox3/favicon.ico",
                    title: "Using Firefox 1.5 caching - MDC",
                    url: "https://developer.mozilla.org/en/Using_Firefox_1.5_caching"
                }, {
                    favIconUrl: "http://www.w3.org/favicon.ico",
                    title: "4.8.6 The video element \u2014 HTML5",
                    url: "http://www.w3.org/TR/html5/video.html"
                }, {
                    favIconUrl: "http://www.w3.org/favicon.ico",
                    title: "CSS: text shadows",
                    url: "http://www.w3.org/Style/Examples/007/text-shadow"
                }, {
                    title: "Forms in HTML documents",
                    url: "http://www.w3.org/TR/html401/interact/forms.html"
                }]),
                Window({ focused: true }, [{
                    favIconUrl: "http://s.ytimg.com/yt/favicon-vflZlzSbU.ico",
                    title: "Evolution of Video Games Epic Medley (Music from 22 video games) Made on Mario Paint Composer",
                    url: "http://www.youtube.com/watch?v=AbO1YtoUqM8"
                }, {
                    favIconUrl: "http://s.ytimg.com/yt/favicon-vflZlzSbU.ico",
                    title: "Best VGM 64 - Zelda : Twilight Princess - Faron Woods",
                    url: "http://www.youtube.com/watch?v=xhzySCD19Ss"
                }, {
                    favIconUrl: "http://s.ytimg.com/yt/favicon-vflZlzSbU.ico",
                    title: "Best VGM 425 - Zelda: A Link to the Past - Hyrule Castle",
                    url: "http://www.youtube.com/watch?v=CADHl-iZ_Kw"
                }, {
                    favIconUrl: "http://s.ytimg.com/yt/favicon-vflZlzSbU.ico",
                    title: "Best VGM 23 - 7th Saga - Town Theme",
                    url: "http://www.youtube.com/watch?v=xdQDETzViic"
                }, {
                    favIconUrl: "http://s.ytimg.com/yt/favicon-vflZlzSbU.ico",
                    title: "Best VGM 277 - Final Fantasy V - Decisive Battle (Exdeath)",
                    url: "http://www.youtube.com/watch?v=mASkgOcUdOQ"
                }, {
                    favIconUrl: "http://s.ytimg.com/yt/favicon-vflZlzSbU.ico",
                    title: "Best VGM 127 - Final Fantasy V - Battle with Gilgamesh (Clash on the Big Bridge)",
                    url: "http://www.youtube.com/watch?v=6CMTXyExkeI"
                }, {
                    favIconUrl: "http://s.ytimg.com/yt/favicon-vflZlzSbU.ico",
                    title: "Best VGM 121 - Metroid - Kraid's Lair",
                    url: "http://www.youtube.com/watch?v=_wHwJoxw4i4"
                }, {
                    favIconUrl: "http://s.ytimg.com/yt/favicon-vflZlzSbU.ico",
                    title: "Best VGM 70 - Terranigma - Crysta",
                    url: "http://www.youtube.com/watch?v=QR5xn8fA76Y"
                }, {
                    favIconUrl: "http://s.ytimg.com/yt/favicon-vflZlzSbU.ico",
                    title: "Best VGM 192 - Final Fantasy IV - The Final Battle",
                    url: "http://www.youtube.com/watch?v=4Jzh0BThaaU"
                }, {
                    favIconUrl: "http://s.ytimg.com/yt/favicon-vflZlzSbU.ico",
                    title: "Best VGM 398 - Sonic the Hedgehog - Marble Zone",
                    url: "http://www.youtube.com/watch?v=qmvx5zT88ww"
                }, {
                    favIconUrl: "http://s.ytimg.com/yt/favicon-vflZlzSbU.ico",
                    title: "Best VGM 541 - Portal - Still Alive",
                    url: "http://www.youtube.com/watch?v=aqWw9gLgFRA"
                }, {
                    favIconUrl: "http://s.ytimg.com/yt/favicon-vflZlzSbU.ico",
                    title: "Best VGM 380 - Donkey Kong Country - Life in the Mines",
                    url: "http://www.youtube.com/watch?v=mvcctOvLAh4",
                    selected: true
                }, {
                    favIconUrl: "http://s.ytimg.com/yt/favicon-vflZlzSbU.ico",
                    title: "Best VGM 414 - E.V.O: Search for Eden - The Ocean",
                    url: "http://www.youtube.com/watch?v=EeXlQNJnjj0"
                }, {
                    favIconUrl: "http://s.ytimg.com/yt/favicon-vflZlzSbU.ico",
                    title: "Best VGM 304 - Sonic the Hedgehog 3 - Hydrocity Zone Act 2",
                    url: "http://www.youtube.com/watch?v=KrvdivSD98k"
                }, {
                    favIconUrl: "http://s.ytimg.com/yt/favicon-vflZlzSbU.ico",
                    title: "Best VGM 186 - Super Mario Land 2 - Star Maze",
                    url: "http://www.youtube.com/watch?v=EmD9WnLYR5I"
                }])
            ]);
        }, 0);
    };
}());
