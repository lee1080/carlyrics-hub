# CarLyrics Hub 🎵 官方车载歌词源聚合中心

[![GitHub License](https://img.shields.io/badge/license-AGPLv3-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/lee1080/carlyrics-hub?style=flat-square)](https://github.com/lee1080/carlyrics-hub)
[![Sources Count](https://img.shields.io/badge/sources-7%20active-success?style=flat-square)](index.json)
[![jsDelivr CDN](https://img.shields.io/badge/jsdelivr-accelerated-brightgreen?style=flat-square)](https://cdn.jsdelivr.net/gh/lee1080/carlyrics-hub@main/sources/index.json)

**CarLyrics Hub** 是专为车载音乐歌词悬浮挂件应用 [CarLyricsApp](https://github.com/lee1080/CarLyricsApp) 打造的外置歌词源聚合中心、订阅分发中心与开发者生态平台。

遵循 **纯净空壳架构** 规范，客户端不内置任何商业音乐平台的私有接口代码。所有的歌词检索、毫秒级逐字对齐、YRC 动效解析与超清封面抓取均通过本仓库中的外置 JavaScript 插件驱动。

---

## 🚀 一键订阅与导入合集

在 **CarLyricsApp** 中依次点击：`设置` ➔ `歌词源管理` ➔ `导入歌词源合集`，直接复制并粘贴下方任意线路链接即可一键全选或批量勾选导入：

| 分发线路 | 合集订阅链接 (URL) | 推荐场景 |
| :--- | :--- | :--- |
| **🚀 jsDelivr CDN (推荐·极速)** | `https://cdn.jsdelivr.net/gh/lee1080/carlyrics-hub@main/sources/index.json` | 全球 CDN 边缘缓存，车机秒开免翻 |
| **🇨🇳 国内加速镜像 (ghproxy)** | `https://ghproxy.net/https://raw.githubusercontent.com/lee1080/carlyrics-hub/main/sources/index.json` | 国内高速反代，车载 4G 流量友好 |
| **⚡ GitHub Raw 原生直链** | `https://raw.githubusercontent.com/lee1080/carlyrics-hub/main/sources/index.json` | 官方代码仓直连，最新提交实时生效 |
| **🌐 Web 聚合门户 (在线浏览)** | `https://lee1080.github.io/carlyrics-hub/` | 可视化在线预览、试听动效、单源扫码导入 |

> 💡 **提示**：若网络环境特殊，也可在聚合网站点击「复制合集完整 JSON」，在 App 导入框中直接粘贴 JSON 文本，离线一秒解析！

---

## 🎵 收录精选歌词源列表 (7 大主力源)

| 歌词源名称 | 文件名 | 标识符 (`id`) | 版本 | 分类 | 特性亮点 | jsDelivr 直链 |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **汽水音乐** | `qishui.js` | `qishui_official` | **v1.2.0** | 逐字动效 | 抖音/汽水热歌双通道优化，酷我 500x500 + 酷狗 400x400 自动封面 | [直链](https://cdn.jsdelivr.net/gh/lee1080/carlyrics-hub@main/sources/qishui.js) |
| **酷狗音乐** | `kugou.js` | `kugou_official` | **v1.1.0** | 逐字动效 | 移动端正版曲库，哈希与时长双重校验，400x400 专辑封面 | [直链](https://cdn.jsdelivr.net/gh/lee1080/carlyrics-hub@main/sources/kugou.js) |
| **酷我音乐** | `kuwo.js` | `kuwo_official` | **v1.0.1** | 官方直连 | 极速响应 ~40ms，毫秒级时间轴对齐，超清专辑封面大图 | [直链](https://cdn.jsdelivr.net/gh/lee1080/carlyrics-hub@main/sources/kuwo.js) |
| **网易云音乐** | `netease.js` | `netease_official` | **v1.0.0** | 逐字动效 | 原生 YRC 逐字卡拉OK高亮动效，3000px 级超清封面 | [直链](https://cdn.jsdelivr.net/gh/lee1080/carlyrics-hub@main/sources/netease.js) |
| **QQ音乐** | `qqmusic.js` | `qqmusic_official` | **v1.0.1** | 官方直连 | 腾讯海量曲库，官方 Base64 解密，超清专辑封面 (300~600px) | [直链](https://cdn.jsdelivr.net/gh/lee1080/carlyrics-hub@main/sources/qqmusic.js) |
| **LRCLIB** | `lrclib.js` | `lrclib_public` | **v1.0.0** | 国际开源 | 全球最大公共歌词库，纯公开免费 API，欧美日韩流行 | [直链](https://cdn.jsdelivr.net/gh/lee1080/carlyrics-hub@main/sources/lrclib.js) |
| **GD Studio** | `gdstudio.js` | `gdstudio_proxy` | **v1.0.1** | 聚合备用 | 第三方聚合 API 备用源，多曲库冗余兜底 | [直链](https://cdn.jsdelivr.net/gh/lee1080/carlyrics-hub@main/sources/gdstudio.js) |

---

## 📖 歌词源开发规范

如果你想开发自己的专属歌词源或为社区贡献源，请参考官方开发规范文档：
👉 [**LYRICS_SOURCE_SPEC.md - 歌词源开发手册**](LYRICS_SOURCE_SPEC.md)

标准生命周期函数：
- `search(title, artist, duration)`：检索歌曲列表并返回候选结果
- `getLyrics(id)`：获取对应歌曲的 LRC / 逐字动效歌词与专辑封面 URL
- 支持注入沙箱内置对象：`http.get(url, headers)`、`crypto.base64Decode(str)`、`console.log/error(msg)`

---

## 📱 配套车机端应用

- **主项目仓库**：[CarLyricsApp (车载音乐歌词悬浮挂件)](https://github.com/lee1080/CarLyricsApp)
- **最新正式版下载**：[CarLyricsApp Releases](https://github.com/lee1080/CarLyricsApp/releases)

---

## ⚖️ 免责声明 (Disclaimer)

1. 本仓库中收录的所有 JavaScript 脚本及聚合索引文件均由开源社区开发者提供，仅供编程技术交流、车载交互设计与个人学习研究使用。
2. 本项目不提供、不存储任何受版权保护的音频或歌词二进制数据文件，所有网络请求均在用户本地车机端由公开网络直接发起。
3. 请在遵守当地知识产权法律法规的前提下使用。如果任何版权方认为本聚合索引侵害了您的合法权益，请通过 GitHub Issue 或邮箱 `lee1080@qq.com` 联系处理。
