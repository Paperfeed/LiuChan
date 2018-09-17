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
const CURRENT_VERSION = "1.1.6";

class LiuChan {
    constructor() {
        this.altView = 0;
        this.enabled = false;
        this.config = {};
        this.displayHelp = '<div class="liutitle">LiuChan enabled!</div>' +
            '<table cellspacing=5>' +
            '<tr><td>A</td><td>Alternate popup location</td></tr>' +
            '<tr><td>Y</td><td>Move popup down</td></tr>' +
            '<tr><td>C</td><td>Copy to clipboard</td></tr>' +
            '<tr><td>D</td><td>Hide/show definitions</td></tr>' +
            '<tr><td>B</td><td>Previous character</td></tr>' +
            '<tr><td>M</td><td>Next character</td></tr>' +
            '<tr><td>N</td><td>Next word</td></tr>' +
            '<tr><td>T</td><td>&#x1F508;Text-To-Speech</td></tr>' +
            '</table>';
        //this.timeout = 0;

        this.omnibox = this.omnibox.bind(this);
        this._omnibox = this._omnibox.bind(this);
        this.initConfig();

        // Add contextMenu
        if (chrome.contextMenus) {
            chrome.contextMenus.create({
                title: 'Notepad',
                contexts: ['browser_action'],
                onclick: () => {
                    chrome.tabs.query({active:true, currentWindow:true}, (tab) => {
                        chrome.tabs.sendMessage(tab[0].id, {"type":"notepad", "theme":this.config.content.popupTheme});
                    });
                }
            });            
        }


        // Set extension icon
        if (chrome.browserAction && chrome.browserAction.setIcon) {
            chrome.browserAction.setIcon({
                "path":"../images/toolbar-disabled.png"
            });
        }
    }

    initConfig() {
        const defaultConfig = {
            content: {
                popupTheme: 'liuchan',
                popupDelay: 0,
                highlightText: true,
                highlightInput: false,
                scaleOnZoom: true,
                showOnKey: 0,
                disableKeys: false
            },
            styling: {
                useCustomization: false,
                customColors: ["#ffffe0", "#d7d3af", "RGBA(0,8,8,0.1)"],
                borderThickness: 2,
                borderRadius: 8
            },
            notepad: {
                text: 'This notepad will automatically save its contents and sync with your Chrome account ' +
                    '(if you use sync!).\n\n' +
                    'You can drag the notepad around and resize the text area.',
                pinned: false
            },
	    langType: 'bothl',
	    pingjamType: 'jyutping',
            hanziType: 'boths',
            pinyinType: 'tonemarks',
            definitionSeparator: 'num',
            useHanziToneColors: 'mando',
            usePinyinToneColors: false,
	    usePingjamToneColors: false,
            displayHelp: true,
            lineEnding: 'n',
            copySeparator: 'tab',
            maxClipCopyEntries: "7",
            ttsDialect: "zh-CN",
            ttsSpeed: 0.9,
            useCustomTones: false,
            customTones: ["#f2777a", "#99cc99", "#6699cc", "#cc99cc", "#cccccc", "#66cccc"],
	    jcustomTones: ["#00BCD4", "#7BB342", "#4E6BEF", "#A5A5A5", "#046F00", "#512DA8", "#A70F4B"],
	    maxEntries: "3",
	    // searchLeadingAscii: false,
            version: CURRENT_VERSION
        };

        chromep.storage.local.get(defaultConfig).then(items => {
            // Ensure users don't lose their customized settings after updated where stuff has been changed around.
            if (items.version !== CURRENT_VERSION) {
                console.log("Liuchan has been updated; Attempting to convert old settings");
                // Get ALL items from storage and compare them to the default config, reassigning old values to
                // new keys where appropriate.
                chrome.storage.local.get(null, oldItems => {
                    items = defaultConfig;
                    for (let key in oldItems) {
                        // if (!items.hasOwnProperty(key)) {console.log(key);} // for DEBUG purposes
                        switch (key) {
                        case "showOnKey":
                            const str = oldItems.showOnKey;
                            if (str === "Ctrl") {
                                items.showOnKey = 1;
                            } else if (str === "Alt") {
                                items.showOnKey = 2;
                            } else if (str === "CtrlAlt") {
                                items.showOnKey = 3;
                            } else {
                                items.showOnKey = 0;
                            }
                            break;
                        case "doColors":
                            items.useHanziToneColors = oldItems.doColors;
                            break;
                        case "doPinyinColors":
                            items.usePinyinToneColors = oldItems.doPinyinColors;
                            break;
                        case "miniHelp":
                            items.displayHelp = oldItems.miniHelp;
                            break;
                        case "numdef":
                            items.definitionSeparator = oldItems.numdef;
                            break;
                        case "pinyin":
                            items.pinyinType = oldItems.pinyin;
                            break;
                        case "showHanzi":
                            items.hanziType = oldItems.showHanzi;
                            break;
                        case "useCustomTone":
                            items.useCustomTones = oldItems.useCustomTone;
                            break;
                        default:
                            if (items.hasOwnProperty(key)) {
                                items[key] = oldItems[key];
                            }
                        }
                        items.version = CURRENT_VERSION;
                        this.config = items;
                    }
                    // Empty storage to get rid of deprecated keys and save the new updated list
                    chrome.storage.local.clear(() => {
                        chrome.storage.local.set(items, () => {
                            console.log("Succesfully converted and saved settings!")
                        });
                    });
                })
            } else {
                // Init any keys that don't exist yet with default values, then assign to LiuChan.config
                const config = Object.assign(defaultConfig, items);
                this.config = config;
                chrome.storage.local.set(config);
            }
        });
    }

