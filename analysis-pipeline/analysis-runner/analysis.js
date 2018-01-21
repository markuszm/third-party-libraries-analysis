var fs = require('fs');
var path = require('path');
var rmdir = require('rimraf');
var jalangi = require('jalangi2');

var tempFolder = './tmp';

function analyzeCodeFile(code, analysisFiles) {
    let instrumentedCode = jalangi.instrumentString(code, {});
    let instrumentedCodePath = writeTempInstrumentationFile(instrumentedCode.code);
    jalangi.analyze(instrumentedCodePath, analysisFiles)
        .then(
            obj => {
                console.log(obj.stdout);
                cleanupTempData();
            }
        )
        .catch(console.error);
}

function writeTempInstrumentationFile(instrumentedCode) {
    var filePath = path.join(tempFolder, 'code.js');
    if (fs.existsSync(filePath)) {
        cleanupTempData();
    }
    fs.mkdirSync(tempFolder);
    fs.closeSync(fs.openSync(filePath, 'w'));
    console.log(filePath);
    fs.writeFileSync(filePath, instrumentedCode);
    return filePath;
}

function cleanupTempData() {
    rmdir.sync(tempFolder);
}

exports.analyzeCodeFile = analyzeCodeFile;