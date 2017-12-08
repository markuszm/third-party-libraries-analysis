const downloader = require('./library-downloader/downloader');
const embedder = require('./analysis-runner/embedder');
const program = require('commander');
const path = require('path');
const fs = require('fs');
const analysisRunner = require('./analysis-runner/runner');

const apiUrl = 'https://api.cdnjs.com/libraries';

program
    .arguments('<path>')
    .action(async function (folderPath) {
        let librariesPath = 'libraries.json'
        await downloader.downloadLibraries(apiUrl, path.join(folderPath, librariesPath));
        await embedder.createHtmlJson(librariesPath);
        
        let htmlsPath = './htmls';
        fs.readdir(htmlsPath, async function(err, items) {
            for (let item of items) {
                let results = await analysisRunner.runAnalysisInBrowser(path.join(htmlsPath, item));
                fs.writeFileSync(`./results/${item}.json`, JSON.stringify(results));
            }
        });
    })
    .parse(process.argv);

