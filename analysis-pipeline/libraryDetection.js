const modelGenerator = require('./modelGenerator');
const treeComparer = require('./treeComparer');

const fs = require('fs');

function getIdOfNode(node) {
    return node.model.id;
} 

function generateWebsiteModel(resultPath) {
    let contents = fs.readFileSync(resultPath, { encoding: 'utf8' });
    let result = JSON.parse(contents);

    let model = modelGenerator.transformWebsiteResults(result);
    return model;
}

function generateLibrariesModel(resultPath) {
    let contents = fs.readFileSync(resultPath, { encoding: 'utf8' });
    let resultPairs = JSON.parse(contents);

    let variableHierarchies = new Map();

    for (const resultPair of resultPairs) {
        let libraryName = resultPair.name;
        modelGenerator.transformLibraryResults(resultPair.result, variableHierarchies, libraryName);
    }
    return variableHierarchies;
}

function detectLibraries(websiteResultPath, librariesResultPath) {
    // map of variable hierarchies (variable -> (Libraryname -> Function/Object Tree Hierarchy ))
    let librariesModel = generateLibrariesModel(librariesResultPath);
        
    // function/object tree hierarchies of global writes detected on website
    let websiteModel = generateWebsiteModel(websiteResultPath);

    let detectedLibraries = [];

    websiteModel.forEach((objectHierarchy, variableName) => {
        objectHierarchy.walk({strategy: 'post'}, (node) => {
            let id = getIdOfNode(node);
            if(librariesModel.has(id)) {
                let libraryMap = librariesModel.get(id);
                let seenLibraries = [];
                libraryMap.forEach((tree, library) => {
                    let similarity = treeComparer.compareTrees(tree, node);
                    seenLibraries.push({variable: variableName, library: library, confidende: similarity});
                });
                // TODO: sort seenLibraries after similarity
                detectedLibraries.push(seenLibraries);
            }
        })
    });

    console.log(detectedLibraries);
}

exports.detectLibraries = detectLibraries;
exports.generateLibrariesModel = generateLibrariesModel;
exports.generateWebsiteModel = generateWebsiteModel;