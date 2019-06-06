import { QueryCtrl}  from 'app/plugins/sdk';
import './css/query-editor.css!'

export class IronDbCheckQueryCtrl extends QueryCtrl {

  constructor($scope, $injector)  {
    super($scope, $injector);

    this.scope = $scope;
    this.target.kind   = this.target.kind   || 'numeric';
    this.target.target = this.target.target || '';
    this.target.type   = this.target.type   || 'average';
    this.target.alias  = this.target.alias  || '';
    this.target.extend = this.target.extend || true;
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
    this.target.target = '';
    this.refresh();
  }
}

IronDbCheckQueryCtrl.templateUrl = 'partials/query.editor.html';

