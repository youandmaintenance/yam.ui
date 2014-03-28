'use strict';

/* globals jQuery */

var inputTypes = {};
var compiled = {};

function typeSupported(type) {
  return inputTypes.hasOwnProperty(type.toLowerCase());
}

function nativeSupported(element, type) {
  return element[0].type.toLowerCase() === type;
}

function replaceController(scope, ctrl) {
  scope.controller = ctrl;
}

var inputTemplate = '<div class="ym-input"></div>';

/**
 * @name ym:input type text
 */
inputTypes.text = (function () {

  function observeValue($model, $timeout) {
    $model.$viewChangeListeners.push(function (val) {
      $timeout(function () {
      }, 1000);
    });
  }

  return function (scope, element, attrs, controllers, transclusion, $compile, $window, $timeout) {

    observeValue(controllers, $timeout);

    if (attrs.ymInputNowrap) {
      return;
    }

    if (!compiled.text) {
      compiled.text = $compile(inputTemplate);
    }
    compiled.text(scope, function (clone) {
      clone.addClass('input-' + attrs.type.toLowerCase());
      clone.addClass(attrs.class);
      if (!(element instanceof jQuery)) {
        element.after(clone);
      }
      element.wrap(clone);
      element.removeClass(attrs.class);
    });
  };
}());

/**
 * @name ym:input type url
 *
 * @description
 * @example
 * <input type="url" ng-model="model" name="url"/>
 */
inputTypes.url = (function () {
  var inputFn = inputTypes.text;
  return function (scope, element, attrs, controllers, transclusion, $compile, $window, $timeout) {
    if (!attrs.placeholder) {
      attrs.placeholder = 'http://example.com';
      element[0].placeholder = attrs.placeholder;
      inputFn(scope, element, attrs, controllers, transclusion, $compile, $window, $timeout);
    }
  };
}());

/**
 * @name ym:input type number
 *
 * @description
 * @example
 * <input type="number" ng-model="model" name="number"/>
 *
 */
inputTypes.number = (function () {

  var wrapperTemplate =
    '<div class="ym-input input-number">' +
    '  <div class="spinners">' +
    '    <div class="spinner-up"></div>' +
    '    <div class="spinner-down"></div>' +
    '  </div>' +
    '</div>',
  spinnerTemplate = '<div class="spinners"></div>',

  stepUp,
  stepDown;

  function createFn(native) {
    if (stepDown && stepUp) {
      return;
    }

    if (native) {
      stepUp = function (Ctrl) {
        Ctrl.$element[0].stepUp();
        Ctrl.$model.$setViewValue(Ctrl.$element[0].value);
      };
      stepDown = function (Ctrl) {
        Ctrl.$element[0].stepDown();
        Ctrl.$model.$setViewValue(Ctrl.$element[0].value);
      };

    } else {
      stepUp = function (Ctrl) {
        Ctrl.$model.$setViewValue(Ctrl.$model.$modelValue + Ctrl.steps);
      };
      stepDown = function (Ctrl) {
        Ctrl.$model.$setViewValue(Ctrl.$model.$modelValue - Ctrl.steps);
      };
    }

  }

  function setDefaultValue(Ctrl) {
    if (isNaN(Ctrl.$model.$modelValue)) {
      Ctrl.$model.$setViewValue(Ctrl.min || 0);
      Ctrl.$model.$render();
      Ctrl.$scope.$apply();
      return false;
    }
    return true;
  }

  function InputNumberController($scope, $model, $element, $attrs) {
    var native = nativeSupported($element, 'number');
    this.$scope = $scope;
    this.$model = $model;
    this.$element = $element;
    this.steps = $attrs.step ? parseInt($attrs.step, 10) : 1;
    this.min   = $attrs.min  ? parseInt($attrs.min, 10) : false;
    this.max   = $attrs.max  ? parseInt($attrs.max, 10) : false;
    this.$native = nativeSupported($element, 'number') && $element[0].stepUp;
    createFn(this.$native);
  }

  function maxReached(Ctrl) {
    return Ctrl.max && (Ctrl.$model.$modelValue + Ctrl.steps) > Ctrl.max;
  }

  function minReached(Ctrl) {
    return Ctrl.min && Ctrl.$model.$modelValue - Ctrl.steps < Ctrl.min;
  }

  InputNumberController.prototype = {
    increment: function () {
      if (setDefaultValue(this)) {
        if (!maxReached(this)) {
          stepUp(this);
          this.$scope.$apply();
          this.$model.$render();
        }
      }
    },
    decrement: function () {
      if (setDefaultValue(this)) {
        if (!minReached(this)) {
          stepDown(this);
          this.$scope.$apply();
          this.$model.$render();
        }
      }
    },
  };


  return function (scope, element, attrs, controllers, transclusion, $compile, $window, $timeout) {

    if (!compiled.number) {
      compiled.number = $compile(wrapperTemplate);
    }

    var controller = new InputNumberController(scope, controllers, element, attrs);

    compiled.number(scope, function (clone, $scope) {
      var spinners = clone.children().children(),
      up = spinners.eq(0),
      down = spinners.eq(1);

      up.on('click', function (e) {
        e.preventDefault();
        controller.increment();
      });
      down.on('click', function (e) {
        e.preventDefault();
        controller.decrement();
      });

      element.after(clone);
      clone.prepend(element);
    });
  };

}());

inputTypes.range = (function () {
  return function (scope, element, attrs, controllers, transclusion, $compile, $window, $timeout) {
    if (nativeSupported(element, 'range')) {
      console.log('native range');
    } else {
      console.log('not native range');
    }
  };
}());