    async toggleExtension() {
        // Entry point for when extension's button is clicked
        // Toggle addon on or off
        if (this.enabled) {
            // Disable extension

            // Tell all tabs to disable themselves
            this.sendAllTabs({"type":"disable"});

            // Disable Omnibox wordsearch
            chrome.omnibox.onInputChanged.removeListener(this.omnibox);

            // Clean up memory
            this.enabled = false;
            delete this.dict;

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
            // Check if the content script is actually running and let the user know the tab needs to be reloaded if not.
            const tab = await chromep.tabs.query({ active:true, windowType: 'normal', currentWindow: true });
            try {
                const response = await chromep.tabs.sendMessage(tab[0].id, {type:'heartbeat'});
            } catch(e) {
                chrome.notifications.create({
                    type:'basic', iconUrl:'images/icon128.png',
                    title:'Liuchan - Please reload this tab',
                    message:'Oops! You will need to reload this tab before Liuchan can work its ' +
			'magic! \n\nThis is only necessary on tabs that were open before Liuchan was installed :)'});
            }

            // Enable extension
            if (!this.dict) {
                try {
                    this.dict = new Dictionary(liuChan);
		} catch (ex) {
                    alert('Error loading dictionary: ' + ex);
                }
            }

            // Tell all tabs to enable themselves
            //this.sendAllTabs({"type":"enable"});

            // Enable Omnibox Wordsearch
            chrome.omnibox.onInputChanged.addListener(this.omnibox);
            //chrome.omnibox.onInputEntered.addListener(text => { //Do sth on enter });

            await this.dict.loadDictionary();
            this.enabled = true;

            // Set extension icon
            chrome.browserAction.setIcon({
                "path":"../images/toolbar-enabled.png"
            });
        }
    }

    onWindowChangeFocus(windowId) {
        if (windowId !== -1) {
            chrome.tabs.query({active:true, currentWindow:true}, (tab) => {
                this.onTabSelect(tab[0]);
            })
        }
    }
    
