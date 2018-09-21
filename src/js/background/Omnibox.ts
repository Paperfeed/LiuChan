import fuzzysort from '../lib/fuzzysort';
import { Dictionary } from './Dictionary';



interface OmniboxConfig {
    pinyinType: string;
    definitionSeparator: string;
    hanziType: string;
}



export class Omnibox {
    private timeout: number;
    private dict: Dictionary;
    private config: OmniboxConfig;
    
    
    constructor(dict: Dictionary, config: OmniboxConfig) {
        this.dict = dict;
        this.config = config;
        
        this.onInput = this.onInput.bind(this);
        this.search = this.search.bind(this);
    }
    
    
    public onInput(text, suggest) {
        // Timeout to prevent the CPU heavy fuzzysort from occuring too often while user hasn't finished typing yet
        clearTimeout(this.timeout);
        this.timeout = setTimeout(this.search, 400, text, suggest);
    }
    
    
    private search(text, suggest) {
        // TODO redo fuzzysort implementation - it's a unoptimized mess
        if (text == undefined) return;
        
        fuzzysort.highlightMatches = true;
        fuzzysort.highlightOpen = '<match>';
        fuzzysort.highlightClose = '</match>';
        //fuzzysort.threshold = null;
        //fuzzysort.limit = null;
        
        const dict = this.dict;
        let results = [];
        
        // Check if user input is hanzi or plain english
        let useSimplified;
        const isHanzi = text.match(/[\u3400-\u9FBF]/);
        if (isHanzi) {
            // If the text that has been typed is hanzi, get all entries that
            // start with the first character of the string and score them
            useSimplified = /simp|boths/.test(this.config.hanziType);
            
            const index = dict.data.get(text.charAt(0));
            let score, item;
            for (let i = 0, len = index.length; i < len; i++) {
                if (useSimplified) {
                    item = index[i].simp;
                } else {
                    item = index[i].trad;
                }
                let hanzi = fuzzysort.single(text, item);
                score = hanzi ? hanzi.score : 1000;
                if (score >= 1000) continue;
                
                results.push({
                    item: index[i],
                    score: hanzi.score,
                    hanzi: hanzi ? hanzi.highlighted : item,
                    pinyinHighlighted: index[i].pinyin.tonemarks,
                    definitionHighlighted: index[i].def
                })
            }
        } else {
            // If it's roman characters we have to check for pinyin and go through every key in the dictionary map,
            // then score the pinyin and definition separately
            // @ts-ignore
            dict.data.keys().forEach((key) => {
                let value = dict.data.get(key);
                for (let i = 0, len = value.length; i < len; i++) {
                    let string = '', definition = value[i].def;
                    
                    if (definition.length > 1 && (this.config.definitionSeparator === "num")) {
                        for (let a = 0; a < definition.length; a++) {
                            string += (a + 1) + ' ' + definition[a] + '  ';
                        }
                        string.trim();
                    } else {
                        string = value[i].def.join(this.config.definitionSeparator);
                    }
                    
                    let definitionScore = fuzzysort.single(text, string);
                    let pinyinScore = fuzzysort.single(text, this.convertPinyin(value[i].pinyin.tonemarks));
                    
                    let score = Math.min(
                        pinyinScore ? pinyinScore.score : 1000,
                        definitionScore ? definitionScore.score : 1000);
                    if (score >= 1000) continue;
                    
                    results.push({
                        item: value[i],
                        score: score,
                        pinyinHighlighted: pinyinScore ? pinyinScore.highlighted : value[i].pinyin.tonemarks,
                        definitionHighlighted: definitionScore ? definitionScore.highlighted : value[i].def
                    })
                }
            });
        }
        
        results.sort((a, b) => {
            return a.score - b.score
        });
        if (undefined === results) return;
        
        let array = [];
        for (let i = 0; i < results.length; i++) {
            // Hanzi
            let entry = '<url>';
            
            // If simplified and traditional are the same then just display one
            if (results[i].item.trad === results[i].item.simp) {
                entry += results[i].item.trad + " ";
            } else {
                if (isHanzi) {
                    entry += results[i].hanzi;
                } else {
                    // Fallthrough on purpose:
                    // noinspection FallThroughInSwitchStatementJS
                    switch (this.config.hanziType) {
                        case "botht":
                            entry += results[i].item.trad + " ";
                        case "simp":
                            entry += results[i].item.simp;
                            break;
                        case "boths":
                            entry += results[i].item.simp + " ";
                        case "trad":
                            entry += results[i].item.trad;
                            break;
                    }
                }
            }
            
            
            entry += "</url><dim>";
            
            // TODO make other pinyin types highlighted as well
            // Pinyin
            switch (this.config.pinyinType) {
                case "tonemarks":
                    entry += " " + results[i].pinyinHighlighted;
                    break;
                case "tonenums":
                    entry += " " + results[i].item.pinyin.tonenums;
                    break;
                case "zhuyin":
                    entry += " " + results[i].item.pinyin.zhuyin;
                    break;
            }
            
            // Definition
            let content;
            
            entry += '</dim> ' + results[i].definitionHighlighted;
            if (useSimplified) {
                content = results[i].item.simp;
            } else {
                content = results[i].item.trad;
            }
            array.push({ content: content, description: entry });
            
            // Limit to 10 results
            //if (i === 9) { break; }
        }
        
        
        // Can use popup to show results instead
        /*chrome.tabs.query({ active:true, windowType:"normal", currentWindow: true },
			tab => {
                chrome.tabs.sendMessage(tab[0].id, {
                    "type": "showPopup",
                    "text": array.toString();
                });
        	});*/
        suggest(array);
    }
    
    
    convertPinyin(pinyin): string {
        let str = '';
        for (let i = 0, len = pinyin.length - 1; i < len; i++) {
            let char = pinyin.charAt(i);
            switch (char) {
                case 'ā':
                case 'á':
                case 'ǎ':
                case 'à':
                    str += 'a';
                    break;
                case 'ē':
                case 'é':
                case 'ě':
                case 'è':
                    str += 'e';
                    break;
                case 'ō':
                case 'ó':
                case 'ǒ':
                case 'ò':
                    str += 'o';
                    break;
                case 'ī':
                case 'í':
                case 'ǐ':
                case 'ì':
                    str += 'i';
                    break;
                case 'ū':
                case 'ú':
                case 'ǔ':
                case 'ù':
                    str += 'u';
                    break;
                case 'ǖ':
                case 'ǘ':
                case 'ǚ':
                case 'ǜ':
                    str += 'v';
                    break;
                default:
                    str += pinyin.charAt(i);
            }
        }
        return str;
    }
}