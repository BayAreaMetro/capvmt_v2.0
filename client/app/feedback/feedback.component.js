'use strict';
const angular = require('angular');

const uiRouter = require('angular-ui-router');

import routes from './feedback.routes';

export class FeedbackComponent {
  /*@ngInject*/
  constructor($http, $scope, $state, $location, $timeout, data, uuid) {
    this.$http = $http;
    this.$scope = $scope;
    this.$state = $state;
    this.$location = $location;
    this.$timeout = $timeout;
    this.uuid = uuid;
    //Services
    this.data = data;
  }

  submitFeedback(form) {
    
    this.spin = true;
    this.$scope.feedback.recid = this.uuid.v1();
    this.$scope.feedback.source = "CAPVMT 2.0";
    console.log(this.$scope.feedback);
    this.$http.post('http://basis-dev-2022.us-west-2.elasticbeanstalk.com/api/feedback/add', this.$scope.feedback)
        .then(response => {
            console.log(response);
            // this.$anchorScroll();
            this.feedbackSuccess = true;
            this.$scope.feedback = {};
            this.spin = false;
            $('#feedbackModal').modal('hide');

        })
        .catch(err => {
            console.log(err);
        })
}
}

export default angular.module('capvmtV20App.feedback', [uiRouter])
  .config(routes)
  .component('feedback', {
    template: require('./feedback.html'),
    controller: FeedbackComponent,
    controllerAs: 'feedbackCtrl'
  })
  .name;
