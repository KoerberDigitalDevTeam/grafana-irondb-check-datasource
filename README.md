# IronDB Checks Datasource Plugin

This is a simple plugin for Grafana using the `/rollup/` (for NNTB) and `/read/`
(for TEXT) endpoints in IronDB to fetch and massage telemetry data.

### Installation

For now check out the code (only `/dist/` is required) into your Grafana plugins
directory.

### Configuration

When configuring the datasource, simply add the check UUID into your datasource
plugin configuration.

In other words, one check, one datasource (keep it simple, and stupid).

The minimum rollup configuration parameter will set the minimum rollup interval,
in order to avoid `null` data coming in unexpectedly when zooming too far.

### Metric Names

The plugin will do its best to fetch a list of metric names for a given check
UUID by hitting the `/list/metric/` endpoint and provide autocompletion.

### Numeric Data

To get numeric data, the plugin will use the `/rollup/` endpoint in IronDB, and
when configuring the metric source it will be possible to get not only the
average but also counters, derive, counter, ...

### Text Data

Text data will be read from the `/read/` endpoint normally and returned
as a metric.

### Annotations

Text data can also be used as annotations in the graph. Just configure it in
the dashboard.

If the text data for annotations matches exactly `true` and is followed
immediately by a `false` vale, the annotation will be converted into a range
between the two data points.

