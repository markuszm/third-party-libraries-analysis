const scraper = require('website-scraper');
const URL = require('url');
const path = require('path')

function scrapeWebsite(url, dest) {
    var options = {
        urls: [url],
        directory: dest,
        request: {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36'
            }
          }
      };

    scraper(options).then((result) => {
        console.log(`Successfully downloaded ${url} to destination ${dest}`);
    }).catch((err) => {
        console.error(`Error downloading ${url}`)
    });
}

const urls = [
    'https://google.com',
    'https://youtube.com',
    'https://facebook.com',
    'https://baidu.com',
    'https://wikipedia.org',
    'https://yahoo.com',
    'https://reddit.com',
    'https://qq.com	',
    'https://taobao.com',
    'https://amazon.com',
    'https://tmall.com',
    'https://twitter.com',
    'https://sohu.com',
    'https://outlook.live.com/owa',
    'https://vk.com',
    'https://instagram.com',
    'https://sina.com.cn',
    'https://360.cn',
    'https://jd.com',
    'https://linkedin.com',
    'https://weibo.com'
];

function downloadAllWebsites(dest) {
    urls.forEach(url => scrapeWebsite(url, path.join(dest, URL.parse(url).hostname)));
}

exports.downloadAllWebsites = downloadAllWebsites;