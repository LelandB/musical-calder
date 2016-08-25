//Setting up size of graph
var width = 960,
    height = 500,
    graph;

//Initiates the force graph to a certain size
//Sets link distance and charge strength which pushes apart the various nodes
var force = d3.layout.force()
    .charge(-200)
    .linkDistance(40)
    .size([width, height]);

// Creates svg layer to which everything is added
var svg = d3.select("#mainGraph").append("svg")
    .attr("width", width)
    .attr("height", height);

//Set up tooltip
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function (d) {
        return "Name: " + d.name + "";
    })
svg.call(tip);

//Tooltip for bonds
var linktip = d3.tip()
    .attr('class', 'link-tip')
    .offset([-10, 0])
    .html(function (d) {
        return "Source: " + d.source.name + " " + "" + "Target: " + d.target.name + "";
    })
svg.call(linktip);

//Announcing global variables for function use
var link;
var node;

//Begin Web Audio API/Music functionality
var oscillator = null;
var gainNode = null;
//need an instance of AudioContext to build an audio graph on
var audioCtx = new AudioContext();

// Called to create a new oscillator each time
// **Currently most effective way to produce multiple notes
function setupOsc() {
    //oscillator provides a simple tone
    //gain node controls sound volume
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    //connects the oscillator, gain node, and destination together
    //default output mechanism of your device is accessed with .destination
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
}

function playSound(freq) {
    console.log("playSound fired");
    // Attack is the amt of time it takes for the gain node to reach max volume
    var attack = 0.3;
    // Release is the amt of time it takes for gain node to fade to 0
    var release = 0.5;
    setupOsc();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    //oscillator.start() can only be called once
    //for this reason we create a new oscillator for each click/node
    oscillator.start();
    var curTime = audioCtx.currentTime;
    gainNode.gain.setValueAtTime(0, curTime);
    gainNode.gain.linearRampToValueAtTime(1.0, curTime + attack);
    gainNode.gain.linearRampToValueAtTime(0.0, curTime + attack + release);
}

//Creates the force graph from unedited data
function initialDraw(error, graph) {
    if (error) throw error;

    //Allows to nodes to be connected by id, not array placement
    var nodeById = d3.map();

    graph.nodes.forEach(function (node) {
        nodeById.set(node.id, node);
    });

    graph.links.forEach(function (link) {
        link.source = nodeById.get(link.source);
        link.target = nodeById.get(link.target);
    });

    //Initiates the force graph
    force
        .nodes(graph.nodes)
        .links(graph.links)
        .start();

    //Adds link attributes to svg layer
    link = svg.selectAll(".link")
        .data(graph.links)
        .enter().append("line")
        .attr("class", "link")
        .on('mouseover', linktip.show)
        .on('mouseout', linktip.hide);

    //Adds node attributes to svg layer
    node = svg.selectAll(".node")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", "node")
        .call(force.drag)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .on('dblclick', function () {
            playSound(440)
        })
        .on('click', connectedNodes);


    //Attaches a circle to the node svg
    node.append("circle")
        .attr("r", 10);

    //Attaches text to the node
    node.append("text")
        .attr("dx", 20)
        .attr("dy", ".35em")
        .text(function (d) {
            return d.name
        });

    //Keeps track of all the nodes to calculate movement via charge
    force.on("tick", function () {
        link.attr("x1", function (d) {
                return d.source.x;
            })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y;
            });

        d3.selectAll("circle").attr("cx", function (d) {
                return d.x;
            })
            .attr("cy", function (d) {
                return d.y;
            });

        //This connects the text name with the node visually
        d3.selectAll("text").attr("x", function (d) {
                return d.x;
            })
            .attr("y", function (d) {
                return d.y;
            });
    });
}

//This function looks up whether a pair are neighbours
function neighboring(a, b) {
    return linkedByIndex[a.index + "," + b.index];
}

//Reduce the opacity of all but the neighbouring nodes
function connectedNodes() {
    if (toggle == 0) {
        d = d3.select(this).node().__data__;
        node.style("opacity", function (o) {
            return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
        });
        link.style("opacity", function (o) {
            return d.index == o.source.index | d.index == o.target.index ? 1 : 0.1;
        });
        //Reduce the op
        toggle = 1;
    } else {
        //Put them back to opacity=1
        node.style("opacity", 1);
        link.style("opacity", 1);
        toggle = 0;
    }
}

var toggle;
var linkedByIndex;

//node.on('click', connectedNodes);
//node.on('click', playSound(440));

//Using jquery, this loads the d3 force graph after the page has been fully loaded
$(document).ready(function () {
    d3.json("assets/CalderData.json", function (error, data) {
        graph = data;
        initialDraw(null, graph);

        //Toggle stores whether the highlighting is on
        toggle = 0;
        //Create an array logging what is connected to what
        linkedByIndex = {};
        for (i = 0; i < graph.nodes.length; i++) {
            linkedByIndex[i + "," + i] = 1;
        };
        graph.links.forEach(function (d) {
            linkedByIndex[d.source.index + "," + d.target.index] = 1;
        });
    });
});
