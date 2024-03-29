const puppeteer = require('puppeteer');
const express = require('express');

const TIMEOUT = 15 * 60 * 1000;

async function runAnalysisInBrowser(websiteFolder) {
    const app = express();

    app.use(express.static(websiteFolder));

    let server = app.listen(3001, () => console.log('Analysis listening on port 3001!'));

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
    })

    try {
        console.log('navigating to analysis');
        await page.goto('http://localhost:3001', { timeout: TIMEOUT });
        console.log('analysis finished');
    } catch (err) {
        console.log('analysis timed out');
        errors += 'Error: Timeout';
    } finally {
        console.log('triggering endExcecution of analysis');
        page.evaluate('J$.analysis.endExecution()');
        await page.waitFor(30000);

        if (writes.includes('"$": "Function"')) {
            console.log('trying to detect jQuery version');
            try {
                let promise = page.evaluate('$.fn.jquery')
                await page.waitFor(30000);
                promise.then(result => console.log(result));
            } catch (err) {
                console.log('Website is not using jQuery');
            }
        } else {
            console.log('Website is not using jQuery');
        }

        console.log('closing all resources');
        await browser.close();
        await server.close();
        return { writes, errors };
    }
}

exports.runWebsiteAnalysisInBrowser = runAnalysisInBrowser;
