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
const resultParser = require('./resultParser');
const modelGenerator = require('./modelGenerator');

const apiUrl = 'https://api.cdnjs.com/libraries';

program
    .command('fullModel <path>')
    .action(async (folderPath) => {
        await util.ensureExistsAsync(folderPath);

        const librariesPath = path.join(folderPath, 'libraries.json');
        const htmlsPath = path.join(folderPath, 'htmls');
        const resultsPath = path.join(folderPath, 'results');

        await util.ensureExistsAsync(htmlsPath);
        await util.ensureExistsAsync(resultsPath);

        if (util.checkFileExists(librariesPath)) {
            await embedAndRunAnalysis(librariesPath, htmlsPath, resultsPath);
            await resultParser.aggregateResults(resultsPath, folderPath);            
        }
        else {
            await downloader.downloadLibraries(apiUrl, librariesPath);
            await embedAndRunAnalysis(librariesPath, htmlsPath, resultsPath);
            await resultParser.aggregateResults(resultsPath, folderPath);
        }
    })

program
    .command('aggregate <resultsPath> <destPath>')
    .action(async (resultsPath, destPath) => {
        await resultParser.aggregateResults(resultsPath, destPath);
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
        
        let globalWrites = resultParser.parseResult(results);
        fs.writeFileSync(path.join(destPath, `${resultFileName}.json`), JSON.stringify(globalWrites));
    })

program
    .command('analyzeWebsites <websitesPath> <destPath>')
    .action(async (websitesPath, destPath) => {
        await util.ensureExistsAsync(destPath);

        let websites = fs.readdirSync(websitesPath);

        for(let website of websites) {
            let resultFileName = path.basename(path.join(websitesPath, website));
            let resultFilePath = path.join(destPath, `${resultFileName}.json`);
            if (util.checkFileExists(resultFilePath)) {
                console.log(`Already analyzed website: ${website}`)
                continue;
            }
            console.log(`Analyzing website: ${website}`);
            let results = await websiteAnalysisRunner.runWebsiteAnalysisInBrowser(path.join(websitesPath, website));

            let globalWrites = resultParser.parseResult(results);
            fs.writeFileSync(resultFilePath, JSON.stringify(globalWrites));
        }       
    })

program
    .command('modelWebsite <resultPath>')
    .action(async (resultPath) => {
        let contents = fs.readFileSync(resultPath, { encoding: 'utf8' });
        let result = JSON.parse(contents);

        let model = modelGenerator.transformWebsiteResults(result);

        model.forEach((value, key) => {
            console.log(key);
            console.log(value.model);
        });

    })

program
    .command('model <resultPath>')
    .action(async (resultPath) => {
        let contents = fs.readFileSync(resultPath, { encoding: 'utf8' });
        let resultPairs = JSON.parse(contents);

        let variableHierarchies = new Map();

        for (const resultPair of resultPairs) {
            let libraryName = resultPair.name;
            modelGenerator.transformLibraryResults(resultPair.result, variableHierarchies, libraryName);
        }

        console.log(variableHierarchies.get("$"));
    })

program.parse(process.argv);

function mapToJson(map) {
    return JSON.stringify([...map]);
}
function jsonToMap(jsonStr) {
    return new Map(JSON.parse(jsonStr));
}

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