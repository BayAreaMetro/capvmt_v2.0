'use strict';
const angular = require('angular');

const uiRouter = require('angular-ui-router');

import routes from './data.routes';

export class DataComponent {
  /*@ngInject*/
  constructor($scope, $http, $state) {
    this.$http = $http;
    this.$scope = $scope;
    this.$state = $state;
  }

  $onInit(){
    this.$scope.noData = false;
    //Get list of years for drop down menu
    this.getYears();

    //Get list of jurisdictions for drop down menu
    this.getJurisdictions();

  }

  getYears(){
    this.$http.get('/api/data/years/all')
    .then(response => {
      console.log(response);
      this.$scope.Years = response.data;
    });
  }

  getJurisdictions(){
    this.$http.get('/api/data/jurisdictions/all')
    .then(response => {
      console.log(response);
      this.$scope.Jurisdictions = response.data;
    })
    .catch(err => {
      console.log(err);
    });
  }

  getVMTbyJurisdiction(){
    var cityname = this.$scope.selectedPlace;
    var model_run = this.$scope.selectedModelRun;

    console.log(cityname);
    console.log(model_run);
    this.$http.get(`/api/data/vmt/${model_run}/${cityname}`)
    .then(response => {
      console.log(response);
      if(response.data.length === 0){
        this.$scope.noData = true;
      } else {
        this.$scope.noData = false;
        var tazList = '';
        //Format numbers
        response.data.forEach(element => {
          element.inside = parseFloat(element.inside);
          element.outside = parseFloat(element.outside);
          element.partially_in = parseFloat(element.partially_in);
          element.persons = parseFloat(element.persons);
          element.total = parseFloat(element.total);
          tazList = tazList.concat(element.tazlist, ', ');
        });
  
        this.$scope.vmtData = response.data;
        this.$scope.tazList = tazList;
  
        this.$scope.totals = {};
  
       this.$scope.totals.totalInside = _.sum(_.map(this.$scope.vmtData, 'inside'));
       this.$scope.totals.totalOutside = _.sum(_.map(this.$scope.vmtData, 'outside'));
       this.$scope.totals.totalPartial = _.sum(_.map(this.$scope.vmtData, 'partially_in'));
       this.$scope.totals.totalPersons = _.sum(_.map(this.$scope.vmtData, 'persons'));
       this.$scope.totals.totalVMT = _.sum(_.map(this.$scope.vmtData, 'total'));
       this.$scope.totals.totalVMTPerCapita = this.$scope.totals.totalVMT / this.$scope.totals.totalPersons;
       console.log(this.$scope.totals);
      }
    })
    .catch(err => {
      console.log(err);
    });
  }

  getMap(){
    this.$state.go('map', { 'jurisdiction': this.$scope.selectedPlace });
  }

};

export default angular.module('capvmtV20App.data', [uiRouter])
  .config(routes)
  .component('data', {
    template: require('./data.html'),
    controller: DataComponent,
    controllerAs: 'dataCtrl'
  })
  .filter('percentage', ['$filter', function ($filter) {
    return function (input, decimals) {
      return $filter('number')(input * 100, decimals) + '%';
    };
  }])
  .filter('thousandSuffix', function () {
    return function (input, decimals) {
      var exp, rounded,
        suffixes = ['k', 'M', 'G', 'T', 'P', 'E'];

      if(window.isNaN(input)) {
        return null;
      }

      if(input < 1000) {
        return input;
      }

      exp = Math.floor(Math.log(input) / Math.log(1000));

      return (input / Math.pow(1000, exp)).toFixed(decimals) + suffixes[exp - 1];
    };
  })
  .name;
