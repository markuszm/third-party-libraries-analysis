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
    .action(async (folderPath) => {
        await util.ensureExistsAsync(folderPath);

        const librariesPath = path.join(folderPath, 'libraries.json');
        const htmlsPath = path.join(folderPath, 'htmls');
        const resultsPath = path.join(folderPath, 'results');

        await util.ensureExistsAsync(htmlsPath);
        await util.ensureExistsAsync(resultsPath);

        if (util.checkFileExists) {
            await embedAndRunAnalysis(librariesPath, htmlsPath, resultsPath);
        }
        else {
            await downloader.downloadLibraries(apiUrl, librariesPath);
            await embedAndRunAnalysis(librariesPath, htmlsPath, resultsPath);
        }

        await aggregateResults(resultsPath, path.join(folderPath, 'map.json'));
    })

program
    .command('aggregate <resultsPath> <destPath>')
    .action(async (resultsPath, destPath) => {
        await aggregateResults(resultsPath, destPath);
    })

program.parse(process.argv);

async function embedAndRunAnalysis(librariesPath, htmlsPath, resultsPath) {
    await embedder.createHtmlJson(librariesPath, htmlsPath);

    await fs.readdir(htmlsPath, async (err, items) => {
        for (let item of items) {
            let resultFilePath = path.join(resultsPath, `${item}.json`);
            if (util.checkFileExists(resultFilePath)) {
                console.log(`Already analyzed ${item}`);
                continue;
            }
            else {
                console.log(`Analyzing ${item}`);
                let results = await analysisRunner.runAnalysisInBrowser(path.join(htmlsPath, item));
                fs.writeFileSync(resultFilePath, JSON.stringify(results));
            }
        }
    });
}

async function aggregateResults(resultsPath, destPath) {
    await fs.readdir(resultsPath, async (err, items) => {
        let resultsMap = [];
        for (let item of items) {
            let resultFilePath = path.join(resultsPath, item);

            if (path.extname(resultFilePath) !== '.json') continue;
            
            let contents = fs.readFileSync(resultFilePath, { encoding: 'utf8' });
            let result = JSON.parse(contents);
            if (result.includes("Error") || result.includes("ERROR")) continue;

            let libraryName = path.basename(resultFilePath).split('.')[0];
            
            try {   
                let globalWritesString = result.split('global writes:')[1];
                let endIndex = globalWritesString.lastIndexOf('}') + 1;
                globalWritesString = globalWritesString.substring(0, endIndex);
                let globalWrites = JSON.parse(globalWritesString);
                resultsMap.push({name: libraryName, result: globalWrites});
            } catch (error) {
                console.log(`Error parsing global writes result for library: ${libraryName} \nresult: ${result} `)
            }
            
        }

        fs.writeFileSync(path.join(destPath, 'map.json'), JSON.stringify(resultsMap));
    })
}