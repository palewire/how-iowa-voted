var path = d3.geo.path().projection(null);

var svg = d3.select("#map").append("svg")
  .attr("width", 960)
  .attr("height", 625);

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

queue()
  .defer(d3.json, "/static/iowa.json")
  .defer(d3.json, "/static/2000.json")
  .defer(d3.json, "/static/2004.json")
  .defer(d3.json, "/static/2008.json")
  .defer(d3.json, "/static/2012.json")
  .await(function(error, topology, results2000, results2004, results2008, results2012) {
      if (error) throw error;

      svg.append("g")
          .attr("class", "border")
        .append("path")
          .datum(topojson.feature(topology, topology.objects.state))
          .attr("class", "dropshadow")
          .attr("d", path);

      svg.append("g")
          .attr("class", "counties")
        .selectAll("path")
          .data(topojson.feature(topology, topology.objects.counties).features
            .sort(function(a, b) { return b.properties.NAME; }))
        .enter().append("path")
          .attr("class", "county")
          .attr("d", path)
          .attr("data-fips", function (d) { return d.properties.GEOID; })
          .attr("data-name", function (d) { return d.properties.NAME; });

      var maxVotes = d3.max(d3.values(results2000), function (d) { return d.margin; });
      var radius = d3.scale.sqrt()
        .domain([0, maxVotes])
        .range([0, 30]);

      svg.append("g")
          .attr("class", "bubbles")
        .selectAll("circle")
          .data(topojson.feature(topology, topology.objects.counties).features)
        .enter().append("circle")
          .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")";})
          .attr("class", function (d) {
              var results = results2000[d.properties.GEOID];
              return results.leader;
          })
          .attr("r", function(d) {
              var results = results2000[d.properties.GEOID];
              return radius(results.margin);
          });
  });
