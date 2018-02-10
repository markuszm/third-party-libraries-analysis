const jsdom = require("jsdom");
const fs = require('fs');
const { JSDOM } = jsdom;

async function runAnalysisInJSDOM(pathToHtml) {
    let writes = '';
    let errors = '';

    const virtualConsole = new jsdom.VirtualConsole();
    virtualConsole.on("log", msg => writes += msg);
    virtualConsole.on("error", err => errors += err);
    
    let html = fs.readFileSync(pathToHtml, { encoding: 'utf8' });

    const dom = new JSDOM(html, { runScripts: "dangerously", virtualConsole });

    return {writes, errors};
}
exports.runAnalysisInJSDOM = runAnalysisInJSDOM;