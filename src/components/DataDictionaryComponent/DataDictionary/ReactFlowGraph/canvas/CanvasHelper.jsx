
/**
 * This method will execture only once during data initiallization
 * @param {*} distionary 
 * 12/20/2022 - AR
 * Simple Breath First Search to assign node to a tree
 * prerequisite - {dictionary} node hierarchy order
 * optimized for icdc_data_model
 * The level value initially assigned to each node is used for 
 * calculating the position of the node during search filter
 * 
 */
export const generateNodeTree = (dictionary, nextLevel = 2, intervel = 2) => {
    // console.log(dictionary);
    const nodes = Object.keys(dictionary);
    /**
     * initialize level to zero for all the nodes
     */
    let node2Level = nodes.reduce((acc, node) => {acc[node] = 0; return acc}, {});
    /**
     * check only distinct links are processed
     * edge1 = node1 -> node2, edge/link with be included on both nodes
     * edge1 of hierarchy node is selected 
     * 
     * CAUTION
     * Dst - where edge originates (source)
     * Src - where edge ends (target)
     */
    const distinctLinks = {};
    let maxLevel = 0;
    nodes.forEach((node, index) => {
        const links = dictionary[node].links.filter((item) => item.Src !== undefined);
        links.forEach((link, linkIndex) => {
            const source = link.Dst;
            const target = link.Src;
            if (target && source){
                // check for circular relation (adverse_event/case)
                if (distinctLinks[source] === target) {
                    node2Level[source] -= nextLevel;
                    node2Level[target] += nextLevel/intervel;
                } else {
                    // assign order based on the level of hierarchy node
                    distinctLinks[target] = source;
                    const levels = [node2Level[target], node2Level[source] + nextLevel];
                    const max = Math.max(...levels);
                    /**
                     * IF - hierarchy is other than root node (program)
                     * off_treatment, off_study, canine_ind to case
                     * should be above case in the tree
                     * 
                     * ELSE - will assign level to node 
                     * pushes node to bottom of the tree
                     */
                    if (index > 0 && node2Level[source] === 0) {
                        if (node2Level[target] == 0) {
                            node2Level[target] = 0;
                            node2Level[target] += nextLevel/2;
                        } else {
                            node2Level[source] = node2Level[target] - nextLevel/2;
                        }
                    } else {
                        node2Level[target] = max;
                        maxLevel = Math.max(max, maxLevel); 
                    }
                }
            }
        });
    });

    /**
     * assign max level to node with no edges
     * move to bottom of the tree
     */
    const nodeWithoutEdges = _.cloneDeep(nodes).filter((node) => dictionary[node].links
        && dictionary[node].links.length == 0);
    nodeWithoutEdges.forEach((node) => {
        node2Level[node] = maxLevel;
    });

    /**
     * create a complete node tree
     * calculate subtree and assign position to node
     */
    const nodeTree = {}
    for (const [key, value] of Object.entries(node2Level)) {
        if (nodeTree[value] === undefined) {
            nodeTree[value] = []
        }
        nodeTree[value].push(key);
    }
    return nodeTree;
}

/**
* generate sub tree based on filtered dictionary
* based on complete tree
*/
export const generateSubTree = (dictionary, nodeTree) => {
    const nodes = Object.keys(dictionary);
    const subtree = {};
    let nextLevel = 0;
    for (const [key, value] of Object.entries(nodeTree)) {
       const existingNodes = value.filter((item) => nodes.includes(item));
       if (existingNodes.length > 0){
         subtree[nextLevel] = existingNodes;
         nextLevel += 1;
       }
    }
    return subtree;
}

/**
 * Calculates the node position based on node level
 * 
 * @param {*} param0 
 * @returns postion of the nodes
 * 
 */
export const getNodePosition = (dictionary, nodeTree, tabViewWidth, yIntervel = 80, xIntervel = 200) => {
    const subtree = generateSubTree(dictionary, nodeTree);
    const position = {};
    let x = tabViewWidth/2;
    for (const [level, nodes] of Object.entries(subtree)) {
        console.log(nodes.length);
        const { length } = nodes;
        /**
         * single node in a level
         * assign position to the middle of the graph horizontally (x)
         * set vertical position based on tree level
         * yIntervel to adjust the distance between each level
         */
        const y  = (Number(level) + 1) * yIntervel;
        if (length === 1){
            position[nodes[0]] = [x, y];
        } else {
            let xMin = x - (xIntervel * length)/2;
            let intervel = xIntervel;
            /**
             * adjusted for icdc data model
             */
            if (length < 3) {
                xMin = x - (xIntervel * (length + 1))
                intervel = 2 * xIntervel
            }
            nodes.forEach((node, index) => {
              const adjustedX = xMin + intervel * (index + 1);
              position[node] = [adjustedX, y];
            });
        }
    }

    return position;
}   