const request = require('request-promise-native');
const fs = require('fs');
const Rx = require('@reactivex/rxjs');

function downloadLibraries(url, path) {
    let options = {
        uri: url,
        json: true // Automatically parses the JSON string in the response
    };

    Rx.Observable.fromPromise(request(options))
        .do(response => console.log(`Number of libaries to download: ${response.results.length}`))
        .pluck('results')
        .mergeAll() // transform results list to single Observables
        .filter(library => library.latest.endsWith('.js'))
        .concatMap(library => downloadLibrary(library)) // subscribe to each inner download observable in order
        .toArray()
        // ToDo: remove subscription here and just return observable
        .subscribe(
            libraryPairs => {
                fs.writeFile(path, JSON.stringify(libraryPairs), err => {
                    if (err) {
                        console.error(`Error writing the json: ${err}`);
                    }
                });
            },
            error => console.error(`Stopped with error: ${error}`),
            () => console.log('Finished')
        );
}

function downloadLibrary(library) {
    return Rx.Observable.of(library)
        .retry(3)
        .pluck('latest')
        .switchMap(url => request(url)) // subscribe to inner request promise and switch to the result observable
        .do(() => console.log(`Downloaded: ${library.name}`))
        .map(response => {
            return { name: library.name, js: response };
        });
}

exports.downloadLibraries = downloadLibraries;
