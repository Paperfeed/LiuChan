import browser from 'webextension-polyfill'

import { convertToSimplified } from '@/utils/language'

interface DictionaryOptions {
  customTones: string[]
  definitionSeparator: string
  hanziType: string
  pinyinType: string
  showDefinition?: boolean
  useCustomTones: boolean
  useHanziToneColors: boolean
  usePinyinToneColors: boolean
}

export interface DictionaryEntry {
  def: string
  length: number
  pinyin: any
  simp: string
  trad: string
}

interface PinyinResult {
  tonemarks?: string
  tonenums?: string
  tones: number[]
  zhuyin?: string
}

interface SearchResult {
  definitions: DictionaryEntry[]
  matchLength?: number
}

export class Dictionary {
  protected data: Map<string, DictionaryEntry>
  protected config: DictionaryOptions

  private readonly dictFile: string

  constructor(dictFile = 'data/cedict_ts.u8', options: DictionaryOptions) {
    this.dictFile = dictFile
    this.config = options
    this.config.showDefinition = true
  }

  async loadDictionary() {
    const data = await this.readFile(this.dictFile)
    this.parseDictionary(data)
  }

  unloadDictionary() {
    this.data = undefined
  }

  async readFile(filename: string) {
    const response = await fetch(browser.runtime.getURL(filename))
    return await response.text()
  }

  parseDictionary(dict: string) {
    // Match every entry in the dictionary and map it to an object
    const regEx = /(.+?)\s(.+?)\s\[(.+?)\]\s\/(.+)\//gi
    const pinyinType = this.config.pinyinType
    const map = new Map()

    let result: string[],
      longestString = 0

    while ((result = regEx.exec(dict))) {
      const traditional = result[1]
      const simplified = result[2]
      const pinyin = this.parsePinyin(result[3])

      if (simplified.length > longestString) longestString = simplified.length

      // Replace pinyin in definitions with user specified pinyin
      const hasPinyin = /\[((?:[a-z]+\d\s?)+)\]/gi
      let res,
        def = result[4]

      while ((res = hasPinyin.exec(result[4]))) {
        def = def.replace(
          res[0],
          '[' + this.parsePinyin(res[1])[pinyinType] + ']'
        )
      }

      const definition = def.split('/')
      const key = simplified.charAt(0)
      const value = map.get(key)

      const entry = {
        def: definition,
        pinyin: pinyin,
        simp: simplified,
        trad: traditional,
      }

      if (value) {
        value.push(entry)
        map.set(key, value)
      } else {
        map.set(key, [entry])
      }
    }

    this.data = map

    // I noticed that chrome keeps the last regex match in memory
    // which in this case is the entire dictionary file, so this is to lower the memory footprint
    ;/./g.exec('c')
    console.log('Dictionary Loaded', this.data)
    console.log('Longest string:', longestString)
  }

  parseDefinitions(def) {
    if (def.length === 1) {
      return def
    }
    if (this.config.definitionSeparator === 'num') {
      let str = ''
      for (let i = 0; i < def.length; i++) {
        str += '<b>' + (i + 1) + '</b> ' + def[i] + ' '
      }
      return str.trim()
    } else {
      return def.join(this.config.definitionSeparator)
    }
  }

  search(word: string) {
    // Convert to simplified so we only have to index search for one type of character
    // making it easier to get through the data quickly.
    word = convertToSimplified(word)

    const index = this.data.get(word.charAt(0))
    if (!index) return // If first character doesn't match with anything, stop looking

    const results: SearchResult = { definitions: [] }

    // Loop through all matched text and delete one character off the end each loop, returning all matches
    for (let length = word.length; length > 0; length--) {
      for (let i = 0, len = index.length; i < len; i++) {
        if (index[i].simp === word) {
          // Save the length of the longest result (for selection purposes)
          if (!results.matchLength) results.matchLength = word.length
          results.definitions.push(index[i])
        }
      }

      word = word.substr(0, length - 1)
    }

    if (!results) return
    return results
  }

