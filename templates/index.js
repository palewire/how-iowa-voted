var app = {};
app.selector = "section.graphic";
app.path = d3.geo.path().projection(null);
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
app.createSvg = function () {
    var svg = d3.select("section#maps")
      .append("section")
        .attr("class", "map")
      .append("svg")
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
app.createMap = function (results) {
    var svg = app.createSvg();
    svg.append("g")
        .attr("class", "bubbles")
      .selectAll("circle")
        .data(topojson.feature(app.topology, app.topology.objects.counties).features)
      .enter().append("circle")
        .attr("transform", function(d) { return "translate(" + app.path.centroid(d) + ")";})
        .attr("class", function (d) {
            var county = results[d.properties.GEOID];
            return county.leader;
        })
        .attr("r", function(d) {
            var county = results[d.properties.GEOID];
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

          app.createMap(results2000);
          app.createMap(results2004);
      });
};
