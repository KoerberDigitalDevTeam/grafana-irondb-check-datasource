import _ from 'lodash'

export class IronDbCheckDatasource {
  constructor(instanceSettings, $q, backendSrv, templateSrv) {
    this.type = instanceSettings.type
    this.url = instanceSettings.url
    this.name = instanceSettings.name
    this.q = $q
    this.backendSrv = backendSrv
    this.templateSrv = templateSrv
    this.withCredentials = instanceSettings.withCredentials
    this.accountId = instanceSettings.jsonData
                  && instanceSettings.jsonData.accountId
                  || '0'
    this.checkUuid = instanceSettings.jsonData
                  && instanceSettings.jsonData.checkUuid
                  || '00000000-0000-0000-0000-000000000000'
    this.minRollup = parseInt(instanceSettings.jsonData.minRollup) || 30
    this.headers = { 'Content-Type': 'application/json' }
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth
    }

    this.cache = {
      metrics: null,
      timestamp: 0,
    }
  }

  /* List the metrics for this check UUID */
  findMetrics(cached = true) {
    const now = new Date().getTime()
    if (cached && (this.cache.metrics != null) && ((now - this.cache.timestamp) < 600000)) {
      // console.log('Returning metrics cached at ' + new Date(this.cache.timestamp).toISOString());
      return Promise.resolve(this.cache.metrics)
    }

    return this.doRequest({
      url: this.url + `/find/${this.accountId}/tags`,
      params: { query: `and(__check_uuid:${this.checkUuid})` },
      method: 'GET',
    }).then((response) => {
      if (response.status != 200) throw new Error('Invalid status code ' + response.status)

      const metrics = { text: [], numeric: [] }

      if (response.data && response.data.length) {
        for (const metric of response.data) {
          for (const type of metric.type.split(',')) {
            if (! metrics[type]) metrics[type] = []
            metrics[type].push(metric.metric_name)
          }
        }

        // console.log(`Caching ${metrics.numeric.length} numeric and ${metrics.text.length} text metrics`)
        this.cache.metrics = metrics
        this.cache.timestamp = Date.now()
      } else {
        // console.log('Wiping cached data (no metrics)')
        this.cache.metrics = null
        this.cache.timestamp = 0
      }

      return metrics
    }).catch((error) => {
      console.error('Error testing datasource', error)
      throw new Error('Error testing data source, check the console')
    })
  }

  /* Test our datasource, we must have at least one metric for it to be successful */
  testDatasource() {
    return this.findMetrics(false).then((metrics) => {
      return { status: 'success', title: 'Success',
        message: `Found ${metrics.numeric.length} numeric and ${metrics.text.length} text metrics`,
      }
    })
  }

  /* Find the metrics associated with our UUID of a specific kind */
  metricFindQuery(query, kind) {
    console.debug(`Attempting to find ${kind} metrics`, query)
    return this.findMetrics().then((metrics) => {
      return metrics[kind] || []
    })
  }

  /* Query IronDB for the metric data */
  query(options) {
    // console.log('Running query', options);

    let interval = options.intervalMs
    let start = options.range.from.valueOf()
    let end = options.range.to.valueOf()

    interval = Math.round(interval / 1000)
    if (interval < this.minRollup) interval = this.minRollup
    start = Math.floor(start / 1000 / interval) * interval
    end = Math.ceil(end / 1000 / interval) * interval

    const promises = []
    for (const target of options.targets) {
      if (target.target) {
        promises.push(this.fetchData({
          metric: this.templateSrv.replace(target.target, options.scopedVars, 'regex'),
          alias: this.templateSrv.replace(target.alias, options.scopedVars, 'regex'),
          target, start, end, interval,
        }))
      }
    }

    return this.q.all(promises).then((data) => {
      return { data: data }
    })
  }

  annotationQuery(options) {
    // console.log("Annotations query", options);

    const start = Math.floor(options.range.from.valueOf() / 1000)
    const end = Math.ceil(options.range.to.valueOf() / 1000)

    const name = options.annotation.name || 'Annotation'
    const query = (options.annotation.query || null)

    if (! query) return this.q.resolve([])

    const url = this.url + '/read/' + start + '/' + end + '/' + this.checkUuid + '/' + query

    return this.doRequest({
      url: url,
      method: 'GET',
    }).then((response) => {
      const data = []

      let regionId = 1
      let previousTrue = null

      for (const entry of response.data) {
        const object = { title: name, time: entry[0], text: entry[1] }

        if (object.text == 'true') {
          previousTrue = object
        } else if ((object.text == 'false') && (previousTrue != null)) {
          previousTrue.regionId = object.regionId = (regionId ++)
          delete previousTrue.text
          delete object.text
        } else previousTrue = null

        data.push(object)
      }
      // console.log("Annotations", data);
      return data
    })
  }

  /* ======================================================================== */

  fetchData(options) {
    const { metric, alias, target, start, end, interval } = options
    let { kind, type, extend } = target
    // Default behavior, before "extend" existed
    if (!('extend' in target)) extend = true

    // console.log('Fetch data', options)

    const url = kind == 'text' ?
              this.url + '/read/' + start + '/' + end + '/' + this.checkUuid + '/' + metric:
              this.url + '/rollup/' + this.checkUuid + '/' + metric
                       + '?start_ts=' + start
                       + '&end_ts=' + end
                       + '&rollup_span=' + interval + 's'
                       + '&type=' + encodeURIComponent(type)
    const multiplier = kind == 'text' ? 1 : 1000

    const data = []
    const result = { target: alias || metric, datapoints: data }
    return this.doRequest({
      url: url,
      method: 'GET',
    }).then((response) => {
      // console.log('Fetch Data Response', response.data);

      for (const entry of response.data) {
        const number = parseFloat(entry[1])
        const value = isNaN(number) ? entry[1] : number
        data.push([ value, entry[0] * multiplier ])
      }

      if (extend && (kind == 'text') && (data.length > 0)) {
        // console.log('Extending', [ data[data.length - 1][0], end]);
        data.push([ data[data.length - 1][0], end * 1000 ])
      }

      // console.log('Fetched', url, result);
      return result
    })
  }

  doRequest(options) {
    options.withCredentials = this.withCredentials
    options.headers = this.headers

    return this.backendSrv.datasourceRequest(options)
  }

  buildQueryParameters(options) {
    // remove placeholder targets
    options.targets = _.filter(options.targets, (target) => {
      return target.target !== ''
    })

    const targets = _.map(options.targets, (target) => {
      return {
        target: this.templateSrv.replace(target.target, options.scopedVars, 'regex'),
        refId: target.refId,
        hide: target.hide,
        type: target.type || 'timeserie',
      }
    })

    options.targets = targets

    return options
  }
}
