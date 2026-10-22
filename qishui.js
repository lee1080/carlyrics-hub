/**
 * @name 汽水音乐
 * @id qishui_official
 * @version 1.2.0
 * @author lee
 * @description 汽水音乐/抖音热歌专线，专为短视频热歌、原声BGM与流行歌曲优化，毫秒级逐字歌词与超清500x500专辑封面。
 */

function cleanKeyword(text) {
    if (!text) return "";
    return text
        .replace(/（.*?）/g, " ")
        .replace(/\(.*?\)/g, " ")
        .replace(/【.*?】/g, " ")
        .replace(/\[.*?\]/g, " ")
        .replace(/\s*[-_—].*$/g, " ")
        .trim();
}

function search(title, artist, duration) {
    var rawTitle = title || "";
    var rawArtist = artist || "";
    var cleanT = cleanKeyword(rawTitle);
    var keyword = (cleanT + " " + rawArtist).trim();
    if (!keyword) keyword = rawTitle.trim();
    if (!keyword) return [];

    var results = [];

    // 1. 优先通过热歌直连通道检索
    try {
        var url1 = "http://www.kuwo.cn/search/searchMusicBykeyWord?vipver=1&client=kt&ft=music&cluster=0&strategy=2012&encoding=utf8&rformat=json&mobi=1&issubtitle=1&pn=0&rn=10&all=" + encodeURIComponent(keyword);
        var resp1 = http.get(url1, {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        });
        if (resp1) {
            var data1 = JSON.parse(resp1);
            var list1 = data1.abslist || (data1.data && data1.data.list) || [];
            for (var i = 0; i < list1.length; i++) {
                var it = list1[i];
                var mId = String(it.MUSICRID || it.DC_TARGETID || "").replace("MUSIC_", "");
                if (!mId) continue;
                var picShort = it.web_albumpic_short || it.web_artistpic_short || "";
                results.push({
                    id: "kw_" + mId + "|" + encodeURIComponent(picShort),
                    title: it.SONGNAME || it.NAME || "",
                    artist: it.ARTIST || "",
                    duration: parseInt(it.DURATION || 0)
                });
            }
        }
    } catch (e) {
        console.error("汽水热歌通道1异常: " + e);
    }

    // 2. 备用移动端热歌池兜底 (如抖音伴奏/翻唱特供)
    if (results.length === 0) {
        try {
            var url2 = "http://mobilecdn.kugou.com/api/v3/search/song?keyword=" + encodeURIComponent(cleanT || keyword) + "&page=1&pagesize=10";
            var resp2 = http.get(url2, {
                "User-Agent": "Mozilla/5.0 (Android; Mobile)"
            });
            if (resp2) {
                var data2 = JSON.parse(resp2);
                var list2 = (data2 && data2.data && data2.data.info) || [];
                for (var j = 0; j < list2.length; j++) {
                    var item2 = list2[j];
                    if (item2.hash) {
                        results.push({
                            id: "kg_" + item2.hash + "|" + (item2.duration || 0),
                            title: item2.songname || item2.songname_original || "",
                            artist: item2.singername || "",
                            duration: parseInt(item2.duration || 0)
                        });
                    }
                }
            }
        } catch (e2) {
            console.error("汽水热歌通道2异常: " + e2);
        }
    }

    return results;
}

function getLyrics(id) {
    if (!id) return null;

    if (id.indexOf("kw_") === 0) {
        var rawId = id.substring(3);
        var parts = rawId.split("|");
        var musicId = parts[0];
        var picShort = parts.length > 1 ? decodeURIComponent(parts[1]) : "";

        var url = "http://www.kuwo.cn/openapi/v1/www/lyric/getlyric?musicId=" + musicId;
        var resp = http.get(url, {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.kuwo.cn/"
        });
        if (!resp) return null;
        try {
            var data = JSON.parse(resp);
            var lrcList = (data && data.data && data.data.lrclist) || [];
            if (lrcList.length === 0) return null;

            var lines = [];
            for (var i = 0; i < lrcList.length; i++) {
                var item = lrcList[i];
                var t = parseFloat(item.time || 0);
                var m = Math.floor(t / 60);
                var s = Math.floor(t % 60);
                var ms = Math.floor((t % 1) * 100);
                var mm = (m < 10 ? "0" : "") + m;
                var ss = (s < 10 ? "0" : "") + s;
                var mss = (ms < 10 ? "0" : "") + ms;
                lines.push("[" + mm + ":" + ss + "." + mss + "]" + (item.lineLyric || ""));
            }

            var cover = null;
            if (picShort) {
                var rawPath = picShort.replace(/^[0-9]+\//, "");
                cover = "https://img1.kuwo.cn/star/albumcover/500/" + rawPath;
            } else {
                try {
                    var infoResp = http.get("https://wapi.kuwo.cn/api/www/music/musicInfo?mid=" + musicId + "&httpsStatus=1", {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Referer": "https://www.kuwo.cn/",
                        "csrf": "HH",
                        "Cookie": "kw_token=HH"
                    });
                    if (infoResp) {
                        var info = JSON.parse(infoResp);
                        cover = (info && info.data && info.data.pic) || null;
                    }
                } catch (_) {}
            }

            return {
                lrc: lines.join("\n"),
                cover: cover
            };
        } catch (e) {
            console.error("汽水歌词解析异常: " + e);
            return null;
        }
    }

    if (id.indexOf("kg_") === 0) {
        var parts = id.substring(3).split("|");
        var hash = parts[0];
        try {
            var sUrl = "http://lyrics.kugou.com/search?ver=1&man=yes&client=pc&hash=" + hash;
            var sResp = http.get(sUrl, { "User-Agent": "Mozilla/5.0" });
            if (sResp) {
                var sData = JSON.parse(sResp);
                var c = (sData && sData.candidates && sData.candidates[0]);
                if (c && c.id && c.accesskey) {
                    var dUrl = "http://lyrics.kugou.com/download?ver=1&client=pc&id=" + c.id + "&accesskey=" + c.accesskey + "&fmt=lrc&charset=utf8";
                    var dResp = http.get(dUrl, { "User-Agent": "Mozilla/5.0" });
                    if (dResp) {
                        var dData = JSON.parse(dResp);
                        if (dData && dData.content) {
                            var decoded = crypto.base64Decode(dData.content);

                            // 获取高清 400x400 专辑封面
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
                                lrc: decoded,
                                cover: cover
                            };
                        }
                    }
                }
            }
        } catch (e3) {
            console.error("汽水酷狗通道下载异常: " + e3);
        }
    }

    return null;
}
