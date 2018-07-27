'use strict';

/**
 * LiuChan Dictionary Class
 * @constructor
 */

class Dictionary {
    constructor(liuChan) {
	this.lc = liuChan;
        this.noDefinition = false;
    }

    async loadDictionary() {
        await this.fileRead("data/cedict_combined.u8", "hanzi");
	const currentTab = await chromep.tabs.query({currentWindow: true, active:true});
	this.onDictionaryLoaded(currentTab);	
    }

    onDictionaryLoaded(tab) {
        // Activate tab and send along content script related settings
	if (this.lc.config.displayHelp === true && !this.lc.config.content.disableKeys) {
            chrome.tabs.sendMessage(tab[0].id, {"type":"enable", "config": this.lc.config.content, "displayHelp": this.lc.displayHelp});
	} else {
            chrome.tabs.sendMessage(tab[0].id, {"type": "enable", "config": this.lc.config.content});
        }
    }

    async fileRead(filename, field) {
	const response = await fetch(chrome.extension.getURL(filename));
	const data = await response.text();
        this.parseDictionary(data, field);
    }

    parseDictionary(dict, field) {
	// Match every entry in the dictionary and map it to an object
	const reg = /(.+?)\s(.+?)\s\[(.+?)\]\s\{(.+?)\}\s\/(.+)\//gi;

	const hasPinyin = /\[((?:[a-z]+\d\s?)+)\]/gi;
	const hasPingjam = /\[((?:[a-z]+\d\s?)+)\]/gi;
	
        const pinyinType = this.lc.config.pinyinType;
	const pingjamType = this.lc.config.pingjamType;
	
	const map = new Map();
        let result;
	
        while (result = reg.exec(dict)) {
	    const traditional = result[1],
		  simplified = result[2],
		  pinyin = this.parsePinyin(result[3]),
		  pingjam = this.parsePingjam(result[4]);

	    // Replace pinyin, pingjam in definitions with user specified pinyin
	    // note that currently only jyutping is supported for pingjam

	    let res, def = result[5];

	    while(res = hasPinyin.exec(def)) {
                def = def.replace(res[0], "[" + this.parsePinyin(res[1])[pinyinType] + "]");
	    }

	    let definition = def.split("/");

	    // Many simplified chars correspond to multiple traditional chars, and (rarer)
	    // some traditional chars correspond to multiple simplified chars. Thus we
	    // only use the simplified char as a key if it is "safe", i.e. is part of a
	    // 1-1 (trad, simp) pair.

	    let entry = {
                "simp": simplified,
                "trad": traditional,
                "pinyin": pinyin,
		"pingjam": pingjam,
                "def": definition
	    };

	    // TODO
	    // "isSafeChinese" and implement convertToSafeChinese properly
	    // For now, just duplicate whenever simp != trad
	    // takes up more memory, but at least results are far more correct
	    // and complete, esp. when reading tradition chars
	    if (simplified.charAt(0) === traditional.charAt(0)) {
		const key = simplified.charAt(0);
		const value = map.get(key);
		if (value) {
                    value.push(entry);
                    map.set(key, value);
		} else {
                    map.set(key, [entry]);
		}
		// otherwise we unfortunately have to have "duplicate" entries
	    } else {		
		const key_s = simplified.charAt(0);
		const key_t = traditional.charAt(0);		
		const value_s = map.get(key_s);
		const value_t = map.get(key_t);
		// note we cannot do this two at a time; must check all cases
		if (value_s) {
                    value_s.push(entry);
                    map.set(key_s, value_s);
		} else {
                    map.set(key_s, [entry]);
		}
		if (value_t) {
                    value_t.push(entry);
                    map.set(key_t, value_t);
		} else {
                    map.set(key_t, [entry]);
		}
	    }
        }

        this[field] = map;

        // I noticed that chrome keeps the last regex match in memory
	// which in this case is the entire dictionary file, so this is to lower the memory footprint
        /./g.exec('c');
    }

    parseDefinitions(def) {
        if (def.length === 1) { return def }
        if (this.lc.config.definitionSeparator === "num") {
            let str = '';
            for (let i = 0; i < def.length; i++) {
                str += '<b>' + (i + 1) + '</b> ' + def[i] + ' ';
            }
            return str.trim();
        } else {
            return def.join(this.lc.config.definitionSeparator);
        }
    }

    // isSafeChinese checks if a Chinese character is "safe" i.e. there is
    // only one simplified char corresponding to it, and moreover it is the only
    // trad char corresponding to that simplified char. A list of unsafe chars
    // can be found here: http://ytenx.org/byohlyuk/KienxPyan or on Wikipedia
    // under "Ambiguities in Chinese character simplification"
    isSafeChinese(c) {
	const unsafe = String('丰傑噁徵向慄苹覆致荫蔑渖几梁苏雕薹髮获咸迹嚐蓆哗价皂奸懞团回毀柺局籲佔卜蕩幾菸鍊裊搜冬并侖鬆别侷后岩悽兒剷慼當殭睏扎盡杆須芸麯衕罈蹟尸凄誇鏟冲吁孃歷迴據桿蔔慾夸吊臟表佈征滷历术豐灕曆鏚烟仇崙彆干纤摺參弔志颳緻纔酸蔘糰针饥凶採囌苔面燬鍼私叹毁僵儘穀鬍別藉鑑輓術綵欲捱餵硷复捨症嘆戚困鹵尽姦夥麼朴讚斗倖巨杰暗瞭杠譟嚮鼕蘇噪癥鉅讎針籖闇鐘樸药挽復杯碱廕氾鑒蒙劃柜曲台隻馀繐链家同蘋襬蠟歎背硃準僕鹼錶覈参簾恤製揹沖折咽准腌髒蜡澱制俬贊鬱煉淀乾念穗炼煙核紮注濛捲壇据铲尝泛盃併饑築凌臺席占雲葯熏槓鬨衚釦借衊鹹巖闆挨拐嫋出刮筑钟庵匯胡賙禦醃系矇弦癒複跡沈漓舍鬚抵糊誌帘云辟画划千幸扣價喂擺兇註鉴託娘榦著餬托闢櫃後畫纖唸齣颱摆鲇幹儿佣哄鏈伕赞采了松么韆淩遊嘗餘愈傢麪藥蕓鯰谷盪菴秋昇脏朱瀋升裏发蔭蒐恶並鵰着屍皁周板郁傭仆噹發衝御游只譁鞦曏袅簽卷縴当牴里淒飢獲夫團甦荡鬭签彙嘩布醜卹彩丑樑克汇燻坛週卤係仑余须朮才絃栗繫穫惡檯剋痠譭鍾伙嚥');
	if (unsafe.indexOf(c) !== -1) {
	    return true;
	} else {
	    return false;
	}
    }
    
