'use strict';

export default function($stateProvider) {
  'ngInject';
  $stateProvider
    .state('map', {
      url: '/map?jurisdiction',
      template: '<map></map>'
    });
}
