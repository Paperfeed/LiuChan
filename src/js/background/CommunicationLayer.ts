/// <reference path="../../../node_modules/chrome-extension-async/chrome-extension-async.d.ts" />

import CreateProperties = chrome.contextMenus.CreateProperties;
import Window = chrome.windows.Window;
import NotificationOptions = chrome.notifications.NotificationOptions;
import BadgeBackgroundColorDetails = chrome.browserAction.BadgeBackgroundColorDetails;
import TabIconDetails = chrome.browserAction.TabIconDetails;
import BadgeTextDetails = chrome.browserAction.BadgeTextDetails;
import Tab = chrome.tabs.Tab;



export class CommunicationLayer {
    
    static addListener(namespace: string, event: string, callback: Function): void {
        chrome[namespace][event].addListener(callback);
    }
    
    
    static removeListener(namespace: string, event: string, fn: Function): void {
        chrome[namespace][event].removeListener(fn);
    }
    
    
    static setIcon(path: TabIconDetails): void {
        chrome.browserAction.setIcon(path);
    }
    
    
    static setBadgeText(text: BadgeTextDetails) {
        chrome.browserAction.setBadgeText(text);
    }
    
    
    static setBadgeBackgroundColor(color: BadgeBackgroundColorDetails) {
        chrome.browserAction.setBadgeBackgroundColor(color);
    }
    
    
    static async sendMessage(tabId: number, message: Object): Promise<void> {
        // TODO REMOVE DEBUG
        if (tabId === undefined) console.error('received undefined tabid', CommunicationLayer.sendMessage.caller);
        await chrome.tabs.sendMessage(tabId, message);
    }
    
    
    static async runtimeSendMessage(message: Object): Promise<void> {
        await chrome.runtime.sendMessage(message);
    }
    
    
    static async sendMessageToAllTabs(message: Object): Promise<void> {
        const windows = await CommunicationLayer.getAllWindows();
        
        windows.forEach((window) => {
            for (let i = 0, len = window.tabs.length; i < len; i++) {
                this.sendMessage(window.tabs[i].id, message);
            }
        });
    }
    
    
    static async getAllWindows(): Promise<Window[]> {
        return new Promise<Window[]>((resolve) => {
            chrome.windows.getAll({ populate: true },
                (windows) => {
                    resolve(windows)
                }
            );
        });
    }
    
    
    static createContextMenu(menu: CreateProperties) {
        chrome.contextMenus.create(menu);
    }
    
    
    static async getCurrentTab(): Promise<Tab> {
        const currentTab = await new Promise<Tab[]>((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true },
                (tabs) => resolve(tabs));
        });
        
        return currentTab[0];
    }
    
    
    static createNotification(options: NotificationOptions): void {
        chrome.notifications.create(options);
    }
    
    
}