$(function() {
    startSpinner("dendogram");
    datosTask.then(dendogram).then(stopSpinner).catch(function (error) {
        throw error;
    });
});

var secreatariesSeparator = "-";

function dendogram(datos) {
    var selectedradius = getParameterByName("radio");
    if (!selectedradius) {
        radius = window.innerWidth / 2;
    } else {
        radius = selectedradius;
    }
    var results = generateTree(datos.results, 0)[0];
    console.log(results);

    var data = results.children;
    var dataNodes = data.map(function (p) {
        return p.name
    }).sort();
    // console.log(data);


    var cluster = d3.layout.cluster()
        .size([360, radius - 120]);

    var diagonal = d3.svg.diagonal.radial()
        .projection(function (d) {
            return [d.y, d.x / 180 * Math.PI];
        });
    var auxRadius = radius*3;
    var svg = d3.select("#dendogram").append("svg")
        .attr("width", radius * 2)
        .attr("height", radius * 2)
        .append("g")
        .attr("transform", "scale(0.85), translate(" + auxRadius/2.5 + "," + auxRadius/2.75 + ")");

    var nodes = cluster.nodes(results);

    var link = svg.selectAll("path.link")
        .data(cluster.links(nodes))
        .enter().append("path")
        .attr("class", "link")
        .attr("stroke", function (d) {
            return d3.scale.category10().range()[d.target.depth];
        })
        .attr("d", diagonal);

    var node = svg.selectAll("g.node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
            return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
        });

    var div = d3.select("#dendogram").append("div")
        .attr("class", "tooltip")
        .style("opacity", 1e-6)
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);

    node.append("a")
        .attr("xlink:href", datumLink)
        .append("circle")
        .attr("r", function (d) {
            var weight = d.size*20;
            if (weight) {
                return (110 - weight) * 0.15;
            }
            return (110 - d.size) / 4;
        })
        .attr("stroke",  "DarkBlue")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseout", mouseout);

    node.append("a")
        .attr("xlink:href", datumLink)
        .append("text")
        .attr("dy", ".31em")
        .attr("text-anchor", function (d) {
            return d.x < 180 ? "start" : "end";
        })
        .attr("transform", function (d) {
            return d.x < 180 ? "translate(15)" : "rotate(180)translate(-15)";
        })
        .text(function (d) {
            return d.name;
        })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseout", mouseout);

    function mouseover() {
        div.transition()
            .duration(300)
            .style("opacity", 1);
    }

    function mousemove(d) {
        div
            .html("<div class='img'><img style='max-height:100px;max-width:150px' src='" + d.photo + "'/></div><br/>" +
                "<b>" + d.name + "</b><br/>" + d.rank + "<br/><br/><i>" + d.data.cargo.oficina + "</i>")
            .style("left", (d3.event.pageX ) + "px")
            .style("top", (d3.event.pageY) + "px");
    }

    function mouseout() {
        div.transition()
            .duration(300)
            .style("opacity", 1e-6);
    }

    function datumLink(d) {
        if (d.link) {
            return getApiUrl() + d.link;
        }
        return "#";
    }

    d3.select(self.frameElement).style("height", radius * 2 + "px");

    if (getParameterByName("select")) {
        loadFilters(secretaries, filterSecretaries, selectedradius);
    }
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function loadFilters(secretaries, current, selectedradius) {
    var s2 = $("<select/>", {class: "js-example-basic-multiple", multiple: "multiple"});
    secretaries.forEach(function (secretary, i) {
        $("<option />", {value: i, text: secretary}).appendTo(s2);
    });
    if (current) {
        var currentVals = new Array();
        current.forEach(function (o) { //name -> id
            currentVals.push(secretaries.indexOf(o));
        });
        s2.val(currentVals)
    }
    s2.change(function () {
        var secretariesAux = $(this).val();
        var params = new Object();
        if (selectedradius) {
            params.radio = selectedradius;
        }
        if (getParameterByName("select")) {
            params.select = 1;
        }
        if (secretariesAux) {
            if(secretariesAux.length === 1) {
                params.secretarias = secretariesAux[0];
            } else {
                params.secretarias = "";
                secretariesAux.forEach(function (o) {
                    if(o === secretariesAux[0]) {
                        params.secretarias = o; //first element
                    } else {
                        params.secretarias = params.secretarias + secreatariesSeparator + o;
                    }
                });
            }
        }
        window.location.href = "?" + $.param(params);
    });
    s2.appendTo("#filters");
    $(".js-example-basic-multiple").select2();
}