var checkableTemplates = {
  checkbox:
    '<div class="ym-input input-checkbox">' +
    '  <div class="checkbox"></div>' +
    '</div>',
  radio:
    '<div ng-model="ngModel" class="ym-input input-radio" >' +
    '  <div class="radio"></div>' +
    '</div>',
};

function CheckableController($scope, $element, $attrs, $model) {
  this.$scope = $scope;
  this.$element = $element;
  this.$model = $model;
  this.$id    = $attrs.ngModel.toLowerCase();
  this.$type = $attrs.type.toLowerCase();
  this.trueVal = $attrs.trueValue ? $attrs.ngTrueValue : true;
}

CheckableController.prototype = {
  getTemplate: function () {
    return checkableTemplates[this.$type];
  },
  onChange: function (element, $animate, $timeout) {
    var that = this,
    listener = that.$type === 'radio' ? function (event, model) {
      if (that.$model.$viewValue === model.$viewValue) {
        $animate.addClass(element, 'checked');
      } else {
        $animate.removeClass(element, 'checked');
      }
    } : function (event, model) {
      if (!event) {
        return that.$scope.$broadcast('attrschanged.' + that.$id, that.$model);
      }
      if (that.$model.$viewValue) {
        $animate.addClass(element, 'checked');
      } else {
        $animate.removeClass(element, 'checked');
      }
    };

    this.$scope.$on('attrschanged.' + this.$id, listener);

    // set the inital classname
    this.$scope.$watch(function (value) {
      $timeout(function () {
        that.$scope.$broadcast('attrschanged.' + that.$id, listener);
      }, 200);
    });

    this.$model.$viewChangeListeners.push(listener);
    return listener;
  }
};

var radioGroups = {};

function getCheckableController(scope, element, attrs, controllers) {

  var crl;

  if (attrs.type.toLowerCase() === 'radio') {
    if (radioGroups[attrs.ngModel]) {
      return radioGroups[attrs.ngModel];
    } else {
      radioGroups[attrs.ngModel] = new CheckableController(scope, element, attrs, controllers);
      return radioGroups[attrs.ngModel];
    }
  }
  return new CheckableController(scope, element, attrs, controllers);
}

var radioListeners = {};
var radioCompiled;
var checkBoxCompiled;

/**
 * @see angularjs issue #4970
 */
inputTypes.checkbox = (function () {
  var compiled,
  template = checkableTemplates.checkbox;
  return function (scope, element, attrs, ngModel, transclusion, $compile, $window, $timeout, $animate, $parse) {
    var el, eq;

    if (!compiled) {
      compiled = $compile(template);
    }

    compiled(scope, function (clone) {
      element.after(clone);
      clone.append(element);
      el = clone;
      eq = clone.children().eq(0);
    });

    //ngModel.$viewChangeListeners.push(function () {

    //});

    var $watcher = scope.$new(true);
    $watcher.model = ngModel;

    $watcher.$watch('model.$modelValue', function (value) {
      if (value) {
        $animate.addClass(eq, 'checked');
      } else {
        $animate.removeClass(eq, 'checked');
      }
      //alert('das');
      //console.log();
    });

    el.on('click', function (e) {
      //e.preventDefault();
      //e.stopPropagation();
      scope.$apply(function () {
        element.prop('checked', !ngModel.$modelValue);
        ngModel.$setViewValue(!ngModel.$modelValue);
      });
    });
  };
}());

inputTypes.radio = (function () {
  var compiled;
  var template = checkableTemplates.radio,
  groups = {};

  //template = '<div class="test-radio"><div class="radio"></div></div>';

  return function (scope, element, attrs, ngModel, transclusion, $compile, $window, $timeout, $animate) {
    var el, eq;

    groups[attrs.name] = groups[attrs.name] || [];
    groups[attrs.name].push({radio: element, model: ngModel});

    if (!compiled) {
      compiled = $compile(template);
    }

    compiled(scope, function (clone) {
      element.after(clone);
      clone.append(element);
      el = clone;
      eq = clone.children().eq(0);
    });

    var $watcher = scope.$new(true);
    $watcher.model = ngModel;

    $watcher.$watch('model.$modelValue', function (value) {
      angular.forEach(groups[attrs.name], function (obj) {
        var eq = obj.radio.parent().children().eq(0);
        if (obj.radio.prop('checked')) {
          $animate.addClass(eq, 'checked');
        } else {
          $animate.removeClass(eq, 'checked');
        }
      });
    });

    el.on('click', function () {
      scope.$apply(function () {
        element.prop('checked', true);
        ngModel.$setViewValue(attrs.value);
      });
    });
  };
}());

inputTypes.date = (function () {
  return function (scope, element, attrs, controllers, transclusion, $compile, $window, $timeout) {
    if (nativeSupported(element, 'date')) {
      console.log('native date');
    } else {
      console.log('not native date');
    }
  };
}());

/**
 * @name input
 */
var inputDirective = ['$compile', '$window', '$timeout', '$animate', '$parse', function ($compile, $window, $timeout, $animate, $parse) {
  return {
    priority: -10000,
    restrict: 'EA',
    require: '?^ngModel',
    compile: function (tElement, tAttrs, transclusion) {
      compiled[tAttrs.type] = false;
      return function (scope, element, attrs, controllers) {
        if (controllers && typeSupported(attrs.type)) {
          inputTypes[attrs.type.toLowerCase()](scope, element, attrs, controllers, transclusion, $compile, $window, $timeout, $animate, $parse);
        }
      };
    }
  };
}];
