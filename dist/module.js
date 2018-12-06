"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Datasource", {
  enumerable: true,
  get: function get() {
    return _datasource.IronDbCheckDatasource;
  }
});
Object.defineProperty(exports, "QueryCtrl", {
  enumerable: true,
  get: function get() {
    return _query_ctrl.IronDbCheckQueryCtrl;
  }
});
exports.AnnotationsQueryCtrl = exports.ConfigCtrl = void 0;

var _datasource = require("./datasource");

var _query_ctrl = require("./query_ctrl");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var IronDbCheckConfigCtrl = function IronDbCheckConfigCtrl() {
  _classCallCheck(this, IronDbCheckConfigCtrl);
};

exports.ConfigCtrl = IronDbCheckConfigCtrl;
IronDbCheckConfigCtrl.templateUrl = 'partials/config.html';

var IronDbCheckAnnotationsQueryCtrl = function IronDbCheckAnnotationsQueryCtrl() {
  _classCallCheck(this, IronDbCheckAnnotationsQueryCtrl);
};

exports.AnnotationsQueryCtrl = IronDbCheckAnnotationsQueryCtrl;
IronDbCheckAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';
//# sourceMappingURL=module.js.map
