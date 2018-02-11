const modelGenerator = require('./modelGenerator');
const treeComparer = require('./treeComparer');

const fs = require('fs');

const MIN_CONFIDENCE = 75.0;

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
        modelGenerator.transformLibraryResults(
            resultPair.result,
            variableUsageMap,
            libraryVariablesMap,
            libraryName
        );
    }
    return { variableUsageMap, libraryVariablesMap };
}

function detectLibraries(websiteResultPath, librariesResultPath, options) {
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

    console.log('Created library model and website model');

    let detectedLibraries = [];

    let seenLibraries = new Set();
    let matchedNodesMap = new Map();

    websiteModel.forEach(tree => {
        let rootVariable = getIdOfNode(tree);
        if (!librariesModel.variableUsageMap.has(rootVariable)) {
            // if looking for nested libraries it DFS tree to compare variables down there
            if (options.nested) {
                tree.walk({ strategy: 'post' }, node => {
                    let variable = getIdOfNode(node);
    
                    // when variable is not root of any library tree then continue
                    if (!librariesModel.variableUsageMap.has(variable)) return;
    
                    let libraryList = librariesModel.variableUsageMap.get(variable);
                    libraryList.forEach(library => seenLibraries.add(library));
                    matchedNodesMap.set(variable, node);
                });
            }
        } else {
            let libraryList = librariesModel.variableUsageMap.get(rootVariable);
            libraryList.forEach(library => seenLibraries.add(library));
            matchedNodesMap.set(rootVariable, tree);
        }
    });

    console.log('Walked through the website trees');

    for (let library of seenLibraries) {
        let libraryForestMap = librariesModel.libraryVariablesMap.get(library);
        let similarityPercentage = 0;
        let treeCount = 0;
        for (const [rootId, tree] of libraryForestMap) {
            let similarity = 0;
            if (matchedNodesMap.has(rootId)) {
                similarity = parseFloat(
                    treeComparer.compareTreeWithTreeDistance(tree, matchedNodesMap.get(rootId))
                );
            }
            similarityPercentage += similarity;
            treeCount++;
        }
        let averageSimilarity = similarityPercentage / treeCount;

        let nodeIds = Array.from(libraryForestMap.keys()).sort().toString();

        // check if there is already a library that has same node ids but different confidence -> replace if higher confidence
        let indexOtherLibrary = detectedLibraries.findIndex(library => library.nodeIds === nodeIds);
        if (indexOtherLibrary >= 0) {
            if (detectedLibraries[indexOtherLibrary].confidence < averageSimilarity) {
                detectedLibraries.splice(indexOtherLibrary, 1, {
                    library: library,
                    nodeIds: nodeIds,
                    confidence: averageSimilarity
                });
            }
        } else {
            detectedLibraries.push({
                library: library,
                nodeIds: nodeIds,
                confidence: averageSimilarity
            });
        }
    }

    if(!options.debug) {
        detectedLibraries = filterLowConfidence(detectedLibraries);
    }

    sortDetectedLibraries(detectedLibraries);

    return detectedLibraries;
}

function filterLowConfidence(detectedLibraries) {
    return detectedLibraries.filter(library => library.confidence > MIN_CONFIDENCE);
}

function sortDetectedLibraries(detectedLibraries) {
    detectedLibraries.sort((a, b) => {
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
