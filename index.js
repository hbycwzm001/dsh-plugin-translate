import { promises as fs, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { execFile } from 'node:child_process';
import path from 'node:path';
import z from '@deepseek-ai/schemastery';
import { defineTool } from '@deepseek-ai/dsh-tools';

export const name = 'dsh-plugin-translate';
export const inject = ['tools'];

export const Config = z.object({
  apiKeyEnv: z.string().default('DEEPSEEK_API_KEY')
    .description('从哪个环境变量（或 ~/.dsh/.credentials.yaml 的同名键）读 API Key'),
  baseUrl: z.string().default('https://api.deepseek.com')
    .description('OpenAI 兼容接口地址'),
  model: z.string().default('deepseek-chat')
    .description('模型名'),
  timeoutMs: z.number().default(60000)
    .description('单次翻译超时（毫秒）'),
  provider: z.union([z.const('deepseek'), z.const('google')]).default('deepseek')
    .description('翻译引擎：deepseek（按国家本地化，默认）或 google（谷歌翻译直译）'),
  googleProxy: z.string().default('auto')
    .description('调用谷歌翻译时走的代理（国内直连不通）'),
  googleApiKey: z.string().default('')
    .description('谷歌云 Translation API Key；留空则用免费网页接口'),
  apiKey: z.string().default('')
    .description('直接填 DeepSeek API Key（留空则依次读本插件 key 文件、~/.dsh/.credentials.yaml、环境变量）'),
  showTab: z.boolean().default(true)
    .description('是否在会话顶栏显示「翻译」标签；关掉后翻译能力仍在，只是入口隐藏')
});

const HERE = path.dirname(fileURLToPath(import.meta.url));
const COUNTRIES = JSON.parse(readFileSync(path.join(HERE, 'countries.json'), 'utf8'));

const REGISTERS = [
  ['business-casual', '口语化商务', '像当地人正常做生意那样说话，自然、不端着'],
  ['business-formal', '正式商务', '正式书面，但仍是当地商务惯用说法'],
  ['daily', '日常口语', '朋友之间聊天的口气，可以用当地的俚语'],
  ['support', '客服友好', '礼貌、客气、把对方当客户']
];

function systemPrompt(c, reg) {
  return [
    `你是${c.country}（${c.code}）的母语译者，读者是${c.country}本地人。`,
    `1) 用${c.language}，采用${c.country}本地的日常表达与行业惯用语，不要中国大陆式表达；`,
    `2) 语气：${reg[1]}（${reg[2]}）；`,
    '3) 数字、日期、时间按当地书写格式；货币与度量单位保留原始数值与原单位，不要自行换算汇率；',
    '4) 人名地名用当地通用写法；专有名词保留原文或当地通行译名；',
    '5) 不要逐字直译，不解释、不加注、不加引号、不加前缀；',
    '6) 只输出译文本身。'
  ].join('\n');
}

const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');

async function readKey(config, override) {
  if (override && String(override).trim()) return { key: String(override).trim(), source: 'request' };
  if (config && config.apiKey && String(config.apiKey).trim()) {
    return { key: String(config.apiKey).trim(), source: 'plugin-config' };
  }
  try {
    const rawSaved = await fs.readFile(KEY_FILE, 'utf8');
    let saved = '';
    try { saved = String((JSON.parse(rawSaved) || {}).key || ''); } catch { saved = rawSaved; }
    if (saved.trim()) return { key: saved.trim(), source: 'key-file' };
  } catch { /* 忽略 */ }
  const envName = (config && config.apiKeyEnv) || 'DEEPSEEK_API_KEY';
  try {
    const raw = await fs.readFile(path.join(DSH_HOME, '.credentials.yaml'), 'utf8');
    const m = raw.match(new RegExp(`^\\s*${envName}\\s*:\\s*(\\S+)`, 'm'));
    if (m && m[1].trim()) {
      let v = m[1].trim();
      if (v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) v = v.slice(1, -1);
      if (v) return { key: v, source: 'credentials' };
    }
  } catch { /* 忽略 */ }
  if (process.env[envName]) return { key: String(process.env[envName]).trim(), source: 'env' };
  return { key: '', source: 'none' };
}

async function probeKey(config, key) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 10000);
  try {
    const res = await fetch(`${config.baseUrl || 'https://api.deepseek.com'}/chat/completions`, {
      method: 'POST',
      signal: ctl.signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: config.model || 'deepseek-chat', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 })
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, detail: text.slice(0, 300) };
  } finally {
    clearTimeout(timer);
  }
}

