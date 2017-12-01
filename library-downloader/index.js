const request = require('request-promise');
const fs = require('fs');

async function downloadLibraries(url, path) {
    let libraryPairs = [];
    let options = {
        uri: url,
        json: true // Automatically parses the JSON string in the response
    };
    let response = await request(options);
    let libraryList = response.results;
    console.log(`Number of libaries to download: ${libraryList.length}`);
    for(let library of libraryList) {
        try {
            let jsFile = await downloadLibrary(library.latest);
            console.log(library.name);
            libraryPairs.push({name: library.name, js: jsFile});
        }
        catch(err) {
            console.error(`Could not load library ${library.name} with error: ${err}`);
        }
    }
    await fs.writeFile(path, JSON.stringify(libraryPairs));
}

function downloadLibrary(url) {
    return request(url);
}

exports.downloadLibraries = downloadLibraries; 