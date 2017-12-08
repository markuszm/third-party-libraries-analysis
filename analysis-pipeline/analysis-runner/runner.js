const puppeteer = require('puppeteer');
const fs = require('fs');

async function runAnalysisInBrowser(pathToHtml) {
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();

    let html = fs.readFileSync(pathToHtml, {encoding: 'utf8'});
    
    let results = [];

    page.on('console', msg => {
        console.log(msg);
        results.push(msg.text);
    });

    await page.goto(`data:text/html,${html}`, { timeout: 90000, waitUntil: 'load' });
    
    await browser.close();

    return results;
}

exports.runAnalysisInBrowser = runAnalysisInBrowser;