  makeHtml(entry: SearchResult) {
    console.log('ENTRY', entry)
    if (entry == null) return ''

    let trad, simp, pinyin, def
    let html,
      b = []

    b.push('<div class="liuchan-container">')

    for (let a = 0, len = entry.definitions.length; a < len; a++) {
      // Parsing the pinyin removes numbers, adds tone marks, etc
      trad = entry.definitions[a].trad
      simp = entry.definitions[a].simp
      def = ''
      pinyin = entry.definitions[a].pinyin
      def = this.parseDefinitions(entry.definitions[a].def)

      // Select whether to show traditional or simple first/only
      let first,
        second,
        addSecond = false
      // Note: Fallthrough is on purpose!
      // noinspection FallThroughInSwitchStatementJS
      switch (this.config.hanziType) {
        case 'boths':
          addSecond = true
          second = trad
        case 'simp':
          first = simp
          break
        case 'botht':
          addSecond = true
          second = simp
        case 'trad':
          first = trad
      }

      //HANZI
      html = '<div class="entry"><div class="hanzi">'

      // If simple and traditional characters are completely identical, skip this
      // otherwise add both sets to the entry if user has chosen to do so
      if (first !== second && addSecond) {
        // Replace identical characters from both sets with a dot/hyphen
        const newsecond = []
        for (let i = 0, len = first.length; i < len; i++) {
          if (first[i] === second[i]) newsecond.push('\u30FB')
          else newsecond.push(second[i])
        }
        second = newsecond.join('')

        // Add tone colors to every character
        if (this.config.useHanziToneColors === true) {
          // User has specified custom colors, use those instead
          if (this.config.useCustomTones) {
            let tone
            for (let i = 0, len = pinyin.tones.length; i < len; i++) {
              tone = pinyin.tones[i]
              html +=
                '<span class="tone' +
                tone +
                '" style="color:' +
                this.config.customTones[tone - 1] +
                '">' +
                first.charAt(i) +
                '</span>'
            }

            html += '<span class="spacer"></span><span class="brace">[</span>'
            for (let i = 0, len = pinyin.tones.length; i < len; i++) {
              tone = pinyin.tones[i]
              html +=
                '<span class="tone' +
                tone +
                '" style="color:' +
                this.config.customTones[tone - 1] +
                '">' +
                second.charAt(i) +
                '</span>'
            }
            html += '<span class="brace">]</span>'
          } else {
            for (let i = 0, len = pinyin.tones.length; i < len; i++) {
              html +=
                '<span class="tone' +
                pinyin.tones[i] +
                '">' +
                first.charAt(i) +
                '</span>'
            }

            html += '<span class="spacer"></span><span class="brace">[</span>'
            for (let i = 0, len = pinyin.tones.length; i < len; i++) {
              html +=
                '<span class="tone' +
                pinyin.tones[i] +
                '">' +
                second.charAt(i) +
                '</span>'
            }
            html += '<span class="brace">]</span>'
          }
        } else {
          html +=
            '<span class="tone1">' +
            first +
            '</span><span class="spacer"></span>' +
            '<span class="tone1"><span class="brace">[</span>' +
            second +
            '<span class="brace">]</span></span>'
        }
      } else {
        // Add tone colors to every character
        if (this.config.useHanziToneColors === true) {
          let tone
          if (this.config.useCustomTones) {
            for (let i = 0, len = pinyin.tones.length; i < len; i++) {
              tone = pinyin.tones[i]
              html +=
                '<span class="tone' +
                tone +
                '" style="color:' +
                this.config.customTones[tone - 1] +
                '">' +
                first.charAt(i) +
                '</span>'
            }
          } else {
            for (let i = 0, len = pinyin.tones.length; i < len; i++) {
              html +=
                '<span class="tone' +
                pinyin.tones[i] +
                '">' +
                first.charAt(i) +
                '</span>'
            }
          }
        } else {
          html += '<span class="tone1">' + first + '</span>'
        }
      }

      //PINYIN
      html += '</div><div class="pinyin">'

      if (this.config.usePinyinToneColors) {
        let str
        switch (this.config.pinyinType) {
          case 'tonenums':
            str = pinyin.tonenums.split(' ')
            break
          case 'zhuyin':
            str = pinyin.zhuyin.split(' ')
            break
          default:
            str = pinyin.tonemarks.split(' ')
        }

        if (this.config.useCustomTones) {
          let tone
          for (let i = 0, len = pinyin.tones.length; i < len; i++) {
            tone = pinyin.tones[i]
            html +=
              '<span class="tone' +
              tone +
              '" style="color:' +
              this.config.customTones[tone - 1] +
              '">' +
              str[i] +
              ' </span>'
          }
        } else {
          for (let i = 0, len = pinyin.tones.length; i < len; i++) {
            html +=
              '<span class="tone' + pinyin.tones[i] + '">' + str[i] + ' </span>'
          }
        }
      } else {
        if (this.config.useCustomTones) {
          switch (this.config.pinyinType) {
            case 'tonenums':
              html +=
                '<span style="color:' +
                this.config.customTones[5] +
                '">' +
                pinyin.tonenums +
                '</span></span>'
              break
            case 'zhuyin':
              html +=
                '<span style="color:' +
                this.config.customTones[5] +
                '">' +
                pinyin.zhuyin +
                '</span></span>'
              break
            default:
              html +=
                '<span style="color:' +
                this.config.customTones[5] +
                '">' +
                pinyin.tonemarks +
                '</span></span>'
          }
        } else {
          switch (this.config.pinyinType) {
            case 'tonenums':
              html += pinyin.tonenums + '</span>'
              break
            case 'zhuyin':
              html += pinyin.zhuyin + '</span>'
              break
            default:
              html += pinyin.tonemarks + '</span>'
          }
        }
      }

      b.push(html)

      //DEFINITION
      if (this.config.showDefinition) {
        b.push('</div><div class="def">' + def + '</div></div>')
      } else {
        b.push('</div></div>')
      }
    }

    return b.join('')
  }

