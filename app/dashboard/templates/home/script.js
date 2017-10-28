<script language="javascript">

// Use WebComponentsReady instead of $.ready() to allow
// Polyfills to finish for more complex Web Components in Polymer.
window.addEventListener('WebComponentsReady', function() {
    $('#wait-for-it').show();
    $("#refresh-button").css("visibility", "visible");
    $("#get-link-button").css("visibility", "visible");

    /*
     *Get HTML representation of units saved in database (ex: celcius-->C)
     *
     *unit: unit string name get from database
     *return: HTML string representation of units
     * */
    var getFormattedUnit = function(unit) {
        switch (unit) {
            case "celcius":
                return "C";
            case "relative humidity":
                return "RH";
            case "percentage":
                return "%";
            case "pascal":
                return "Pa";
        }
        return unit;
    };

    /*
     *Get datapoints for initial data
     * */
    var getInitialData = function() {
        var nodeId = $('#node_id_span').html();
        var nodeUri = '/node/'+nodeId;
        var sensorTagsSpan = $('#sensor_tags_span').html();
        // Select sensors and nodes for initial load
        $.get({
            url: '/api/1.0/datapoints',
            data: {
                "sensor": sensorTagsSpan,
                "node": nodeUri
            },
        }).done(function(data) {
            $('#volcanograph')[0].chartData = data;
            $('#wait-for-it').hide();
            $('#sensor_tags_span').html(sensorTagsSpan);
            $('#node_id_span').html(nodeId);
        }).fail(function(err) {
            $('#wait-for-it').hide();
            alert("Error: Unable to fetch initial node and sensor data. Try again.");
        });
    }

    /*
     *Get new datapoints 
     * 
     *data: an object includes and array of selected sensor tags and node id
     * */
    var getRefreshData = function(data) {
        // Select sensors and nodes for initial load
        var sensorTags = data.sensors.join(",");
        var nodeUri = data.node;
        $.get({
            url: '/api/1.0/datapoints',
            data: {
                "sensor": sensorTags,
                "node": nodeUri 
            },
        }).done(function(data) {
            $('#volcanograph')[0].chartData = data;
            $('#wait-for-it').hide();
            $('#sensor_tags_span').html(sensorTags);
            var tmp = nodeUri.split("/");
            for (var i = tmp.length-1; i>=0; i--) {
                if (tmp[i] && tmp[i] !== "" && tmp[i] !== "node") {
                    $('#node_id_span').html(tmp[i].toString());
                }
            }
        }).fail(function(err) {
            $('#wait-for-it').hide();
            alert("Unable to fetch data for this node and sensors.");
        });
    }
    
    /*
     *Get datatypes from selected sensor
     *
     *sensors: array of selected sensor tags
     *onSuccess: a function called after successfully fetch datatypes 
     *onSuccessParam: parameter for onSuccess function if applied
     * */
    var getDatatypes = function(sensors, onSuccess, onSuccessParam) {
        $.get({
            url: '/api/1.0/datatypes',
        }).done(function(data) {
            var allTagUnit = {}; // Store all datatype tags as keys and units as values
            $('#volcanograph')[0].seriesConfig = {};
            seriesConfig = $('#volcanograph')[0].seriesConfig;
            for (var i in data) {
                allTagUnit[data[i].tag] = {yAxisUnit: data[i].unit};
            }
            for (var i in sensors) {
                if (sensors[i] in allTagUnit) {
                    var tag = sensors[i];
                    allTagUnit[tag].yAxisUnit = getFormattedUnit(allTagUnit[tag].yAxisUnit);
                    seriesConfig[tag] = allTagUnit[tag];
                }
            }
            onSuccess(onSuccessParam);
        }).fail(function(err) {
            $('#wait-for-it').hide();
            alert("Error: Unable to fetch datatypes");
        });
    };

    // Load initial data
    getDatatypes($('#sensor_tags_span').html().split(","), getInitialData);

    $("#refresh-button").click(function(evt) {
        // Show spinner that we're working
        $('#wait-for-it').show();

        // Check which sensors are selected
        var sensors = [];
        var items = $('#sensor-selection')[0].items;
        for (var i in items) {
            if (items[i]['checked']) {
                sensors.push(items[i]['key']);
            }
        }

        // Check which nodes are selected
        var selectedNode = $('#node')[0].selectedKey;
        if (selectedNode.length == 0 || sensors.length == 0) {
            alert("Select at least one node and sensor to display.");
            $('#wait-for-it').hide();
            return false;
        }
        var data = {};
        data.sensors = sensors;
        data.node = selectedNode;
        getDatatypes(sensors, getRefreshData, data);
    });

    $("#get-link-button").click(function(evt) {
        var nodeId = $('#node_id_span').html();
        var sensorTagsSpan = $('#sensor_tags_span').html();
        var hostname = window.location.hostname;
        if (hostname==="localhost" || hostname==="127.0.0.1") { // when debugging
            hostname += ":" + window.location.port;
        }
        var url = hostname + "/node/" + nodeId + "/" + sensorTagsSpan;

        // Copy url to clipboard
        var container = document.createElement('div');
        container.innerHTML = url;

        // Hide element
        container.style.position = 'fixed';
        container.style.pointerEvents = 'none';
        container.style.opacity = 0;

        document.body.appendChild(container);

        window.getSelection().removeAllRanges();

        var range = document.createRange();
        range.selectNode(container);
        window.getSelection().addRange(range);
        document.execCommand('copy');
        document.body.removeChild(container);
    });
});
</script>
