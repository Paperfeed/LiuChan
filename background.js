chrome.browserAction.onClicked.addListener(ppcMain.inlineToggle);
chrome.tabs.onSelectionChanged.addListener(ppcMain.onTabSelect);
chrome.extension.onRequest.addListener(
	function(request, sender, response) {
		switch(request.type) {
			case 'enable?':
				console.log('enable?');
				ppcMain.onTabSelect(sender.tab.id);
				break;
			case 'xsearch':
				console.log('xsearch');
				var e = ppcMain.search(request.text, request.showmode);
				response(e);
				break;
			case 'translate':
				console.log('translate');
				var e = ppcMain.dict.translate(request.title);
				response(e);
				break;
			case 'makehtml':
				console.log('makehtml');
				var html = ppcMain.dict.makeHtml(request.entry);
				response(html);
				break;
			default:
				console.log(request);
		}
	});
	
if(initStorage("v0.9", true)) {
	// v0.7
	initStorage("popupcolor", "charcoal");
	initStorage("highlight", "yes");
	initStorage("docolors", "yes");
	initStorage("showhanzi", "boths");
	initStorage("pinyin", "tonemarks");
	
	// v0.8
	// No changes to options
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

ppcMain.config = {};
ppcMain.config.css = localStorage["popupcolor"];
ppcMain.config.highlight = localStorage["highlight"];
ppcMain.config.showhanzi = localStorage["showhanzi"];
ppcMain.config.docolors = localStorage["docolors"];
ppcMain.config.pinyin = localStorage["pinyin"];