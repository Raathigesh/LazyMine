/*global require, localStorage, screen*/
var gui = require('nw.gui'); // Load native UI library


(function () {
    "use strict";
    var win = gui.Window.get(), // Get the current window
        windowKey = "window",
        windowConf = {
            width: screen.availWidth / 2,
            height: screen.availHeight,
            x: screen.availWidth / 2,
            y: 0
        },
        confStr = localStorage.getItem(windowKey),
        startInTray = false;

    // Initialize the Screen object
    gui.Screen.Init();

    if (confStr) {
        windowConf = JSON.parse(confStr);
    }

    if (windowConf.width > screen.availWidth ||
        windowConf.height > screen.availHeight ||
        windowConf.x > screen.availWidth ||
        windowConf.y > screen.availHeight) {

        windowConf = {
            width: screen.availWidth / 2,
            height: screen.availHeight,
            x: screen.availWidth / 2,
            y: 0
        };
    }

    win.width = windowConf.width;
    win.height = windowConf.height;
    win.x = windowConf.x;
    win.y = windowConf.y;

    localStorage.setItem(windowKey, JSON.stringify(windowConf));

    for (var i = 0; i < gui.App.argv.length; i++) {
        if (gui.App.argv[i] == '--tray') {
            startInTray = true;
        }
    }

    if (!startInTray) {
        win.show();
    }

    var nativeMenuBar = new gui.Menu({
        type: "menubar"
    });
    try {
        nativeMenuBar.createMacBuiltin("Lazymine");
        win.menu = nativeMenuBar;
    } catch (ex) {
        console.log(ex.message);
    }

    win.on('close', function () {
        localStorage.setItem(windowKey, JSON.stringify({
            width: win.width,
            height: win.height,
            x: win.x,
            y: win.y
        }));

        this.hide();
    });

    var resetWindow = function (screen) {
        if (win.width > screen.availWidth ||
            win.height > screen.availHeight ||
            win.x > screen.availWidth ||
            win.y > screen.availHeight) {

            win.width = screen.availWidth / 2;
            win.height = screen.availHeight;
            win.x = screen.availWidth / 2;
            win.y = 0;
        }
    };

    gui.Screen.on('displayBoundsChanged', resetWindow);

    gui.Screen.on('displayRemoved', resetWindow);
}());

var minimizeWindow = function () {
    "use strict";
    var win = gui.Window.get(),
        windowKey = "window";

    localStorage.setItem(windowKey, JSON.stringify({
        width: win.width,
        height: win.height,
        x: win.x,
        y: win.y
    }));

    win.minimize();
};

var closeWindow = function () {
    "use strict";
    var win = gui.Window.get(),
        windowKey = "window";

    localStorage.setItem(windowKey, JSON.stringify({
        width: win.width,
        height: win.height,
        x: win.x,
        y: win.y
    }));

    win.hide();
};

var openExternalUrl = function (url) {
    "use strict";
    gui.Shell.openExternal(url);
};


var quitWindow = function () {
	"use strict";
	 gui.App.quit();
};


var getUpdateArguments = function(){
	"use strict";
	 if(gui.App.argv.length)
	 {
		copyPath = gui.App.argv[0];
		execPath = gui.App.argv[1];
		return 	{ 	
					'copyPath'	: copyPath,
					'execPath'	: execPath	
				};
	}
};


