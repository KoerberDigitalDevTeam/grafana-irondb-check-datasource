'use strict';

System.register(['lodash'], function (_export, _context) {
  "use strict";

  var _, _createClass, IronDbCheckDatasource;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }],
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

      _export('IronDbCheckDatasource', IronDbCheckDatasource = function () {
        function IronDbCheckDatasource(instanceSettings, $q, backendSrv, templateSrv) {
          _classCallCheck(this, IronDbCheckDatasource);

          this.type = instanceSettings.type;
          this.url = instanceSettings.url;
          this.name = instanceSettings.name;
          this.q = $q;
          this.backendSrv = backendSrv;
          this.templateSrv = templateSrv;
          this.withCredentials = instanceSettings.withCredentials;
          this.checkUuid = instanceSettings.jsonData && instanceSettings.jsonData.checkUuid || '00000000-0000-0000-0000-000000000000';
          this.minRollup = parseInt(instanceSettings.jsonData.minRollup) || 30;
          this.headers = { 'Content-Type': 'application/json' };
          if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
            this.headers['Authorization'] = instanceSettings.basicAuth;
          }
        }

        /* Test our datasource, we must have at least one metric for it to be successful */


        _createClass(IronDbCheckDatasource, [{
          key: 'testDatasource',
          value: function testDatasource() {
            var _this = this;

            return this.doRequest({
              url: this.url + '/list/metric/' + this.checkUuid,
              method: 'GET'
            }).then(function (response) {
              if (response.status != 200) throw new Error('Invalid status code ' + response.status);
              if (response.data && response.data.length) {
                return { status: "success", message: "Data source has " + response.data.length + " metrics", title: "Success" };
              } else {
                throw new Error('No metrics found for check ' + _this.checkUuid);
              }
            }, function (error) {
              console.error("Error testing datasource", error);
              throw new Error("Error testing data source, check the console");
            });
          }
        }, {
          key: 'metricFindQuery',
          value: function metricFindQuery(query, kind) {
            query = query || '';
            kind = kind || 'numeric';

            var interpolated = {
              target: this.templateSrv.replace(query, null, 'regex')
            };

            return this.doRequest({
              url: this.url + '/list/metric/' + this.checkUuid,
              method: 'GET'
            }).then(function (response) {
              var metrics = [];
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                for (var _iterator = response.data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  var metric = _step.value;

                  if (metric.type != kind) continue;
                  metrics.push(metric.metric);
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

              return metrics;
            });
          }
        }, {
          key: 'query',
          value: function query(options) {

            console.log('QUERY', options);

            var interval = options.intervalMs;
            var start = options.range.from.valueOf();
            var end = options.range.to.valueOf();

            interval = Math.round(interval / 1000);
            if (interval < this.minRollup) interval = this.minRollup;
            start = Math.floor(start / 1000 / interval) * interval;
            end = Math.ceil(end / 1000 / interval) * interval;

            console.log('start =', start, 'end =', end, 'interval =', interval);

            var promises = [];
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = options.targets[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var target = _step2.value;

                var metric = this.templateSrv.replace(target.target, options.scopedVars, 'regex');
                promises.push(this.fetchData(metric, target.type, start, end, interval));
                console.log('TARGET', target);
              }
            } catch (err) {
              _didIteratorError2 = true;
              _iteratorError2 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                  _iterator2.return();
                }
              } finally {
                if (_didIteratorError2) {
                  throw _iteratorError2;
                }
              }
            }

            return this.q.all(promises).then(function (data) {
              return { data: data };
            });
          }
        }, {
          key: 'annotationQuery',
          value: function annotationQuery(options) {
            console.log("ANN", options);

            var start = Math.floor(options.range.from.valueOf() / 1000);
            var end = Math.ceil(options.range.to.valueOf() / 1000);

            var name = options.annotation.name || 'Annotation';
            var query = options.annotation.query || null;

            if (!query) return this.q.resolve([]);

            var url = this.url + '/read/' + start + '/' + end + '/' + this.checkUuid + '/' + query;

            console.log("-->", url, start, end, name, query);

            return this.doRequest({
              url: url,
              method: 'GET'
            }).then(function (response) {
              var data = [];

              var regionId = 1;
              var previousTrue = null;

              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                for (var _iterator3 = response.data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                  var entry = _step3.value;

                  var object = { title: name, time: entry[0], text: entry[1] };

                  if (object.text == 'true') {
                    previousTrue = object;
                  } else if (object.text == 'false' && previousTrue != null) {
                    previousTrue.regionId = object.regionId = regionId++;
                    delete previousTrue.text;
                    delete object.text;
                  } else previousTrue = null;

                  data.push(object);
                }
              } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                  }
                } finally {
                  if (_didIteratorError3) {
                    throw _iteratorError3;
                  }
                }
              }

              console.log("ANNOTATIONS", data);
              return data;
            });
          }
        }, {
          key: 'fetchData',
          value: function fetchData(metric, type, start, end, interval) {

            var url = type == 'text' ? this.url + '/read/' + start + '/' + end + '/' + this.checkUuid + '/' + metric : this.url + '/rollup/' + this.checkUuid + '/' + metric + '?start_ts=' + start + '&end_ts=' + end + '&rollup_span=' + interval + 's' + '&type=' + encodeURIComponent(type);
            var multiplier = type == 'text' ? 1 : 1000;

            var data = [];
            var result = { target: metric, datapoints: data };
            return this.doRequest({
              url: url,
              method: 'GET'
            }).then(function (response) {
              var _iteratorNormalCompletion4 = true;
              var _didIteratorError4 = false;
              var _iteratorError4 = undefined;

              try {
                for (var _iterator4 = response.data[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                  var entry = _step4.value;

                  data.push([entry[1], entry[0] * multiplier]);
                }
              } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion4 && _iterator4.return) {
                    _iterator4.return();
                  }
                } finally {
                  if (_didIteratorError4) {
                    throw _iteratorError4;
                  }
                }
              }

              console.log('FETCHING', url, result);
              return result;
            });
          }
        }, {
          key: 'doRequest',
          value: function doRequest(options) {
            options.withCredentials = this.withCredentials;
            options.headers = this.headers;

            return this.backendSrv.datasourceRequest(options);
          }
        }, {
          key: 'buildQueryParameters',
          value: function buildQueryParameters(options) {
            var _this2 = this;

            //remove placeholder targets
            options.targets = _.filter(options.targets, function (target) {
              return target.target !== 'select metric';
            });

            var targets = _.map(options.targets, function (target) {
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
      }());

      _export('IronDbCheckDatasource', IronDbCheckDatasource);
    }
  };
});
//# sourceMappingURL=datasource.js.map
