// chrome.storage.local.clear() to clear all saved settings

// https://developer.chrome.com/extensions/options
// Saves options to chrome.storage

let tones = [],			// pinyin tones
    jtones = [],		// pingjam tones
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
    e.selectPingjamType.addEventListener('change', rebuildDictionary);
    e.selectUseHanziToneColors.addEventListener('change', updateTones);
    e.checkboxUseCustomTones.addEventListener('change', updateTones);
    e.checkboxUsePinyinToneColors.addEventListener('change', updateTones);
    e.checkboxUsePingjamToneColors.addEventListener('change', updateTones);
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
	selectPingjamType: d.getElementById('pingjamType'),
	selectLangType: d.getElementById('langType'),
        checkboxUseCustomization: d.getElementById('useCustomization'),
        inputPopupDelay: d.getElementById('popupDelay'),
        checkboxHighlightText: d.getElementById('checkboxHighlightText'),
        checkboxHighlightInput: d.getElementById('checkboxHighlightInput'),
        checkboxDisableKeys: d.getElementById('disableKeys'),
        selectHanziType: d.getElementById('hanziType'),
        selectDefinitionSeparator: d.getElementById('definitionSeparator'),
        selectUseHanziToneColors: d.getElementById('useHanziToneColors'),
        checkboxUseCustomTones: d.getElementById('useCustomTones'),
        checkboxUsePinyinToneColors: d.getElementById('usePinyinToneColors'),
	checkboxUsePingjamToneColors: d.getElementById('usePingjamToneColors'),
        checkboxDisplayHelp: d.getElementById('displayHelp'),
        checkboxScaleOnZoom: d.getElementById('scaleOnZoom'),
        selectLineEnding: d.getElementById('lineEnding'),
        selectCopySeparator: d.getElementById('copySeparator'),
        inputMaxCopyEntries: d.getElementById('maxClipCopyEntries'),
        selectTtsDialect: d.getElementById('ttsDialect'),
	selectMaxEntries: d.getElementById('maxEntries')
	// checkboxSearchLeadingAscii: d.getElementById('searchLeadingAscii')
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
    let customTones = [		// custom pinyin tone colors
        tones[0].value,
        tones[1].value,
        tones[2].value,
        tones[3].value,
        tones[4].value,
        tones[5].value
    ],
	jcustomTones = [	// custom pingjam tone colors
	    jtones[0].value,
	    jtones[1].value,
	    jtones[2].value,
	    jtones[3].value,
	    jtones[4].value,
	    jtones[5].value,
	    jtones[6].value,
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
            showOnKey: parseInt(document.querySelector('input[name="showOnKey"]:checked').value),
            disableKeys: e.checkboxDisableKeys.checked
        },
        styling: {
            useCustomization: e.checkboxUseCustomization.checked,
            customColors: customColors,
            borderThickness: parseFloat(e.sliderBorderThickness.value),
            borderRadius: parseFloat(e.sliderBorderRadius.value)
        },
	langType: e.selectLangType.value,
        hanziType: e.selectHanziType.value,
        pinyinType: e.selectPinyinType.value,
	pingjamType: e.selectPingjamType.value,
        definitionSeparator: e.selectDefinitionSeparator.value,
        useHanziToneColors: e.selectUseHanziToneColors.value,
        usePinyinToneColors: e.checkboxUsePinyinToneColors.checked,
	usePingjamToneColors: e.checkboxUsePingjamToneColors.checked,
        displayHelp: e.checkboxDisplayHelp.checked,
        lineEnding: e.selectLineEnding.value,
        copySeparator: e.selectCopySeparator.value,
        maxClipCopyEntries: e.inputMaxCopyEntries.value,
        ttsDialect: e.selectTtsDialect.value,
        ttsSpeed: parseFloat(e.sliderTtsSpeed.value),
        useCustomTones: e.checkboxUseCustomTones.checked,
        customTones: customTones,
	jcustomTones: jcustomTones,
	maxEntries: e.selectMaxEntries.value
	// searchLeadingAscii: e.checkboxSearchLeadingAscii.checked
    };

    try {
        chrome.storage.local.set(newConfig, function () {
            chrome.runtime.sendMessage({"type": "config", "config": newConfig});
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
    
    jtones = [document.getElementById('jtone1'),
              document.getElementById('jtone2'),
              document.getElementById('jtone3'),
              document.getElementById('jtone4'),
              document.getElementById('jtone5'),
	      document.getElementById('jtone6'),
              document.getElementById('jtone7')];

    colors = [document.getElementById('backgroundColor'),
              document.getElementById('borderColor'),
              document.getElementById('dropShadowColor')
	     ];

    // Content Script settings are 'separate' in order to minimize overhead
    try {
        chrome.storage.local.get(null, items => {
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
            e.selectLangType.value = items.langType;
            e.selectPinyinType.value = items.pinyinType;
            e.selectDefinitionSeparator.value = items.definitionSeparator;
            e.selectUseHanziToneColors.value = items.useHanziToneColors;
            e.checkboxUsePinyinToneColors.checked = items.usePinyinToneColors;
	    e.checkboxUsePingjamToneColors.checked = items.usePingjamToneColors;
            e.checkboxDisplayHelp.checked = items.displayHelp;
            e.selectLineEnding.value = items.lineEnding;
            e.selectCopySeparator.value = items.copySeparator;
            e.inputMaxCopyEntries.value = items.maxClipCopyEntries;
            e.selectTtsDialect.value = items.ttsDialect;
            e.sliderTtsSpeed.value = items.ttsSpeed;
            e.sliderTtsSpeed.innerHTML = items.ttsSpeed;
            e.checkboxUseCustomTones.checked = items.useCustomTones;
	    e.selectMaxEntries.value = items.maxEntries;
	    // e.checkboxSearchLeadingAscii.checked = items.searchLeadingAscii;

            // Get radio buttons and check the matching one
            let radio = document.getElementsByName('showOnKey');
            for (let i = 0; i < radio.length; i++) {
                if (parseInt(radio[i].value) === items.content.showOnKey) {
                    radio[i].checked = true;
                }
            }

            // Init user's custom tones into the inputs
            // (won't be able to change through .value after initializing the color pickers)
	    for (let i = 0; i < 6; i++) {
		tones[i].value = items.customTones[i];
	    }

	    for (let i = 0; i < 7; i++) {
		jtones[i].value = items.jcustomTones[i];
	    }

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
    // toneColors holds the colors for pinyin, jtoneColors holds colors for pingjam
    let target, toneColors = {}, jtoneColors = {},
        useHanziTones = e.selectUseHanziToneColors.value,
        usePinyinTones = e.checkboxUsePinyinToneColors.checked,
	usePingjamTones = e.checkboxUsePingjamToneColors.checked,
        useCustomTones = e.checkboxUseCustomTones.checked;

    // set up pinyin tone colors
    for (let i = 0; i < 5; i++) {
        if (useCustomTones) {
	    toneColors['tone' + (i + 1)] = tones[i].value;
        } else {
	    toneColors['tone' + (i + 1)] = getStyle(".tone" + (i + 1)).style.color;
        }
    }
    
    // set up pingjam tone colors
    for (let i = 0; i < 6; i++) {
        if (useCustomTones) {
	    jtoneColors['jtone' + (i + 1)] = jtones[i].value;
        } else {
	    jtoneColors['jtone' + (i + 1)] = getStyle(".jtone" + (i + 1)).style.color;
        }
    }

    if (useCustomTones) {
        toneColors['pinyin'] = tones[5].value;
	jtoneColors['pingjam'] = jtones[6].value;
    } else {
        toneColors['pinyin'] = getStyle(".pinyin").style.color;
	jtoneColors['pingjam'] = getStyle(".pingjam").style.color;
    }

    let query = ['.hanzi', '.pinyin', '.pingjam'];

    // make sure correct divs are displayed in the sample liuchan-window
    let c = document.getElementById("canto-tones");
    let m = document.getElementById("mando-tones");

    if (useHanziTones === "canto") {
    	c.style.display = "inline";
    	m.style.display = "none";
    } else {
    	c.style.display = "none";
    	m.style.display = "inline";
    }

    for (let a = 0; a < query.length; a++) {
        // Get all .hanzi, .pinyin and .pingjam divs
        target = document.querySelectorAll(query[a]);

        // Loop through each .hanzi or .pinyin div and set each element to its color
        for (let i = 0, len = target.length; i < len; i++) {
            let child = target[i].getElementsByTagName('span');
            for (let j = 0; j < child.length; j++) {
                if (child[j].className === "brace") {continue}

		if (a === 2) {
		    if (!usePingjamTones) {
			child[j].style.color = jtoneColors['pingjam'];
		    } else {
			child[j].style.color = jtoneColors[child[j].className];
		    }		    
		} else if (a === 1) {
		    if (!usePinyinTones) {			
			child[j].style.color = toneColors['pinyin'];
		    } else {
			child[j].style.color = toneColors[child[j].className];
		    }		    
                } else if (a === 0) {
		    if (useHanziTones === "none") {
			child[j].style.color = toneColors['tone1'];
		    } else if (useHanziTones === "mando") {
			child[j].style.color = toneColors[child[j].className];
		    } else if (useHanziTones === "canto") {
			// hacky way since the customisation example is static
			// in other words the pinyin colors wrong in general here
			child[j].style.color = jtoneColors[child[j].className];
		    }
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
    // reset pinyin tones
    for (let i = 0, len = tones.length; i < len; i++) {
        if (i < 5) {
            target = getStyle(".tone" + (i + 1));
        } else {
            target = getStyle('.pinyin');
        }

        CP.__instance__[tones[i].id].trigger('change', [convertRGBA(target.style.color).substr(1)]);
        CP.__instance__[tones[i].id].set(convertRGBA(target.style.color).substr(1));
    }

    // reset pingjam tones
    for (let i = 0, len = jtones.length; i < len; i++) {
        if (i < 6) {
            target = getStyle(".jtone" + (i + 1));
        } else {
            target = getStyle('.pingjam');
        }

        CP.__instance__[jtones[i].id].trigger('change', [convertRGBA(target.style.color).substr(1)]);
        CP.__instance__[jtones[i].id].set(convertRGBA(target.style.color).substr(1));
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
    defaultColors[0] = CP.RGB2HEX([rgb[1],rgb[2],rgb[3]]);

    // Get border color, thickness and radius
    rgb = regex.exec(target.style.border);
    defaultColors[1] = CP.RGB2HEX([rgb[1],rgb[2],rgb[3]]);
    borderThickness = target.style.border.split(" ", 1)[0].slice(0, -2);
    borderRadius = target.style.borderRadius.slice(0, -2);
    if (!borderRadius) { borderRadius = 0; }

    // Get drop shadow color and opacity
    rgb = regex.exec(target.style.boxShadow);
    defaultColors[2] = CP.RGB2HEX([rgb[1],rgb[2],rgb[3]]);
    let opacity = /\d{1,3}[, ]+\d{1,3}[, ]+\d{1,3}[, ]+(\d\.?\d{1,2})/.exec(target.style.boxShadow);
    if (opacity) {
        dropShadowOpacity = opacity[1];
    } else {
        dropShadowOpacity = 1;
    }

    for(let i = 0, len = colors.length; i < len; i++) {
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
    theme.href = '../css/popup-' + document.getElementById('popupTheme').value + '.css';

    // Slight pause to allow DOM to catch up with new stylesheet, don't know a better way yet
    setTimeout(function () {
        restorePreview();
    }, 100);
}

function rebuildDictionary() {
    chrome.runtime.sendMessage({"type": "rebuild"});
}

function convertRGBA(value){
    // Converts HEX to RGBA (using the value from the opacity slider) and RGBA/RGB to HEX
    let rgb, str;
    if (value.charAt(0) === "#") {
        // Is HEX value; convert to RGBA
        rgb = CP.HEX2RGB(value.substr(1));
        let opacity = document.getElementById('dropShadowOpacity').value;
        str = "RGBA(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + opacity + ")";
    } else {
        if (value.startsWith("RGBA")) {
            rgb = value.substr(5).slice(0, -1).split(",");
            document.getElementById('dropShadowOpacity').value = rgb[3];
        } else {
            rgb = value.substr(4).slice(0, -1).split(",");
        }
        str = "#" + CP.RGB2HEX(rgb);
        updateSliderValue();
    }

    return str;
}

function getStyle(className) {
    let classes = document.styleSheets[1].rules || document.styleSheets[1].cssRules;
    // Go backwards to ensure you get the strongest match
    for (let i = classes.length; i > 0; i--) {
        if (classes[i-1].selectorText.endsWith(className)) {
            return classes[i-1];
        }
    }
}
