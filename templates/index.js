var app = {};
app.path = d3.geo.path().projection(null);
app.races = {
    2000: {
        "hed": "2000",
        "dem": "Al Gore",
        "gop": "George W. Bush",
        "winner": "dem",
        "margin": 4144,
    },
    2004: {
        "hed": "2004",
        "dem": "John Kerry",
        "gop": "George W. Bush",
        "winner": "gop",
        "margin": 10059,
    },
    2008: {
        "hed": "2008",
        "dem": "Barack Obama",
        "gop": "John McCain",
        "winner": "dem",
        "margin": 146561,
    },
    2012: {
        "hed": "2012",
        "dem": "Barack Obama",
        "gop": "Mitt Romney",
        "winner": "dem",
        "margin": 91927,
    },
    2016: {
        "hed": "2016",
        "dem": "Hillary Clinton",
        "gop": "Donald Trump",
        "winner": "gop",
        "margin": 147647,
    }
};
app.addDropShadow = function (svg) {
    var defs = svg.append("defs");

    var filter = defs.append("filter")
      .attr("id", "drop-shadow")
      .attr("height", "130%");
    filter.append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 5)
      .attr("result", "blur");
    filter.append("feOffset")
      .attr("in", "blur")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("result", "offsetBlur");

    var feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode")
      .attr("in", "offsetBlur");
    feMerge.append("feMergeNode")
      .attr("in", "SourceGraphic");
};
app.createRadius = function(values) {
    var maxVotes = d3.max(values, function (d) { return d.margin; });
    var radius = d3.scale.sqrt()
      .domain([0, maxVotes])
      .range([0, 30]);
    return radius;
};
app.createSvg = function (ele) {
    var svg = ele.append("svg")
        .attr("width", 960)
        .attr("height", 625);

    app.addDropShadow(svg);

    svg.append("g")
        .attr("class", "border")
      .append("path")
        .datum(topojson.feature(app.topology, app.topology.objects.state))
        .attr("class", "dropshadow")
        .attr("d", app.path);

    svg.append("g")
        .attr("class", "counties")
      .selectAll("path")
        .data(topojson.feature(app.topology, app.topology.objects.counties).features
          .sort(function(a, b) { return b.properties.NAME; }))
      .enter().append("path")
        .attr("class", "county")
        .attr("d", app.path)
        .attr("data-fips", function (d) { return d.properties.GEOID; })
        .attr("data-name", function (d) { return d.properties.NAME; });

    return svg;
};
app.createMap = function (race) {
    var section = d3.select("section#maps")
      .append("section")
        .attr("class", "cycle");

    var hed = section.append("h2")
      .text(race.hed);

    var leaderboard = section.append("section")
      .attr("class", "leaderboard")
      .html(_.template(d3.select("#leaderboard-tmpl").html())(race));

    var svg = app.createSvg(section);
    svg.append("g")
        .attr("class", "bubbles")
      .selectAll("circle")
        .data(topojson.feature(app.topology, app.topology.objects.counties).features)
      .enter().append("circle")
        .attr("transform", function(d) { return "translate(" + app.path.centroid(d) + ")";})
        .attr("class", function (d) {
            var county = race.results[d.properties.GEOID];
            return county.leader;
        })
        .attr("r", function(d) {
            var county = race.results[d.properties.GEOID];
            return app.radius(county.margin);
        });
};
app.boot = function () {
    queue()
      .defer(d3.json, "/static/iowa.json")
      .defer(d3.json, "/static/2000.json")
      .defer(d3.json, "/static/2004.json")
      .defer(d3.json, "/static/2008.json")
      .defer(d3.json, "/static/2012.json")
      .await(function(error, topology, results2000, results2004, results2008, results2012) {
          if (error) throw error;

          app.topology = topology;

          app.radius = app.createRadius(_.flatten(
             d3.values(results2000),
             d3.values(results2004),
             d3.values(results2008),
             d3.values(results2012)
          ));

          app.races[2000].results = results2000;
          app.races[2004].results = results2004;
          app.races[2008].results = results2008;
          app.races[2012].results = results2012;

          app.createMap(app.races[2004]);
          app.createMap(app.races[2000]);
      });
};
