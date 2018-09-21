// chrome.storage.sync.clear() to clear all saved settings

// https://developer.chrome.com/extensions/options
// Saves options to chrome.storage
import CP from './lib/color-picker.min.js';



let tones = [],
    colors = [];

let e;

document.addEventListener('DOMContentLoaded', init);

window.onload = function () {
    // Add event listener to all config elements and save when it detects a change in values
    let target = document.querySelectorAll('.config');
    
    // Listeners to update values/colors on change
    e.sliderTtsSpeed.addEventListener('input', updateSliderValue);
    e.sliderBorderThickness.addEventListener('input', updatePreview);
    e.sliderBorderRadius.addEventListener('input', updatePreview);
    e.sliderDropShadowOpacity.addEventListener('input', updatePreview);
    e.buttonResetTones.addEventListener('click', resetTones);
    e.buttonResetCustomization.addEventListener('click', resetCustomization);
    e.selectPopupTheme.addEventListener('change', changeTheme);
    e.selectPinyinType.addEventListener('change', rebuildDictionary);
    e.checkboxUseHanziToneColors.addEventListener('change', updateTones);
    e.checkboxUseCustomTones.addEventListener('change', updateTones);
    e.checkboxUsePinyinToneColors.addEventListener('change', updateTones);
    e.checkboxUseCustomization.addEventListener('change', restorePreview);
    
    for (let i = 0, len = target.length; i < len; ++i) {
        target[i].addEventListener('change', saveOptions);
        let type = target[i].getAttribute('type');
        if (type === 'number' || type === 'text') {
            target[i].addEventListener('input', saveOptions);
        }
    }
};

function init() {
    let d = document;
    e = {
        sliderTtsSpeed: d.getElementById('ttsSpeed'),
        sliderTtsSpeedValue: d.getElementById("ttsSpeedValue"),
        sliderBorderThickness: d.getElementById('borderThickness'),
        sliderBorderThicknessValue: d.getElementById("borderThicknessValue"),
        sliderBorderRadius: d.getElementById('borderRadius'),
        sliderBorderRadiusValue: d.getElementById("borderRadiusValue"),
        sliderDropShadowOpacity: d.getElementById('dropShadowOpacity'),
        sliderDropShadowOpacityValue: d.getElementById("dropShadowOpacityValue"),
        buttonResetTones: d.getElementById('resetTones'),
        buttonResetCustomization: d.getElementById('resetCustomization'),
        selectPopupTheme: d.getElementById('popupTheme'),
        selectPinyinType: d.getElementById('pinyinType'),
        checkboxUseCustomization: d.getElementById('useCustomization'),
        inputPopupDelay: d.getElementById('popupDelay'),
        checkboxHighlightText: d.getElementById('checkboxHighlightText'),
        checkboxHighlightInput: d.getElementById('checkboxHighlightInput'),
        checkboxDisableKeys: d.getElementById('disableKeys'),
        selectHanziType: d.getElementById('hanziType'),
        selectDefinitionSeparator: d.getElementById('definitionSeparator'),
        checkboxUseHanziToneColors: d.getElementById('useHanziToneColors'),
        checkboxUseCustomTones: d.getElementById('useCustomTones'),
        checkboxUsePinyinToneColors: d.getElementById('usePinyinToneColors'),
        checkboxDisplayHelp: d.getElementById('displayHelp'),
        checkboxScaleOnZoom: d.getElementById('scaleOnZoom'),
        selectLineEnding: d.getElementById('lineEnding'),
        selectCopySeparator: d.getElementById('copySeparator'),
        inputMaxCopyEntries: d.getElementById('maxClipCopyEntries'),
        selectTtsDialect: d.getElementById('ttsDialect')
    };
    
    restoreOptions();
}

