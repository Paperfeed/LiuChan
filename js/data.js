'use strict';

/**
 * LiuChan Dictionary Class
 * @constructor
 */
function lcxDict() {
	//this.loadDictionary();
}

lcxDict.prototype = {
	noDefinition: false,

	fileRead: function(filename, field) {
		var self = this;
		return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", chrome.extension.getURL(filename));

            xhr.onload = function () {
                self.parseDict(this.responseText, field);
                resolve();
            };

            xhr.onerror = function (e) {
                reject(e);
            };

            xhr.send(null);
		});
	},

    parseDict: function (dict, field) {
		// Match every entry in the dictionary and map it to an object
        var reg = /(.+?)\s(.+?)\s\[(.+?)\]\s\/(.+)\//gi;
        var array = [], result;
        var pinyinType = lcxMain.config.pinyin;

        while (result = reg.exec(dict)) {
            var traditional = result[1];
            var simplified = result[2];
            var pinyin = this.parsePinyin(result[3]);
            // Replace pinyin in definitions with user specified pinyin
            var hasPinyin = /\[((?:[a-z]+\d\s?)+)\]/gi;
            var res, def = result[4];

            while(res = hasPinyin.exec(result[4])) {
                def = def.replace(res[0], "[" + this.parsePinyin(res[1])[pinyinType] + "]");
            }
            var definition = def.split("/");

            // TODO I could optimize memory here by not including simp if its equal to trad
            array.push({
				"simp": simplified,
				"trad": traditional,
				"pinyin": pinyin,
				"def": definition});
        }

        this[field] = array;

        // I noticed that chrome keeps the last regex match in memory
		// which in this case is the entire dictionary file, so this is to lower the memory footprint
        reg = /./g;
        reg.exec('c');
    },

    parseDefinitions: function (def) {
        if (def.length === 1) { return def }
        if (lcxMain.config.numdef === "num") {
            var str = '';
            for (var i = 0; i < def.length; i++) {
                str += '<b>' + (i + 1) + '</b> ' + def[i] + ' ';
            }
            return str.trim();
        } else {
            return def.join(lcxMain.config.numdef);
        }
    },

	loadDictionary: function(tab) {
		return Promise.all([
			this.fileRead("data/cedict_ts.u8", "hanzi")
		]).then(function () {
			lcxMain.onDictionaryLoaded(tab);
			}
		);
	},

    indexSearch: function (dict, char) {
		// What this function does is quickly try to find all entries in the dictionary
		// that match the first character of the word that we're trying to look up.
		// It returns a start and end index number of the dictionary to use when looking for words

		var foundMatch = false,
            firstMatch = -1, lastMatch = -1, extraLoop = 0;

		const dictLength = dict.length;
		for (var i = 0; i < dictLength; i++) {
            if (char === dict[i].simp.charAt(0) || char === dict[i].trad.charAt(0)) {
                if (foundMatch === false) firstMatch = i;
                foundMatch = true;
                lastMatch = i;
                // Must use type coercion:
            } else if (firstMatch == (i - 1)) {
                // Found only one result - a singular old variant. Skipping and looking for more
                foundMatch = false;
            } else if (foundMatch && extraLoop <= 4) {
                // Some weird variants mess things up, so we check for a couple of extra loops
                extraLoop++;
            } else if (foundMatch) {
                break;
            }
        }

        if (lastMatch === -1) { lastMatch = firstMatch }
		return [firstMatch, lastMatch]
	},

    wordSearch: function (dict, word) {
		var index = this.indexSearch(dict, word.charAt(0));
		if (index[0] === -1) return;

		var results = {};
		results.data = [];

		while (word.length > 0) {
			for (var i = index[0]; i <= index[1]; i++) {
				if (dict[i].trad === word || dict[i].simp === word) {
					results.data.push(dict[i]);
				}
			}
			word = word.substr(0, word.length - 1);
		}

		results.matchLen = 0;
		for (var key in results.data) {
			// Set highlight length to longest match
			if (results.data[key].simp.length > results.matchLen) {
				results.matchLen = results.data[key].simp.length;
			}
		}

		return results;
	},

	makeHtml: function(entry) {
        if (entry == null) return '';

		var trad, simp, pinyin, def;
		var html, b = [];

		b.push('<div class="liuchan-container">');
		// todo Make use of title if wanted
		/*if (entry.title) {
            b.push('<div class="title">' + entry.title + '</div>');
        }*/

		for (var key in entry.data) {
			// Parsing the pinyin removes numbers, adds tone marks, etc
			trad = entry.data[key].trad;
			simp = entry.data[key].simp;
			def = '';
			pinyin = entry.data[key].pinyin;
            def = this.parseDefinitions(entry.data[key].def);

			// Select whether to show traditional or simple first/only
			// Note: Fallthrough is on purpose!
			var first, second, addSecond = false;
			switch (lcxMain.config.showHanzi) {
				case "boths":
                	addSecond = true;
                	second = trad;
                case "simp":
                    first = simp;
                    break;
				case "botht":
					addSecond = true;
                    second = simp;
				case "trad":
					first = trad;
			}

            //HANZI
            html = '<div class="entry"><div class="hanzi">';

            // If simple and traditional characters are completely identical, skip this
			// otherwise add both sets to the entry if user has chosen to do so
			if ((first !== second) && addSecond) {
                // Replace identical characters from both sets with a dot/hyphen
                var newsecond = [];
                for (var i = 0, len = first.length; i < len; i++) {
                    if (first[i] === second[i])
                        newsecond.push('\u30FB');
                    else
                        newsecond.push(second[i]);
                }
                second = newsecond.join('');

                // Add tone colors to every character
                if (lcxMain.config.doColors === true) {
                    // User has specified custom colors, use those instead
                    if (lcxMain.config.useCustomTone) {
                    	var tone;
                        for (i = 0, len = pinyin.tones.length; i < len; i++) {
                        	tone = pinyin.tones[i];
                            html += '<span class="tone' + tone
								+ '" style="color:' + lcxMain.config.customTones[tone-1] + '">'
								+ first.charAt(i) + '</span>';
                        }

                        html += '<span class="spacer"></span><span class="brace">[</span>';
                        for (i = 0, len = pinyin.tones.length; i < len; i++) {
                            tone = pinyin.tones[i];
                            html += '<span class="tone' + tone
								+ '" style="color:' + lcxMain.config.customTones[tone-1] + '">'
								+ second.charAt(i) + '</span>';
                        }
                        html += '<span class="brace">]</span>'

                    } else {
						for (i = 0, len = pinyin.tones.length; i < len; i++) {
							html += '<span class="tone' + pinyin.tones[i] + '">' + first.charAt(i) + '</span>';
						}

						html += '<span class="spacer"></span><span class="brace">[</span>';
						for (i = 0, len = pinyin.tones.length; i < len; i++) {
							html += '<span class="tone' + pinyin.tones[i] + '">' + second.charAt(i) + '</span>';
						}
						html += '<span class="brace">]</span>'
                	}
                } else {
                    html += '<span class="tone3">' + first + '</span><span class="spacer"></span>' +
                        '<span class="tone3"><span class="brace">[</span>' + second + '<span class="brace">]</span></span>';
                }

            } else {
                // Add tone colors to every character
				if (lcxMain.config.doColors === true) {
                    if (lcxMain.config.useCustomTone) {
                        for (i = 0, len = pinyin.tones.length; i < len; i++) {
                            tone = pinyin.tones[i];
                            html += '<span class="tone' + tone
								+ '" style="color:' + lcxMain.config.customTones[tone-1] + '">'
								+ first.charAt(i) + '</span>';
                        }
                    } else {
                        for (i = 0, len = pinyin.tones.length; i < len; i++) {
                            html += '<span class="tone' + pinyin.tones[i] + '">' + first.charAt(i) + '</span>';
                        }
                    }
                } else {
                    html += '<span class="tone3">' + first + '</span>';
                }
			}

			//PINYIN
            html += '</div><div class="pinyin">';

            if (lcxMain.config.doColors && lcxMain.config.doPinyinColors) {
            	var str;
				switch (lcxMain.config.pinyin) {
					case "tonenums": str = pinyin.tonenums.split(" "); break;
					case "zhuyin": str = pinyin.zhuyin.split(" "); break;
					default: str = pinyin.tonemarks.split(" ");
				}

				//if (str.length !== pinyin.tones.length) console.log("this should not happen!", str, pinyin.tones);
				if (lcxMain.config.useCustomTone) {
                    for (i = 0, len = pinyin.tones.length; i < len; i++) {
                        tone = pinyin.tones[i];
                        html += '<span class="tone' + tone
							+ '" style="color:' + lcxMain.config.customTones[tone-1] + '">'
							+ str[i] + ' </span>';
                    }
				} else {
                    for (i = 0, len = pinyin.tones.length; i < len; i++) {
                        html += '<span class="tone' + pinyin.tones[i] + '">' + str[i] + ' </span>';
                    }
                }
			} else {
            	if (!lcxMain.config.doPinyinColors && lcxMain.config.useCustomTone) {
                    switch (lcxMain.config.pinyin) {
                        case "tonenums":
                            html += '<span style="color:' + lcxMain.config.customTones[5] + '">' +
                                pinyin.tonenums + '</span></span>';
                            break;
                        case "zhuyin":
                            html += '<span style="color:' + lcxMain.config.customTones[5] + '">' +
                                pinyin.zhuyin + '</span></span>';
                            break;
                        default:
                            html += '<span style="color:' + lcxMain.config.customTones[5] + '">' +
                                pinyin.tonemarks + '</span></span>';
                    }
				} else {
					switch (lcxMain.config.pinyin) {
						case "tonenums": html += pinyin.tonenums + '</span>'; break;
						case "zhuyin": html += pinyin.zhuyin + '</span>'; break;
						default: html += pinyin.tonemarks + '</span>';
					}
				}
			}

			b.push(html);

			//DEFINITION
			if (!lcxMain.dict.noDefinition) {
                b.push('</div><div class="def">' + def + '</div></div>');
            } else {
				b.push('</div></div>');
			}
		}

		return b.join('');
	},

	isVowel: function (letter) {
		return letter === "a" || letter === "e" || letter === "i" || letter === "o" || letter === "u";
  	},
  	
	parsePinyin: function(pinyin) {
        var pinyinref = ['a','ai','an','ang','ao','ba','bai','ban','bang','bao','bei','ben','beng','bi','bian','biao','bie','bin','bing','bo','bu','ca','cai','can','cang','cao','ce','cen','ceng','cha','chai','chan','chang','chao','che','chen','cheng','chi','chong','chou','chu','chua','chuai','chuan','chuang','chui','chun','chuo','ci','cong','cou','cu','cuan','cui','cun','cuo','da','dai','dan','dang','dao','de','deng','di','dian','diang','diao','die','ding','diu','dong','dou','du','duan','dui','dun','duo','e','ei','en','er','fa','fan','fang','fei','fen','feng','fo','fou','fu','ga','gai','gan','gang','gao','ge','gei','gen','geng','gong','gou','gu','gua','guai','guan','guang','gui','gun','guo','ha','hai','han','hang','hao','he','hei','hen','heng','hong','hou','hu','hua','huai','huan','huang','hui','hun','huo','ji','jia','jian','jiang','jiao','jie','jin','jing','jiong','jiu','ju','juan','jue','jun','ka','kai','kan','kang','kao','ke','ken','keng','kong','kou','ku','kua','kuai','kuan','kuang','kui','kun','kuo','la','lai','lan','lang','lao','le','lei','leng','li','lian','liang','liao','lie','lin','ling','liu','long','lou','lu','l\u00FC','luan','l\u00FCe','lun','luo','ma','mai','man','mang','mao','me','mei','men','meng','mi','mian','miao','mie','min','ming','miu','mo','mou','mu','na','nai','nan','nang','nao','ne','nei','nen','neng','ni','nia','nian','niang','niao','nie','nin','ning','niu','nong','nou','nu','n\u00FC','nuan','n\u00FCe','nuo','nun','ou','pa','pai','pan','pang','pao','pei','pen','peng','pi','pian','piao','pie','pin','ping','po','pou','pu','qi','qia','qian','qiang','qiao','qie','qin','qing','qiong','qiu','qu','quan','que','qun','ran','rang','rao','re','ren','reng','ri','rong','rou','ru','ruan','rui','run','ruo','sa','sai','san','sang','sao','se','sei','sen','seng','sha','shai','shan','shang','shao','she','shei','shen','sheng','shi','shong','shou','shu','shua','shuai','shuan','shuang','shui','shun','shuo','si','song','sou','su','suan','sui','sun','suo','ta','tai','tan','tang','tao','te','teng','ti','tian','tiao','tie','ting','tong','tou','tu','tuan','tui','tun','tuo','wa','wai','wan','wang','wei','wen','weng','wo','wu','xi','xia','xian','xiang','xiao','xie','xin','xing','xiong','xiu','xu','xuan','xue','xun','ya','yai','yan','yang','yao','ye','yi','yin','ying','yo','yong','you','yu','yuan','yue','yun','za','zai','zan','zang','zao','ze','zei','zen','zeng','zha','zhai','zhan','zhang','zhao','zhe','zhei','zhen','zheng','zhi','zhong','zhou','zhu','zhua','zhuai','zhuan','zhuang','zhui','zhun','zhuo','zi','zong','zou','zu','zuan','zui','zun','zuo'],
			zhuyinref = ['\u311A','\u311E','\u3122','\u3124','\u3120','\u3105\u311A','\u3105\u311E','\u3105\u3122','\u3105\u3124','\u3105\u3120','\u3105\u311F','\u3105\u3123','\u3105\u3125','\u3105\u30FC','\u3105\u30FC\u3122','\u3105\u30FC\u3120','\u3105\u30FC\u311D','\u3105\u30FC\u3123','\u3105\u30FC\u3125','\u3105\u311B','\u3105\u3128','\u3118\u311A','\u3118\u311E','\u3118\u3122','\u3118\u3124','\u3118\u3120','\u3118\u311C','\u3118\u3123','\u3118\u3125','\u3114\u311A','\u3114\u311E','\u3114\u3122','\u3114\u3124','\u3114\u3120','\u3114\u311C','\u3114\u3123','\u3114\u3125','\u3114','\u3114\u3128\u3125','\u3114\u3121','\u3114\u3128','\u3114\u3128\u311A','\u3114\u3128\u311E','\u3114\u3128\u3122','\u3114\u3128\u3124','\u3114\u3128\u311F','\u3114\u3128\u3123','\u3114\u3128\u311B','\u3118','\u3118\u3128\u3125','\u3118\u3121','\u3118\u3128','\u3118\u3128\u3122','\u3118\u3128\u311F','\u3118\u3128\u3123','\u3118\u3128\u311B','\u3109\u311A','\u3109\u311E','\u3109\u3122','\u3109\u3124','\u3109\u3120','\u3109\u311C','\u3109\u3125','\u3109\u30FC','\u3109\u30FC\u3122','\u3109\u30FC\u3124','\u3109\u30FC\u3120','\u3109\u30FC\u311D','\u3109\u30FC\u3125','\u3109\u30FC\u3121','\u3109\u3128\u3125','\u3109\u3121','\u3109\u3128','\u3109\u3128\u3122','\u3109\u3128\u311F','\u3109\u3128\u3123','\u3109\u3128\u311B','\u311C','\u311F','\u3123','\u3126','\u3108\u311A','\u3108\u3122','\u3108\u3124','\u3108\u311F','\u3108\u3123','\u3108\u3125','\u3108\u311B','\u3108\u3121','\u3108\u3128','\u310D\u311A','\u310D\u311E','\u310D\u3122','\u310D\u3124','\u310D\u3120','\u310D\u311C','\u310D\u311F','\u310D\u3123','\u310D\u3125','\u310D\u3128\u3125','\u310D\u3121','\u310D\u3128','\u310D\u3128\u311A','\u310D\u3128\u311E','\u310D\u3128\u3122','\u310D\u3128\u3124','\u310D\u3128\u311F','\u310D\u3128\u3123','\u310D\u3128\u311B','\u310F\u311A','\u310F\u311E','\u310F\u3122','\u310F\u3124','\u310F\u3120','\u310F\u311C','\u310F\u311F','\u310F\u3123','\u310F\u3125','\u310F\u3128\u3125','\u310F\u3121','\u310F\u3128','\u310F\u3128\u311A','\u310F\u3128\u311E','\u310F\u3128\u3122','\u310F\u3128\u3124','\u310F\u3128\u311F','\u310F\u3128\u3123','\u310F\u3128\u311B','\u3110\u30FC','\u3110\u30FC\u311A','\u3110\u30FC\u3122','\u3110\u30FC\u3124','\u3110\u30FC\u3120','\u3110\u30FC\u311D','\u3110\u30FC\u3123','\u3110\u30FC\u3125','\u3110\u3129\u3125','\u3110\u30FC\u3121','\u3110\u3129','\u3110\u3129\u3122','\u3110\u3129\u311D','\u3110\u3129\u3123','\u310E\u311A','\u310E\u311E','\u310E\u3122','\u310E\u3124','\u310E\u3120','\u310E\u311C','\u310E\u3123','\u310E\u3125','\u310E\u3128\u3125','\u310E\u3121','\u310E\u3128','\u310E\u3128\u311A','\u310E\u3128\u311E','\u310E\u3128\u3122','\u310E\u3128\u3124','\u310E\u3128\u311F','\u310E\u3128\u3123','\u310E\u3128\u311B','\u310C\u311A','\u310C\u311E','\u310C\u3122','\u310C\u3124','\u310C\u3120','\u310C\u311C','\u310C\u311F','\u310C\u3125','\u310C\u30FC','\u310C\u30FC\u3122','\u310C\u30FC\u3124','\u310C\u30FC\u3120','\u310C\u30FC\u311D','\u310C\u30FC\u3123','\u310C\u30FC\u3125','\u310C\u30FC\u3121','\u310C\u3128\u3125','\u310C\u3121','\u310C\u3128','\u310C\u3129','\u310C\u3128\u3122','\u310C\u3129\u311D','\u310C\u3128\u3123','\u310C\u3128\u311B','\u3107\u311A','\u3107\u311E','\u3107\u3122','\u3107\u3124','\u3107\u3120','\u3107\u311C','\u3107\u311F','\u3107\u3123','\u3107\u3125','\u3107\u30FC','\u3107\u30FC\u3122','\u3107\u30FC\u3120','\u3107\u30FC\u311D','\u3107\u30FC\u3123','\u3107\u30FC\u3125','\u3107\u30FC\u3121','\u3107\u3128\u311B','\u3107\u3121','\u3107\u3128','\u310B\u311A','\u310B\u311E','\u310B\u3122','\u310B\u3124','\u310B\u3120','\u310B\u311B','\u310B\u311F','\u310B\u3123','\u310B\u3125','\u310B\u30FC','\u310B\u30FC\u311A','\u310B\u30FC\u3122','\u310B\u30FC\u3124','\u310B\u30FC\u3120','\u310B\u30FC\u311D','\u310B\u30FC\u3123','\u310B\u30FC\u3125','\u310B\u30FC\u3121','\u310B\u3128\u3125','\u310B\u3121','\u310B\u3128','\u310B\u3129','\u310B\u3128\u3122','\u310B\u3129\u311D','\u310B\u3128\u311B','\u310B\u3128\u3123','\u3121','\u3106\u311A','\u3106\u311E','\u3106\u3122','\u3106\u3124','\u3106\u3120','\u3106\u311F','\u3106\u3123','\u3106\u3125','\u3106\u30FC','\u3106\u30FC\u3122','\u3106\u30FC\u3120','\u3106\u30FC\u311D','\u3106\u30FC\u3123','\u3106\u30FC\u3125','\u3106\u3128\u311B','\u3106\u3121','\u3106\u3128','\u3111\u30FC','\u3111\u30FC\u311A','\u3111\u30FC\u3122','\u3111\u30FC\u3124','\u3111\u30FC\u3120','\u3111\u30FC\u311D','\u3111\u30FC\u3123','\u3111\u30FC\u3125','\u3111\u3129\u3125','\u3111\u30FC\u3121','\u3111\u3129','\u3111\u3129\u3122','\u3111\u3129\u311D','\u3111\u3129\u3123','\u3116\u3122','\u3116\u3124','\u3116\u3120','\u3116\u311C','\u3116\u3123','\u3116\u3125','\u3116','\u3116\u3128\u3125','\u3116\u3121','\u3116\u3128','\u3116\u3128\u3122','\u3116\u3128\u311F','\u3116\u3128\u3123','\u3116\u3128\u311B','\u3119\u311A','\u3119\u311E','\u3119\u3122','\u3119\u3124','\u3119\u3120','\u3119\u311C','\u3119\u311F','\u3119\u3123','\u3119\u3125','\u3115\u311A','\u3115\u311E','\u3115\u3122','\u3115\u3124','\u3115\u3120','\u3115\u311C','\u3115\u311F','\u3115\u3123','\u3115\u3125','\u3115','\u3115\u3121\u3125','\u3115\u3121','\u3115\u3128','\u3115\u3128\u311A','\u3115\u3128\u311E','\u3115\u3128\u3122','\u3115\u3128\u3124','\u3115\u3128\u311F','\u3115\u3128\u3123','\u3115\u3128\u311B','\u3119','\u3119\u3128\u3125','\u3119\u3121','\u3119\u3128','\u3119\u3128\u3122','\u3119\u3128\u311F','\u3119\u3128\u3123','\u3119\u3128\u311B','\u310A\u311A','\u310A\u311E','\u310A\u3122','\u310A\u3124','\u310A\u3120','\u310A\u311C','\u310A\u3125','\u310A\u30FC','\u310A\u30FC\u3122','\u310A\u30FC\u3120','\u310A\u30FC\u311D','\u310A\u30FC\u3125','\u310A\u3128\u3125','\u310A\u3121','\u310A\u3128','\u310A\u3128\u3122','\u310A\u3128\u311F','\u310A\u3128\u3123','\u310A\u3128\u311B','\u3128\u311A','\u3128\u311E','\u3128\u3122','\u3128\u3124','\u3128\u311F','\u3128\u3123','\u3128\u3125','\u3128\u311B','\u3128','\u3112\u30FC','\u3112\u30FC\u311A','\u3112\u30FC\u3122','\u3112\u30FC\u3124','\u3112\u30FC\u3120','\u3112\u30FC\u311D','\u3112\u30FC\u3123','\u3112\u30FC\u3125','\u3112\u3129\u3125','\u3112\u30FC\u3121','\u3112\u3129','\u3112\u3129\u3122','\u3112\u3129\u311D','\u3112\u3129\u3123','\u30FC\u311A','\u30FC\u311E','\u30FC\u3122','\u30FC\u3124','\u30FC\u3120','\u30FC\u311D','\u30FC','\u30FC\u3123','\u30FC\u3125','\u30FC\u311B','\u3129\u3125','\u30FC\u3121','\u3129','\u3129\u3122','\u3129\u311D','\u3129\u3123','\u3117\u311A','\u3117\u311E','\u3117\u3122','\u3117\u3124','\u3117\u3120','\u3117\u311C','\u3117\u311F','\u3117\u3123','\u3117\u3125','\u3113\u311A','\u3113\u311E','\u3113\u3122','\u3113\u3124','\u3113\u3120','\u3113\u311C','\u3113\u311F','\u3113\u3123','\u3113\u3125','\u3113','\u3113\u3128\u3125','\u3113\u3121','\u3113\u3128','\u3113\u3128\u311A','\u3113\u3128\u311E','\u3113\u3128\u3122','\u3113\u3128\u3124','\u3113\u3128\u311F','\u3113\u3128\u3123','\u3113\u3128\u311B','\u3117','\u3117\u3128\u3125','\u3117\u3121','\u3117\u3128','\u3117\u3128\u3122','\u3117\u3128\u311F','\u3117\u3128\u3123','\u3117\u3128\u311B'];

        // Pinyin info
	    var _a = [ "\u0101", "\u00E1", "\u01CE", "\u00E0", "a"];
	    var _e = [ "\u0113", "\u00E9", "\u011B", "\u00E8", "e"];
	    var _i = [ "\u012B", "\u00ED", "\u01D0", "\u00EC", "i"];
	    var _o = [ "\u014D", "\u00F3", "\u01D2", "\u00F2", "o"];
	    var _u = [ "\u016B", "\u00FA", "\u01D4", "\u00F9", "u"];
	    var _v = [ "\u01D6", "\u01D8", "\u01DA", "\u01DC", "\u00FC"];
		var ztone = ['', '\u02CA', '\u02C7', '\u02CB', '\u30FB'];
		
		var result = { };
		result.tones = [ ];

		var addToneMarks = false,
			addToneNums = false,
			addZhuyin = false;

        switch (lcxMain.config.pinyin) {
			case "tonemarks": addToneMarks = true; break;
			case "tonenums":
				addToneNums = true;
                var tonenums = [ ];
				break;
			case "zhuyin":
				addZhuyin = true;
                var zhuyin = [ ];
				break;
        }

	    pinyin = pinyin.split(" ");
	    for( var i = 0; i < pinyin.length; i++){
	    	var pin = pinyin[i].replace('u:', "\u00FC");
	    	var tone = 4;

	    	if (addToneNums) { tonenums.push(pin.toLowerCase()); }
			
	    	if( pin.indexOf("1") !== -1 ) tone = 0;
	    	else if( pin.indexOf("2") !== -1 ) tone = 1;
	    	else if( pin.indexOf("3") !== -1 ) tone = 2;
	    	else if( pin.indexOf("4") !== -1 ) tone = 3;
	    	
	    	result.tones.push(tone+1);

	    	if (addZhuyin) {
                var prepin = pin.substring(0, pin.length - 1);
                var indx = pinyinref.indexOf(prepin.toLowerCase());
                zhuyin.push(zhuyinref[indx] + ztone[tone]);
            }

            if (addToneMarks) {
				if( pin.indexOf("a") !== -1 ) pin = pin.replace( "a", _a[tone] );
				else if( pin.indexOf("e") !== -1 ) pin = pin.replace( "e", _e[tone] );
				else if( pin.indexOf("ou") !== -1 ) pin = pin.replace( "o", _o[tone] );
				else {
					for( var k = pin.length - 1; k >= 0; k--){
						if( this.isVowel(pin[k] ) ){
							switch(pin[k]){
								case 'i':  pin = pin.replace( "i", _i[tone] ); break;
								case 'o':  pin = pin.replace( "o", _o[tone] ); break;
								case 'u':  pin = pin.replace( "u", _u[tone] ); break;
								case '\u00FC': pin = pin.replace( "\u00FC", _v[tone] ); break;
								default: console.log("Exception: weird vowel " + pin[k]);
							}
							break;
						}
					}
				}
                //strip the number
                pinyin[i] = pin.substring(0, pin.length - 1);
            }
	    }

	    // Add only relevant readings to pinyin object (smaller memory footprint)
	    if (addToneMarks) result.tonemarks = pinyin.join(" ");
		if (addToneNums) result.tonenums = tonenums.join(" ");
		if (addZhuyin) result.zhuyin = zhuyin.join(" ");

        return result;
	}
};
