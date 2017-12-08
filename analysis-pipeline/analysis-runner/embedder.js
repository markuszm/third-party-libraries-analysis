const fs = require('fs');
const instrument = require('./instrument');
const template = require('./template').template;

const Mustache = require('mustache');

function createHTMLs(pathToLibraries) {
    let librariesJson = fs.readFileSync(pathToLibraries);

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

        htmls.push({name: library.name, html: html});           
    }

    return JSON.stringify(htmls);
}

function loadUnderscore() {
    return fs.readFileSync('node_modules/underscore/underscore-min.js');
}

function loadAnalysisCode() {
    return fs.readFileSync('globalWritesAnalysis.js');
}

function loadJalangiEnv() {
    let esotope = fs.readFileSync('node_modules/jalangi2/node_modules/esotope/esotope.js');
    let acorn = fs.readFileSync('node_modules/jalangi2/node_modules/acorn/dist/acorn.js');
    let constants = fs.readFileSync('node_modules/jalangi2/src/js/Constants.js');
    let config = fs.readFileSync('node_modules/jalangi2/src/js/Config.js');
    let astUtil = fs.readFileSync('node_modules/jalangi2/src/js/instrument/astUtil.js');
    let esnstrument = fs.readFileSync('node_modules/jalangi2/src/js/instrument/esnstrument.js');
    let iidToLocation = fs.readFileSync('node_modules/jalangi2/src/js/runtime/iidToLocation.js');
    let analysis = fs.readFileSync('node_modules/jalangi2/src/js/runtime/analysis.js');
    return `${esotope} \n ${acorn} \n ${constants} \n ${config} \n ${astUtil} \n ${esnstrument} \n ${iidToLocation} \n ${analysis} \n`;
}

exports.createHtmlJson = createHTMLs;