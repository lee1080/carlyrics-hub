/**
 * @name QQ音乐
 * @id qqmusic_official
 * @version 1.0.1
 * @author lee
 * @description QQ音乐官方源，支持精准搜索匹配、歌词解码与高清专辑封面。
 */

function search(title, artist, duration) {
    var keyword = (title + " " + artist).trim();
    // client_search_cp 在部分网络环境返回 500；改用 H5 搜索接口
    var url = "https://c.y.qq.com/soso/fcgi-bin/search_for_qq_cp?g_tk=5381&uin=0&format=json&inCharset=utf-8&outCharset=utf-8&notice=0&platform=h5&needNewCode=1&w="
        + encodeURIComponent(keyword)
        + "&zhidaqu=1&catZhida=1&t=0&flag=1&ie=utf-8&sem=1&aggr=0&perpage=5&n=5&p=1&remoteplace=txt.mqq.all";
    var resp = http.get(url, {
        "User-Agent": "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "Referer": "https://i.y.qq.com/"
    });
    if (!resp) return [];

    try {
        var data = JSON.parse(resp);
        var list = (data && data.data && data.data.song && data.data.song.list) || [];
        var results = [];
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            if (!item.songmid) continue;
            var singers = [];
            if (item.singer) {
                for (var j = 0; j < item.singer.length; j++) {
                    singers.push(item.singer[j].name);
                }
            }
            results.push({
                id: item.songmid + "|" + (item.albummid || ""),
                title: item.songname || "",
                artist: singers.join(" / "),
                duration: parseInt(item.interval || 0)
            });
        }
        return results;
    } catch (e) {
        console.error("QQ音乐搜索解析异常: " + e);
        return [];
    }
}

function getLyrics(id) {
    var parts = id.split("|");
    var songmid = parts[0];
    var albummid = parts.length > 1 ? parts[1] : "";

    var url = "https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=" + songmid + "&format=json&nobase64=1";
    var resp = http.get(url, {
        "User-Agent": "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "Referer": "https://y.qq.com/"
    });
    if (!resp) return null;

    try {
        var data = JSON.parse(resp);
        var rawLyric = data.lyric || "";
        if (!rawLyric) return null;

        var lrc = rawLyric;
        // 若依然为 base64 则解码
        if (rawLyric.indexOf("[") === -1 && /^[A-Za-z0-9+/=\r\n]+$/.test(rawLyric)) {
            lrc = crypto.base64Decode(rawLyric);
        }

        var cover = null;
        if (albummid) {
            cover = "https://y.gtimg.cn/music/photo_new/T002R300x300M000" + albummid + ".jpg";
        }

        return {
            lrc: lrc,
            cover: cover
        };
    } catch (e) {
        console.error("QQ音乐歌词解析异常: " + e);
        return null;
    }
}
