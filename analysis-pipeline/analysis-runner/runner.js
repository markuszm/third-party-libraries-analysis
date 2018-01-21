const puppeteer = require('puppeteer');
const fs = require('fs');
const express = require('express');

async function runAnalysisInBrowser(pathToHtml) {
    let html = fs.readFileSync(pathToHtml, { encoding: 'utf8' });

    const app = express();

    app.get('/', (req, res) => res.send(html));

    let randomPort = Math.round(Math.random() * 65535);
    let server = app.listen(randomPort, () => console.log(`Analysis listening on port ${randomPort}!`));

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let writes = '';

    let errors = '';

    page.on('console', msg => {
        writes += msg.text; 
    });

    page.on('error', err => {
        errors += err;
    });

    page.on('pageerror', pageerr => {
        errors += pageerr;
    });

    try {
        await page.goto(`http://localhost:${randomPort}`, {timeout: 300000});
    } catch(err) {
        errors += 'Error: Timeout';
    } finally {
        await browser.close();
        await server.close();
    
        return {writes, errors};
    }

}

exports.runAnalysisInBrowser = runAnalysisInBrowser;