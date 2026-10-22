/**
 * @name 酷我音乐
 * @id kuwo_official
 * @version 1.0.1
 * @author lee
 * @description 酷我音乐官方极速直连源，支持毫秒级时间轴与高清封面。
 */

function search(title, artist, duration) {
    var keyword = (title + " " + artist).trim();
    var url = "http://www.kuwo.cn/search/searchMusicBykeyWord?vipver=1&client=kt&ft=music&cluster=0&strategy=2012&encoding=utf8&rformat=json&mobi=1&issubtitle=1&pn=0&rn=5&all=" + encodeURIComponent(keyword);
    var resp = http.get(url, {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    });
    if (!resp) return [];

    try {
        var data = JSON.parse(resp);
        // 酷我 searchMusicBykeyWord 返回顶层 abslist；兼容旧版 data.data.list
        var list = data.abslist || (data.data && data.data.list) || (data.data && data.data.abslist) || [];
        var results = [];
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var musicId = String(item.MUSICRID || item.DC_TARGETID || "").replace("MUSIC_", "");
            if (!musicId) continue;
            results.push({
                id: musicId,
                title: item.NAME || item.SONGNAME || "",
                artist: item.ARTIST || "",
                duration: parseInt(item.DURATION || 0)
            });
        }
        return results;
    } catch (e) {
        console.error("酷我搜索解析异常: " + e);
        return [];
    }
}

function getLyrics(id) {
    var headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.kuwo.cn/"
    };
    // 旧 m.kuwo.cn/songinfoandlrc 已失效；改用 openapi
    var url = "http://www.kuwo.cn/openapi/v1/www/lyric/getlyric?musicId=" + id;
    var resp = http.get(url, headers);
    if (!resp) return null;

    try {
        var data = JSON.parse(resp);
        var lrclist = (data && data.data && data.data.lrclist) || [];
        if (!lrclist.length) return null;

        var cover = null;
        var infoResp = http.get("https://wapi.kuwo.cn/api/www/music/musicInfo?mid=" + id + "&httpsStatus=1", headers);
        if (infoResp) {
            try {
                var info = JSON.parse(infoResp);
                cover = (info && info.data && info.data.pic) || null;
            } catch (_) {}
        }

        var lrcLines = [];
        for (var i = 0; i < lrclist.length; i++) {
            var item = lrclist[i];
            var totalSec = parseFloat(item.time || 0);
            var min = Math.floor(totalSec / 60);
            var sec = Math.floor(totalSec % 60);
            var ms = Math.floor((totalSec % 1) * 100);
            var minStr = (min < 10 ? "0" : "") + min;
            var secStr = (sec < 10 ? "0" : "") + sec;
            var msStr = (ms < 10 ? "0" : "") + ms;
            lrcLines.push("[" + minStr + ":" + secStr + "." + msStr + "]" + (item.lineLyric || ""));
        }

        return {
            lrc: lrcLines.join("\n"),
            cover: cover
        };
    } catch (e) {
        console.error("酷我歌词解析异常: " + e);
        return null;
    }
}