    // The following converts trad to simplified iff it is "safe" (see above) for
    // this definition of safe). Note that target and source values have been pruned
    // from their 1.1.5 values (i.e. shares no cars with `unsafe` string in
    // isSafeChinese method)
    // Do not use the target/source strings in the following method; there are mistakes
    // 冇 -> 沒
    // convertToSafeSimplified(string) {
    //     // If you switch these around you can also convert trad to simp
    //     const target = String('万与专业丛东丝丢两严丧个丬临为丽举么义乌乐乔习乡书买乱争于亏亘亚产亩亲亵亸亿仅从仓仪们众优会伛伞伟传伤伥伦伧伪伫体佥侠侣侥侦侧侨侩侪侬俣俦俨俩俪俭债倾偬偻偾偿傥傧储傩儿兑兖党兰关兴兹养兽冁内冈册写军农冢冯决况冻净凉减凑凛凤凫凭凯击凼凿刍刘则刚创删刬刭刽刿剀剂剐剑剥剧劝办务劢动励劲劳势勋勐勚匀匦匮区医华协单卖卢卧卫却卺厂厅厉压厌厍厕厢厣厦厨厩厮县叆叇双变叙叠叶号叽吓吕吗吣吨听启吴呒呓呕呖呗员呙呛呜咏咔咙咛咝咤咴哌响哑哒哓哔哕哙哜哝哟唛唝唠唡唢唣唤唿啧啬啭啮啰啴啸喷喽喾嗫呵嗳嘘嘤嘱噜噼嚣嚯园囱围囵国图圆圣圹场坂坏块坚坜坝坞坟坠垄垅垆垒垦垧垩垫垭垯垱垲垴埘埙埚埝埯堑堕塆墙壮声壳壶壸处备够头夹夺奁奂奋奖奥妆妇妈妩妪妫姗姜娄娅娆娇娈娱娲娴婳婴婵婶媪嫒嫔嫱嬷孙学孪宁宝实宠审宪宫宽宾寝对寻导寿将尔尘尧尴层屃屉届属屡屦屿岁岂岖岗岘岙岚岛岭岳岽岿峄峡峣峤峥峦崂崃崄崭嵘嵚嵛嵝嵴巅巩巯币帅师帏帐帜带帧帮帱帻帼幂幞广庄庆庐庑库应庙庞废廪开异弃张弥弪弯弹强归录彟彦彻径徕忆忏忧忾怀态怂怃怄怅怆怜总怼怿恋恳恸恹恺恻恼恽悦悫悬悭悯惊惧惨惩惫惬惭惮惯愍愠愤愦愿慑慭憷懑懒懔戆戋戏戗战戬户扑扦执扩扪扫扬扰抚抛抟抠抡抢护报担拟拢拣拥拦拧拨择挂挚挛挜挝挞挟挠挡挢挣挤挥挦捞损捡换捣捻掳掴掷掸掺掼揸揽揿搀搁搂搅携摄摅摇摈摊撄撑撵撷撸撺擞攒敌敛数斋斓斩断无旧时旷旸昙昼昽显晋晒晓晔晕晖暂暧札机杀杂权条来杨杩极构枞枢枣枥枧枨枪枫枭柠柽栀栅标栈栉栊栋栌栎栏树栖样栾棬桠桡桢档桤桥桦桧桨桩梦梼梾检棂椁椟椠椤椭楼榄榇榈榉槚槛槟槠横樯樱橥橱橹橼檐檩欢欤欧歼殁殇残殒殓殚殡殴毂毕毙毡毵氇气氢氩氲汉污汤汹沓沟没沣沤沥沦沧沩沪泞泪泶泷泸泺泻泼泽泾洁洒洼浃浅浆浇浈浉浊测浍济浏浐浑浒浓浔涂涌涛涝涞涟涠涡涢涣涤润涧涨涩渊渌渍渎渐渑渔渖渗温湾湿溃溅溆滗滚滞滟滠满滢滤滥滦滨滩漤潆潇潋潍潜潴澜濑濒灏灭灯灵灾灿炀炉炖炜炝点炽烁烂烃烛烦烧烨烩烫烬热焕焖焘煅熘爱爷牍牦牵牺犊犟状犷犸犹狈狍狝狞独狭狮狯狰狱狲猃猎猕猡猪猫猬献獭玑玙玚玛玮环现玱玺珉珏珐珑珰珲琏琐琼瑶瑷璇璎瓒瓮瓯电畅畲畴疖疗疟疠疡疬疮疯疱疴痈痉痒痖痨痪痫痴瘅瘆瘗瘘瘪瘫瘾瘿癞癣癫癯皑皱皲盏盐监盖盗盘眍眦眬着睁睐睑瞒瞩矫矶矾矿砀码砖砗砚砜砺砻砾础硁硅硕硖硗硙硚确硷碍碛碜碱磙礼祎祢祯祷祸禀禄禅离秃秆种积称秽秾稆税稣稳穑穷窃窍窑窜窝窥窦窭竖竞笃笋笔笕笺笼笾筚筛筜筝筹简箓箦箧箨箩箪箫篑篓篮篱簖籁籴类籼粜粝粤粪粮糁糇紧絷纠纡红纣纥约级纨纩纪纫纬纭纮纯纰纱纲纳纴纵纶纷纸纹纺纻纼纽纾线绀绁绂练组绅细织终绉绊绋绌绍绎经绐绑绒结绔绕绖绗绘给绚绛络绝绞统绠绡绢绣绤绥绦继绨绩绪绫绬续绮绯绰绱绲绳维绵绶绷绸绹绺绻综绽绾绿缀缁缂缃缄缅缆缇缈缉缊缋缌缍缎缏缐缑缒缓缔缕编缗缘缙缚缛缜缝缞缟缠缡缢缣缤缥缦缧缨缩缪缫缬缭缮缯缰缱缲缳缴缵罂网罗罚罢罴羁羟羡翘翙翚耢耧耸耻聂聋职聍联聩聪肃肠肤肷肾肿胀胁胆胜胧胨胪胫胶脉脍脐脑脓脔脚脱脶脸腊腘腭腻腼腽腾膑臜舆舣舰舱舻艰艳艹艺节芈芗芜芦苁苇苈苋苌苍苎苘茎茏茑茔茕茧荆荐荙荚荛荜荞荟荠荣荤荥荦荧荨荩荪荬荭荮莅莜莱莲莳莴莶莸莹莺莼萚萝萤营萦萧萨葱蒇蒉蒋蒌蓝蓟蓠蓣蓥蓦蔷蔹蔺蔼蕲蕴薮藁藓虏虑虚虫虬虮虽虾虿蚀蚁蚂蚕蚝蚬蛊蛎蛏蛮蛰蛱蛲蛳蛴蜕蜗蝇蝈蝉蝎蝼蝾螀螨蟏衅衔补衬衮袄袆袜袭袯装裆裈裢裣裤裥褛褴襁襕见观觃规觅视觇览觉觊觋觌觍觎觏觐觑觞触觯詟誉誊讠计订讣认讥讦讧讨让讪讫训议讯记讱讲讳讴讵讶讷许讹论讻讼讽设访诀证诂诃评诅识诇诈诉诊诋诌词诎诏诐译诒诓诔试诖诗诘诙诚诛诜话诞诟诠诡询诣诤该详诧诨诩诪诫诬语诮误诰诱诲诳说诵诶请诸诹诺读诼诽课诿谀谁谂调谄谅谆谇谈谊谋谌谍谎谏谐谑谒谓谔谕谖谗谘谙谚谛谜谝谞谟谠谡谢谣谤谥谦谧谨谩谪谫谬谭谮谯谰谱谲谳谴谵谶豮贝贞负贠贡财责贤败账货质贩贪贫贬购贮贯贰贱贲贳贴贵贶贷贸费贺贻贼贽贾贿赀赁赂赃资赅赆赇赈赉赊赋赌赍赎赏赐赑赓赔赕赖赗赘赙赚赛赜赝赟赠赡赢赣赪赵赶趋趱趸跃跄跖跞践跶跷跸跹跻踊踌踪踬踯蹑蹒蹰蹿躏躜躯车轧轨轩轪轫转轭轮软轰轱轲轳轴轵轶轷轸轹轺轻轼载轾轿辀辁辂较辄辅辆辇辈辉辊辋辌辍辎辏辐辑辒输辔辕辖辗辘辙辚辞辩辫边辽达迁过迈运还这进远违连迟迩迳适选逊递逦逻遗遥邓邝邬邮邹邺邻郄郏郐郑郓郦郧郸酝酦酱酽酾酿释銮錾钆钇钉钊钋钌钍钎钏钐钑钒钓钔钕钖钗钘钙钚钛钝钞钠钡钢钣钤钥钦钧钨钩钪钫钬钭钮钯钰钱钲钳钴钵钶钷钸钹钺钻钼钽钾钿铀铁铂铃铄铅铆铈铉铊铋铍铎铐铑铒铕铗铘铙铚铛铜铝铞铟铠铡铢铣铤铥铦铧铨铪铫铬铭铮铯铰铱铳铴铵银铷铸铹铺铻铼铽铿销锁锂锃锄锅锆锇锈锉锊锋锌锍锎锏锐锑锒锓锔锕锖锗错锚锜锞锟锠锡锢锣锤锥锦锨锩锫锬锭键锯锰锱锲锳锴锵锶锷锸锹锻锼锽锾锿镀镁镂镃镆镇镈镉镊镌镍镎镏镐镑镒镕镖镗镙镚镛镜镝镞镟镠镡镢镣镤镥镦镧镨镩镪镫镬镭镮镯镰镱镲镳镴镶长门闩闪闫闬闭问闯闰闱闲闳间闵闶闷闸闹闺闻闼闽闾闿阀阁阂阃阄阅阆阇阈阉阊阋阌阍阎阏阐阑阒阓阔阕阖阗阘阙阚阛队阳阴阵阶际陆陇陈陉陕陧陨险随隐隶隽难雏雳雾霁霉霭靓静靥鞑鞒鞯鞴韦韧韨韩韪韫韬韵页顶顷顸项顺顼顽顾顿颀颁颂颃预颅领颇颈颉颊颋颌颍颎颏颐频颒颓颔颕颖颗题颙颚颛颜额颞颟颠颡颢颣颤颥颦颧风飏飐飑飒飓飔飕飖飗飘飙飚飞飨餍饤饦饧饨饩饪饫饬饭饮饯饰饱饲饳饴饵饶饷饸饹饺饻饼饽饾饿馁馂馃馄馅馆馇馈馉馊馋馌馍馎馏馐馑馒馓馔馕马驭驮驯驰驱驲驳驴驵驶驷驸驹驺驻驼驽驾驿骀骁骂骃骄骅骆骇骈骉骊骋验骍骎骏骐骑骒骓骔骕骖骗骘骙骚骛骜骝骞骟骠骡骢骣骤骥骦骧髅髋髌鬓魇魉鱼鱽鱾鱿鲀鲁鲂鲄鲅鲆鲇鲈鲉鲊鲋鲌鲍鲎鲏鲐鲑鲒鲓鲔鲕鲖鲗鲘鲙鲚鲛鲜鲝鲞鲟鲠鲡鲢鲣鲤鲥鲦鲧鲨鲩鲪鲫鲬鲭鲮鲯鲰鲱鲲鲳鲴鲵鲶鲷鲸鲹鲺鲻鲼鲽鲾鲿鳀鳁鳂鳃鳄鳅鳆鳇鳈鳉鳊鳋鳌鳍鳎鳏鳐鳑鳒鳓鳔鳕鳖鳗鳘鳙鳛鳜鳝鳞鳟鳠鳡鳢鳣鸟鸠鸡鸢鸣鸤鸥鸦鸧鸨鸩鸪鸫鸬鸭鸮鸯鸰鸱鸲鸳鸴鸵鸶鸷鸸鸹鸺鸻鸼鸽鸾鸿鹀鹁鹂鹃鹄鹅鹆鹇鹈鹉鹊鹋鹌鹍鹎鹏鹐鹑鹒鹓鹔鹕鹖鹗鹘鹚鹛鹜鹝鹞鹟鹠鹡鹢鹣鹤鹥鹦鹧鹨鹩鹪鹫鹬鹭鹯鹰鹱鹲鹳鹴鹾麦麸黄黉黡黩黪黾鼋鼍鼗鼹齐齑齿龀龁龂龃龄龅龆龇龈龉龊龋龌龙龚龛龟咨范没闲拼');

