var nodesSet, nodesArray, nodesDataSet, edgesArray, edgesDataSet, network, nx_graph, attributeDict, workbook, edgeSheet, attributeSheet;
var container = document.getElementById('visualization');
var colormap = chroma.scale(['green', 'yellow', 'red']);
var DEFAULT_NODE_COLOR = 'black';
var DEFAULT_EDGE_COLOR = 'black';
var HIGHLIGHT_EDGE_COLOR = 'red';
var DEFAULT_EDGE_WIDTH = 1;
var MAX_NODE_SIZE = 100;
var DEFAULT_NODE_SIZE = 50;
var MIN_NODE_SIZE = 25;
var HIGHLIGHT_EDGE_WIDTH = 8;
var NEW_NODE_COLOR = 'blue';
var stageNamesToIndex = {};
var maxByType = {
    'Part': 0,
    'Manuf': 0,
    'Dist': 0,
    'Retail': 0,
    'Trans': 0
};

function getIconFromName(n) {
    if (n.startsWith('Part')) {return '\uf013'}
    if (n.startsWith('Manuf')) {return '\uf275'}
    if (n.startsWith('Dist')) {return '\uf06b'}
    if (n.startsWith('Retail')) {return '\uf07a'}
    if (n.startsWith('Trans')) {return '\uf0d1'}
}

function notify(msg) {
    document.getElementById('notifier').innerHTML = msg;
    setTimeout(function() {
        document.getElementById('notifier').innerHTML = '';
    }, 2000)
}

function getDescendants(n) {
    var successors = nx_graph.successors(n);
    var descendants = successors;
    var descendantEdges = [];

    successors.forEach(function(s) {
        descendantEdges.push(n + '-' + s);
        sDesc = getDescendants(s);
        descendants = descendants.concat(sDesc['nodes']);
        descendantEdges = descendantEdges.concat(sDesc['edges']);
    });
    return {
        nodes: descendants,
        edges: descendantEdges
    };
}

function getAncestors(n) {
    var predecessors = nx_graph.predecessors(n);
    var ancestors = predecessors;
    var ancestorEdges = [];

    predecessors.forEach(function(p) {
        ancestorEdges.push(p + '-' + n);
        sAnc = getAncestors(p);
        ancestors = ancestors.concat(sAnc['nodes']);
        ancestorEdges = ancestorEdges.concat(sAnc['edges']);
    });
    return {
        nodes: ancestors,
        edges: ancestorEdges
    };
}


// function rgba2str(rgba) {
//     rgba = rgba['_rgb'];
//     var res =  'rgba(' + rgba[0] + ',' + rgba[1] + ',' + rgba[2] + ',' + rgba[3] + ')';
//     return res;
// }

function initiateDescendants() {
    restoreDefault();
    var nodes = network.getSelectedNodes();
    deselectNodes();
    if (nodes.length === 1) {
        var descendants = getDescendants(nodes[0]);
        nodesDataSet.update({
            id: nodes[0],
            icon: {
                color: 'blue'
            }
        });
        descendants['nodes'].forEach(function(n) {
            nodesDataSet.update({
                id: n,
                icon: {
                    color: 'blue'
                }
            })
        });
        descendants['edges'].forEach(function(e) {
            edgesDataSet.update({
                id: e,
                color: 'blue',
                width: HIGHLIGHT_EDGE_WIDTH
            })
        })
    } else {
        notify('Must have one node selected');
    }
}

function initiateAncestors() {
    restoreDefault();
    var nodes = network.getSelectedNodes();
    deselectNodes();
    if (nodes.length === 1) {
        var ancestors = getAncestors(nodes[0]);
        console.log(ancestors);
        nodesDataSet.update({
            id: nodes[0],
            icon: {
                color: 'blue'
            }
        });
        ancestors['nodes'].forEach(function(n) {
            nodesDataSet.update({
                id: n,
                icon: {
                    color: 'blue'
                }
            })
        });
        ancestors['edges'].forEach(function(e) {
            edgesDataSet.update({
                id: e,
                color: 'blue',
                width: HIGHLIGHT_EDGE_WIDTH
            })
        });

        var totalCost = _.sum(ancestors['nodes'].map(function(n) {return nx_graph.node.get(n)['cost']}));
        totalCost += nx_graph.node.get(nodes[0])['cost'];
        notify('Total cost: $' + totalCost);
    } else {
        notify('Must have one node selected');
    }
}

