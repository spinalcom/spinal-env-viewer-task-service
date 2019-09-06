"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _spinalCoreConnectorjs = require("spinal-core-connectorjs");

var _spinalCoreConnectorjs2 = _interopRequireDefault(_spinalCoreConnectorjs);

var _nodeUuid = require("node-uuid");

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _spinalCoreConnectorjs_type = require("spinal-core-connectorjs_type");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class TaskModel extends Model {

  constructor(name, dbId, bimFileId, taskName) {
    super();
    this.add_attr({
      id: _nodeUuid2.default.v4(),
      name: name,
      dbId: dbId,
      bimFileId: bimFileId,
      taskName: taskName,
      done: false
    });
  }

}

exports.default = TaskModel;

_spinalCoreConnectorjs2.default.register_models([TaskModel]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tb2RlbHMvdGFzay5tb2RlbC5qcyJdLCJuYW1lcyI6WyJUYXNrTW9kZWwiLCJNb2RlbCIsImNvbnN0cnVjdG9yIiwibmFtZSIsImRiSWQiLCJiaW1GaWxlSWQiLCJ0YXNrTmFtZSIsImFkZF9hdHRyIiwiaWQiLCJ1dWlkIiwidjQiLCJkb25lIiwic3BpbmFsQ29yZSIsInJlZ2lzdGVyX21vZGVscyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBSUEsTUFBTUEsU0FBTixTQUF3QkMsS0FBeEIsQ0FBOEI7O0FBRTVCQyxjQUFZQyxJQUFaLEVBQWtCQyxJQUFsQixFQUF3QkMsU0FBeEIsRUFBbUNDLFFBQW5DLEVBQTZDO0FBQzNDO0FBQ0EsU0FBS0MsUUFBTCxDQUFjO0FBQ1pDLFVBQUlDLG1CQUFLQyxFQUFMLEVBRFE7QUFFWlAsWUFBTUEsSUFGTTtBQUdaQyxZQUFNQSxJQUhNO0FBSVpDLGlCQUFXQSxTQUpDO0FBS1pDLGdCQUFVQSxRQUxFO0FBTVpLLFlBQU07QUFOTSxLQUFkO0FBUUQ7O0FBWjJCOztrQkFnQmZYLFM7O0FBQ2ZZLGdDQUFXQyxlQUFYLENBQTJCLENBQUNiLFNBQUQsQ0FBM0IiLCJmaWxlIjoidGFzay5tb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBzcGluYWxDb3JlIGZyb20gXCJzcGluYWwtY29yZS1jb25uZWN0b3Jqc1wiO1xuaW1wb3J0IHV1aWQgZnJvbSBcIm5vZGUtdXVpZFwiO1xuaW1wb3J0IHtcbiAgQ2hvaWNlXG59IGZyb20gXCJzcGluYWwtY29yZS1jb25uZWN0b3Jqc190eXBlXCI7XG5cbmNsYXNzIFRhc2tNb2RlbCBleHRlbmRzIE1vZGVsIHtcblxuICBjb25zdHJ1Y3RvcihuYW1lLCBkYklkLCBiaW1GaWxlSWQsIHRhc2tOYW1lKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmFkZF9hdHRyKHtcbiAgICAgIGlkOiB1dWlkLnY0KCksXG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgZGJJZDogZGJJZCxcbiAgICAgIGJpbUZpbGVJZDogYmltRmlsZUlkLFxuICAgICAgdGFza05hbWU6IHRhc2tOYW1lLFxuICAgICAgZG9uZTogZmFsc2VcbiAgICB9KVxuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgVGFza01vZGVsO1xuc3BpbmFsQ29yZS5yZWdpc3Rlcl9tb2RlbHMoW1Rhc2tNb2RlbF0pOyJdfQ==