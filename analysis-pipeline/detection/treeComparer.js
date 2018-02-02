const levenshtein = require('fast-levenshtein');
const exec = require('child_process').execSync;

function compareTreeWithStringMatching(root1, root2) {
    let treeIds1 = '';
    let treeIds2 = '';

    // Depth first pre-order traversing
    root1.walk(node => {
        treeIds1 += node.model.id;
    });
    root2.walk(node => {
        treeIds2 += node.model.id;
    });

    let distance = levenshtein.get(treeIds1, treeIds2);

    // Source: https://stackoverflow.com/questions/10405440/percentage-rank-of-matches-using-levenshtein-distance-matching
    let percentage = (1 - distance / Math.max(treeIds1.length, treeIds2.length)) * 100;

    return percentage.toFixed(2);
}

function compareTreeWithTreeDistance(root1, root2) {
    const tree1AsString = treeBracketNotation(root1);
    const tree2AsString = treeBracketNotation(root2);

    let nodeCountTree1 = 0;
    let nodeCountTree2 = 0;

    root1.walk(() => nodeCountTree1++);
    root2.walk(() => nodeCountTree2++);

    let maxNodes = Math.max(nodeCountTree1, nodeCountTree2);

    let distance = maxNodes;

    const pathToLib = './libs/apted.jar';

    const stdout = exec(`java -jar ${pathToLib} -t '${tree1AsString}' '${tree2AsString}'`).toString();

    let distanceF = parseFloat(stdout);
    if (distanceF !== Number.NaN) {
        distance = distanceF;
    }

    // Source: https://stackoverflow.com/questions/10405440/percentage-rank-of-matches-using-levenshtein-distance-matching
    let percentage = (1 - distance / maxNodes) * 100;

    return percentage.toFixed(2);
}

function treeBracketNotation(node) {
    let treeEncoding = `{${node.model.id}`;
    for (let child of node.children) {
        treeEncoding += treeBracketNotation(child);
    }
    treeEncoding += '}';
    return treeEncoding;
}

exports.compareTreeWithStringMatching = compareTreeWithStringMatching;
exports.compareTreeWithTreeDistance = compareTreeWithTreeDistance;
