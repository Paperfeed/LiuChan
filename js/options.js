
// chrome.storage.sync.clear() to clear all saved settings

// https://developer.chrome.com/extensions/options
// Saves options to chrome.storage

// Used in content script:
// popupColor
// disableKeys
// highlight
// textboxhl
// showOnKey
// popupDelay

function saveOptions() {
    var popupColor = document.getElementById('popupColor').value;
    var popupDelay = document.getElementById('popupDelay').value;
    var highlight = document.getElementById('highlight').checked;
    var textboxhl = document.getElementById('textboxhl').checked;
    var showOnKey = document.querySelector('input[name="showOnKey"]:checked').value;
    var disableKeys = document.getElementById('disableKeys').checked;

    var showHanzi = document.getElementById('showHanzi').value;
    var pinyin = document.getElementById('pinyin').value;
    var numdef = document.getElementById('numdef').value;
    var doColors = document.getElementById('doColors').checked;
    var doPinyinColors = document.getElementById('doPinyinColors').checked;
    var miniHelp = document.getElementById('miniHelp').checked;
    var lineEnding = document.getElementById('lineEnding').value;
    var copySeparator = document.getElementById('copySeparator').value;
    var maxClipCopyEntries = document.getElementById('maxClipCopyEntries').value;
    var ttsDialect = document.getElementById('ttsDialect').value;
    var ttsSpeed = parseFloat(document.getElementById('ttsSpeed').value);
    var useCustomTone = (document.getElementById('useCustomTone').checked);
    var customTones = [
            tones[0].value,
            tones[1].value,
            tones[2].value,
            tones[3].value,
            tones[4].value,
            tones[5].value];
    updateTones();

    var newConfig = {
        content: {
            popupColor: popupColor,
            popupDelay: popupDelay,
            highlight: highlight,
            textboxhl: textboxhl,
            showOnKey: showOnKey,
            disableKeys: disableKeys
        },
        showHanzi: showHanzi,
        pinyin: pinyin,
        numdef: numdef,
        doColors: doColors,
        doPinyinColors: doPinyinColors,
        miniHelp: miniHelp,
        lineEnding: lineEnding,
        copySeparator: copySeparator,
        maxClipCopyEntries: maxClipCopyEntries,
        ttsDialect: ttsDialect,
        ttsSpeed: ttsSpeed,
        useCustomTone: useCustomTone,
        customTones: customTones
    };

    chrome.storage.sync.set(newConfig, function() {
        chrome.runtime.sendMessage({"type":"config", "config":newConfig});
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.className += 'statusOn';
        setTimeout(function() {
            status.className = '';
        }, 1400);
    });
}

