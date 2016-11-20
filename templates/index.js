var app = {};
app.projection = d3.geo.mercator()
  .scale(7000)
  .center([-93.15, 42.15]);
app.path = d3.geo.path().projection(app.projection);
app.races = {
    2000: {
        "selector": "#map-2000",
        "hed": "2000",
        "dem": "Al Gore",
        "gop": "George W. Bush",
        "winner": "dem",
        "margin": 4144,
    },
    2004: {
        "selector": "#map-2004",
        "hed": "2004",
        "dem": "John Kerry",
        "gop": "George W. Bush",
        "winner": "gop",
        "margin": 10059,
    },
    2008: {
        "selector": "#map-2008",
        "hed": "2008",
        "dem": "Barack Obama",
        "gop": "John McCain",
        "winner": "dem",
        "margin": 146561,
    },
    2012: {
        "selector": "#map-2012",
        "hed": "2012",
        "dem": "Barack Obama",
        "gop": "Mitt Romney",
        "winner": "dem",
        "margin": 91927,
    },
    2016: {
        "selector": "#map-2016",
        "hed": "2016",
        "dem": "Hillary Clinton",
        "gop": "Donald Trump",
        "winner": "gop",
        "margin": 148133,
    }
};
app.fitMaps = function() {
  d3.selectAll("g").attr("transform", "scale(" + $(".map").width()/900 + ")");
  $(".cycle.section").each(function (index, ele) {
      $("svg", ele).height($(".map").width()*0.618);
  });
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
        .attr("class", "map col s12")
        .attr("width", "100%");

    app.addDropShadow(svg);

    svg.append("g")
        .attr("class", "border")
      .append("path")
        .datum(app.json.state)
        .attr("class", "dropshadow")
        .attr("d", app.path);

    svg.append("g")
        .attr("class", "counties")
      .selectAll("path")
        .data(app.json.counties)
      .enter().append("path")
        .attr("class", "county")
        .attr("d", app.path)
        .attr("data-fips", function (d) { return d.properties.GEOID; })
        .attr("data-name", function (d) { return d.properties.NAME; });

    return svg;
};
app.createMap = function (race) {
    var section = d3.select(race.selector);

    var hed = section.append("h3")
      .text(race.hed);

    var leaderboard = section.append("section")
      .attr("class", "leaderboard")
      .html(_.template(d3.select("#leaderboard-tmpl").html())(race));

    var svg = app.createSvg(section);

    svg.append("g")
        .attr("class", "bubbles")
      .selectAll("circle")
        .data(app.json.counties)
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
    app.fitMaps();
};
app.boot = function () {
    d3.select(window).on("resize", app.fitMaps);
    queue()
      .defer(d3.json, "/static/json/iowa-counties.geojson")
      .defer(d3.json, "/static/json/iowa-state.geojson")
      .defer(d3.json, "/static/json/2000.json")
      .defer(d3.json, "/static/json/2004.json")
      .defer(d3.json, "/static/json/2008.json")
      .defer(d3.json, "/static/json/2012.json")
      .defer(d3.json, "/static/json/2016.json")
      .await(function(error, counties, state, results2000, results2004, results2008, results2012, results2016) {
          if (error) throw error;

          app.json = {
              counties: counties.features,
              state: state.features[0]
          };

          app.radius = app.createRadius(_.flatten(
             d3.values(results2000),
             d3.values(results2004),
             d3.values(results2008),
             d3.values(results2012),
             d3.values(results2016)
          ));

          app.races[2000].results = results2000;
          app.races[2004].results = results2004;
          app.races[2008].results = results2008;
          app.races[2012].results = results2012;
          app.races[2016].results = results2016;

          app.createMap(app.races[2016]);
          app.createMap(app.races[2012]);
          app.createMap(app.races[2008]);
          app.createMap(app.races[2004]);
          app.createMap(app.races[2000]);
      });
};
