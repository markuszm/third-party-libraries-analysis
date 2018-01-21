const fs = require('fs');

function ensureExistsAsync(path) {
    return new Promise((resolve, reject) => {
        fs.mkdir(path, (error, result) => {
            if (error && error.code !== 'EEXIST') {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

function checkFileExists(path) {
    try {
        fs.statSync(path);
        return true;
    } catch (err) {
        return false;
    }
}

exports.ensureExistsAsync = ensureExistsAsync;
exports.checkFileExists = checkFileExists;
