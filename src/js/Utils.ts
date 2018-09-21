
class Utils {
    // REGEX from http://flyingsky.github.io/2018/01/26/javascript-detect-chinese-japanese/
    static REGEX_JAPANESE: RegExp = /[\u3000-\u303f]|[\u3040-\u309f]|[\u30a0-\u30ff]|[\uff00-\uff9f]|[\u4e00-\u9faf]|[\u3400-\u4dbf]/;
    static REGEX_CHINESE: RegExp = /[\u4e00-\u9fff]|[\u3400-\u4dbf]|[\u{20000}-\u{2a6df}]|[\u{2a700}-\u{2b73f}]|[\u{2b740}-\u{2b81f}]|[\u{2b820}-\u{2ceaf}]|[\uf900-\ufaff]|[\u3300-\u33ff]|[\ufe30-\ufe4f]|[\uf900-\ufaff]|[\u{2f800}-\u{2fa1f}]/u;
    static hasJapanese : Function = (str) => Utils.REGEX_JAPANESE.test(str);
    static hasChinese : Function = (str) => Utils.REGEX_CHINESE.test(str);
}