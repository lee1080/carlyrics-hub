/**
 * @name LRCLIB (国际公共源)
 * @id lrclib_public
 * @version 1.0.0
 * @author Community
 * @description 全球最大的公共免费开源歌词库，纯公开免费 API，覆盖海量外文与流行音乐。
 */

function search(title, artist, duration) {
    var keyword = (title + " " + artist).trim();
    var url = "https://lrclib.net/api/search?q=" + encodeURIComponent(keyword);
    var resp = http.get(url, {
        "User-Agent": "CarLyrics/2.0.0 (https://github.com/lee1080/carlyrics-hub)"
    });
    if (!resp) return [];

    try {
        var list = JSON.parse(resp);
        if (!Array.isArray(list)) return [];

        var results = [];
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            results.push({
                id: String(item.id),
                title: item.trackName || "",
                artist: item.artistName || "",
                duration: Math.round(item.duration || 0)
            });
        }
        return results;
    } catch (e) {
        console.error("LRCLIB 搜索解析异常: " + e);
        return [];
    }
}

function getLyrics(id) {
    var url = "https://lrclib.net/api/get/" + id;
    var resp = http.get(url, {
        "User-Agent": "CarLyrics/2.0.0 (https://github.com/lee1080/carlyrics-hub)"
    });
    if (!resp) return null;

    try {
        var data = JSON.parse(resp);
        var lrc = data.syncedLyrics || data.plainLyrics || "";
        if (!lrc) return null;

        return {
            lrc: lrc,
            cover: null
        };
    } catch (e) {
        console.error("LRCLIB 歌词解析异常: " + e);
        return null;
    }
}
