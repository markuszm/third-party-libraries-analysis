const scraper = require('website-scraper');
const URL = require('url');
const path = require('path');

function scrapeWebsite(url, dest) {
    var options = {
        urls: [url],
        directory: dest,
        request: {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36'
            }
        }
    };

    scraper(options)
        .then(() => {
            console.log(`Successfully downloaded ${url} to destination ${dest}`);
        })
        .catch(() => {
            console.error(`Error downloading ${url}`);
        });
}

const urls = [
    'https://360.cn',
    'https://amazon.com',
    'https://baidu.com',
    'https://facebook.com',
    'https://google.com',
    'https://instagram.com',
    'https://jd.com',
    'https://linkedin.com',
    'https://netflix.com',
    'https://outlook.live.com/owa',
    'http://qq.com',
    'https://reddit.com',
    'https://sina.com.cn',
    'https://sohu.com',
    'https://taobao.com',
    'https://tmall.com',
    'https://twitter.com',
    'https://vk.com',
    'https://weibo.com',
    'https://wikipedia.org',
    'https://yahoo.com',
    'https://youtube.com'
];

function downloadAllWebsites(dest) {
    urls.forEach(url => scrapeWebsite(url, path.join(dest, URL.parse(url).hostname)));
}

exports.downloadAllWebsites = downloadAllWebsites;
