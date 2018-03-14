import _ from "lodash";

export class IronDbCheckDatasource {

  constructor(instanceSettings, $q, backendSrv, templateSrv) {
    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    this.withCredentials = instanceSettings.withCredentials;
    this.checkUuid = instanceSettings.jsonData
                  && instanceSettings.jsonData.checkUuid
                  || '00000000-0000-0000-0000-000000000000';
    this.minRollup = parseInt(instanceSettings.jsonData.minRollup) || 30;
    this.headers = {'Content-Type': 'application/json'};
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }
  }

  /* Test our datasource, we must have at least one metric for it to be successful */
  testDatasource() {
    return this.doRequest({
      url: this.url + '/list/metric/' + this.checkUuid,
      method: 'GET'
    }).then((response) => {
      if (response.status != 200) throw new Error('Invalid status code ' + response.status);
      if (response.data && response.data.length) {
        return { status: "success", message: "Data source has " + response.data.length + " metrics", title: "Success" };
      } else {
        throw new Error('No metrics found for check ' + this.checkUuid);
      }
    }, (error) => {
      console.error("Error testing datasource", error);
      throw new Error("Error testing data source, check the console");
    });
  }

  /* Find the metrics associated with our UUID of a specific kind */
  metricFindQuery(query, kind) {
    query = query || '';
    kind = kind || 'numeric';

    var interpolated = {
        target: this.templateSrv.replace(query, null, 'regex')
    };

    return this.doRequest({
      url: this.url + '/list/metric/' + this.checkUuid,
      method: 'GET',
    }).then((response) => {
      let metrics = [];
      for (let metric of response.data) {
        if (metric.type != kind) continue;
        metrics.push(metric.metric);
      }
      return metrics;
    });
  }

  /* Query IronDB for the metric data */
  query(options) {

    console.log('QUERY', options);

    let interval = options.intervalMs;
    let start = options.range.from.valueOf();
    let end = options.range.to.valueOf();

    interval = Math.round(interval / 1000);
    if (interval < this.minRollup) interval = this.minRollup;
    start = Math.floor(start / 1000 / interval) * interval;
    end = Math.ceil(end / 1000 / interval) * interval;

    console.log('start =', start, 'end =', end, 'interval =', interval);

    let promises = [];
    for (let target of options.targets) {
      let metric = this.templateSrv.replace(target.target, options.scopedVars, 'regex');
      promises.push(this.fetchData(metric, target.type, start, end, interval));
      console.log('TARGET', target);
    }

    return this.q.all(promises).then((data) => {
      return { data: data }
    });
  }

  annotationQuery(options) {
    console.log("ANN", options);

    let start = Math.floor(options.range.from.valueOf() / 1000);
    let end = Math.ceil(options.range.to.valueOf() / 1000);

    let name = options.annotation.name || 'Annotation';
    let query = (options.annotation.query || null);

    if (! query) return this.q.resolve([]);

    let url = this.url + '/read/' + start + '/' + end + '/' + this.checkUuid + '/' + query;

    console.log("-->", url, start, end, name, query);

    return this.doRequest({
      url: url,
      method: 'GET',
    }).then((response) => {
      let data = [];
      for (let entry of response.data) {
        data.push({ time: entry[0], text: entry[1]});
      }
      return data;
    });
  }

  /* ======================================================================== */

  fetchData(metric, type, start, end, interval) {

    let url = type == 'text' ?
              this.url + '/read/' + start + '/' + end + '/' + this.checkUuid + '/' + metric:
              this.url + '/rollup/' + this.checkUuid + '/' + metric
                       + '?start_ts=' + start
                       + '&end_ts=' + end
                       + '&rollup_span=' + interval + 's'
                       + '&type=' + encodeURIComponent(type);
    let multiplier = type == 'text' ? 1 : 1000;

    let data = [];
    let result = { target: metric, datapoints: data }
    return this.doRequest({
      url: url,
      method: 'GET',
    }).then((response) => {
      for (let entry of response.data) {
        data.push([ entry[1], entry[0] * multiplier]);
      }
      console.log('FETCHING', url, result);
      return result;
    });
  }

  doRequest(options) {
    options.withCredentials = this.withCredentials;
    options.headers = this.headers;

    return this.backendSrv.datasourceRequest(options);
  }

  buildQueryParameters(options) {
    //remove placeholder targets
    options.targets = _.filter(options.targets, target => {
      return target.target !== 'select metric';
    });

    var targets = _.map(options.targets, target => {
      return {
        target: this.templateSrv.replace(target.target, options.scopedVars, 'regex'),
        refId: target.refId,
        hide: target.hide,
        type: target.type || 'timeserie'
      };
    });

    options.targets = targets;

    return options;
  }
}
