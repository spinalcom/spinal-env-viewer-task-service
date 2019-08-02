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

  constructor(name, dbId, taskName, state) {
    super();
    this.add_attr({
      id: _nodeUuid2.default.v4(),
      name: name,
      dbId: dbId,
      taskName: taskName,
      state: new _spinalCoreConnectorjs_type.Choice(state, ["notValid", "valid"])
    });
  }

}

exports.default = TaskModel;

_spinalCoreConnectorjs2.default.register_models([TaskModel]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tb2RlbHMvdGFzay5tb2RlbC5qcyJdLCJuYW1lcyI6WyJUYXNrTW9kZWwiLCJNb2RlbCIsImNvbnN0cnVjdG9yIiwibmFtZSIsImRiSWQiLCJ0YXNrTmFtZSIsInN0YXRlIiwiYWRkX2F0dHIiLCJpZCIsInV1aWQiLCJ2NCIsIkNob2ljZSIsInNwaW5hbENvcmUiLCJyZWdpc3Rlcl9tb2RlbHMiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUlBLE1BQU1BLFNBQU4sU0FBd0JDLEtBQXhCLENBQThCOztBQUU1QkMsY0FBWUMsSUFBWixFQUFrQkMsSUFBbEIsRUFBd0JDLFFBQXhCLEVBQWtDQyxLQUFsQyxFQUF5QztBQUN2QztBQUNBLFNBQUtDLFFBQUwsQ0FBYztBQUNaQyxVQUFJQyxtQkFBS0MsRUFBTCxFQURRO0FBRVpQLFlBQU1BLElBRk07QUFHWkMsWUFBTUEsSUFITTtBQUlaQyxnQkFBVUEsUUFKRTtBQUtaQyxhQUFPLElBQUlLLGtDQUFKLENBQVdMLEtBQVgsRUFBa0IsQ0FBQyxVQUFELEVBQWEsT0FBYixDQUFsQjtBQUxLLEtBQWQ7QUFPRDs7QUFYMkI7O2tCQWVmTixTOztBQUNmWSxnQ0FBV0MsZUFBWCxDQUEyQixDQUFDYixTQUFELENBQTNCIiwiZmlsZSI6InRhc2subW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgc3BpbmFsQ29yZSBmcm9tIFwic3BpbmFsLWNvcmUtY29ubmVjdG9yanNcIjtcbmltcG9ydCB1dWlkIGZyb20gXCJub2RlLXV1aWRcIjtcbmltcG9ydCB7XG4gIENob2ljZVxufSBmcm9tIFwic3BpbmFsLWNvcmUtY29ubmVjdG9yanNfdHlwZVwiO1xuXG5jbGFzcyBUYXNrTW9kZWwgZXh0ZW5kcyBNb2RlbCB7XG5cbiAgY29uc3RydWN0b3IobmFtZSwgZGJJZCwgdGFza05hbWUsIHN0YXRlKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmFkZF9hdHRyKHtcbiAgICAgIGlkOiB1dWlkLnY0KCksXG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgZGJJZDogZGJJZCxcbiAgICAgIHRhc2tOYW1lOiB0YXNrTmFtZSxcbiAgICAgIHN0YXRlOiBuZXcgQ2hvaWNlKHN0YXRlLCBbXCJub3RWYWxpZFwiLCBcInZhbGlkXCJdKVxuICAgIH0pXG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBUYXNrTW9kZWw7XG5zcGluYWxDb3JlLnJlZ2lzdGVyX21vZGVscyhbVGFza01vZGVsXSk7Il19