const puppeteer = require('puppeteer');
const fs = require('fs');
const express = require('express');

const TIMEOUT = 5 * 60 * 1000;

async function runAnalysisInBrowser(pathToHtml) {
    let html = fs.readFileSync(pathToHtml, { encoding: 'utf8' });

    const app = express();

    app.get('/', (req, res) => res.send(html));

    let randomPort = Math.round(Math.random() * 65535);
    let server = app.listen(randomPort, () =>
        console.log(`Analysis listening on port ${randomPort}!`)
    );

    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});

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
        console.log('navigating to analysis');
        await page.goto(`http://localhost:${randomPort}`, { timeout: TIMEOUT });
        console.log('analysis finished');
    } catch (err) {
        console.log('analysis timed out');
        errors += 'Error: Timeout';
    } finally {
        console.log('triggering endExcecution of analysis');
        await page.evaluate('J$.analysis.endExecution()');

        console.log('closing all resources');
        await browser.close();
        await server.close();
        return { writes, errors };
    }
}

exports.runAnalysisInBrowser = runAnalysisInBrowser;