    //     const source = String('萬與專業叢東絲丟兩嚴喪個爿臨為麗舉麼義烏樂喬習鄉書買亂爭於虧亙亞產畝親褻嚲億僅從倉儀們眾優會傴傘偉傳傷倀倫傖偽佇體僉俠侶僥偵側僑儈儕儂俁儔儼倆儷儉債傾傯僂僨償儻儐儲儺兒兌兗黨蘭關興茲養獸囅內岡冊寫軍農塚馮決況凍淨涼減湊凜鳳鳧憑凱擊氹鑿芻劉則剛創刪剗剄劊劌剴劑剮劍剝劇勸辦務勱動勵勁勞勢勳猛勩勻匭匱區醫華協單賣盧臥衛卻巹廠廳厲壓厭厙廁廂厴廈廚廄廝縣靉靆雙變敘疊葉號嘰嚇呂嗎唚噸聽啟吳嘸囈嘔嚦唄員咼嗆嗚詠哢嚨嚀噝吒噅呱響啞噠嘵嗶噦噲嚌噥喲嘜嗊嘮啢嗩唕喚呼嘖嗇囀齧囉嘽嘯噴嘍嚳囁嗬噯噓嚶囑嚕劈囂謔園囪圍圇國圖圓聖壙場阪壞塊堅壢壩塢墳墜壟壟壚壘墾坰堊墊埡墶壋塏堖塒塤堝墊垵塹墮壪牆壯聲殼壺壼處備夠頭夾奪奩奐奮獎奧妝婦媽嫵嫗媯姍薑婁婭嬈嬌孌娛媧嫻嫿嬰嬋嬸媼嬡嬪嬙嬤孫學孿寧寶實寵審憲宮寬賓寢對尋導壽將爾塵堯尷層屭屜屆屬屢屨嶼歲豈嶇崗峴嶴嵐島嶺嶽崠巋嶧峽嶢嶠崢巒嶗崍嶮嶄嶸嶔崳嶁脊巔鞏巰幣帥師幃帳幟帶幀幫幬幘幗冪襆廣莊慶廬廡庫應廟龐廢廩開異棄張彌弳彎彈強歸錄彠彥徹徑徠憶懺憂愾懷態慫憮慪悵愴憐總懟懌戀懇慟懨愷惻惱惲悅愨懸慳憫驚懼慘懲憊愜慚憚慣湣慍憤憒願懾憖怵懣懶懍戇戔戲戧戰戩戶撲扡執擴捫掃揚擾撫拋摶摳掄搶護報擔擬攏揀擁攔擰撥擇掛摯攣掗撾撻挾撓擋撟掙擠揮撏撈損撿換搗撚擄摑擲撣摻摜摣攬撳攙擱摟攪攜攝攄搖擯攤攖撐攆擷擼攛擻攢敵斂數齋斕斬斷無舊時曠暘曇晝曨顯晉曬曉曄暈暉暫曖劄機殺雜權條來楊榪極構樅樞棗櫪梘棖槍楓梟檸檉梔柵標棧櫛櫳棟櫨櫟欄樹棲樣欒棬椏橈楨檔榿橋樺檜槳樁夢檮棶檢欞槨櫝槧欏橢樓欖櫬櫚櫸檟檻檳櫧橫檣櫻櫫櫥櫓櫞簷檁歡歟歐殲歿殤殘殞殮殫殯毆轂畢斃氈毿氌氣氫氬氳漢汙湯洶遝溝沒灃漚瀝淪滄溈滬濘淚澩瀧瀘濼瀉潑澤涇潔灑窪浹淺漿澆湞溮濁測澮濟瀏滻渾滸濃潯塗湧濤澇淶漣潿渦溳渙滌潤澗漲澀淵淥漬瀆漸澠漁瀋滲溫灣濕潰濺漵潷滾滯灩灄滿瀅濾濫灤濱灘濫瀠瀟瀲濰潛瀦瀾瀨瀕灝滅燈靈災燦煬爐燉煒熗點熾爍爛烴燭煩燒燁燴燙燼熱煥燜燾煆溜愛爺牘犛牽犧犢強狀獷獁猶狽麅獮獰獨狹獅獪猙獄猻獫獵獼玀豬貓蝟獻獺璣璵瑒瑪瑋環現瑲璽瑉玨琺瓏璫琿璉瑣瓊瑤璦璿瓔瓚甕甌電暢佘疇癤療瘧癘瘍鬁瘡瘋皰屙癰痙癢瘂癆瘓癇癡癉瘮瘞瘺癟癱癮癭癩癬癲臒皚皺皸盞鹽監蓋盜盤瞘眥矓著睜睞瞼瞞矚矯磯礬礦碭碼磚硨硯碸礪礱礫礎硜矽碩硤磽磑礄確鹼礙磧磣堿滾禮禕禰禎禱禍稟祿禪離禿稈種積稱穢穠穭稅穌穩穡窮竊竅窯竄窩窺竇窶豎競篤筍筆筧箋籠籩篳篩簹箏籌簡籙簀篋籜籮簞簫簣簍籃籬籪籟糴類秈糶糲粵糞糧糝餱緊縶糾紆紅紂紇約級紈纊紀紉緯紜紘純紕紗綱納紝縱綸紛紙紋紡紵紖紐紓線紺絏紱練組紳細織終縐絆紼絀紹繹經紿綁絨結絝繞絰絎繪給絢絳絡絕絞統綆綃絹繡綌綏絛繼綈績緒綾緓續綺緋綽緔緄繩維綿綬繃綢綯綹綣綜綻綰綠綴緇緙緗緘緬纜緹緲緝縕繢緦綞緞緶線緱縋緩締縷編緡緣縉縛縟縝縫縗縞纏縭縊縑繽縹縵縲纓縮繆繅纈繚繕繒韁繾繰繯繳纘罌網羅罰罷羆羈羥羨翹翽翬耮耬聳恥聶聾職聹聯聵聰肅腸膚膁腎腫脹脅膽勝朧腖臚脛膠脈膾臍腦膿臠腳脫腡臉臘膕齶膩靦膃騰臏臢輿艤艦艙艫艱豔艸藝節羋薌蕪蘆蓯葦藶莧萇蒼苧檾莖蘢蔦塋煢繭荊薦薘莢蕘蓽蕎薈薺榮葷滎犖熒蕁藎蓀蕒葒葤蒞蓧萊蓮蒔萵薟蕕瑩鶯蓴蘀蘿螢營縈蕭薩蔥蕆蕢蔣蔞藍薊蘺蕷鎣驀薔蘞藺藹蘄蘊藪槁蘚虜慮虛蟲虯蟣雖蝦蠆蝕蟻螞蠶蠔蜆蠱蠣蟶蠻蟄蛺蟯螄蠐蛻蝸蠅蟈蟬蠍螻蠑螿蟎蠨釁銜補襯袞襖褘襪襲襏裝襠褌褳襝褲襇褸襤繈襴見觀覎規覓視覘覽覺覬覡覿覥覦覯覲覷觴觸觶讋譽謄訁計訂訃認譏訐訌討讓訕訖訓議訊記訒講諱謳詎訝訥許訛論訩訟諷設訪訣證詁訶評詛識詗詐訴診詆謅詞詘詔詖譯詒誆誄試詿詩詰詼誠誅詵話誕詬詮詭詢詣諍該詳詫諢詡譸誡誣語誚誤誥誘誨誑說誦誒請諸諏諾讀諑誹課諉諛誰諗調諂諒諄誶談誼謀諶諜謊諫諧謔謁謂諤諭諼讒諮諳諺諦謎諞諝謨讜謖謝謠謗諡謙謐謹謾謫譾謬譚譖譙讕譜譎讞譴譫讖豶貝貞負貟貢財責賢敗賬貨質販貪貧貶購貯貫貳賤賁貰貼貴貺貸貿費賀貽賊贄賈賄貲賃賂贓資賅贐賕賑賚賒賦賭齎贖賞賜贔賡賠賧賴賵贅賻賺賽賾贗贇贈贍贏贛赬趙趕趨趲躉躍蹌蹠躒踐躂蹺蹕躚躋踴躊蹤躓躑躡蹣躕躥躪躦軀車軋軌軒軑軔轉軛輪軟轟軲軻轤軸軹軼軤軫轢軺輕軾載輊轎輈輇輅較輒輔輛輦輩輝輥輞輬輟輜輳輻輯轀輸轡轅轄輾轆轍轔辭辯辮邊遼達遷過邁運還這進遠違連遲邇逕適選遜遞邐邏遺遙鄧鄺鄔郵鄒鄴鄰郤郟鄶鄭鄆酈鄖鄲醞醱醬釅釃釀釋鑾鏨釓釔釘釗釙釕釷釺釧釤鈒釩釣鍆釹鍚釵鈃鈣鈈鈦鈍鈔鈉鋇鋼鈑鈐鑰欽鈞鎢鉤鈧鈁鈥鈄鈕鈀鈺錢鉦鉗鈷缽鈳鉕鈽鈸鉞鑽鉬鉭鉀鈿鈾鐵鉑鈴鑠鉛鉚鈰鉉鉈鉍鈹鐸銬銠鉺銪鋏鋣鐃銍鐺銅鋁銱銦鎧鍘銖銑鋌銩銛鏵銓鉿銚鉻銘錚銫鉸銥銃鐋銨銀銣鑄鐒鋪鋙錸鋱鏗銷鎖鋰鋥鋤鍋鋯鋨鏽銼鋝鋒鋅鋶鐦鐧銳銻鋃鋟鋦錒錆鍺錯錨錡錁錕錩錫錮鑼錘錐錦鍁錈錇錟錠鍵鋸錳錙鍥鍈鍇鏘鍶鍔鍤鍬鍛鎪鍠鍰鎄鍍鎂鏤鎡鏌鎮鎛鎘鑷鐫鎳鎿鎦鎬鎊鎰鎔鏢鏜鏍鏰鏞鏡鏑鏃鏇鏐鐔钁鐐鏷鑥鐓鑭鐠鑹鏹鐙鑊鐳鐶鐲鐮鐿鑔鑣鑞鑲長門閂閃閆閈閉問闖閏闈閑閎間閔閌悶閘鬧閨聞闥閩閭闓閥閣閡閫鬮閱閬闍閾閹閶鬩閿閽閻閼闡闌闃闠闊闋闔闐闒闕闞闤隊陽陰陣階際陸隴陳陘陝隉隕險隨隱隸雋難雛靂霧霽黴靄靚靜靨韃鞽韉韝韋韌韍韓韙韞韜韻頁頂頃頇項順頊頑顧頓頎頒頌頏預顱領頗頸頡頰頲頜潁熲頦頤頻頮頹頷頴穎顆題顒顎顓顏額顳顢顛顙顥纇顫顬顰顴風颺颭颮颯颶颸颼颻飀飄飆飆飛饗饜飣飥餳飩餼飪飫飭飯飲餞飾飽飼飿飴餌饒餉餄餎餃餏餅餑餖餓餒餕餜餛餡館餷饋餶餿饞饁饃餺餾饈饉饅饊饌饢馬馭馱馴馳驅馹駁驢駔駛駟駙駒騶駐駝駑駕驛駘驍罵駰驕驊駱駭駢驫驪騁驗騂駸駿騏騎騍騅騌驌驂騙騭騤騷騖驁騮騫騸驃騾驄驏驟驥驦驤髏髖髕鬢魘魎魚魛魢魷魨魯魴魺鮁鮃鯰鱸鮋鮓鮒鮊鮑鱟鮍鮐鮭鮚鮳鮪鮞鮦鰂鮜鱠鱭鮫鮮鮺鯗鱘鯁鱺鰱鰹鯉鰣鰷鯀鯊鯇鮶鯽鯒鯖鯪鯕鯫鯡鯤鯧鯝鯢鯰鯛鯨鯵鯴鯔鱝鰈鰏鱨鯷鰮鰃鰓鱷鰍鰒鰉鰁鱂鯿鰠鼇鰭鰨鰥鰩鰟鰜鰳鰾鱈鱉鰻鰵鱅鰼鱖鱔鱗鱒鱯鱤鱧鱣鳥鳩雞鳶鳴鳲鷗鴉鶬鴇鴆鴣鶇鸕鴨鴞鴦鴒鴟鴝鴛鴬鴕鷥鷙鴯鴰鵂鴴鵃鴿鸞鴻鵐鵓鸝鵑鵠鵝鵒鷳鵜鵡鵲鶓鵪鶤鵯鵬鵮鶉鶊鵷鷫鶘鶡鶚鶻鶿鶥鶩鷊鷂鶲鶹鶺鷁鶼鶴鷖鸚鷓鷚鷯鷦鷲鷸鷺鸇鷹鸌鸏鸛鸘鹺麥麩黃黌黶黷黲黽黿鼉鞀鼴齊齏齒齔齕齗齟齡齙齠齜齦齬齪齲齷龍龔龕龜谘範冇閒拚');
	
