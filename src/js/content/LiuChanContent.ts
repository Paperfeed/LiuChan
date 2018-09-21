import { Notepad } from './Notepad';
import { Popup, PopupConfig } from './Popup';



export interface ContentOptions {
    highlightInput: boolean;
    highlightText: boolean;
    showOnKey: number;
    disableKeys: boolean;
    popup: PopupConfig;
}



class LiuChanContent {
    private altView: number;
    private config: ContentOptions;
    private enabled: boolean;
    private lastTarget: number;
    private inputActive: boolean;
    private lastFound: any;
    private keysDown: any;
    private mDown: any;
    private isVisible: any;
    private lastPos: any;
    private prevTime: number;
    private lastSelEnd: any[];
    private lastRo: number;
    private notepad: Notepad;
    private oldTA: any;
    private prevSelView: any;
    private selText: string;
    private oldCaret: number;
    private kanjiChar: null;
    private prevTarget: any;
    private popup: Popup;
    private uofsNext: number;
    private uofs: number;
    private prevRangeOfs: number;
    private prevRangeNode: any;
    
    
    constructor() {
        this.altView = 0;
        this.enabled = false;
        this.lastTarget = null;
        this.inputActive = false;
        this.lastFound = null;
        this.keysDown = [];
        this.mDown = false;
        this.isVisible = false;
        this.lastPos = {
            x: null,
            y: null
        };
        this.lastSelEnd = []; // Hack because SelEnd can't be sent in messages
        this.lastRo = 0; // Hack because ro was coming out always 0 for some reason.
        
        this.messageHandler = this.messageHandler.bind(this);
        
        chrome.runtime.onMessage.addListener(this.messageHandler);
        // When a page first loads, check to see if it should enable the content script
        chrome.runtime.sendMessage({ "type": "enable?", "enabled": this.enabled });
    }
    
    
    messageHandler(message, sender, response) {
        switch (message.type) {
            case 'enable':
                if (message.config) this.config = message.config;
                if (!this.enabled) {
                    this.enableTab();
                } else {
                    this.updateTheme();
                }
                if (message.displayHelp) this.popup.showPopup(message.displayHelp);
                break;
            case 'disable':
                this.disableTab();
                break;
            case 'showPopup':
                this.popup.showPopup(message.text);
                break;
            case 'notepad':
                if (this.notepad) {
                    this.notepad.toggleOverlay();
                } else {
                    this.config.popup.popupTheme = message.theme;
                    this.notepad = new Notepad();
                }
                break;
            case 'update':
                if (this.notepad) {
                    this.notepad.updateState(message.notepad);
                }
                break;
            case 'heartbeat':
                response({ 'alive': true });
                break;
            default:
                console.log('Contentscript received unknown request: ', message);
        }
        
        return Promise.resolve();
        
    }
    
    
    enableTab() {
        // Add the listeners and create and insert popup element and stylesheet
        
        // Store current active input - this is for not messing with user's highlighted text
        if (document.activeElement.nodeName === 'TEXTAREA' || document.activeElement.nodeName === 'INPUT') {
            this.oldTA = document.activeElement;
        }
        
        // This timer acts as a 20ms delay between mousemove and update of popup to prevent excessive CPU strain
        // Set initial value to 999 so that it actually trips and updates
        this.prevTime = 999;
        this.keysDown[0] = 0;
        this.popup = new Popup(this.config.popup);
        
        // Bind function and set class' function reference, otherwise removeEventListener won't work
        // (this is because .bind creates a new reference to the function)
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        
        window.addEventListener('keydown', this.onKeyDown, true);
        window.addEventListener('keyup', this.onKeyUp, true);
        window.addEventListener('mousemove', this.onMouseMove, false);
        window.addEventListener('mousedown', this.onMouseDown, false);
        window.addEventListener('mouseup', this.onMouseUp, false);
        window.onresize = this.popup.setZoomLevel;
        
        this.enabled = true;
    }
    
    
    disableTab() {
        // Remove listeners
        window.removeEventListener('keydown', this.onKeyDown, true);
        window.removeEventListener('keyup', this.onKeyUp, true);
        window.removeEventListener('mousemove', this.onMouseMove, false);
        window.removeEventListener('mousedown', this.onMouseDown, false);
        window.removeEventListener('mouseup', this.onMouseUp, false);
        window.onresize = null;
        
        // Remove stylesheet and popup div
        const css = document.getElementById('liuchan-css');
        const popup = document.getElementById('liuchan-window');
        
        if (css) css.parentNode.removeChild(css);
        if (popup) popup.parentNode.removeChild(popup);
        
        // Clear any highlighted text left by Liuchan
        this.clearHighlight();
        
        this.enabled = false;
    }
    
    
    updateTheme() {
        const popup = window.document.getElementById("liuchan-window");
        const css = window.document.getElementById("liuchan-css");
        if (css) {
            const href = chrome.extension.getURL('css/popup-' + this.config.popup.popupTheme + '.css');
            if (css.getAttribute('href') !== href) {
                css.setAttribute('href', href);
            }
        }
        
        if (popup) {
            this.popup.setCustomStyling();
        }
    }
    
    
    clearHighlight() {
        if (!this.prevSelView) return;
        if (this.prevSelView.closed) {
            this.prevSelView = null;
            return;
        }
        
        let sel = this.prevSelView.getSelection();
        // If there is an empty selection or the selection was done by Liuchan then we'll clear it
        if ((!sel.toString()) || (this.selText === sel.toString())) {
            // In the case of no selection we clear the oldTA. The reason for this is because if there's no
            // selection we probably clicked somewhere else and we don't want to bounce back.
            if (!sel.toString())
                this.oldTA = null;
            
            // Clear all selections
            sel.removeAllRanges();
            // Text area stuff.
            // If oldTA is still around that means we had a highlighted region which we just cleared and now we're
            // going to jump back to where we were the cursor was before our lookup.
            // If oldCaret is less than 0 it means we clicked outside the box and shouldn't come back
            if (this.oldTA && this.oldCaret >= 0) {
                this.oldTA.selectionStart = this.oldTA.selectionEnd = this.oldCaret;
            }
        }
        this.prevSelView = null;
        this.kanjiChar = null;
        this.selText = null;
    }
    
    
    activeElementIsInput() {
        //var expr = /radio|checkbox|undefined|file|range|week|month|submit|reset|number|date/;
        const expr = /text|email|password|search|tel|url|number/;
        return expr.test((<HTMLInputElement>document.activeElement).type);
    }
    
    
    onKeyDown(ev) {
        // If key is being held already, return
        if (this.keysDown[ev.keyCode]) return;
        
        // If user has selected an input, disable hotkeys
        if (this.inputActive) return;
        
        this.modifierCheck(ev);
        
        // This only runs if popup hotkeys are enabled and popup is visible
        if (!this.config.disableKeys && this.popup.isVisible) {
            switch (ev.key) {
                case "Escape":
                    this.popup.hidePopup();
                    this.clearHighlight();
                    break;
                case "a":
                    this.popup.location = (this.popup.location + 1) % 3;
                    this.show(ev.currentTarget.liuchan);
                    break;
                case "c":
                    // TODO save to wordlist
                    chrome.runtime.sendMessage({
                        "type": "copyToClip",
                        "entry": this.lastFound
                    });
                    break;
                case "b":
                    let ofs = ev.currentTarget.liuchan.uofs;
                    for (let i = 50; i > 0; --i) {
                        ev.currentTarget.liuchan.uofs = --ofs;
                        if (this.show(ev.currentTarget.liuchan) >= 0) {
                            if (ofs >= ev.currentTarget.liuchan.uofs) break;
                        }
                    }
                    break;
                case "d":
                    chrome.runtime.sendMessage({
                        "type": "toggleDefinition"
                    });
                    this.show(ev.currentTarget.liuchan);
                    break;
                case "m":
                    ev.currentTarget.liuchan.uofsNext = 1;
                // Fallthrough on purpose
                case "n":
                    for (let i = 50; i > 0; --i) {
                        ev.currentTarget.liuchan.uofs += ev.currentTarget.liuchan.uofsNext;
                        if (this.show(ev.currentTarget.liuchan) >= 0) break;
                    }
                    break;
                case "y":
                    this.altView = 0;
                    ev.currentTarget.liuchan.popY += 20;
                    this.show(ev.currentTarget.liuchan);
                    break;
                case "t":
                    chrome.runtime.sendMessage({
                        "type": "tts",
                        "text": this.lastFound[0].data[0].trad
                    });
                    break;
                default:
                    return;
            }
            this.keysDown[ev.keyCode] = 1;
        }
    }
    
    
    onKeyUp(ev) {
        if (this.keysDown[ev.keyCode]) this.keysDown[ev.keyCode] = 0;
        
        this.modifierCheck(ev);
        
        if (this.keysDown[0] !== this.config.showOnKey) {
            this.clearHighlight();
            this.popup.hidePopup();
        }
        
        this.inputActive = this.activeElementIsInput();
    }
    
    
    modifierCheck(ev) {
        // Set modifier keys as 'flag' in keysDown[0].
        // Popup will show based on stored combination (0 = none, 1 = ctrl, 2 = alt, 3 = ctrl+alt and so on)
        this.keysDown[0] = 0;
        if (ev.ctrlKey) this.keysDown[0] += 1;
        if (ev.altKey) this.keysDown[0] += 2;
        if (ev.shiftKey) this.keysDown[0] += 4;
    }
    
    
    onMouseDown(ev) {
        if (ev.button !== 0) {
            return;
        }
        if (this.isVisible) {
            this.clearHighlight();
        }
        this.mDown = true;
        
        this.inputActive = this.activeElementIsInput();
        
        // If we click outside of a text box then we set oldCaret to -1 as an indicator not to restore position.
        // Otherwise, we switch our saved textarea to where we just clicked
        if (!('form' in ev.target))
            this.oldCaret = -1;
        else
            this.oldTA = ev.target;
    }
    
    
    onMouseUp(ev) {
        if (ev.button !== 0)
            return;
        this.mDown = false;
    }
    
    
    onMouseMove(ev) {
        // Delay to reduce CPU strain
        if ((new Date().getTime() - this.prevTime) > 20) {
            this.prevTime = new Date().getTime();
            this.lastPos.x = ev.clientX;
            this.lastPos.y = ev.clientY;
            this.lastTarget = ev.target;
            this.tryUpdatePopup(ev);
        }
    }
    
    
    tryUpdatePopup(ev) {
        const range = document.caretRangeFromPoint(ev.clientX, ev.clientY);
        if (range === null) return;
        
        const { startContainer, startOffset } = range;
        if ((<any>startContainer).data === undefined) return;
        (<any>startContainer).data.substr(startOffset);
    }
    
    
    /*tryUpdatePopup(ev) {
        // Don't show or update if modifier keys are not pressed (if configured by user)
        if (this.config.showOnKey) {
            if (this.keysDown[0] !== this.config.showOnKey && (!this.isVisible)) return;
        }

        let fake;
        const range = document.caretRangeFromPoint(ev.clientX, ev.clientY);

        if (range == null) return;
        let rp = range.startContainer,
            ro = range.startOffset;
        // Put this in a try catch so that an exception here doesn't prevent editing due to div
        try {
            if (ev.target.nodeName === 'TEXTAREA' || ev.target.nodeName === 'INPUT') {
                fake = this.makeFake(ev.target);
                document.body.appendChild(fake);
            }

            // This is to account for bugs in caretRangeFromPoint.
            // It includes the fact that it returns text nodes over non text nodes
            // and also the fact that it miss the first character of inline nodes

            // If the range offset is equal to the node data length
            // then we have the second case and need to correct
            if ((rp.data) && ro === rp.data.length) {
                // A special exception is the WBR tag which is inline but doesn't
                // contain text.
                if ((rp.nextSibling) && (rp.nextSibling.nodeName === 'WBR')) {
                    rp = rp.nextSibling.nextSibling;
                    ro = 0;
                }
                // If we're to the right of an inline character we can use the target.
                // However, if we're just in a blank spot don't do anything
                else if (this.isInline(ev.target)) {
                    if (rp.parentNode !== ev.target && !(fake && (<HTMLElement>rp.parentNode).innerText === ev.target.value)) {
                        rp = ev.target.firstChild;
                        ro = 0;
                    }
                }
                // Otherwise we're on the right and can take the next sibling of the
                // inline element
                else {
                    rp = rp.parentNode.nextSibling;
                    ro = 0;
                }
            }

            // The case where the before div is empty so the false spot is in the parent
            // but we should be able to take the target.
            // The 1 seems random but it actually represents the preceding empty tag
            // also we don't want it to mess up with our fake div.
            // Also, form elements don't seem to fall into this case either
            if (!fake && !('form' in ev.target) && rp && rp.parentNode !== ev.target && ro === 1) {
                rp = this.getFirstTextChild(ev.target);
                ro = 0;
            }
            // Otherwise, we're off in nowhere land and we should go home.
            // Offset should be 0 or max in this case
            else if (!fake && (!rp || rp.parentNode !== ev.target)) {
                rp = null;
                ro = -1;

            }

            // For text nodes do special stuff:
            // 1) we make rp the text area and keep the offset the same
            // 2) we give the text area data so it can act normal
            if (fake) {
                rp = ev.target;
                rp.data = rp.value;
                const newRange = document.caretRangeFromPoint(ev.clientX, ev.clientY);
                ro = newRange.startOffset;
            }

            if (ev.target === this.prevTarget && this.isVisible) {
                if (this.title) {
                    if (fake) document.body.removeChild(fake);
                    return;
                }
                if ((rp === this.prevRangeNode) && (ro === this.prevRangeOfs)) {
                    if (fake) document.body.removeChild(fake);
                    return;
                }
            }

            if (fake) document.body.removeChild(fake);
        } catch (err) {
            console.log(err.message);
            if (fake) document.body.removeChild(fake);
            return;
        }

        tdata.prevTarget = ev.target;
        tdata.prevRangeNode = rp;
        tdata.prevRangeOfs = ro;
        tdata.title = null;
        tdata.uofs = 0;
        this.uofsNext = 1;

        if (rp && rp.data && ro < rp.data.length) {
            tdata.popX = ev.clientX;
            tdata.popY = ev.clientY;
            if (this.config.popupDelay > 0) {
                clearTimeout(tdata.timer);
                tdata.timer = setTimeout(() => {
                    this.show(tdata);
                }, this.config.popupDelay);
            } else {
                this.show(tdata);
            }
            return;
        }

        if ((typeof(ev.target.title) === 'string') && (ev.target.title.length)) {
            tdata.title = ev.target.title;
        } else if ((typeof(ev.target.alt) === 'string') && (ev.target.alt.length)) {
            tdata.title = ev.target.alt;
        }

        // FF3
        if (ev.target.nodeName === 'OPTION') {
            tdata.title = ev.target.text;
        } else if (ev.target.nodeName === 'SELECT' && ev.target.options[ev.target.selectedIndex]) {
            tdata.title = ev.target.options[ev.target.selectedIndex].text;
        }

        // Don't close just because we moved from a valid popup slightly over to a place with nothing
        const dx = tdata.popX - ev.clientX,
            dy = tdata.popY - ev.clientY,
            distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 4) {
            this.clearHighlight();
            this.hidePopup();
        }
    }*/
    
    
    show(tdata) {
        this.isVisible = true;
        
        let rp = tdata.prevRangeNode,
            ro = tdata.prevRangeOfs + tdata.uofs,
            u;
        
        tdata.uofsNext = 1;
        if ((!rp) || (ro < 0) || (ro >= rp.data.length)) {
            this.clearHighlight();
            this.popup.hidePopup();
            return 0;
        }
        
        // if we have '   XYZ', where whitespace is compressed, X never seems to get selected
        while (((u = rp.data.charCodeAt(ro)) === 32) || (u === 9) || (u === 10)) {
            ++ro;
            if (ro >= rp.data.length) {
                this.clearHighlight();
                this.popup.hidePopup();
                return 0;
            }
        }
        
        if ((isNaN(u)) || !this.inLanguageRange(u)) {
            this.clearHighlight();
            this.popup.hidePopup();
            return -2;
        }
        
        //selection end data
        let selEndList = [],
            text = this.getTextFromRange(rp, ro, selEndList, 20 /*maxlength*/);
        
        this.lastSelEnd = selEndList;
        this.lastRo = ro;
        
        chrome.runtime.sendMessage({
            "type": "xsearch",
            "text": text
        }, result => this.processEntry(result));
        
        return 1;
    }
    
    
    isInline(node) {
        const inlineNames = {
            // text node
            '#text': true,
            
            // font style
            'FONT': true,
            'TT': true,
            'I': true,
            'B': true,
            'BIG': true,
            'SMALL': true,
            //deprecated
            'STRIKE': true,
            'S': true,
            'U': true,
            
            // phrase
            'EM': true,
            'STRONG': true,
            'DFN': true,
            'CODE': true,
            'SAMP': true,
            'KBD': true,
            'VAR': true,
            'CITE': true,
            'ABBR': true,
            'ACRONYM': true,
            
            // special, not included IMG, OBJECT, BR, SCRIPT, MAP, BDO
            'A': true,
            'Q': true,
            'SUB': true,
            'SUP': true,
            'SPAN': true,
            'WBR': true,
            
            // ruby
            'RUBY': true,
            'RBC': true,
            'RTC': true,
            'RB': true,
            'RT': true,
            'RP': true
        };
        
        return node.nodeType === Node.COMMENT_NODE ||
            inlineNames.hasOwnProperty(node.nodeName) ||
            // Only check styles for elements.
            // Comments do not have getComputedStyle method
            (document.nodeType === Node.ELEMENT_NODE &&
                (document.defaultView.getComputedStyle(node, null).getPropertyValue('display') === 'inline' ||
                    document.defaultView.getComputedStyle(node, null).getPropertyValue('display') === 'inline-block')
            );
    }
    
    
    getInlineText(node, selEndList, maxLength, xpathExpr) {
        // Gets text from a node
        // returns a string
        // node: a node
        // selEnd: the selection end object will be changed as a side effect
        // maxLength: the maximum length of returned string
        // xpathExpr: an XPath expression, which evaluates to text nodes, will be evaluated
        // relative to "node" argument
        if (node.nodeType === Node.COMMENT_NODE) {
            return '';
        }
        
        let text = '',
            endIndex;
        
        if (node.nodeName === '#text') {
            endIndex = Math.min(maxLength, node.data.length);
            selEndList.push({
                node: node,
                offset: endIndex
            });
            return node.data.substring(0, endIndex);
        }
        
        const result = xpathExpr.evaluate(node, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        
        while ((text.length < maxLength) && (node = result.iterateNext())) {
            endIndex = Math.min(node.data.length, maxLength - text.length);
            text += node.data.substring(0, endIndex);
            selEndList.push({
                node: node,
                offset: endIndex
            });
        }
        
        return text;
    }
    
    
    getNext(node) {
        // given a node which must not be null,
        // returns either the next sibling or next sibling of the father or
        // next sibling of the fathers father and so on or null
        let nextNode;
        
        if ((nextNode = node.nextSibling) !== null)
            return nextNode;
        if (((nextNode = node.parentNode) !== null) && this.isInline(nextNode))
            return this.getNext(nextNode);
        
        return null;
    }
    
    
    getTextFromRange(rangeParent, offset, selEndList, maxLength) {
        // XPath expression which evaluates to a boolean. If it evaluates to true
        // then liuchan will not start looking for text in this text node
        // ignore text in RT elements
        const startElementExpr = 'boolean(parent::rp or ancestor::rt)';
        
        // XPath expression which evaluates to text nodes tells Liuchan which text to translate expression to get all
        // text nodes that are not in (RP or RT) elements
        const textNodeExpr = 'descendant-or-self::text()[not(parent::rp) and not(ancestor::rt)]';
        
        let endIndex, text = '';
        
        if (rangeParent.nodeName === 'TEXTAREA' || rangeParent.nodeName === 'INPUT') {
            endIndex = Math.min(rangeParent.data.length, offset + maxLength);
            return rangeParent.value.substring(offset, endIndex);
        }
        
        const xpathExpr = rangeParent.ownerDocument.createExpression(textNodeExpr, null);
        
        if (rangeParent.ownerDocument.evaluate(startElementExpr, rangeParent, null, XPathResult.BOOLEAN_TYPE, null).booleanValue)
            return '';
        
        if (rangeParent.nodeType !== Node.TEXT_NODE)
            return '';
        
        endIndex = Math.min(rangeParent.data.length, offset + maxLength);
        text += rangeParent.data.substring(offset, endIndex);
        selEndList.push({
            node: rangeParent,
            offset: endIndex
        });
        
        let nextNode = rangeParent;
        while (((nextNode = this.getNext(nextNode)) !== null) && (this.isInline(nextNode)) && (text.length < maxLength))
            text += this.getInlineText(nextNode, selEndList, maxLength - text.length, xpathExpr);
        
        return text;
    }
    
    
    inLanguageRange(u) {
        return (u >= 0x4E00) && (u <= 0x9FFF);
    }
    
    
    processEntry(e) {
        let ro = this.lastRo,
            selEndList = this.lastSelEnd;
        
        if (!e) {
            this.popup.hidePopup();
            this.clearHighlight();
            return -1;
        }
        this.lastFound = [e];
        
        if (!e.matchLen) e.matchLen = 1;
        this.uofsNext = e.matchLen;
        this.uofs = (ro - this.prevRangeOfs);
        
        let rp = this.prevRangeNode;
        // Don't try to highlight form elements
        // TODO Fix the highlighting and fake elements
        if ((rp) && ((!this.inputActive && this.config.highlightText && !this.mDown && !('form' in this.prevTarget)) ||
            (!this.inputActive && ('form' in this.prevTarget) && this.config.highlightInput === true))) {
            const doc = rp.ownerDocument;
            if (!doc) {
                this.clearHighlight();
                this.popup.hidePopup();
                return 0;
            }
            this.highlightMatch(doc, rp, ro, e.matchLen, selEndList);
            this.prevSelView = doc.defaultView;
        }
        
        chrome.runtime.sendMessage({
            "type": "makehtml",
            "entry": e
        }, result => this.processHtml(result));
    }
    
    
    processHtml(html) {
        this.popup.showPopup(html, this.prevTarget);
    }
    
    
    highlightMatch(doc, rp, ro, matchLen, selEndList) {
        const sel = doc.defaultView.getSelection();
        
        // If selEndList is empty then we're dealing with a textarea/input situation
        if (selEndList.length === 0) {
            try {
                if (rp.nodeName === 'TEXTAREA' || rp.nodeName === 'INPUT') {
                    
                    // If there is already a selected region not caused by Liuchan, leave it alone
                    if ((sel.toString()) && (this.selText !== sel.toString()))
                        return;
                    
                    if (document.activeElement === document.body) {
                        this.oldTA = rp;
                        rp.focus();
                    }
                    
                    // If there is no selected region and the saved textbox is the same as the current one then save
                    // the current cursor position. The second half of the condition lets us place the cursor in
                    // another text box without having it jump back
                    // TODO rewrite selection store/restore to handle all and any selections
                    if (!sel.toString() && this.oldTA === rp) {
                        this.oldCaret = rp.selectionStart;
                    }
                    rp.selectionStart = ro;
                    rp.selectionEnd = matchLen + ro;
                    
                    this.selText = rp.value.substring(ro, matchLen + ro);
                }
            } catch (err) {
                // If there is an error it is probably caused by the input type being not text.  This is the most
                // general way to deal with arbitrary types
                // We set oldTA to null because we don't want to do weird stuff with buttons
                this.oldTA = null;
                console.log(err.message);
            }
            return;
        }
        
        // Special case for leaving a text box.
        // Even if we're not currently in a text area we should save the last one we were in
        if (this.oldTA && !sel.toString() && this.oldCaret >= 0)
            this.oldCaret = this.oldTA.selectionStart;
        
        let selEnd,
            offset = matchLen + ro;
        
        for (let i = 0, len = selEndList.length; i < len; i++) {
            selEnd = selEndList[i];
            
            if (offset <= selEnd.offset) break;
            
            offset -= selEnd.offset;
        }
        
        const range = doc.createRange();
        try {
            range.setStart(rp, ro);
            range.setEnd(selEnd.node, offset);
        } catch (e) {
            // Sometimes during mouse-overs we get out of range
            return;
        }
        
        if ((sel.toString()) && (this.selText !== sel.toString()))
            return;
        sel.removeAllRanges();
        sel.addRange(range);
        this.selText = sel.toString();
    }
    
    
    getFirstTextChild(node) {
        return document.evaluate('descendant::text()[not(parent::rp) and not(ancestor::rt)]',
            node, null, XPathResult.ANY_TYPE, null).iterateNext();
    }
    
    
    makeFake(real) {
        const fake = document.createElement('div');
        const realRect = real.getBoundingClientRect();
        fake.innerText = real.value;
        fake.style.cssText = document.defaultView.getComputedStyle(real, "").cssText;
        fake.scrollTop = real.scrollTop;
        fake.scrollLeft = real.scrollLeft;
        fake.style.position = 'absolute';
        fake.style.zIndex = '2147483647';
        fake.style.top = (window.scrollY + realRect.top) + 'px';
        fake.style.left = (window.scrollX + realRect.left) + 'px';
        
        for (let i = 0; i < fake.style.length; ++i) {
            fake.style.setProperty(fake.style[i], fake.style.getPropertyValue(fake.style[i]), 'important');
        }
        
        return fake;
    }
    
}



const liuChanContent = new LiuChanContent();