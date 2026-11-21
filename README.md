# 按国家翻译 · dsh-plugin-translate

DSH 插件：选一个目标国家，把中文翻成**那个国家的人真正会说的话**（不是逐字直译）。附实时汇率换算、反向翻译自检。

## 能力

- **249 个国家 / 地区**：按国家而不是语言排序，覆盖 en-US / en-GB、es-MX / es-ES、pt-BR / pt-PT 这类同语言不同说法的场景
- **双引擎**：DeepSeek（按国家本地化，推荐）/ Google（逐句直译，需代理）
- **四档语气**：口语化商务 / 正式商务 / 日常口语 / 客服友好
- **实时汇率**：源国家 + 金额 → 目标国家，货币符号与更新时间
- **反向翻译**：把译文再翻回中文，自己检查有没有走样

## 安装

### 方式一：插件市场（推荐）

1. DSH → 插件 → 发现 → 添加索引源，粘贴：

```
https://hbycwzm001.github.io/dsh-plugin-translate/market/index.json
```

2. 搜索 `Translate` 或 `按国家翻译` → 安装
3. 刷新页面（Ctrl+R），顶栏出现「翻译」标签

### 方式二：git 直装

```bash
dsh plugin add git+https://github.com/hbycwzm001/dsh-plugin-translate.git
```

### 方式三：本地目录

下载仓库 → 插件 → 从本地目录安装 → 选仓库根目录。

## 依赖

| 项 | 必须? | 说明 |
|---|---|---|
| DSH Desktop ≥ 0.2.2-rc.1 | 必须 | 宿主 |
| DeepSeek API Key | 推荐 | 从 `~/.dsh/.credentials.yaml` 的 `DEEPSEEK_API_KEY` 读取，或面板里临时填 |
| 能翻墙的客户端 | 可选 | 只有用 Google 引擎时才需要 |

## 使用

1. 点顶栏「翻译」
2. 选目标国家（预设按钮或搜索）
3. 粘文字 → 点「翻译」（或 Ctrl+Enter）

## 配置项

| 键 | 默认 | 说明 |
|---|---|---|
| `provider` | `deepseek` | `deepseek` 或 `google` |
| `baseUrl` | `https://api.deepseek.com` | DeepSeek 兼容端点 |
| `model` | `deepseek-chat` | 模型名 |
| `apiKeyEnv` | `DEEPSEEK_API_KEY` | 从哪个名字取 key |
| `googleProxy` | `auto` | `auto` 表示自动探测出口链 |
| `googleApiKey` | 空 | 填了就走 Google 官方 v2 |
| `timeoutMs` | 60000 | 单次请求超时 |

## 文档

**先看这两份（发给别人就用它们）**

- [安装教程（HTML）](docs/安装教程.html) ｜ [安装教程长图](docs/安装教程-长图.png)
- [使用图谱（HTML）](docs/使用图谱.html) ｜ [使用教程长图](docs/使用教程-长图.png)

## 许可

MIT