const GOOGLE_EP = 'https://translate.googleapis.com/translate_a/single';
let G_PROXY_USED = '';

function curlJson(url, proxy, timeoutSec) {
  return new Promise((resolve, reject) => {
    const args = ['-sS', '-m', String(timeoutSec || 25), '--compressed'];
    if (proxy) args.push('-x', proxy);
    args.push(url);
    execFile('curl.exe', args, { maxBuffer: 8 * 1024 * 1024, windowsHide: true }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`调用失败：${(stderr || err.message || '').slice(0, 200)}`));
      try { resolve(JSON.parse(stdout)); } catch (e) { reject(new Error(`返回不是 JSON：${String(stdout).slice(0, 160)}`)); }
    });
  });
}

// 谷歌通道的出口：把用户所有可用出口排成链，逐个试，谁先通用谁
async function googleProxyChain(config) {
  const chain = [];
  const push = (v) => {
    const t = String(v || '').trim();
    if (t && t !== 'auto' && !chain.includes(t)) chain.push(t);
  };
  push(config.googleProxy);            // 手工指定优先
  push('http://127.0.0.1:7897');       // Clash Verge / mihomo
  push('http://127.0.0.1:10809');      // xray http
  push('http://127.0.0.1:7890');       // Clash 经典
  // 引擎里配的自建网关（带账号密码），让谷歌通道也能借它
  try {
    const raw = await fs.readFile(path.join(DSH_HOME, 'media-extract', 'extract-tool', 'config.json'), 'utf8');
    const conf = JSON.parse(raw);
    push(conf.youtube_proxy);
    push(conf.youtube_proxy_fallback);
  } catch { /* 没有引擎配置就跳过 */ }
  chain.push('');                       // 最后直连兜底
  return chain;
}

async function googleTranslate(config, text, target) {
  const lang = String(target || 'en').split('_')[0].split('-')[0].toLowerCase();
  const chain = await googleProxyChain(config);
  let proxy = (config.googleProxy && config.googleProxy !== 'auto') ? config.googleProxy.trim() : '';
  let url;
  if (config.googleApiKey && String(config.googleApiKey).trim()) {
    url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(String(config.googleApiKey).trim())}`
      + `&q=${encodeURIComponent(text)}&target=${lang}&format=text`;
    const j = await curlJson(url, proxy);
    const out = j && j.data && j.data.translations && j.data.translations[0] && j.data.translations[0].translatedText;
    if (!out) throw new Error('谷歌云翻译没有返回结果');
    return out;
  }
  url = `${GOOGLE_EP}?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
  const tried = [];
  for (const p of chain) {
    try {
      const j = await curlJson(url, p, 9);
      if (!Array.isArray(j) || !Array.isArray(j[0])) throw new Error('返回格式异常');
      const out = j[0].map((seg) => (Array.isArray(seg) ? seg[0] : '')).filter(Boolean).join('');
      if (!out) throw new Error('没有返回结果');
      if (p) G_PROXY_USED = p;
      return out;
    } catch (e) {
      tried.push(`${p || '直连'}：${String(e.message || e).slice(0, 60)}`);
    }
  }
  throw new Error(`谷歌翻译所有出口都不通（${tried.join(' | ')}）`);
}

