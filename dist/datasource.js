"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.IronDbCheckDatasource = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var IronDbCheckDatasource =
/*#__PURE__*/
function () {
  function IronDbCheckDatasource(instanceSettings, $q, backendSrv, templateSrv) {
    _classCallCheck(this, IronDbCheckDatasource);

    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    this.withCredentials = instanceSettings.withCredentials;
    this.accountId = instanceSettings.jsonData && instanceSettings.jsonData.accountId || '0';
    this.checkUuid = instanceSettings.jsonData && instanceSettings.jsonData.checkUuid || '00000000-0000-0000-0000-000000000000';
    this.minRollup = parseInt(instanceSettings.jsonData.minRollup) || 30;
    this.headers = {
      'Content-Type': 'application/json'
    };

    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }

    this.cache = {
      metrics: null,
      timestamp: 0
    };
  }
  /* List the metrics for this check UUID */


  _createClass(IronDbCheckDatasource, [{
    key: "findMetrics",
    value: function findMetrics() {
      var _this = this;

      var cached = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      var now = new Date().getTime();

      if (cached && this.cache.metrics != null && now - this.cache.timestamp < 600000) {
        // console.log('Returning metrics cached at ' + new Date(this.cache.timestamp).toISOString());
        return Promise.resolve(this.cache.metrics);
      }

      return this.doRequest({
        url: this.url + "/find/".concat(this.accountId, "/tags"),
        params: {
          query: "and(__check_uuid:".concat(this.checkUuid, ")")
        },
        method: 'GET'
      }).then(function (response) {
        if (response.status != 200) throw new Error('Invalid status code ' + response.status);
        var metrics = {
          text: [],
          numeric: []
        };

        if (response.data && response.data.length) {
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = response.data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var metric = _step.value;
              var _iteratorNormalCompletion2 = true;
              var _didIteratorError2 = false;
              var _iteratorError2 = undefined;

              try {
                for (var _iterator2 = metric.type.split(',')[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                  var type = _step2.value;
                  if (!metrics[type]) metrics[type] = [];
                  metrics[type].push(metric.metric_name);
                }
              } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
                    _iterator2["return"]();
                  }
                } finally {
                  if (_didIteratorError2) {
                    throw _iteratorError2;
                  }
                }
              }
            } // console.log(`Caching ${metrics.numeric.length} numeric and ${metrics.text.length} text metrics`)

          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                _iterator["return"]();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }

          _this.cache.metrics = metrics;
          _this.cache.timestamp = Date.now();
        } else {
          // console.log('Wiping cached data (no metrics)')
          _this.cache.metrics = null;
          _this.cache.timestamp = 0;
        }

        return metrics;
      })["catch"](function (error) {
        console.error('Error testing datasource', error);
        throw new Error('Error testing data source, check the console');
      });
    }
    /* Test our datasource, we must have at least one metric for it to be successful */

  }, {
    key: "testDatasource",
    value: function testDatasource() {
      return this.findMetrics(false).then(function (metrics) {
        return {
          status: 'success',
          title: 'Success',
          message: "Found ".concat(metrics.numeric.length, " numeric and ").concat(metrics.text.length, " text metrics")
        };
      });
    }
    /* Find the metrics associated with our UUID of a specific kind */

  }, {
    key: "metricFindQuery",
    value: function metricFindQuery(query, kind) {
      console.debug("Attempting to find ".concat(kind, " metrics"), query);
      return this.findMetrics().then(function (metrics) {
        return metrics[kind] || [];
      });
    }
    /* Query IronDB for the metric data */

  }, {
    key: "query",
    value: function query(options) {
      // console.log('Running query', options);
      var interval = options.intervalMs;
      var start = options.range.from.valueOf();
      var end = options.range.to.valueOf();
      interval = Math.round(interval / 1000);
      if (interval < this.minRollup) interval = this.minRollup;
      start = Math.floor(start / 1000 / interval) * interval;
      end = Math.ceil(end / 1000 / interval) * interval;
      var promises = [];
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = options.targets[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var target = _step3.value;

          if (target.target) {
            promises.push(this.fetchData({
              metric: this.templateSrv.replace(target.target, options.scopedVars, 'regex'),
              alias: this.templateSrv.replace(target.alias, options.scopedVars, 'regex'),
              target: target,
              start: start,
              end: end,
              interval: interval
            }));
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
            _iterator3["return"]();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      return this.q.all(promises).then(function (data) {
        return {
          data: data
        };
      });
    }
  }, {
    key: "annotationQuery",
    value: function annotationQuery(options) {
      // console.log("Annotations query", options);
      var start = Math.floor(options.range.from.valueOf() / 1000);
      var end = Math.ceil(options.range.to.valueOf() / 1000);
      var name = options.annotation.name || 'Annotation';
      var query = options.annotation.query || null;
      if (!query) return this.q.resolve([]);
      var url = this.url + '/read/' + start + '/' + end + '/' + this.checkUuid + '/' + query;
      return this.doRequest({
        url: url,
        method: 'GET'
      }).then(function (response) {
        var data = [];
        var regionId = 1;
        var previousTrue = null;
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = response.data[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var entry = _step4.value;
            var object = {
              title: name,
              time: entry[0],
              text: entry[1]
            };

            if (object.text == 'true') {
              previousTrue = object;
            } else if (object.text == 'false' && previousTrue != null) {
              previousTrue.regionId = object.regionId = regionId++;
              delete previousTrue.text;
              delete object.text;
            } else previousTrue = null;

            data.push(object);
          } // console.log("Annotations", data);

        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
              _iterator4["return"]();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }

        return data;
      });
    }
    /* ======================================================================== */

  }, {
    key: "fetchData",
    value: function fetchData(options) {
      var metric = options.metric,
          alias = options.alias,
          target = options.target,
          start = options.start,
          end = options.end,
          interval = options.interval;
      var kind = target.kind,
          type = target.type,
          extend = target.extend; // Default behavior, before "extend" existed

      if (!('extend' in target)) extend = true; // console.log('Fetch data', options)

      var url = kind == 'text' ? this.url + '/read/' + start + '/' + end + '/' + this.checkUuid + '/' + metric : this.url + '/rollup/' + this.checkUuid + '/' + metric + '?start_ts=' + start + '&end_ts=' + end + '&rollup_span=' + interval + 's' + '&type=' + encodeURIComponent(type);
      var multiplier = kind == 'text' ? 1 : 1000;
      var data = [];
      var result = {
        target: alias || metric,
        datapoints: data
      };
      return this.doRequest({
        url: url,
        method: 'GET'
      }).then(function (response) {
        // console.log('Fetch Data Response', response.data);
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = response.data[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var entry = _step5.value;
            var number = parseFloat(entry[1]);
            var value = isNaN(number) ? entry[1] : number;
            data.push([value, entry[0] * multiplier]);
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
              _iterator5["return"]();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }

        if (extend && kind == 'text' && data.length > 0) {
          // console.log('Extending', [ data[data.length - 1][0], end]);
          data.push([data[data.length - 1][0], end * 1000]);
        } // console.log('Fetched', url, result);


        return result;
      });
    }
  }, {
    key: "doRequest",
    value: function doRequest(options) {
      options.withCredentials = this.withCredentials;
      options.headers = this.headers;
      return this.backendSrv.datasourceRequest(options);
    }
  }, {
    key: "buildQueryParameters",
    value: function buildQueryParameters(options) {
      var _this2 = this;

      // remove placeholder targets
      options.targets = _lodash["default"].filter(options.targets, function (target) {
        return target.target !== '';
      });

      var targets = _lodash["default"].map(options.targets, function (target) {
        return {
          target: _this2.templateSrv.replace(target.target, options.scopedVars, 'regex'),
          refId: target.refId,
          hide: target.hide,
          type: target.type || 'timeserie'
        };
      });

      options.targets = targets;
      return options;
    }
  }]);

  return IronDbCheckDatasource;
}();

exports.IronDbCheckDatasource = IronDbCheckDatasource;
//# sourceMappingURL=datasource.js.map