// Restores user preferences stored in chrome.storage.
function restoreOptions() {
    tones = [document.getElementById('tone1'),
        document.getElementById('tone2'),
        document.getElementById('tone3'),
        document.getElementById('tone4'),
        document.getElementById('tone5'),
        document.getElementById('pycol')];

    // Content Script settings are 'separate' in order to minimize overhead
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
    }, function(items) {
        document.getElementById('popupColor').value = items.content.popupColor;
        document.getElementById('popupDelay').value = items.content.popupDelay;
        document.getElementById('highlight').checked = items.content.highlight;
        document.getElementById('textboxhl').checked = items.content.textboxhl;
        // showOnKey radio button - see below
        document.getElementById('disableKeys').checked = items.content.disableKeys;

        document.getElementById('showHanzi').value = items.showHanzi;
        document.getElementById('pinyin').value = items.pinyin;
        document.getElementById('numdef').value = items.numdef;
        document.getElementById('doColors').checked = items.doColors;
        document.getElementById('doPinyinColors').checked = items.doPinyinColors;
        document.getElementById('miniHelp').checked = items.miniHelp;
        document.getElementById('lineEnding').value = items.lineEnding;
        document.getElementById('copySeparator').value = items.copySeparator;
        document.getElementById('maxClipCopyEntries').value = items.maxClipCopyEntries;
        document.getElementById('ttsDialect').value = items.ttsDialect;
        document.getElementById('ttsSpeed').value = items.ttsSpeed;
        document.getElementById("ttsSpeedValue").innerHTML = items.ttsSpeed;
        document.getElementById("useCustomTone").checked = items.useCustomTone;

        // Get radio buttons and check the matching one
        // TODO Should replace this with a RadioNodeList
        var radio = document.getElementsByName('showOnKey');
        for(var i = 0; i < radio.length; i++){
            if(radio[i].value === items.content.showOnKey){
                radio[i].checked = true;
            }
        }

        // Init user's custom tones into the inputs
        // (won't be able to change through .value after initializing the color pickers)
        tones[0].value = items.customTones[0];
        tones[1].value = items.customTones[1];
        tones[2].value = items.customTones[2];
        tones[3].value = items.customTones[3];
        tones[4].value = items.customTones[4];
        tones[5].value = items.customTones[5];

        // Initialize color pickers
        var picker;
        var target = document.querySelectorAll('.colorpicker');
        for (i = 0, len = target.length; i < len; ++i) {
            picker = new CP(target[i]);
            picker.on("change", function(color) {
                this.target.value = "#" + color;
                this.target.style.backgroundColor = "#" + color;
                updateTones();
            });
            picker.on("exit", function() {
                saveOptions();
            });
        }
    });
}

// Update slider in option page
function showValue() {
    document.getElementById("ttsSpeedValue").innerHTML = document.getElementById('ttsSpeed').value;
}

function updateTones() {
    var tone, target;
    var colorPinyin = document.getElementById('doPinyinColors').checked;
    for (var a = 0; a < tones.length; a++) {
        switch (a) {
            case 0: tone = "tone1"; break;
            case 1: tone = "tone2"; break;
            case 2: tone = "tone3"; break;
            case 3: tone = "tone4"; break;
            case 4: tone = "tone5"; break;
            case 5: tone = "pinyin"; break;
        }

        if (tone === 'pinyin' && !colorPinyin) {
            target = document.querySelectorAll('.pinyin');
            for (var i = 0, len = target.length; i < len; i++) {
                var child = target[i].getElementsByTagName('span');
                for (var j = 0; j < child.length; j++) {
                    child[j].style.color = tones[a].value;
                }
            }
        } else {
            target = document.getElementsByClassName(tone);
            for (var i = 0, len = target.length; i < len; i++) {
                target[i].style.color = tones[a].value;
            }
        }
    }
}

function resetTones() {
    var defaults = ['F2777A','99CC99','6699CC','CC99CC','CCCCCC', '66CCCC'];
    var i = 0;
    CP.each(function ($){
        $.trigger('change', [defaults[i]]);
        $.set(defaults[i]);
        i++;
    });
    saveOptions();
}

function changeTheme() {
    var theme = document.getElementsByTagName("link").item(1);
    theme.href = '../css/popup-' + document.getElementById('popupColor').value + '.css';
}

function rebuildDictionary() {
    chrome.runtime.sendMessage({"type":"rebuild"});
}

var tones = [];
document.addEventListener('DOMContentLoaded', restoreOptions);

window.onload = function () {
    var target = document.querySelectorAll('.config');

    for (var i = 0, len = target.length; i < len; ++i) {
        target[i].addEventListener('change', saveOptions);
        var type = target[i].getAttribute('type');
        if (type === 'number' || type === 'text') {
            target[i].addEventListener('input', saveOptions);
        }
    }
    document.getElementById('ttsSpeed').addEventListener('input', showValue);
    document.getElementById('reset').addEventListener('click', resetTones);
    document.getElementById('popupColor').addEventListener('change', changeTheme);
    document.getElementById('pinyin').addEventListener('change', rebuildDictionary);
};
