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

    //Download data function
    this.$scope.jsonToCSVConverter = function(JSONData, PlaceName, Scenario, ShowLabel) {
      //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
      console.log(JSONData);
      var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;

      var CSV = '';
      //Set Report title in first row or line

      CSV += 'Jurisdiction: ' + PlaceName + '\r\n\n';
      CSV += 'Model Run: ' + Scenario + '\r\n\n';

      //This condition will generate the Label/Header
      if (ShowLabel) {
          var row = "";

          //This loop will extract the label from 1st index of on array
          for (var index in arrData[0]) {

              //Now convert each value to string and comma-seprated
              row += index + ',';
          }

          row = row.slice(0, -1);

          //append Label row with line break
          CSV += row + '\r\n';
      }

      //1st loop is to extract each row
      for (var i = 0; i < arrData.length; i++) {
          var row = "";

          //2nd loop will extract each column and convert it in string comma-seprated
          for (var index in arrData[i]) {
              row += '"' + arrData[i][index] + '",';
          }

          row.slice(0, row.length - 1);

          //add a line break after each row
          CSV += row + '\r\n';
      }

      if (CSV == '') {
          alert("Invalid data");
          return;
      }

      //Generate a file name
      var fileName = "VMT_Data_";
      //this will remove the blank-spaces from the title and replace it with an underscore
      fileName += PlaceName.replace(/ /g, "_");

      //Initialize file format you want csv or xls
      var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);

      // Now the little tricky part.
      // you can use either>> window.open(uri);
      // but this will not work in some browsers
      // or you will not get the correct file extension    

      //this trick will generate a temp <a /> tag
      var link = document.createElement("a");
      link.href = uri;

      //set the visibility hidden so it will not effect on your web-layout
      link.style = "visibility:hidden";
      link.download = fileName + ".csv";

      //this part will append the anchor tag and remove it after automatic click
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }
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
      
        //Format numbers
        response.data.forEach(element => {
          element.inside = parseFloat(element.inside);
          element.outside = parseFloat(element.outside);
          element.partially_in = parseFloat(element.partially_in);
          element.persons = parseFloat(element.persons);
          element.total = parseFloat(element.total);
        });
  
        this.$scope.vmtData = response.data;
        this.$scope.tazList = response.data[0].tazlist.replace(/,/g, ", ");
        console.log(this.$scope.tazList);
        console.log(response.data); 
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

  // getMap(){
  //   this.$state.go('map', { 'jurisdiction': this.$scope.selectedPlace });
  // }

  downloadData(){
    this.$scope.jsonToCSVConverter(this.$scope.vmtData, this.$scope.vmtData[0].cityname, this.$scope.vmtData[0].cityname, true);


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
  }
  )
  .name;
// Have MZ help us set the default value to Alameda.