async function translate(config, args) {
  const body = String((args && args.text) || '').trim();
  if (!body) throw new Error('请输入要翻译的内容');

  const want = String((args && (args.code || args.country)) || 'en-US');
  const country = COUNTRIES.find((c) => c.code === want || c.country === want || c.locale === want)
    || COUNTRIES.find((c) => c.code === 'en-US');
  if (!country) throw new Error(`找不到目标国家「${want}」，国家表里也没有默认的 en-US 条目`);
  const reg = REGISTERS.find((r) => r[0] === (args && args.register)) || REGISTERS[0];

  const provider = String((args && args.provider) || config.provider || 'deepseek');
  if (provider === 'google') {
    const t0g = Date.now();
    const outg = await googleTranslate(config, body, country.locale);
    return {
      ok: true,
      out: outg,
      text: outg,
      country: country.country,
      language: country.language,
      code: country.code,
      register: '—',
      provider: 'google',
      proxy: G_PROXY_USED || '直连',
      ms: Date.now() - t0g
    };
  }

  const got = await readKey(config, args && args.apiKey);
  const key = got.key;
  if (!key) {
    throw new Error('没找到 API Key：可在「翻译」面板粘贴，或写进 ~/.dsh/.credentials.yaml 的 DEEPSEEK_API_KEY。');
  }

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), config.timeoutMs || 60000);
  const t0 = Date.now();
  try {
    const base = String(config.baseUrl || 'https://api.deepseek.com').replace(/\/+$/, '');
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      signal: ctl.signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: config.model || 'deepseek-chat',
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt(country, reg) },
          { role: 'user', content: body }
        ]
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (data && data.error && data.error.message) || `HTTP ${res.status}`;
      throw new Error(`接口调用失败：${msg}`);
    }
    const out = (((data.choices || [])[0] || {}).message || {}).content;
    const text = String(out || '').trim();
    if (!text) throw new Error('模型没有返回译文');
    return {
      ok: true,
      out: text,
      code: country.code,
      country: country.country,
      language: country.language,
      provider: 'deepseek',
      register: reg[1],
      source: body,
      ms: Date.now() - t0
    };
  } finally {
    clearTimeout(timer);
  }
}

const STATE_FILE = path.join(DSH_HOME, 'dsh-plugin-translate.state.json');
const KEY_FILE = path.join(DSH_HOME, 'dsh-plugin-translate.key.json');

async function readState() {
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf8');
    const o = JSON.parse(raw);
    return (o && typeof o === 'object') ? o : {};
  } catch {
    return {};
  }
}

