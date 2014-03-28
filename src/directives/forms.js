'use strict';

/**
 * @name ymZipList
 */
var zipper = [function () {
  return {
    restrict: 'AE',
    transclude: true,
    replace: true,
    scope: {
      visible: '@'
    },
    link: function (scope, element, attrs) {
      scope.visible = false;
      scope.toggle = function () {
        scope.visible = !scope.visible;
      };
    },
    template:
      '<div class="ym-zip-list"><button ng-click="toggle()" class="indicator">click</button>' +
      '  <div ng-show="visible">' +
      '    <div ng-transclude></div>' +
      '  </div>' +
      '</div>'
  };
}];

/**
 * @name ymLoadUnlock
 */
var loadUnlock = ['$window', '$parse', function ($window, $parse) {
  return {
    compile: function (element, attrs)  {
      var fn = $parse(attrs.ymLoadUnlock);
      return function(scope, element, attrs) {

        var unlocked = false;
        element.on('click', function(event) {

          event.preventDefault();
          event.stopPropagation();

          if (unlocked) {
            scope.$apply(function() {
              fn(scope, {$event:event});
            });
            return unload();
          }

          unlocked = true;
          attrs.$addClass('unlocked');
          angular.element($window.document).on('click', unload);
          scope.$apply();

        });

        function unload() {
          scope.$apply(function () {
            unlocked = false;
            attrs.$removeClass('unlocked');
            angular.element($window.document).off('click', unload);
          });
        }
      };
    }
  };
}];

/**
 * @name ymEditField
 */
var editField = ['$compile', function ($compile) {

  return {
    priority: -100000,
    replace: true,
    tranclude: 'element',
    scope: {},
    restrict: 'A',
    compile: function (element, attrs, linker) {

      var tmpl = '<div class="ym-edit-field fpp">'+
        '  <div class="button edit" ng-class="{true:\'active\'}[!disabled]"ng-click="toggleActive()"><span>edit</span></div>'+
        '  <div class="ym-input"></div>'+
        '</div>';
      var compiler = $compile(tmpl);

      return function (scope, element, attrs) {
        var compiled;
        scope.disabled = true;
        scope.toggleActive = function () {
          scope.disabled = false;//!scope.disabled;
          element.select();

          if (!scope.disabled) {
            element.select();
          }
        };

        //attrs.$set('ngDisabled', scope.disabled);
        //scope.$eval(attrs.ngDisabled);

        element.on('blur', function () {
          scope.$apply(function () {
            scope.disabled = true;
          });
        });

        compiler(scope, function (clone) {
          //element.wrap(clone);
          element.after(clone);
          clone.find('.ym-input').append(element);
        });
      };
    },
    template: '<input ym-input-nowrap="true" ng-disabled="disabled"/>'
  };
}];
