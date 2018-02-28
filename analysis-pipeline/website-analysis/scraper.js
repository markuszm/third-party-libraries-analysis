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

function downloadAllWebsites(urls, dest) {
    urls.forEach(url => scrapeWebsite(url, path.join(dest, URL.parse(url).hostname)));
}

exports.downloadAllWebsites = downloadAllWebsites;
exports.scrapeWebsite = scrapeWebsite;
