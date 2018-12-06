"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.IronDbCheckQueryCtrl = void 0;

var _sdk = require("app/plugins/sdk");

require("./css/query-editor.css!");

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var IronDbCheckQueryCtrl =
/*#__PURE__*/
function (_QueryCtrl) {
  _inherits(IronDbCheckQueryCtrl, _QueryCtrl);

  function IronDbCheckQueryCtrl($scope, $injector) {
    var _this;

    _classCallCheck(this, IronDbCheckQueryCtrl);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(IronDbCheckQueryCtrl).call(this, $scope, $injector));
    _this.scope = $scope;
    _this.target.kind = _this.target.kind || 'numeric';
    _this.target.target = _this.target.target || '';
    _this.target.type = _this.target.type || 'average';
    _this.target.alias = _this.target.alias || '';
    return _this;
  }

  _createClass(IronDbCheckQueryCtrl, [{
    key: "getOptions",
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
            result.push({
              text: text,
              value: text
            });
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
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
    key: "onChangeKind",
    value: function onChangeKind() {
      if (this.target.kind == 'text') this.target.type = 'text';else this.target.type = 'average';
      this.target.target = '';
      this.refresh();
    }
  }]);

  return IronDbCheckQueryCtrl;
}(_sdk.QueryCtrl);

exports.IronDbCheckQueryCtrl = IronDbCheckQueryCtrl;
IronDbCheckQueryCtrl.templateUrl = 'partials/query.editor.html';
//# sourceMappingURL=query_ctrl.js.map
