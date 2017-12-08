const downloader = require('library-downloader');
const embedder = require('./analysis-runner/embedder');
const program = require('commander');
const path = require('path');
const fs = require('fs');

const apiUrl = 'https://api.cdnjs.com/libraries';

program
    .arguments('<path>')
    .action(async function (folderPath) {
        let librariesPath = 'libraries.json'
        await downloader.downloadLibraries(apiUrl, path.join(folderPath, librariesPath));
        let htmlsJson = embedder.createHtmlJson(librariesPath);
        fs.writeFileSync('./htmls.json', htmlsJson);
    })
    .parse(process.argv);