function saveOptions() {
    // Used in content script:
    // popupTheme
    // disableKeys
    // highlightText
    // highlightInput
    // showOnKey
    // popupDelay
    
    // Theme Customization
    let customTones = [
            tones[0].value,
            tones[1].value,
            tones[2].value,
            tones[3].value,
            tones[4].value,
            tones[5].value
        ],
        customColors = [
            colors[0].value, // Background
            colors[1].value, // Border
            convertRGBA(colors[2].value)  // Drop Shadow
        ];
    
    let newConfig = {
        content: {
            popupTheme: e.selectPopupTheme.value,
            popupDelay: e.inputPopupDelay.value,
            highlightText: e.checkboxHighlightText.checked,
            highlightInput: e.checkboxHighlightInput.checked,
            scaleOnZoom: e.checkboxScaleOnZoom.checked,
            showOnKey: parseInt((<HTMLInputElement>document.querySelector('input[name="showOnKey"]:checked')).value),
            disableKeys: e.checkboxDisableKeys.checked
        },
        styling: {
            useCustomization: e.checkboxUseCustomization.checked,
            customColors: customColors,
            borderThickness: parseFloat(e.sliderBorderThickness.value),
            borderRadius: parseFloat(e.sliderBorderRadius.value)
        },
        hanziType: e.selectHanziType.value,
        pinyinType: e.selectPinyinType.value,
        definitionSeparator: e.selectDefinitionSeparator.value,
        useHanziToneColors: e.checkboxUseHanziToneColors.checked,
        usePinyinToneColors: e.checkboxUsePinyinToneColors.checked,
        displayHelp: e.checkboxDisplayHelp.checked,
        lineEnding: e.selectLineEnding.value,
        copySeparator: e.selectCopySeparator.value,
        maxClipCopyEntries: e.inputMaxCopyEntries.value,
        ttsDialect: e.selectTtsDialect.value,
        ttsSpeed: parseFloat(e.sliderTtsSpeed.value),
        useCustomTones: e.checkboxUseCustomTones.checked,
        customTones: customTones
    };
    
    try {
        chrome.storage.sync.set(newConfig, function () {
            chrome.runtime.sendMessage({ "type": "config", "config": newConfig });
            // Update status to let user know options were saved.
            let status = document.getElementById('status');
            status.className += 'statusOn';
            setTimeout(function () {
                status.className = '';
            }, 1400);
        });
    } catch (err) {
        console.error("Chome Settings Sync Failed");
    }
}

