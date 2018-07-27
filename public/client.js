// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

mapboxgl.accessToken = 'pk.eyJ1IjoiYW5kcmUtbGUiLCJhIjoiY2ppZTF2MmxuMDh5MjN3bnhwMWkxanRieiJ9.M11uShgloCQznQieQWvDBg';

function update(data) {
    axios.get('points').then(function (data) {
    	data = GeoJSON.parse(data.data, {Point: 'coordinates'});
		map.getSource('points').setData(data);
		return axios.get('hexagons');
	}).then(function (response) {
	    map.getSource('hexagons').setData(response.data);
	}).catch(function (error) {
		console.log(error);
	});
    console.log("update the map");
}

function addPointsLayer(data){
	
	data = GeoJSON.parse(data, {Point: 'coordinates'});
	// Add a new source from our GeoJSON data and set the
    // 'cluster' option to true. GL-JS will add the point_count property to your source data.
    map.addSource("points", {
        type: "geojson",
        data: data,
        cluster: true,
        clusterMaxZoom: 10, // Max zoom to cluster points on
        clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
    });

	    map.addLayer({
	    	id: "clusters",
	        type: "circle",
	        source: "points",
	        filter: ["has", "point_count"],
	        paint: {
            // Use step expressions (https://www.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
            // with three steps to implement three types of circles:
            //   * Blue, 20px circles when point count is less than 100
            //   * Yellow, 30px circles when point count is between 100 and 750
            //   * Pink, 40px circles when point count is greater than or equal to 750
            "circle-color": [
                "step",
                ["get", "point_count"],
                "#51bbd6",
                100,
                "#f1f075",
                750,
                "#f28cb1"
            ],
            "circle-radius": [
                "step",
                ["get", "point_count"],
                20,
                100,
                30,
                750,
                40
            ]}	
    	});

      	map.addLayer({
          	id: "cluster-count",
          	type: "symbol",
          	source: "points",
          	filter: ["has", "point_count"],
          	layout: {
            	"text-field": "{point_count_abbreviated}",
              	"text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              	"text-size": 12
          	}
      	});

      	map.addLayer({
          	id: "unclustered-point",
          	type: "circle",
          	source: "points",
          	filter: ["!has", "point_count"],
          	paint: {
              	"circle-color": "#11b4da",
              	"circle-radius": 4,
              	"circle-stroke-width": 1,
              	"circle-stroke-color": "#fff"
          	}
      	});

      	// inspect a cluster on click
      	map.on('click', 'clusters', function (e) {
          var features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
          var clusterId = features[0].properties.cluster_id;
          map.getSource('points').getClusterExpansionZoom(clusterId, function (err, zoom) {
              if (err)
                  return;

              map.easeTo({
                  center: features[0].geometry.coordinates,
                  zoom: zoom
              });
          });
      });

      map.on('mouseenter', 'clusters', function () {
          map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'clusters', function () {
          map.getCanvas().style.cursor = '';
      });
}

function addHexagonsLayer(data){

	map.addSource("hexagons", {
        'type': 'geojson',
        'data': data
    });

	map.addLayer({
            'id': "hexagons-content",
            'type': 'fill',
            'source': "hexagons",
            'layout': {},
            'paint': {
                'fill-color': [
	                'interpolate',
	                ['linear'],
	                ['get', 'num'],
	                0, 	'#228B22',    //'#F2F12D',
	                5, '#7CFC00',	  //'#EED322',
	                10, '#98FB98',	  //'#E6B71E',
	                15, '#F0FFF0',    //'#DA9C20',
	                20, '#F5F5F5',    //'#CA8323',
	                25, '#FFF0F5',    //'#B86B25',
	                30, '#F08080',    //'#A25626',
	                35, '#FF0000',    //'#8B4225',
	                40, '#8B0000'     //'#723122'
            	],
                 "fill-opacity": 0.3
            }
    });

        map.addLayer({
            "id": "hexagons-borders",
            "type": "line",
            "source": "hexagons",
            "layout": {},
            "paint": {
                "line-color": "#999999",
                "line-width": 2
            }
        });
}

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v9',
    center: [106.6297, 10.8231],
    zoom: 11
});
axios.get('points').then(function (data) {
	addPointsLayer(data.data);
	return axios.get('hexagons');
}).then(function (response) {
    addHexagonsLayer(response.data);
}).catch(function (error) {
	console.log(error);
});

window.setInterval(update, 60000);

//add toggle buttons
var toggleableLayerIds = [ 'points', 'hexagons' ];

for (var i = 0; i < toggleableLayerIds.length; i++) {
    var id = toggleableLayerIds[i];

    var link = document.createElement('a');
    link.href = '#';
    link.className = 'active';
    link.textContent = id;

    link.onclick = function (e) {
        var clickedLayer = this.textContent;
        e.preventDefault();
        e.stopPropagation();
          
        if (clickedLayer === 'points') {
        	var visibility = map.getLayoutProperty('clusters', 'visibility');
        } else if (clickedLayer === 'hexagons') {
            var visibility = map.getLayoutProperty('hexagons-content', 'visibility');
        } else{
            var visibility = map.getLayoutProperty(clickedLayer, 'visibility');
        }

        if (visibility === 'visible') {
            if (clickedLayer === 'points'){
                map.setLayoutProperty('clusters', 'visibility', 'none');
                map.setLayoutProperty('cluster-count', 'visibility', 'none');
                map.setLayoutProperty('unclustered-point', 'visibility', 'none');
            } else if (clickedLayer === 'hexagons') {
                map.setLayoutProperty('hexagons-content', 'visibility', 'none');
                map.setLayoutProperty('hexagons-borders', 'visibility', 'none');
            } else{
                map.setLayoutProperty(clickedLayer, 'visibility', 'none');
            }
            this.className = '';
        } else {
            if (clickedLayer === 'points'){
                map.setLayoutProperty('clusters', 'visibility', 'visible');
                map.setLayoutProperty('cluster-count', 'visibility', 'visible');
                map.setLayoutProperty('unclustered-point', 'visibility', 'visible');
            } else if (clickedLayer === 'hexagons') {
                map.setLayoutProperty('hexagons-content', 'visibility', 'visible');
                map.setLayoutProperty('hexagons-borders', 'visibility', 'visible');
            } else{
                map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
            }
            this.className = 'active';
        }
    };

    var layers = document.getElementById('menu');
    layers.appendChild(link);
}