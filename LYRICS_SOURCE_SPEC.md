# CarLyrics 歌词源开发手册 (Lyrics Source Specification)

## 1. 概述与核心理念

CarLyrics 是一款高性能的车载音乐歌词挂件与浮窗渲染容器。
从 **v2.0.0** 版本起，软件采用**纯净空壳架构**，客户端本身不内置任何商业版权音乐平台的私有接口或逆向解密代码。所有的歌词检索与封面获取能力均通过**外置 JavaScript 插件源**驱动。

用户与开发者可根据本手册，自行编写或借助 AI 生成歌词源，并通过**网络订阅合集链接**或**本地 `.js` 文件**导入 App 中使用。

---

## 2. 歌词源文件格式与元数据

每个歌词源是一个独立的 JavaScript 文件（`.js`），在文件头部通过 JSDoc 规范声明源元数据：

```javascript
/**
 * @name 酷我音乐
 * @id kuwo_official
 * @version 1.0.0
 * @author lee
 * @description 酷我音乐官方直连源，响应极速，支持毫秒级时间轴与高清封面。
 */
```

| 元数据标签 | 必填 | 说明 | 示例 |
| :--- | :---: | :--- | :--- |
| `@name` | 是 | 歌词源的中文/展示名称 | `@name 酷我音乐` |
| `@id` | 是 | 唯一英文标识符（不可重复） | `@id kuwo_official` |
| `@version` | 是 | 语义化版本号 | `@version 1.0.0` |
| `@author` | 否 | 开发者昵称或团队 | `@author Community` |
| `@description`| 否 | 源的简要特性说明 | `@description 官方极速直连` |

---

## 3. 标准生命周期函数

每个歌词源必须至少实现 `search` 和 `getLyrics` 函数；若支持媒体 ID 直连，可额外实现 `match` 函数。

### 3.1 `search(title, artist, duration)` 【必须】
搜索歌曲列表，并返回候选歌曲数组。

- **入参**：
  - `title`: `string` —— 歌曲标题（已做基本清洗）
  - `artist`: `string` —— 歌手名称
  - `duration`: `number` —— 歌曲总时长（单位：**秒**，无法识别时为 0）
- **返回值**：
  返回对象数组（或该数组的 `JSON.stringify` 字符串）：
  ```json
  [
    {
      "id": "12345678",        // 必填：用于后续传给 getLyrics 的唯一标识
      "title": "晴天",          // 必填：歌曲名
      "artist": "周杰伦",        // 选填：歌手名
      "duration": 269          // 选填：歌曲时长（秒），客户端将用于 ≤3秒 严格容差校验
    }
  ]
  ```

---

### 3.2 `getLyrics(id)` 【必须】
根据 `search` 返回的歌曲 `id` 获取歌词与封面。

- **入参**：
  - `id`: `string` —— 歌曲唯一标识符
- **返回值**：
  返回对象（或 JSON 字符串）：
  ```json
  {
    "lrc": "[00:15.20]故事的小黄花\n[00:18.50]从出生那年就飘着...",
    "cover": "https://example.com/cover.jpg"
  }
  ```
  - `lrc`: 标准 LRC 格式字符串（支持标准毫秒 `[mm:ss.xx]`、全局 `[offset:xxx]` 偏移、网易 YRC 逐字卡拉OK `[start,dur](start,dur)text` 以及增强 LRC `<start,dur>text`）。
  - `cover`: 专辑封面超清大图 URL（可选，无则传 `null`）。

---

### 3.3 `match(title, artist, duration, mediaId)` 【可选】
当音源应用上报了媒体唯一标识符（例如汽水音乐的 `mediaId`）时，系统会优先调用 `match` 尝试精准直查，跳过模糊搜索。

- **入参**：
  - `title`, `artist`, `duration`, `mediaId`
- **返回值**：
  命中返回 `{ lrc, cover }`；未命中返回 `null`。

---

## 4. 宿主注入 API (Sandbox Runtime)

在 JS 沙箱中，Android 宿主环境为脚本提供了以下同步全局对象：

### 4.1 网络请求：`http`
```javascript
// 发送 HTTP GET 请求
var resp = http.get(url, {
    "User-Agent": "Mozilla/5.0 ...",
    "Referer": "https://..."
});

// 发送 HTTP POST 请求
var resp = http.post(url, JSON.stringify({ key: "val" }), {
    "Content-Type": "application/json"
});
```

### 4.2 加密与编解码：`crypto`
```javascript
var md5Hash = crypto.md5("string_to_hash");
var base64 = crypto.base64Encode("utf8_text");
var original = crypto.base64Decode(base64);
```

### 4.3 调试日志：`console`
```javascript
console.log("调试信息: " + data);
console.error("异常报错: " + err);
```

### 4.4 时间格式转换工具：`formatTime`
```javascript
// 将秒数（浮点数）转为标准 LRC 时间格式 [mm:ss.xx]
var lrcTime = formatTime(15.25); // "00:15.25"
```

---

## 5. 合集索引规范 (`index.json`)

为了让用户通过一个链接或本地文件批量勾选导入，可以使用标准合集 JSON：

```json
{
  "name": "社区精选歌词源合集",
  "version": "2.0.0",
  "description": "包含酷我官方、汽水音乐、网易云等常用源",
  "author": "Community",
  "updatedAt": "2026-10-06T22:30:00Z",
  "sources": [
    {
      "id": "kuwo_official",
      "name": "酷我音乐",
      "version": "1.0.0",
      "author": "lee",
      "description": "酷我官方极速直连源",
      "script": "/* 完整的 JS 源码内容 */"
    }
  ]
}
```

---

## 6. 编写示例：极简源模版

```javascript
/**
 * @name 示例歌词源
 * @id demo_source
 * @version 1.0.0
 * @author DemoAuthor
 * @description 示例源模版
 */

function search(title, artist, duration) {
    var keyword = (title + " " + artist).trim();
    var url = "https://api.example.com/search?q=" + encodeURIComponent(keyword);
    var resp = http.get(url, { "User-Agent": "Mozilla/5.0" });
    if (!resp) return [];

    try {
        var data = JSON.parse(resp);
        return (data.songs || []).map(function(s) {
            return {
                id: String(s.song_id),
                title: s.name,
                artist: s.singer,
                duration: s.duration
            };
        });
    } catch (e) {
        return [];
    }
}

function getLyrics(id) {
    var url = "https://api.example.com/lyric?id=" + id;
    var resp = http.get(url, { "User-Agent": "Mozilla/5.0" });
    if (!resp) return null;

    try {
        var data = JSON.parse(resp);
        return {
            lrc: data.lrc,
            cover: data.cover_url
        };
    } catch (e) {
        return null;
    }
}
```
