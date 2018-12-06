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
    this.accountId = instanceSettings.jsonData
                  && instanceSettings.jsonData.accountId
                  || '0';
    this.checkUuid = instanceSettings.jsonData
                  && instanceSettings.jsonData.checkUuid
                  || '00000000-0000-0000-0000-000000000000';
    this.minRollup = parseInt(instanceSettings.jsonData.minRollup) || 30;
    this.headers = {'Content-Type': 'application/json'};
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }

    this.cache = {
      metrics: null,
      timestamp: 0
    };
  }

  /* List the metrics for this check UUID */
  findMetrics(cached = true) {
    let now = new Date().getTime();
    if (cached && (this.cache.metrics != null) && ((now - this.cache.timestamp) < 600000)) {
      console.log('Returning metrics cached at ' + new Date(this.cache.timestamp).toISOString());
      return Promise.resolve(this.cache.metrics);
    }

    return this.doRequest({
      url: this.url + `/find/${this.accountId}/tags`,
      params: { query: `and(__check_uuid:${this.checkUuid})` },
      method: 'GET'
    }).then((response) => {
      if (response.status != 200) throw new Error('Invalid status code ' + response.status);

      let metrics = { text: [], numeric: [] }

      if (response.data && response.data.length) {
        for (let metric of response.data) {
          for (let type of metric.type.split(',')) {
            if (! metrics[type]) metrics[type] = []
            metrics[type].push(metric.metric_name)
          }
        }

        console.log(`Caching ${metrics.numeric.length} numeric and ${metrics.text.length} text metrics`)
        this.cache.metrics = metrics
        this.cache.timestamp = Date.now()
      } else {
        console.log('Wiping cached data (no metrics)')
        this.cache.metrics = null
        this.cache.timestamp = 0
      }

      return metrics
    }).catch((error) => {
      console.error("Error testing datasource", error);
      throw new Error("Error testing data source, check the console");
    });
  }

  /* Test our datasource, we must have at least one metric for it to be successful */
  testDatasource() {
    return this.findMetrics(false).then((metrics) => {
      return { status: "success", title: "Success",
               message: `Found ${metrics.numeric.length} numeric and ${metrics.text.length} text metrics`
             };
    })
  }

  /* Find the metrics associated with our UUID of a specific kind */
  metricFindQuery(query, kind) {
    console.debug(`Attempting to find ${kind} metrics`, query);
    return this.findMetrics().then((metrics) => {
      return metrics[kind] || []
    })
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
      if (target.target) {
        let metric = this.templateSrv.replace(target.target, options.scopedVars, 'regex');
        let alias = this.templateSrv.replace(target.alias, options.scopedVars, 'regex');
        promises.push(this.fetchData(metric, alias, target.type, start, end, interval));
      }
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

      let regionId = 1;
      let previousTrue = null;

      for (let entry of response.data) {
        let object = { title: name, time: entry[0], text: entry[1] };

        if (object.text == 'true') {
          previousTrue = object;
        } else if ((object.text == 'false') && (previousTrue != null)) {
          previousTrue.regionId = object.regionId = (regionId ++);
          delete previousTrue.text;
          delete object.text;
        } else previousTrue = null;

        data.push(object);
      }
      console.log("ANNOTATIONS", data);
      return data;
    });
  }

  /* ======================================================================== */

  fetchData(metric, alias, type, start, end, interval) {

    let url = type == 'text' ?
              this.url + '/read/' + start + '/' + end + '/' + this.checkUuid + '/' + metric:
              this.url + '/rollup/' + this.checkUuid + '/' + metric
                       + '?start_ts=' + start
                       + '&end_ts=' + end
                       + '&rollup_span=' + interval + 's'
                       + '&type=' + encodeURIComponent(type);
    let multiplier = type == 'text' ? 1 : 1000;

    let data = [];
    let result = { target: alias || metric, datapoints: data }
    return this.doRequest({
      url: url,
      method: 'GET',
    }).then((response) => {
      console.log('RESPONSE', response.data);
      for (let entry of response.data) {
        data.push([ entry[1], entry[0] * multiplier]);
      }
      if (type == 'text') {
        console.log('INJECTING', [ data[data.length - 1], end]);
        data.push([ data[data.length - 1][0], end * 1000]);
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
      return target.target !== '';
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
