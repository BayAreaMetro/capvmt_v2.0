'use strict';
const angular = require('angular');

const uiRouter = require('angular-ui-router');

import routes from './data.routes';

export class DataComponent {
  /*@ngInject*/
  constructor($scope, $http) {
    this.$http = $http;
    this.$scope = $scope;
  }

  $onInit(){
    this.$http.get('/api/data')
    .then(response => {
      console.log(response);
      this.$scope.dataRows = response.dataRows;
    })
    .catch(err => {
      console.log(err);
    })
  }
};

export default angular.module('capvmtV20App.data', [uiRouter])
  .config(routes)
  .component('data', {
    template: require('./data.html'),
    controller: DataComponent,
    controllerAs: 'dataCtrl'
  })
  .name;
