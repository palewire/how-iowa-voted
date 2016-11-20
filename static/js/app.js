var app = {};
app.projection = d3.geo.mercator()
  .scale(7000)
  .center([-93.15, 42.15]);
app.path = d3.geo.path().projection(app.projection);
app.templates = {
    leaderboard: _.template(d3.select("#leaderboard-tmpl").html()),
    table: _.template(d3.select("#table-tmpl").html()),
    sources: _.template(d3.select("#sources-tmpl").html())
};
app.races = {
    2000: {
        "selector":  d3.select("#map-2000"),
        "hed": "2000",
        "dem": "Al Gore",
        "gop": "George W. Bush",
        "dem_total": 638517,
        "gop_total": 634373,
        "grand_total": 1315563,
        "winner": "dem",
        "margin": 4144,
    },
    2004: {
        "selector": d3.select("#map-2004"),
        "hed": "2004",
        "dem": "John Kerry",
        "gop": "George W. Bush",
        "dem_total": 741898,
        "gop_total": 751957,
        "grand_total": 1506908,
        "winner": "gop",
        "margin": 10059,
    },
    2008: {
        "selector": d3.select("#map-2008"),
        "hed": "2008",
        "dem": "Barack Obama",
        "gop": "John McCain",
        "dem_total": 828940,
        "gop_total": 682379,
        "grand_total": 1543965,
        "winner": "dem",
        "margin": 146561,
    },
    2012: {
        "selector": d3.select("#map-2012"),
        "hed": "2012",
        "dem": "Barack Obama",
        "gop": "Mitt Romney",
        "dem_total": 822544,
        "gop_total": 730617,
        "grand_total": 1589899,
        "winner": "dem",
        "margin": 91927,
    },
    2016: {
        "selector": d3.select("#map-2016"),
        "hed": "2016",
        "dem": "Hillary Clinton",
        "gop": "Donald Trump",
        "dem_total": 650790,
        "gop_total": 798923,
        "grand_total": 1542880,
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
app.createSvg = function (race) {
    var svg = race.selector.append("svg")
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
app.createBubbles = function (race) {
    race.svg.append("g")
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
};
app.createCities = function (race) {
    race.svg.append("g")
        .attr("class", "cities")
      .selectAll(".city")
        .data(app.json.cities)
      .enter().append("circle")
        .attr("transform", function(d) { return "translate(" + app.path.centroid(d) + ")"; })
        .attr("r", 2)
        .attr("class", "city")
        .attr("data-name", function (d) { return d.properties.NAME; });

    race.svg.append("g")
        .attr("class", "city-labels")
      .selectAll(".city-label")
        .data(app.json.cities)
      .enter().append("text")
        .attr("class", "city-label")
        .attr("transform", function(d) { return "translate(" + app.projection(d.geometry.coordinates) + ")"; })
        .attr("dy", "0.22rem")
        .text(function(d) { return d.properties.NAME; });

    race.svg.selectAll(".city-label")
        .attr("dx", function(d) { return d.geometry.coordinates[0] > -93.15 ? "0.4rem" : "-0.4rem"; })
        .style("text-anchor", function(d) { return d.geometry.coordinates[0] > -93.15 ? "start" : "end"; });
};
app.createLegend = function (race) {
    var coordinates = [-90.5, 40.75];
    var legend = race.svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + app.projection(coordinates) + ")")
      .selectAll("g")
        .data([1000, 10000, 30000])
      .enter().append("g");

    legend.append("circle")
        .attr("transform", "translate(" + app.projection(coordinates) + ")")
        .attr("cy", function(d) { return -app.radius(d); })
        .attr("r", app.radius);

    legend.append("text")
        .attr("transform", "translate(" + app.projection(coordinates) + ")")
        .attr("y", function(d) { return -2 * app.radius(d); })
        .attr("dy", "1.3em")
        .text(d3.format(".1s"));

        legend.append("text")
            .attr("transform", "translate(" + app.projection(coordinates) + ")")
            .attr("y", 0)
            .attr("dy", "1rem")
            .text("Margin of victory");

};
app.createHeadline = function (race) {
    var hed = race.selector.append("h3")
      .text(race.hed);
    var leaderboard = race.selector.append("section")
      .attr("class", "leaderboard")
      .html(app.templates.leaderboard(race));
};
app.createMap = function (race) {
    race.svg = app.createSvg(race);
    app.createBubbles(race);
    app.createCities(race);
    app.createLegend(race);
    app.fitMaps();
};
app.createTable = function (race) {
    var table = race.selector.append("section")
      .attr("class", "table")
      .html(app.templates.table(race));
    $("#btn-" + race.hed).click(
      function () {
        var that = $(this);
        var table = $("#table-" + race.hed);
        if (that.hasClass("show")) {
          that.removeClass("show");
          that.text("Show fewer results -");
          table.show();
        } else {
          that.addClass("show");
          that.text("Show more results +");
          table.hide();
        }
      }
    );
    race.selector.append("div")
      .attr("class", "divider");
};
app.createSources = function () {
    d3.select("section#sources")
      .html(app.templates.sources());
};
app.boot = function () {
    d3.select(window).on("resize", app.fitMaps);
    queue()
      .defer(d3.json, "static/json/iowa-counties.geojson")
      .defer(d3.json, "static/json/iowa-state.geojson")
      .defer(d3.json, "static/json/iowa-cities.geojson")
      .defer(d3.json, "static/json/2000.json")
      .defer(d3.json, "static/json/2004.json")
      .defer(d3.json, "static/json/2008.json")
      .defer(d3.json, "static/json/2012.json")
      .defer(d3.json, "static/json/2016.json")
      .await(function(error, counties, state, cities, results2000, results2004, results2008, results2012, results2016) {
          if (error) throw error;

          app.json = {
              counties: counties.features,
              state: state.features[0],
              cities: cities.features
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

          app.createHeadline(app.races[2016]);
          app.createHeadline(app.races[2012]);
          app.createHeadline(app.races[2008]);
          app.createHeadline(app.races[2004]);
          app.createHeadline(app.races[2000]);

          app.createMap(app.races[2016]);
          app.createMap(app.races[2012]);
          app.createMap(app.races[2008]);
          app.createMap(app.races[2004]);
          app.createMap(app.races[2000]);

          app.createTable(app.races[2016]);
          app.createTable(app.races[2012]);
          app.createTable(app.races[2008]);
          app.createTable(app.races[2004]);
          app.createTable(app.races[2000]);

          app.createSources();
      });
};