  toggleDefinition() {
    this.config.showDefinition = !this.config.showDefinition
  }

  getCharacterIndex(character): DictionaryEntry {
    // Returns array with all words corresponding to the provided character
    return this.data.get(character)
  }

  isVowel(letter): boolean {
    return (
      letter === 'a' ||
      letter === 'e' ||
      letter === 'i' ||
      letter === 'o' ||
      letter === 'u'
    )
  }

  parsePinyin(pinyin): PinyinResult {
    const pinyinref = [
        'a',
        'ai',
        'an',
        'ang',
        'ao',
        'ba',
        'bai',
        'ban',
        'bang',
        'bao',
        'bei',
        'ben',
        'beng',
        'bi',
        'bian',
        'biao',
        'bie',
        'bin',
        'bing',
        'bo',
        'bu',
        'ca',
        'cai',
        'can',
        'cang',
        'cao',
        'ce',
        'cen',
        'ceng',
        'cha',
        'chai',
        'chan',
        'chang',
        'chao',
        'che',
        'chen',
        'cheng',
        'chi',
        'chong',
        'chou',
        'chu',
        'chua',
        'chuai',
        'chuan',
        'chuang',
        'chui',
        'chun',
        'chuo',
        'ci',
        'cong',
        'cou',
        'cu',
        'cuan',
        'cui',
        'cun',
        'cuo',
        'da',
        'dai',
        'dan',
        'dang',
        'dao',
        'de',
        'deng',
        'di',
        'dian',
        'diang',
        'diao',
        'die',
        'ding',
        'diu',
        'dong',
        'dou',
        'du',
        'duan',
        'dui',
        'dun',
        'duo',
        'e',
        'ei',
        'en',
        'er',
        'fa',
        'fan',
        'fang',
        'fei',
        'fen',
        'feng',
        'fo',
        'fou',
        'fu',
        'ga',
        'gai',
        'gan',
        'gang',
        'gao',
        'ge',
        'gei',
        'gen',
        'geng',
        'gong',
        'gou',
        'gu',
        'gua',
        'guai',
        'guan',
        'guang',
        'gui',
        'gun',
        'guo',
        'ha',
        'hai',
        'han',
        'hang',
        'hao',
        'he',
        'hei',
        'hen',
        'heng',
        'hong',
        'hou',
        'hu',
        'hua',
        'huai',
        'huan',
        'huang',
        'hui',
        'hun',
        'huo',
        'ji',
        'jia',
        'jian',
        'jiang',
        'jiao',
        'jie',
        'jin',
        'jing',
        'jiong',
        'jiu',
        'ju',
        'juan',
        'jue',
        'jun',
        'ka',
        'kai',
        'kan',
        'kang',
        'kao',
        'ke',
        'ken',
        'keng',
        'kong',
        'kou',
        'ku',
        'kua',
        'kuai',
        'kuan',
        'kuang',
        'kui',
        'kun',
        'kuo',
        'la',
        'lai',
        'lan',
        'lang',
        'lao',
        'le',
        'lei',
        'leng',
        'li',
        'lian',
        'liang',
        'liao',
        'lie',
        'lin',
        'ling',
        'liu',
        'long',
        'lou',
        'lu',
        'l\u00FC',
        'luan',
        'l\u00FCe',
        'lun',
        'luo',
        'ma',
        'mai',
        'man',
        'mang',
        'mao',
        'me',
        'mei',
        'men',
        'meng',
        'mi',
        'mian',
        'miao',
        'mie',
        'min',
        'ming',
        'miu',
        'mo',
        'mou',
        'mu',
        'na',
        'nai',
        'nan',
        'nang',
        'nao',
        'ne',
        'nei',
        'nen',
        'neng',
        'ni',
        'nia',
        'nian',
        'niang',
        'niao',
        'nie',
        'nin',
        'ning',
        'niu',
        'nong',
        'nou',
        'nu',
        'n\u00FC',
        'nuan',
        'n\u00FCe',
        'nuo',
        'nun',
        'ou',
        'pa',
        'pai',
        'pan',
        'pang',
        'pao',
        'pei',
        'pen',
        'peng',
        'pi',
        'pian',
        'piao',
        'pie',
        'pin',
        'ping',
        'po',
        'pou',
        'pu',
        'qi',
        'qia',
        'qian',
        'qiang',
        'qiao',
        'qie',
        'qin',
        'qing',
        'qiong',
        'qiu',
        'qu',
        'quan',
        'que',
        'qun',
        'ran',
        'rang',
        'rao',
        're',
        'ren',
        'reng',
        'ri',
        'rong',
        'rou',
        'ru',
        'ruan',
        'rui',
        'run',
        'ruo',
        'sa',
        'sai',
        'san',
        'sang',
        'sao',
        'se',
        'sei',
        'sen',
        'seng',
        'sha',
        'shai',
        'shan',
        'shang',
        'shao',
        'she',
        'shei',
        'shen',
        'sheng',
        'shi',
        'shong',
        'shou',
        'shu',
        'shua',
        'shuai',
        'shuan',
        'shuang',
        'shui',
        'shun',
        'shuo',
        'si',
        'song',
        'sou',
        'su',
        'suan',
        'sui',
        'sun',
        'suo',
        'ta',
        'tai',
        'tan',
        'tang',
        'tao',
        'te',
        'teng',
        'ti',
        'tian',
        'tiao',
        'tie',
        'ting',
        'tong',
        'tou',
        'tu',
        'tuan',
        'tui',
        'tun',
        'tuo',
        'wa',
        'wai',
        'wan',
        'wang',
        'wei',
        'wen',
        'weng',
        'wo',
        'wu',
        'xi',
        'xia',
        'xian',
        'xiang',
        'xiao',
        'xie',
        'xin',
        'xing',
        'xiong',
        'xiu',
        'xu',
        'xuan',
        'xue',
        'xun',
        'ya',
        'yai',
        'yan',
        'yang',
        'yao',
        'ye',
        'yi',
        'yin',
        'ying',
        'yo',
        'yong',
        'you',
        'yu',
        'yuan',
        'yue',
        'yun',
        'za',
        'zai',
        'zan',
        'zang',
        'zao',
        'ze',
        'zei',
        'zen',
        'zeng',
        'zha',
        'zhai',
        'zhan',
        'zhang',
        'zhao',
        'zhe',
        'zhei',
        'zhen',
        'zheng',
        'zhi',
        'zhong',
        'zhou',
        'zhu',
        'zhua',
        'zhuai',
        'zhuan',
        'zhuang',
        'zhui',
        'zhun',
        'zhuo',
        'zi',
        'zong',
        'zou',
        'zu',
        'zuan',
        'zui',
        'zun',
        'zuo',
      ],
      zhuyinref = [
        '\u311A',
        '\u311E',
        '\u3122',
        '\u3124',
        '\u3120',
        '\u3105\u311A',
        '\u3105\u311E',
        '\u3105\u3122',
        '\u3105\u3124',
        '\u3105\u3120',
        '\u3105\u311F',
        '\u3105\u3123',
        '\u3105\u3125',
        '\u3105\u30FC',
        '\u3105\u30FC\u3122',
        '\u3105\u30FC\u3120',
        '\u3105\u30FC\u311D',
        '\u3105\u30FC\u3123',
        '\u3105\u30FC\u3125',
        '\u3105\u311B',
        '\u3105\u3128',
        '\u3118\u311A',
        '\u3118\u311E',
        '\u3118\u3122',
        '\u3118\u3124',
        '\u3118\u3120',
        '\u3118\u311C',
        '\u3118\u3123',
        '\u3118\u3125',
        '\u3114\u311A',
        '\u3114\u311E',
        '\u3114\u3122',
        '\u3114\u3124',
        '\u3114\u3120',
        '\u3114\u311C',
        '\u3114\u3123',
        '\u3114\u3125',
        '\u3114',
        '\u3114\u3128\u3125',
        '\u3114\u3121',
        '\u3114\u3128',
        '\u3114\u3128\u311A',
        '\u3114\u3128\u311E',
        '\u3114\u3128\u3122',
        '\u3114\u3128\u3124',
        '\u3114\u3128\u311F',
        '\u3114\u3128\u3123',
        '\u3114\u3128\u311B',
        '\u3118',
        '\u3118\u3128\u3125',
        '\u3118\u3121',
        '\u3118\u3128',
        '\u3118\u3128\u3122',
        '\u3118\u3128\u311F',
        '\u3118\u3128\u3123',
        '\u3118\u3128\u311B',
        '\u3109\u311A',
        '\u3109\u311E',
        '\u3109\u3122',
        '\u3109\u3124',
        '\u3109\u3120',
        '\u3109\u311C',
        '\u3109\u3125',
        '\u3109\u30FC',
        '\u3109\u30FC\u3122',
        '\u3109\u30FC\u3124',
        '\u3109\u30FC\u3120',
        '\u3109\u30FC\u311D',
        '\u3109\u30FC\u3125',
        '\u3109\u30FC\u3121',
        '\u3109\u3128\u3125',
        '\u3109\u3121',
        '\u3109\u3128',
        '\u3109\u3128\u3122',
        '\u3109\u3128\u311F',
        '\u3109\u3128\u3123',
        '\u3109\u3128\u311B',
        '\u311C',
        '\u311F',
        '\u3123',
        '\u3126',
        '\u3108\u311A',
        '\u3108\u3122',
        '\u3108\u3124',
        '\u3108\u311F',
        '\u3108\u3123',
        '\u3108\u3125',
        '\u3108\u311B',
        '\u3108\u3121',
        '\u3108\u3128',
        '\u310D\u311A',
        '\u310D\u311E',
        '\u310D\u3122',
        '\u310D\u3124',
        '\u310D\u3120',
        '\u310D\u311C',
        '\u310D\u311F',
        '\u310D\u3123',
        '\u310D\u3125',
        '\u310D\u3128\u3125',
        '\u310D\u3121',
        '\u310D\u3128',
        '\u310D\u3128\u311A',
        '\u310D\u3128\u311E',
        '\u310D\u3128\u3122',
        '\u310D\u3128\u3124',
        '\u310D\u3128\u311F',
        '\u310D\u3128\u3123',
        '\u310D\u3128\u311B',
        '\u310F\u311A',
        '\u310F\u311E',
        '\u310F\u3122',
        '\u310F\u3124',
        '\u310F\u3120',
        '\u310F\u311C',
        '\u310F\u311F',
        '\u310F\u3123',
        '\u310F\u3125',
        '\u310F\u3128\u3125',
        '\u310F\u3121',
        '\u310F\u3128',
        '\u310F\u3128\u311A',
        '\u310F\u3128\u311E',
        '\u310F\u3128\u3122',
        '\u310F\u3128\u3124',
        '\u310F\u3128\u311F',
        '\u310F\u3128\u3123',
        '\u310F\u3128\u311B',
        '\u3110\u30FC',
        '\u3110\u30FC\u311A',
        '\u3110\u30FC\u3122',
        '\u3110\u30FC\u3124',
        '\u3110\u30FC\u3120',
        '\u3110\u30FC\u311D',
        '\u3110\u30FC\u3123',
        '\u3110\u30FC\u3125',
        '\u3110\u3129\u3125',
        '\u3110\u30FC\u3121',
        '\u3110\u3129',
        '\u3110\u3129\u3122',
        '\u3110\u3129\u311D',
        '\u3110\u3129\u3123',
        '\u310E\u311A',
        '\u310E\u311E',
        '\u310E\u3122',
        '\u310E\u3124',
        '\u310E\u3120',
        '\u310E\u311C',
        '\u310E\u3123',
        '\u310E\u3125',
        '\u310E\u3128\u3125',
        '\u310E\u3121',
        '\u310E\u3128',
        '\u310E\u3128\u311A',
        '\u310E\u3128\u311E',
        '\u310E\u3128\u3122',
        '\u310E\u3128\u3124',
        '\u310E\u3128\u311F',
        '\u310E\u3128\u3123',
        '\u310E\u3128\u311B',
        '\u310C\u311A',
        '\u310C\u311E',
        '\u310C\u3122',
        '\u310C\u3124',
        '\u310C\u3120',
        '\u310C\u311C',
        '\u310C\u311F',
        '\u310C\u3125',
        '\u310C\u30FC',
        '\u310C\u30FC\u3122',
        '\u310C\u30FC\u3124',
        '\u310C\u30FC\u3120',
        '\u310C\u30FC\u311D',
        '\u310C\u30FC\u3123',
        '\u310C\u30FC\u3125',
        '\u310C\u30FC\u3121',
        '\u310C\u3128\u3125',
        '\u310C\u3121',
        '\u310C\u3128',
        '\u310C\u3129',
        '\u310C\u3128\u3122',
        '\u310C\u3129\u311D',
        '\u310C\u3128\u3123',
        '\u310C\u3128\u311B',
        '\u3107\u311A',
        '\u3107\u311E',
        '\u3107\u3122',
        '\u3107\u3124',
        '\u3107\u3120',
        '\u3107\u311C',
        '\u3107\u311F',
        '\u3107\u3123',
        '\u3107\u3125',
        '\u3107\u30FC',
        '\u3107\u30FC\u3122',
        '\u3107\u30FC\u3120',
        '\u3107\u30FC\u311D',
        '\u3107\u30FC\u3123',
        '\u3107\u30FC\u3125',
        '\u3107\u30FC\u3121',
        '\u3107\u311B',
        '\u3107\u3121',
        '\u3107\u3128',
        '\u310B\u311A',
        '\u310B\u311E',
        '\u310B\u3122',
        '\u310B\u3124',
        '\u310B\u3120',
        '\u310B\u311B',
        '\u310B\u311F',
        '\u310B\u3123',
        '\u310B\u3125',
        '\u310B\u30FC',
        '\u310B\u30FC\u311A',
        '\u310B\u30FC\u3122',
        '\u310B\u30FC\u3124',
        '\u310B\u30FC\u3120',
        '\u310B\u30FC\u311D',
        '\u310B\u30FC\u3123',
        '\u310B\u30FC\u3125',
        '\u310B\u30FC\u3121',
        '\u310B\u3128\u3125',
        '\u310B\u3121',
        '\u310B\u3128',
        '\u310B\u3129',
        '\u310B\u3128\u3122',
        '\u310B\u3129\u311D',
        '\u310B\u3128\u311B',
        '\u310B\u3128\u3123',
        '\u3121',
        '\u3106\u311A',
        '\u3106\u311E',
        '\u3106\u3122',
        '\u3106\u3124',
        '\u3106\u3120',
        '\u3106\u311F',
        '\u3106\u3123',
        '\u3106\u3125',
        '\u3106\u30FC',
        '\u3106\u30FC\u3122',
        '\u3106\u30FC\u3120',
        '\u3106\u30FC\u311D',
        '\u3106\u30FC\u3123',
        '\u3106\u30FC\u3125',
        '\u3106\u311B',
        '\u3106\u3121',
        '\u3106\u3128',
        '\u3111\u30FC',
        '\u3111\u30FC\u311A',
        '\u3111\u30FC\u3122',
        '\u3111\u30FC\u3124',
        '\u3111\u30FC\u3120',
        '\u3111\u30FC\u311D',
        '\u3111\u30FC\u3123',
        '\u3111\u30FC\u3125',
        '\u3111\u3129\u3125',
        '\u3111\u30FC\u3121',
        '\u3111\u3129',
        '\u3111\u3129\u3122',
        '\u3111\u3129\u311D',
        '\u3111\u3129\u3123',
        '\u3116\u3122',
        '\u3116\u3124',
        '\u3116\u3120',
        '\u3116\u311C',
        '\u3116\u3123',
        '\u3116\u3125',
        '\u3116',
        '\u3116\u3128\u3125',
        '\u3116\u3121',
        '\u3116\u3128',
        '\u3116\u3128\u3122',
        '\u3116\u3128\u311F',
        '\u3116\u3128\u3123',
        '\u3116\u3128\u311B',
        '\u3119\u311A',
        '\u3119\u311E',
        '\u3119\u3122',
        '\u3119\u3124',
        '\u3119\u3120',
        '\u3119\u311C',
        '\u3119\u311F',
        '\u3119\u3123',
        '\u3119\u3125',
        '\u3115\u311A',
        '\u3115\u311E',
        '\u3115\u3122',
        '\u3115\u3124',
        '\u3115\u3120',
        '\u3115\u311C',
        '\u3115\u311F',
        '\u3115\u3123',
        '\u3115\u3125',
        '\u3115',
        '\u3115\u3121\u3125',
        '\u3115\u3121',
        '\u3115\u3128',
        '\u3115\u3128\u311A',
        '\u3115\u3128\u311E',
        '\u3115\u3128\u3122',
        '\u3115\u3128\u3124',
        '\u3115\u3128\u311F',
        '\u3115\u3128\u3123',
        '\u3115\u3128\u311B',
        '\u3119',
        '\u3119\u3128\u3125',
        '\u3119\u3121',
        '\u3119\u3128',
        '\u3119\u3128\u3122',
        '\u3119\u3128\u311F',
        '\u3119\u3128\u3123',
        '\u3119\u3128\u311B',
        '\u310A\u311A',
        '\u310A\u311E',
        '\u310A\u3122',
        '\u310A\u3124',
        '\u310A\u3120',
        '\u310A\u311C',
        '\u310A\u3125',
        '\u310A\u30FC',
        '\u310A\u30FC\u3122',
        '\u310A\u30FC\u3120',
        '\u310A\u30FC\u311D',
        '\u310A\u30FC\u3125',
        '\u310A\u3128\u3125',
        '\u310A\u3121',
        '\u310A\u3128',
        '\u310A\u3128\u3122',
        '\u310A\u3128\u311F',
        '\u310A\u3128\u3123',
        '\u310A\u3128\u311B',
        '\u3128\u311A',
        '\u3128\u311E',
        '\u3128\u3122',
        '\u3128\u3124',
        '\u3128\u311F',
        '\u3128\u3123',
        '\u3128\u3125',
        '\u3128\u311B',
        '\u3128',
        '\u3112\u30FC',
        '\u3112\u30FC\u311A',
        '\u3112\u30FC\u3122',
        '\u3112\u30FC\u3124',
        '\u3112\u30FC\u3120',
        '\u3112\u30FC\u311D',
        '\u3112\u30FC\u3123',
        '\u3112\u30FC\u3125',
        '\u3112\u3129\u3125',
        '\u3112\u30FC\u3121',
        '\u3112\u3129',
        '\u3112\u3129\u3122',
        '\u3112\u3129\u311D',
        '\u3112\u3129\u3123',
        '\u30FC\u311A',
        '\u30FC\u311E',
        '\u30FC\u3122',
        '\u30FC\u3124',
        '\u30FC\u3120',
        '\u30FC\u311D',
        '\u30FC',
        '\u30FC\u3123',
        '\u30FC\u3125',
        '\u30FC\u311B',
        '\u3129\u3125',
        '\u30FC\u3121',
        '\u3129',
        '\u3129\u3122',
        '\u3129\u311D',
        '\u3129\u3123',
        '\u3117\u311A',
        '\u3117\u311E',
        '\u3117\u3122',
        '\u3117\u3124',
        '\u3117\u3120',
        '\u3117\u311C',
        '\u3117\u311F',
        '\u3117\u3123',
        '\u3117\u3125',
        '\u3113\u311A',
        '\u3113\u311E',
        '\u3113\u3122',
        '\u3113\u3124',
        '\u3113\u3120',
        '\u3113\u311C',
        '\u3113\u311F',
        '\u3113\u3123',
        '\u3113\u3125',
        '\u3113',
        '\u3113\u3128\u3125',
        '\u3113\u3121',
        '\u3113\u3128',
        '\u3113\u3128\u311A',
        '\u3113\u3128\u311E',
        '\u3113\u3128\u3122',
        '\u3113\u3128\u3124',
        '\u3113\u3128\u311F',
        '\u3113\u3128\u3123',
        '\u3113\u3128\u311B',
        '\u3117',
        '\u3117\u3128\u3125',
        '\u3117\u3121',
        '\u3117\u3128',
        '\u3117\u3128\u3122',
        '\u3117\u3128\u311F',
        '\u3117\u3128\u3123',
        '\u3117\u3128\u311B',
      ]

    // Pinyin info
    const _a = ['\u0101', '\u00E1', '\u01CE', '\u00E0', 'a'],
      _i = ['\u012B', '\u00ED', '\u01D0', '\u00EC', 'i'],
      _u = ['\u016B', '\u00FA', '\u01D4', '\u00F9', 'u'],
      _e = ['\u0113', '\u00E9', '\u011B', '\u00E8', 'e'],
      _o = ['\u014D', '\u00F3', '\u01D2', '\u00F2', 'o'],
      _v = ['\u01D6', '\u01D8', '\u01DA', '\u01DC', '\u00FC'],
      ztone = ['', '\u02CA', '\u02C7', '\u02CB', '\u30FB']

    const result: PinyinResult = { tones: [] }

    let addToneMarks = false,
      addToneNums = false,
      addZhuyin = false,
      tonenums = [],
      zhuyin = []

    switch (this.config.pinyinType) {
      case 'tonemarks':
        addToneMarks = true
        break
      case 'tonenums':
        addToneNums = true
        break
      case 'zhuyin':
        addZhuyin = true
        break
    }

    pinyin = pinyin.split(' ')
    for (let i = 0; i < pinyin.length; i++) {
      let pin = pinyin[i].replace('u:', '\u00FC')
      let tone = 4

      if (addToneNums) {
        tonenums.push(pin.toLowerCase())
      }

      if (pin.indexOf('1') !== -1) tone = 0
      else if (pin.indexOf('2') !== -1) tone = 1
      else if (pin.indexOf('3') !== -1) tone = 2
      else if (pin.indexOf('4') !== -1) tone = 3

      result.tones.push(tone + 1)

      if (addZhuyin) {
        const prepin = pin.substring(0, pin.length - 1)
        const indx = pinyinref.indexOf(prepin.toLowerCase())
        zhuyin.push(zhuyinref[indx] + ztone[tone])
      }

      if (addToneMarks) {
        if (pin.indexOf('a') !== -1) pin = pin.replace('a', _a[tone])
        else if (pin.indexOf('e') !== -1) pin = pin.replace('e', _e[tone])
        else if (pin.indexOf('ou') !== -1) pin = pin.replace('o', _o[tone])
        else {
          for (let k = pin.length - 1; k >= 0; k--) {
            if (this.isVowel(pin[k])) {
              switch (pin[k]) {
                case 'i':
                  pin = pin.replace('i', _i[tone])
                  break
                case 'o':
                  pin = pin.replace('o', _o[tone])
                  break
                case 'u':
                  pin = pin.replace('u', _u[tone])
                  break
                case '\u00FC':
                  pin = pin.replace('\u00FC', _v[tone])
                  break
                default:
                  console.log('Exception: weird vowel ' + pin[k])
              }
              break
            }
          }
        }
        //strip the number
        pinyin[i] = pin.substring(0, pin.length - 1)
      }
    }

    // Add only relevant readings to pinyin object (smaller memory footprint)
    if (addToneMarks) result.tonemarks = pinyin.join(' ')
    if (addToneNums) result.tonenums = tonenums.join(' ')
    if (addZhuyin) result.zhuyin = zhuyin.join(' ')

    return result
  }
}
