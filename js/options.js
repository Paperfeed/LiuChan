
// https://developer.chrome.com/extensions/options
// Saves options to chrome.storage
function saveOptions() {
    var popupColor = document.getElementById('popupColor').value;
    var showHanzi = document.getElementById('showHanzi').value;
    var pinyin = document.getElementById('pinyin').value;
    var numdef = document.getElementById('numdef').value;
    var popupDelay = document.getElementById('popupDelay').value;
    var highlight = document.getElementById('highlight').checked;
    var textboxhl = document.getElementById('textboxhl').checked;
    var doColors = document.getElementById('doColors').checked;
    var miniHelp = document.getElementById('miniHelp').checked;
    var disableKeys = document.getElementById('disableKeys').checked;
    var lineEnding = document.getElementById('lineEnding').value;
    var copySeparator = document.getElementById('copySeparator').value;
    var maxClipCopyEntries = document.getElementById('maxClipCopyEntries').value;
    var showOnKey = document.querySelector('input[name="showOnKey"]:checked').value;

    var newConfig = {
        popupColor: popupColor,
        showHanzi: showHanzi,
        pinyin: pinyin,
        numdef: numdef,
        popupDelay: popupDelay,
        highlight: highlight,
        textboxhl: textboxhl,
        doColors: doColors,
        miniHelp: miniHelp,
        disableKeys: disableKeys,
        lineEnding: lineEnding,
        copySeparator: copySeparator,
        maxClipCopyEntries: maxClipCopyEntries,
        showOnKey: showOnKey
    };
    chrome.storage.sync.set(newConfig, function() {
        chrome.runtime.sendMessage({"type":"config", "config":newConfig});
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.className += 'statusOn';
        setTimeout(function() {
            status.className = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
    // Use default value color = 'red' and likesColor = true.
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
    }, function(items) {
        document.getElementById('popupColor').value = items.popupColor;
        document.getElementById('showHanzi').value = items.showHanzi;
        document.getElementById('pinyin').value = items.pinyin;
        document.getElementById('numdef').value = items.numdef;
        document.getElementById('popupDelay').value = items.popupDelay;
        document.getElementById('highlight').checked = items.highlight;
        document.getElementById('textboxhl').checked = items.textboxhl;
        document.getElementById('doColors').checked = items.doColors;
        document.getElementById('miniHelp').checked = items.miniHelp;
        document.getElementById('disableKeys').checked = items.disableKeys;
        document.getElementById('lineEnding').value = items.lineEnding;
        document.getElementById('copySeparator').value = items.copySeparator;
        document.getElementById('maxClipCopyEntries').value = items.maxClipCopyEntries;

        // Get radio buttons and check the proper matching one
        // Should perhaps replace this with a RadioNodeList
        var radio = document.getElementsByName('showOnKey');
        for(var i = 0; i < radio.length; i++){
            if(radio[i].value === items.showOnKey){
                radio[i].checked = true;
            }
        }
    });
}
document.addEventListener('DOMContentLoaded', restoreOptions);

window.onload = function () {
    var inputs = document.querySelectorAll('.config');
    for (var i = 0; i < inputs.length; ++i) {
        inputs[i].addEventListener('change', saveOptions);
        var type = inputs[i].getAttribute('type');
        if (type === 'number' || type === 'text') {
            inputs[i].addEventListener('input', saveOptions);
        }
    }
};
