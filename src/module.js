import { IronDbCheckDatasource } from './datasource';
import { IronDbCheckQueryCtrl }  from './query_ctrl';

class IronDbCheckConfigCtrl {}
IronDbCheckConfigCtrl.templateUrl = 'partials/config.html';

class IronDbCheckAnnotationsQueryCtrl {}
IronDbCheckAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html'

export {
  IronDbCheckDatasource as Datasource,
  IronDbCheckQueryCtrl  as QueryCtrl,
  IronDbCheckConfigCtrl as ConfigCtrl,
  IronDbCheckAnnotationsQueryCtrl as AnnotationsQueryCtrl
};
