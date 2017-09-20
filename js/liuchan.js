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
            content: {
                popupColor: 'liuchan',
                popupDelay: 0,
                highlight: true,
                textboxhl: false,
                showOnKey: "",
                disableKeys: false
            },
            showHanzi: 'boths',
            pinyin: 'tonemarks',
            numdef: 'num',
            doColors: true,
            doPinyinColors: false,
            miniHelp: true,
            lineEnding: 'n',
            copySeparator: 'tab',
            maxClipCopyEntries: 7,
            ttsDialect: "zh-CN",
            ttsSpeed: 0.9,
            useCustomTone: false,
            customTones: ['#F2777A','#99CC99','#6699CC','#CC99CC','#CCCCCC', '#66CCCC']
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
            chrome.omnibox.onInputChanged.removeListener(lcxMain.omnibox);

            // Clean up memory
            lcxMain.enabled = false;
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
            chrome.omnibox.onInputChanged.addListener(lcxMain.omnibox);
            // chrome.omnibox.onInputEntered.addListener(function(text) { //Do sth on enter });

            lcxMain.dict.loadDictionary(tab);
            lcxMain.enabled = true;

            // Update config on active tab and then show help popup if necessary
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {type: "config", config:lcxMain.config.content}, function(response) {
                    if (lcxMain.config.miniHelp === true && !lcxMain.config.content.disableKeys) {
                        chrome.tabs.sendMessage(tab.id, {
                            "type": "showPopup",
                            "text": lcxMain.miniHelp
                        })
                    }
                });
            });

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
				"config":lcxMain.config.content
			});
		}
	},

	sendAllTabs: function(message) {
        return chrome.tabs.query({}, function (tabs) {
            for (var i = 0; i < tabs.length; ++i) {
                chrome.tabs.sendMessage(tabs[i].id, message);
            }
        });
	},

	copyToClip: function(tab, entry) {
        if (entry.length === 0) return null;

        var text = '', sep, end;

        switch (lcxMain.config.copySeparator) {
            case "tab": sep = '\t'; break;
            default: sep = lcxMain.config.copySeparator;}

        switch (lcxMain.config.lineEnding) {
            case "r": end = "\r"; break;
            case "rn": end = "\r\n"; break;
            default: end = "\n";}

        const pinyinType = lcxMain.config.pinyin;
	    var maxLoops = Math.min(lcxMain.config.maxClipCopyEntries, entry[0].data.length);
	    for (var i = 0; i < maxLoops; i++) {
	        text += entry[0].data[i].simp + sep +
                entry[0].data[i].trad + sep +
                entry[0].data[i].pinyin[pinyinType] + sep +
                entry[0].data[i].def.join("; ") + end;
                //lcxMain.dict.parseDefinitions(entry[0].data[i].def).replace(/<\/?b>/g, "") + end;
        }

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
	},

	miniHelp: '<div class="liutitle">LiuChan enabled!</div>' +
		'<table cellspacing=5>' +
		'<tr><td>A</td><td>Alternate popup location</td></tr>' +
		'<tr><td>Y</td><td>Move popup down</td></tr>' +
		'<tr><td>C</td><td>Copy to clipboard</td></tr>' +
		'<tr><td>D</td><td>Hide/show definitions</td></tr>' +
		'<tr><td>B</td><td>Previous character</td></tr>' +
		'<tr><td>M</td><td>Next character</td></tr>' +
		'<tr><td>N</td><td>Next word</td></tr>' +
		'<tr><td>T</td><td>&#x1F508;Text-To-Speech</td></tr>' +
		'</table>',

	onDictionaryLoaded: function(tab) {
	    // Activate tab and send along content script related settings
        if (tab) chrome.tabs.sendMessage(tab.id, {"type":"enable", "config": lcxMain.config.content});
	},

    // Prevent code from running while user is still typing
    timeout: 0,
    omnibox: function(text, suggest) {
	    clearTimeout(lcxMain.timeout);
        lcxMain.timeout = setTimeout(lcxMain._omnibox, 400, text, suggest);
    },
	_omnibox: function(text, suggest) {
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