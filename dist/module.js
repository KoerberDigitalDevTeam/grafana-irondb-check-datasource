'use strict';

System.register(['./datasource', './query_ctrl'], function (_export, _context) {
  "use strict";

  var IronDbCheckDatasource, IronDbCheckQueryCtrl, IronDbCheckConfigCtrl, IronDbCheckAnnotationsQueryCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_datasource) {
      IronDbCheckDatasource = _datasource.IronDbCheckDatasource;
    }, function (_query_ctrl) {
      IronDbCheckQueryCtrl = _query_ctrl.IronDbCheckQueryCtrl;
    }],
    execute: function () {
      _export('ConfigCtrl', IronDbCheckConfigCtrl = function IronDbCheckConfigCtrl() {
        _classCallCheck(this, IronDbCheckConfigCtrl);
      });

      IronDbCheckConfigCtrl.templateUrl = 'partials/config.html';

      _export('AnnotationsQueryCtrl', IronDbCheckAnnotationsQueryCtrl = function IronDbCheckAnnotationsQueryCtrl() {
        _classCallCheck(this, IronDbCheckAnnotationsQueryCtrl);
      });

      IronDbCheckAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';

      _export('Datasource', IronDbCheckDatasource);

      _export('QueryCtrl', IronDbCheckQueryCtrl);

      _export('ConfigCtrl', IronDbCheckConfigCtrl);

      _export('AnnotationsQueryCtrl', IronDbCheckAnnotationsQueryCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map
