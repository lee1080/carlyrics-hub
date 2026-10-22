/**
 * @name 酷狗音乐
 * @id kugou_official
 * @version 1.1.0
 * @author lee
 * @description 酷狗音乐官方源，采用手机端正版检索、精细哈希匹配与高清专辑封面获取。
 */

function search(title, artist, duration) {
    var keyword = (title + " " + (artist || "")).trim();
    var results = [];

    // 1. 优先使用酷狗移动端综合搜索接口 (高权重正版曲库，杜绝杂音与泛滥翻唱)
    try {
        var mobileUrl = "http://mobilecdn.kugou.com/api/v3/search/song?keyword=" + encodeURIComponent(keyword) + "&page=1&pagesize=15";
        var mobileResp = http.get(mobileUrl, {
            "User-Agent": "Mozilla/5.0 (Android; Mobile)"
        });
        if (mobileResp) {
            var data = JSON.parse(mobileResp);
            var list = (data && data.data && data.data.info) || [];
            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                var sName = item.songname || item.songname_original || "";
                var aName = item.singername || "";
                var dur = parseInt(item.duration || 0);
                if (item.hash) {
                    results.push({
                        id: item.hash + "|" + dur + "|" + encodeURIComponent(sName) + "|" + encodeURIComponent(aName),
                        title: sName,
                        artist: aName,
                        duration: dur
                    });
                }
            }
        }
    } catch (e) {
        console.error("酷狗移动端搜索异常: " + e);
    }

    // 2. 备用降级：若移动端未返回，尝试旧版接口兜底
    if (results.length === 0) {
        try {
            var backupUrl = "http://songsearch.kugou.com/song_search_v2?keyword=" + encodeURIComponent(keyword) + "&page=1&pagesize=10&filter=0&bitrate=0&isfreeze=0&feedback=0";
            var backupResp = http.get(backupUrl, {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            });
            if (backupResp) {
                var bData = JSON.parse(backupResp);
                var bList = (bData && bData.data && bData.data.lists) || [];
                for (var j = 0; j < bList.length; j++) {
                    var bItem = bList[j];
                    var bsName = bItem.SongName || bItem.AudioName || "";
                    var baName = bItem.SingerName || "";
                    var bDur = parseInt(bItem.Duration || 0);
                    if (bItem.FileHash) {
                        results.push({
                            id: bItem.FileHash + "|" + bDur + "|" + encodeURIComponent(bsName) + "|" + encodeURIComponent(baName),
                            title: bsName,
                            artist: baName,
                            duration: bDur
                        });
                    }
                }
            }
        } catch (e2) {
            console.error("酷狗兜底搜索异常: " + e2);
        }
    }

    return results;
}

function getLyrics(id) {
    var parts = id.split("|");
    var hash = parts[0];
    var duration = parts.length > 1 ? parseInt(parts[1]) : 0;
    var title = parts.length > 2 ? decodeURIComponent(parts[2]) : "";
    var artist = parts.length > 3 ? decodeURIComponent(parts[3]) : "";

    var keyword = (title + " " + artist).trim();
    var searchUrl = "http://krcs.kugou.com/search?ver=1&man=yes&client=mobi&keyword=" + encodeURIComponent(keyword) + "&duration=" + (duration * 1000) + "&hash=" + hash;
    var searchResp = http.get(searchUrl, {
        "User-Agent": "Mozilla/5.0 (Android; Mobile)"
    });
    if (!searchResp) return null;

    try {
        var searchData = JSON.parse(searchResp);
        var candidates = searchData.candidates || [];
        if (candidates.length === 0) return null;

        // 优先筛选官方推荐歌词或评分高且曲名匹配的歌词
        var cand = candidates[0];
        for (var i = 0; i < candidates.length; i++) {
            var c = candidates[i];
            if (c.product_from === "官方推荐歌词" || (c.score && c.score >= 50)) {
                cand = c;
                break;
            }
        }

        var downUrl = "http://krcs.kugou.com/download?ver=1&client=mobi&id=" + cand.id + "&accesskey=" + cand.accesskey + "&fmt=lrc&charset=utf8";
        var downResp = http.get(downUrl, {
            "User-Agent": "Mozilla/5.0 (Android; Mobile)"
        });
        if (!downResp) return null;

        var downData = JSON.parse(downResp);
        var base64Lrc = downData.content || "";
        if (!base64Lrc) return null;

        var lrc = crypto.base64Decode(base64Lrc);

        // 获取高清专辑封面
        var cover = null;
        try {
            var infoUrl = "http://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash=" + hash;
            var infoResp = http.get(infoUrl, {
                "User-Agent": "Mozilla/5.0 (Android; Mobile)"
            });
            if (infoResp) {
                var infoData = JSON.parse(infoResp);
                var rawCover = infoData.album_img || infoData.imgUrl || "";
                if (rawCover) {
                    cover = rawCover.replace("{size}", "400");
                }
            }
        } catch (_) {}

        return {
            lrc: lrc,
            cover: cover
        };
    } catch (e) {
        console.error("酷狗歌词解析异常: " + e);
        return null;
    }
}
