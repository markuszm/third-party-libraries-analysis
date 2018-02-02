const fs = require('fs');
const path = require('path');
const program = require('commander');

const analysisRunner = require('./library-analysis/runner');
const downloader = require('./library-downloader/downloader');
const embedder = require('./library-analysis/embedder');
const fileUtil = require('./fileUtil');
const libraryDetection = require('./detection/libraryDetection');
const resultParser = require('./library-analysis/resultParser');
const websiteAnalysisRunner = require('./website-analysis/runner');
const websiteInstrument = require('./website-analysis/instrument');
const websiteScraper = require('./website-analysis/scraper');

const apiUrl = 'https://api.cdnjs.com/libraries';

program.command('fullModel <path>').action(async folderPath => {
    await fileUtil.ensureExistsAsync(folderPath);

    const librariesPath = path.join(folderPath, 'libraries.json');
    const htmlsPath = path.join(folderPath, 'htmls');
    const resultsPath = path.join(folderPath, 'results');

    await fileUtil.ensureExistsAsync(htmlsPath);
    await fileUtil.ensureExistsAsync(resultsPath);

    if (fileUtil.checkFileExists(librariesPath)) {
        await embedAndRunAnalysis(librariesPath, htmlsPath, resultsPath);
        await resultParser.aggregateResults(resultsPath, folderPath);
    } else {
        await downloader.downloadLibraries(apiUrl, librariesPath);
        await embedAndRunAnalysis(librariesPath, htmlsPath, resultsPath);
        await resultParser.aggregateResults(resultsPath, folderPath);
    }
});

program.command('aggregate <resultsPath> <destPath>').action(async (resultsPath, destPath) => {
    await resultParser.aggregateResults(resultsPath, destPath);
});

program.command('scrape <destPath>').action(async destPath => {
    await fileUtil.ensureExistsAsync(destPath);
    websiteScraper.downloadAllWebsites(destPath);
});

program
    .command('instrumentWebsite <websitePath> <analysisPath> <destPath>')
    .action(async (websitePath, analysisPath, destPath) => {
        await fileUtil.ensureExistsAsync(destPath);
        websiteInstrument.instrumentWebsite(websitePath, analysisPath, destPath);
    });

program
    .command('instrumentWebsites <websitesPath> <analysisPath> <destPath>')
    .action(async (websitesPath, analysisPath, destPath) => {
        await fileUtil.ensureExistsAsync(destPath);
        let websites = fs.readdirSync(websitesPath);
        for (let website of websites) {
            websiteInstrument.instrumentWebsite(
                path.join(websitesPath, website),
                analysisPath,
                destPath
            );
        }
    });

program.command('analyzeHTML <htmlPath> <destPath>').action(async (htmlPath, destPath) => {
    await fileUtil.ensureExistsAsync(destPath);
    await runAnalysisHTML(htmlPath, destPath);
});

program.command('analyzeWebsite <websitePath> <destPath>').action(async (websitePath, destPath) => {
    await fileUtil.ensureExistsAsync(destPath);
    let resultFileName = path.basename(websitePath);

    let results = await websiteAnalysisRunner.runWebsiteAnalysisInBrowser(websitePath);

    let globalWrites = resultParser.parseResult(results);
    fs.writeFileSync(path.join(destPath, `${resultFileName}.json`), JSON.stringify(globalWrites));
});

program
    .command('analyzeWebsites <websitesPath> <destPath>')
    .action(async (websitesPath, destPath) => {
        await fileUtil.ensureExistsAsync(destPath);

        let websites = fs.readdirSync(websitesPath);

        for (let website of websites) {
            let resultFileName = path.basename(path.join(websitesPath, website));
            let resultFilePath = path.join(destPath, `${resultFileName}.json`);
            if (fileUtil.checkFileExists(resultFilePath)) {
                console.log(`Already analyzed website: ${website}`);
                continue;
            }
            console.log(`Analyzing website: ${website}`);
            let results = await websiteAnalysisRunner.runWebsiteAnalysisInBrowser(
                path.join(websitesPath, website)
            );

            let globalWrites = resultParser.parseResult(results);
            fs.writeFileSync(resultFilePath, JSON.stringify(globalWrites));
        }
    });

// just for testing model generation algorithm from website global write results
program.command('modelWebsite <resultPath>').action(async resultPath => {
    let model = libraryDetection.generateWebsiteModel(resultPath);

    model.forEach((value, key) => {
        console.log(key);
        console.log(value.model);
    });
});

// just for testing model generation algorithm from libraries global write results
program.command('model <resultPath>').action(async resultPath => {
    let librariesModel = libraryDetection.generateLibrariesModel(resultPath);

    console.log(librariesModel.variableUsageMap.get('$'));
    console.log(librariesModel.libraryVariablesMap.get('jquery'));
});

program
    .command('detect <websiteResult> <resultMap> <destPath>')
    .action(async (websiteResultPath, librariesResultPath, destPath) => {
        await fileUtil.ensureExistsAsync(destPath);

        let results = libraryDetection.detectLibraries(websiteResultPath, librariesResultPath);
        
        let resultFilePath = path.join(destPath, `detectedLibraries_${path.basename(websiteResultPath)}`);
        fs.writeFileSync(resultFilePath, JSON.stringify(results));
    });

program
    .command('detectAll <websiteResultsPath> <resultMap> <destPath>')
    .action(async (websiteResultsFolder, librariesResultPath, destPath) => {
        await fileUtil.ensureExistsAsync(destPath);

        let websiteResultPaths = fs.readdirSync(websiteResultsFolder);

        for (const fileName of websiteResultPaths) {
            let results = libraryDetection.detectLibraries(path.join(websiteResultsFolder, fileName), librariesResultPath);
            let resultFilePath = path.join(destPath, `detectedLibraries_${fileName}`);
            fs.writeFileSync(resultFilePath, JSON.stringify(results));
        }
    });

program.parse(process.argv);

function strMapToObj(map) {
    let obj = Object.create(null);
    for (let [k,v] of map) {
        // We don’t escape the key '__proto__'
        // which can cause problems on older engines
        obj[k] = v;
    }
    return obj;
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
    if (fileUtil.checkFileExists(resultFilePath)) {
        console.log(`Already analyzed ${html}`);
    } else {
        console.log(`Analyzing ${html}`);
        let results = await analysisRunner.runAnalysisInBrowser(htmlPath);
        fs.writeFileSync(resultFilePath, JSON.stringify(results));
    }
}
