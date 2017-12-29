const puppeteer = require('puppeteer');
const fs = require('fs');
const express = require('express');

async function runAnalysisInBrowser(websiteFolder) {
    const app = express()

    app.use(express.static(websiteFolder));
    
    let server = app.listen(3001, () => console.log('Analysis listening on port 3001!'))

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let writes = "";

    let errors = "";

    page.on('console', msg => {
        writes += msg.text;
    });

    // page.on('error', err => {
    //     errors += err;
    // });

    // page.on('pageerror', pageerr => {
    //     errors += pageerr;
    // })

    try {
        await page.goto(`http://localhost:3001`, {timeout: 300000});
    } catch(err) {
        errors += `Error: Timeout`
    } finally {
        await page.evaluate('J$.analysis.endExecution()');
        console.log(await page.evaluate('$.fn.jquery'))
        await browser.close();
        await server.close();
    
        return {writes, errors};
    }

}

exports.runWebsiteAnalysisInBrowser = runAnalysisInBrowser;