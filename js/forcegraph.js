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

function playSound(node, offset) {
            var delay = 0;
            var chordNote1 = 48 + (offset * 4);
            var chordNote2 = 52 + (offset * 4);
            var chordNote3 = 55 + (offset * 4);
            var velocity = 127;

            MIDI.setVolume(0, 127);
            MIDI.chordOn(0, [chordNote1, chordNote2, chordNote3], velocity, delay);
            MIDI.chordOff(0, [chordNote1, chordNote2, chordNote3], delay + 0.75);
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
        .on('click', function (d) {
            playSound(this, d.weight)
        });


    //Attaches a circle to the node svg
    node.append("circle")
//        .attr("r", 5);
            .attr("r", function (d) {
                return d.weight * 2;
            });
    
    d3.selectAll("circle").on("mouseover", function(){
        d3.select(this).attr("fill", "red");
    })
    
    d3.selectAll("circle").on("mouseout", function(){
        d3.select(this).attr("fill", "black");
    })

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

//Using jquery, this loads the d3 force graph after the page has been fully loaded
$(document).ready(function () {
    d3.json("assets/CalderData.json", function (error, data) {
        graph = data;
        initialDraw(null, graph);
        
        MIDI.loadPlugin({
        soundfontUrl: "./soundfont/",
        instrument: "acoustic_grand_piano",
        onprogress: function (state, progress) {
            console.log(state, progress);
        }});
    });
});
