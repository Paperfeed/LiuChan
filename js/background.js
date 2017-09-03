// todo Add omnibox keyword dictionary searching
/*chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
    suggest([
        {content: text + " one", description: "the first one"},
        {content: text + " number two", description: "the second entry"}
    ]);
});

chrome.omnibox.onInputEntered.addListener(function(text) {
    alert('You just typed "' + text + '"');
});*/
//manifest: "omnibox": {"keyword" : "liuchan"},

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
				lcxMain.onTabSelect(sender.tab);
				break;
			case 'xsearch':
				var e = lcxMain.dict.wordSearch(lcxMain.dict.hanzi, request.text);
				response(e);
				break;
            case 'translate':
                //var e = lcxMain.dict.translate(request.title);
                chrome.tabs.sendMessage(sender.tab.id, {"text":request.title});
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
				// in the options page.
				lcxMain.config = request.config;

				// Kind of redundant because the tab currently
				// updates settings onTabSelect as well, but might change that later on
				lcxMain.sendAllTabs(request);
				break;
			case 'switchOnlyReading':
                lcxMain.dict.noDefinition = !lcxMain.dict.noDefinition;
				break;
			default:
				console.log(request);
		}
});

lcxMain.initConfig();