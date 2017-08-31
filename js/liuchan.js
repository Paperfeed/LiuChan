/*

	LiuChan - A port of Rikaikun to Chinese
	By Aldert Vaandering (2017)
	https://gitlab.com/paperfeed/liuchan
	
	---

	Originally based on Rikaichan 1.07
	by Jonathan Zarate
	http://www.polarcloud.com/

	---

	Originally based on RikaiXUL 0.4 by Todd Rudick
	http://www.rikai.com/
	http://rikaixul.mozdev.org/

	---

	This program is free software; you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation; either version 2 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program; if not, write to the Free Software
	Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

	---

	Please do not change or remove any of the copyrights or links to web pages
	when modifying any of the files. - Jon

*/


var lcxMain = {
	dictCount: 1,
	altView: 0,
	enabled: 0,

	// The callback for onSelectionChanged
	// Just sends a message to the tab to enable itself if it hasn't
	// already
	onTabSelect: function(tab) {
		console.log("lcxMain.onTabSelect" + tab);

		if (this.enabled) {
			chrome.tab.sendMessage(tab.tabId, {
				"type":"enable"
			});
		}
	},

	_onTabSelect: function(tabId) {
		if ((this.enabled === 1))
			chrome.runtime.sendMessage(tabId, {
				"type":"enable"
			});
	},

	savePrep: function(clip, entry) {
		var me, mk;
		var text;
		var i, f, e;

		f = entry;
		if ((!f) || (f.length === 0)) return null;

		if (clip) { // Save to clipboard
			me = localStorage["maxClipCopyEntries"];
		}

		if (!this.fromLB) mk = 1;

		text = '';
		for (i = 0; i < f.length; ++i) {
			e = f[i];
			if (e.kanji) {
				text += this.dict.makeText(e, 1);
			} else {
				if (me <= 0) continue;
				text += this.dict.makeText(e, me);
				me -= e.data.length;
			}
		}

		switch (localStorage["lineEnding"]) {
			case "rn":
                text = text.replace(/\n/g, '\r\n');
                break;
			case "r":
                text = text.replace(/\n/g, '\r');
                break;
		}

		switch (localStorage["copySeparator"]) {
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

		if ((text = this.savePrep(1, entry)) !== null) {
			document.oncopy = function(event) {
				event.clipboardData.setData("Text", text);
				event.preventDefault();
			};
			document.execCommand("Copy");
			document.oncopy = undefined;
			chrome.tabs.sendMessage(tab.id, {
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
		

	// Function which enables the inline mode of rikaikun
	// Unlike rikaichan there is no lookup bar so this is the only enable.
	inlineEnable: function(tab) {
		if (!this.dict) {
			try {
				this.dict = new lcxDict();
			}
			catch (ex) {
				alert('Error loading dictionary: ' + ex);
			}
		}
		
		this.dict.loadDictionary().then(this.onDictionaryLoaded.bind(this, tab), this.onError.bind(this));
	},

	onDictionaryLoaded: function(tab) {
		console.log("lcxMain.onDictionaryLoaded " + tab);
		// Send message to current tab to add listeners and create stuff
		chrome.tabs.sendMessage(tab.id, {
			"type":"enable"
		});
		this.enabled = 1;

		if (localStorage['miniHelp'] === 'true') {
            // DEPRECATED
            //chrome.tabs.sendRequest(tab.id, {
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
		chrome.browserAction.setBadgeBackgroundColor({
			"color": [255, 0, 0, 255]
		});
		chrome.browserAction.setBadgeText({
			"text": "On"
		});
	},

	onError: function() {
		chrome.browserAction.setBadgeBackgroundColor({
			"color": [0, 0, 0, 255]
		});
		chrome.browserAction.setBadgeText({
			"text": "Err"
		});
	},

	// This function disables the plugin
	inlineDisable: function(tab) {
		// Delete dictionary object after we implement it
		delete this.dict;
		
		this.enabled = 0;

		chrome.browserAction.setIcon({
			"path":"../images/toolbar-disabled.png"
		});
		chrome.browserAction.setBadgeBackgroundColor({
			"color": [0, 0, 0, 0]
		});
		chrome.browserAction.setBadgeText({
			"text": ""
		});

		// Send a disable message to all browsers
		//chrome.runtime.sendMessage(undefined, {"type":"disable"})
		var windows = chrome.windows.getAll({
			"populate":true
			}, 
			function(windows) {
				for (var i =0; i < windows.length; ++i) {
					var tabs = windows[i].tabs;
					for ( var j = 0; j < tabs.length; ++j) {
						chrome.tabs.sendMessage(tabs[j].id, {
							"type":"disable"
						});
					}
				}
			});
	},

	inlineToggle: function(tab) {
		// Entry point for when extension's button is clicked
		if (lcxMain.enabled) {
            lcxMain.inlineDisable(tab, 1);
        } else {
            lcxMain.inlineEnable(tab, 1);
        }
	},
	
	search: function(text) {
		//leaving this shit in here for the future if i wanna do a hanzi dict
		var showMode = 0;
		var m = showMode;
		var e = null;


		// todo wtf is going on here? probably not necessary
		do {
			switch (showMode) {
			case 0:
				e = this.dict.wordSearch(text);
				break;
			//case this.hanziN:
				//e = this.dict.kanjiSearch(text.charAt(0));
//				break;
			}
			if (e) break;
			showMode = (showMode + 1) % this.dictCount;
		} while (showMode !== m);
		
		return e;
	}
};