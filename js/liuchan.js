var lcxMain = {
	dictCount: 1,
	altView: 0,
	enabled: false,
	config: {},

	initConfig: function() {
        chrome.storage.sync.get({
            popupColor: 'charcoal',
            showHanzi: 'boths',
            pinyin: 'tonemarks',
            popupDelay: 1,
            highlight: true,
            textboxhl: false,
            doColors: true,
            miniHelp: true,
            disableKeys: true,
            lineEnding: 'n',
            copySeparator: 'tab',
            maxClipCopyEntries: 7,
            showOnKey: ""
        }, function (items) {
            lcxMain.config = items;
		});
	},

    toggleExtension: function(tab) {
        // Entry point for when extension's button is clicked
        // Toggle addon on or off
        if (lcxMain.enabled) {
            // Disable extension
            delete lcxMain.dict;
            lcxMain.enabled = false;

            chrome.browserAction.setIcon({
                "path":"../images/toolbar-disabled.png"
            });
            chrome.browserAction.setBadgeBackgroundColor({
                "color": [0, 0, 0, 0]
            });
            chrome.browserAction.setBadgeText({
                "text": ""
            });

            // Tell all tabs to disable themselves
			lcxMain.sendAllTabs({"type":"disable"});
        } else {
        	// Enable extension
            if (!lcxMain.dict) {
                try {
                    lcxMain.dict = new lcxDict();
				} catch (ex) {
                    alert('Error loading dictionary: ' + ex);
                }

            }
            lcxMain.dict.loadDictionary().then(
            	lcxMain.onDictionaryLoaded.bind(lcxMain, tab), lcxMain.onError.bind(lcxMain)
			);
        }
    },

	// The callback for chrome.tabs.onActivated
	// Sends a message to the tab to enable itself if it hasn't
	onTabSelect: function(tab) {
		// tab contains tabId windowId
		if (undefined === tab.tabId) {
			tab.tabId = tab.id;
		}

		if (lcxMain.enabled) {
			chrome.tabs.sendMessage(tab.tabId, {
				"type":"enable",
				"config":lcxMain.config
			});
		}
	},

	sendAllTabs: function(message) {
        chrome.tabs.query({}, function(tabs) {
            for (var i = 0; i < tabs.length; ++i) {
                chrome.tabs.sendMessage(tabs[i].id, message);
            }
        });
	},

	savePrep: function(clip, entry) {
		var me, mk;
		var text;
		var i, f, e;

		f = entry;
		if ((!f) || (f.length === 0)) return null;

		if (clip) { // Save to clipboard
			me = lcxMain.config.maxClipCopyEntries;
		}

		if (!this.fromLB) mk = 1;

		text = '';
		for (i = 0; i < f.length; ++i) {
			e = f[i];
			if (e.kanji) {
				text += lcxMain.dict.makeText(e, 1);
			} else {
				if (me <= 0) continue;
				text += lcxMain.dict.makeText(e, me);
				me -= e.data.length;
			}
		}

		switch (lcxMain.config.lineEnding) {
			case "rn":
                text = text.replace(/\n/g, '\r\n');
                break;
			case "r":
                text = text.replace(/\n/g, '\r');
                break;
		}

		switch (lcxMain.config.copySeparator) {
			case "comma":
                return text.replace(/\t/g, ",");
                break;
			case "space":
                return text.replace(/\t/g, " ");
                break;
			default:
				return text;
		}
	},

	// Needs entirely new implementation and dependent on savePrep
	copyToClip: function(tab, entry) {
		var text;

		if ((text = lcxMain.savePrep(1, entry)) !== null) {
			document.oncopy = function(event) {
				event.clipboardData.setData("Text", text);
				event.preventDefault();
			};
			document.execCommand("Copy");
			document.oncopy = undefined;
			chrome.tabs.sendMessage(tab.tabId, {
				"type": "showPopup",
				"text": 'Copied to clipboard.'
			});
		}
	},

	miniHelp: '<span style="font-weight:bold">LiuChan enabled!</span><br><br>' +
		'<table cellspacing=5>' +
		'<tr><td>A</td><td>Alternate popup location</td></tr>' +
		'<tr><td>Y</td><td>Move popup location down</td></tr>' +
		'<tr><td>C</td><td>Copy to clipboard</td></tr>' +
		'<tr><td>D</td><td>Hide/show definitions</td></tr>' +
		'<tr><td>B</td><td>Previous character</td></tr>' +
		'<tr><td>M</td><td>Next character</td></tr>' +
		'<tr><td>N</td><td>Next word</td></tr>' +
		'<tr><td colspan="2">&nbsp;</td></tr>' +
		'</table>',

	onDictionaryLoaded: function(tab) {
		// Send message to current tab to add listeners and create stuff
		// It also passes along the extension's settings
		lcxMain.sendAllTabs({"type":"enable", "config": lcxMain.config});

		// All loading has succeeded, set enabled to true,
		// change badge and show popup in active tab
		lcxMain.enabled = true;

		if (lcxMain.config.miniHelp === true) {
            chrome.tabs.sendMessage(tab.id, {
                "type": "showPopup",
                "text": lcxMain.miniHelp
            });
        } else {
            chrome.tabs.sendMessage(tab.id, {
                "type": "showPopup",
                "text": 'LiuChan enabled!'
            });
        }
		
		chrome.browserAction.setIcon({
			"path":"../images/toolbar-enabled.png"
		});

		/*chrome.browserAction.setBadgeBackgroundColor({
			"color": [255, 0, 0, 255]
		});
		chrome.browserAction.setBadgeText({
			"text": "On"
		});*/
	},

	onError: function() {
		chrome.browserAction.setBadgeBackgroundColor({
			"color": [0, 0, 0, 255]
		});
		chrome.browserAction.setBadgeText({
			"text": "Err"
		});
	}
};