import { CommunicationLayer } from './CommunicationLayer';
import { Dictionary } from './Dictionary';
import { Omnibox } from './Omnibox';
import { ContentOptions } from '../content/LiuChanContent';


// Type reference
import Tab = chrome.tabs.Tab;
import TabActiveInfo = chrome.tabs.TabActiveInfo;



const CURRENT_VERSION = "1.1.0";



export interface LiuChanOptions {
    content: ContentOptions;
    hanziType: string;
    pinyinType: string;
    definitionSeparator: string;
    useHanziToneColors: boolean;
    usePinyinToneColors: boolean;
    lineEnding: string;
    copySeparator: string;
    maxClipCopyEntries: number;
    ttsDialect: string;
    ttsSpeed: number;
    useCustomTones: boolean;
    customTones: string[];
    version?: string;
}



export class LiuChan {
    protected isEnabled: boolean;
    public config: LiuChanOptions;
    public dict: Dictionary;
    private omnibox: Omnibox;
    
    
    constructor() {
        this.isEnabled = false;
        
        this.messageHandler = this.messageHandler.bind(this);
        this.onConfigChange = this.onConfigChange.bind(this);
        this.toggleExtension = this.toggleExtension.bind(this);
        this.onWindowChangeFocus = this.onWindowChangeFocus.bind(this);
        this.onTabSelect = this.onTabSelect.bind(this);
        
        this.initConfig();
        
        // Add contextMenu
        CommunicationLayer.createContextMenu({
            title: 'Notepad',
            contexts: ['browser_action'],
            onclick: this.openNotepad
        });
        
        // Set extension icon
        chrome.browserAction.setIcon({
            "path": "../images/toolbar-disabled.png"
        });
        
    }
    
    
    async initConfig() {
        const defaultConfig = {
            content: {
                highlightText: true,
                highlightInput: false,
                showOnKey: 0,
                disableKeys: false,
                displayHelp: true,
                popup: {
                    popupTheme: 'liuchan',
                    popupDelay: 0,
                    scaleOnZoom: true,
                    useCustomization: false,
                    customStyling: {
                        customColors: ["#ffffe0", "#d7d3af", "RGBA(0,8,8,0.1)"],
                        borderThickness: 2,
                        borderRadius: 8
                    }
                },
                notepad: {
                    text: 'This notepad will automatically save its contents and sync with your Chrome account ' +
                        '(if you use sync!).\n\n' +
                        'You can drag the notepad around and resize the text area.',
                    pinned: false
                }
            },
            hanziType: 'boths',
            pinyinType: 'tonemarks',
            definitionSeparator: 'num',
            useHanziToneColors: true,
            usePinyinToneColors: false,
            lineEnding: 'n',
            copySeparator: 'tab',
            maxClipCopyEntries: 7,
            ttsDialect: "zh-CN",
            ttsSpeed: 0.9,
            useCustomTones: false,
            customTones: ["#f2777a", "#99cc99", "#6699cc", "#cc99cc", "#cccccc", "#66cccc"],
            version: CURRENT_VERSION
        };
        
        chrome.storage.sync.get(defaultConfig, (storedSettings) => {
            // Ensure users don't lose their customized settings after updated where stuff has been changed around.
            if (storedSettings.version !== CURRENT_VERSION) {
                console.log("Liuchan has been updated; Attempting to convert old settings");
                // Get ALL items from storage and compare them to the default config, reassigning old values to
                // new keys where appropriate.
                chrome.storage.sync.get(null, (outdatedSettings) => {
                    storedSettings = defaultConfig;
                    for (let key in outdatedSettings) {
                        // if (!items.hasOwnProperty(key)) {console.log(key);} // for DEBUG purposes
                        switch (key) {
                            case "showOnKey":
                                const str = outdatedSettings.showOnKey;
                                if (str === "Ctrl") {
                                    storedSettings.showOnKey = 1;
                                } else if (str === "Alt") {
                                    storedSettings.showOnKey = 2;
                                } else if (str === "CtrlAlt") {
                                    storedSettings.showOnKey = 3;
                                } else {
                                    storedSettings.showOnKey = 0;
                                }
                                break;
                            case "doColors":
                                storedSettings.useHanziToneColors = outdatedSettings.doColors;
                                break;
                            case "doPinyinColors":
                                storedSettings.usePinyinToneColors = outdatedSettings.doPinyinColors;
                                break;
                            case "miniHelp":
                                storedSettings.displayHelp = outdatedSettings.miniHelp;
                                break;
                            case "numdef":
                                storedSettings.definitionSeparator = outdatedSettings.numdef;
                                break;
                            case "pinyin":
                                storedSettings.pinyinType = outdatedSettings.pinyin;
                                break;
                            case "showHanzi":
                                storedSettings.hanziType = outdatedSettings.showHanzi;
                                break;
                            case "useCustomTone":
                                storedSettings.useCustomTones = outdatedSettings.useCustomTone;
                                break;
                            default:
                                if (storedSettings.hasOwnProperty(key)) {
                                    storedSettings[key] = outdatedSettings[key];
                                }
                        }
                        storedSettings.version = CURRENT_VERSION;
                        this.config = storedSettings as LiuChanOptions;
                    }
                    // Empty storage to get rid of deprecated keys and save the new updated list
                    chrome.storage.sync.clear(() => {
                        chrome.storage.sync.set(storedSettings, () => {
                            console.log("Succesfully converted and saved settings!")
                        });
                    });
                });
            } else {
                // Init any keys that don't exist yet with default values, then assign to LiuChan.config
                this.config = Object.assign(defaultConfig, storedSettings);
                chrome.storage.sync.set(this.config);
            }
        });
    }
    
    
    async toggleExtension(): Promise<void> {
        // Entry point for when extension's button is clicked
        // Toggle addon on or off
        if (this.isEnabled) /* then disable */ {
            // Tell all tabs to disable themselves
            CommunicationLayer.sendMessageToAllTabs({ "type": "disable" });
            CommunicationLayer.removeListener('omnibox', 'onInputChanged', this.omnibox.fuzzysearch);
            
            
            // Clean up memory
            this.isEnabled = false;
            this.dict.unloadDictionary();
            
            
            CommunicationLayer.setIcon({ "path": "../images/toolbar-disabled.png" });
            CommunicationLayer.setBadgeBackgroundColor({ "color": [0, 0, 0, 0] });
            CommunicationLayer.setBadgeText({ "text": "" });
            
            
        } else /* if disabled, then enable */ {
            
            // Check if the content script is actually running and let the user know the tab needs to be reloaded if not.
            const currentTab = await CommunicationLayer.getCurrentTab();
            
            
            // Enable extension
            if (!this.dict) {
                try {
                    this.dict = new Dictionary("data/cedict_ts.u8", this.config);
                } catch (e) {
                    alert('Error loading dictionary: ' + e);
                }
            }
            
            
            // TODO Fix fuzzysearch
            this.omnibox = new Omnibox(this);
            CommunicationLayer.addListener('omnibox', 'onInputChanged', this.omnibox.fuzzysearch);
            //chrome.omnibox.onInputEntered.addListener(text => { //Do sth on enter });
            
            
            await this.dict.loadDictionary();
            this.isEnabled = true;
            
            
            // Set extension icon
            chrome.browserAction.setIcon({ "path": "../images/toolbar-enabled.png" });
            
            
            // Try to enable current tab - Show message if it needs to be reloaded
            try {
                await CommunicationLayer.sendMessage(currentTab.id, { type: 'heartbeat' });
            } catch (e) {
                CommunicationLayer.createNotification({
                    type: 'basic', iconUrl: 'images/icon128.png',
                    title: 'Liuchan - Please reload this tab',
                    message: 'Oops! You will need to reload this tab before Liuchan can work its ' +
                        'magic! \n\nThis is only necessary on tabs that were open before Liuchan was installed :)'
                });
            }
        }
    }
    
    
    onConfigChange(changes: object, areaName: string) {
        console.log('config change', changes, areaName);
        console.log('config');
        CommunicationLayer.sendMessageToAllTabs({
            'type': 'initialize',
            'enabled': this.isEnabled,
            'config': this.config.content
        });
    }
    
    
    async onWindowChangeFocus(windowId): Promise<void> {
        if (windowId !== -1) {
            const currentTab = await CommunicationLayer.getCurrentTab();
            
            this.onTabSelect(currentTab);
        }
    }
    
    
    // The callback for chrome.tabs.onActivated
    // Sends a message to the tab to enable itself if it hasn't
    onTabSelect(tab: Tab | TabActiveInfo): void {
        const id = (<Tab>tab).id || (<TabActiveInfo>tab).tabId;
        
        // TODO optimise messaging
        /*
        if (this.isEnabled) {
            CommunicationLayer.sendMessage(id, {
                "type": "enable",
                "config": this.config.content
            });
        }*/
        
        CommunicationLayer.sendMessage(id, {
            "type": "update",
            "notepad": this.config.content.notepad
        });
    }
    
    
    async openNotepad() {
        const currentTab = await CommunicationLayer.getCurrentTab();
        CommunicationLayer.sendMessage(currentTab.id,
            { "type": "notepad" });
    }
    
    
    copyToClip(tab, entry) {
        if (entry.length === 0) return null;
        
        let text = '', sep, end;
        
        switch (this.config.copySeparator) {
            case "tab":
                sep = '\t';
                break;
            default:
                sep = this.config.copySeparator;
        }
        
        switch (this.config.lineEnding) {
            case "r":
                end = "\r";
                break;
            case "rn":
                end = "\r\n";
                break;
            default:
                end = "\n";
        }
        
        // TODO support custom separator
        const pinyinType = this.config.pinyinType;
        const maxLoops = Math.min(this.config.maxClipCopyEntries, entry[0].data.length);
        for (let i = 0; i < maxLoops; i++) {
            text += entry[0].data[i].simp + sep +
                entry[0].data[i].trad + sep +
                entry[0].data[i].pinyin[pinyinType] + sep +
                entry[0].data[i].def.join("; ") + end;
            //this.dict.parseDefinitions(entry[0].data[i].def).replace(/<\/?b>/g, "") + end;
        }
        
        // @ts-ignore
        document.oncopy = (event) => {
            event.clipboardData.setData("Text", text);
            event.preventDefault();
        };
        
        document.execCommand("Copy");
        
        // @ts-ignore
        document.oncopy = undefined;
        CommunicationLayer.sendMessage(tab.id, {
            "type": "showPopup",
            "text": '<div class="def">Copied to clipboard.</div>'
        });
    }
    
    
    messageHandler(message, sender, response) {
        console.log('[BACKGROUND]Received message', message, sender);
        
        switch (message.type) {
            case 'initialize':
                response({
                    'type': 'initialize',
                    'enabled': this.isEnabled,
                    'config': this.config.content
                });
                break;
            case 'xsearch':
                response(this.dict.search(message.text));
                break;
            case 'makehtml':
                let html = this.dict.makeHtml(message.entry);
                response(html);
                break;
            case 'copyToClip':
                this.copyToClip(sender.tab, message.entry);
                break;
            /*case 'config':
                // Immediately update settings upon change occuring
                this.config = Object.assign(this.config, message.config);
                break;*/
            case 'toggleDefinition':
                this.dict.toggleDefinition();
                break;
            case 'tts':
                // mandarin: zh-CN, zh-TW cantonese: zh-HK
                chrome.tts.speak(message.text, {
                    "lang": this.config.ttsDialect,
                    "rate": this.config.ttsSpeed
                });
                break;
            case 'rebuild':
                this.dict.loadDictionary();
                break;
            case 'customstyling':
                response(this.config.content.popup.customStyling);
                break;
            case 'notepad':
                if (message.load) {
                    response(this.config.content.notepad);
                } else {
                    chrome.storage.sync.set({ notepad: message.query });
                    this.config.content.notepad = message.query;
                }
                break;
            case 'SIGN_CONNECT':
                break;
            default:
                console.log('Background received unknown request: ', message);
        }
    }
}

