'use strict';

/**
 * @param yam.tabs:yamTab
 * @param yam.tabs:yamTabset
 *
 */
var tab = ['$log', '$parse', '$q', function ($log, $parse, $q) {
  return {
    replace: true,
    transclude: true,
    require: '?^ymTabset',
    restrict: 'AE',
    link: function (scope, element, attrs, ctrl) {

      if (!ctrl) {
        return;
      }
      var $watch = scope.$new(true);
      var wasActive = false;
      var resolving = scope.$eval(attrs.ymTabResolving);
      var caller    = scope.$eval(attrs.ymTabResolvingCaller);
      var resolveTabChange = angular.isFunction(resolving);
      var deferred;
      var tab = {
        active: $parse(attrs.active)(),
        label: scope.label
      };

      wasActive = tab.active;

      ctrl.addTab(tab);

      $watch.ctrl = ctrl;
      $watch.tab = tab;

      $watch.$watch('ctrl.enabled', function (enabled) {

        if (enabled !== undefined) {
          if (!enabled) {
            wasActive = tab.active;
            tab.active = true;
          } else {
            if (deferred) {
              deferred.reject();
            }
            tab.active = wasActive || false;
          }
        }
      });

      $watch.$watch('tab.active', function (state) {
        $log.info('state', state);
        if (state && state !== undefined) {

          if (resolveTabChange) {
            deferred = $q.defer();
            deferred.promise.then(function () {
              $log.info('dererred rm inactive');
              element.removeClass('waiting');
              element.removeClass('inactive');
            });
            element.addClass('waiting');

            return caller ? resolving.call(caller, deferred, scope.$index) : resolving(deferred, scope.$index);
          }

          $log.info('rm inactive');
          element.removeClass('inactive');
          return;
        } else if (state === false) {
          if (deferred) {
            deferred.reject();
          }
          $log.info('add inactive');
          element.addClass('inactive');
        }
      });

      //
      attrs.$observe('label', function (label) {
        if (label) {
          tab.label = label;
        }
      });
    },
    template: '<div class="ym-tab" ng-transclude></div>'
  };
}];

/**
 * @name ymTabset
 * @param {object} $log
 */
var tabSet = ['$log', '$sce', function ($log, $sce) {

  function TabSetController ($scope, $element, $attrs) {
    this.$scope = $scope;
    this.tabs = [];
    this.$element = $element;
    this.$attrs = $attrs;
  }

  TabSetController.prototype = {
    addTab: function (tab) {
      $log.info('add tab');
      this.tabs.push(tab);
      $log.debug(tab);
    },
    setActiveTab: function (index) {

      if (this.tabs[index]) {
        angular.forEach(this.tabs, function (tab) {
          tab.active = false;
        });
        this.tabs[index].active = true;
      }
    },
    setDisabled: function () {
      this.enabled = false;
    },
    setEnabled: function () {
      this.enabled = true;
    }
  };

  TabSetController.$inject = ['$scope', '$element', '$attrs'];

  return {
    transclude: true,
    replace: true,
    restrict: 'A',
    controller: TabSetController,
    controllerAs: 'controller',
    link: function (scope, element, attrs, ctrl) {

      attrs.$observe('ymTabset', function (disabled) {
        if (scope.$eval(disabled)) {
          scope.controller.setDisabled();
        } else {
          scope.controller.setEnabled();
        }
      });

      scope.setActive = function ($index) {
        if (ctrl.enabled === false) {
          return;
        }
        scope.controller.setActiveTab($index);
      };

      scope.setActive(0);
      scope.toTrusted = function(html_code) {
        return $sce.trustAsHtml(html_code);
      }
    },
    template:
      '<div class="ym-tabset">'+
      '  <div class="tab-header">'+
      '    <ul>'+
      '      <li ng-repeat="tab in controller.tabs track by $index" ng-click="setActive($index)" ng-style="{width: (100 / controller.tabs.length) + \'%\'}" ng-class="{false: \'inactive\'}[tab.active]" class="tab-label"><label ng-bind-html="toTrusted(tab.label)"></label></li>'+
      '    </ul>'+
      '  </div>'+
      '  <div class="tab-content" ng-transclude></div>'+
      '</div>'
  };
}];
