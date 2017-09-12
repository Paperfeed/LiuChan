'use strict';

/*

	LiuChan - Originally based on Rikaikun
	By Aldert Vaandering
	https://paperfeed.github.io/liuchan

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
	enabled: false,
	config: {},

	initConfig: function() {
        chrome.storage.sync.get({
            popupColor: 'liuchan',
            showHanzi: 'boths',
            pinyin: 'tonemarks',
            numdef: 'num',
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

            // Tell all tabs to disable themselves
            lcxMain.sendAllTabs({"type":"disable"});

            // Disable Omnibox wordsearch
            chrome.omnibox.onInputChanged.removeListener(lcxMain._omnibox);

            // Clean up memory
            lcxMain.enabled = false;
            delete lcxMain.dict.fuse;
            delete lcxMain.dict;

            // Set extension icon
            chrome.browserAction.setIcon({
                "path":"../images/toolbar-disabled.png"
            });
            chrome.browserAction.setBadgeBackgroundColor({
                "color": [0, 0, 0, 0]
            });
            chrome.browserAction.setBadgeText({
                "text": ""
            });
        } else {
        	// Enable extension
            if (!lcxMain.dict) {
                try {
                    lcxMain.dict = new lcxDict();
				} catch (ex) {
                    alert('Error loading dictionary: ' + ex);
                }
            }

            // Enable Omnibox Wordsearch
            chrome.omnibox.onInputChanged.addListener(lcxMain._omnibox);
            // chrome.omnibox.onInputEntered.addListener(function(text) { //Do sth on enter });

            lcxMain.dict.loadDictionary(tab);
            lcxMain.enabled = true;

            if (lcxMain.config.miniHelp === true) {
                chrome.tabs.sendMessage(tab.id, {
                    "type": "showPopup",
                    "text": lcxMain.miniHelp
                });
            }

            chrome.browserAction.setIcon({
                "path":"../images/toolbar-enabled.png"
            });
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
		var me, text = '';
		var i, f, e;

		f = entry;
		if ((!f) || (f.length === 0)) return null;

		if (clip) { // Save to clipboard
			me = lcxMain.config.maxClipCopyEntries;
		}

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

	miniHelp: '<div class="title">LiuChan enabled!</div>' +
		'<table cellspacing=5>' +
		'<tr><td>A</td><td>Alternate popup location</td></tr>' +
		'<tr><td>Y</td><td>Move popup down</td></tr>' +
		'<tr><td>C</td><td>Copy to clipboard</td></tr>' +
		'<tr><td>D</td><td>Hide/show definitions</td></tr>' +
		'<tr><td>B</td><td>Previous character</td></tr>' +
		'<tr><td>M</td><td>Next character</td></tr>' +
		'<tr><td>N</td><td>Next word</td></tr>' +
		'</table>',

	onDictionaryLoaded: function(tab) {
        // todo could just change this to only enable active tab as it will
        // already activate other tabs automatically on tab-change
		chrome.tabs.sendMessage(tab.id, {"type":"enable", "config": lcxMain.config});

		// Send message to all tabs to add listeners
		// It also passes along the extension's settings
		//lcxMain.sendAllTabs({"type":"enable", "config": lcxMain.config});
	},

    // Prevent code from running while user is still typing
    timeout: 0,
    _omnibox: function(text, suggest) {
	    clearTimeout(lcxMain.timeout);
        lcxMain.timeout = setTimeout(lcxMain.omnibox, 400, text, suggest);
    },

	omnibox: function(text, suggest) {
	    console.log("running");
		// todo for now just enable extension - will redo this later
		if (lcxMain.dict === undefined) {
            lcxMain.toggleExtension(null);
        }

        fuzzysort.highlightMatches = true;
        fuzzysort.highlightOpen = '<match>';
        fuzzysort.highlightClose = '</match>';
        //fuzzysort.threshold = null;
        //fuzzysort.limit = null;

        // Check if user input is hanzi or plain english
		const reg = /[\u4e00-\u9fa5].*/u;
		const isHanzi = reg.test(text);
		if (isHanzi) {
			if (/simp|boths/.test(lcxMain.config.showHanzi)) {
				// Search only simplified characters

			} else {
				// Search only trad characters

            }
		}

        var results = [], tradScore, simpScore, pinyinScore, defScore, str = '';
        const dict = lcxMain.dict.hanzi;
        const dictLength = lcxMain.dict.hanzi.length;
        const pinyinType = lcxMain.config.pinyin;
        for(var i = 0; i < dictLength; i++) {
        	if (isHanzi) {
                tradScore = fuzzysort.single(text, dict[i].trad);
                simpScore = fuzzysort.single(text, dict[i].simp);
            } else {
                pinyinScore = fuzzysort.single(text, dict[i].pinyin.tonemarks); // TODO make this based on user pref

                if (dict[i].def.length > 1 && (lcxMain.config.numdef === "num")) {
                    for (var a = 0; a < dict[i].def.length; a++) {
                        str += (a+1) + ' ' + dict[i].def[a] + '  ';
                    }
                    str.trim();
                } else {
                    str = dict[i].def.join(lcxMain.config.numdef);
                }
                defScore = fuzzysort.single(text, str);
                str = '';
            }

            // Create a custom combined score to sort by. +100 to the score makes it a worse match
            var score = Math.min(tradScore?tradScore.score:1000,
				simpScore?simpScore.score:1000,
				pinyinScore?pinyinScore.score:1000,
				defScore?defScore.score:1000);
            if(score >= 1000) continue;

            results.push({
                item: dict[i],
                score: score,
                tradHightlighted: tradScore ? tradScore.highlighted : dict[i].trad,
                simpHighlighted: simpScore ? simpScore.highlighted : dict[i].simp,
                pinyinHighlighted: pinyinScore ? pinyinScore.highlighted : dict[i].pinyin.tonemarks,
                defHighlighted: defScore ? defScore.highlighted : dict[i].def
            })
        }

        results.sort(function (a, b) { return a.score - b.score });
        if (undefined === results) return;

        var array = [];
        for (i = 0; i < results.length; i++) {
        	// Hanzi
            var entry = '<url>';

            // If csimplified and traditional are the same then just display one
            if (results[i].item.trad === results[i].item.simp) {
                entry += results[i].item.trad + " ";
            } else {
                // Fallthrough on purpose:
                switch (lcxMain.config.showHanzi) {
                    case "botht": entry += results[i].tradHightlighted + " ";
                    case "simp": entry += results[i].simpHighlighted;
                        break;
                    case "boths": entry += results[i].simpHighlighted + " ";
                    case "trad": entry += results[i].tradHightlighted;
                        break;
                }
            }

			entry += "</url><dim>";

            // TODO make other pinyin types hightlighted as well
			// Pinyin
			switch (lcxMain.config.pinyin) {
				case "tonemarks": entry += " " + results[i].pinyinHighlighted; break;
				case "tonenums": entry += " " + results[i].item.pinyin.tonenums; break;
				case "zhuyin": entry += " " + results[i].item.pinyin.zhuyin; break;
			}

            // TODO make content: trad or simp based on user pref
			// Definition
			entry += '</dim> ' + results[i].defHighlighted;
        	array.push({content: results[i].item.simp, description: entry});

			// Limit to 10 results
			if (i == 9) { break; }
		}

		/*
		// Can use popup to show results instead
        chrome.tabs.query({ active:true, windowType:"normal", currentWindow: true },
			function(tab){
                chrome.tabs.sendMessage(tab[0].id, {
                    "type": "showPopup",
                    "text": array.toString();
                });
        	});
        */

		suggest(array);
	}
};