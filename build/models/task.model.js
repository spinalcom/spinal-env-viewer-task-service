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

  constructor(name, dbId, bimFileId, taskName, state) {
    super();
    this.add_attr({
      id: _nodeUuid2.default.v4(),
      name: name,
      dbId: dbId,
      bimFileId: bimFileId,
      taskName: taskName,
      state: new _spinalCoreConnectorjs_type.Choice(state, ["notValid", "valid"])
    });
  }

}

exports.default = TaskModel;

_spinalCoreConnectorjs2.default.register_models([TaskModel]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tb2RlbHMvdGFzay5tb2RlbC5qcyJdLCJuYW1lcyI6WyJUYXNrTW9kZWwiLCJNb2RlbCIsImNvbnN0cnVjdG9yIiwibmFtZSIsImRiSWQiLCJiaW1GaWxlSWQiLCJ0YXNrTmFtZSIsInN0YXRlIiwiYWRkX2F0dHIiLCJpZCIsInV1aWQiLCJ2NCIsIkNob2ljZSIsInNwaW5hbENvcmUiLCJyZWdpc3Rlcl9tb2RlbHMiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUlBLE1BQU1BLFNBQU4sU0FBd0JDLEtBQXhCLENBQThCOztBQUU1QkMsY0FBWUMsSUFBWixFQUFrQkMsSUFBbEIsRUFBd0JDLFNBQXhCLEVBQW1DQyxRQUFuQyxFQUE2Q0MsS0FBN0MsRUFBb0Q7QUFDbEQ7QUFDQSxTQUFLQyxRQUFMLENBQWM7QUFDWkMsVUFBSUMsbUJBQUtDLEVBQUwsRUFEUTtBQUVaUixZQUFNQSxJQUZNO0FBR1pDLFlBQU1BLElBSE07QUFJWkMsaUJBQVdBLFNBSkM7QUFLWkMsZ0JBQVVBLFFBTEU7QUFNWkMsYUFBTyxJQUFJSyxrQ0FBSixDQUFXTCxLQUFYLEVBQWtCLENBQUMsVUFBRCxFQUFhLE9BQWIsQ0FBbEI7QUFOSyxLQUFkO0FBUUQ7O0FBWjJCOztrQkFnQmZQLFM7O0FBQ2ZhLGdDQUFXQyxlQUFYLENBQTJCLENBQUNkLFNBQUQsQ0FBM0IiLCJmaWxlIjoidGFzay5tb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBzcGluYWxDb3JlIGZyb20gXCJzcGluYWwtY29yZS1jb25uZWN0b3Jqc1wiO1xuaW1wb3J0IHV1aWQgZnJvbSBcIm5vZGUtdXVpZFwiO1xuaW1wb3J0IHtcbiAgQ2hvaWNlXG59IGZyb20gXCJzcGluYWwtY29yZS1jb25uZWN0b3Jqc190eXBlXCI7XG5cbmNsYXNzIFRhc2tNb2RlbCBleHRlbmRzIE1vZGVsIHtcblxuICBjb25zdHJ1Y3RvcihuYW1lLCBkYklkLCBiaW1GaWxlSWQsIHRhc2tOYW1lLCBzdGF0ZSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5hZGRfYXR0cih7XG4gICAgICBpZDogdXVpZC52NCgpLFxuICAgICAgbmFtZTogbmFtZSxcbiAgICAgIGRiSWQ6IGRiSWQsXG4gICAgICBiaW1GaWxlSWQ6IGJpbUZpbGVJZCxcbiAgICAgIHRhc2tOYW1lOiB0YXNrTmFtZSxcbiAgICAgIHN0YXRlOiBuZXcgQ2hvaWNlKHN0YXRlLCBbXCJub3RWYWxpZFwiLCBcInZhbGlkXCJdKVxuICAgIH0pXG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBUYXNrTW9kZWw7XG5zcGluYWxDb3JlLnJlZ2lzdGVyX21vZGVscyhbVGFza01vZGVsXSk7Il19