async function writeState(patch) {
  const cur = await readState();
  const next = { ...cur, ...patch };
  await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

async function showTabNow(config) {
  const st = await readState();
  if (typeof st.showTab === 'boolean') return st.showTab;
  return config.showTab !== false;
}

const FX_TTL = 30 * 60 * 1000;
const FX_CACHE = new Map();

async function fxRates(base, fresh) {
  const b = String(base || 'CNY').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'CNY';
  const hit = FX_CACHE.get(b);
  if (!fresh && hit && Date.now() - hit.at < FX_TTL) return hit.data;
  const res = await fetch(`https://open.er-api.com/v6/latest/${b}`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`汇率服务请求失败（HTTP ${res.status}）`);
  const j = await res.json().catch(() => null);
  if (!j || j.result !== 'success' || !j.rates) throw new Error('汇率服务返回异常');
  const data = {
    base: j.base_code || b,
    date: j.time_last_update_utc || '',
    unix: j.time_last_update_unix || 0,
    next: j.time_next_update_unix || 0,
    rates: j.rates
  };
  FX_CACHE.set(b, { at: Date.now(), data });
  return data;
}

export function apply(ctx, config) {
  config = config || {};

  ctx.inject(['tools'], (scope) => {
    scope.tools.register(defineTool({
      name: 'translate_to_country',
      description: '把一段中文（或任意语言）翻译成指定国家/地区真正会说的本地话，而不是书面直译。',
      parameters: {
        text: z.string().required().description('要翻译的原文'),
        country: z.string().required().description('目标国家，如 美国/墨西哥/日本/巴西，或 locale 如 en-US'),
        register: z.string().default('business-casual')
          .description('语气：business-casual / business-formal / daily / support')
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            out: { type: 'string' },
            text: { type: 'string' },
            code: { type: 'string' },
            country: { type: 'string' },
            language: { type: 'string' },
            provider: { type: 'string' },
            register: { type: 'string' },
            source: { type: 'string' },
            proxy: { type: 'string' },
            ms: { type: 'number' }
          },
          required: ['ok', 'out'],
          additionalProperties: false
        },
        render: (_a, v) => [{ type: 'text', text: v.out || '' }]
      },
      async execute(args) {
        return translate(config, args);
      }
    }));
  });

  ctx.inject(['connection'], (scope) => scope.effect(() => [
    scope.connection.fetch.register({
      path: '/api/translate/countries',
      methods: ['GET'],
      fetch: async () => new Response(JSON.stringify({
        ok: true,
        countries: COUNTRIES,
        registers: REGISTERS.map((r) => ({ id: r[0], label: r[1] }))
      }), { headers: { 'content-type': 'application/json; charset=utf-8' } })
    }),
    scope.connection.fetch.register({
      path: '/api/translate/status',
      methods: ['GET'],
      fetch: async () => new Response(JSON.stringify({
        ok: true,
        showTab: await showTabNow(config),
        model: config.model || 'deepseek-chat'
      }), { headers: { 'content-type': 'application/json; charset=utf-8' } })
    }),
    scope.connection.fetch.register({
      path: '/api/translate/fx',
      methods: ['POST'],
      requestBody: {
        type: 'object',
        properties: { base: { type: 'string' } },
        additionalProperties: true
      },
      fetch: async (request) => {
        let body = {};
        try { body = (await request.json()) || {}; } catch { body = {}; }
        try {
          const d = await fxRates(body.base, body.fresh === true);
          return new Response(JSON.stringify({ ok: true, ...d }),
            { headers: { 'content-type': 'application/json; charset=utf-8' } });
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: String((err && err.message) || err) }),
            { headers: { 'content-type': 'application/json; charset=utf-8' } });
        }
      }
    }),
    scope.connection.fetch.register({
      path: '/api/translate/visibility',
      methods: ['POST'],
      requestBody: {
        type: 'object',
        properties: { showTab: { type: 'boolean' } },
        required: ['showTab'],
        additionalProperties: false
      },
      fetch: async (request) => {
        let body = {};
        try { body = (await request.json()) || {}; } catch { body = {}; }
        const st = await writeState({ showTab: body.showTab === true });
        return new Response(JSON.stringify({ ok: true, showTab: st.showTab === true }),
          { headers: { 'content-type': 'application/json; charset=utf-8' } });
      }
    }),
    scope.connection.fetch.register({
      path: '/api/translate/keyinfo',
      methods: ['POST'],
      requestBody: { type: 'object', properties: {}, additionalProperties: true },
      fetch: async () => {
        const got = await readKey(config);
        const tail = got.key ? got.key.slice(-4) : '';
        return new Response(JSON.stringify({ ok: true, source: got.source, tail }), {
          headers: { 'content-type': 'application/json; charset=utf-8' }
        });
      }
    }),

    scope.connection.fetch.register({
      path: '/api/translate/key',
      methods: ['POST'],
      requestBody: {
        type: 'object',
        properties: { key: { type: 'string' } },
        required: ['key'],
        additionalProperties: true
      },
      fetch: async (request) => {
        let body = {};
        try { body = (await request.json()) || {}; } catch { body = {}; }
        const k = String(body.key || '').trim();
        if (!k || k.length < 20) {
          return new Response(JSON.stringify({ ok: false, error: 'Key 看起来不对（长度不足）' }),
            { headers: { 'content-type': 'application/json; charset=utf-8' } });
        }
        let pr;
        try {
          pr = await probeKey(config, k);
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: `Key 验证请求失败：${String((err && err.message) || err)}` }),
            { headers: { 'content-type': 'application/json; charset=utf-8' } });
        }
        if (!pr.ok) {
          return new Response(JSON.stringify({ ok: false, error: `Key 验证失败（HTTP ${pr.status}）：${pr.detail}` }),
            { headers: { 'content-type': 'application/json; charset=utf-8' } });
        }
        try {
          await fs.mkdir(path.dirname(KEY_FILE), { recursive: true });
          await fs.writeFile(KEY_FILE, JSON.stringify({ key: k }, null, 2), { encoding: 'utf8', mode: 0o600 });
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: `Key 已验证，但保存失败：${String((err && err.message) || err)}` }),
            { headers: { 'content-type': 'application/json; charset=utf-8' } });
        }
        return new Response(JSON.stringify({ ok: true, tail: k.slice(-4) }), {
          headers: { 'content-type': 'application/json; charset=utf-8' }
        });
      }
    }),
    scope.connection.fetch.register({
      path: '/api/translate/run',
      methods: ['POST'],
      requestBody: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          code: { type: 'string' },
          register: { type: 'string' }
        },
        required: ['text'],
        additionalProperties: true
      },
      fetch: async (request) => {
        let body = {};
        try { body = (await request.json()) || {}; } catch { body = {}; }
        try {
          const out = await translate(config, body);
          return new Response(JSON.stringify(out), { headers: { 'content-type': 'application/json; charset=utf-8' } });
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: String((err && err.message) || err) }),
            { headers: { 'content-type': 'application/json; charset=utf-8' } });
        }
      }
    })
  ]));
}