    //     let result = '';

    //     for (let i = 0, len = string.length; i < len; i++) {
    //         let letter = string.charAt(i);
    //         let code = string.charCodeAt(i);

    //         let isChinese = (code > 0x3400 && code < 0x9FC3) || (code > 0xF900 && code < 0xFA6A);

    //         if (!isChinese) {
    //             result += letter;
    //             continue;
    //         }

    //         let index = source.indexOf(letter);

    //         if (index !== -1) {
    //             result += target.charAt(index);
    //         } else {
    //             result += letter;
    //         }
    //     }
    //     return result;
    // }

    wordSearch(dict, word) {
	// TODO
	// Convert to simplified if it is safe (see above methods). Note that result
	// is not necessarily simplified.
        // word = this.convertToSafeSimplified(word);

        const index = dict.get(word.charAt(0));

        if (!index) return; // If first character doesn't match with anything, stop looking

	let results = {};
	results.data = [];

	// Loop through all matched text and delete one character each loop, returning all matches
	let totalmatches = 0;
	let max = this.lc.config.maxEntries;
        for (let a = word.length; totalmatches < max  && a > 0; a--) {
            for (let i = 0, len = index.length; totalmatches < max && i < len; i++) {
                if (index[i].simp === word || index[i].trad === word) {
                    if (!results.matchLen) results.matchLen = word.length;
                    results.data.push(index[i]);
		    totalmatches++;
                }
            }

            word = word.substr(0, a-1);
        }

        return results;
    }

