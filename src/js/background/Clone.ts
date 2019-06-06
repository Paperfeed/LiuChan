/**
 * Creates a cloned element over the original containing the text only so that the user can select text from inputs,
 * alt-texts, etc.
 */
export class Clone {
    /** @param element - The element to clone */
    static create(element) {
        const computedStyle = window.getComputedStyle(element);
        let style = '';
        for (const key of computedStyle) {
            style += `${key}: ${computedStyle[key]}`;
        }
        
        const offset = Clone.getOffset(element);
        const clone = document.createElement('div');
        clone.className = 'yomichan-imposter';
        clone.innerText = element.value;
        clone.style.cssText = style;
        clone.style.position = 'absolute';
        clone.style.top = `${offset.top}px`;
        clone.style.left = `${offset.left}px`;
        clone.style.opacity = '0';
        clone.style.zIndex = '2147483646';
        if (element.nodeName === 'TEXTAREA' && computedStyle.overflow === 'visible') {
            clone.style.overflow = 'auto';
        }
        
        document.body.appendChild(clone);
        clone.scrollTop = element.scrollTop;
        clone.scrollLeft = element.scrollLeft;
    }
    
    
    static destroy() {
        for (const element of document.getElementsByClassName('liuchan-clone')) {
            element.parentNode.removeChild(element);
        }
    }
    
    
    private static getOffset(element) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;
        
        const clientTop = document.documentElement.clientTop || document.body.clientTop || 0;
        const clientLeft = document.documentElement.clientLeft || document.body.clientLeft || 0;
        
        const rect = element.getBoundingClientRect();
        const top = Math.round(rect.top + scrollTop - clientTop);
        const left = Math.round(rect.left + scrollLeft - clientLeft);
        
        return { top, left };
    }
}