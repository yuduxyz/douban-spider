const https = require('https');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const EXCLUSIONS = ['一房', '四房', '五房', '1房', '4房', '5房', '限女', '女生房', '招女', '单间', '公寓',
    '单身', '床位', '求租', '已租', '已出', '宝安', '西丽', '留仙洞', '白石洲'];
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36';
const COOKIE = 'll="118282"; bid=la92H_gIxHk; gr_user_id=007c068b-923a-42c3-9dc0-a09cfb78a957; viewed="26462940_26918038_26785887_26918475_26809233_26901067_26378583_1477390_26854226_10548379"; ps=y; ue="yuzhongxie@gmail.com"; dbcl2="71496032:wm9x6JJRaSI"; ck=H6ro; _vwo_uuid_v2=BAEA18D3104CC086746751359DE21D73|e866317e44c1383b69cdfc2bed9943dc; _pk_ref.100001.8cb4=%5B%22%22%2C%22%22%2C1497750297%2C%22http%3A%2F%2F0.0.0.0%3A8000%2F%22%5D; ct=y; ap=1; __utmt=1; _pk_id.100001.8cb4=86cc20df62751a4d.1491145429.20.1497752484.1497718563.; _pk_ses.100001.8cb4=*; push_noty_num=0; __utma=30149280.698526192.1491145431.1497718564.1497750298.36; __utmb=30149280.72.5.1497752332178; __utmc=30149280; __utmz=30149280.1497750298.36.22.utmcsr=0.0.0.0:8000|utmccn=(referral)|utmcmd=referral|utmcct=/; __utmv=30149280.7149; push_doumail_num=5';
const PAGES = 40;
const NUMPERPAGE = 25;
const HEADERS = {
    'User-Agent': UA
};

function crawl(index) {
    return new Promise((resolve, reject) => {
        const options = {
            host: 'www.douban.com',
            path: '/group/nanshanzufang/discussion?start=' + index,
            headers: HEADERS
        }
        https.get(options, function (res) {
            const pageSize = 25;
            let html = '';
            let discussions = [];
            res.setEncoding('utf-8');
            res.on('data', function (chunk) {
                html += chunk;
            });
            res.on('end', function () {
                const $ = cheerio.load(html);
                $('.olt tr[class!="th"]').each(function () {
                    var discussion = {
                        title: $('.title', this).text().trim(),
                        link: $('a', this).attr('href')
                    };
                    for (let i in EXCLUSIONS) {
                        if (discussion.title.includes(EXCLUSIONS[i])) {
                            return;
                        }
                    }
                    discussions.push(discussion);
                });
                const p = [];
                discussions.forEach(d => setTimeout(
                    () => p.push(filterContent(d))),
                500);
                Promise.all(p).then(data => {
                    saveData('./data', data);
                    resolve()
                });
            });
        }).on('error', function (err) {
            console.log(err);
            reject();
        });
    })
}

function filterContent(discussion) {
    return new Promise((resolve, reject) => {
        const { link, title } = discussion;
        const options = {
            host: 'www.douban.com',
            path: link.split('www.douban.com')[1],
            headers: HEADERS
        };
        https.get(options, res => {
            res.setEncoding('UTF-8');
            let html = '';
            res.on('data', chunk => html += chunk);
            res.on('end', () => {
                const $ = cheerio.load(html);
                let isGood = true;
                $('.topic-content p').each(function () {
                    const text = $(this).text();
                    for (let i in EXCLUSIONS) {
                        if (text.includes(EXCLUSIONS[i])) {
                            isGood = false;
                            return false;
                        }
                    }
                })
                if (isGood) {
                    resolve({ title: title, link: link });
                } else {
                    console.log('exclude...', title);
                    resolve();
                }
            })
        })
    })
}

function saveData(path, data) {
    data.forEach(d => {
        if (!d) return;
        let str = d.title + '\n' + d.link + '\n\n';
        fs.appendFile(path, str, err => {
            if (err) return console.error(err);
        })
    })
}

async function doCrawl(page) {
    const total = PAGES * NUMPERPAGE;
    fs.unlink('./data', err => console.error(err));
    await crawl(page);
    page += NUMPERPAGE;
    setTimeout(() => {if (page < total) doCrawl(page)}, 1000);
    console.log('............finish............', page / total * 100 + '%');
}

doCrawl(0);