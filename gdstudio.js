/**
 * @name GD Studio (聚合源)
 * @id gdstudio_proxy
 * @version 1.0.1
 * @author Community
 * @description 第三方聚合 API 备用源，覆盖网易聚合检索；支持常见中英文曲名/艺人别名补搜。
 */

// 车机常上报英文元数据，导致只搜英文时命中翻唱/纯音乐
var TITLE_ALIASES = {
    "the name engraved in your heart": "刻在我心底的名字",
    "the name engraved in my heart": "刻在我心底的名字",
    "your name engraved in my heart": "刻在我心底的名字"
};

var ARTIST_ALIASES = {
    "crowd lu": "卢广仲",
    "jay chou": "周杰伦",
    "jj lin": "林俊杰",
    "jada": "温岚"
};

function normalizeKey(s) {
    return String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function buildQueries(title, artist) {
    var t = String(title || "").trim();
    var a = String(artist || "").trim();
    var tAlias = TITLE_ALIASES[normalizeKey(t)] || "";
    var aAlias = ARTIST_ALIASES[normalizeKey(a)] || "";
    var list = [];
    function add(q) {
        q = String(q || "").trim();
        if (!q) return;
        for (var i = 0; i < list.length; i++) {
            if (list[i] === q) return;
        }
        list.push(q);
    }

    // 中文别名优先，避免英文元数据先命中翻唱/纯音乐
    if (tAlias && aAlias) add(tAlias + " " + aAlias);
    if (tAlias) add((tAlias + " " + (aAlias || a)).trim());
    if (tAlias) add(tAlias);
    if (aAlias) add((t + " " + aAlias).trim());
    add((t + " " + a).trim());
    add(t);
    return list;
}

function rankScore(item, title, artist) {
    var score = 0;
    var t = String(item.title || "");
    var a = String(item.artist || "");
    var tAlias = TITLE_ALIASES[normalizeKey(title)] || String(title || "");
    var aAlias = ARTIST_ALIASES[normalizeKey(artist)] || String(artist || "");
    if (t === tAlias || t.indexOf("刻在我心底的名字") === 0) score += 50;
    if (/[\u4e00-\u9fff]/.test(t)) score += 20;
    if (aAlias && a.indexOf(aAlias) >= 0) score += 30;
    if (/卢广仲/.test(a)) score += 20;
    if (/\(.*live.*\)/i.test(t) || /（.*live.*）/i.test(t)) score -= 10;
    return score;
}

function doSearch(keyword) {
    if (!keyword) return [];
    var url = "https://music-api.gdstudio.xyz/api.php?types=search&count=8&source=netease&name=" + encodeURIComponent(keyword);
    var resp = http.get(url, {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    });
    if (!resp) return [];

    try {
        var list = JSON.parse(resp);
        if (!Array.isArray(list)) return [];
        var results = [];
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var artistStr = Array.isArray(item.artist) ? item.artist.join(" / ") : (item.artist || "");
            var dur = item.duration || item.interval || item.length || 0;
            var id = item.lyric_id || item.id;
            if (!id) continue;
            results.push({
                id: id + "|" + (item.pic_id || ""),
                title: item.name || "",
                artist: artistStr,
                duration: parseInt(dur || 0)
            });
        }
        return results;
    } catch (e) {
        console.error("GD Studio 搜索解析异常: " + e);
        return [];
    }
}

function search(title, artist, duration) {
    var queries = buildQueries(title, artist);
    var seen = {};
    var results = [];

    for (var q = 0; q < queries.length; q++) {
        var batch = doSearch(queries[q]);
        for (var i = 0; i < batch.length; i++) {
            var item = batch[i];
            if (seen[item.id]) continue;
            seen[item.id] = true;
            results.push(item);
        }
        // 中文别名查询已命中则不再打后续英文查询
        if (results.length > 0 && q === 0 && TITLE_ALIASES[normalizeKey(title)]) break;
        if (results.length >= 5 && /[\u4e00-\u9fff]/.test(results[0].title)) break;
    }

    results.sort(function (x, y) {
        return rankScore(y, title, artist) - rankScore(x, title, artist);
    });
    return results.slice(0, 10);
}

function getLyrics(id) {
    var parts = id.split("|");
    var lyricId = parts[0];
    var picId = parts.length > 1 ? parts[1] : "";

    var lyricUrl = "https://music-api.gdstudio.xyz/api.php?types=lyric&source=netease&id=" + lyricId;
    var resp = http.get(lyricUrl, {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    });
    if (!resp) return null;

    try {
        var data = JSON.parse(resp);
        var lrc = data.lyric || "";
        if (!lrc) return null;

        var cover = null;
        // 封面单独请求较慢，失败不影响出词
        if (picId) {
            try {
                var picUrl = "https://music-api.gdstudio.xyz/api.php?types=pic&source=netease&id=" + picId + "&size=500";
                var picResp = http.get(picUrl, {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                });
                if (picResp) {
                    var picData = JSON.parse(picResp);
                    cover = picData.url || null;
                }
            } catch (_) {}
        }

        return {
            lrc: lrc,
            cover: cover
        };
    } catch (e) {
        console.error("GD Studio 歌词解析异常: " + e);
        return null;
    }
}
