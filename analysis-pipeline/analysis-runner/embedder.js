const fs = require('fs');
const instrument = require('./instrument');
const template = require('./template').template;
const path = require('path');
const util = require('util');

const Mustache = require('mustache');

async function createHTMLs(pathToLibraries, destination) {
    let librariesJson = fs.readFileSync(pathToLibraries, { encoding: 'utf8' });

    let libraries = JSON.parse(librariesJson);

    let underscoreCode = loadUnderscore();
    let analysisCode = loadAnalysisCode();
    let jalangiEnv = loadJalangiEnv();

    let htmls = [];

    for (const library of libraries) {
        const htmlPath = path.join(destination, `${library.name}.html`);
        try {
            fs.statSync(htmlPath);
            // file already exists - skip
            console.log(`HTML already exists: ${library.name}`);
        } catch(err) {
            instrumentAndEmbed(library, htmlPath, underscoreCode, analysisCode, jalangiEnv);
        }
    }
}

function instrumentAndEmbed(library, htmlPath, underscoreCode, analysisCode, jalangiEnv) {
    let code = library.js;
    // checks for size of library - instrumentation takes too much memory 
    if(getBinarySize(code) > 15000000) {
        console.log(`Skipping library ${library.name}, file size too large for instrumentation`);    
        return;
    }
    console.log(`Instrumenting ${library.name}`);
    let instrumentedCode = instrument.instrumentCode(code).code;
    console.log(`Creating HTML for ${library.name}`);
    let html = Mustache.render(template, {
        instrumentedCode: instrumentedCode,
        underscore: underscoreCode,
        globalWritesAnalysis: analysisCode,
        jalangiEnv: jalangiEnv
    });

    console.log(`Writing HTML for ${library.name}`);
    fs.writeFileSync(htmlPath, html);
}

function getBinarySize(string) {
    return Buffer.byteLength(string, 'utf8');
}

function loadUnderscore() {
    return fs.readFileSync('node_modules/underscore/underscore-min.js', { encoding: 'utf8' });
}

function loadAnalysisCode() {
    return fs.readFileSync('globalWritesAnalysis.js', { encoding: 'utf8' });
}

function loadJalangiEnv() {
    let esotope = fs.readFileSync('node_modules/jalangi2/node_modules/esotope/esotope.js', { encoding: 'utf8' });
    let acorn = fs.readFileSync('node_modules/jalangi2/node_modules/acorn/dist/acorn.js', { encoding: 'utf8' });
    let constants = fs.readFileSync('node_modules/jalangi2/src/js/Constants.js', { encoding: 'utf8' });
    let config = fs.readFileSync('node_modules/jalangi2/src/js/Config.js', { encoding: 'utf8' });
    let astUtil = fs.readFileSync('node_modules/jalangi2/src/js/instrument/astUtil.js', { encoding: 'utf8' });
    let esnstrument = fs.readFileSync('node_modules/jalangi2/src/js/instrument/esnstrument.js', { encoding: 'utf8' });
    let iidToLocation = fs.readFileSync('node_modules/jalangi2/src/js/runtime/iidToLocation.js', { encoding: 'utf8' });
    let analysis = fs.readFileSync('node_modules/jalangi2/src/js/runtime/analysis.js', { encoding: 'utf8' });
    return `${esotope} \n ${acorn} \n ${constants} \n ${config} \n ${astUtil} \n ${esnstrument} \n ${iidToLocation} \n ${analysis} \n`;
}

exports.createHtmlJson = createHTMLs;