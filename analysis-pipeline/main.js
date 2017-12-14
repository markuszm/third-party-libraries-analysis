const downloader = require('./library-downloader/downloader');
const embedder = require('./analysis-runner/embedder');
const program = require('commander');
const path = require('path');
const fs = require('fs');
const analysisRunner = require('./analysis-runner/runner');
const util = require('./fileUtil');

const apiUrl = 'https://api.cdnjs.com/libraries';

program
    .arguments('<path>')
    .action(async function (folderPath) {
        await util.ensureExistsAsync(folderPath);

        const librariesPath = path.join(folderPath, 'libraries.json');
        const htmlsPath = path.join(folderPath, 'htmls');
        const resultsPath = path.join(folderPath, 'results');

        await util.ensureExistsAsync(htmlsPath);
        await util.ensureExistsAsync(resultsPath);

        await fs.stat(librariesPath, async function (err, stat) {
            if (err == null) {
                console.log(`Reusing existing libraries.json`);
                await embedAndRunAnalysis(librariesPath, htmlsPath, resultsPath);
            } else {
                await downloader.downloadLibraries(apiUrl, librariesPath);
                await embedAndRunAnalysis(librariesPath, htmlsPath, resultsPath);
            }
        });
    })
    .parse(process.argv);

async function embedAndRunAnalysis(librariesPath, htmlsPath, resultsPath) {
    await embedder.createHtmlJson(librariesPath, htmlsPath);

    fs.readdir(htmlsPath, async function (err, items) {
        for (let item of items) {
            console.log(`Analyzing ${item}`);
            let results = await analysisRunner.runAnalysisInBrowser(path.join(htmlsPath, item));
            fs.writeFileSync(path.join(resultsPath, `${item}.json`), JSON.stringify(results));
        }
    });
}
