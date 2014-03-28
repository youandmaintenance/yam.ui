'use strict';

/**
 * @name yam.ui
 */
angular.module('yam.ui', [])

.config(['$provide', function ($provide) {
  $provide.service('yamUiScrollerService', function () {
    return {
      instance: function (element) {
        this.setInstance(new IScroll(element[0], {
          scrollbars: true,
          //customStyle: 'my-scrollbars',
          mouseWheel: true,
          eventPassthrough: false,
          preventDefault: false
        }));
      },
      setInstance: function (instance) {
        this._instance = instance;
      },
      destroy: function () {
        this._instance.destroy();
      },
      update: function () {
        this._instance.refresh();
      }
    };
  });
}])
.directive('ymSelectLabel', selectLabelDirective)
.directive('ymSelectOptions', selectOptionsDirective)
.directive('select', selectDirective)
.directive('input', inputDirective)
.directive('ymTab', tab)
.directive('ymTabset', tabSet);
