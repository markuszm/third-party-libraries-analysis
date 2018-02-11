const scraper = require('website-scraper');
const URL = require('url');
const path = require('path');

function scrapeWebsite(url, dest) {
    var options = {
        urls: [url],
        directory: dest,
        onResourceError: (resource, err) => {
            console.log(`Resource ${resource} was not saved because of ${err}`);
        },
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
    'https://youtube.com',
    'https://wired.com/',
    'https://joomla.org/',
    'https://ted.com/',
    'https://one.com/en/',
    'https://imgur.com/',
    'http://overseas.weibo.com/',
    'https://line.me/',
    'https://marykay.com/',
    'http://kobold.vorwerk.de/',
    'https://bing.com/',
    'https://businessforhome.org/',
    'http://pbs.org/',
    'https://ibm.com/',
    'https://shopify.de/',
    'https://epa.gov/',
    'https://a8.net/',
    'https://wufoo.com/',
    'https://foursquare.com/',
    'http://doi.org/',
    'https://vice.com/',
    'https://about.me/',
    'https://houzz.de/',
    'https://upenn.edu/',
    'https://slideshare.net/',
    'https://wsj.com/',
    'http://ameblo.jp/',
    'https://sourceforge.net/',
    'https://4life.com/',
    'https://www.aol.de/',
    'https://xing.com/',
];

function downloadAllWebsites(dest) {
    urls.forEach(url => scrapeWebsite(url, path.join(dest, URL.parse(url).hostname)));
}

exports.downloadAllWebsites = downloadAllWebsites;
exports.scrapeWebsite = scrapeWebsite;
