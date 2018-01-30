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

    let variableUsageMap = new Map();
    let libraryVariablesMap = new Map();

    for (const resultPair of resultPairs) {
        let libraryName = resultPair.name;
        modelGenerator.transformLibraryResults(resultPair.result, variableUsageMap, libraryVariablesMap, libraryName);
    }
    return { variableUsageMap, libraryVariablesMap };
}

function detectLibraries(websiteResultPath, librariesResultPath) {
    // map of variable hierarchies (variable -> (Libraryname -> Function/Object Tree Hierarchy ))
    let librariesModel = generateLibrariesModel(librariesResultPath);

    // function/object tree hierarchies of global writes detected on website
    let websiteModel = generateWebsiteModel(websiteResultPath);

    // pretty print trees for debug purpose
    // websiteModel.forEach((objectHierarchy, variableName) => {
    //     console.log(variableName);
    //     prettyPrintTree(objectHierarchy, '', true);
    //     console.log();
    // });

    let detectedLibraries = new Map();

    websiteModel.forEach((objectHierarchy) => {
        objectHierarchy.walk({ strategy: 'post' }, node => {
            let variable = getIdOfNode(node);

            // when variable is not root in any library tree then continue
            if (!librariesModel.variableUsageMap.has(variable)) return;


            let libraryList = librariesModel.variableUsageMap.get(variable);
            let seenLibraries = [];

            // todo: store library and variable as seen then later compare trees based on library forest
            for (let library of libraryList) {
                let libraryTree = librariesModel.libraryVariablesMap.get(library).get(variable);
                let similarity = treeComparer.compareTreeWithTreeDistance(libraryTree, node);
                seenLibraries.push({
                    library: library,
                    confidence: similarity
                });
            }

            if (!detectedLibraries.has(variable)) {
                detectedLibraries.set(variable, seenLibraries);
            } else {
                let oldList = detectedLibraries.get(variable);
                for (const otherLib of seenLibraries) {
                    if (!oldList.find((lib) => lib.library === otherLib.library && lib.confidence === otherLib.confidence)) {
                        oldList.push(otherLib);
                    }
                }
            }
        });
    });

    sortDetectedLibraries(detectedLibraries);

    return detectedLibraries;
}

function sortDetectedLibraries(detectedLibraries) {
    for (let libraries of detectedLibraries.values()) {
        libraries.sort((a, b) => {
            let confidenceA = parseFloat(a.confidence);
            let confidenceB = parseFloat(b.confidence);
            if (confidenceA > confidenceB) {
                return -1;
            }
            if (confidenceA < confidenceB) {
                return 1;
            }

            return 0;
        });
    }
}

function prettyPrintTree(node, indent, last) {
    console.log(indent + '- ' + node.model.id);
    indent += last ? '   ' : '|  ';

    for (let i = 0; i < node.children.length; i++) {
        prettyPrintTree(node.children[i], indent, i == node.children.length - 1);
    }
}



exports.prettyPrintTree = prettyPrintTree;
exports.detectLibraries = detectLibraries;
exports.generateLibrariesModel = generateLibrariesModel;
exports.generateWebsiteModel = generateWebsiteModel;
