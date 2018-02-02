const path = require('path');
const fs = require('fs');

async function aggregateResults(resultsPath, destPath) {
    await fs.readdir(resultsPath, async (err, items) => {
        let resultsMap = [];
        let errors = [];
        for (let item of items) {
            let resultFilePath = path.join(resultsPath, item);

            let parsedResult = parseResultFile(resultFilePath);
            if (parsedResult) {
                if(parsedResult.error) {
                    errors.push({name: item, result: parsedResult});
                } else {
                    resultsMap.push({name: parsedResult.name, result: parsedResult.result});
                }
            }
        }

        fs.writeFileSync(path.join(destPath, 'map.json'), JSON.stringify(resultsMap));
        fs.writeFileSync(path.join(destPath, 'errors.json'), JSON.stringify(errors));
    });
}

function parseResultFile(resultFilePath) {
    if (path.extname(resultFilePath) !== '.json') {
        return null;
    }

    let libraryName = path.basename(resultFilePath).replace('.html.json', '');

    let contents = fs.readFileSync(resultFilePath, { encoding: 'utf8' });
    let result = JSON.parse(contents);
    if (result.errors.includes('Error: Timeout') || result.writes === '') {
        return {error: true, name: libraryName, result: result};
    }

    try {
        let globalWrites = parseResult(result);
        if (globalWrites) {
            return { error: false, name: libraryName, result: globalWrites };
        } else {
            return {error: false, name: libraryName, result: {}};
        }
    } catch (error) {
        console.log(
            `Error parsing global writes result for library: ${libraryName} \nresult: ${error} `
        );
        return {error: true, name: libraryName, result: error};
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
