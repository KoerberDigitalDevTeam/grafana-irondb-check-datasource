import { IronDbCheckDatasource } from './datasource';
import { IronDbCheckQueryCtrl }  from './query_ctrl';

class IronDbCheckConfigCtrl {}
IronDbCheckConfigCtrl.templateUrl = 'partials/config.html';

export {
  IronDbCheckDatasource as Datasource,
  IronDbCheckQueryCtrl  as QueryCtrl,
  IronDbCheckConfigCtrl as ConfigCtrl
};
