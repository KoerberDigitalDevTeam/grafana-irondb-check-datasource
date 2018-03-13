'use strict';

System.register(['app/plugins/sdk', './css/query-editor.css!'], function (_export, _context) {
  "use strict";

  var QueryCtrl, _createClass, IronDbCheckQueryCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_appPluginsSdk) {
      QueryCtrl = _appPluginsSdk.QueryCtrl;
    }, function (_cssQueryEditorCss) {}],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('IronDbCheckQueryCtrl', IronDbCheckQueryCtrl = function (_QueryCtrl) {
        _inherits(IronDbCheckQueryCtrl, _QueryCtrl);

        function IronDbCheckQueryCtrl($scope, $injector) {
          _classCallCheck(this, IronDbCheckQueryCtrl);

          var _this = _possibleConstructorReturn(this, (IronDbCheckQueryCtrl.__proto__ || Object.getPrototypeOf(IronDbCheckQueryCtrl)).call(this, $scope, $injector));

          _this.scope = $scope;
          _this.target.kind = _this.target.kind || 'numeric';
          _this.target.target = _this.target.target || 'select metric';
          _this.target.type = _this.target.type || 'average';
          return _this;
        }

        _createClass(IronDbCheckQueryCtrl, [{
          key: 'getOptions',
          value: function getOptions(query) {
            return this.datasource.metricFindQuery(query, this.target.kind).then(function (metrics) {
              metrics = metrics.sort();
              var result = [];
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                for (var _iterator = metrics[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  var text = _step.value;
                  result.push({ text: text, value: text });
                }
              } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                  }
                } finally {
                  if (_didIteratorError) {
                    throw _iteratorError;
                  }
                }
              }

              return result;
            });
          }
        }, {
          key: 'onChangeKind',
          value: function onChangeKind() {
            if (this.target.kind == 'text') this.target.type = 'text';else this.target.type = 'average';
            this.target.target = 'select metric';
            this.refresh();
          }
        }]);

        return IronDbCheckQueryCtrl;
      }(QueryCtrl));

      _export('IronDbCheckQueryCtrl', IronDbCheckQueryCtrl);

      IronDbCheckQueryCtrl.templateUrl = 'partials/query.editor.html';
    }
  };
});
//# sourceMappingURL=query_ctrl.js.map
