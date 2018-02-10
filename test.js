/*var container = document.getElementById('visualization');
            var data = [
            {id: 1, content: 'item 1', start: '2013-04-20'},
            {id: 2, content: 'item 2', start: '2013-04-14'},
            {id: 3, content: 'item 3', start: '2013-04-18'},
            {id: 4, content: 'item 4', start: '2013-04-16', end: '2013-04-19'},
            {id: 5, content: 'item 5', start: '2013-04-25'},
            {id: 6, content: 'item 6', start: '2013-04-27'}
            ];
            var options = {};
            var timeline = new vis.Timeline(container, data, options);
*/
// var nodes = [
//
//        {
//
//          id:"a",
//
//          label:"A"
//
//        },
//
//        {
//
//          id:"b",
//
//          label:"B"
//
//        }
//
// ];
//
// var edges = [
//
//        {
//
//          from:"a",
//
//          to:"b"
//
//        }
//
// ];
//
//     var options = {};
//
//     var data = {
//         nodes:nodes,
//         edges:edges
//     };
//
//     var container = document.querySelector('.network');
//
//     network = new vis.Network(container, data, options);
var nodeIds, shadowState, nodesArray, nodes, edgesArray, edges, network;
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
        var container = document.getElementById('visualization');
        var data = {
            nodes: nodes,
            edges: edges
        };
        var options = {};
        network = new vis.Network(container, data, options);
    }
    function addNode() {
        var newId = (Math.random() * 1e7).toString(32);
        nodes.add({id:newId, label:"I'm new!"});
        nodeIds.push(newId);
    }
    function changeNode1() {
        var newColor = '#' + Math.floor((Math.random() * 255 * 255 * 255)).toString(16);
        nodes.update([{id:1, color:{background:newColor}}]);
    }
    function removeRandomNode() {
        var randomNodeId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
        nodes.remove({id:randomNodeId});
        var index = nodeIds.indexOf(randomNodeId);
        nodeIds.splice(index,1);
    }
    function changeOptions() {
        shadowState = !shadowState;
        network.setOptions({nodes:{shadow:shadowState},edges:{shadow:shadowState}});
    }
    function resetAllNodes() {
        nodes.clear();
        edges.clear();
        nodes.add(nodesArray);
        edges.add(edgesArray);
    }
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
    startNetwork();
var dataFile = document.getElementById('data');
