'use strict';

/**
 * @name select
 */
var selectLabelDirective =  ['$compile', function ($compile) {
  var template =  '<div><label ng-repeat="label in labels">{{label.label}}</label></div>';
  return {
    restrict: 'AC',
    transclude: true,
    replace: true,
    scope: {
      multiple: '=',
      labels: '='
    },
    link: function (scope, element, attrs) {

    },
    template: template
  };
}];

/**
 * @name option
 */
var selectOptionsDirective = ['$compile', 'yamUiScrollerService', function ($compile, yamUiScrollerService) {
  var template = '<ul>' +
    '<li ng-repeat="option in options" ng-switch on="option.hasGroup" ng-class="{true: \'selected\'}[option.selected]">' +
    '<div class="ym-optgroup" ng-switch-when="true">' +
    '<label class="optgroup"> {{option.group.label}} </label>' +
    '<ul><li ng-repeat="opt in option.group.options" ng-class="{true: \'selected\'}[opt.selected]" ng-click="select({value:opt})"><div class="ym-option"><label>{{opt.label}}</label></div></li></ul>' +
    '</div>' +
    '<div class="ym-option" ng-switch-default ng-click="select({value:option})"><label>{{option.label}}</label></div>' +
    '</li>' +
    '</ul>';
  return {
    restrict: 'C',
    scope: {
      require: '?^select',
      options: '=',
      select: '&',
      selected: '&'
    },
    link: function (scope, element, attrs) {
      yamUiScrollerService.instance(element);
      element.on('$destroy', function () {
        yamUiScrollerService.destroy();
      });
      console.log(scope.options);
    },
    template: template
  };
}];

var selectDirective = ['$compile', '$timeout', '$window', 'yamUiScrollerService', function ($compile, $timeout, $window, yamUiScrollerService) {

  function selectClick(element, option, scope) {
    element.bind('click', function (e) {
      e.preventDefault();
      option.selected = !option.selected;
    });
  }

  function makeOptionsList($options, $scope) {
    var list = [];
    angular.forEach($options, function (element, index) {
      var el = angular.element(element);
      var item = listMaker(element, $scope);
      if (item) {
        list.push(item);
      }
    });

    //$options.splice(0);
    return list;
  }

  function listMaker(element, $scope) {
    var out = {}, value, label, text;
    switch (element.nodeName.toLowerCase()) {
      case 'option':
        label    = element.label ? element.label : element.text.replace(/(^\s+|\s+$)/, '');
      label    = label === '' ? undefined : label;
      value    = element.value ? element.value : out.label;
      value    = value[0] === '?' ? false : value;

      console.log(value);

      if (!label && !value) {
        return false;
      }
      out.hasGroup = false;
      out.label = label;
      out.value = value;
      out.selected = element.selected;

      if (out.selected) {
        $scope.selectOption(out);
      }
      return out;
      case 'optgroup':
        out.hasGroup = true;
      out.group = {
        label: element.label,
        options: makeOptionsList(element.childNodes, $scope)
      };
      return out;
      default:
        return false;
    }
  }

  function unselectOptions(options) {
    angular.forEach(options, function (option) {
      if (option.group) {
        unselectOptions(option.group);
      } else {
        option.selected = false;
      }
    });
  }

  function selectOption(scope, option) {
    unselectOptions(scope.optionList);
    option.selected = true;
    scope.labels = [option];
    console.log(arguments);
    console.log(option.value);
    scope.model = option.value;
  }

  function selectMultiple(scope, option) {
    console.log(arguments);
    var index = scope.selected.indexOf(option.value);
    if (index === -1) {
      // add selected selected;
      option.selected = true;
      scope.selected.push(option.value);
      scope.labels.push(option);
    } else {
      // remove selected;
      option.selected = false;
      scope.selected.splice(index, 1);
      scope.labels.splice(index, 1);
    }

    if (scope.selected.length) {
      scope.model = scope.selected;
    } else {
      scope.model = undefined;
    }
  }

  function setupOptions(scope, element) {
    scope.selectOption = angular.bind(null, selectOption, scope);
    bindShowToggle(element, scope);
  }

  function setupMultiple(scope, element) {
    scope.selected = [];
    scope.selectOption = angular.bind(null, selectMultiple, scope);
    bindShowToggle(element, scope);
  }

  function bindShowToggle(element, scope) {
    element.on('click', function (event) {
      event.preventDefault();
      scope.show = !scope.show;
      scope.$apply();

      if (scope.show) {
        $timeout(function () {
          yamUiScrollerService.update();
        }, 100);
      }
    });
    bindTriggerCloseOutofFocus(scope, element);
  }

  function bindTriggerCloseOutofFocus(scope, element) {
    angular.element($window).on('click', function (e) {
      if (!scope.show) {
        return;
      }

      var count = 6,
      child = angular.element(e.target);

      while (count--) {
        if (child && child[0] === element[0]) {
          return;
        }
        child = child.parent();
      }

      scope.show = !scope.show;
      scope.$apply();
    });
  }

  function compileSelectBoxTemplate(scope, element, compileNodeFn, transcludeFn) {
    compileNodeFn(scope, function (clone, scope) {
      var selectWrap = angular.element(document.createElement('div'));
      selectWrap.addClass('select');
      element.after(clone);
      clone.append(selectWrap);
      selectWrap.append(element);
      transcludeFn(scope, function ($contents, $scope) {
        element.append($contents);
      });

      postSetUp(scope, clone);
    });
  }

  function postSetUp(scope, node) {
    if (scope.multiple) {
      setupMultiple(scope, node);
    } else {
      setupOptions(scope, node);
    }
  }

  var selectTemplate = '<div class="ym-select" ng-class="{true:\'open\'}[show]">' +
    '<label class="ym-select-label" labels="labels"></label>' +
    '<div ng-if="show" class="ym-select-options" select="selectOption(value)" options="optionList"></div>' +
    '</div>';

  return {
    replace: false,
    transclude: true,
    scope: {
      model: '=ngModel',
      multiple: '='
    },
    require: ['select', '?ngModel'],
    restrict: 'E',
    compile: function (tElement, tAttrs, transclusion) {
      var compiledNode;
      return function (scope, element, attrs, controllers) {

        var opts, optsLength, select = element;
        scope.labels = [];
        scope.optionList = [];
        scope.show = false;

        if (!compiledNode) {
          compiledNode = $compile(selectTemplate);
        }

        compileSelectBoxTemplate(scope, element, compiledNode, transclusion);

        scope.$watch(function () {
          var children = select.children();

          if (optsLength !== children.length) {
            opts = children;
            optsLength = children.length;
            scope.$broadcast('updateList', children, scope);
          }
        });

        scope.$on('updateList', function ($event, $options, $scope) {
          $scope.optionList = makeOptionsList($options, $scope);
        });
      };
    }
  };
}];
