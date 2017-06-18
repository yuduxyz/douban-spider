const https = require('https');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

function spiderMovie(index) {
    https.get('https://movie.douban.com/top250?start=' + index, function (res) {
        var pageSize = 25;
        var html = '';
        var movies = [];
        res.setEncoding('utf-8');
        res.on('data', function (chunk) {
            html += chunk;
        });
        res.on('end', function () {
            var $ = cheerio.load(html);
            $('.item').each(function () {
                var picUrl = $('.pic img', this).attr('src');
                var movie = {
                    title: $('.title', this).text(),
                    star: $('.info .star .rating_num', this).text(),
                    link: $('a', this).attr('href'),
                    picUrl: picUrl
                };
                if (movie) {
                    movies.push(movie);
                }
                downloadImg('./img/', movie.picUrl);
            });
            saveData('./data' + (index / pageSize) + '.json', movies);
            console.log('finished!');
        });
    }).on('error', function (err) {
        console.log(err);
    });
}

/* 下载图片 * * @param {string} imgDir 存放图片的文件夹 * @param {string} url 图片的URL地址 */
function downloadImg(imgDir, url) {
    https.get(url, function (res) {
        var data = '';
        res.setEncoding('binary');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            fs.writeFile(imgDir + path.basename(url), data, 'binary', function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log('Image downloaded: ', path.basename(url));
            });
        });
    }).on('error', function (err) {
        console.log(err);
    });
}

/* 保存数据到本地 * * @param {string} path 保存数据的文件夹 * @param {array} movies 电影信息数组 */
function saveData(path, movies) {
   console.log(movies);
   fs.writeFile(path, JSON.stringify(movies, null, ' '), function (err) {
       if (err) {
           return console.log(err);
       }
       console.log('Data saved');
   });
}

function *doSpider(x) {
    var start = 0;
    console.log(start + ' -------------------------------');
    while (start < x) {
        yield start;
        spiderMovie(start);
        start += 25;
    }
}

for (var x of doSpider(250)) {
    console.log(x);
}