    makeHtml(entry) {
        if (entry == null) return '';

	let trad, simp, pinyin, pingjam, def;
	let html, b = [];

	b.push('<div class="liuchan-container">');

	for (let a = 0, len = entry.data.length; a < len; a++) {
	    // Parsing the pinyin removes numbers, adds tone marks, etc
	    trad = entry.data[a].trad;
	    simp = entry.data[a].simp;
	    def = '';
	    pinyin = entry.data[a].pinyin;
	    pingjam = entry.data[a].pingjam;
            def = this.parseDefinitions(entry.data[a].def);

	    // Select whether to show traditional or simple first/only
	    // Note: Fallthrough is on purpose!
	    let first, second, addSecond = false;
	    switch (this.lc.config.hanziType) {
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
                let newsecond = [];
                for (let i = 0, len = first.length; i < len; i++) {
                    if (first[i] === second[i])
                        newsecond.push('\u30FB');
                    else
                        newsecond.push(second[i]);
                }
                second = newsecond.join('');

                // Add tone colors to every character
		// Mandarin as basis for tone colours
                if (this.lc.config.useHanziToneColors === "mando") {
                    // User has specified custom colors, use those instead
                    if (this.lc.config.useCustomTones) {
                    	let tone;
                        for (let i = 0, len = pinyin.tones.length; i < len; i++) {
                            tone = pinyin.tones[i];
                            html += '<span class="tone' + tone
				+ '" style="color:' + this.lc.config.customTones[tone-1] + '">'
				+ first.charAt(i) + '</span>';
                        }

                        html += '<span class="spacer"></span><span class="brace">[</span>';
                        for (let i = 0, len = pinyin.tones.length; i < len; i++) {
                            tone = pinyin.tones[i];
                            html += '<span class="tone' + tone
				+ '" style="color:' + this.lc.config.customTones[tone-1] + '">'
				+ second.charAt(i) + '</span>';
                        }
                        html += '<span class="brace">]</span>'

                    } else {
			for (let i = 0, len = pinyin.tones.length; i < len; i++) {
			    html += '<span class="tone' + pinyin.tones[i] + '">' + first.charAt(i) + '</span>';
			}

			html += '<span class="spacer"></span><span class="brace">[</span>';
			for (let i = 0, len = pinyin.tones.length; i < len; i++) {
			    html += '<span class="tone' + pinyin.tones[i] + '">' + second.charAt(i) + '</span>';
			}
			html += '<span class="brace">]</span>'
                    }
                }
		// Cantonese as basis for tone colors; we must be careful if pingjam is missing
		else if (this.lc.config.useHanziToneColors === "canto" && pingjam.jtonenums.length !== 0) {
                    // User has specified custom colors, use those instead
                    if (this.lc.config.useCustomTones) {
                    	let jtone;
                        for (let i = 0, len = pingjam.jtones.length; i < len; i++) {
                            jtone = pingjam.jtones[i];
                            html += '<span class="jtone' + jtone
				+ '" style="color:' + this.lc.config.jcustomTones[jtone-1] + '">'
				+ first.charAt(i) + '</span>';
                        }

                        html += '<span class="spacer"></span><span class="brace">[</span>';
                        for (let i = 0, len = pingjam.jtones.length; i < len; i++) {
                            jtone = pingjam.jtones[i];
                            html += '<span class="jtone' + jtone
				+ '" style="color:' + this.lc.config.jcustomTones[jtone-1] + '">'
				+ second.charAt(i) + '</span>';
                        }
                        html += '<span class="brace">]</span>'

                    } else {
			for (let i = 0, len = pingjam.jtones.length; i < len; i++) {
			    html += '<span class="jtone' + pingjam.jtones[i] + '">' + first.charAt(i) + '</span>';
			}

			html += '<span class="spacer"></span><span class="brace">[</span>';
			for (let i = 0, len = pingjam.jtones.length; i < len; i++) {
			    html += '<span class="jtone' + pingjam.jtones[i] + '">' + second.charAt(i) + '</span>';
			}
			html += '<span class="brace">]</span>'
                    }
                } else {
                    html += '<span class="tone1">' + first + '</span><span class="spacer"></span>' +
                        '<span class="tone1"><span class="brace">[</span>' + second + '<span class="brace">]</span></span>';
                }
            } else {
                // Add tone colors to every character
		// Mandarin as basis for tone colors
		if (this.lc.config.useHanziToneColors === "mando") {
                    if (this.lc.config.useCustomTones) {
			let tone;
                        for (let i = 0, len = pinyin.tones.length; i < len; i++) {
                            tone = pinyin.tones[i];
                            html += '<span class="tone' + tone
				+ '" style="color:' + this.lc.config.customTones[tone-1] + '">'
				+ first.charAt(i) + '</span>';
                        }
                    } else {
                        for (let i = 0, len = pinyin.tones.length; i < len; i++) {
                            html += '<span class="tone' + pinyin.tones[i] + '">' + first.charAt(i) + '</span>';
                        }
                    }
                }
		// Cantonese as basis for tone colors; we must be careful if pingjam is missing
		else if (this.lc.config.useHanziToneColors === "canto" && pingjam.jtonenums.length !== 0) {
                    if (this.lc.config.useCustomTones) {
			let jtone;
                        for (let i = 0, len = pingjam.jtones.length; i < len; i++) {
                            jtone = pingjam.jtones[i];
                            html += '<span class="jtone' + jtone
				+ '" style="color:' + this.lc.config.jcustomTones[tone-1] + '">'
				+ first.charAt(i) + '</span>';
                        }
                    } else {
                        for (let i = 0, len = pingjam.jtones.length; i < len; i++) {
                            html += '<span class="jtone' + pingjam.jtones[i] + '">' + first.charAt(i) + '</span>';
                        }
                    }
                } else {
                    html += '<span class="tone1">' + first + '</span>';
                }
	    }

	    // decide if we want to see just pinyin, just pingjam, or both
	    let showPinyin, showPingjam;
	    switch (this.lc.config.langType) {
	    case "mando":
		showPinyin = true;
		showPingjam = false;
		break;
	    case "canto":
		showPinyin = false;
		showPingjam = true;
		break;
	    case "bothl":
		showPinyin = true;		
		showPingjam = true;
		break;
	    default:
		showPinyin = true;		
		showPingjam = true;
	    }

	    if (showPinyin) {
		//PINYIN
		html += '</div><div class="pinyin"><div class="lang">PY</div>';

		if (this.lc.config.usePinyinToneColors) {
            	    let str;
		    switch (this.lc.config.pinyinType) {
		    case "tonenums": str = pinyin.tonenums.split(" "); break;
		    case "zhuyin": str = pinyin.zhuyin.split(" "); break;
		    default: str = pinyin.tonemarks.split(" ");
		    }

		    if (this.lc.config.useCustomTones) {
			let tone;
			for (let i = 0, len = pinyin.tones.length; i < len; i++) {
                            tone = pinyin.tones[i];
                            html += '<span class="tone' + tone
				+ '" style="color:' + this.lc.config.customTones[tone-1] + '">'
				+ str[i] + ' </span>';
			}
		    } else {
			for (let i = 0, len = pinyin.tones.length; i < len; i++) {
                            html += '<span class="tone' + pinyin.tones[i] + '">' + str[i] + ' </span>';
			}
                    }
		} else {
            	    if (this.lc.config.useCustomTones) {
			switch (this.lc.config.pinyinType) {
			case "tonenums":
                            html += '<span style="color:' + this.lc.config.customTones[5] + '">' +
				pinyin.tonenums + '</span></span>';
                            break;
			case "zhuyin":
                            html += '<span style="color:' + this.lc.config.customTones[5] + '">' +
				pinyin.zhuyin + '</span></span>';
                            break;
			default:
                            html += '<span style="color:' + this.lc.config.customTones[5] + '">' +
				pinyin.tonemarks + '</span></span>';
			}
		    } else {
			switch (this.lc.config.pinyinType) {
			case "tonenums": html += pinyin.tonenums + '</span>'; break;
			case "zhuyin": html += pinyin.zhuyin + '</span>'; break;
			default: html += pinyin.tonemarks + '</span>';
			}
		    }
		}
	    }

	    if (showPingjam) {
		//PINGJAM
		html += '</div><div class="pingjam"><div class="lang">JP</div>';

		if (this.lc.config.usePingjamToneColors) {
            	    let str = pingjam.jtonenums.split(" "); // only case for now is jyutping + tone numbers
		    if (this.lc.config.useCustomTones) {
			let jtone;	// to emphasise we are dealing with pingjam tones here
			for (let i = 0, len = pingjam.jtones.length; i < len; i++) {
                            jtone = pingjam.jtones[i];
                            html += '<span class="jtone' + jtone
				+ '" style="color:' + this.lc.config.jcustomTones[jtone-1] + '">'
				+ str[i] + ' </span>';
			}
		    } else {
			for (let i = 0, len = pingjam.jtones.length; i < len; i++) {
                            html += '<span class="jtone' + pingjam.jtones[i] + '">' + str[i] + ' </span>';
			}
                    }
		} else {
            	    if (this.lc.config.useCustomTones) {
			html += '<span style="color:' + this.lc.config.jcustomTones[6] + '">' +
                            pingjam.jtonenums + '</span></span>';
                    } else {
			// switch (this.lc.config.pinjamType) // only case for now is jyutping + tone numbers
			html += pingjam.jtonenums + '</span>';
		    }
		}
	    }

	    b.push(html);

	    //DEFINITION
	    if (!this.lc.dict.noDefinition) {
                b.push('</div><div class="def">' + def + '</div></div>');
            } else {
		b.push('</div></div>');
	    }
	}
	
	return b.join('');
    }

    isVowel(letter) {
	return letter === "a" || letter === "e" || letter === "i" || letter === "o" || letter === "u";
    }

