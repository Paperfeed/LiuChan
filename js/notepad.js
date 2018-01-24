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
        overlay.setAttribute('display', 'none');
        textarea.setAttribute('id', 'liuchan-notepad-input');
        header.textContent = 'Liuchan Notepad';
        pin.textContent = '\u2AEF';
        close.textContent = '\u2715';

        overlay.appendChild(header);
        overlay.appendChild(pin);
        overlay.appendChild(close);
        overlay.appendChild(textarea);
        document.body.appendChild(overlay);

        this.elements = [overlay, header, pin, close, textarea];
        this.isPinned = false;
        this.isVisible = false;

        this.pinOverlay = this.pinOverlay.bind(this);
        this.lostFocus = this.lostFocus.bind(this);
        this.closeOverlay = this.closeOverlay.bind(this);
        this.startDrag = this.startDrag.bind(this);
        this.saveAfterInput = this.saveAfterInput.bind(this);
        this.dragOverlay = this.dragOverlay.bind(this);
        this.stopDrag = this.stopDrag.bind(this);

        header.addEventListener('mousedown', this.startDrag);
        textarea.addEventListener('input', this.saveAfterInput);
        pin.addEventListener('click', this.pinOverlay);
        close.addEventListener('click', this.closeOverlay);
        document.addEventListener('click', this.lostFocus);

        this.pos = [0,0,0,0];
        this.loadFromStorage();
        this.showOverlay();
    }

    loadFromStorage() {
        // This asks for and receives the stored notepad config from the background script
        chrome.runtime.sendMessage({'type': 'notepad', 'query': 'load'}, r => {
            this.updateState(r);
        });
    }

    updateState(data) {
        const overlay = this.elements[0];
        const textarea = this.elements[4];
        const d = document.documentElement;
        if (typeof data.pos == "undefined") {
            overlay.style.left = (d.clientWidth / 2) - (overlay.offsetWidth / 2) + 'px';
            overlay.style.top = (d.clientHeight / 2) - (overlay.offsetHeight / 2) + 'px';
        } else {
            overlay.style.left = data.pos[0] + 'px';
            overlay.style.top = data.pos[1] + 'px';
            textarea.style.width = data.size[0] + 'px';
            textarea.style.height = data.size[1] + 'px';
        }
        textarea.value = data.text;

        this.isPinned = !data.pinned;
        this.pinOverlay();
        this.checkPageBoundary();
    }

    saveAfterInput() {
        // Prevent save and sync for every single keystroke
        clearTimeout(this.inputTimer);
        this.inputTimer = setTimeout(this.saveToStorage.bind(this), 300);
    }

    saveToStorage() {
        const el = this.elements[0].getBoundingClientRect(); // Overlay
        const ol = this.elements[4]; // Textarea
        const notepad = {
            text: this.elements[4].value,
            pos: [el.x, el.y],
            size: [ol.offsetWidth, ol.offsetHeight],
            pinned: this.isPinned
        };
        chrome.runtime.sendMessage({'type': 'notepad', 'query': notepad});
    }

    checkPageBoundary() {
        const overlay = this.elements[0];
        const textarea = this.elements[4];
        const d = document.documentElement;
        const el = overlay.getBoundingClientRect();

        const offsetX = (overlay.offsetWidth - textarea.offsetWidth) * 2;
        const offsetY = (overlay.offsetHeight - textarea.offsetHeight);

        // Set width of textarea to size of viewport minus offset to fit the borders/buttons
        // This is because the textarea is resizable instead of the parent div
        if (overlay.offsetWidth > d.clientWidth) textarea.style.width = (d.clientWidth - offsetX) + 'px';
        if (overlay.offsetHeight > d.clientHeight) textarea.style.height = (d.clientHeight - offsetY) + 'px';

        const maxLeft = Math.max(0, d.clientWidth - overlay.offsetWidth);
        const maxTop = Math.max(0, d.clientHeight - overlay.offsetHeight);

        if (el.x > maxLeft) overlay.style.left = maxLeft + 'px';
        if (el.y > maxTop) overlay.style.top = maxTop + 'px';
        if (el.x < 0) overlay.style.left = '0px';
        if (el.y < 0) overlay.style.top = '0px';
    }

    startDrag(e) {
        e = e || window.event;
        this.pos[2] = e.clientX;
        this.pos[3] = e.clientY;

        document.addEventListener('mouseup', this.stopDrag);
        document.addEventListener('mousemove', this.dragOverlay);
    }

    dragOverlay(e) {
        e = e || window.event;
        const el = this.elements[0];

        // Calculate the new cursor position:
        this.pos[0] = this.pos[2] - e.clientX;
        this.pos[1] = this.pos[3] - e.clientY;
        this.pos[2] = e.clientX;
        this.pos[3] = e.clientY;

        // Set new position
        el.style.top = (el.offsetTop - this.pos[1]) + "px";
        el.style.left = (el.offsetLeft - this.pos[0]) + "px";
    }

    stopDrag() {
        document.removeEventListener('mouseup', this.stopDrag);
        document.removeEventListener('mousemove', this.dragOverlay);
        this.saveToStorage();
    }

    pinOverlay() {
        this.isPinned = !this.isPinned;
        const el = this.elements[2];
        if (this.isPinned) {
            el.classList.add('liuchan-overlay-pinned');
            el.textContent = '\u27DF';
        } else {
            el.classList.remove('liuchan-overlay-pinned');
            el.textContent = '\t\u2AEF';
        }
        this.saveToStorage();
    }

    toggleOverlay() {
        this.isVisible ? this.closeOverlay() : this.showOverlay();
    }

    showOverlay() {
        document.addEventListener('click', this.lostFocus);
        this.elements[0].style.display = '';
        this.isVisible = true;
        this.checkPageBoundary();
    }

    lostFocus(e) {
        if (e.srcElement.offsetParent !== this.elements[0] && e.srcElement !== this.elements[0] && !this.isPinned) {
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