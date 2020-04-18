
width = d3.select("#chart").style('width').slice(0, -2)
height = d3.select("#chart").style('height').slice(0, -2)

const scale = d3.scaleOrdinal(d3.schemeTableau10);
tip = d3.tip().attr('class', 'd3-tip').html(function(d) { 
    return (d.nodeType == "cast" ? d.name : d.title) + " : " + d.nodeType
});

let svg = d3.select("#chart")
.attr("class", "chart-container")
.append("svg")
.attr("width", width)
.attr("height", height)
.attr("viewBox", [-width / 2, -height / 2, width, height])
.call(tip)


let selectedMovies = []
let selectedCasts = []
window.links = []
window.nodes = []

function drag (simulation) {

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

const linkg = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
const nodeg = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
function renderChart(){
    prepNodes = window.nodes.filter(n => n.nodeType == "movie" && n.id && selectedMovies.indexOf(n.id) > -1)
    nodeIds = prepNodes.map(n => n.id)

    prepLinks = window.links.filter(l => nodeIds.includes(l.source))
    prepLinksIds = prepLinks.map(l => l.target)

    castNodes = window.nodes.filter(n => n.nodeType == "cast" && (prepLinksIds.includes(n.id) || selectedCasts.indexOf(n.id) > -1))
    
    
    prepNodes = prepNodes.concat(castNodes)

    // const links = data.links.map(d => Object.create(d));
    // const nodes = data.nodes.map(d => Object.create(d));
    const links = prepLinks.map(d => Object.create(d));
    const nodes = prepNodes.map(d => Object.create(d));

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        // .force("charge", d3.forceCollide(10).strength(1))
        .force("charge", d3.forceManyBody().strength(-30))
        // .force("center", d3.forceCenter(width / 2, height / 2))
        
        .force("x", d3.forceX(1))
        .force("y", d3.forceY(1));

    // const svg = d3.create("svg")
    //     .attr("viewBox", [0, 0, width, height]);

    
    const link = linkg.selectAll("line")
    .data(links)
    .join("line")
        .attr("stroke-width", d => 2);

    const node = nodeg
    .selectAll("circle")
    .data(nodes, d=> d.id)
    .join("circle")
        .attr("r", d => {
            if (d.nodeType == "cast") {
                
                if(selectedCasts.indexOf(d.id) > -1){
                    return 7
                }
                return 5
            }else{
                return 9
            }
        })
        .attr("fill", d => {
            if(selectedCasts.indexOf(d.id) > -1){
                return scale("highlighted")
            }
            
            return scale(d.nodeType ); //+ (d.nodeType == "cast" ? d.gender : "")
        })
		.on('mouseover', tip.show)
		.on('mouseout', tip.hide)
        .call(drag(simulation));

    node.append("title")
        .text(d => d.id);

    simulation.on("tick", () => {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    });

    invalidation.then(() => simulation.stop());

    return svg.node();
}
function cmp(x,y) {
    if(x.toLowerCase() !== y.toLowerCase()) {
        x = x.toLowerCase();
        y = y.toLowerCase();
    }
    return x > y ? 1 : (x < y ? -1 : 0);
    // or return x.localeCompare(y);
}

function renderYearSelect(nodes){
    let movies = nodes
    .filter(n=>n.nodeType == "movie")
    .map(n => {
        return {
            id: n.id,
            label: n.title
        }
    })

    // movies.sort((a,b) => cmp(a.label,b.label))

    let casts = nodes
    .filter(n=>n.nodeType == "cast")
    .map(n => {
        return {
            id: n.id,
            label: n.name
        }
    })

	

    var input2 = document.getElementById("castComplete");

    autocomplete({
        input: input2,
        fetch: function(text, update) {
            text = text.toLowerCase();
            // you can also use AJAX requests instead of preloaded data
            var suggestions = casts.filter(n => n.label && n.label.toLowerCase().startsWith(text))
            update(suggestions);
        },
        onSelect: function(item) {
            selectedCasts.push(item.id)
            renderChart()
        }
    });

    var input = document.getElementById("moviesComplete");

    autocomplete({
        input: input,
        fetch: function(text, update) {
            text = text.toLowerCase();
            // you can also use AJAX requests instead of preloaded data
            var suggestions = movies.filter(n => n.label && n.label.toLowerCase().startsWith(text))
            update(suggestions);
        },
        onSelect: function(item) {
            selectedMovies.push(item.id)
            renderChart()
        }
    });

	var selectTag = d3
	.select("#clearNodes")
	.on("click", (e) => {
        selectedMovies = []
        selectedCasts = []
        renderChart()
	});

    // options.enter()
    // .append('option')
    // .attr('value', function(d) {
    // return d.id;
    // })
    // // .property("selected", function(d){ return d === "All Years"; })
    // .text(function(d) {
    // return d.label;
    // })
    

}


Promise.all([
    d3.json("data/links.json"),
    d3.json("data/nodes.json"),
]).then(function(jsons) {
    window.links = jsons[0]
    window.nodes = jsons[1]
    window.nodes.sort((a,b) => {
        if (a.title && b.title) {

            return cmp(a.title.trim().toLowerCase(),b.title.trim().toLowerCase())
        }
        else {
            return 0
        }
    })

    renderYearSelect(nodes)
	renderChart()
    // files[0] will contain file1.csv
    // files[1] will contain file2.csv
}).catch(function(err) {
    // handle error here
})