const reactive = require('./reactive');
const promise = require('./promise');

exports.downloadLibraries = promise.downloadLibraries; 
exports.downloadLibrariesRx = reactive.downloadLibraries;