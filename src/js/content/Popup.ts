export interface PopupOptions {
    popupTheme: string;
    popupDelay: number;
    scaleOnZoom: boolean;
    useCustomization: boolean;
    customStyling?: {
        borderThickness: number;
        borderRadius: number;
        customColors: string[];
    };
}



export class Popup {
    private container: HTMLElement;
    private config: PopupOptions;
    public isVisible: boolean;
    public location: number;
    
    
    constructor(config: PopupOptions) {
        this.config = config;
        
        this.loadStyleSheet();
        this.createContainer();
        this.setCustomStyling();
        this.setZoomLevel();
    }
    
    
    private createContainer() {
        const popup = document.createElement('div');
        
        popup.id = 'liuchan-window';
        popup.style.display = 'none !important';
        popup.style.transformOrigin = '0 0'; // Maintain proper position when scaling
        document.body.appendChild(popup);
        
        this.container = popup;
    }
    
    
    private loadStyleSheet(): void {
        // Check if stylesheet isn't loaded already
        if (window.document.getElementById("liuchan-css")) return;
        
        // Create and append stylesheet
        const wd = window.document;
        const css = wd.createElementNS('http://www.w3.org/1999/xhtml', 'link');
        
        css.setAttribute('rel', 'stylesheet');
        css.setAttribute('type', 'text/css');
        css.setAttribute('href', chrome.extension.getURL('css/popup-' + this.config.popupTheme + '.css'));
        css.setAttribute('id', 'liuchan-css');
        wd.getElementsByTagName('head')[0].appendChild(css);
    }
    
    
    public setCustomStyling(): void {
        const popup = this.container;
        const { borderThickness, customColors, borderRadius } = this.config.customStyling;
        
        if (this.config.useCustomization) {
            const border = `${borderThickness}px solid ${customColors[1]}`;
            const boxshadow = `${customColors[2]} 4px 4px 0 0`;
            
            popup.style.background = customColors[0];
            popup.style.boxShadow = boxshadow;
            popup.style.border = border;
            popup.style.borderRadius = `${borderRadius}px`;
        } else {
            popup.style.background = "";
            popup.style.boxShadow = "";
            popup.style.border = "";
            popup.style.borderRadius = "";
        }
    }
    
    
    public setZoomLevel(): void {
        // This functions scales the popup as the user zooms in order to make it seem as if it's not scaling. Yep.
        
        const popup = this.container;
        const zoomLevel = window.devicePixelRatio * 100;
        
        if (this.config.scaleOnZoom) {
            popup.style.transform = "";
        } else {
            popup.style.transform = `scale(${(100 / zoomLevel)})`;
        }
    }
    
    
    public showPopup(text: string, element? : ClientRect) {
        // Sometimes pages do some funky dynamic loading and we lose the popup, so we recreate it.
        if (this.container === null) this.createContainer();
        const popup = this.container;
        
        popup.innerHTML = text;
        const width = popup.offsetWidth;
        const height = popup.offsetHeight;
        const limitX = document.body.clientWidth;
        const limitY = window.innerHeight;
        const containerStyle = window.getComputedStyle(this.container);
        let x = 0,
            y = 0;
        
        if (element) {
            if (this.location === 1) {
                x = window.scrollX;
                y = window.scrollY;
            } else if (this.location === 2) {
                x = (window.innerWidth - (width + 20)) + window.scrollX;
                y = (window.innerHeight - (height + 20)) + window.scrollY;
            } else if (element instanceof (<any>window).HTMLOptionElement) {
                // Element is a select/dropdown
            } else {
                x = element.left;
                
                const overflowX = Math.max(x + width - limitX, 0);
                
                if (overflowX > 0) {
                    if (x >= overflowX) {
                        x -= overflowX;
                    } else {
                        //width = limitX;
                        x = 0;
                    }
                }
            }
        } else {
            x += window.scrollX;
            y += window.scrollY;
        }
    
    
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        popup.style.display = '';
    
        this.isVisible = true;
        
        
        //const maxX = document.body.clientWidth;
        //const maxY = window.innerHeight;
        
        /*
        if (element) {
            // TODO Sort this crap out
            //popup.style.display = 'none';
            
            // If user presses the alternative popup location hotkey,
            // this will switch between locations
            if (this.location === 1) {
                x = window.scrollX;
                y = window.scrollY;
            } else if (this.location === 2) {
                x = (window.innerWidth - (width + 20)) + window.scrollX;
                y = (window.innerHeight - (height + 20)) + window.scrollY;
            } else if (element instanceof (<any>window).HTMLOptionElement) {
                // If element is a Select/Dropdown
                
                x = 0;
                y = 0;
                
                let p = element;
                while (p) {
                    x += p.offsetLeft;
                    y += p.offsetTop;
                    p = p.offsetParent;
                }
                if (element.offsetTop > element.parentNode.clientHeight) y -= element.offsetTop;
                
                if ((x + popup.offsetWidth) > window.innerWidth) {
                    // too much to the right, go left
                    x -= popup.offsetWidth + 5;
                    if (x < 0) x = 0;
                } else {
                    // use SELECT's width
                    x += element.parentNode.offsetWidth + 5;
                }
            } else {
                
                // Go left if necessary
                if ((x + width) > (window.innerWidth - 20)) {
                    x = (window.innerWidth - width) - 20;
                    if (x < 0) x = 0;
                }
                
                // below the mouse
                let v = 25;
                
                // under the popup title
                if ((element.title) && (element.title !== '')) v += 20;
                
                // Go up if necessary
                if ((y + v + height) > window.innerHeight) {
                    let t = y - height - 30;
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
        
        */
    }
    
    
    hidePopup() {
        this.isVisible = false;
        this.container.style.display = 'none';
    }
}
