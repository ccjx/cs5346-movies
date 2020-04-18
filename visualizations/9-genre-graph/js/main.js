
width = 1200
height = 800

tip = d3.tip().attr('class', 'd3-tip').html(function(d) { 
    return d.data.name + " : " + Math.round((d.endAngle - d.startAngle) / (Math.PI * 2) * 100) + "%"
});

let svg = d3.select("#chart")
.attr("class", "chart-container")
.append("svg")
.attr("width", width)
.attr("height", height)
.call(tip)

var color = d3.scaleOrdinal(d3.schemeTableau10);


function drawPie(svgPie, drawData){
    CIRCLE_DIAMETER = 100
    
    CIRCLE_INNER = 60

    var pie = d3.pie()
    .value(function(d) { return d.score; })
    .sort(function(b, a) {
		return a.score - b.score;
	});

    var arc = d3.arc()
        .innerRadius(CIRCLE_INNER)
        .outerRadius(CIRCLE_DIAMETER);

    var path = svgPie.selectAll("path")
      .data(pie(drawData.genres))
    .enter().append("path")
      .attr("fill", function(d, i) { return color(d.data.name); })
      .attr("d", arc)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
    //   .each(function(d) { this._current = d; }); // store the initial angles

    svgPie.append("text")
    .attr("x", 0)
    .attr("y", 12)
    .attr("text-align", "center")
    .attr("text-anchor", "middle")
    .style("font-size", "32px")
    // .style("text-transform", "capitalize")
    .text(drawData.decade + "s")

}

function renderChart(moviesGenre){
    x = 0
    y = 0
    for(decade of moviesGenre){
        
        dec = svg
        .append("g")
        // .attr("x", x)
        // .attr("y", y)
        .attr("transform", `translate(${x + 100}, ${y + 100})`);
        drawPie(dec, decade)
        x += 240
        if (x >= 1200){
            y += 240
            x = 0
        }
    }
    
}



Promise.all([
    d3.csv("data/movies_metadata.csv")
]).then(function(data) {
 
    moviesGenre = data[0]
    moviesGenre = moviesGenre.filter(g => g.release_date != undefined || g.release_date != null).map(g => {
        return {
            ...g,
            genres: JSON.parse(g.genres),
            release_date: moment(g.release_date, "DD/MM/YYYY")
        }
    })
    moviesGenre = _.groupBy(moviesGenre, (g) => g.release_date.year())
    for(year in moviesGenre) {
        
        let genres = {}
        for (show of moviesGenre[year]){
            
            if (show.genres.length == 0) {
                continue
            }
            let genreWeight = 1 / show.genres.length
            for (genre of show.genres){
                if (!genres.hasOwnProperty(genre.name)){
                    genres[genre.name] = {
                        name: genre.name,
                        score: 0
                    }
                }

                genres[genre.name].score += genreWeight
            }
        }

        moviesGenre[year] = {
            decade: Math.floor(year / 10) * 10,
            year: Number(year),
            yearDt: Date.parse(year),
            genres: Object.values(genres)
        }
    }
    moviesGenre = Object.values(moviesGenre).filter(g => !_.isNaN(g.decade) && g.decade != 2020)
    moviesGenre = _.groupBy(moviesGenre, g => g.decade)
    //group by decade
    for(decade in moviesGenre){
        
        let genres = {}
        for (movie of moviesGenre[decade]){
            for(genre of movie.genres){
                if (!genres.hasOwnProperty(genre.name)){
                    genres[genre.name] = {
                        name: genre.name,
                        score: 0
                    }
                }

                genres[genre.name].score += genre.score
                
            }
        }

        genres = Object.values(genres)

        moviesGenre[decade] = {
            decade: decade,
            genres: genres
        }
    }

    moviesGenre = Object.values(moviesGenre)

    // render chart one pie per 10 years
    // console.log(moviesGenre)
	renderChart(moviesGenre)
}).catch(function(err) {
})