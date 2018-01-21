const TreeModel = require('tree-model');
const treeModel = new TreeModel({
    childrenPropertyName: 'children',
    modelComparatorFn: (node1, node2) => {
        var nameA = node1.id.toUpperCase(); // ignore upper and lowercase
        var nameB = node2.id.toUpperCase(); // ignore upper and lowercase
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }

        // names must be equal
        return 0;
    }
});

function transformWebsiteResults(result) {
    const variableHierarchies = new Map();

    for (const variable in result) {
        if (result.hasOwnProperty(variable)) {
            let variableChain = variable.split('.');
            let root = variableChain[0];

            if (variableHierarchies.has(root)) {
                let hierarchy = variableHierarchies.get(root);
                addVariablesAsChildren(hierarchy, variableChain);
            } else {
                let hierarchy = treeModel.parse({ id: root, children: [] });
                addVariablesAsChildren(hierarchy, variableChain);
                variableHierarchies.set(root, hierarchy);
            }
        }
    }

    return variableHierarchies;
}

function transformLibraryResults(result, variableHierarchies, libraryName) {
    for (const variable in result) {
        if (result.hasOwnProperty(variable)) {
            let variableChain = variable.split('.');
            let root = variableChain[0];

            if (variableHierarchies.has(root)) {
                let hierarchyMap = variableHierarchies.get(root);

                // check if Hierarchy for this library already exists else create a new one
                if (hierarchyMap.has(libraryName)) {
                    let hierarchy = hierarchyMap.get(libraryName);
                    addVariablesAsChildren(hierarchy, variableChain);
                } else {
                    let hierarchy = treeModel.parse({ id: root, children: [] });
                    addVariablesAsChildren(hierarchy, variableChain);
                    hierarchyMap.set(libraryName, hierarchy);
                }
            } else {
                let hierarchy = treeModel.parse({ id: root, children: [] });
                addVariablesAsChildren(hierarchy, variableChain);

                // initialize variable in hierarchies map and tree hierarchy map (Library -> Tree Hierarchy)
                let hierarchyMap = new Map();
                hierarchyMap.set(libraryName, hierarchy);
                variableHierarchies.set(root, hierarchyMap);
            }
        }
    }
}

function addVariablesAsChildren(hierarchy, variableChain) {
    let node = hierarchy;
    for (let successor of variableChain) {
        if (variableChain[0] === successor) continue;
        const successorNode = node.children.find(child => child.model.id === successor);

        // add child if node for variable/function does not exist -> new child is next node
        node = successorNode
            ? successorNode
            : node.addChild(treeModel.parse({ id: successor, children: [] }));
    }
}

exports.transformWebsiteResults = transformWebsiteResults;
exports.transformLibraryResults = transformLibraryResults;