function colorByDegree() {
    restoreDefaultsEdge();
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
    })
}

function sizeByTime() {
    var times = {};
    var max_time = 0;
    nodesSet.forEach(function(n) {
        var time = parseFloat(attributeDict[stageNamesToIndex[n]]['stageTime']);
        times[n] = time;
        if (time > max_time) {
            max_time = time;
        }
    });
    nodesSet.forEach(function(n) {
        var size = MIN_NODE_SIZE + times[n]/max_time*(MAX_NODE_SIZE - MIN_NODE_SIZE);
        nodesDataSet.update({id: n, icon: {size: size}})
    });
}

function removeSizes() {
    nodesSet.forEach(function(n) {
        nodesDataSet.update({id: n, icon: {size: DEFAULT_NODE_SIZE}});
    })
}

function deselectNodes() {
    network.setSelection({
        nodes: []
    });
}

function restoreDefaultsEdge() {
    edgesArray.forEach(function(e) {
        edgesDataSet.update({
            id: e['id'],
            color: {
                color: DEFAULT_EDGE_COLOR,
                highlight: HIGHLIGHT_EDGE_COLOR
            },
            width: DEFAULT_EDGE_WIDTH
        })
    })
}

function restoreDefaultsNode() {
    nodesSet.forEach(function(n) {
        nodesDataSet.update({
            id: n,
            icon: {
                color: DEFAULT_NODE_COLOR,
                size: DEFAULT_NODE_SIZE
            }
        })
    });
}

function restoreDefault() {
    document.getElementById('notifier').innerHTML = '';
    restoreDefaultsEdge();
    restoreDefaultsNode();
}

// function initiateAllPaths() {
//     restoreDefault();
//     var nodes = network.getSelectedNodes();
//     if (nodes.length != 2) {
//         document.getElementById('notifier').innerHTML = 'Must have two nodes selected'
//     } else {
//         try {
//             var allPaths = jsnx.allPaths()
//         } catch (e) {
//
//         }
//     }
// }

function initiateShortestPath(metric) {
    restoreDefault();
    var nodes = network.getSelectedNodes();
    deselectNodes();

    if (nodes.length !== 2) {
        document.getElementById('notifier').innerHTML = 'Must have two nodes selected'
    } else {
        try {
            var shortestPath = jsnx.bidirectionalShortestPath(nx_graph, nodes[0], nodes[1], 'cost');
            shortestPath.forEach(function (n) {
                nodesDataSet.update({
                    id: n,
                    icon: {color: 'blue'}
                })
            });
            for (var i = 0; i < shortestPath.length; i++) {
                edgesDataSet.update({
                    id: shortestPath[i] + '-' + shortestPath[i + 1],
                    color: {
                        color: 'blue',
                        highlight: 'blue',
                    },
                    width: HIGHLIGHT_EDGE_WIDTH
                });
                network.stabilize();
            }

            var shortestPathLength = _.sum(shortestPath.map(function(n) {return nx_graph.node.get(n)[metric]}));
            var maybeDollar = metric === 'cost' ? '$' : '';
            document.getElementById('notifier').innerHTML = metric + ' = ' + maybeDollar + shortestPathLength.toFixed(2);
        }
        catch (e) {
            console.log(e);
            if (e instanceof jsnx.JSNetworkXNoPath) {
                document.getElementById('notifier').innerHTML = 'No path';
                setTimeout(function() {
                    document.getElementById('notifier').innerHTML = '';
                }, 2000)
            } else {
                console.log(e);
            }
        }
    }
}

function enablePhysics() {
    console.log('enabling physics');
    network.setOptions({physics: {
        enabled: true
    }})
}

function disablePhysics() {
    console.log('disabling physics');

    network.setOptions({physics: {
        enabled: false
    }})
}

function enableManipulation() {
    network.setOptions({
        manipulation: {
            enabled: true,
            addNode: function(nodeData, callback) {
                document.getElementById('saveButton').onclick = saveNodeData.bind(this, nodeData, callback);
                document.getElementById('cancelButton').onclick = clearPopUp.bind();
                document.getElementById('network-popUp').style.display = 'block';
            },
            addEdge: function(edgeData, callback) {
                var source = edgeData['from'];
                var target = edgeData['to'];
                var cost = nx_graph.node.get(source)['cost'];
                var time = nx_graph.node.get(source)['time'];
                nx_graph.addEdge(source, target, {cost: cost, time: time});
                edgeData.id = source + '-' + target;
                callback(edgeData);
            }
        }
    })
}