// Restores user preferences stored in chrome.storage.
// Only gets called once
function restoreOptions() {
    tones = [document.getElementById('tone1'),
        document.getElementById('tone2'),
        document.getElementById('tone3'),
        document.getElementById('tone4'),
        document.getElementById('tone5'),
        document.getElementById('tone6')];
    
    colors = [document.getElementById('backgroundColor'),
        document.getElementById('borderColor'),
        document.getElementById('dropShadowColor')
    ];
    
    // Content Script settings are 'separate' in order to minimize overhead
    try {
        chrome.storage.sync.get(null, items => {
            console.log(items);
            e.selectPopupTheme.value = items.content.popupTheme;
            e.inputPopupDelay.value = items.content.popupDelay;
            e.checkboxHighlightText.checked = items.content.highlightText;
            e.checkboxHighlightInput.checked = items.content.highlightInput;
            e.checkboxScaleOnZoom.checked = items.content.scaleOnZoom;
            // showOnKey radio button - see below
            e.checkboxDisableKeys.checked = items.content.disableKeys;
            
            e.checkboxUseCustomization.checked = items.styling.useCustomization;
            e.sliderBorderThickness.value = items.styling.borderThickness;
            e.sliderBorderRadius.value = items.styling.borderRadius;
            // Drop Shadow Opacity is updated in convertRGBA function
            
            e.selectHanziType.value = items.hanziType;
            e.selectPinyinType.value = items.pinyinType;
            e.selectDefinitionSeparator.value = items.definitionSeparator;
            e.checkboxUseHanziToneColors.checked = items.useHanziToneColors;
            e.checkboxUsePinyinToneColors.checked = items.usePinyinToneColors;
            e.checkboxDisplayHelp.checked = items.displayHelp;
            e.selectLineEnding.value = items.lineEnding;
            e.selectCopySeparator.value = items.copySeparator;
            e.inputMaxCopyEntries.value = items.maxClipCopyEntries;
            e.selectTtsDialect.value = items.ttsDialect;
            e.sliderTtsSpeed.value = items.ttsSpeed;
            e.sliderTtsSpeed.innerHTML = items.ttsSpeed;
            e.checkboxUseCustomTones.checked = items.useCustomTones;
            
            
            // Get radio buttons and check the matching one
            let radio = <NodeListOf<HTMLInputElement>>document.getElementsByName('showOnKey');
            for (let i = 0; i < radio.length; i++) {
                if (parseInt(radio[i].value) === items.content.showOnKey) {
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
            
            colors[0].value = items.styling.customColors[0];
            colors[1].value = items.styling.customColors[1];
            colors[2].value = convertRGBA(items.styling.customColors[2]); // To HEX
            
            initializeColorPickers();
        });
    } catch (err) {
        console.error("Chrome Settings Sync Failed");
        initializeColorPickers();
    }
}

// Initialize color pickers with with color values currently stored in the input
// If restore options has been successfully executed, these should be the user defined colors
function initializeColorPickers() {
    let picker;
    let target = document.querySelectorAll('.colorpicker');
    for (let i = 0, len = target.length; i < len; ++i) {
        picker = new CP(target[i]);
        picker.on("change", function (color) {
            this.target.value = "#" + color;
            this.target.style.backgroundColor = "#" + color;
            updateTones();
            updatePreview();
        });
        picker.on("exit", function () {
            saveOptions();
        });
    }
}

// Update slider in option page
function updateSliderValue() {
    e.sliderTtsSpeedValue.innerHTML = e.sliderTtsSpeed.value + "x";
    e.sliderBorderThicknessValue.innerHTML = e.sliderBorderThickness.value + "px";
    e.sliderBorderRadiusValue.innerHTML = e.sliderBorderRadius.value + "px";
    e.sliderDropShadowOpacityValue.innerHTML = Math.round(e.sliderDropShadowOpacity.value * 100) + "%";
}

function updateTones() {
    // This function updates the theme preview with customized colors and settings
    let target, toneColors = {},
        useHanziTones = e.checkboxUseHanziToneColors.checked,
        usePinyinTones = e.checkboxUsePinyinToneColors.checked,
        useCustomTones = e.checkboxUseCustomTones.checked;
    
    for (let i = 0; i < 5; i++) {
        // Hanzi Tone Colors
        if (useCustomTones) {
            toneColors['tone' + (i + 1)] = tones[i].value;
        } else {
            toneColors['tone' + (i + 1)] = getStyle(".tone" + (i + 1)).style.color;
        }
    }
    
    if (useCustomTones) {
        toneColors['pinyin'] = tones[5].value
    } else {
        toneColors['pinyin'] = getStyle(".pinyin").style.color;
    }
    
    let query = ['.hanzi', '.pinyin'];
    
    for (let a = 0; a < 2; a++) {
        // Get all .hanzi or .pinyin divs
        target = document.querySelectorAll(query[a]);
        
        // Loop through each .hanzi or .pinyin div and set each element to its color
        for (let i = 0, len = target.length; i < len; i++) {
            let child = target[i].getElementsByTagName('span');
            for (let j = 0; j < child.length; j++) {
                if (child[j].className === "brace") {
                    continue
                }
                
                if (!usePinyinTones && a === 1) {
                    child[j].style.color = toneColors['pinyin'];
                } else if (!useHanziTones && a === 0) {
                    child[j].style.color = toneColors['tone1'];
                } else {
                    child[j].style.color = toneColors[child[j].className];
                }
            }
        }
    }
}

function updatePreview() {
    updateSliderValue();
    updateTones();
    
    if (e.checkboxUseCustomization.checked) {
        const liuchanWindow = document.getElementById("liuchan-window");
        liuchanWindow.style.border = e.sliderBorderThickness.value + "px solid " + colors[1].value;
        liuchanWindow.style.borderRadius = e.sliderBorderRadius.value + "px";
        liuchanWindow.style.boxShadow = "4px 4px 0 0 " + convertRGBA(colors[2].value);
        liuchanWindow.style.background = colors[0].value;
    }
}

function restorePreview() {
    if (!e.checkboxUseCustomization.checked) {
        const target = getStyle("#liuchan-window");
        const liuchanWindow = document.getElementById("liuchan-window");
        liuchanWindow.style.border = target.style.border;
        liuchanWindow.style.borderRadius = target.style.borderRadius;
        liuchanWindow.style.boxShadow = target.style.boxShadow;
        liuchanWindow.style.background = target.style.background;
    }
    updatePreview();
}

function resetTones() {
    let target;
    
    for (let i = 0, len = tones.length; i < len; i++) {
        if (i < 5) {
            target = getStyle(".tone" + (i + 1));
        } else {
            target = getStyle('.pinyin');
        }
        
        CP.__instance__[tones[i].id].trigger('change', [convertRGBA(target.style.color).substr(1)]);
        CP.__instance__[tones[i].id].set(convertRGBA(target.style.color).substr(1));
    }
    
    saveOptions();
}

function resetCustomization() {
    let rgb, defaultColors = [],
        borderThickness, borderRadius, dropShadowOpacity;
    
    const target = getStyle("#liuchan-window");
    
    // Get background style
    let regex = /(\d{1,3})[, ]+(\d{1,3})[, ]+(\d{1,3})/;
    rgb = regex.exec(target.style.background);
    defaultColors[0] = CP.RGB2HEX([rgb[1], rgb[2], rgb[3]]);
    
    // Get border color, thickness and radius
    rgb = regex.exec(target.style.border);
    defaultColors[1] = CP.RGB2HEX([rgb[1], rgb[2], rgb[3]]);
    borderThickness = target.style.border.split(" ", 1)[0].slice(0, -2);
    borderRadius = target.style.borderRadius.slice(0, -2);
    if (!borderRadius) {
        borderRadius = 0;
    }
    
    // Get drop shadow color and opacity
    rgb = regex.exec(target.style.boxShadow);
    defaultColors[2] = CP.RGB2HEX([rgb[1], rgb[2], rgb[3]]);
    let opacity = /\d{1,3}[, ]+\d{1,3}[, ]+\d{1,3}[, ]+(\d\.?\d{1,2})/.exec(target.style.boxShadow);
    if (opacity) {
        dropShadowOpacity = opacity[1];
    } else {
        dropShadowOpacity = 1;
    }
    
    for (let i = 0, len = colors.length; i < len; i++) {
        CP.__instance__[colors[i].id].trigger('change', [defaultColors[i]]);
        CP.__instance__[colors[i].id].set(defaultColors[i]);
    }
    
    e.sliderBorderThickness.value = borderThickness;
    e.sliderBorderRadius.value = borderRadius;
    e.sliderDropShadowOpacity.value = dropShadowOpacity;
    
    restorePreview();
    saveOptions();
}

function changeTheme() {
    let theme = document.getElementsByTagName("link").item(1);
    theme.href = '../css/popup-' + (<HTMLInputElement>document.getElementById('popupTheme')).value + '.css';
    
    // Slight pause to allow DOM to catch up with new stylesheet, don't know a better way yet
    setTimeout(function () {
        restorePreview();
    }, 100);
}

function rebuildDictionary() {
    chrome.runtime.sendMessage({ "type": "rebuild" });
}

function convertRGBA(value) {
    // Converts HEX to RGBA (using the value from the opacity slider) and RGBA/RGB to HEX
    let rgb, str;
    if (value.charAt(0) === "#") {
        // Is HEX value; convert to RGBA
        rgb = CP.HEX2RGB(value.substr(1));
        let opacity = (<HTMLInputElement>document.getElementById('dropShadowOpacity')).value;
        str = "RGBA(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + opacity + ")";
    } else {
        if (value.startsWith("RGBA")) {
            rgb = value.substr(5).slice(0, -1).split(",");
            (<HTMLInputElement>document.getElementById('dropShadowOpacity')).value = rgb[3];
        } else {
            rgb = value.substr(4).slice(0, -1).split(",");
        }
        str = "#" + CP.RGB2HEX(rgb);
        updateSliderValue();
    }
    
    return str;
}

function getStyle(className) {
    let classes = (<any>document.styleSheets[1]).cssRules || (<any>document.styleSheets[1]).rules;
    // Go backwards to ensure you get the strongest match
    for (let i = classes.length; i > 0; i--) {
        if (classes[i - 1].selectorText.endsWith(className)) {
            return classes[i - 1];
        }
    }
}



