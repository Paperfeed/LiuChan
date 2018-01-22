class Notepad {
    constructor() {
        // Load stylesheet (if it hasn't been loaded already)
        if (!lcxContent.enabled) lcxContent.loadStyleSheet();

        const overlay = document.createElement('div');
        const header = document.createElement('p');
        const pin = document.createElement('button');
        const close = document.createElement('button');
        const textarea = document.createElement('textarea');

        overlay.setAttribute('id', 'liuchan-notepad-overlay');
        header.textContent = 'Liuchan Notepad';
        pin.textContent = '\t\u2AEF'; // ⫯ Tacked: ⟟ \u27DF
        close.textContent = '\t\u2716'; // ✖
        textarea.textContent = 'testtesttest';

        textarea.setAttribute('id', 'liuchan-notepad-input');

        overlay.appendChild(close);
        overlay.appendChild(pin);
        overlay.appendChild(header);
        overlay.appendChild(textarea);
        document.body.appendChild(overlay);

        textarea.focus();
        this.elements = [overlay, header, pin, close, textarea];
        this.isPinned = false;
        this.isVisible = true;

        this.pinOverlay = this.pinOverlay.bind(this);
        this.lostFocus = this.lostFocus.bind(this);
        this.closeOverlay = this.closeOverlay.bind(this);
        this.startDrag = this.startDrag.bind(this);
        this.dragOverlay = this.dragOverlay.bind(this);
        this.stopDrag = this.stopDrag.bind(this);

        header.addEventListener('mousedown', this.startDrag);
        textarea.addEventListener('focusout', this.lostFocus);
        pin.addEventListener('click', this.pinOverlay);
        close.addEventListener('click', this.closeOverlay);
        document.addEventListener('click', this.lostFocus);

        this.pos = [0,0,0,0];
        this.loadFromStorage();
    }

    loadFromStorage() {
        // This asks for and receives the stored notepad config from the background script
        chrome.runtime.sendMessage({'type': 'notepad', 'query': 'load'}, r => {
            this.elements[4].textContent = r.text;
            this.elements[0].setAttribute('style', 'top: ' + r.pos[0] + 'px; left: ' + r.pos[1] + 'px;');
        });
    }

    saveToStorage() {
        const el = this.elements[0].getBoundingClientRect();
        const notepad = { text: this.elements[4].textContent, pos: [el.x, el.y], size: [el.width, el.height]};
        chrome.runtime.sendMessage({'type': 'notepad', 'query': notepad});
    }

    startDrag(e) {
        e = e || window.event;
        // get the mouse cursor position at startup:
        this.pos[2] = e.clientX;
        this.pos[3] = e.clientY;

        document.addEventListener('mouseup', this.stopDrag);
        document.addEventListener('mousemove', this.dragOverlay);
    }

    dragOverlay(e) {
        e = e || window.event;
        // calculate the new cursor position:
        this.pos[0] = this.pos[2] - e.clientX;
        this.pos[1] = this.pos[3] - e.clientY;
        this.pos[2] = e.clientX;
        this.pos[3] = e.clientY;
        const el = this.elements[0];
        // set the element's new position:
        el.style.top = (el.offsetTop - this.pos[1]) + "px";
        el.style.left = (el.offsetLeft - this.pos[0]) + "px";
    }

    stopDrag() {
        document.removeEventListener('mouseup', this.stopDrag);
        document.removeEventListener('mousemove', this.dragOverlay);
    }

    pinOverlay() {
        this.isPinned = !this.isPinned;
        if (this.isPinned) {
            this.elements[2].style.color = '#f00';
            this.elements[2].textContent = '\u27DF';
        } else {
            this.elements[2].style.color = '';
            this.elements[2].textContent = '\t\u2AEF';
        }
    }

    toggleOverlay() {
        this.isVisible ? this.closeOverlay() : this.showOverlay();
    }

    showOverlay() {
        document.addEventListener('click', this.lostFocus);
        this.elements[0].style.display = '';
        this.elements[4].focus();
        this.isVisible = true;
    }

    lostFocus(e) {
        if (e.srcElement.offsetParent != this.elements[0] && e.srcElement != this.elements[0] && !this.isPinned) {
            this.closeOverlay();
        }
    }

    closeOverlay() {
        document.removeEventListener('click', this.lostFocus);
        this.saveToStorage();
        this.elements[0].style.display = 'none';
        this.isVisible = false;
    }
}