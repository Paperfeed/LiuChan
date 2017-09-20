'use strict';

// This gets fired when the extension's button is clicked
chrome.browserAction.onClicked.addListener(lcxMain.toggleExtension);
chrome.tabs.onActivated.addListener(lcxMain.onTabSelect);

// Fired when a message is sent from extension or content script
// basically this allows the extension's background to communicate with the
// content script that gets loaded on matching urls (as per the manifest)
chrome.runtime.onMessage.addListener(
	function(request, sender, response) {
		//console.log(request);
		switch(request.type) {
			case 'enable?':
				if (request.enabled === false && lcxMain.enabled) lcxMain.onTabSelect(sender.tab);
				break;
			case 'xsearch':
				var e = lcxMain.dict.wordSearch(lcxMain.dict.hanzi, request.text);
				response(e);
				break;
            case 'makehtml':
				var html = lcxMain.dict.makeHtml(request.entry);
				response(html);
				break;
			case 'copyToClip':
				lcxMain.copyToClip(sender.tab, request.entry);
				break;
			case 'config':
				// This is to immediately update settings upon change occuring
				lcxMain.config = request.config;
				break;
			case 'toggleDefinition':
                lcxMain.dict.noDefinition = !lcxMain.dict.noDefinition;
				break;
			case 'tts':
				// mandarin: zh-CN, zh-TW cantonese: zh-HK
				chrome.tts.speak(request.text,  {"lang": lcxMain.config.ttsDialect,
					"rate": lcxMain.config.ttsSpeed});
				break;
			case 'rebuild':
                lcxMain.dict.loadDictionary(sender.tab);
				break;
			default:
				console.log(request);
		}
});

lcxMain.initConfig();