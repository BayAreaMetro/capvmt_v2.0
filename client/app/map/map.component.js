'use strict';
const angular = require('angular');

const uiRouter = require('angular-ui-router');

import { _ } from 'core-js';
import routes from './map.routes';

export class MapComponent {
  /*@ngInject*/
  constructor($stateParams) {
    this.$stateParams = $stateParams;
  }

  $onInit() {
    var jurisdiction;
    if(this.$stateParams.jurisdiction){
      jurisdiction = this.$stateParams.jurisdiction
    }
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2hhcmxpZWRvdGF1IiwiYSI6ImNpazlpdzh0ZTA5d3Z2Y200emhqbml1OGEifQ.uoA6t5rO18m0BgNGPXsm5A';
    const map = new mapboxgl.Map({
      container: 'map', // container ID
      style: 'mapbox://styles/mapbox/streets-v11', // style URL
      center: [-122.424100, 37.780000], // starting position [lng, lat]
      zoom: 9, // starting zoom
      projection: 'globe', // display the map as a 3D globe
    });

    // Map style toggle 
    const layerList = document.getElementById("menu");
    const inputs = layerList.getElementsByTagName("input");

    for (const input of inputs) {
      input.onclick = (layer) => {
        const layerId = layer.target.id;
        map.setStyle("mapbox://styles/mapbox/" + layerId);
      };
    }
    // End map style toggle 

    map.on('style.load', () => {
      map.setFog({}); // Set the default atmosphere style

      // Set jurisdiction to zoom to 
      var zoomToFeature = _.filter(placesGeoJSON.features, function (item) {
        return item.properties.NAME === jurisdiction;
      });

      //use Turf.js to set geometry and zoom to feature bounding box09
      var bbox = turf.extent(zoomToFeature[0].geometry);
      map.fitBounds(bbox, { padding: 20 });

      //Add Jurisdictions Source
      map.addSource('jurisdictionBoundarySource', {
        'type': 'geojson',
        'data': placesGeoJSON
      });

      //Add Jurisdiction Layer to map and filter based on jurisdiction
      if (!map.getLayer('jurisdiction-boundary')) {
        map.addLayer({
          'id': 'jurisdiction-boundary',
          'type': 'fill',
          'source': 'jurisdictionBoundarySource',
          'paint': {
            'fill-outline-color': 'white',
            'fill-color': 'purple',
            'fill-opacity': 0.6
          },
          'filter': ['in', 'NAME', jurisdiction]
        });

      }

    });


  }
}

export default angular
  .module('capvmtV20App.map', [uiRouter])
  .config(routes)
  .component('map', {
    template: require('./map.html'),
    controller: MapComponent,
    controllerAs: 'mapCtrl',
  }).name;
