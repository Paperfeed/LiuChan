function fillVals() {
	// Dropdowns
	document.optform.popupColor.value = localStorage['popupColor'];
	document.optform.showHanzi.value = localStorage['showHanzi'];
	document.optform.pinyin.value = localStorage['pinyin'];
	document.optform.popupDelay.value = localStorage["popupDelay"];
    document.optform.highlightText.checked = localStorage['highlight']; // Highlight text or not
    document.optform.textboxhl.checked = localStorage['textboxhl']; // Highlight text in input fields or not
    document.optform.doColors.checked = localStorage['doColors']; // Display pinyin tones in color or not
    document.optform.miniHelp.checked = localStorage['miniHelp']; // Show hotkey summary on enable or not
    document.optform.disableKeys.checked = localStorage['disableKeys']; // Disable hotkeys or not

	// Line ending for Copy to Clipboard functionality
	store = localStorage['lineEnding'];
	for (var i = 0; i < document.optform.lineEnding.length; ++i) {
		if (document.optform.lineEnding[i].value === store) {
			document.optform.lineEnding[i].selected = true;
			break;
		}
	}

	// Separator for Copy to Clipboard functionality
	store = localStorage['copySeparator'];
	for (var i = 0; i < document.optform.copySeparator.length; ++i) {
		if (document.optform.copySeparator[i].value === store) {
			document.optform.copySeparator[i].selected = true;
			break;
		}
	}

	document.optform.maxClipCopyEntries.value = parseInt(localStorage['maxClipCopyEntries']);

	// Select which key should be held to display popup, if at all
	store = localStorage['showOnKey'];
	for (var i = 0; i < document.optform.showOnKey.length; ++i) {
		if (document.optform.showOnKey[i].value === store) {
			document.optform.showOnKey[i].checked = true;
			break;
		}
	}

}

function getVals() {
	localStorage['popupColor'] = document.optform.popupColor.value;
	localStorage['showHanzi'] = document.optform.showHanzi.value;
	localStorage['pinyin'] = document.optform.pinyin.value;
	localStorage['highlight'] = document.optform.highlightText.checked;
	localStorage['textboxhl'] = document.optform.textboxhl.checked;
	localStorage['doColors'] = document.optform.doColors.checked;
	localStorage['miniHelp'] = document.optform.miniHelp.checked;
	localStorage['disableKeys'] = document.optform.disableKeys.checked;
	localStorage['lineEnding'] = document.optform.lineEnding.value;
	localStorage['copySeparator'] = document.optform.copySeparator.value;
	localStorage['maxClipCopyEntries'] = document.optform.maxClipCopyEntries.value;

	var popupDelay;
	try {
		popupDelay = parseInt(document.optform.popupDelay.value);
		if (!isFinite(popupDelay)) {
			throw Error('infinite');
		}
		localStorage['popupDelay'] = document.optform.popupDelay.value;
	} catch (err) {
		popupDelay = 150;
		localStorage['popupDelay'] = "150";
	}
	localStorage['showOnKey'] = document.optform.showOnKey.value;

	// TODO config can be used directly from localStorage. No need to copy it every time
	chrome.extension.getBackgroundPage().lcxMain.config.css = localStorage["popupColor"];
	chrome.extension.getBackgroundPage().lcxMain.config.showHanzi = localStorage["showHanzi"];
	chrome.extension.getBackgroundPage().lcxMain.config.pinyin = localStorage["pinyin"];
	chrome.extension.getBackgroundPage().lcxMain.config.highlight = localStorage["highlight"];
	chrome.extension.getBackgroundPage().lcxMain.config.textboxhl = localStorage["textboxhl"];
	chrome.extension.getBackgroundPage().lcxMain.config.doColors = localStorage["doColors"];
	chrome.extension.getBackgroundPage().lcxMain.config.miniHelp = localStorage["miniHelp"];
	chrome.extension.getBackgroundPage().lcxMain.config.popupDelay = popupDelay;
	chrome.extension.getBackgroundPage().lcxMain.config.disableKeys = localStorage["disableKeys"];
	chrome.extension.getBackgroundPage().lcxMain.config.showOnKey = localStorage["showOnKey"];
	chrome.extension.getBackgroundPage().lcxMain.config.lineEnding = localStorage["lineEnding"];
	chrome.extension.getBackgroundPage().lcxMain.config.copySeparator = localStorage["copySeparator"];
	chrome.extension.getBackgroundPage().lcxMain.config.maxClipCopyEntries = localStorage["maxClipCopyEntries"];

}
window.onload = fillVals;

var inputs = document.querySelectorAll('.config');
for (var i = 0; i < inputs.length; ++i) {
	inputs[i].addEventListener('change', getVals);
	var type = inputs[i].getAttribute('type');
	if (type === 'number' || type === 'text') {
		inputs[i].addEventListener('input', getVals);
	}
}
