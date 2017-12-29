const downloader = require('./library-downloader/downloader');
const embedder = require('./analysis-runner/embedder');
const program = require('commander');
const path = require('path');
const fs = require('fs');
const analysisRunner = require('./analysis-runner/runner');
const util = require('./fileUtil');
const websiteScraper = require('./website-analysis/scraper');
const websiteInstrument = require('./website-analysis/instrument');
const websiteAnalysisRunner = require('./website-analysis/runner');

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

program
    .command('scrape <destPath>')
    .action(async (destPath) => {
        await util.ensureExistsAsync(destPath);
        websiteScraper.downloadAllWebsites(destPath);
    })

program
    .command('instrumentWebsite <websitePath> <analysisPath> <destPath>')
    .action(async (websitePath, analysisPath, destPath) => {
        await util.ensureExistsAsync(destPath);
        websiteInstrument.instrumentWebsite(websitePath, analysisPath, destPath);
    })

program
    .command('analyzeHTML <htmlPath> <destPath>')
    .action(async (htmlPath, destPath) => {
        await util.ensureExistsAsync(destPath);
        await runAnalysisHTML(htmlPath, destPath);
    })

program
    .command('instrumentWebsites <websitesPath> <analysisPath> <destPath>')
    .action(async (websitesPath, analysisPath, destPath) => {
        await util.ensureExistsAsync(destPath);
        let websites = fs.readdirSync(websitesPath);
        for(let website of websites) {
            websiteInstrument.instrumentWebsite(path.join(websitesPath, website), analysisPath, destPath);
        }
    })

program
    .command('analyzeWebsite <websitePath> <destPath>')
    .action(async (websitePath, destPath) => {
        await util.ensureExistsAsync(destPath);
        let resultFileName = path.basename(websitePath);

        let results = await websiteAnalysisRunner.runWebsiteAnalysisInBrowser(websitePath);
        
        let globalWrites = parseResult(results);
        fs.writeFileSync(path.join(destPath, `${resultFileName}.json`), JSON.stringify(globalWrites));
    })

program
    .command('analyzeWebsites <websitesPath> <destPath>')
    .action(async (websitesPath, destPath) => {
        await util.ensureExistsAsync(destPath);

        let websites = fs.readdirSync(websitesPath);

        for(let website of websites) {
            let resultFileName = path.basename(path.join(websitesPath, website));
            let resultFilePath = path.join(destPath, resultFileName);
            if (util.checkFileExists(resultFilePath) || website === "facebook.com") {
                console.log(`Already analyzed website: ${website}`)
                continue;
            }
            console.log(`Analyzing website: ${website}`);
            let results = await websiteAnalysisRunner.runWebsiteAnalysisInBrowser(path.join(websitesPath, website));

            let globalWrites = parseResult(results);
            fs.writeFileSync(resultFilePath, JSON.stringify(globalWrites));
        }       
    })

program.parse(process.argv);

async function embedAndRunAnalysis(librariesPath, htmlsPath, resultsPath) {
    await embedder.createHtmlJson(librariesPath, htmlsPath);

    await fs.readdir(htmlsPath, async (err, items) => {
        for (let item of items) {
            let htmlPath = path.join(htmlsPath, item);
            await runAnalysisHTML(htmlPath, resultsPath);
        }
    });
}

async function runAnalysisHTML(htmlPath, resultsPath) {
    let html = path.basename(htmlPath);
    let resultFilePath = path.join(resultsPath, `${html}.json`);
    if (util.checkFileExists(resultFilePath)) {
        console.log(`Already analyzed ${html}`);
    }
    else {
        console.log(`Analyzing ${html}`);
        let results = await analysisRunner.runAnalysisInBrowser(htmlPath);
        fs.writeFileSync(resultFilePath, JSON.stringify(results));
    }
}

async function aggregateResults(resultsPath, destPath) {
    await fs.readdir(resultsPath, async (err, items) => {
        let resultsMap = [];
        for (let item of items) {
            let resultFilePath = path.join(resultsPath, item);

            let parsedResult = parseResultFile(resultFilePath);
            if(parsedResult) {
                resultsMap.push(parsedResult);
            }
        }

        fs.writeFileSync(path.join(destPath, 'map.json'), JSON.stringify(resultsMap));
    })
}

function parseResultFile(resultFilePath) {
    if (path.extname(resultFilePath) !== '.json') {
        return null;
    }

    let contents = fs.readFileSync(resultFilePath, { encoding: 'utf8' });
    let result = JSON.parse(contents);
    if (result.errors.includes("Error") || result.errors.includes("ERROR")) {
        return null;
    }

    let libraryName = path.basename(resultFilePath).split('.')[0];

    try {
        let globalWrites = parseResult(result);
        if(globalWrites) {
            return { name: libraryName, result: globalWrites };
        } else {
            return null;
        }
    } catch (error) {
        console.log(`Error parsing global writes result for library: ${libraryName} \nresult: ${result} `);
        return null;
    }
}

function parseResult(result) {
    let globalWritesString = result.writes.split('global writes:')[1];
    let endIndex = globalWritesString.lastIndexOf('}') + 1;
    globalWritesString = globalWritesString.substring(0, endIndex);

    let globalWrites = JSON.parse(globalWritesString);

    // skip libraries that have no global writes
    if (Object.keys(globalWrites).length === 0) {
        return null;
    }

    return globalWrites;
}