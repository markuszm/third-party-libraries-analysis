const levenshtein = require('fast-levenshtein');

function compareTrees(root1, root2) {
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

    return percentage;
}

exports.compareTrees = compareTrees;