/*
	LiuChan - A port of Rikaikun to Chinese
	By Aldert Vaandering (2017)
	https://gitlab.com/paperfeed/liuchan

	---

	Rikaikun
	Copyright (C) 2010 Erek Speed
	http://code.google.com/p/rikaikun/
	
	---

	Originally based on Rikaichan 1.07
	by Jonathan Zarate
	http://www.polarcloud.com/

	---

	Originally based on RikaiXUL 0.4 by Todd Rudick
	http://www.rikai.com/
	http://rikaixul.mozdev.org/

	---

	This program is free software; you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation; either version 2 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program; if not, write to the Free Software
	Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

	---

	Please do not change or remove any of the copyrights or links to web pages
	when modifying any of the files. - Jon

*/

/**
 * LiuChan Dictionary Class
 * @constructor
 */
function lcxDict() {
	//this.loadDictionary();
}

lcxDict.prototype = {
	config: {},

	setConfig: function(c) {
		this.config = c;
	},

	loadDictionaries: function() {
		return Promise.all([
			this.loadDictionary()
		]);
	},
	
	fileRead: function(filename, field) {
		var self = this;
		return new Promise(function(resolve, reject) {
			var req = new XMLHttpRequest();
			req.onreadystatechange = function() {
				if (this.readyState !== XMLHttpRequest.DONE) {
					return;
				}
				if (this.status !== 200) {
					console.error("Can't load", filename);
					reject("sorry");
					return;
				}
				if (field) {
					self[field] = this.responseText;
					resolve(true);
				} else {
					resolve(this.responseText);
				}
			};
			req.open("GET", chrome.extension.getURL(filename));
			req.send(null);
		});
	},

	fileReadArray: function(name, charset) {
		var a = this.fileRead(name, charset).split('\n');
		// Is this just in case there is blank shit in the file.  It was writtin by Jon though.
		// I suppose this is more robust
		while ((a.length > 0) && (a[a.length - 1].length === 0)) a.pop();
		return a;
	},

	loadDictionary: function() {
		//this.wordDict = this.fileRead(chrome.extension.getURL("data/dict.dat"));
		//this.wordIndex = this.fileRead(chrome.extension.getURL("data/dict.idx"));

		return Promise.all([
			this.fileRead("data/dict.dat", "wordDict"),
			this.fileRead("data/dict.idx", "wordIndex")
		]);
	},

	getUniqueArray: function(arr) {
		var a = [];
	    var l = arr.length;
	    for(var i=0; i<l; i++) {
	      for(var j=i+1; j<l; j++) {
	        // If this[i] is found later in the array
	        if (arr[i] === arr[j])
	          j = ++i;
	      }
	      a.push(arr[i]);
	    }
	    return a;
	},
	
	indexSearch: function (book, word) {
		var hit, k, start, end;
		var results = [];
		var indexString;
		var hanzisep = "\u30FB";
		var indexsep = "\uFF1A";
		
		//find all hits for traditional characters
		hit = book.indexOf( "\n" + word + hanzisep);
		while (hit !== -1) {
			start = book.indexOf(indexsep, hit) + 1;
			end = book.indexOf("\n", start);
			indexString = book.substr(start, end - start); 
			results.push(parseInt(indexString));
			
			hit = book.indexOf( "\n" + word + hanzisep, hit+1);
		}
		
		//find all hits for simplified characters
		hit = book.indexOf(hanzisep + word + indexsep);
		while (hit !== -1) {
			start = book.indexOf(indexsep, hit) + 1;
			end = book.indexOf("\n", start);
			indexString = book.substr(start, end - start); 
			results.push(parseInt(indexString));
			
			hit = book.indexOf(hanzisep + word + indexsep, hit+1);
		}
		
		return this.getUniqueArray(results).sort();
	},
	
	wordSearch: function (word) {
		var i;
		
		var entryobj = {};
		entryobj.data = [];
		
		var rawentries = [];
		while (word.length > 0) {
			//hits = start of the lines in the dict where the entries are
		    var hits = this.indexSearch(this.wordIndex, word);
		    
			for (i = 0; i < hits.length; i++) {
				var end = this.wordDict.indexOf("\n", hits[i]) - 1;
				var entryline = this.wordDict.substr(hits[i], end - hits[i]);
				rawentries.push(entryline);
			}
			word = word.substr(0, word.length - 1);
		}

		entryobj.matchLen = 0;		
		for (i = 0; i < rawentries.length; i++) {
			//set highlight length to longest match
			var hanziLen = rawentries[i].indexOf(" ");
			if (hanziLen > entryobj.matchLen)
				entryobj.matchLen = hanziLen;
			
			entryobj.data.push([rawentries[i], null]);
		}
		return entryobj;
    },

	parseCEdictLine: function (entry) {
		var space1 = entry.indexOf(" ");
		var space2 = entry.indexOf(" ", space1 + 1);
		var bracket1 = entry.indexOf("[");
		var bracket2 = entry.indexOf("]");
		var slash1 = entry.indexOf("/");
		var slash2 = entry.lastIndexOf("/");
		
		var params = {};
		
		params.trad = entry.substr(0, space1);
		params.simp = entry.substr(space1 + 1, space2 - space1 - 1);
		params.pinyin = this.parsePinyin( entry.substr(bracket1 + 1, bracket2 - bracket1 - 1) );
		params.def = entry.substr(slash1 + 1, slash2 - slash1 - 1);
		
		return params;
	},
	
	makeHtml: function(entry) {
		var trad, simp, pinyin, def;
		var i, j, k, e;
		
		if (entry === null) return '';

		var b = [];
		
		if (entry.title)
			b.push('<div class="w-title">' + entry.title + '</div>');

		for (i = 0; i < entry.data.length; ++i) {
			e = entry.data[i][0].match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
			if (!e) continue;

			trad = e[1].split(" ")[0];
			simp = e[1].split(" ")[1];
			pinyin = this.parsePinyin(e[2]);
			def = e[3];

			//HANZI
			k = "";
			if ("botht" === localStorage['showHanzi'] || "boths" === localStorage['showHanzi']) {
				var first  = localStorage['showHanzi'] === "botht" ? trad : simp;
				var second = localStorage['showHanzi'] === "botht" ? simp : trad;
				
				//add the repetition dot if trad == simp
				var newsecond = [];
				for (j = 0; j < first.length; j++) {
					if (first[j] === second[j])
						newsecond.push('\u30FB');
					else
						newsecond.push(second[j]);
				}
				second = newsecond.join('');
				
				if (localStorage['doColors'] === "yes") {
					for( j = 0; j < pinyin.tones.length; j++)
						k += '<span class="w-hanzi' + pinyin.tones[j] + '">' + first[j] + '</span>';
					k += '　';
					for( j = 0; j < pinyin.tones.length; j++)
						k += '<span class="w-hanzi' + pinyin.tones[j] + '">' + second[j] + '</span>';
				}
				else
					k += '<span class="w-hanzi3">' + first + '</span>　<span class="w-hanzi3">'　+ second + '</span>';
			}
			else {
				var hanzi = localStorage['showHanzi'] === "simp" ? simp : trad;
				if (localStorage['doColors'] === "yes")
					for( j = 0; j < pinyin.tones.length; j++)
						k += '<span class="w-hanzi' + pinyin.tones[j] + '">' + hanzi[j] + '</span>';
				else
					k += '<span class="w-hanzi3">' + hanzi + '</span>';
			}
			
			//PINYIN
			k += '&#32;&#32; <span class="w-kana">';
			if      ("tonenums" === localStorage['pinyin']) k += pinyin.tonenums  + '</span>';
			else if ("zhuyin"   === localStorage['pinyin']) k += pinyin.zhuyin    + '</span>';
			else 										   k += pinyin.tonemarks + '</span>';

			b.push(k);

			//DEFINITION
			def = e[3].replace(/\//g, '; ');
			b.push('<br/><span class="w-def">' + def + '</span>');
		}
		
		if (entry.more) b.push('...<br/>');

		return b.join('');
	},

	makeText: function(entry, max) {
		var e;
		var b;
		var i, j;
		var t;

		if (entry === null) return '';

		b = [];

		if (max > entry.data.length) max = entry.data.length;
		for (i = 0; i < max; ++i) {
			e = entry.data[i][0].match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
			if (!e) continue;

			if (e[2]) {
				b.push(e[1] + '\t' + e[2]);
			}
			else {
				b.push(e[1]);
			}

			t = e[3].replace(/\//g, '; ');
			if (false/* !this.config.wpos */) t = t.replace(/^\([^)]+\)\s*/, '');
			if (false/* !this.config.wpop */) t = t.replace('; (P)', '');
			b.push('\t' + t + '\n');
		}
		return b.join('');
	},
	
	pinyinref: ['a','ai','an','ang','ao','ba','bai','ban','bang','bao','bei','ben','beng','bi','bian','biao','bie','bin','bing','bo','bu','ca','cai','can','cang','cao','ce','cen','ceng','cha','chai','chan','chang','chao','che','chen','cheng','chi','chong','chou','chu','chua','chuai','chuan','chuang','chui','chun','chuo','ci','cong','cou','cu','cuan','cui','cun','cuo','da','dai','dan','dang','dao','de','deng','di','dian','diang','diao','die','ding','diu','dong','dou','du','duan','dui','dun','duo','e','ei','en','er','fa','fan','fang','fei','fen','feng','fo','fou','fu','ga','gai','gan','gang','gao','ge','gei','gen','geng','gong','gou','gu','gua','guai','guan','guang','gui','gun','guo','ha','hai','han','hang','hao','he','hei','hen','heng','hong','hou','hu','hua','huai','huan','huang','hui','hun','huo','ji','jia','jian','jiang','jiao','jie','jin','jing','jiong','jiu','ju','juan','jue','jun','ka','kai','kan','kang','kao','ke','ken','keng','kong','kou','ku','kua','kuai','kuan','kuang','kui','kun','kuo','la','lai','lan','lang','lao','le','lei','leng','li','lian','liang','liao','lie','lin','ling','liu','long','lou','lu','l\u00FC','luan','l\u00FCe','lun','luo','ma','mai','man','mang','mao','me','mei','men','meng','mi','mian','miao','mie','min','ming','miu','mo','mou','mu','na','nai','nan','nang','nao','ne','nei','nen','neng','ni','nia','nian','niang','niao','nie','nin','ning','niu','nong','nou','nu','n\u00FC','nuan','n\u00FCe','nuo','nun','ou','pa','pai','pan','pang','pao','pei','pen','peng','pi','pian','piao','pie','pin','ping','po','pou','pu','qi','qia','qian','qiang','qiao','qie','qin','qing','qiong','qiu','qu','quan','que','qun','ran','rang','rao','re','ren','reng','ri','rong','rou','ru','ruan','rui','run','ruo','sa','sai','san','sang','sao','se','sei','sen','seng','sha','shai','shan','shang','shao','she','shei','shen','sheng','shi','shong','shou','shu','shua','shuai','shuan','shuang','shui','shun','shuo','si','song','sou','su','suan','sui','sun','suo','ta','tai','tan','tang','tao','te','teng','ti','tian','tiao','tie','ting','tong','tou','tu','tuan','tui','tun','tuo','wa','wai','wan','wang','wei','wen','weng','wo','wu','xi','xia','xian','xiang','xiao','xie','xin','xing','xiong','xiu','xu','xuan','xue','xun','ya','yai','yan','yang','yao','ye','yi','yin','ying','yo','yong','you','yu','yuan','yue','yun','za','zai','zan','zang','zao','ze','zei','zen','zeng','zha','zhai','zhan','zhang','zhao','zhe','zhei','zhen','zheng','zhi','zhong','zhou','zhu','zhua','zhuai','zhuan','zhuang','zhui','zhun','zhuo','zi','zong','zou','zu','zuan','zui','zun','zuo'],
	zhuyinref: ['\u311A','\u311E','\u3122','\u3124','\u3120','\u3105\u311A','\u3105\u311E','\u3105\u3122','\u3105\u3124','\u3105\u3120','\u3105\u311F','\u3105\u3123','\u3105\u3125','\u3105\u30FC','\u3105\u30FC\u3122','\u3105\u30FC\u3120','\u3105\u30FC\u311D','\u3105\u30FC\u3123','\u3105\u30FC\u3125','\u3105\u311B','\u3105\u3128','\u3118\u311A','\u3118\u311E','\u3118\u3122','\u3118\u3124','\u3118\u3120','\u3118\u311C','\u3118\u3123','\u3118\u3125','\u3114\u311A','\u3114\u311E','\u3114\u3122','\u3114\u3124','\u3114\u3120','\u3114\u311C','\u3114\u3123','\u3114\u3125','\u3114','\u3114\u3128\u3125','\u3114\u3121','\u3114\u3128','\u3114\u3128\u311A','\u3114\u3128\u311E','\u3114\u3128\u3122','\u3114\u3128\u3124','\u3114\u3128\u311F','\u3114\u3128\u3123','\u3114\u3128\u311B','\u3118','\u3118\u3128\u3125','\u3118\u3121','\u3118\u3128','\u3118\u3128\u3122','\u3118\u3128\u311F','\u3118\u3128\u3123','\u3118\u3128\u311B','\u3109\u311A','\u3109\u311E','\u3109\u3122','\u3109\u3124','\u3109\u3120','\u3109\u311C','\u3109\u3125','\u3109\u30FC','\u3109\u30FC\u3122','\u3109\u30FC\u3124','\u3109\u30FC\u3120','\u3109\u30FC\u311D','\u3109\u30FC\u3125','\u3109\u30FC\u3121','\u3109\u3128\u3125','\u3109\u3121','\u3109\u3128','\u3109\u3128\u3122','\u3109\u3128\u311F','\u3109\u3128\u3123','\u3109\u3128\u311B','\u311C','\u311F','\u3123','\u3126','\u3108\u311A','\u3108\u3122','\u3108\u3124','\u3108\u311F','\u3108\u3123','\u3108\u3125','\u3108\u311B','\u3108\u3121','\u3108\u3128','\u310D\u311A','\u310D\u311E','\u310D\u3122','\u310D\u3124','\u310D\u3120','\u310D\u311C','\u310D\u311F','\u310D\u3123','\u310D\u3125','\u310D\u3128\u3125','\u310D\u3121','\u310D\u3128','\u310D\u3128\u311A','\u310D\u3128\u311E','\u310D\u3128\u3122','\u310D\u3128\u3124','\u310D\u3128\u311F','\u310D\u3128\u3123','\u310D\u3128\u311B','\u310F\u311A','\u310F\u311E','\u310F\u3122','\u310F\u3124','\u310F\u3120','\u310F\u311C','\u310F\u311F','\u310F\u3123','\u310F\u3125','\u310F\u3128\u3125','\u310F\u3121','\u310F\u3128','\u310F\u3128\u311A','\u310F\u3128\u311E','\u310F\u3128\u3122','\u310F\u3128\u3124','\u310F\u3128\u311F','\u310F\u3128\u3123','\u310F\u3128\u311B','\u3110\u30FC','\u3110\u30FC\u311A','\u3110\u30FC\u3122','\u3110\u30FC\u3124','\u3110\u30FC\u3120','\u3110\u30FC\u311D','\u3110\u30FC\u3123','\u3110\u30FC\u3125','\u3110\u3129\u3125','\u3110\u30FC\u3121','\u3110\u3129','\u3110\u3129\u3122','\u3110\u3129\u311D','\u3110\u3129\u3123','\u310E\u311A','\u310E\u311E','\u310E\u3122','\u310E\u3124','\u310E\u3120','\u310E\u311C','\u310E\u3123','\u310E\u3125','\u310E\u3128\u3125','\u310E\u3121','\u310E\u3128','\u310E\u3128\u311A','\u310E\u3128\u311E','\u310E\u3128\u3122','\u310E\u3128\u3124','\u310E\u3128\u311F','\u310E\u3128\u3123','\u310E\u3128\u311B','\u310C\u311A','\u310C\u311E','\u310C\u3122','\u310C\u3124','\u310C\u3120','\u310C\u311C','\u310C\u311F','\u310C\u3125','\u310C\u30FC','\u310C\u30FC\u3122','\u310C\u30FC\u3124','\u310C\u30FC\u3120','\u310C\u30FC\u311D','\u310C\u30FC\u3123','\u310C\u30FC\u3125','\u310C\u30FC\u3121','\u310C\u3128\u3125','\u310C\u3121','\u310C\u3128','\u310C\u3129','\u310C\u3128\u3122','\u310C\u3129\u311D','\u310C\u3128\u3123','\u310C\u3128\u311B','\u3107\u311A','\u3107\u311E','\u3107\u3122','\u3107\u3124','\u3107\u3120','\u3107\u311C','\u3107\u311F','\u3107\u3123','\u3107\u3125','\u3107\u30FC','\u3107\u30FC\u3122','\u3107\u30FC\u3120','\u3107\u30FC\u311D','\u3107\u30FC\u3123','\u3107\u30FC\u3125','\u3107\u30FC\u3121','\u3107\u3128\u311B','\u3107\u3121','\u3107\u3128','\u310B\u311A','\u310B\u311E','\u310B\u3122','\u310B\u3124','\u310B\u3120','\u310B\u311B','\u310B\u311F','\u310B\u3123','\u310B\u3125','\u310B\u30FC','\u310B\u30FC\u311A','\u310B\u30FC\u3122','\u310B\u30FC\u3124','\u310B\u30FC\u3120','\u310B\u30FC\u311D','\u310B\u30FC\u3123','\u310B\u30FC\u3125','\u310B\u30FC\u3121','\u310B\u3128\u3125','\u310B\u3121','\u310B\u3128','\u310B\u3129','\u310B\u3128\u3122','\u310B\u3129\u311D','\u310B\u3128\u311B','\u310B\u3128\u3123','\u3121','\u3106\u311A','\u3106\u311E','\u3106\u3122','\u3106\u3124','\u3106\u3120','\u3106\u311F','\u3106\u3123','\u3106\u3125','\u3106\u30FC','\u3106\u30FC\u3122','\u3106\u30FC\u3120','\u3106\u30FC\u311D','\u3106\u30FC\u3123','\u3106\u30FC\u3125','\u3106\u3128\u311B','\u3106\u3121','\u3106\u3128','\u3111\u30FC','\u3111\u30FC\u311A','\u3111\u30FC\u3122','\u3111\u30FC\u3124','\u3111\u30FC\u3120','\u3111\u30FC\u311D','\u3111\u30FC\u3123','\u3111\u30FC\u3125','\u3111\u3129\u3125','\u3111\u30FC\u3121','\u3111\u3129','\u3111\u3129\u3122','\u3111\u3129\u311D','\u3111\u3129\u3123','\u3116\u3122','\u3116\u3124','\u3116\u3120','\u3116\u311C','\u3116\u3123','\u3116\u3125','\u3116','\u3116\u3128\u3125','\u3116\u3121','\u3116\u3128','\u3116\u3128\u3122','\u3116\u3128\u311F','\u3116\u3128\u3123','\u3116\u3128\u311B','\u3119\u311A','\u3119\u311E','\u3119\u3122','\u3119\u3124','\u3119\u3120','\u3119\u311C','\u3119\u311F','\u3119\u3123','\u3119\u3125','\u3115\u311A','\u3115\u311E','\u3115\u3122','\u3115\u3124','\u3115\u3120','\u3115\u311C','\u3115\u311F','\u3115\u3123','\u3115\u3125','\u3115','\u3115\u3121\u3125','\u3115\u3121','\u3115\u3128','\u3115\u3128\u311A','\u3115\u3128\u311E','\u3115\u3128\u3122','\u3115\u3128\u3124','\u3115\u3128\u311F','\u3115\u3128\u3123','\u3115\u3128\u311B','\u3119','\u3119\u3128\u3125','\u3119\u3121','\u3119\u3128','\u3119\u3128\u3122','\u3119\u3128\u311F','\u3119\u3128\u3123','\u3119\u3128\u311B','\u310A\u311A','\u310A\u311E','\u310A\u3122','\u310A\u3124','\u310A\u3120','\u310A\u311C','\u310A\u3125','\u310A\u30FC','\u310A\u30FC\u3122','\u310A\u30FC\u3120','\u310A\u30FC\u311D','\u310A\u30FC\u3125','\u310A\u3128\u3125','\u310A\u3121','\u310A\u3128','\u310A\u3128\u3122','\u310A\u3128\u311F','\u310A\u3128\u3123','\u310A\u3128\u311B','\u3128\u311A','\u3128\u311E','\u3128\u3122','\u3128\u3124','\u3128\u311F','\u3128\u3123','\u3128\u3125','\u3128\u311B','\u3128','\u3112\u30FC','\u3112\u30FC\u311A','\u3112\u30FC\u3122','\u3112\u30FC\u3124','\u3112\u30FC\u3120','\u3112\u30FC\u311D','\u3112\u30FC\u3123','\u3112\u30FC\u3125','\u3112\u3129\u3125','\u3112\u30FC\u3121','\u3112\u3129','\u3112\u3129\u3122','\u3112\u3129\u311D','\u3112\u3129\u3123','\u30FC\u311A','\u30FC\u311E','\u30FC\u3122','\u30FC\u3124','\u30FC\u3120','\u30FC\u311D','\u30FC','\u30FC\u3123','\u30FC\u3125','\u30FC\u311B','\u3129\u3125','\u30FC\u3121','\u3129','\u3129\u3122','\u3129\u311D','\u3129\u3123','\u3117\u311A','\u3117\u311E','\u3117\u3122','\u3117\u3124','\u3117\u3120','\u3117\u311C','\u3117\u311F','\u3117\u3123','\u3117\u3125','\u3113\u311A','\u3113\u311E','\u3113\u3122','\u3113\u3124','\u3113\u3120','\u3113\u311C','\u3113\u311F','\u3113\u3123','\u3113\u3125','\u3113','\u3113\u3128\u3125','\u3113\u3121','\u3113\u3128','\u3113\u3128\u311A','\u3113\u3128\u311E','\u3113\u3128\u3122','\u3113\u3128\u3124','\u3113\u3128\u311F','\u3113\u3128\u3123','\u3113\u3128\u311B','\u3117','\u3117\u3128\u3125','\u3117\u3121','\u3117\u3128','\u3117\u3128\u3122','\u3117\u3128\u311F','\u3117\u3128\u3123','\u3117\u3128\u311B'],
	
	isVowel: function (letter) {
		if( letter === "a" || letter === "e" || letter === "i" ||
		    letter === "o" || letter === "u" ) return true;
		return false; 
  	},
  	
	parsePinyin: function(pinyin) {
	    //pinyin info
	    var _a = [ "\u0101", "\u00E1", "\u01CE", "\u00E0", "a"];
	    var _e = [ "\u0113", "\u00E9", "\u011B", "\u00E8", "e"];
	    var _i = [ "\u012B", "\u00ED", "\u01D0", "\u00EC", "i"];
	    var _o = [ "\u014D", "\u00F3", "\u01D2", "\u00F2", "o"];
	    var _u = [ "\u016B", "\u00FA", "\u01D4", "\u00F9", "u"];
	    var _v = [ "\u01D6", "\u01D8", "\u01DA", "\u01DC", "\u00FC"];
		var ztone = ['', '\u02CA', '\u02C7', '\u02CB', '\u30FB'];
		
		var result = { };
		result.tones = [ ];
		var zhuyin = [ ];
		var tonenums = [ ];
				
	    pinyin = pinyin.split(" ");
	    for( var j = 0; j < pinyin.length; j++){
	    	var pin = pinyin[j].replace('u:', "\u00FC");
	    	var tone = 4;
			
			tonenums.push(pin);
			
	    	if( pin.indexOf("1") !== -1 ) tone = 0;
	    	else if( pin.indexOf("2") !== -1 ) tone = 1;
	    	else if( pin.indexOf("3") !== -1 ) tone = 2;
	    	else if( pin.indexOf("4") !== -1 ) tone = 3;
	    	
	    	result.tones.push(tone+1);
	    	
	    	var prepin = pin.substring(0, pin.length -1);
			var indx = this.pinyinref.indexOf(prepin.toLowerCase());
		  	zhuyin.push(this.zhuyinref[indx] + ztone[tone]);

	    	if( pin.indexOf("a") !== -1 ) pin = pin.replace( "a", _a[tone] );
	    	else if( pin.indexOf("e") !== -1 ) pin = pin.replace( "e", _e[tone] );
	    	else if( pin.indexOf("ou") !== -1 ) pin = pin.replace( "o", _o[tone] );
	    	else {
	    	 for( var k = pin.length - 1; k >= 0; k--){
	    		if( this.isVowel(pin[k]) ){
	    			switch(pin[k]){
	    			 case 'i':  pin = pin.replace( "i", _i[tone] ); break;
	    			 case 'o':  pin = pin.replace( "o", _o[tone] ); break;
	    			 case 'u':  pin = pin.replace( "u", _u[tone] ); break;
	    			 case '\u00FC': pin = pin.replace( "\u00FC", _v[tone] ); break; 
	    			 default: alert("some kind of weird vowel");
	    			}
	    		break;
	    		}
	    	 }
	      }
		  pinyin[j] = pin.substring(0, pin.length - 1);//strip the number
	    }
	    result.tonemarks = pinyin.join(" "); 
	    result.zhuyin = zhuyin.join(" ");
	    result.tonenums = tonenums.join(" ");
	   	return result;
	}
};
