lcxMain.inlineDisable();
chrome.browserAction.onClicked.addListener(lcxMain.inlineToggle);
chrome.tabs.onSelectionChanged.addListener(lcxMain.onTabSelect);
chrome.runtime.onMessage.addListener(
	function(request, sender, response) {
		switch(request.type) {
			case 'enable?':
				console.log('enable?');
				lcxMain.onTabSelect(sender.tab.id);
				break;
			case 'xsearch':
				console.log('xsearch');
				var e = lcxMain.search(request.text, request.showmode);
				response(e);
				break;
			case 'translate':
				console.log('translate');
				var e = lcxMain.dict.translate(request.title);
				response(e);
				break;
			case 'makehtml':
				console.log('makehtml');
				var html = lcxMain.dict.makeHtml(request.entry);
				response(html);
				break;
			case 'copyToClip':
				console.log('copyToClip');
				lcxMain.copyToClip(sender.tab, request.entry);
				break;
			default:
				console.log(request);
		}
	});
	
if(initStorage("v0.0.1", true)) {
	initStorage("popupColor", "charcoal");
	initStorage("highlight", true);
	initStorage("textboxhl", false);
	initStorage("pinyin", "tonemarks");
	initStorage("doColors", true);
	initStorage("showHanzi", "boths");
	initStorage("miniHelp", true);
	initStorage("popupDelay", "1");
	initStorage("disableKeys", true);
	initStorage("lineEnding", "n");
	initStorage("copySeparator", "tab");
	initStorage("maxClipCopyEntries", "7");
	initStorage("showOnKey", "");
}

/** 
* Initializes the localStorage for the given key. 
* If the given key is already initialized, nothing happens. 
* 
* @author Teo (GD API Guru)
* @param key The key for which to initialize 
* @param initialValue Initial value of localStorage on the given key 
* @return true if a value is assigned or false if nothing happens 
*/ 
function initStorage(key, initialValue) { 
  var currentValue = localStorage[key]; 
  if (!currentValue) { 
	localStorage[key] = initialValue; 
	return true; 
  } 
  return false; 
} 

lcxMain.config = {};
lcxMain.config.css = localStorage["popupColor"];
lcxMain.config.highlight = localStorage["highlight"];
lcxMain.config.textboxhl = localStorage["textboxhl"];
lcxMain.config.pinyin = localStorage["pinyin"];
lcxMain.config.doColors = localStorage["doColors"];
lcxMain.config.showHanzi = localStorage["showHanzi"];
lcxMain.config.miniHelp = localStorage["miniHelp"];
lcxMain.config.popupDelay = parseInt(localStorage["popupDelay"]);
lcxMain.config.disableKeys = localStorage["disableKeys"];
lcxMain.config.lineEnding = localStorage["lineEnding"];
lcxMain.config.copySeparator = localStorage["copySeparator"];
lcxMain.config.maxClipCopyEntries = localStorage["maxClipCopyEntries"];
lcxMain.config.showOnKey = localStorage["showOnKey"];