    parsePingjam(pingjam) {
	const pingjamref = ['aa', 'aai', 'aak', 'aan', 'aap', 'aat', 'aau', 'ai', 'ak', 'am', 'ang', 'ap', 'au', 'baa', 'baai', 'baak', 'baan', 'baat', 'baau', 'bai', 'bak', 'bam', 'ban', 'bang', 'bat', 'be', 'bei', 'beng', 'bi', 'bik', 'bin', 'bing', 'bit', 'biu', 'bo', 'bok', 'bong', 'bou', 'bui', 'buk', 'bun', 'but', 'caa', 'caai', 'caak', 'caam', 'caan', 'caang', 'caap', 'caat', 'caau', 'cai', 'cam', 'can', 'cang', 'cat', 'cau', 'ce', 'cek', 'ceng', 'ceoi', 'ceon', 'ceot', 'ci', 'cik', 'cim', 'cin', 'cing', 'cit', 'ciu', 'co', 'coek', 'coeng', 'coi', 'cok', 'cong', 'cou', 'cuk', 'cung', 'cyu', 'cyun', 'cyut', 'daa', 'daai', 'daam', 'daan', 'daap', 'daat', 'dai', 'dak', 'dam', 'dan', 'dang', 'dap', 'dat', 'dau', 'de', 'dei', 'dek', 'deng', 'deoi', 'deon', 'di', 'dik', 'dim', 'din', 'ding', 'dip', 'dit', 'diu', 'do', 'doeng', 'doi', 'dok', 'dong', 'dou', 'duk', 'dung', 'dyun', 'dyut', 'faa', 'faai', 'faan', 'faat', 'fai', 'fan', 'fat', 'fau', 'fe', 'fei', 'fi', 'fit', 'fiu', 'fo', 'fong', 'fu', 'fui', 'fuk', 'fun', 'fung', 'fut', 'gaa', 'gaai', 'gaak', 'gaam', 'gaan', 'gaang', 'gaap', 'gaat', 'gaau', 'gai', 'gam', 'gan', 'gang', 'gap', 'gat', 'gau', 'ge', 'gei', 'geng', 'geoi', 'gep', 'gik', 'gim', 'gin', 'ging', 'gip', 'git', 'giu', 'go', 'goe', 'goek', 'goeng', 'goi', 'gok', 'gon', 'gong', 'got', 'gou', 'gu', 'gui', 'guk', 'gun', 'gung', 'gwaa', 'gwaai', 'gwaak', 'gwaan', 'gwaat', 'gwai', 'gwan', 'gwang', 'gwat', 'gwik', 'gwo', 'gwok', 'gwong', 'gyun', 'haa', 'haai', 'haak', 'haam', 'haan', 'haang', 'haap', 'haau', 'hai', 'hak', 'ham', 'han', 'hang', 'hap', 'hat', 'hau', 'hei', 'hek', 'heng', 'heoi', 'him', 'hin', 'hing', 'hip', 'hit', 'hiu', 'ho', 'hoeng', 'hoi', 'hok', 'hon', 'hong', 'hot', 'hou', 'huk', 'hung', 'hyun', 'hyut', 'jaa', 'jaap', 'jai', 'jam', 'jan', 'jap', 'jat', 'jau', 'je', 'jeng', 'jeoi', 'jeon', 'ji', 'jik', 'jim', 'jin', 'jing', 'jip', 'jit', 'jiu', 'joek', 'joeng', 'juk', 'jung', 'jyu', 'jyun', 'jyut', 'kaa', 'kaat', 'kaau', 'kai', 'kam', 'kan', 'kang', 'kap', 'kat', 'kau', 'ke', 'kei', 'kek', 'keoi', 'kim', 'kin', 'king', 'kip', 'kit', 'kiu', 'koeng', 'koi', 'kok', 'kong', 'ku', 'kui', 'kuk', 'kung', 'kut', 'kwaa', 'kwai', 'kwan', 'kwik', 'kwok', 'kwong', 'kyun', 'kyut', 'laa', 'laai', 'laam', 'laan', 'laang', 'laap', 'laat', 'laau', 'lai', 'lak', 'lam', 'lap', 'lat', 'lau', 'le', 'lei', 'lek', 'leng', 'leoi', 'leon', 'leot', 'li', 'lik', 'lim', 'lin', 'ling', 'lip', 'lit', 'liu', 'lo', 'loek', 'loeng', 'loi', 'lok', 'long', 'lou', 'luk', 'lung', 'lyun', 'lyut', 'm', 'maa', 'maai', 'maak', 'maan', 'maang', 'maat', 'maau', 'mai', 'mak', 'man', 'mang', 'mat', 'mau', 'me', 'mei', 'meng', 'mi', 'min', 'ming', 'mit', 'miu', 'mo', 'mok', 'mong', 'mou', 'mui', 'muk', 'mun', 'mung', 'mut', 'naa', 'naai', 'naam', 'naan', 'naap', 'naat', 'naau', 'nai', 'nam', 'nan', 'nang', 'nap', 'nau', 'ne', 'nei', 'neoi', 'ng', 'ngaa', 'ngaai', 'ngaak', 'ngaam', 'ngaan', 'ngaang', 'ngaat', 'ngaau', 'ngai', 'ngam', 'ngan', 'ngap', 'ngat', 'ngau', 'ngit', 'ngo', 'ngoi', 'ngok', 'ngong', 'ngou', 'ni', 'nik', 'nim', 'nin', 'ning', 'niu', 'no', 'noeng', 'noi', 'nong', 'nou', 'nung', 'nyun', 'o', 'oi', 'ok', 'on', 'ou', 'paa', 'paai', 'paak', 'paan', 'paang', 'paau', 'pai', 'pan', 'pat', 'pau', 'pe', 'pei', 'pek', 'peng', 'pik', 'pin', 'ping', 'pit', 'piu', 'po', 'pok', 'pong', 'pou', 'pui', 'puk', 'pun', 'pung', 'put', 'saa', 'saai', 'saam', 'saan', 'saang', 'saap', 'saat', 'saau', 'sai', 'sak', 'sam', 'san', 'sang', 'sap', 'sat', 'sau', 'se', 'sei', 'sek', 'seng', 'seo', 'seoi', 'seon', 'seot', 'si', 'sik', 'sim', 'sin', 'sing', 'sip', 'sit', 'siu', 'so', 'soek', 'soeng', 'sok', 'song', 'sou', 'suk', 'sung', 'syu', 'syun', 'syut', 'taa', 'taai', 'taam', 'taan', 'taap', 'taat', 'tai', 'tam', 'tan', 'tang', 'tau', 'tek', 'teng', 'teoi', 'tik', 'tim', 'tin', 'ting', 'tip', 'tit', 'tiu', 'to', 'toi', 'tok', 'tong', 'tou', 'tuk', 'tung', 'tyun', 'tyut', 'uk', 'ung', 'waa', 'waai', 'waak', 'waan', 'waang', 'waat', 'wai', 'wan', 'wang', 'wat', 'we', 'wing', 'wo', 'wok', 'wong', 'wu', 'wui', 'wun', 'wut', 'zaa', 'zaai', 'zaak', 'zaam', 'zaan', 'zaang', 'zaap', 'zaat', 'zaau', 'zai', 'zak', 'zam', 'zan', 'zang', 'zap', 'zat', 'zau', 'ze', 'zek', 'zeng', 'zeoi', 'zeon', 'zeot', 'zi', 'zik', 'zim', 'zin', 'zing', 'zip', 'zit', 'ziu', 'zo', 'zoe', 'zoek', 'zoeng', 'zoi', 'zok', 'zong', 'zou', 'zuk', 'zung', 'zyu', 'zyun', 'zyut'],	      
	      yaleref = ['a', 'aai', 'aak', 'aan', 'aap', 'aat', 'aau', 'ai', 'ak', 'am', 'ang', 'ap', 'au', 'ba', 'baai', 'baak', 'baan', 'baat', 'baau', 'bai', 'bak', 'bam', 'ban', 'bang', 'bat', 'be', 'bei', 'beng', 'bi', 'bik', 'bin', 'bing', 'bit', 'biu', 'bo', 'bok', 'bong', 'bou', 'bui', 'buk', 'bun', 'but', 'cha', 'chaai', 'chaak', 'chaam', 'chaan', 'chaang', 'chaap', 'chaat', 'chaau', 'chai', 'cham', 'chan', 'chang', 'chat', 'chau', 'che', 'chek', 'cheng', 'cheui', 'cheun', 'cheut', 'chi', 'chik', 'chim', 'chin', 'ching', 'chit', 'chiu', 'cho', 'cheuk', 'cheung', 'choi', 'chok', 'chong', 'chou', 'chuk', 'chung', 'chyu', 'chyun', 'chyut', 'da', 'daai', 'daam', 'daan', 'daap', 'daat', 'dai', 'dak', 'dam', 'dan', 'dang', 'dap', 'dat', 'dau', 'de', 'dei', 'dek', 'deng', 'deui', 'deun', 'di', 'dik', 'dim', 'din', 'ding', 'dip', 'dit', 'diu', 'do', 'deung', 'doi', 'dok', 'dong', 'dou', 'duk', 'dung', 'dyun', 'dyut', 'fa', 'faai', 'faan', 'faat', 'fai', 'fan', 'fat', 'fau', 'fe', 'fei', 'fi', 'fit', 'fiu', 'fo', 'fong', 'fu', 'fui', 'fuk', 'fun', 'fung', 'fut', 'ga', 'gaai', 'gaak', 'gaam', 'gaan', 'gaang', 'gaap', 'gaat', 'gaau', 'gai', 'gam', 'gan', 'gang', 'gap', 'gat', 'gau', 'ge', 'gei', 'geng', 'geui', 'gep', 'gik', 'gim', 'gin', 'ging', 'gip', 'git', 'giu', 'go', 'geu', 'geuk', 'geung', 'goi', 'gok', 'gon', 'gong', 'got', 'gou', 'gu', 'gui', 'guk', 'gun', 'gung', 'gwa', 'gwaai', 'gwaak', 'gwaan', 'gwaat', 'gwai', 'gwan', 'gwang', 'gwat', 'gwik', 'gwo', 'gwok', 'gwong', 'gyun', 'ha', 'haai', 'haak', 'haam', 'haan', 'haang', 'haap', 'haau', 'hai', 'hak', 'ham', 'han', 'hang', 'hap', 'hat', 'hau', 'hei', 'hek', 'heng', 'heui', 'him', 'hin', 'hing', 'hip', 'hit', 'hiu', 'ho', 'heung', 'hoi', 'hok', 'hon', 'hong', 'hot', 'hou', 'huk', 'hung', 'hyun', 'hyut', 'ya', 'yaap', 'yai', 'yam', 'yan', 'yap', 'yat', 'yau', 'ye', 'yeng', 'yeui', 'yeun', 'yi', 'yik', 'yim', 'yin', 'ying', 'yip', 'yit', 'yiu', 'yeuk', 'yeung', 'yuk', 'yung', 'yu', 'yun', 'yut', 'ka', 'kaat', 'kaau', 'kai', 'kam', 'kan', 'kang', 'kap', 'kat', 'kau', 'ke', 'kei', 'kek', 'keui', 'kim', 'kin', 'king', 'kip', 'kit', 'kiu', 'keung', 'koi', 'kok', 'kong', 'ku', 'kui', 'kuk', 'kung', 'kut', 'kwa', 'kwai', 'kwan', 'kwik', 'kwok', 'kwong', 'kyun', 'kyut', 'la', 'laai', 'laam', 'laan', 'laang', 'laap', 'laat', 'laau', 'lai', 'lak', 'lam', 'lap', 'lat', 'lau', 'le', 'lei', 'lek', 'leng', 'leui', 'leun', 'leut', 'li', 'lik', 'lim', 'lin', 'ling', 'lip', 'lit', 'liu', 'lo', 'leuk', 'leung', 'loi', 'lok', 'long', 'lou', 'luk', 'lung', 'lyun', 'lyut', 'm', 'ma', 'maai', 'maak', 'maan', 'maang', 'maat', 'maau', 'mai', 'mak', 'man', 'mang', 'mat', 'mau', 'me', 'mei', 'meng', 'mi', 'min', 'ming', 'mit', 'miu', 'mo', 'mok', 'mong', 'mou', 'mui', 'muk', 'mun', 'mung', 'mut', 'na', 'naai', 'naam', 'naan', 'naap', 'naat', 'naau', 'nai', 'nam', 'nan', 'nang', 'nap', 'nau', 'ne', 'nei', 'neui', 'ng', 'nga', 'ngaai', 'ngaak', 'ngaam', 'ngaan', 'ngaang', 'ngaat', 'ngaau', 'ngai', 'ngam', 'ngan', 'ngap', 'ngat', 'ngau', 'ngit', 'ngo', 'ngoi', 'ngok', 'ngong', 'ngou', 'ni', 'nik', 'nim', 'nin', 'ning', 'niu', 'no', 'neung', 'noi', 'nong', 'nou', 'nung', 'nyun', 'o', 'oi', 'ok', 'on', 'ou', 'pa', 'paai', 'paak', 'paan', 'paang', 'paau', 'pai', 'pan', 'pat', 'pau', 'pe', 'pei', 'pek', 'peng', 'pik', 'pin', 'ping', 'pit', 'piu', 'po', 'pok', 'pong', 'pou', 'pui', 'puk', 'pun', 'pung', 'put', 'sa', 'saai', 'saam', 'saan', 'saang', 'saap', 'saat', 'saau', 'sai', 'sak', 'sam', 'san', 'sang', 'sap', 'sat', 'sau', 'se', 'sei', 'sek', 'seng', 'seo', 'seui', 'seun', 'seut', 'si', 'sik', 'sim', 'sin', 'sing', 'sip', 'sit', 'siu', 'so', 'seuk', 'seung', 'sok', 'song', 'sou', 'suk', 'sung', 'syu', 'syun', 'syut', 'ta', 'taai', 'taam', 'taan', 'taap', 'taat', 'tai', 'tam', 'tan', 'tang', 'tau', 'tek', 'teng', 'teui', 'tik', 'tim', 'tin', 'ting', 'tip', 'tit', 'tiu', 'to', 'toi', 'tok', 'tong', 'tou', 'tuk', 'tung', 'tyun', 'tyut', 'uk', 'ung', 'wa', 'waai', 'waak', 'waan', 'waang', 'waat', 'wai', 'wan', 'wang', 'wat', 'we', 'wing', 'wo', 'wok', 'wong', 'wu', 'wui', 'wun', 'wut', 'ja', 'jaai', 'jaak', 'jaam', 'jaan', 'jaang', 'jaap', 'jaat', 'jaau', 'jai', 'jak', 'jam', 'jan', 'jang', 'jap', 'jat', 'jau', 'je', 'jek', 'jeng', 'jeui', 'jeun', 'jeut', 'ji', 'jik', 'jim', 'jin', 'jing', 'jip', 'jit', 'jiu', 'jo', 'jeu', 'jeuk', 'jeung', 'joi', 'jok', 'jong', 'jou', 'juk', 'jung', 'jyu', 'jyun', 'jyut'];

	var result = { };
	result.jtones = [ ];

	// for now only jyutping + tonenums supported
	result.jtonenums = pingjam;
	pingjam = pingjam.split(" ");

	for (let i = 0; i < pingjam.length; i++) {
	    let pin = pingjam[i];
	    let jtone = parseInt(pin.slice(-1));

	    // may be possible that dictionary has a typo and
	    // no tone number was given. In such a case just
	    // set tone to tone 1
	    if (isNaN(jtone)) {
		jtone = 1;
	    }
	    
	    result.jtones.push(jtone)
	}

	return result;
    }

