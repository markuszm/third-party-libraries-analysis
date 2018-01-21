const request = require('request-promise-native');
const fs = require('fs');

async function downloadLibraries(url, path) {
    let libraryPairs = [];
    let options = {
        uri: url,
        json: true // Automatically parses the JSON string in the response
    };

    let amountOfFailedDownloads = 0;
    let currentIndex = 0;

    let response = await request(options);
    let libraryList = response.results;
    console.log(`Number of libaries to download: ${libraryList.length}`);

    for (let library of libraryList) {
        try {
            if (!library.latest.endsWith('.js')) continue;
            currentIndex++;
            let jsFile = await downloadLibrary(library.latest);
            console.log(`Downloaded: ${library.name} - ${currentIndex}/${libraryList.length}`);
            libraryPairs.push({ name: library.name, js: jsFile });
        } catch (err) {
            amountOfFailedDownloads++;
            console.error(`Could not load library ${library.name} with error: ${err}`);
        }
    }
    fs.writeFileSync(path, JSON.stringify(libraryPairs));
    console.log(`Amount of failed downloads: ${amountOfFailedDownloads}`);
}

function downloadLibrary(url) {
    return request(url);
}

exports.downloadLibraries = downloadLibraries;
