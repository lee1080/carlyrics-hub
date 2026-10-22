/**
 * @name 网易云音乐
 * @id netease_official
 * @version 1.0.0
 * @author lee
 * @description 网易云音乐官方源，支持原生 YRC 逐字卡拉OK歌词与超清封面。
 */

function search(title, artist, duration) {
    var keyword = (title + " " + artist).trim();
    var url = "http://music.163.com/api/search/get/web?s=" + encodeURIComponent(keyword) + "&type=1&offset=0&total=true&limit=5";
    var resp = http.get(url, {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "http://music.163.com"
    });
    if (!resp) return [];

    try {
        var data = JSON.parse(resp);
        var songs = (data && data.result && data.result.songs) || [];
        var results = [];
        for (var i = 0; i < songs.length; i++) {
            var s = songs[i];
            var artistNames = [];
            if (s.artists) {
                for (var j = 0; j < s.artists.length; j++) {
                    artistNames.push(s.artists[j].name);
                }
            }
            results.push({
                id: String(s.id),
                title: s.name || "",
                artist: artistNames.join(" / "),
                duration: Math.round((s.dt || 0) / 1000)
            });
        }
        return results;
    } catch (e) {
        console.error("网易云搜索解析异常: " + e);
        return [];
    }
}

function getLyrics(id) {
    var lyricUrl = "http://music.163.com/api/song/lyric?os=pc&id=" + id + "&lv=-1&kv=-1&tv=-1&rv=1&yv=1";
    var lyricResp = http.get(lyricUrl, {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "http://music.163.com",
        "Cookie": "os=pc"
    });
    if (!lyricResp) return null;

    try {
        var lyricData = JSON.parse(lyricResp);
        // 优先使用逐字卡拉OK (yrc)，其次普通 lrc
        var lrc = (lyricData.yrc && lyricData.yrc.lyric) ||
                  (lyricData.klyric && lyricData.klyric.lyric) ||
                  (lyricData.lrc && lyricData.lrc.lyric) || "";

        if (!lrc) return null;

        // 获取封面
        var cover = null;
        var detailUrl = "http://music.163.com/api/song/detail/?id=" + id + "&ids=[" + id + "]";
        var detailResp = http.get(detailUrl, {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "http://music.163.com"
        });
        if (detailResp) {
            try {
                var detailData = JSON.parse(detailResp);
                if (detailData.songs && detailData.songs.length > 0 && detailData.songs[0].album) {
                    cover = detailData.songs[0].album.picUrl;
                }
            } catch (_) {}
        }

        return {
            lrc: lrc,
            cover: cover
        };
    } catch (e) {
        console.error("网易云歌词解析异常: " + e);
        return null;
    }
}