    parsePinyin(pinyin) {
        const pinyinref = ['a','ai','an','ang','ao','ba','bai','ban','bang','bao','bei','ben','beng','bi','bian','biao','bie','bin','bing','bo','bu','ca','cai','can','cang','cao','ce','cen','ceng','cha','chai','chan','chang','chao','che','chen','cheng','chi','chong','chou','chu','chua','chuai','chuan','chuang','chui','chun','chuo','ci','cong','cou','cu','cuan','cui','cun','cuo','da','dai','dan','dang','dao','de','deng','di','dian','diang','diao','die','ding','diu','dong','dou','du','duan','dui','dun','duo','e','ei','en','er','fa','fan','fang','fei','fen','feng','fo','fou','fu','ga','gai','gan','gang','gao','ge','gei','gen','geng','gong','gou','gu','gua','guai','guan','guang','gui','gun','guo','ha','hai','han','hang','hao','he','hei','hen','heng','hong','hou','hu','hua','huai','huan','huang','hui','hun','huo','ji','jia','jian','jiang','jiao','jie','jin','jing','jiong','jiu','ju','juan','jue','jun','ka','kai','kan','kang','kao','ke','ken','keng','kong','kou','ku','kua','kuai','kuan','kuang','kui','kun','kuo','la','lai','lan','lang','lao','le','lei','leng','li','lian','liang','liao','lie','lin','ling','liu','long','lou','lu','l\u00FC','luan','l\u00FCe','lun','luo','ma','mai','man','mang','mao','me','mei','men','meng','mi','mian','miao','mie','min','ming','miu','mo','mou','mu','na','nai','nan','nang','nao','ne','nei','nen','neng','ni','nia','nian','niang','niao','nie','nin','ning','niu','nong','nou','nu','n\u00FC','nuan','n\u00FCe','nuo','nun','ou','pa','pai','pan','pang','pao','pei','pen','peng','pi','pian','piao','pie','pin','ping','po','pou','pu','qi','qia','qian','qiang','qiao','qie','qin','qing','qiong','qiu','qu','quan','que','qun','ran','rang','rao','re','ren','reng','ri','rong','rou','ru','ruan','rui','run','ruo','sa','sai','san','sang','sao','se','sei','sen','seng','sha','shai','shan','shang','shao','she','shei','shen','sheng','shi','shong','shou','shu','shua','shuai','shuan','shuang','shui','shun','shuo','si','song','sou','su','suan','sui','sun','suo','ta','tai','tan','tang','tao','te','teng','ti','tian','tiao','tie','ting','tong','tou','tu','tuan','tui','tun','tuo','wa','wai','wan','wang','wei','wen','weng','wo','wu','xi','xia','xian','xiang','xiao','xie','xin','xing','xiong','xiu','xu','xuan','xue','xun','ya','yai','yan','yang','yao','ye','yi','yin','ying','yo','yong','you','yu','yuan','yue','yun','za','zai','zan','zang','zao','ze','zei','zen','zeng','zha','zhai','zhan','zhang','zhao','zhe','zhei','zhen','zheng','zhi','zhong','zhou','zhu','zhua','zhuai','zhuan','zhuang','zhui','zhun','zhuo','zi','zong','zou','zu','zuan','zui','zun','zuo'],
	      zhuyinref = ['\u311A','\u311E','\u3122','\u3124','\u3120','\u3105\u311A','\u3105\u311E','\u3105\u3122','\u3105\u3124','\u3105\u3120','\u3105\u311F','\u3105\u3123','\u3105\u3125','\u3105\u30FC','\u3105\u30FC\u3122','\u3105\u30FC\u3120','\u3105\u30FC\u311D','\u3105\u30FC\u3123','\u3105\u30FC\u3125','\u3105\u311B','\u3105\u3128','\u3118\u311A','\u3118\u311E','\u3118\u3122','\u3118\u3124','\u3118\u3120','\u3118\u311C','\u3118\u3123','\u3118\u3125','\u3114\u311A','\u3114\u311E','\u3114\u3122','\u3114\u3124','\u3114\u3120','\u3114\u311C','\u3114\u3123','\u3114\u3125','\u3114','\u3114\u3128\u3125','\u3114\u3121','\u3114\u3128','\u3114\u3128\u311A','\u3114\u3128\u311E','\u3114\u3128\u3122','\u3114\u3128\u3124','\u3114\u3128\u311F','\u3114\u3128\u3123','\u3114\u3128\u311B','\u3118','\u3118\u3128\u3125','\u3118\u3121','\u3118\u3128','\u3118\u3128\u3122','\u3118\u3128\u311F','\u3118\u3128\u3123','\u3118\u3128\u311B','\u3109\u311A','\u3109\u311E','\u3109\u3122','\u3109\u3124','\u3109\u3120','\u3109\u311C','\u3109\u3125','\u3109\u30FC','\u3109\u30FC\u3122','\u3109\u30FC\u3124','\u3109\u30FC\u3120','\u3109\u30FC\u311D','\u3109\u30FC\u3125','\u3109\u30FC\u3121','\u3109\u3128\u3125','\u3109\u3121','\u3109\u3128','\u3109\u3128\u3122','\u3109\u3128\u311F','\u3109\u3128\u3123','\u3109\u3128\u311B','\u311C','\u311F','\u3123','\u3126','\u3108\u311A','\u3108\u3122','\u3108\u3124','\u3108\u311F','\u3108\u3123','\u3108\u3125','\u3108\u311B','\u3108\u3121','\u3108\u3128','\u310D\u311A','\u310D\u311E','\u310D\u3122','\u310D\u3124','\u310D\u3120','\u310D\u311C','\u310D\u311F','\u310D\u3123','\u310D\u3125','\u310D\u3128\u3125','\u310D\u3121','\u310D\u3128','\u310D\u3128\u311A','\u310D\u3128\u311E','\u310D\u3128\u3122','\u310D\u3128\u3124','\u310D\u3128\u311F','\u310D\u3128\u3123','\u310D\u3128\u311B','\u310F\u311A','\u310F\u311E','\u310F\u3122','\u310F\u3124','\u310F\u3120','\u310F\u311C','\u310F\u311F','\u310F\u3123','\u310F\u3125','\u310F\u3128\u3125','\u310F\u3121','\u310F\u3128','\u310F\u3128\u311A','\u310F\u3128\u311E','\u310F\u3128\u3122','\u310F\u3128\u3124','\u310F\u3128\u311F','\u310F\u3128\u3123','\u310F\u3128\u311B','\u3110\u30FC','\u3110\u30FC\u311A','\u3110\u30FC\u3122','\u3110\u30FC\u3124','\u3110\u30FC\u3120','\u3110\u30FC\u311D','\u3110\u30FC\u3123','\u3110\u30FC\u3125','\u3110\u3129\u3125','\u3110\u30FC\u3121','\u3110\u3129','\u3110\u3129\u3122','\u3110\u3129\u311D','\u3110\u3129\u3123','\u310E\u311A','\u310E\u311E','\u310E\u3122','\u310E\u3124','\u310E\u3120','\u310E\u311C','\u310E\u3123','\u310E\u3125','\u310E\u3128\u3125','\u310E\u3121','\u310E\u3128','\u310E\u3128\u311A','\u310E\u3128\u311E','\u310E\u3128\u3122','\u310E\u3128\u3124','\u310E\u3128\u311F','\u310E\u3128\u3123','\u310E\u3128\u311B','\u310C\u311A','\u310C\u311E','\u310C\u3122','\u310C\u3124','\u310C\u3120','\u310C\u311C','\u310C\u311F','\u310C\u3125','\u310C\u30FC','\u310C\u30FC\u3122','\u310C\u30FC\u3124','\u310C\u30FC\u3120','\u310C\u30FC\u311D','\u310C\u30FC\u3123','\u310C\u30FC\u3125','\u310C\u30FC\u3121','\u310C\u3128\u3125','\u310C\u3121','\u310C\u3128','\u310C\u3129','\u310C\u3128\u3122','\u310C\u3129\u311D','\u310C\u3128\u3123','\u310C\u3128\u311B','\u3107\u311A','\u3107\u311E','\u3107\u3122','\u3107\u3124','\u3107\u3120','\u3107\u311C','\u3107\u311F','\u3107\u3123','\u3107\u3125','\u3107\u30FC','\u3107\u30FC\u3122','\u3107\u30FC\u3120','\u3107\u30FC\u311D','\u3107\u30FC\u3123','\u3107\u30FC\u3125','\u3107\u30FC\u3121','\u3107\u3128\u311B','\u3107\u3121','\u3107\u3128','\u310B\u311A','\u310B\u311E','\u310B\u3122','\u310B\u3124','\u310B\u3120','\u310B\u311B','\u310B\u311F','\u310B\u3123','\u310B\u3125','\u310B\u30FC','\u310B\u30FC\u311A','\u310B\u30FC\u3122','\u310B\u30FC\u3124','\u310B\u30FC\u3120','\u310B\u30FC\u311D','\u310B\u30FC\u3123','\u310B\u30FC\u3125','\u310B\u30FC\u3121','\u310B\u3128\u3125','\u310B\u3121','\u310B\u3128','\u310B\u3129','\u310B\u3128\u3122','\u310B\u3129\u311D','\u310B\u3128\u311B','\u310B\u3128\u3123','\u3121','\u3106\u311A','\u3106\u311E','\u3106\u3122','\u3106\u3124','\u3106\u3120','\u3106\u311F','\u3106\u3123','\u3106\u3125','\u3106\u30FC','\u3106\u30FC\u3122','\u3106\u30FC\u3120','\u3106\u30FC\u311D','\u3106\u30FC\u3123','\u3106\u30FC\u3125','\u3106\u3128\u311B','\u3106\u3121','\u3106\u3128','\u3111\u30FC','\u3111\u30FC\u311A','\u3111\u30FC\u3122','\u3111\u30FC\u3124','\u3111\u30FC\u3120','\u3111\u30FC\u311D','\u3111\u30FC\u3123','\u3111\u30FC\u3125','\u3111\u3129\u3125','\u3111\u30FC\u3121','\u3111\u3129','\u3111\u3129\u3122','\u3111\u3129\u311D','\u3111\u3129\u3123','\u3116\u3122','\u3116\u3124','\u3116\u3120','\u3116\u311C','\u3116\u3123','\u3116\u3125','\u3116','\u3116\u3128\u3125','\u3116\u3121','\u3116\u3128','\u3116\u3128\u3122','\u3116\u3128\u311F','\u3116\u3128\u3123','\u3116\u3128\u311B','\u3119\u311A','\u3119\u311E','\u3119\u3122','\u3119\u3124','\u3119\u3120','\u3119\u311C','\u3119\u311F','\u3119\u3123','\u3119\u3125','\u3115\u311A','\u3115\u311E','\u3115\u3122','\u3115\u3124','\u3115\u3120','\u3115\u311C','\u3115\u311F','\u3115\u3123','\u3115\u3125','\u3115','\u3115\u3121\u3125','\u3115\u3121','\u3115\u3128','\u3115\u3128\u311A','\u3115\u3128\u311E','\u3115\u3128\u3122','\u3115\u3128\u3124','\u3115\u3128\u311F','\u3115\u3128\u3123','\u3115\u3128\u311B','\u3119','\u3119\u3128\u3125','\u3119\u3121','\u3119\u3128','\u3119\u3128\u3122','\u3119\u3128\u311F','\u3119\u3128\u3123','\u3119\u3128\u311B','\u310A\u311A','\u310A\u311E','\u310A\u3122','\u310A\u3124','\u310A\u3120','\u310A\u311C','\u310A\u3125','\u310A\u30FC','\u310A\u30FC\u3122','\u310A\u30FC\u3120','\u310A\u30FC\u311D','\u310A\u30FC\u3125','\u310A\u3128\u3125','\u310A\u3121','\u310A\u3128','\u310A\u3128\u3122','\u310A\u3128\u311F','\u310A\u3128\u3123','\u310A\u3128\u311B','\u3128\u311A','\u3128\u311E','\u3128\u3122','\u3128\u3124','\u3128\u311F','\u3128\u3123','\u3128\u3125','\u3128\u311B','\u3128','\u3112\u30FC','\u3112\u30FC\u311A','\u3112\u30FC\u3122','\u3112\u30FC\u3124','\u3112\u30FC\u3120','\u3112\u30FC\u311D','\u3112\u30FC\u3123','\u3112\u30FC\u3125','\u3112\u3129\u3125','\u3112\u30FC\u3121','\u3112\u3129','\u3112\u3129\u3122','\u3112\u3129\u311D','\u3112\u3129\u3123','\u30FC\u311A','\u30FC\u311E','\u30FC\u3122','\u30FC\u3124','\u30FC\u3120','\u30FC\u311D','\u30FC','\u30FC\u3123','\u30FC\u3125','\u30FC\u311B','\u3129\u3125','\u30FC\u3121','\u3129','\u3129\u3122','\u3129\u311D','\u3129\u3123','\u3117\u311A','\u3117\u311E','\u3117\u3122','\u3117\u3124','\u3117\u3120','\u3117\u311C','\u3117\u311F','\u3117\u3123','\u3117\u3125','\u3113\u311A','\u3113\u311E','\u3113\u3122','\u3113\u3124','\u3113\u3120','\u3113\u311C','\u3113\u311F','\u3113\u3123','\u3113\u3125','\u3113','\u3113\u3128\u3125','\u3113\u3121','\u3113\u3128','\u3113\u3128\u311A','\u3113\u3128\u311E','\u3113\u3128\u3122','\u3113\u3128\u3124','\u3113\u3128\u311F','\u3113\u3128\u3123','\u3113\u3128\u311B','\u3117','\u3117\u3128\u3125','\u3117\u3121','\u3117\u3128','\u3117\u3128\u3122','\u3117\u3128\u311F','\u3117\u3128\u3123','\u3117\u3128\u311B'];

        // Pinyin info
        const _a = [ "\u0101", "\u00E1", "\u01CE", "\u00E0", "a"],
	      _e = [ "\u0113", "\u00E9", "\u011B", "\u00E8", "e"],
	      _i = [ "\u012B", "\u00ED", "\u01D0", "\u00EC", "i"],
	      _o = [ "\u014D", "\u00F3", "\u01D2", "\u00F2", "o"],
	      _u = [ "\u016B", "\u00FA", "\u01D4", "\u00F9", "u"],
	      _v = [ "\u01D6", "\u01D8", "\u01DA", "\u01DC", "\u00FC"],
	      ztone = ['', '\u02CA', '\u02C7', '\u02CB', '\u30FB'];
	
	let result = { };
	result.tones = [ ];

	let addToneMarks = false,
	    addToneNums = false,
	    addZhuyin = false;

        switch (this.lc.config.pinyinType) {
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
	for( let i = 0; i < pinyin.length; i++){
	    let pin = pinyin[i].replace('u:', "\u00FC");
	    let tone = 4;

	    if (addToneNums) { tonenums.push(pin.toLowerCase()); }
	    
	    if( pin.indexOf("1") !== -1 ) tone = 0;
	    else if( pin.indexOf("2") !== -1 ) tone = 1;
	    else if( pin.indexOf("3") !== -1 ) tone = 2;
	    else if( pin.indexOf("4") !== -1 ) tone = 3;
	    
	    result.tones.push(tone+1);

	    if (addZhuyin) {
                let prepin = pin.substring(0, pin.length - 1);
                let indx = pinyinref.indexOf(prepin.toLowerCase());
                zhuyin.push(zhuyinref[indx] + ztone[tone]);
            }

            if (addToneMarks) {
		if( pin.indexOf("a") !== -1 ) pin = pin.replace( "a", _a[tone] );
		else if( pin.indexOf("e") !== -1 ) pin = pin.replace( "e", _e[tone] );
		else if( pin.indexOf("ou") !== -1 ) pin = pin.replace( "o", _o[tone] );
		else {
		    for( let k = pin.length - 1; k >= 0; k--){
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
}
