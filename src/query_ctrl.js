import { QueryCtrl}  from 'app/plugins/sdk';
import './css/query-editor.css!'

export class IronDbCheckQueryCtrl extends QueryCtrl {

  constructor($scope, $injector)  {
    super($scope, $injector);

    this.scope = $scope;
    this.target.kind   = this.target.kind   || 'numeric';
    this.target.target = this.target.target || 'select metric';
    this.target.type   = this.target.type   || 'average';
  }

  getOptions(query) {
    return this.datasource.metricFindQuery(query, this.target.kind)
      .then((metrics) => {
        metrics = metrics.sort();
        let result = [];
        for (let text of metrics) result.push({ text, value: text });
        return result;
      });
  }

  onChangeKind() {
    if (this.target.kind == 'text') this.target.type = 'text';
    else this.target.type = 'average';
    this.target.target = 'select metric';
    this.refresh();
  }
}

IronDbCheckQueryCtrl.templateUrl = 'partials/query.editor.html';

