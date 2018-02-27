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

program.command('fullAnalysis <path>').action(async destPath => {
    executed = true;
    await fileUtil.ensureExistsAsync(destPath);

    const librariesPath = path.join(destPath, 'libraries.json');
    const htmlsPath = path.join(destPath, 'htmls');
    const resultsPath = path.join(destPath, 'results');

    await fileUtil.ensureExistsAsync(htmlsPath);
    await fileUtil.ensureExistsAsync(resultsPath);

    if (fileUtil.checkFileExists(librariesPath)) {
        await embedAndRunAnalysisForAllLibraries(librariesPath, htmlsPath, resultsPath);
        await resultParser.aggregateResults(resultsPath, destPath);
    } else {
        await downloader.downloadLibraries(apiUrl, librariesPath);
        await embedAndRunAnalysisForAllLibraries(librariesPath, htmlsPath, resultsPath);
        await resultParser.aggregateResults(resultsPath, destPath);
    }
});

program.command('analyzeInstrumentedLibrary <htmlPath> <destPath>').action(async (htmlPath, destPath) => {
    executed = true;

    await fileUtil.ensureExistsAsync(destPath);
    await runAnalysisHTML(htmlPath, destPath);
});

program.command('analyzeLibrary <libraryPath> <destPath>')
    .option('-d --directory', 'Analyzes all library script files in given folder path')
    .action(async (libraryPath, destPath, options) => {
    executed = true;
    await fileUtil.ensureExistsAsync(destPath);

    const htmlsPath = path.join(destPath, 'htmls');
    const resultsPath = path.join(destPath, 'results');

    await fileUtil.ensureExistsAsync(htmlsPath);
    await fileUtil.ensureExistsAsync(resultsPath);

    if(options.directory) {
        let libraries = fs.readdirSync(libraryPath);

        for (let library of libraries) {
            let singleLibraryPath = path.join(libraryPath, library);
            await embedAndRunAnalysisForLibrary(singleLibraryPath, htmlsPath, resultsPath);
        }
    } else {
        await embedAndRunAnalysisForLibrary(libraryPath, htmlsPath, resultsPath);
    }

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
    .option('-v --verbose', 'Does not filter libaries with low confidence for debug purposes')
    .option('-d --directory', 'Detects libraries for all websites in given folder path')
    .action(async (websiteResultsPath, librariesResultPath, destPath, options) => {
        executed = true;

        await fileUtil.ensureExistsAsync(destPath);
        
        if (options.directory) {
            let websiteResultPaths = fs.readdirSync(websiteResultsPath);

            for (const fileName of websiteResultPaths) {
                let results = libraryDetection.detectLibraries(path.join(websiteResultsPath, fileName), librariesResultPath, { nested: options.nested, debug: options.verbose });
                let resultFilePath = path.join(destPath, `detectedLibraries_${fileName}`);
                fs.writeFileSync(resultFilePath, JSON.stringify(results));
            }
        } else {
            let results = libraryDetection.detectLibraries(websiteResultsPath, librariesResultPath, { nested: options.nested, debug: options.verbose });
            let resultFilePath = path.join(destPath, `detectedLibraries_${path.basename(websiteResultsPath)}`);
            fs.writeFileSync(resultFilePath, JSON.stringify(results));
        }

    });

program.parse(process.argv);

if (!executed) {
    program.help();
}

async function embedAndRunAnalysisForAllLibraries(librariesPath, htmlsPath, resultsPath) {
    await embedder.createHTMLForAllLibraries(librariesPath, htmlsPath);

    await fs.readdir(htmlsPath, async (err, items) => {
        for (let item of items) {
            let htmlPath = path.join(htmlsPath, item);
            await runAnalysisHTML(htmlPath, resultsPath);
        }
    });
}

async function embedAndRunAnalysisForLibrary(libraryPath, htmlsPath, resultsPath) {
    let htmlPath = await embedder.createHTMLForLibrary(libraryPath, htmlsPath);
    await runAnalysisHTML(htmlPath, resultsPath);
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
        fs.writeFileSync(resultFilePath + '.err', JSON.stringify(results.errors));
    }
}
