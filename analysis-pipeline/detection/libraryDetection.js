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

    // pretty print trees for debug purpose
    // websiteModel.forEach((objectHierarchy, variableName) => {
    //     console.log(variableName);
    //     prettyPrintTree(objectHierarchy, '', true);
    //     console.log();
    // });

    let detectedLibraries = new Map();

    websiteModel.forEach((objectHierarchy) => {
        objectHierarchy.walk({ strategy: 'post' }, node => {
            let id = getIdOfNode(node);

            if (librariesModel.has(id)) {
                let libraryMap = librariesModel.get(id);
                let seenLibraries = [];

                for (let [library, tree] of libraryMap) {
                    let similarity = treeComparer.compareTreeWithTreeDistance(tree, node);
                    seenLibraries.push({
                        library: library,
                        confidence: similarity
                    });
                }

                seenLibraries.sort((a, b) => {
                    let confidenceA = a.confidence;
                    let confidenceB = b.confidence;
                    if (confidenceA > confidenceB) {
                        return -1;
                    }
                    if (confidenceA < confidenceB) {
                        return 1;
                    }

                    return 0;
                });

                if (!detectedLibraries.has(id)) {
                    detectedLibraries.set(id, seenLibraries);
                } else {
                    let oldList = detectedLibraries.get(id);
                    for (const otherLib of seenLibraries) {
                        if(!oldList.find((lib) => lib.library === otherLib.library && lib.confidence === otherLib.confidence)) {
                            oldList.push(otherLib);
                        }
                    }
                }
            }
        });
    });

    return detectedLibraries;
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
