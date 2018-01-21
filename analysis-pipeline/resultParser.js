const path = require('path');
const fs = require('fs');

async function aggregateResults(resultsPath, destPath) {
    await fs.readdir(resultsPath, async (err, items) => {
        let resultsMap = [];
        for (let item of items) {
            let resultFilePath = path.join(resultsPath, item);

            let parsedResult = parseResultFile(resultFilePath);
            if(parsedResult) {
                resultsMap.push(parsedResult);
            }
        }

        fs.writeFileSync(path.join(destPath, 'map.json'), JSON.stringify(resultsMap));
    });
}

function parseResultFile(resultFilePath) {
    if (path.extname(resultFilePath) !== '.json') {
        return null;
    }

    let contents = fs.readFileSync(resultFilePath, { encoding: 'utf8' });
    let result = JSON.parse(contents);
    if (result.errors.includes('Error') || result.errors.includes('ERROR')) {
        return null;
    }

    let libraryName = path.basename(resultFilePath).split('.')[0];

    try {
        let globalWrites = parseResult(result);
        if(globalWrites) {
            return { name: libraryName, result: globalWrites };
        } else {
            return null;
        }
    } catch (error) {
        console.log(`Error parsing global writes result for library: ${libraryName} \nresult: ${result} `);
        return null;
    }
}

function parseResult(result) {
    let globalWritesString = result.writes.split('global writes:')[1];
    let endIndex = globalWritesString.lastIndexOf('}') + 1;
    globalWritesString = globalWritesString.substring(0, endIndex);

    let globalWrites = JSON.parse(globalWritesString);

    // skip libraries that have no global writes
    if (Object.keys(globalWrites).length === 0) {
        return null;
    }

    return globalWrites;
}

exports.aggregateResults = aggregateResults;
exports.parseResult = parseResult;