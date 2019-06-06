import { Clone } from './Clone';



/**
 * Returns either a SelectionFromElement or SelectionFromRange which can then be used for
 * dictionary lookups and text highlighting
 * @param point - x and y coordinates of the current mouse position
 */
export const Selection = (point): SelectionFromElement | SelectionFromRange => {
    const element = document.elementFromPoint(point.x, point.y);
    if (element) {
        if (element.nodeName === 'IMG' || element.nodeName === 'BUTTON') {
            return new SelectionFromElement(element);
        } else if (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA') {
            Clone.create(element);
        }
    }
    
    // Polyfill
    if (!document.caretRangeFromPoint) {
        document.caretRangeFromPoint = (x, y) => {
            // @ts-ignore
            const position = document.caretPositionFromPoint(x, y);
            if (position && position.offsetNode && position.offsetNode.nodeType === Node.TEXT_NODE) {
                const range = document.createRange();
                range.setStart(position.offsetNode, position.offset);
                range.setEnd(position.offsetNode, position.offset);
                return range;
            }
        };
    }
    
    const range = document.caretRangeFromPoint(point.x, point.y);
    if (range) {
        return new SelectionFromRange(range);
    }
};



/** Represents a selection created from an element */
export class SelectionFromElement {
    private element: Element;
    private content: string;
    
    
    /**
     * @param element - An HTMLElement that is either a BUTTON or an IMG
     * @param content - the string contained by the element
     */
    constructor(element: Element, content?: string) {
        this.element = element;
        this.content = content;
    }
    
    /** creates a copy of the selection */
    clone() {
        return new SelectionFromElement(this.element, this.content);
    }
    
    /** returns the content of the selection */
    text() {
        return this.content;
    }
    
    /** trims off any excess characters from the end of the selection */
    setEndOffset(length) {
        switch (this.element.nodeName) {
            case 'BUTTON':
                this.content = this.element.innerHTML;
                break;
            case 'IMG':
                this.content = this.element.getAttribute('alt');
                break;
            default:
                this.content = this.element.value;
                break;
        }
        
        this.content = this.content || '';
        this.content = this.content.substring(0, length);
        
        return this.content.length;
    }
    
    /** this function does not apply to selections created from elements */
    setStartOffset(length) {
        return 0;
    }
    
    /** checks if current mouse position is within the element
     * @param point - Object containing x and y coordinates */
    containsPoint(point) {
        const rect = this.getRect();
        return point.x >= rect.left && point.x <= rect.right;
    }
    
    /** Returns the element's bounding rectacle */
    getRect() {
        return this.element.getBoundingClientRect();
    }
    
    /** Tests if selection element matches the element that has been passed as an argument
     * @param test - element to test against */
    equals(test) {
        return test && test.element === this.element && test.content === this.content;
    }
    
    clear() {
        // NOP
    }
}



