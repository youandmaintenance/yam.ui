(function (exports, angular, undefined) {
  'use strict';

  /**
   * string functions
   */
  var trim = function (str) {
    return str.replace(/(^\s+|\s+$)/);
  },

  ltrim = function (str) {
    return str.replace(/(^\s+)/);
  },

  rtrim = function (str) {
    return str.replace(/(\s+$)/);
  };

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

  /**
   * @name yam.ui
   */
  angular.module('yam.ui', ['ngAnimate'])

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

}(this, this.angular));
