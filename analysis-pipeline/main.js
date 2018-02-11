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
const websiteBlacklist = ['facebook.com', 'outlook.live.com', 'reddit.com', 'sohu.com'];

let executed = false;

program.command('analyzeAllLibraries <path>').action(async folderPath => {
    executed = true;
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

program.command('analyzeLibrary <htmlPath> <destPath>').action(async (htmlPath, destPath) => {
    executed = true;

    await fileUtil.ensureExistsAsync(destPath);
    await runAnalysisHTML(htmlPath, destPath);
});

program.command('aggregate <resultsPath> <destPath>').action(async (resultsPath, destPath) => {
    executed = true;
    await resultParser.aggregateResults(resultsPath, destPath);
});

program.command('scrape <destPath>').action(async destPath => {
    executed = true;
    await fileUtil.ensureExistsAsync(destPath);
    websiteScraper.downloadAllWebsites(destPath);
});

program
    .command('instrumentWebsite <websitesPath> <analysisPath> <destPath>')
    .option('-d --directory', 'Instruments all websites in given folder path')
    .action(async (websitePath, analysisPath, destPath, options) => {
        executed = true;

        if (options.directory) {
            await fileUtil.ensureExistsAsync(destPath);
            let websites = fs.readdirSync(websitePath);
            for (let website of websites) {
                websiteInstrument.instrumentWebsite(
                    path.join(websitePath, website),
                    analysisPath,
                    destPath
                );
            }
        } else {
            await fileUtil.ensureExistsAsync(destPath);
            websiteInstrument.instrumentWebsite(websitePath, analysisPath, destPath);
        }
    });



program
    .command('analyzeWebsite <websitesPath> <destPath>')
    .option('-d --directory', 'Analyzes all websites in given folder path')
    .action(async (websitesPath, destPath, options) => {
        executed = true;

        await fileUtil.ensureExistsAsync(destPath);

        if (options.directory) {
            let websites = fs.readdirSync(websitesPath);

            for (let website of websites) {
                let websitePath = path.join(websitesPath, website);
                let resultFileName = path.basename(path.join(websitePath, website));
                let resultFilePath = path.join(destPath, `${resultFileName}.json`);

                await runWebsiteAnalysis(websitePath, resultFilePath);
            }
        } else {
            let resultFileName = path.basename(websitesPath);
            let resultFilePath = path.join(destPath, `${resultFileName}.json`);

            await runWebsiteAnalysis(websitesPath, resultFilePath);
        }

    });

// just for testing model generation algorithm
program
    .command('model <resultPath>')
    .option('-w --website', 'Generate model for website')
    .option('-l --library', 'Generate model for library')
    .action(async (resultPath, options) => {
        executed = true;

        if (options.website && options.library || (!options.website && !options.library)) {
            console.error('Specify at least one and only one option!');
        }

        if (options.library) {
            let librariesModel = libraryDetection.generateLibrariesModel(resultPath);

            console.log(librariesModel.variableUsageMap.get('$'));
            console.log(librariesModel.libraryVariablesMap.get('jquery'));
        }

        if (options.website) {
            let model = libraryDetection.generateWebsiteModel(resultPath);

            model.forEach((value, key) => {
                console.log(key);
                console.log(value.model);
            });
        }
    });

program
    .command('detect <websiteResultPath> <resultMap> <destPath>')
    .option('-n --nested', 'Searches for nested libraries (increases false positives)')
    .option('-d --debug', 'Does not filter libaries with low confidence for debug purposes')
    .option('-f --directory', 'Detects libraries for all websites in given folder path')
    .action(async (websiteResultsPath, librariesResultPath, destPath, options) => {
        executed = true;

        await fileUtil.ensureExistsAsync(destPath);
        
        if (options.directory) {
            let websiteResultPaths = fs.readdirSync(websiteResultsPath);

            for (const fileName of websiteResultPaths) {
                let results = libraryDetection.detectLibraries(path.join(websiteResultsPath, fileName), librariesResultPath, { nested: options.nested, debug: options.debug });
                let resultFilePath = path.join(destPath, `detectedLibraries_${fileName}`);
                fs.writeFileSync(resultFilePath, JSON.stringify(results));
            }
        } else {
            let results = libraryDetection.detectLibraries(websiteResultsPath, librariesResultPath, { nested: options.nested, debug: options.debug });
            let resultFilePath = path.join(destPath, `detectedLibraries_${path.basename(websiteResultsPath)}`);
            fs.writeFileSync(resultFilePath, JSON.stringify(results));
        }

    });

program.parse(process.argv);

if (!executed) {
    program.help();
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

async function runWebsiteAnalysis(websitePath, resultFilePath) {
    const website = path.basename(websitePath);

    if (websiteBlacklist.includes(website)) {
        console.log(`Website ${website} is blacklisted -> skipping`);
        return;
    }
    if (fileUtil.checkFileExists(resultFilePath)) {
        console.log(`Already analyzed website: ${website}`);
        return;
    }
    console.log(`Analyzing website: ${website}`);
    let results = await websiteAnalysisRunner.runWebsiteAnalysisInBrowser(websitePath);

    try {
        let globalWrites = resultParser.parseResult(results);
        fs.writeFileSync(resultFilePath, JSON.stringify(globalWrites));
    } catch (error) {
        console.log(`no global writes for ${website} -> issues in analysis`)
    }
}
