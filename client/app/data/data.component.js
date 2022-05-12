'use strict';
const angular = require('angular');

const uiRouter = require('angular-ui-router');

import routes from './data.routes';

export class DataComponent {
  /*@ngInject*/
  constructor() {
    this.message = 'Hello';
  }
}

export default angular.module('capvmtV20App.data', [uiRouter])
  .config(routes)
  .component('data', {
    template: require('./data.html'),
    controller: DataComponent,
    controllerAs: 'dataCtrl'
  })
  .name;
