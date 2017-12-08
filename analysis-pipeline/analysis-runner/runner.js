const puppeteer = require('puppeteer');
const fs = require('fs');
const express = require('express');

async function runAnalysisInBrowser(pathToHtml) {
    let html = fs.readFileSync(pathToHtml, {encoding: 'utf8'});
    
    const app = express()
       
    app.get('/', (req, res) => res.send(html))
    
    let server = app.listen(3000, () => console.log('Example app listening on port 3000!'))

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    let results = "";

    page.on('console', msg => {
        results = msg.text;
    });

    await page.goto(`http://localhost:3000`, { waitUntil: 'load' });
    
    await browser.close();

    await server.close();

    return results;
}

exports.runAnalysisInBrowser = runAnalysisInBrowser;