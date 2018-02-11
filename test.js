var nodesSet, nodesArray, nodesDataSet, edgesArray, edgesDataSet, network, nx_graph, attributeDict;
var container = document.getElementById('visualization');
var colormap = chroma.scale(['green', 'yellow', 'red']);
var DEFAULT_NODE_COLOR = 'black';
var MAX_NODE_SIZE = 100;
var DEFAULT_NODE_SIZE = 50;
var MIN_NODE_SIZE = 25;
var stageNamesToIndex = {};

function getIconFromName(n) {
    if (n.startsWith('Part')) {return '\uf0ad'}
    if (n.startsWith('Manuf')) {return '\uf275'}
    if (n.startsWith('Dist')) {return '\uf06b'}
    if (n.startsWith('Retail')) {return '\uf07a'}
    if (n.startsWith('Trans')) {return '\uf0d1'}
}

function rgba2str(rgba) {
    rgba = rgba['_rgb'];
    var res =  'rgba(' + rgba[0] + ',' + rgba[1] + ',' + rgba[2] + ',' + rgba[3] + ')';
    return res;
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
//
// function resetAllNodesStabilize() {
//     resetAllNodes();
//     network.stabilize();
// }
//
// function setTheData() {
//     nodes = new vis.DataSet(nodesArray);
//     edges = new vis.DataSet(edgesArray);
//     network.setData({nodes:nodes, edges:edges})
// }
//
// function resetAll() {
//     if (network !== null) {
//         network.destroy();
//         network = null;
//     }
//     startNetwork();
// }

function colorByDegree() {
    var degrees = nx_graph.degree()._stringValues;
    var maxDegree = _.max(Object.values(degrees));
    nodesSet.forEach(function(n) {
        nodesDataSet.update({id: n, icon:{color: colormap(degrees[n]/maxDegree)}})
    })
}

function removeColors() {
    nodesSet.forEach(function(n) {
        nodesDataSet.update({id: n, icon: {color: DEFAULT_NODE_COLOR}})
    })
}

function sizeByCost() {
    var costs = {};
    var max_cost = 0;
    nodesSet.forEach(function(n) {
        var cost = parseFloat(attributeDict[stageNamesToIndex[n]]['stageCost'].substring(1));
        costs[n] = cost;
        if (cost > max_cost) {
            max_cost = cost;
        }
    });
    nodesSet.forEach(function(n) {
        var size = MIN_NODE_SIZE + costs[n]/max_cost*(MAX_NODE_SIZE - MIN_NODE_SIZE);
        nodesDataSet.update({id: n, icon: {size: size}})
    });
}

function sizeByTime() {

}

function removeSizes() {
    nodesSet.forEach(function(n) {
        nodesDataSet.update({id: n, icon: {size: DEFAULT_NODE_SIZE}});
    })
}

function buildNetwork(e) {
    var dataFile = e.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        var data = e.target.result;
        var workbook = XLSX.read(data, {type : 'binary'});
        var edgeSheet  = workbook.Sheets['Cereal_LL'];
        var attributeSheet  = workbook.Sheets['Cereal_SD'];
        var edgeSheetRows = XLSX.utils.sheet_to_row_object_array(edgeSheet);
        attributeDict = XLSX.utils.sheet_to_json(attributeSheet);

        attributeDict.forEach(function(entry, i) {
            stageNamesToIndex[entry['Stage Name']] = i;
        });


        nodesSet = new Set();
        edgeSheetRows.forEach(function(e) {
            nodesSet.add(e['sourceStage']);
            nodesSet.add(e['destinationStage']);
        });
        edgesArray = edgeSheetRows.map(function(e) {
            return {
                from: e['sourceStage'],
                to: e['destinationStage'],
                arrows: {
                    to: true
                },
                color: {
                    color: 'black',
                    highlight: 'red'
                }
            };
        });

        // BUILD NETWORKX GRAPH
        nx_graph = new jsnx.DiGraph();
        nodesSet.forEach(function(n) {
            nx_graph.addNode(n);
        });
        edgesArray.forEach(function(e) {
            nx_graph.addEdge(e['from'], e['to']);
        });
        window.nx_graph = nx_graph;

        // BUILD VIS.JS GRAPH
        nodesArray = [];
        nodesSet.forEach(function(n) {
            nodesArray.push({
                id: n,
                label: n,
                icon: {
                    face: 'FontAwesome',
                    code: getIconFromName(n),
                    color: DEFAULT_NODE_COLOR,
                    size: DEFAULT_NODE_SIZE
                },
                shape: 'icon'
            })
        });
        nodesDataSet = new vis.DataSet(Array.from(nodesArray));
        edgesDataSet = new vis.DataSet(edgesArray);

        var netData = {
            nodes: nodesDataSet,
            edges: edgesDataSet
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
};

