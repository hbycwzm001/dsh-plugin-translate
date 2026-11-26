window.__ModuleLoader__.load({
  id: 'dsh-plugin-translate',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useRef } = React;

    const NS = 'translateTab';
    const TAB_VISIBLE_KEY = 'dsh-plugin-translate:tab-visible';
    const API = {
      countries: 'api/translate/countries',
      run: 'api/translate/run'
    };

    const ZH = {
      tab: '翻译',
      title: '按国家翻译',
      sub: '选一个目标国家，译成当地人真正会说的那种话，而不是书面直译。',
      target: '目标国家',
      tone: '语气',
      engine: '翻译引擎',
      engineDeepseek: 'DeepSeek · 按国家本地化（推荐）',
      engineGoogle: 'Google 翻译 · 逐句直译',
      googleNote: '谷歌翻译做逐句直译，不体现当地语气与惯用语；需要「像当地人说的话」请用 DeepSeek。谷歌接口需开着 Clash。',
      input: '要翻译的内容',
      placeholder: '输入中文（或任何语言），比如：这款车 25 万人民币，续航 600 公里…',
      go: '翻译',
      busy: '正在翻译…',
      copy: '复制',
      copied: '已复制',
      clear: '清空',
      result: '译文',
      swap: '反向翻译',
      chars: '字',
      ms: '毫秒',
      empty: '（还没有译文）',
      err: '翻译失败',
      keyHint: '粘贴有效的 DeepSeek API Key（sk-…），本次会话立即生效',
      saveKey: '保存并重试',
      saving: '验证中…',
      settingsTitle: '翻译',
      search: '搜索',
      searchHint: '国家 / 语言 / 货币',
      fxTitle: '实时汇率',
      fxLoading: '读取中…',
      fxFail: '汇率读取失败',
      fxNoCur: '该国无对应货币',
      refresh: '刷新',
      settingsShowTab: '在对话顶部显示「翻译」标签',
      settingsHint: '关掉只是隐藏入口，翻译能力和 Agent 工具照常可用。',
      keyMissing: '没找到 DeepSeek API Key：把它写进 ~/.dsh/.credentials.yaml 的 DEEPSEEK_API_KEY。',
      quick: '常用'
    };
    const EN = {
      tab: 'Translate',
      title: 'Translate by country',
      sub: 'Pick a target country and get what locals actually say, not literal wording.',
      target: 'Country',
      tone: 'Tone',
      engine: 'Engine',
      engineDeepseek: 'DeepSeek · localized',
      engineGoogle: 'Google Translate · literal',
      googleNote: 'Google Translate is literal and ignores local tone. Use DeepSeek for native-sounding output. Google needs Clash running.',
      input: 'Text',
      placeholder: 'Type anything…',
      go: 'Translate',
      busy: 'Translating…',
      copy: 'Copy',
      copied: 'Copied',
      clear: 'Clear',
      result: 'Result',
      swap: 'Back-translate',
      chars: 'chars',
      ms: 'ms',
      empty: '(no result yet)',
      err: 'Failed',
      keyHint: 'Paste a valid DeepSeek API key (sk-...); used for this session',
      saveKey: 'Save & retry',
      saving: 'Checking...',
      settingsTitle: 'Translate',
      search: 'Search',
      searchHint: 'country / language / currency',
      fxTitle: 'Live rate',
      fxLoading: 'loading…',
      fxFail: 'rate unavailable',
      fxNoCur: 'no currency for this country',
      refresh: 'Refresh',
      settingsShowTab: 'Show the "Translate" tab above the conversation',
      settingsHint: 'Hiding only removes the entry; the tool keeps working.',
      keyMissing: 'No DeepSeek API key found in ~/.dsh/.credentials.yaml (DEEPSEEK_API_KEY).',
      quick: 'Common'
    };

    let currentT = (k) => (ZH[k] || k);
    function useT() { return currentT; }

    // 内置国家/地区表（263 条，来自 CLDR）：接口不可用时也能选全
    const EMBEDDED_COUNTRIES = [{"code":"aeb-TN","country":"突尼斯","language":"突尼斯阿拉伯语","locale":"aeb_TN","currency":"TND"},{"code":"af-NA","country":"纳米比亚","language":"南非荷兰语","locale":"af_NA","currency":"NAD"},{"code":"ak-GH","country":"加纳","language":"阿肯语","locale":"ak_GH","currency":"GHS"},{"code":"apc-LB","country":"黎巴嫩","language":"黎凡特阿拉伯语","locale":"apc_LB","currency":"LBP"},{"code":"apc-SY","country":"叙利亚","language":"黎凡特阿拉伯语","locale":"apc_SY","currency":"SYP"},{"code":"apd-SD","country":"苏丹","language":"苏丹阿拉伯语","locale":"apd_SD","currency":"SDG"},{"code":"ar-AE","country":"阿拉伯联合酋长国","language":"阿拉伯语","locale":"ar_AE","currency":"AED"},{"code":"ar-BH","country":"巴林","language":"阿拉伯语","locale":"ar_BH","currency":"BHD"},{"code":"ar-EG","country":"埃及","language":"阿拉伯语","locale":"ar_EG","currency":"EGP"},{"code":"ar-EH","country":"西撒哈拉","language":"阿拉伯语","locale":"ar_EH","currency":"MAD"},{"code":"ar-IQ","country":"伊拉克","language":"阿拉伯语","locale":"ar_IQ","currency":"IQD"},{"code":"ar-JO","country":"约旦","language":"阿拉伯语","locale":"ar_JO","currency":"JOD"},{"code":"ar-KM","country":"科摩罗","language":"阿拉伯语","locale":"ar_KM","currency":"KMF"},{"code":"ar-KW","country":"科威特","language":"阿拉伯语","locale":"ar_KW","currency":"KWD"},{"code":"ar-LY","country":"利比亚","language":"阿拉伯语","locale":"ar_LY","currency":"LYD"},{"code":"ar-MR","country":"毛里塔尼亚","language":"阿拉伯语","locale":"ar_MR","currency":"MRU"},{"code":"ar-OM","country":"阿曼","language":"阿拉伯语","locale":"ar_OM","currency":"OMR"},{"code":"ar-PS","country":"巴勒斯坦领土","language":"阿拉伯语","locale":"ar_PS","currency":"ILS"},{"code":"ar-QA","country":"卡塔尔","language":"阿拉伯语","locale":"ar_QA","currency":"QAR"},{"code":"ar-SA","country":"沙特阿拉伯","language":"阿拉伯语","locale":"ar_SA","currency":"SAR"},{"code":"ar-SS","country":"南苏丹","language":"阿拉伯语","locale":"ar_SS","currency":"SSP"},{"code":"ar-TD","country":"乍得","language":"阿拉伯语","locale":"ar_TD","currency":"XAF"},{"code":"ar-YE","country":"也门","language":"阿拉伯语","locale":"ar_YE","currency":"YER"},{"code":"arq-DZ","country":"阿尔及利亚","language":"阿尔及利亚阿拉伯语","locale":"arq_DZ","currency":"DZD"},{"code":"ary-MA","country":"摩洛哥","language":"当地语言","locale":"ary_MA","currency":"MAD"},{"code":"az-AZ","country":"阿塞拜疆","language":"阿塞拜疆语","locale":"az_AZ","currency":"AZN"},{"code":"be-BY","country":"白俄罗斯","language":"白俄罗斯语","locale":"be_BY","currency":"BYN"},{"code":"bem-ZM","country":"赞比亚","language":"本巴语","locale":"bem_ZM","currency":"ZMW"},{"code":"bg-BG","country":"保加利亚","language":"保加利亚语","locale":"bg_BG","currency":"BGN"},{"code":"bi-VU","country":"瓦努阿图","language":"比斯拉马语","locale":"bi_VU","currency":"VUV"},{"code":"bm-ML","country":"马里","language":"班巴拉语","locale":"bm_ML","currency":"XOF"},{"code":"bn-BD","country":"孟加拉国","language":"孟加拉语","locale":"bn_BD","currency":"BDT"},{"code":"bs-BA","country":"波斯尼亚和黑塞哥维那","language":"波斯尼亚语","locale":"bs_BA","currency":"—"},{"code":"ca-AD","country":"安道尔","language":"加泰罗尼亚语","locale":"ca_AD","currency":"EUR"},{"code":"crs-SC","country":"塞舌尔","language":"塞舌尔克里奥尔语","locale":"crs_SC","currency":"SCR"},{"code":"cs-CZ","country":"捷克","language":"捷克语","locale":"cs_CZ","currency":"CZK"},{"code":"da-DK","country":"丹麦","language":"丹麦语","locale":"da_DK","currency":"DKK"},{"code":"de-AT","country":"奥地利","language":"德语","locale":"de_AT","currency":"EUR"},{"code":"de-CH","country":"瑞士","language":"德语","locale":"de_CH","currency":"CHF"},{"code":"de-DE","country":"德国","language":"德语","locale":"de_DE","currency":"EUR"},{"code":"de-LI","country":"列支敦士登","language":"德语","locale":"de_LI","currency":"CHF"},{"code":"dv-MV","country":"马尔代夫","language":"迪维希语","locale":"dv_MV","currency":"MVR"},{"code":"dz-BT","country":"不丹","language":"宗卡语","locale":"dz_BT","currency":"BTN"},{"code":"el-CY","country":"塞浦路斯","language":"希腊语","locale":"el_CY","currency":"EUR"},{"code":"el-GR","country":"希腊","language":"希腊语","locale":"el_GR","currency":"EUR"},{"code":"en-AG","country":"安提瓜和巴布达","language":"英语","locale":"en_AG","currency":"—"},{"code":"en-AI","country":"安圭拉","language":"英语","locale":"en_AI","currency":"XCD"},{"code":"en-AU","country":"澳大利亚","language":"英语","locale":"en_AU","currency":"AUD"},{"code":"en-BB","country":"巴巴多斯","language":"英语","locale":"en_BB","currency":"BBD"},{"code":"en-BE","country":"比利时","language":"英语","locale":"en_BE","currency":"EUR"},{"code":"en-BM","country":"百慕大","language":"英语","locale":"en_BM","currency":"BMD"},{"code":"en-BS","country":"巴哈马","language":"英语","locale":"en_BS","currency":"BSD"},{"code":"en-BW","country":"博茨瓦纳","language":"英语","locale":"en_BW","currency":"BWP"},{"code":"en-BZ","country":"伯利兹","language":"英语","locale":"en_BZ","currency":"BZD"},{"code":"en-CA","country":"加拿大","language":"英语","locale":"en_CA","currency":"CAD"},{"code":"en-CK","country":"库克群岛","language":"英语","locale":"en_CK","currency":"NZD"},{"code":"en-CX","country":"圣诞岛","language":"英语","locale":"en_CX","currency":"AUD"},{"code":"en-DM","country":"多米尼克","language":"英语","locale":"en_DM","currency":"XCD"},{"code":"en-ET","country":"埃塞俄比亚","language":"英语","locale":"en_ET","currency":"ETB"},{"code":"en-FJ","country":"斐济","language":"英语","locale":"en_FJ","currency":"FJD"},{"code":"en-FK","country":"福克兰群岛","language":"英语","locale":"en_FK","currency":"FKP"},{"code":"en-FM","country":"密克罗尼西亚","language":"英语","locale":"en_FM","currency":"USD"},{"code":"en-GB","country":"英国","language":"英语","locale":"en_GB","currency":"GBP"},{"code":"en-GD","country":"格林纳达","language":"英语","locale":"en_GD","currency":"XCD"},{"code":"en-GG","country":"根西岛","language":"英语","locale":"en_GG","currency":"GBP"},{"code":"en-GI","country":"直布罗陀","language":"英语","locale":"en_GI","currency":"GIP"},{"code":"en-GM","country":"冈比亚","language":"英语","locale":"en_GM","currency":"GMD"},{"code":"en-GS","country":"南乔治亚和南桑威奇群岛","language":"英语","locale":"en_GS","currency":"GBP"},{"code":"en-GU","country":"关岛","language":"英语","locale":"en_GU","currency":"USD"},{"code":"en-GY","country":"圭亚那","language":"英语","locale":"en_GY","currency":"GYD"},{"code":"en-IE","country":"爱尔兰","language":"英语","locale":"en_IE","currency":"EUR"},{"code":"en-IM","country":"马恩岛","language":"英语","locale":"en_IM","currency":"GBP"},{"code":"en-IO","country":"英属印度洋领地","language":"英语","locale":"en_IO","currency":"USD"},{"code":"en-JE","country":"泽西岛","language":"英语","locale":"en_JE","currency":"GBP"},{"code":"en-JM","country":"牙买加","language":"英语","locale":"en_JM","currency":"JMD"},{"code":"en-KI","country":"基里巴斯","language":"英语","locale":"en_KI","currency":"AUD"},{"code":"en-KN","country":"圣基茨和尼维斯","language":"英语","locale":"en_KN","currency":"XCD"},{"code":"en-KY","country":"开曼群岛","language":"英语","locale":"en_KY","currency":"KYD"},{"code":"en-LC","country":"圣卢西亚","language":"英语","locale":"en_LC","currency":"XCD"},{"code":"en-LR","country":"利比里亚","language":"英语","locale":"en_LR","currency":"LRD"},{"code":"en-MH","country":"马绍尔群岛","language":"英语","locale":"en_MH","currency":"USD"},{"code":"en-MP","country":"北马里亚纳群岛","language":"英语","locale":"en_MP","currency":"USD"},{"code":"en-MS","country":"蒙特塞拉特","language":"英语","locale":"en_MS","currency":"XCD"},{"code":"en-MW","country":"马拉维","language":"英语","locale":"en_MW","currency":"MWK"},{"code":"en-NF","country":"诺福克岛","language":"英语","locale":"en_NF","currency":"AUD"},{"code":"en-NG","country":"尼日利亚","language":"英语","locale":"en_NG","currency":"NGN"},{"code":"en-NR","country":"瑙鲁","language":"英语","locale":"en_NR","currency":"AUD"},{"code":"en-NU","country":"纽埃","language":"英语","locale":"en_NU","currency":"NZD"},{"code":"en-NZ","country":"新西兰","language":"英语","locale":"en_NZ","currency":"NZD"},{"code":"en-PH","country":"菲律宾","language":"英语","locale":"en_PH","currency":"PHP"},{"code":"en-PN","country":"皮特凯恩群岛","language":"英语","locale":"en_PN","currency":"NZD"},{"code":"en-SB","country":"所罗门群岛","language":"英语","locale":"en_SB","currency":"SBD"},{"code":"en-SG","country":"新加坡","language":"英语","locale":"en_SG","currency":"SGD"},{"code":"en-SH","country":"圣赫勒拿","language":"英语","locale":"en_SH","currency":"SHP"},{"code":"en-SX","country":"荷属圣马丁","language":"英语","locale":"en_SX","currency":"ANG"},{"code":"en-SZ","country":"斯威士兰","language":"英语","locale":"en_SZ","currency":"SZL"},{"code":"en-TA","country":"特里斯坦-达库尼亚群岛","language":"英语","locale":"en_TA","currency":"GBP"},{"code":"en-TC","country":"特克斯和凯科斯群岛","language":"英语","locale":"en_TC","currency":"—"},{"code":"en-TT","country":"特立尼达和多巴哥","language":"英语","locale":"en_TT","currency":"—"},{"code":"en-UM","country":"美国本土外小岛屿","language":"英语","locale":"en_UM","currency":"—"},{"code":"en-US","country":"美国","language":"英语","locale":"en_US","currency":"USD"},{"code":"en-VC","country":"圣文森特和格林纳丁斯","language":"英语","locale":"en_VC","currency":"XCD"},{"code":"en-VG","country":"英属维尔京群岛","language":"英语","locale":"en_VG","currency":"USD"},{"code":"en-VI","country":"美属维尔京群岛","language":"英语","locale":"en_VI","currency":"USD"},{"code":"en-ZA","country":"南非","language":"英语","locale":"en_ZA","currency":"ZAR"},{"code":"es-AR","country":"阿根廷","language":"西班牙语","locale":"es_AR","currency":"ARS"},{"code":"es-BO","country":"玻利维亚","language":"西班牙语","locale":"es_BO","currency":"BOB"},{"code":"es-CL","country":"智利","language":"西班牙语","locale":"es_CL","currency":"CLP"},{"code":"es-CO","country":"哥伦比亚","language":"西班牙语","locale":"es_CO","currency":"COP"},{"code":"es-CR","country":"哥斯达黎加","language":"西班牙语","locale":"es_CR","currency":"CRC"},{"code":"es-CU","country":"古巴","language":"西班牙语","locale":"es_CU","currency":"CUP"},{"code":"es-DO","country":"多米尼加共和国","language":"西班牙语","locale":"es_DO","currency":"DOP"},{"code":"es-EC","country":"厄瓜多尔","language":"西班牙语","locale":"es_EC","currency":"ECS"},{"code":"es-ES","country":"西班牙","language":"西班牙语","locale":"es_ES","currency":"EUR"},{"code":"es-GQ","country":"赤道几内亚","language":"西班牙语","locale":"es_GQ","currency":"XAF"},{"code":"es-GT","country":"危地马拉","language":"西班牙语","locale":"es_GT","currency":"QTQ"},{"code":"es-HN","country":"洪都拉斯","language":"西班牙语","locale":"es_HN","currency":"HNL"},{"code":"es-MX","country":"墨西哥","language":"西班牙语","locale":"es_MX","currency":"MXN"},{"code":"es-NI","country":"尼加拉瓜","language":"西班牙语","locale":"es_NI","currency":"NIO"},{"code":"es-PA","country":"巴拿马","language":"西班牙语","locale":"es_PA","currency":"PAB"},{"code":"es-PE","country":"秘鲁","language":"西班牙语","locale":"es_PE","currency":"PEN"},{"code":"es-PR","country":"波多黎各","language":"西班牙语","locale":"es_PR","currency":"USD"},{"code":"es-SV","country":"萨尔瓦多","language":"西班牙语","locale":"es_SV","currency":"SVC"},{"code":"es-UY","country":"乌拉圭","language":"西班牙语","locale":"es_UY","currency":"UYU"},{"code":"es-VE","country":"委内瑞拉","language":"西班牙语","locale":"es_VE","currency":"VES"},{"code":"et-EE","country":"爱沙尼亚","language":"爱沙尼亚语","locale":"et_EE","currency":"EUR"},{"code":"fa-AF","country":"阿富汗","language":"波斯语","locale":"fa_AF","currency":"AFN"},{"code":"fa-IR","country":"伊朗","language":"波斯语","locale":"fa_IR","currency":"IRR"},{"code":"fi-FI","country":"芬兰","language":"芬兰语","locale":"fi_FI","currency":"EUR"},{"code":"fo-FO","country":"法罗群岛","language":"法罗语","locale":"fo_FO","currency":"DKK"},{"code":"fr-BJ","country":"贝宁","language":"法语","locale":"fr_BJ","currency":"XOF"},{"code":"fr-BL","country":"圣巴泰勒米","language":"法语","locale":"fr_BL","currency":"EUR"},{"code":"fr-CD","country":"刚果（金）","language":"法语","locale":"fr_CD","currency":"CDF"},{"code":"fr-CG","country":"刚果（布）","language":"法语","locale":"fr_CG","currency":"XAF"},{"code":"fr-CI","country":"科特迪瓦","language":"法语","locale":"fr_CI","currency":"XOF"},{"code":"fr-CM","country":"喀麦隆","language":"法语","locale":"fr_CM","currency":"XAF"},{"code":"fr-DJ","country":"吉布提","language":"法语","locale":"fr_DJ","currency":"DJF"},{"code":"fr-FR","country":"法国","language":"法语","locale":"fr_FR","currency":"EUR"},{"code":"fr-GA","country":"加蓬","language":"法语","locale":"fr_GA","currency":"XAF"},{"code":"fr-GF","country":"法属圭亚那","language":"法语","locale":"fr_GF","currency":"EUR"},{"code":"fr-GN","country":"几内亚","language":"法语","locale":"fr_GN","currency":"GNF"},{"code":"fr-GP","country":"瓜德罗普","language":"法语","locale":"fr_GP","currency":"EUR"},{"code":"fr-LU","country":"卢森堡","language":"法语","locale":"fr_LU","currency":"EUR"},{"code":"fr-MC","country":"摩纳哥","language":"法语","locale":"fr_MC","currency":"EUR"},{"code":"fr-MF","country":"法属圣马丁","language":"法语","locale":"fr_MF","currency":"EUR"},{"code":"fr-MQ","country":"马提尼克","language":"法语","locale":"fr_MQ","currency":"EUR"},{"code":"fr-NC","country":"新喀里多尼亚","language":"法语","locale":"fr_NC","currency":"XPF"},{"code":"fr-PF","country":"法属波利尼西亚","language":"法语","locale":"fr_PF","currency":"XPF"},{"code":"fr-PM","country":"圣皮埃尔和密克隆群岛","language":"法语","locale":"fr_PM","currency":"EUR"},{"code":"fr-RE","country":"留尼汪","language":"法语","locale":"fr_RE","currency":"EUR"},{"code":"fr-TF","country":"法属南部领地","language":"法语","locale":"fr_TF","currency":"EUR"},{"code":"fr-TG","country":"多哥","language":"法语","locale":"fr_TG","currency":"XOF"},{"code":"fr-WF","country":"瓦利斯和富图纳","language":"法语","locale":"fr_WF","currency":"XPF"},{"code":"gn-PY","country":"巴拉圭","language":"瓜拉尼语","locale":"gn_PY","currency":"PYG"},{"code":"ha-NE","country":"尼日尔","language":"豪萨语","locale":"ha_NE","currency":"XOF"},{"code":"he-IL","country":"以色列","language":"希伯来语","locale":"he_IL","currency":"ILS"},{"code":"hi-IN","country":"印度","language":"印地语","locale":"hi_IN","currency":"INR"},{"code":"hr-HR","country":"克罗地亚","language":"克罗地亚语","locale":"hr_HR","currency":"EUR"},{"code":"ht-HT","country":"海地","language":"海地克里奥尔语","locale":"ht_HT","currency":"HTG"},{"code":"hu-HU","country":"匈牙利","language":"匈牙利语","locale":"hu_HU","currency":"HUF"},{"code":"hy-AM","country":"亚美尼亚","language":"亚美尼亚语","locale":"hy_AM","currency":"AMD"},{"code":"id-ID","country":"印度尼西亚","language":"印度尼西亚语","locale":"id_ID","currency":"IDR"},{"code":"is-IS","country":"冰岛","language":"冰岛语","locale":"is_IS","currency":"ISK"},{"code":"it-IT","country":"意大利","language":"意大利语","locale":"it_IT","currency":"EUR"},{"code":"it-SM","country":"圣马力诺","language":"意大利语","locale":"it_SM","currency":"EUR"},{"code":"it-VA","country":"梵蒂冈","language":"意大利语","locale":"it_VA","currency":"EUR"},{"code":"ja-JP","country":"日本","language":"日语","locale":"ja_JP","currency":"JPY"},{"code":"ka-GE","country":"格鲁吉亚","language":"格鲁吉亚语","locale":"ka_GE","currency":"GEL"},{"code":"kea-CV","country":"佛得角","language":"佛得角克里奥尔语","locale":"kea_CV","currency":"CVE"},{"code":"kl-GL","country":"格陵兰","language":"格陵兰语","locale":"kl_GL","currency":"DKK"},{"code":"km-KH","country":"柬埔寨","language":"高棉语","locale":"km_KH","currency":"KHR"},{"code":"ko-KP","country":"朝鲜","language":"韩语","locale":"ko_KP","currency":"KPW"},{"code":"ko-KR","country":"韩国","language":"韩语","locale":"ko_KR","currency":"KRW"},{"code":"kri-SL","country":"塞拉利昂","language":"克里奥语","locale":"kri_SL","currency":"SLL"},{"code":"ky-KG","country":"吉尔吉斯斯坦","language":"柯尔克孜语","locale":"ky_KG","currency":"KGS"},{"code":"lo-LA","country":"老挝","language":"老挝语","locale":"lo_LA","currency":"LAK"},{"code":"lt-LT","country":"立陶宛","language":"立陶宛语","locale":"lt_LT","currency":"EUR"},{"code":"lv-LV","country":"拉脱维亚","language":"拉脱维亚语","locale":"lv_LV","currency":"EUR"},{"code":"mfe-MU","country":"毛里求斯","language":"毛里求斯克里奥尔语","locale":"mfe_MU","currency":"MUR"},{"code":"mg-MG","country":"马达加斯加","language":"马拉加斯语","locale":"mg_MG","currency":"MGF"},{"code":"mk-MK","country":"北马其顿","language":"马其顿语","locale":"mk_MK","currency":"MKD"},{"code":"mn-MN","country":"蒙古","language":"蒙古语","locale":"mn_MN","currency":"MNT"},{"code":"mos-BF","country":"布基纳法索","language":"莫西语","locale":"mos_BF","currency":"XOF"},{"code":"ms-BN","country":"文莱","language":"马来语","locale":"ms_BN","currency":"BND"},{"code":"ms-MY","country":"马来西亚","language":"马来语","locale":"ms_MY","currency":"MYR"},{"code":"ms_Arab-CC","country":"科科斯（基林）群岛","language":"马来语（爪夷文）","locale":"ms_Arab_CC","currency":"AUD"},{"code":"mt-MT","country":"马耳他","language":"马耳他语","locale":"mt_MT","currency":"EUR"},{"code":"my-MM","country":"缅甸","language":"缅甸语","locale":"my_MM","currency":"MMK"},{"code":"nb-NO","country":"挪威","language":"书面挪威语","locale":"nb_NO","currency":"NOK"},{"code":"nb-SJ","country":"斯瓦尔巴和扬马延","language":"书面挪威语","locale":"nb_SJ","currency":"NOK"},{"code":"ne-NP","country":"尼泊尔","language":"尼泊尔语","locale":"ne_NP","currency":"NPR"},{"code":"nl-AW","country":"阿鲁巴","language":"荷兰语","locale":"nl_AW","currency":"AWG"},{"code":"nl-NL","country":"荷兰","language":"荷兰语","locale":"nl_NL","currency":"EUR"},{"code":"nl-SR","country":"苏里南","language":"荷兰语","locale":"nl_SR","currency":"SRD"},{"code":"no-BV","country":"布韦岛","language":"挪威语","locale":"no_BV","currency":"NOK"},{"code":"pap-BQ","country":"荷属加勒比区","language":"帕皮阿门托语","locale":"pap_BQ","currency":"USD"},{"code":"pap-CW","country":"库拉索","language":"帕皮阿门托语","locale":"pap_CW","currency":"ANG"},{"code":"pau-PW","country":"帕劳","language":"帕劳语","locale":"pau_PW","currency":"USD"},{"code":"pl-PL","country":"波兰","language":"波兰语","locale":"pl_PL","currency":"PLN"},{"code":"pt-AO","country":"安哥拉","language":"葡萄牙语","locale":"pt_AO","currency":"AOA"},{"code":"pt-BR","country":"巴西","language":"葡萄牙语","locale":"pt_BR","currency":"BRL"},{"code":"pt-GW","country":"几内亚比绍","language":"葡萄牙语","locale":"pt_GW","currency":"CFA"},{"code":"pt-MZ","country":"莫桑比克","language":"葡萄牙语","locale":"pt_MZ","currency":"MZN"},{"code":"pt-PT","country":"葡萄牙","language":"葡萄牙语","locale":"pt_PT","currency":"EUR"},{"code":"pt-ST","country":"圣多美和普林西比","language":"葡萄牙语","locale":"pt_ST","currency":"—"},{"code":"pt-TL","country":"东帝汶","language":"葡萄牙语","locale":"pt_TL","currency":"USD"},{"code":"rn-BI","country":"布隆迪","language":"隆迪语","locale":"rn_BI","currency":"BIF"},{"code":"ro-MD","country":"摩尔多瓦","language":"罗马尼亚语","locale":"ro_MD","currency":"MDL"},{"code":"ro-RO","country":"罗马尼亚","language":"罗马尼亚语","locale":"ro_RO","currency":"RON"},{"code":"ru-KZ","country":"哈萨克斯坦","language":"俄语","locale":"ru_KZ","currency":"KZT"},{"code":"ru-RU","country":"俄罗斯","language":"俄语","locale":"ru_RU","currency":"RUB"},{"code":"rw-RW","country":"卢旺达","language":"卢旺达语","locale":"rw_RW","currency":"RWF"},{"code":"sg-CF","country":"中非共和国","language":"桑戈语","locale":"sg_CF","currency":"XAF"},{"code":"si-LK","country":"斯里兰卡","language":"僧伽罗语","locale":"si_LK","currency":"LKR"},{"code":"sk-SK","country":"斯洛伐克","language":"斯洛伐克语","locale":"sk_SK","currency":"EUR"},{"code":"sl-SI","country":"斯洛文尼亚","language":"斯洛文尼亚语","locale":"sl_SI","currency":"EUR"},{"code":"sm-AS","country":"美属萨摩亚","language":"萨摩亚语","locale":"sm_AS","currency":"USD"},{"code":"sm-WS","country":"萨摩亚","language":"萨摩亚语","locale":"sm_WS","currency":"WST"},{"code":"sn-ZW","country":"津巴布韦","language":"绍纳语","locale":"sn_ZW","currency":"ZWD"},{"code":"so-SO","country":"索马里","language":"索马里语","locale":"so_SO","currency":"SOS"},{"code":"sq-AL","country":"阿尔巴尼亚","language":"阿尔巴尼亚语","locale":"sq_AL","currency":"ALL"},{"code":"sq-XK","country":"科索沃","language":"阿尔巴尼亚语","locale":"sq_XK","currency":"EUR"},{"code":"sr-RS","country":"塞尔维亚","language":"塞尔维亚语","locale":"sr_RS","currency":"RSD"},{"code":"sr_Latn-ME","country":"黑山","language":"塞尔维亚语（拉丁字母）","locale":"sr_Latn_ME","currency":"—"},{"code":"st-LS","country":"莱索托","language":"南索托语","locale":"st_LS","currency":"LSL"},{"code":"sv-AX","country":"奥兰群岛","language":"瑞典语","locale":"sv_AX","currency":"EUR"},{"code":"sv-SE","country":"瑞典","language":"瑞典语","locale":"sv_SE","currency":"SEK"},{"code":"sw-KE","country":"肯尼亚","language":"斯瓦希里语","locale":"sw_KE","currency":"KES"},{"code":"sw-TZ","country":"坦桑尼亚","language":"斯瓦希里语","locale":"sw_TZ","currency":"TZS"},{"code":"sw-UG","country":"乌干达","language":"斯瓦希里语","locale":"sw_UG","currency":"UGX"},{"code":"swb-YT","country":"马约特","language":"科摩罗语","locale":"swb_YT","currency":"EUR"},{"code":"tg-TJ","country":"塔吉克斯坦","language":"塔吉克语","locale":"tg_TJ","currency":"TJS"},{"code":"th-TH","country":"泰国","language":"泰语","locale":"th_TH","currency":"THB"},{"code":"ti-ER","country":"厄立特里亚","language":"提格利尼亚语","locale":"ti_ER","currency":"ERN"},{"code":"tk-TM","country":"土库曼斯坦","language":"土库曼语","locale":"tk_TM","currency":"TMT"},{"code":"tkl-TK","country":"托克劳","language":"托克劳语","locale":"tkl_TK","currency":"NZD"},{"code":"to-TO","country":"汤加","language":"汤加语","locale":"to_TO","currency":"TOP"},{"code":"tpi-PG","country":"巴布亚新几内亚","language":"托克皮辛语","locale":"tpi_PG","currency":"PGK"},{"code":"tr-TR","country":"土耳其","language":"土耳其语","locale":"tr_TR","currency":"TRY"},{"code":"tvl-TV","country":"图瓦卢","language":"图瓦卢语","locale":"tvl_TV","currency":"AUD"},{"code":"uk-UA","country":"乌克兰","language":"乌克兰语","locale":"uk_UA","currency":"UAH"},{"code":"ur-PK","country":"巴基斯坦","language":"乌尔都语","locale":"ur_PK","currency":"PKR"},{"code":"uz-UZ","country":"乌兹别克斯坦","language":"乌兹别克语","locale":"uz_UZ","currency":"UZS"},{"code":"vi-VN","country":"越南","language":"越南语","locale":"vi_VN","currency":"VND"},{"code":"wo-SN","country":"塞内加尔","language":"沃洛夫语","locale":"wo_SN","currency":"XOF"},{"code":"zh-CN","country":"中国","language":"中文","locale":"zh_CN","currency":"CNY"},{"code":"zh_Hant-HK","country":"中国香港特别行政区","language":"繁体中文","locale":"zh_Hant_HK","currency":"HKD"},{"code":"zh_Hant-MO","country":"中国澳门特别行政区","language":"繁体中文","locale":"zh_Hant_MO","currency":"MOP"},{"code":"zh_Hant-TW","country":"中国台湾","language":"繁体中文","locale":"zh_Hant_TW","currency":"TWD"}];
    const EMBEDDED_REGISTERS = [
      { id: 'business-casual', label: '口语化商务' },
      { id: 'business-formal', label: '正式商务' },
      { id: 'daily', label: '日常口语' },
      { id: 'support', label: '客服友好' }
    ];
    const QUICK = ['en-US', 'ja-JP', 'es-MX', 'pt-BR', 'de-DE', 'fr-FR'];

    // 切标签会卸载面板，状态放模块级，回来还在
    const STORE = { code: 'en-US', register: 'business-casual', input: '', result: null, error: '', busy: false, startedAt: 0 };

    function readTabVisible() {
      try { return window.localStorage.getItem(TAB_VISIBLE_KEY) !== 'false'; } catch (e) { return true; }
    }
    function writeTabVisible(v) {
      try { window.localStorage.setItem(TAB_VISIBLE_KEY, v ? 'true' : 'false'); } catch (e) { /* 忽略 */ }
      try {
        window.fetch('api/translate/visibility', {
          method: 'POST', credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ showTab: v })
        }).catch(() => {});
      } catch (e) { /* 忽略 */ }
    }

    const INK = '#16181d', MUTED = '#6b7280', LINE = '#e6e8ee', SOFT = '#f6f7fa', BRAND = '#2563eb';

    const S = {
      wrap: { padding: '22px 26px 30px', maxWidth: '1080px', margin: '0 auto' },
      h1: { fontSize: '17px', fontWeight: 700, color: INK, marginBottom: '4px' },
      sub: { fontSize: '13px', color: MUTED, marginBottom: '16px' },
      row: { display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '12px' },
      field: { display: 'flex', flexDirection: 'column', gap: '5px' },
      label: { fontSize: '12px', color: MUTED },
      select: { padding: '8px 10px', borderRadius: '9px', border: `1px solid ${LINE}`, background: '#fff', color: INK, fontSize: '14px', minWidth: '180px' },
      ta: { width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '11px', border: `1px solid ${LINE}`, fontSize: '15px', lineHeight: 1.7, color: INK, resize: 'vertical', outline: 'none', background: '#fff', boxSizing: 'border-box' },
      btn: { padding: '9px 18px', borderRadius: '9px', border: 'none', background: BRAND, color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
      ghost: { padding: '8px 14px', borderRadius: '9px', border: `1px solid ${LINE}`, background: '#fff', color: INK, fontSize: '13px', cursor: 'pointer' },
      card: { border: `1px solid ${LINE}`, borderRadius: '12px', padding: '14px 16px', background: '#fff', marginTop: '14px' },
      search: { padding: '8px 10px', borderRadius: '9px', border: `1px solid ${LINE}`, fontSize: '13px', color: INK, width: '150px' },
      fx: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', rowGap: '10px', border: `1px solid ${LINE}`, background: '#f8fafc', borderRadius: '12px', padding: '14px 16px', margin: '4px 0 14px', fontSize: '14px', color: INK },
      fxSel: { padding: '5px 8px', borderRadius: '7px', border: `1px solid ${LINE}`, fontSize: '12px', color: INK, maxWidth: '190px' },
      fxInput: { width: '96px', padding: '8px 10px', borderRadius: '9px', border: `1px solid ${LINE}`, fontSize: '15px', color: INK, textAlign: 'right' },
      chip: { padding: '4px 11px', borderRadius: '999px', border: `1px solid ${LINE}`, background: '#fff', color: MUTED, fontSize: '12px', cursor: 'pointer' },
      out: { fontSize: '15px', lineHeight: 1.85, color: INK, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
      meta: { display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px', color: MUTED, marginBottom: '8px', flexWrap: 'wrap' }
    };

    async function postJSON(url, body) {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({ ok: false, error: 'HTTP ' + r.status }));
      if (!j.ok) throw new Error(j.error || '请求失败');
      return j;
    }

    function copyToClipboard(text) {
      if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      return Promise.resolve();
    }

    function CopyBtn({ text }) {
      const t = useT();
      const [done, setDone] = useState(false);
      return h('button', {
        style: { ...S.ghost, padding: '5px 11px', fontSize: '12px', color: done ? '#0b7a45' : INK },
        onClick: async () => { await copyToClipboard(text); setDone(true); setTimeout(() => setDone(false), 1200); }
      }, done ? '✓ ' + t('copied') : '⧉ ' + t('copy'));
    }

    const PK_STYLE = {
      box: { position: 'relative', width: '100%' },
      input: { width: '100%', padding: '8px 30px 8px 10px', borderRadius: '9px', border: `1px solid ${LINE}`, fontSize: '13px', color: INK, background: '#fff', boxSizing: 'border-box' },
      caret: { position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', color: MUTED, fontSize: '11px', pointerEvents: 'none' },
      pop: { position: 'absolute', zIndex: 30, left: 0, top: 'calc(100% + 6px)', minWidth: '330px', maxWidth: '430px', height: 'auto', maxHeight: '320px', overflowY: 'auto', overflowX: 'hidden', background: '#fff', border: `1px solid ${LINE}`, borderRadius: '12px', boxShadow: '0 12px 28px rgba(16,24,40,.14)' },
      item: { padding: '9px 12px', fontSize: '13.5px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: '12px', whiteSpace: 'nowrap' },
      name: { overflow: 'hidden', textOverflow: 'ellipsis' },
      meta: { color: MUTED, fontSize: '12.5px', flex: '0 0 auto' },
      none: { padding: '10px', fontSize: '12px', color: MUTED }
    };

    function CountryPicker({ value, items, onChange, placeholder, compact, align }) {
      const [open, setOpen] = useState(false);
      const [kw, setKw] = useState('');
      const [hi, setHi] = useState(0);
      const boxRef = useRef(null);
      const cur = items.find((x) => x.code === value) || null;

      useEffect(() => {
        function onDoc(e) {
          if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
      }, []);

      const s2 = kw.trim().toLowerCase();
      const shown = (s2
        ? items.filter((c) => `${c.country} ${c.language} ${c.code} ${c.currency || ''}`.toLowerCase().includes(s2))
        : items).slice(0, 80);

      const label = cur ? `${cur.country} · ${cur.language}${cur.currency && cur.currency !== '—' ? ' · ' + cur.currency : ''}` : '';

      function pick(c) {
        onChange(c.code);
        setOpen(false);
        setKw('');
        setHi(0);
      }

      const popStyle = (align === 'right')
        ? { ...PK_STYLE.pop, left: 'auto', right: 0 }
        : PK_STYLE.pop;
      return h('div', { style: PK_STYLE.box, ref: boxRef },
        h('input', {
          style: compact ? { ...PK_STYLE.input, padding: '8px 26px 8px 10px', fontSize: '13px' } : PK_STYLE.input,
          value: open ? kw : label,
          placeholder: open ? placeholder : (label || placeholder),
          onFocus: () => { setOpen(true); setKw(''); },
          onChange: (e) => { setKw(e.target.value); setOpen(true); setHi(0); },
          onKeyDown: (e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setHi((i) => Math.min(i + 1, shown.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((i) => Math.max(i - 1, 0)); }
            else if (e.key === 'Enter') { e.preventDefault(); if (shown[hi]) pick(shown[hi]); else setOpen(false); }
            else if (e.key === 'Escape') { setOpen(false); }
          }
        }),
        h('span', { style: PK_STYLE.caret }, '▾'),
        open ? h('div', { style: popStyle },
          shown.length === 0
            ? h('div', { style: PK_STYLE.none }, '没有匹配的国家')
            : shown.map((c, i) => h('div', {
              key: c.code,
              style: { ...PK_STYLE.item, background: i === hi ? SOFT : '#fff' },
              onMouseEnter: () => setHi(i),
              onMouseDown: (e) => { e.preventDefault(); pick(c); }
            },
              h('span', { style: PK_STYLE.name }, `${c.country} · ${c.language}`),
              h('span', { style: PK_STYLE.meta }, c.currency && c.currency !== '—' ? c.currency : '')
            ))
        ) : null
      );
    }

    function fxClock(rates) {
      if (!rates) return '';
      const ts = rates.unix ? rates.unix * 1000 : Date.parse(rates.date || '');
      if (!ts || isNaN(ts)) return '';
      try {
        const d = new Date(ts);
        const p = (n) => String(n).padStart(2, '0');
        const s = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
        return `汇率更新：${s}（本机时间）`;
      } catch (e) { return ''; }
    }

    function Panel() {
      const t = useT();
      const [countries, setCountries] = useState(EMBEDDED_COUNTRIES);
      const [registers, setRegisters] = useState(EMBEDDED_REGISTERS);
      const [q, setQ] = useState('');
      const [code, setCode] = useState(STORE.code);
      const [register, setRegister] = useState(STORE.register);
      const [provider, setProvider] = useState(STORE.provider || 'deepseek');
      const [text, setText] = useState(STORE.input);
      const [result, setResult] = useState(STORE.result);
      const [error, setError] = useState(STORE.error);
      const [busy, setBusy] = useState(STORE.busy);
      const [elapsed, setElapsed] = useState(0);
      const [keyInput, setKeyInput] = useState('');
      const [keyBusy, setKeyBusy] = useState(false);
      const taRef = useRef(null);

      useEffect(() => {
        fetch(API.countries).then((r) => r.json()).then((j) => {
          if (j && j.ok) { setCountries(j.countries || []); setRegisters(j.registers || []); }
        }).catch(() => {});
      }, []);

      const [srcCode, setSrcCode] = useState(STORE.srcCode || 'zh-CN');
      const [fxCode, setFxCode] = useState(STORE.fxCode || STORE.code);
      const [rates, setRates] = useState(null);
      const [amount, setAmount] = useState('1');
      const [fxErr, setFxErr] = useState('');
      const [fxNonce, setFxNonce] = useState(0);
      const srcCur = (() => {
        const c = countries.find((x) => x.code === srcCode);
        return c && c.currency && c.currency !== '—' ? c.currency : '';
      })();

      useEffect(() => {
        if (!srcCur) return undefined;
        let alive = true;
        setRates(null); setFxErr('');
        fetch('api/translate/fx', {
          method: 'POST', credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ base: srcCur, fresh: fxNonce > 0 })
        }).then((r) => r.json()).then((j) => {
          if (!alive) return;
          if (j && j.ok) setRates(j); else setFxErr((j && j.error) || 'fx failed');
        }).catch((e) => { if (alive) setFxErr(String(e.message || e)); });
        return () => { alive = false; };
      }, [srcCur, fxNonce]);

      useEffect(() => {
        if (!busy) return;
        const t0 = STORE.startedAt || Date.now();
        const id = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 100) / 10), 200);
        return () => clearInterval(id);
      }, [busy]);

      const save = () => { STORE.code = code; STORE.register = register; STORE.input = text; };

      async function go() {
        if (!text.trim() || busy) return;
        save();
        STORE.busy = true; STORE.startedAt = Date.now(); STORE.error = '';
        setBusy(true); setError(''); setResult(null); setElapsed(0);
        try {
          const j = await postJSON(API.run, { text, code, register, provider, apiKey: STORE.apiKey || '' });
          STORE.result = j; setResult(j);
        } catch (e) {
          STORE.error = String(e.message || e); setError(STORE.error);
        } finally {
          STORE.busy = false; setBusy(false);
        }
      }

      function swap() {
        if (!result || !result.out) return;
        const next = result.out;
        const nextCode = code === 'zh-CN' ? 'en-US' : 'zh-CN';
        setCode(nextCode); STORE.code = nextCode;
        setText(next); saveLater(next);
        STORE.result = null; setResult(null);
        taRef.current && taRef.current.focus();
      }
      function saveLater(v) { STORE.input = v; }

      async function saveKeyNow() {
        const k = keyInput.trim();
        if (!k) return;
        setKeyBusy(true);
        try {
          const r = await fetch('api/translate/key', {
            method: 'POST', credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ key: k })
          });
          const j = await r.json();
          if (!j || !j.ok) { setError((j && j.error) || 'Key 验证失败'); return; }
          STORE.apiKey = k;
          setError('');
          setKeyInput('');
          await go();
        } catch (e) {
          setError(String(e.message || e));
        } finally {
          setKeyBusy(false);
        }
      }

      function clearAll() {
        setText(''); setResult(null); setError('');
        STORE.input = ''; STORE.result = null; STORE.error = '';
      }

      const current = countries.find((c) => c.code === code);
      const kw = q.trim().toLowerCase();
      let list = kw
        ? countries.filter((c) => `${c.country} ${c.language} ${c.code} ${c.currency || ''}`.toLowerCase().includes(kw))
        : countries;
      if (current && !list.some((c) => c.code === code)) list = [current, ...list];

      return h('div', { style: S.wrap },
        h('div', { style: S.h1 }, t('title')),
        h('div', { style: S.sub }, t('sub')),

        h('div', { style: S.row },
          h('div', { style: { ...S.field, flex: '1 1 340px', minWidth: '260px' } },
            h('span', { style: S.label }, t('target')),
            h(CountryPicker, {
              value: code, items: countries, placeholder: t('searchHint'),
              onChange: (v) => { setCode(v); STORE.code = v; }
            })
          ),
          h('div', { style: S.field },
            h('span', { style: S.label }, t('engine')),
            h('select', {
              style: S.select, value: provider,
              onChange: (e) => { setProvider(e.target.value); STORE.provider = e.target.value; }
            },
              h('option', { value: 'deepseek' }, t('engineDeepseek')),
              h('option', { value: 'google' }, t('engineGoogle'))
            )
          ),
          h('div', { style: { ...S.field, opacity: provider === 'google' ? 0.45 : 1 } },
            h('span', { style: S.label }, t('tone')),
            h('select', {
              style: S.select, value: register, disabled: provider === 'google',
              onChange: (e) => { setRegister(e.target.value); STORE.register = e.target.value; }
            }, (registers.length ? registers : [{ id: 'business-casual', label: '口语化商务' }]).map((r) => h('option', { key: r.id, value: r.id }, r.label)))
          ),
          h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' } },
            h('span', { style: { ...S.label, alignSelf: 'center' } }, t('quick')),
            QUICK.map((q) => {
              const c = countries.find((x) => x.code === q);
              return h('button', {
                key: q, style: { ...S.chip, borderColor: q === code ? BRAND : LINE, color: q === code ? BRAND : MUTED },
                onClick: () => { setCode(q); STORE.code = q; }
              }, c ? c.country : q);
            })
          )
        ),

        (() => {
          const withCur = countries.filter((c) => c.currency && c.currency !== '—');
          const fxTarget = countries.find((c) => c.code === fxCode) || null;
          const dstCur = fxTarget && fxTarget.currency !== '—' ? fxTarget.currency : '';
          const rate = rates && rates.rates && dstCur ? rates.rates[dstCur] : null;
          const amt = parseFloat(amount || '0');
          const conv = rate && isFinite(amt) ? amt * rate : null;
          const fmt = (v, cur) => {
            try {
              return new Intl.NumberFormat('zh-CN', {
                style: 'currency', currency: cur,
                currencyDisplay: 'narrowSymbol', maximumFractionDigits: 2
              }).format(v);
            } catch (e) { return `${v.toFixed(2)} ${cur}`; }
          };
          return h('div', { style: S.fx },
            h('span', { style: { fontWeight: 600 } }, t('fxTitle')),
            h('div', { style: { width: '196px' } },
              h(CountryPicker, {
                value: srcCode, compact: true, items: withCur, placeholder: '国家/货币',
                onChange: (v) => { setSrcCode(v); STORE.srcCode = v; }
              })
            ),
            h('input', {
              style: S.fxInput, value: amount, inputMode: 'decimal',
              onChange: (e) => setAmount(e.target.value)
            }),
            h('span', { style: { color: MUTED } }, srcCur || '—'),
            h('span', null, '→'),
            h('div', { style: { width: '206px' } },
              h(CountryPicker, {
                value: fxCode, compact: true, align: 'right', items: withCur, placeholder: '目标国家/货币',
                onChange: (v) => { setFxCode(v); STORE.fxCode = v; }
              })
            ),
            dstCur
              ? (rate
                ? h('b', { style: { fontSize: '18px', letterSpacing: '0.2px' } }, conv === null ? '—' : fmt(conv, dstCur))
                : h('span', { style: { color: MUTED } }, fxErr ? t('fxFail') : t('fxLoading')))
              : h('span', { style: { color: MUTED } }, t('fxNoCur')),
            rate ? h('span', { style: { color: MUTED, fontSize: '12.5px' } }, `1 ${srcCur} ≈ ${rate.toFixed(4)} ${dstCur}`) : null,
            h('span', { style: { color: MUTED, fontSize: '11px', marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px' } },
              h('span', null, fxClock(rates)),
              h('button', {
                style: { ...S.chip, padding: '2px 8px', fontSize: '11px' },
                onClick: () => { setRates(null); setFxNonce((n) => n + 1); }
              }, '↻ ' + t('refresh'))
            )
          );
        })(),

        provider === 'google'
          ? h('div', { style: { fontSize: '12px', color: MUTED, marginBottom: '-2px' } }, t('googleNote'))
          : null,

        h('textarea', {
          ref: taRef, style: S.ta, value: text,
          placeholder: t('placeholder'),
          onChange: (e) => { setText(e.target.value); STORE.input = e.target.value; },
          onKeyDown: (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') go(); }
        }),

        h('div', { style: { ...S.row, marginTop: '12px', justifyContent: 'space-between' } },
          h('div', { style: { display: 'flex', gap: '10px', alignItems: 'center' } },
            h('button', { style: { ...S.btn, opacity: busy || !text.trim() ? 0.6 : 1 }, onClick: go, disabled: busy || !text.trim() },
              busy ? `${t('busy')} ${elapsed}s` : t('go')),
            h('button', { style: S.ghost, onClick: clearAll }, t('clear'))
          ),
          h('span', { style: { fontSize: '12px', color: MUTED } },
            text ? `${text.length} ${t('chars')}` : '', current ? ` · ${current.country}` : '')
        ),

        error ? h('div', { style: { ...S.card, borderColor: '#f3c9c4', background: '#fef3f2', color: '#b42318', fontSize: '14px' } },
          h('div', null, h('b', null, t('err') + '：'), error),
          /Authentication Fails|api key|invalid/i.test(error)
            ? h('div', { style: { marginTop: '10px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' } },
              h('input', {
                style: { flex: '1 1 320px', padding: '7px 9px', borderRadius: '8px', border: '1px solid #f0b4ae', fontSize: '12px', color: INK },
                placeholder: t('keyHint'), value: keyInput,
                onChange: (e) => setKeyInput(e.target.value)
              }),
              h('button', {
                style: { ...S.btn, padding: '7px 14px', fontSize: '12px' },
                disabled: keyBusy || !keyInput.trim(),
                onClick: saveKeyNow
              }, keyBusy ? t('saving') : t('saveKey'))
            )
            : null
        ) : null,

        result ? h('div', { style: S.card },
          h('div', { style: S.meta },
            h('b', { style: { color: INK, fontSize: '13px' } }, t('result')),
            h('span', null, `${result.country} · ${result.language}`),
            h('span', null, `${result.register}`),
            h('span', null, `${result.ms} ${t('ms')}`),
            h('div', { style: { marginLeft: 'auto', display: 'flex', gap: '8px' } },
              h(CopyBtn, { text: result.out }),
              h('button', { style: { ...S.ghost, padding: '5px 11px', fontSize: '12px' }, onClick: swap }, '⇄ ' + t('swap'))
            )
          ),
          h('div', { style: S.out }, result.out)
        ) : null
      );
    }

    function SettingsPanel() {
      const t = useT();
      const [visible, setVisible] = useState(() => readTabVisible());
      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0', maxWidth: '560px' } },
        h('div', { style: { fontSize: '15px', fontWeight: 600, color: INK } }, t('settingsTitle')),
        h('label', { style: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: INK } },
          h('input', {
            type: 'checkbox', checked: visible,
            onChange: (e) => { const v = e.target.checked; setVisible(v); writeTabVisible(v); }
          }),
          h('span', null, t('settingsShowTab'))
        ),
        h('div', { style: { fontSize: '12px', color: MUTED, lineHeight: 1.7 } }, t('settingsHint'))
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh: ZH, en: EN }), 'translate: dictionaries');
        const bind = ctx.locale.bind ? ctx.locale.bind(NS) : null;
        if (bind) currentT = (k) => bind(k);
        try {
          ctx.slots.inject('settings.section', () => ctx.slots.register({
            name: 'settings.section',
            id: 'translate-tab',
            order: 350,
            label: () => (currentT('tab') || '翻译')
          }, SettingsPanel));
        } catch (error) {
          console.warn('[translate] settings registration failed:', error);
        }
        if (!readTabVisible()) return;
        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view',
          id: 'translate',
          order: 45,
          locale: NS,
          label: () => (currentT('tab') || '翻译')
        }, Panel));
      }
    };
  }
});
