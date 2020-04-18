
width = 1200
height = 700

let commonTerms = ["the", "a", "s", "t", "ll", "d", "m", "ve", "and", "of", "in", "to", "is"]

let svg = d3.select("#chart")
.attr("class", "chart-container")
.append("svg")
.attr("width", width)
.attr("height", height)

let wordsSvg = svg
        .append("g")

var wordLengthsColor = d3.scaleOrdinal(d3.schemeTableau10);
wordsSvg
.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")

let allTimeCounts = {}
let years = []

function renderChart(selection){
    let selectedData = {}
    if(selection == "All Years") {
        selectedData = allTimeCounts
    }
    else{
        selectedData = (years.filter(y => y.year == selection)[0]).words
    }
    selectedData = selectedData.filter(w => !commonTerms.includes(w.word))
    let top100 = selectedData.length > 200 ? selectedData.slice(0, 200) : selectedData
    let sumCount = Math.max(...top100.map(t => t.count))//top100.reduce((total, elem) => total + elem.count, 0)

    
	var layout = d3.layout.cloud()
    .size([width, height])
    .words(top100.map(function(d) {
      return {text: d.word, size: d.count};
    }))
    .padding(1)
    .rotate(function() { return  0; }) //~~(Math.random() * 2) *
    .font("Impact")
    .fontSize(function(d) { return Math.min(Math.max(200 * d.size / sumCount, 20 ), 200 )})
    .on("end", draw);

    layout.start();


    function draw(words) {
        
        wordsSvg
        .selectAll("text")
        .data(words)
        .join("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .style("font-family", "Impact")
        .style("fill", d => wordLengthsColor(d.text.length))
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; });
    }
}

function renderYearSelect(){
    
	var selectTag = d3
	.select("#years")
	.on("change", (e) => {
		renderChart(d3.select("#years").node().value)
	});
	let _years = years.map(y => y.year)
    _years.sort()
    _years.unshift("All Years")
	var options = selectTag.selectAll('option')
      .data(_years);

    options.enter()
    .append('option')
    .attr('value', function(d) {
    return d;
    })
    .attr('value', function(d) {
    return d;
    })  
    .property("selected", function(d){ return d === "All Years"; })
    .text(function(d) {
    return d;
    })
    

}


Promise.all([
    d3.json("data/allTimeCounts.json"),
    d3.json("data/years.json"),
]).then(function(data) {
    allTimeCounts = data[0]
    years = data[1]
    renderYearSelect()
	renderChart("All Years")
    // files[0] will contain file1.csv
    // files[1] will contain file2.csv
}).catch(function(err) {
    // handle error here
})