function clearPopUp() {
    document.getElementById('saveButton').onclick = null;
    document.getElementById('cancelButton').onclick = null;
    document.getElementById('network-popUp').style.display = 'none';
}

function saveNodeData(nodeData, callback) {
    // nodeData.label = document.getElementById('node-label').value;
    var nodeType = document.querySelector('input[name="new-node-type"]:checked').value;
    var label = nodeType + '_' + (maxByType[nodeType] + 1).toString();
    maxByType[nodeType] += 1;
    nodeData.label = label;
    nodeData.id = label;
    nodesSet.add(label);

    nodeData.icon = {
        face: 'FontAwesome',
        code: getIconFromName(nodeType),
        color: NEW_NODE_COLOR,
        size: DEFAULT_NODE_SIZE
    };
    nodeData.shape = 'icon';

    var cost = document.getElementById('new-node-cost').value;
    var time = document.getElementById('new-node-time').value;
    nx_graph.addNode(label, {cost: cost, time: time});
    clearPopUp();
    callback(nodeData);
}

function buildNetwork() {
    var dataFile = document.getElementById('file-input').files[0];
    var reader = new FileReader();

    var dataSet = document.querySelector('input[name="dataset"]:checked').value;

    reader.onload = function(e) {
        var data = e.target.result;
        workbook = XLSX.read(data, {type : 'binary'});
        edgeSheet  = workbook.Sheets[dataSet + '_LL'];
        attributeSheet  = workbook.Sheets[dataSet + '_SD'];
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
                id: e['sourceStage'] + '-' + e['destinationStage'],
                from: e['sourceStage'],
                to: e['destinationStage'],
                arrows: {
                    to: true
                },
                color: {
                    color: DEFAULT_EDGE_COLOR,
                    highlight: HIGHLIGHT_EDGE_COLOR
                },
                width: DEFAULT_EDGE_WIDTH,
            };
        });

        // BUILD NETWORKX GRAPH
        nx_graph = new jsnx.DiGraph();
        nodesSet.forEach(function(n) {
            var cost = parseFloat(attributeDict[stageNamesToIndex[n]]['stageCost'].substring(1));
            var time = parseFloat(attributeDict[stageNamesToIndex[n]]['stageTime']);
            nx_graph.addNode(n, {cost: cost, time: time});
        });
        edgesArray.forEach(function(e) {
            var n = e['from'];
            var cost = parseFloat(attributeDict[stageNamesToIndex[n]]['stageCost'].substring(1));
            var time = parseFloat(attributeDict[stageNamesToIndex[n]]['stageTime']);
            nx_graph.addEdge(e['from'], e['to'], {cost: cost, time: time});
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
                shape: 'icon',
                title: 'Cost = $' + parseFloat(attributeDict[stageNamesToIndex[n]]['stageCost'].substring(1)) + ', ' +
                    'time = ' + parseFloat(attributeDict[stageNamesToIndex[n]]['stageTime'])
            })
        });
        nodesSet.forEach(function(n) {
            var info = n.split('_');
            var type = info[0];
            var num = parseInt(info[1]);
            if (num > maxByType[type]) {
                maxByType[type] = num;
            }
        });
        nodesDataSet = new vis.DataSet(Array.from(nodesArray));
        edgesDataSet = new vis.DataSet(edgesArray);

        var netData = {
            nodes: nodesDataSet,
            edges: edgesDataSet
        };
        var layout;
        if (dataSet === 'Computer') {
            layout = {
                hierarchical: {
                    enabled: false
                }
            };
            disablePhysics();
        } else {
            layout = {
                hierarchical: {
                    enabled: true,
                    sortMethod: 'directed'
                }
            }
        }
        var options = {
            layout: layout,
            interaction: {
                multiselect: true
            }
        };
        network = new vis.Network(container, netData, options);
        network.setOptions({
            interaction: {
                hover: true
            }
        });
        enableManipulation();

        // network.on('click', function(e) {
        //     console.log(e);
        // })
    };
    reader.readAsBinaryString(dataFile);
}

window.onload = function() {
    document.getElementById('file-input').addEventListener('change', buildNetwork);
};
