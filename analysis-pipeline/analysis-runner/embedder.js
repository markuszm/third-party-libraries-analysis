const fs = require('fs');
const instrument = require('./instrument');
const template = require('./template').template;

const Mustache = require('mustache');

async function createHTMLs(pathToLibraries) {
    let librariesJson = await fs.readFileSync(pathToLibraries);

    let libraries = JSON.parse(librariesJson);
    
    let underscoreCode = loadUnderscore();
    let analysisCode = loadAnalysisCode();
    let jalangiEnv = loadJalangiEnv();

    let htmls = [];

    for (const library of libraries) {
        let code = library.js;
        let instrumentedCode = instrument.instrumentCode(code).code;
        let html = Mustache.render(template, {instrumentedCode: instrumentedCode, 
            underscore: underscoreCode, 
            globalWritesAnalysis: analysisCode,
            jalangiEnv: jalangiEnv })
        
        console.log(`Embedded: ${library.name}`);
        fs.writeFileSync(`./htmls/${library.name}.html`, html);     
    }
}

function loadUnderscore() {
    return fs.readFileSync('node_modules/underscore/underscore-min.js', {encoding: 'utf8'});
}

function loadAnalysisCode() {
    return fs.readFileSync('globalWritesAnalysis.js', {encoding: 'utf8'});
}

function loadJalangiEnv() {
    let esotope = fs.readFileSync('node_modules/jalangi2/node_modules/esotope/esotope.js', {encoding: 'utf8'});
    let acorn = fs.readFileSync('node_modules/jalangi2/node_modules/acorn/dist/acorn.js', {encoding: 'utf8'});
    let constants = fs.readFileSync('node_modules/jalangi2/src/js/Constants.js', {encoding: 'utf8'});
    let config = fs.readFileSync('node_modules/jalangi2/src/js/Config.js', {encoding: 'utf8'});
    let astUtil = fs.readFileSync('node_modules/jalangi2/src/js/instrument/astUtil.js', {encoding: 'utf8'});
    let esnstrument = fs.readFileSync('node_modules/jalangi2/src/js/instrument/esnstrument.js', {encoding: 'utf8'});
    let iidToLocation = fs.readFileSync('node_modules/jalangi2/src/js/runtime/iidToLocation.js', {encoding: 'utf8'});
    let analysis = fs.readFileSync('node_modules/jalangi2/src/js/runtime/analysis.js', {encoding: 'utf8'});
    return `${esotope} \n ${acorn} \n ${constants} \n ${config} \n ${astUtil} \n ${esnstrument} \n ${iidToLocation} \n ${analysis} \n`;
}

exports.createHtmlJson = createHTMLs;