const jalangi = require('jalangi2');

function instrumentCode(websiteDir, analysisFile, dest) {
    let options = {
        inputFiles: [websiteDir],
        analysis: [analysisFile],
        outputDir: dest,
        inlineIID: true,
        inlineJalangi: true,
        instrumentInline: true
    };
    return jalangi.instrumentDir(options);
}

exports.instrumentWebsite = instrumentCode;
