'use strict';

const chromep = new ChromePromise();
const liuChan = new LiuChan();

// This gets fired when the extension's button is clicked
chrome.browserAction.onClicked.addListener(liuChan.toggleExtension.bind(liuChan));
chrome.tabs.onActivated.addListener(liuChan.onTabSelect.bind(liuChan));
chrome.windows.onFocusChanged.addListener(liuChan.onWindowChangeFocus.bind(liuChan));

// Fired when a message is sent from extension or content script
// basically this allows the extension's background to communicate with the
// content script that gets loaded on matching urls (as per the manifest)
chrome.runtime.onMessage.addListener(
	function(request, sender, response) {
		switch(request.type) {
			case 'enable?':
                //chrome.tabs.sendMessage(sender.tab.id, {"type":"config", "config": liuChan.config.content});
				if (request.enabled === false && liuChan.enabled) liuChan.onTabSelect(sender.tab);
				break;
			case 'xsearch':
				let e = liuChan.dict.wordSearch(liuChan.dict.hanzi, request.text);
				response(e);
				break;
            case 'makehtml':
				let html = liuChan.dict.makeHtml(request.entry);
				response(html);
				break;
			case 'copyToClip':
                liuChan.copyToClip(sender.tab, request.entry);
				break;
			case 'config':
				// Immediately update settings upon change occuring
                liuChan.config = request.config;
				break;
			case 'toggleDefinition':
                liuChan.dict.noDefinition = !liuChan.dict.noDefinition;
				break;
			case 'tts':
				// mandarin: zh-CN, zh-TW cantonese: zh-HK
				chrome.tts.speak(request.text,  {"lang": liuChan.config.ttsDialect,
					"rate": liuChan.config.ttsSpeed});
				break;
			case 'rebuild':
                liuChan.dict.loadDictionary();
				break;
			case 'customstyling':
                response(liuChan.config.styling);
                break;
			default:
				console.log(request);
		}
});

