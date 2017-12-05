const downloader = require('library-downloader');
const program = require('commander');
const path = require('path');

const apiUrl = 'https://api.cdnjs.com/libraries';

program
    .arguments('<path>')
    .action(function (folderPath) {
        downloader.downloadLibrariesRx(apiUrl, path.join(folderPath, 'libraries.json'))
    })
    .parse(process.argv);

