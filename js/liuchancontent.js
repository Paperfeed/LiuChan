'use strict';

const lcxContent = {
    altView: 0,
    config: {},
    enabled: false,
    lastTarget: null,
    inputActive: false,
    lastFound: null,
    keysDown: [],
    mDown: false,
    isVisible: false,
    lastPos: {
        x: null,
        y: null
    },


    // Add the listeners and create and insert popup element and stylesheet
    enableTab: function () {
        if (window.liuchan === undefined || window.liuchan === null) {
            window.liuchan = {};

            // Store current active input - this is for not messing with user's highlighted text
            if (document.activeElement.nodeName === 'TEXTAREA' || document.activeElement.nodeName === 'INPUT') {
                window.liuchan.oldTA = document.activeElement;
            }

            // This timer acts as a 20ms delay between mousemove and update of popup to prevent excessive CPU strain
            // Set initial value to 999 so that it actually trips and updates
            this.prevTime = 999;
            this.keysDown[0] = 0;

            // Bind function and set class' function reference, otherwise removeEventListener won't work
            // (this is because .bind creates a new reference to the function)
            this.onKeyDown = this.onKeyDown.bind(this);
            this.onKeyUp = this.onKeyUp.bind(this);
            this.onMouseMove = this.onMouseMove.bind(this);
            this.onMouseDown = this.onMouseDown.bind(this);
            this.onMouseUp = this.onMouseUp.bind(this);
            this.setZoomLevel = this.setZoomLevel.bind(this);

            window.addEventListener('keydown', this.onKeyDown, true);
            window.addEventListener('keyup', this.onKeyUp, true);
            window.addEventListener('mousemove', this.onMouseMove, false);
            window.addEventListener('mousedown', this.onMouseDown, false);
            window.addEventListener('mouseup', this.onMouseUp, false);
            window.onresize = this.setZoomLevel;
        }

        // Create and append stylesheet
        const wd = window.document;
        const css = wd.createElementNS('http://www.w3.org/1999/xhtml', 'link');
        css.setAttribute('rel', 'stylesheet');
        css.setAttribute('type', 'text/css');
        css.setAttribute('href', chrome.extension.getURL('css/popup-' + this.config.popupTheme + '.css'));
        css.setAttribute('id', 'liuchan-css');
        wd.getElementsByTagName('head')[0].appendChild(css);

        // Create and append popup div
        const popup = wd.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        popup.setAttribute('id', 'liuchan-window');

        wd.documentElement.appendChild(popup);

        // Maintain proper position when scaling:
        popup.style.setProperty('transform-origin', '0 0', '');
        popup.style.setProperty('display', 'none', 'important');

        this.setCustomStyling(popup);
        this.setZoomLevel();

        this.enabled = true;
    },

    disableTab: function () {
        if (window.liuchan !== null) {
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
            delete window.liuchan;
        }
        this.enabled = false;
    },

    updateTheme: function () {
        const popup = window.document.getElementById("liuchan-window");
        const css = window.document.getElementById("liuchan-css");
        if (css) {
            const href = chrome.extension.getURL('css/popup-' + this.config.popupTheme + '.css');
            if (css.getAttribute('href') !== href) {
                css.setAttribute('href', href);
            }
        }

        if (popup) {
            this.setCustomStyling(popup);
        }
    },

    setCustomStyling: function (popup) {
        chrome.runtime.sendMessage({
            "type": "customstyling"
        }, customStyling => {
            if (customStyling.useCustomization) {
                const border = customStyling.borderThickness + "px solid " + customStyling.customColors[1];
                const boxshadow = customStyling.customColors[2] + " 4px 4px 0 0";
                popup.style.setProperty("background", customStyling.customColors[0], "important");
                popup.style.setProperty("border", border, "important");
                popup.style.setProperty("border-radius", customStyling.borderRadius + "px", "important");
                popup.style.setProperty("box-shadow", boxshadow, "important");
            } else {
                popup.style.setProperty("background", "", "");
                popup.style.setProperty("border", "", "");
                popup.style.setProperty("border-radius", "", "");
                popup.style.setProperty("box-shadow", "", "");
            }
        });
    },

    setZoomLevel: function () {
        const popup = window.document.getElementById("liuchan-window");
        const zoomLevel = window.devicePixelRatio * 100;

        // This functions scales the popup as the user zooms in order to make it seem as if it's not scaling. Yep.
        if (this.config.scaleOnZoom) {
            popup.style.setProperty("transform", "", "");
        } else {
            popup.style.setProperty("transform", "scale(" + (100 / zoomLevel) + ")", "");
        }
    },

    getContentType: function (tDoc) {
        const m = tDoc.getElementsByTagName('meta');
        for (let i in m) {
            if (m[i].httpEquiv === 'Content-Type') {
                let con = m[i].content;
                con = con.split(';');
                return con[0];
            }
        }
        return null;
    },

    showPopup: function (text, elem, x, y) {
        const wd = window.document;
        const popup = wd.getElementById('liuchan-window');

        if (isNaN(x) || isNaN(y)) {
            x = 0;
            y = 0;
        }

        if (this.getContentType(wd) === 'text/plain') {
            const df = document.createDocumentFragment();
            df.appendChild(document.createElementNS('http://www.w3.org/1999/xhtml', 'span'));
            df.firstChild.innerHTML = text;

            while (popup.firstChild) {
                popup.removeChild(popup.firstChild);
            }
            popup.appendChild(df.firstChild);
        } else {
            popup.innerHTML = text;
        }

        if (elem) {
            popup.style.setProperty('top', '-1000px', '');
            popup.style.setProperty('left', '0px', '');
            popup.style.setProperty('display', 'none', '');
            //popup.style.display = '';

            let pW = popup.offsetWidth;
            let pH = popup.offsetHeight;

            // guess!
            if (pW <= 0) pW = 200;
            if (pH <= 0) {
                pH = 0;
                let j = 0;
                while ((j = text.indexOf('<br/>', j)) !== -1) {
                    j += 5;
                    pH += 22;
                }
                pH += 25;
            }

            // If user presses the alternative popup location hotkey,
            // this will switch between locations
            if (this.altView === 1) {
                x = window.scrollX;
                y = window.scrollY;
            } else if (this.altView === 2) {
                x = (window.innerWidth - (pW + 20)) + window.scrollX;
                y = (window.innerHeight - (pH + 20)) + window.scrollY;
            } else if (elem instanceof window.HTMLOptionElement) {
                // This probably doesn't actually work
                // these things are always on z-top, so go sideways

                x = 0;
                y = 0;

                let p = elem;
                while (p) {
                    x += p.offsetLeft;
                    y += p.offsetTop;
                    p = p.offsetParent;
                }
                if (elem.offsetTop > elem.parentNode.clientHeight) y -= elem.offsetTop;

                if ((x + popup.offsetWidth) > window.innerWidth) {
                    // too much to the right, go left
                    x -= popup.offsetWidth + 5;
                    if (x < 0) x = 0;
                } else {
                    // use SELECT's width
                    x += elem.parentNode.offsetWidth + 5;
                }
            } else {

                // Go left if necessary
                if ((x + pW) > (window.innerWidth - 20)) {
                    x = (window.innerWidth - pW) - 20;
                    if (x < 0) x = 0;
                }

                // below the mouse
                let v = 25;

                // under the popup title
                if ((elem.title) && (elem.title !== '')) v += 20;

                // Go up if necessary
                if ((y + v + pH) > window.innerHeight) {
                    let t = y - pH - 30;
                    if (t >= 0) {
                        y = t;
                    } else {
                        // If can't go up, still go down to prevent blocking cursor
                        y += v;
                    }
                } else y += v;


                x += window.scrollX;
                y += window.scrollY;
            }
        } else {
            x += window.scrollX;
            y += window.scrollY;
        }

        popup.style.setProperty('left', x + 'px', 'important');
        popup.style.setProperty('top', y + 'px', 'important');
        popup.style.display = '';

        this.isVisible = true;
    },

    hidePopup: function () {
        this.isVisible = false;

        const popup = document.getElementById('liuchan-window');
        if (popup) {
            popup.style.setProperty('display', 'none', 'important');
            popup.innerHTML = '';
        }
        //this.title = null;
    },

    clearHighlight: function () {
        const tdata = window.liuchan;
        if ((!tdata) || (!tdata.prevSelView)) return;
        if (tdata.prevSelView.closed) {
            tdata.prevSelView = null;
            return;
        }

        let sel = tdata.prevSelView.getSelection();
        // If there is an empty selection or the selection was done by Liuchan then we'll clear it
        if ((!sel.toString()) || (tdata.selText === sel.toString())) {
            // In the case of no selection we clear the oldTA. The reason for this is because if there's no
            // selection we probably clicked somewhere else and we don't want to bounce back.
            if (!sel.toString())
                tdata.oldTA = null;

            // Clear all selections
            sel.removeAllRanges();
            // Text area stuff.
            // If oldTA is still around that means we had a highlighted region which we just cleared and now we're
            // going to jump back to where we were the cursor was before our lookup.
            // If oldCaret is less than 0 it means we clicked outside the box and shouldn't come back
            if (tdata.oldTA && tdata.oldCaret >= 0) {
                tdata.oldTA.selectionStart = tdata.oldTA.selectionEnd = tdata.oldCaret;
            }
        }
        tdata.prevSelView = null;
        tdata.kanjiChar = null;
        tdata.selText = null;
    },

    activeElementIsInput: function () {
        //var expr = /radio|checkbox|undefined|file|range|week|month|submit|reset|number|date/;
        const expr = /text|email|password|search|tel|url|number/;
        return expr.test(document.activeElement.type);
    },

    onKeyDown: function (ev) {
        // If key is being held already, return
        if (this.keysDown[ev.keyCode]) return;

        // If user has selected an input, disable hotkeys
        if (this.inputActive) return;

        this.modifierCheck(ev);

        // This only runs if popup hotkeys are enabled and popup is visible
        if (!this.config.disableKeys && this.isVisible) {
            switch (ev.key) {
                case "Escape":
                    this.hidePopup();
                    this.clearHighlight();
                    break;
                case "a":
                    this.altView = (this.altView + 1) % 3;
                    this.show(ev.currentTarget.liuchan);
                    break;
                case "c":
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
    },

    onKeyUp: function (ev) {
        if (this.keysDown[ev.keyCode]) this.keysDown[ev.keyCode] = 0;

        this.modifierCheck(ev);

        if (this.keysDown[0] !== this.config.showOnKey) {
            this.clearHighlight();
            this.hidePopup();
        }

        this.inputActive = this.activeElementIsInput();
    },

    modifierCheck: function (ev) {
        // Set modifier keys as 'flag' in keysDown[0].
        // Popup will show based on stored combination (0 = none, 1 = ctrl, 2 = alt, 3 = ctrl+alt and so on)
        this.keysDown[0] = 0;
        if (ev.ctrlKey) this.keysDown[0] += 1;
        if (ev.altKey) this.keysDown[0] += 2;
        if (ev.shiftKey) this.keysDown[0] += 4;
    },

    onMouseDown: function (ev) {
        // TODO ev.button
        if (ev.button !== 0) { return; }
        if (this.isVisible) { this.clearHighlight(); }
        this.mDown = true;

        this.inputActive = this.activeElementIsInput();

        // If we click outside of a text box then we set oldCaret to -1 as an indicator not to restore position.
        // Otherwise, we switch our saved textarea to where we just clicked
        if (!('form' in ev.target))
            window.liuchan.oldCaret = -1;
        else
            window.liuchan.oldTA = ev.target;
    },

    onMouseUp: function (ev) {
        if (ev.button !== 0)
            return;
        this.mDown = false;
    },

    onMouseMove: function (ev) {
        // Delay to reduce CPU strain
        if ((new Date().getTime() - this.prevTime) > 20) {
            this.prevTime = new Date().getTime();
            this.lastPos.x = ev.clientX;
            this.lastPos.y = ev.clientY;
            this.lastTarget = ev.target;
            this.tryUpdatePopup(ev);
        }
    },

    tryUpdatePopup: function (ev) {
        // Don't show or update if modifier keys are not pressed (if configured by user)
        if (this.config.showOnKey) {
            if (this.keysDown[0] !== this.config.showOnKey && (!this.isVisible)) return;
        }

        let fake;
        const tdata = window.liuchan,
            range = document.caretRangeFromPoint(ev.clientX, ev.clientY);

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
                    if (rp.parentNode !== ev.target && !(fake && rp.parentNode.innerText === ev.target.value)) {
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

            if (ev.target === tdata.prevTarget && this.isVisible) {
                if (tdata.title) {
                    if (fake) document.body.removeChild(fake);
                    return;
                }
                if ((rp === tdata.prevRangeNode) && (ro === tdata.prevRangeOfs)) {
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
    },

    // Hack because SelEnd can't be sent in messages
    lastSelEnd: [],
    // Hack because ro was coming out always 0 for some reason.
    lastRo: 0,

    show: function (tdata) {
        this.isVisible = true;

        let rp = tdata.prevRangeNode,
            ro = tdata.prevRangeOfs + tdata.uofs,
            u;

        tdata.uofsNext = 1;
        if ((!rp) || (ro < 0) || (ro >= rp.data.length)) {
            this.clearHighlight();
            this.hidePopup();
            return 0;
        }

        // if we have '   XYZ', where whitespace is compressed, X never seems to get selected
        while (((u = rp.data.charCodeAt(ro)) === 32) || (u === 9) || (u === 10)) {
            ++ro;
            if (ro >= rp.data.length) {
                this.clearHighlight();
                this.hidePopup();
                return 0;
            }
        }

        if ((isNaN(u)) || !this.inLanguageRange(u)) {
            this.clearHighlight();
            this.hidePopup();
            return -2;
        }

        //selection end data
        let selEndList = [],
            text = this.getTextFromRange(rp, ro, selEndList, 13 /*maxlength*/);

        this.lastSelEnd = selEndList;
        this.lastRo = ro;

        chrome.runtime.sendMessage({
            "type": "xsearch",
            "text": text
        }, result => this.processEntry(result));

        return 1;

    },

    inlineNames: {
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
    },

    isInline: function (node) {
        return node.nodeType === Node.COMMENT_NODE ||
            this.inlineNames.hasOwnProperty(node.nodeName) ||
            // Only check styles for elements.
            // Comments do not have getComputedStyle method
            (document.nodeType === Node.ELEMENT_NODE &&
                (document.defaultView.getComputedStyle(node, null).getPropertyValue('display') === 'inline' ||
                    document.defaultView.getComputedStyle(node, null).getPropertyValue('display') === 'inline-block')
            );
    },

    // XPath expression which evaluates to text nodes tells Liuchan which text to translate expression to get all
    // text nodes that are not in (RP or RT) elements
    textNodeExpr: 'descendant-or-self::text()[not(parent::rp) and not(ancestor::rt)]',

    // XPath expression which evaluates to a boolean. If it evaluates to true
    // then liuchan will not start looking for text in this text node
    // ignore text in RT elements
    startElementExpr: 'boolean(parent::rp or ancestor::rt)',

    // Gets text from a node
    // returns a string
    // node: a node
    // selEnd: the selection end object will be changed as a side effect
    // maxLength: the maximum length of returned string
    // xpathExpr: an XPath expression, which evaluates to text nodes, will be evaluated
    // relative to "node" argument
    getInlineText: function (node, selEndList, maxLength, xpathExpr) {
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
    },

    // given a node which must not be null,
    // returns either the next sibling or next sibling of the father or
    // next sibling of the fathers father and so on or null
    getNext: function (node) {
        let nextNode;

        if ((nextNode = node.nextSibling) !== null)
            return nextNode;
        if (((nextNode = node.parentNode) !== null) && this.isInline(nextNode))
            return this.getNext(nextNode);

        return null;
    },

    getTextFromRange: function (rangeParent, offset, selEndList, maxLength) {
        let endIndex, text = '';

        if (rangeParent.nodeName === 'TEXTAREA' || rangeParent.nodeName === 'INPUT') {
            endIndex = Math.min(rangeParent.data.length, offset + maxLength);
            return rangeParent.value.substring(offset, endIndex);
        }

        const xpathExpr = rangeParent.ownerDocument.createExpression(this.textNodeExpr, null);

        if (rangeParent.ownerDocument.evaluate(this.startElementExpr, rangeParent, null, XPathResult.BOOLEAN_TYPE, null).booleanValue)
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
    },

    inLanguageRange: function (u) {
        return (u >= 0x4E00) && (u <= 0x9FFF);
    },

    processEntry: function (e) {
        const tdata = window.liuchan;
        let ro = this.lastRo,
            selEndList = this.lastSelEnd;

        if (!e) {
            this.hidePopup();
            this.clearHighlight();
            return -1;
        }
        this.lastFound = [e];

        if (!e.matchLen) e.matchLen = 1;
        tdata.uofsNext = e.matchLen;
        tdata.uofs = (ro - tdata.prevRangeOfs);

        let rp = tdata.prevRangeNode;
        // Don't try to highlight form elements
        // TODO Fix the highlighting and fake elements
        if ((rp) && ((!this.inputActive && this.config.highlightText && !this.mDown && !('form' in tdata.prevTarget)) ||
                (!this.inputActive && ('form' in tdata.prevTarget) && this.config.highlightInput === true))) {
            const doc = rp.ownerDocument;
            if (!doc) {
                this.clearHighlight();
                this.hidePopup();
                return 0;
            }
            this.highlightMatch(doc, rp, ro, e.matchLen, selEndList, tdata);
            tdata.prevSelView = doc.defaultView;
        }

        chrome.runtime.sendMessage({
            "type": "makehtml",
            "entry": e
        }, result => this.processHtml(result));
    },

    processHtml: function (html) {
        const tdata = window.liuchan;
        this.showPopup(html, tdata.prevTarget, tdata.popX, tdata.popY);
    },

    highlightMatch: function (doc, rp, ro, matchLen, selEndList, tdata) {
        const sel = doc.defaultView.getSelection();

        // If selEndList is empty then we're dealing with a textarea/input situation
        if (selEndList.length === 0) {
            try {
                if (rp.nodeName === 'TEXTAREA' || rp.nodeName === 'INPUT') {

                    // If there is already a selected region not caused by Liuchan, leave it alone
                    if ((sel.toString()) && (tdata.selText !== sel.toString()))
                        return;

                    if (document.activeElement === document.body) {
                        tdata.oldTA = rp;
                        rp.focus();
                    }

                    // If there is no selected region and the saved textbox is the same as the current one then save
                    // the current cursor position. The second half of the condition lets us place the cursor in
                    // another text box without having it jump back
                    // TODO rewrite selection store/restore to handle all and any selections
                    if (!sel.toString() && tdata.oldTA === rp) {
                        tdata.oldCaret = rp.selectionStart;
                    }
                    rp.selectionStart = ro;
                    rp.selectionEnd = matchLen + ro;

                    tdata.selText = rp.value.substring(ro, matchLen + ro);
                }
            } catch (err) {
                // If there is an error it is probably caused by the input type being not text.  This is the most
                // general way to deal with arbitrary types
                // We set oldTA to null because we don't want to do weird stuff with buttons
                tdata.oldTA = null;
                console.log(err.message);
            }
            return;
        }

        // Special case for leaving a text box.
        // Even if we're not currently in a text area we should save the last one we were in
        if (tdata.oldTA && !sel.toString() && tdata.oldCaret >= 0)
            tdata.oldCaret = tdata.oldTA.selectionStart;

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

        if ((sel.toString()) && (tdata.selText !== sel.toString()))
            return;
        sel.removeAllRanges();
        sel.addRange(range);
        tdata.selText = sel.toString();
    },

    getFirstTextChild: function (node) {
        return document.evaluate('descendant::text()[not(parent::rp) and not(ancestor::rt)]',
            node, null, XPathResult.ANY_TYPE, null).iterateNext();
    },

    makeFake: function (real) {
        const fake = document.createElement('div');
        const realRect = real.getBoundingClientRect();
        fake.innerText = real.value;
        fake.style.cssText = document.defaultView.getComputedStyle(real, "").cssText;
        fake.scrollTop = real.scrollTop;
        fake.scrollLeft = real.scrollLeft;
        fake.style.position = "absolute";
        fake.style.zIndex = 99999999999;
        fake.style.top = (window.scrollY + realRect.top) + 'px';
        fake.style.left = (window.scrollX + realRect.left) + 'px';

        for (let i = 0; i < fake.style.length; ++i) {
            fake.style.setProperty(fake.style[i], fake.style.getPropertyValue(fake.style[i]), 'important');
        }

        return fake;
    }
};

//Event Listeners
chrome.runtime.onMessage.addListener(request => {
    switch (request.type) {
        case 'enable':
            if (request.config) lcxContent.config = request.config;
            if (!lcxContent.enabled) {
                lcxContent.enableTab();
            } else {
                lcxContent.updateTheme();
            }
            if (request.displayHelp) lcxContent.showPopup(request.displayHelp);
            break;
        case 'disable':
            lcxContent.disableTab();
            break;
        case 'showPopup':
            lcxContent.showPopup(request.text);
            break;
        default:
            console.log(request);
    }
    return Promise.resolve();
});

// When a page first loads, check to see if it should enable the content script
chrome.runtime.sendMessage({"type": "enable?", "enabled": lcxContent.enabled});