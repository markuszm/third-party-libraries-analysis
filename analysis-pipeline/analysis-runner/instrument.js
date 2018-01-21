const jalangi = require('jalangi2');

function instrumentCode(code) {
    return jalangi.instrumentString(code, {});
}

exports.instrumentCode = instrumentCode;