    // The callback for chrome.tabs.onActivated
    // Sends a message to the tab to enable itself if it hasn't
    onTabSelect(tab) {
	if (this.enabled) {
            chrome.tabs.sendMessage(tab.tabId ? tab.tabId : tab.id, {
		"type":"enable",
		"config":this.config.content
	    });
	}
        chrome.tabs.sendMessage(tab.tabId ? tab.tabId : tab.id, {
            "type":"update",
            "notepad":this.config.notepad
        });
    }

    async sendAllTabs(message) {
        // Retrieve all windows and loop through tabs per window to pass message
        const windows = await chromep.windows.getAll({populate:true});

        for (let a = 0, lenA = windows.length; a < lenA; a++) {
	    for (let b = 0, lenB = windows[a].tabs.length; b < lenB; b++) {
                chrome.tabs.sendMessage(windows[a].tabs[b].id, message);
	    }
        }
    }

    copyToClip(tab, entry) {
        if (entry.length === 0) return null;

        let text = '', sep, end;

        switch (this.config.copySeparator) {
        case "tab": sep = '\t'; break;
        default: sep = this.config.copySeparator;
        }

        switch (this.config.lineEnding) {
        case "r": end = "\r"; break;
        case "rn": end = "\r\n"; break;
        default: end = "\n";
        }

        // TODO support custom separator
        const pinyinType = this.config.pinyinType;
	const pingjamType = this.config.pingjamType;
	const maxLoops = Math.min(this.config.maxClipCopyEntries, entry[0].data.length);
	for (let i = 0; i < maxLoops; i++) {
	    text += entry[0].data[i].simp + sep +
                entry[0].data[i].trad + sep +
                entry[0].data[i].pinyin[pinyinType] + sep +
                entry[0].data[i].def.join("; ") + end;
            //this.dict.parseDefinitions(entry[0].data[i].def).replace(/<\/?b>/g, "") + end;
        }

        document.oncopy = function(event) {
            event.clipboardData.setData("Text", text);
            event.preventDefault();
        };

        document.execCommand("Copy");
        document.oncopy = undefined;
        chrome.tabs.sendMessage(tab.id, {
            "type": "showPopup",
            "text": '<div class="def">Copied to clipboard.</div>'
        });
    }

    omnibox(text, suggest) {
        // Timeout to prevent the CPU heavy fuzzysort from occuring too often while user hasn't finished typing yet
	clearTimeout(this.timeout);
        this.timeout = setTimeout(this._omnibox, 400, text, suggest);
    }