/** Represents a selection created from a caret range */
export class SelectionFromRange {
    private range: Range;
    private content?: string;
    
    
    /**
     * Create a selection from a range.
     * @param range - a range object created by document.getCaretRangeFromPoint
     * @param content - the text held by the range
     */
    constructor(range: Range, content?: string) {
        this.range = range;
        this.content = content;
    }
    
    
    clone() {
        return new SelectionFromRange(this.range.cloneRange(), this.content);
    }
    
    
    text() {
        return this.content;
    }
    
    
    setEndOffset(length) {
        const state = SelectionFromRange.seekForward(this.range.startContainer, this.range.startOffset, length);
        this.range.setEnd(state.node, state.offset);
        this.content = state.content;
        return length - state.remainder;
    }
    
    
    setStartOffset(length) {
        const state = SelectionFromRange.seekBackward(this.range.startContainer, this.range.startOffset, length);
        this.range.setStart(state.node, state.offset);
        this.content = state.content;
        return length - state.remainder;
    }
    
    
    containsPoint(point) {
        const rect = this.getPaddedRect();
        return point.x >= rect.left && point.x <= rect.right;
    }
    
    
    getRect() {
        return this.range.getBoundingClientRect();
    }
    
    
    getPaddedRect() {
        const range = this.range.cloneRange();
        const startOffset = range.startOffset;
        const endOffset = range.endOffset;
        const node = range.startContainer;
        
        range.setStart(node, Math.max(0, startOffset - 1));
        range.setEnd(node, Math.min(node.length, endOffset + 1));
        
        return range.getBoundingClientRect();
    }
    
    
    select() {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(this.range);
    }
    
    
    clear() {
        const selection = window.getSelection();
        selection.removeAllRanges();
    }
    
    
    equals(other) {
        return other && other.range && other.range.compareBoundaryPoints(Range.START_TO_START, this.range) === 0;
    }
    
    
    static shouldEnter(node) {
        if (node.nodeType !== 1) return false;
        
        
        const test =
            node.nodeName === 'RT' ||
            node.nodeName === 'SCRIPT' ||
            node.nodeName === 'STYLE';
        
        if (test) return false;
        
        const style = window.getComputedStyle(node);
        const hidden =
            style.visibility === 'hidden' ||
            style.display === 'none' ||
            parseFloat(style.fontSize) === 0;
        
        return !hidden;
    }
    
    
    static seekForward(node, offset, length) {
        const state = { node, offset, remainder: length, content: '' };
        if (!SelectionFromRange.seekForwardHelper(node, state)) {
            return state;
        }
        
        for (let current = node; current !== null; current = current.parentElement) {
            for (let sibling = current.nextSibling; sibling !== null; sibling = sibling.nextSibling) {
                if (!SelectionFromRange.seekForwardHelper(sibling, state)) {
                    return state;
                }
            }
        }
        
        return state;
    }
    
    
    static seekForwardHelper(node, state) {
        if (node.nodeType === 3 && node.parentElement && SelectionFromRange.shouldEnter(node.parentElement)) {
            const offset = state.node === node ? state.offset : 0;
            const remaining = node.length - offset;
            const consumed = Math.min(remaining, state.remainder);
            state.content = state.content + node.nodeValue.substring(offset, offset + consumed);
            state.node = node;
            state.offset = offset + consumed;
            state.remainder -= consumed;
        } else if (SelectionFromRange.shouldEnter(node)) {
            for (let i = 0; i < node.childNodes.length; ++i) {
                if (!SelectionFromRange.seekForwardHelper(node.childNodes[i], state)) {
                    break;
                }
            }
        }
        
        return state.remainder > 0;
    }
    
    
    static seekBackward(node, offset, length) {
        const state = { node, offset, remainder: length, content: '' };
        if (!SelectionFromRange.seekBackwardHelper(node, state)) {
            return state;
        }
        
        for (let current = node; current !== null; current = current.parentElement) {
            for (let sibling = current.previousSibling; sibling !== null; sibling = sibling.previousSibling) {
                if (!SelectionFromRange.seekBackwardHelper(sibling, state)) {
                    return state;
                }
            }
        }
        
        return state;
    }
    
    
    static seekBackwardHelper(node, state) {
        if (node.nodeType === 3 && node.parentElement && SelectionFromRange.shouldEnter(node.parentElement)) {
            const offset = state.node === node ? state.offset : node.length;
            const remaining = offset;
            const consumed = Math.min(remaining, state.remainder);
            state.content = node.nodeValue.substring(offset - consumed, offset) + state.content;
            state.node = node;
            state.offset = offset - consumed;
            state.remainder -= consumed;
        } else if (SelectionFromRange.shouldEnter(node)) {
            for (let i = node.childNodes.length - 1; i >= 0; --i) {
                if (!SelectionFromRange.seekBackwardHelper(node.childNodes[i], state)) {
                    break;
                }
            }
        }
        
        return state.remainder > 0;
    }
}
