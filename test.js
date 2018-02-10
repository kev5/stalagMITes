
var nodeIds, shadowState, nodesArray, nodes, edgesArray, edges, network;
var container = document.getElementById('visualization');

function getIconFromName(n) {
    if (n.startsWith('Part')) {return '\uf0ad'}
    if (n.startsWith('Manuf')) {return '\uf275'}
    if (n.startsWith('Dist')) {return '\uf06b'}
    if (n.startsWith('Retail')) {return '\uf07a'}
    if (n.startsWith('Transp')) {return '\uf0d1'}
}

function startNetwork() {
    // this list is kept to remove a random node.. we do not add node 1 here because it's used for changes
    nodeIds = [2, 3, 4, 5];
    shadowState = false;
    // create an array with nodes
    nodesArray = [
        {id: 1, label: 'Node 1'},
        {id: 2, label: 'Node 2'},
        {id: 3, label: 'Node 3'},
        {id: 4, label: 'Node 4'},
        {id: 5, label: 'Node 5'}
    ];
    nodes = new vis.DataSet(nodesArray);
    // create an array with edges
    edgesArray = [
        {from: 1, to: 3},
        {from: 1, to: 2},
        {from: 2, to: 4},
        {from: 2, to: 5}
    ];
    edges = new vis.DataSet(edgesArray);
    // create a network
    var data = {
        nodes: nodes,
        edges: edges
    };
    var options = {};
    network = new vis.Network(container, data, options);
}

// function addNode() {
//     var newId = (Math.random() * 1e7).toString(32);
//     nodes.add({id:newId, label:"I'm new!"});
//     nodeIds.push(newId);
// }
//
// function changeNode1() {
//     var newColor = '#' + Math.floor((Math.random() * 255 * 255 * 255)).toString(16);
//     nodes.update([{id:1, color:{background:newColor}}]);
// }
//
// function removeRandomNode() {
//     var randomNodeId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
//     nodes.remove({id:randomNodeId});
//     var index = nodeIds.indexOf(randomNodeId);
//     nodeIds.splice(index,1);
// }
//
// function changeOptions() {
//     shadowState = !shadowState;
//     network.setOptions({nodes:{shadow:shadowState},edges:{shadow:shadowState}});
// }
//
// function resetAllNodes() {
//     nodes.clear();
//     edges.clear();
//     nodes.add(nodesArray);
//     edges.add(edgesArray);
// }

function resetAllNodesStabilize() {
    resetAllNodes();
    network.stabilize();
}

function setTheData() {
    nodes = new vis.DataSet(nodesArray);
    edges = new vis.DataSet(edgesArray);
    network.setData({nodes:nodes, edges:edges})
}

function resetAll() {
    if (network !== null) {
        network.destroy();
        network = null;
    }
    startNetwork();
}



function uniques(array) {
   return Array.from(new Set(array));
}

function buildNetwork(e) {
    console.log(e);
    var dataFile = e.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        var data = e.target.result;
        var workbook = XLSX.read(data, {type : 'binary'});
        var sheet  = workbook.Sheets['Cereal_LL'];
        var edges_in_sheet = XLSX.utils.sheet_to_row_object_array(sheet);

        nodesSet = new Set();
        edges_in_sheet.forEach(function(e) {
            nodesSet.add(e['sourceStage']);
            nodesSet.add(e['destinationStage']);
        });
        nodesArray = [];
        nodesSet.forEach(function(n) {
            nodesArray.push({
                id: n,
                label: n,
                icon: {
                    face: 'FontAwesome',
                    code: getIconFromName(n)
                },
                shape: 'icon'
            })
        });
        console.log(nodesArray);
        nodes = new vis.DataSet(Array.from(nodesArray));

        edgesArray = edges_in_sheet.map(function(e) {
            return {from: e['sourceStage'], to: e['destinationStage'], arrows: {to: true}};
        });

        console.log(edgesArray);
        edges = new vis.DataSet(edgesArray);
        var netData = {
            nodes: nodes,
            edges: edges
        };
        var options = {
            layout: {
                hierarchical: {
                    enabled: true,
                    sortMethod: 'directed'
                }
            }
        };

        network = new vis.Network(container, netData, options);
    };
    reader.readAsBinaryString(dataFile);
}

window.onload = function() {
    document.getElementById('file-input').addEventListener('change', buildNetwork);
}

