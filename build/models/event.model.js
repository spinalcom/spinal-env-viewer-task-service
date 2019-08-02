"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _spinalCoreConnectorjs = require("spinal-core-connectorjs");

var _spinalCoreConnectorjs2 = _interopRequireDefault(_spinalCoreConnectorjs);

var _nodeUuid = require("node-uuid");

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class EventModel extends Model {

  constructor(name, date, state, groupId) {
    super();
    this.add_attr({
      id: `Event-${_nodeUuid2.default.v4()}`,
      name: name,
      date: date,
      state: state,
      groupId: groupId
    });
  }

}

exports.default = EventModel;

_spinalCoreConnectorjs2.default.register_models([EventModel]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tb2RlbHMvZXZlbnQubW9kZWwuanMiXSwibmFtZXMiOlsiRXZlbnRNb2RlbCIsIk1vZGVsIiwiY29uc3RydWN0b3IiLCJuYW1lIiwiZGF0ZSIsInN0YXRlIiwiZ3JvdXBJZCIsImFkZF9hdHRyIiwiaWQiLCJ1dWlkIiwidjQiLCJzcGluYWxDb3JlIiwicmVnaXN0ZXJfbW9kZWxzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7OztBQUNBOzs7Ozs7QUFHQSxNQUFNQSxVQUFOLFNBQXlCQyxLQUF6QixDQUErQjs7QUFFN0JDLGNBQVlDLElBQVosRUFBa0JDLElBQWxCLEVBQXdCQyxLQUF4QixFQUErQkMsT0FBL0IsRUFBd0M7QUFDdEM7QUFDQSxTQUFLQyxRQUFMLENBQWM7QUFDWkMsVUFBSyxTQUFRQyxtQkFBS0MsRUFBTCxFQUFVLEVBRFg7QUFFWlAsWUFBTUEsSUFGTTtBQUdaQyxZQUFNQSxJQUhNO0FBSVpDLGFBQU9BLEtBSks7QUFLWkMsZUFBU0E7QUFMRyxLQUFkO0FBT0Q7O0FBWDRCOztrQkFnQmhCTixVOztBQUNmVyxnQ0FBV0MsZUFBWCxDQUEyQixDQUFDWixVQUFELENBQTNCIiwiZmlsZSI6ImV2ZW50Lm1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHNwaW5hbENvcmUgZnJvbSBcInNwaW5hbC1jb3JlLWNvbm5lY3RvcmpzXCI7XG5pbXBvcnQgdXVpZCBmcm9tIFwibm9kZS11dWlkXCI7XG5cblxuY2xhc3MgRXZlbnRNb2RlbCBleHRlbmRzIE1vZGVsIHtcblxuICBjb25zdHJ1Y3RvcihuYW1lLCBkYXRlLCBzdGF0ZSwgZ3JvdXBJZCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5hZGRfYXR0cih7XG4gICAgICBpZDogYEV2ZW50LSR7dXVpZC52NCgpfWAsXG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgZGF0ZTogZGF0ZSxcbiAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgIGdyb3VwSWQ6IGdyb3VwSWRcbiAgICB9KVxuICB9XG5cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBFdmVudE1vZGVsO1xuc3BpbmFsQ29yZS5yZWdpc3Rlcl9tb2RlbHMoW0V2ZW50TW9kZWxdKTsiXX0=