    _omnibox(text, suggest) {
        // TODO redo fuzzysort implementation - it's a unoptimized mess
        if (text == undefined) return;
	if (this.dict === undefined) {
	    try {
		this.toggleExtension(null);
            } catch (err) {
                console.error(err);
            }
        }

        fuzzysort.highlightMatches = true;
        fuzzysort.highlightOpen = '<match>';
        fuzzysort.highlightClose = '</match>';
        //fuzzysort.threshold = null;
        //fuzzysort.limit = null;

        const dict = this.dict.hanzi;
        let results = [];

        // Check if user input is hanzi or plain english
        let useSimplified;
	const isHanzi = text.match(/[\u3400-\u9FBF]/);
	if (isHanzi) {
	    // If the text that has been typed is hanzi, get all entries that
            // start with the first character of the string and score them
	    useSimplified = /simp|boths/.test(this.config.hanziType);

            const index = dict.get(text.charAt(0));
            let score, item;
            for (let i = 0, len = index.length; i < len; i++) {
                if (useSimplified) {
                    item = index[i].simp;
                } else {
                    item = index[i].trad;
                }
                let hanzi = fuzzysort.single(text, item);
                score = hanzi ? hanzi.score : 1000;
                if(score >= 1000) continue;

                results.push({
                    item: index[i],
                    score: hanzi.score,
                    hanzi: hanzi ? hanzi.highlighted : item,
                    pinyinHighlighted: index[i].pinyin.tonemarks,
                    definitionHighlighted: index[i].def
                })
            }
	} else {
	    // If it's roman characters we have to check for pinyin and go through every key in the dictionary map,
            // then score the pinyin and definition separately
	    for (let key of dict.keys()) {
		let value = dict.get(key);
                for (let i = 0, len = value.length; i < len; i++) {
                    let string = '', definition = value[i].def;

                    if (definition.length > 1 && (this.config.definitionSeparator === "num")) {
                        for (let a = 0; a < definition.length; a++) {
                            string += (a + 1) + ' ' + definition[a] + '  ';
                        }
                        string.trim();
                    } else {
                        string = value[i].def.join(this.config.definitionSeparator);
                    }

                    let definitionScore = fuzzysort.single(text, string);
                    let pinyinScore = fuzzysort.single(text, this.convertPinyin(value[i].pinyin.tonemarks));

                    let score = Math.min(
                        pinyinScore?pinyinScore.score:1000,
                        definitionScore?definitionScore.score:1000);
                    if(score >= 1000) continue;

                    results.push({
                        item: value[i],
                        score: score,
                        pinyinHighlighted: pinyinScore ? pinyinScore.highlighted : value[i].pinyin.tonemarks,
                        definitionHighlighted: definitionScore ? definitionScore.highlighted : value[i].def
                    })
                }
            }
        }

        results.sort((a, b) => { return a.score - b.score });
        if (undefined === results) return;

        let array = [];
        for (let i = 0; i < results.length; i++) {
            // Hanzi
            let entry = '<url>';

            // If simplified and traditional are the same then just display one
            if (results[i].item.trad === results[i].item.simp) {
                entry += results[i].item.trad + " ";
            } else {
                if (isHanzi) {
                    entry += results[i].hanzi;
                } else {
                    // Fallthrough on purpose:
                    switch (this.config.hanziType) {
                    case "botht": entry += results[i].item.trad + " ";
                    case "simp": entry += results[i].item.simp;
                        break;
                    case "boths": entry += results[i].item.simp + " ";
                    case "trad": entry += results[i].item.trad;
                        break;
                    }
                }
            }


	    entry += "</url><dim>";

            // TODO make other pinyin types highlighted as well
	    // Pinyin
	    switch (this.config.pinyinType) {
	    case "tonemarks": entry += " " + results[i].pinyinHighlighted; break;
	    case "tonenums": entry += " " + results[i].item.pinyin.tonenums; break;
	    case "zhuyin": entry += " " + results[i].item.pinyin.zhuyin; break;
	    }

	    // Definition
            let content;

	    entry += '</dim> ' + results[i].definitionHighlighted;
	    if (useSimplified) {
		content = results[i].item.simp;
	    } else {
                content = results[i].item.trad;
            }
            array.push({content: content, description: entry});

	    // Limit to 10 results
	    //if (i === 9) { break; }
	}


	// Can use popup to show results instead
        /*chrome.tabs.query({ active:true, windowType:"normal", currentWindow: true },
	  tab => {
          chrome.tabs.sendMessage(tab[0].id, {
          "type": "showPopup",
          "text": array.toString();
          });
          });*/
	suggest(array);
    }

    convertPinyin(pinyin) {
        let str = '';
        for (let i = 0, len = pinyin.length-1; i < len; i++) {
            let char = pinyin.charAt(i);
            switch(char) {
            case 'ā':
            case 'á':
            case 'ǎ':
            case 'à':
                str += 'a';
                break;
            case 'ē':
            case 'é':
            case 'ě':
            case 'è':
                str += 'e';
                break;
            case 'ō':
            case 'ó':
            case 'ǒ':
            case 'ò':
                str += 'o';
                break;
            case 'ī':
            case 'í':
            case 'ǐ':
            case 'ì':
                str += 'i';
                break;
            case 'ū':
            case 'ú':
            case 'ǔ':
            case 'ù':
                str += 'u';
                break;
            case 'ǖ':
            case 'ǘ':
            case 'ǚ':
            case 'ǜ':
                str += 'v';
                break;
            default:
                str += pinyin.charAt(i);
            }
        }
        return str;
    }
}
