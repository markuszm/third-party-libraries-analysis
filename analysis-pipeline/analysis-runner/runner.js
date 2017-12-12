const puppeteer = require('puppeteer');
const fs = require('fs');
const express = require('express');

async function runAnalysisInBrowser(pathToHtml) {
    let html = fs.readFileSync(pathToHtml, { encoding: 'utf8' });

    const app = express()

    app.get('/', (req, res) => res.send(html))

    let server = app.listen(3000, () => console.log('Analysis listening on port 3000!'))

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let results = "";

    page.on('console', msg => {
        results += msg.text;
    });

    page.on('error', err => {
        results += err;
    });

    page.on('pageerror', pageerr => {
        results += pageerr;
    })

    try {
        await page.goto(`http://localhost:3000`, {timeout: 60000});
    } catch(err) {
        results += `ERROR - TIMEOUT`
    } finally {
        await browser.close();
        await server.close();
    
        return results;
    }

}

exports.runAnalysisInBrowser = runAnalysisInBrowser;