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

  constructor(name, date, state, groupId, creationDate, referenceName) {
    super();
    this.add_attr({
      id: `Event-${_nodeUuid2.default.v4()}`,
      creation: creationDate,
      reference: referenceName ? referenceName : "",
      name: name,
      date: date,
      state: state,
      groupId: groupId
    });
  }

}

exports.default = EventModel;

_spinalCoreConnectorjs2.default.register_models([EventModel]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tb2RlbHMvZXZlbnQubW9kZWwuanMiXSwibmFtZXMiOlsiRXZlbnRNb2RlbCIsIk1vZGVsIiwiY29uc3RydWN0b3IiLCJuYW1lIiwiZGF0ZSIsInN0YXRlIiwiZ3JvdXBJZCIsImNyZWF0aW9uRGF0ZSIsInJlZmVyZW5jZU5hbWUiLCJhZGRfYXR0ciIsImlkIiwidXVpZCIsInY0IiwiY3JlYXRpb24iLCJyZWZlcmVuY2UiLCJzcGluYWxDb3JlIiwicmVnaXN0ZXJfbW9kZWxzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7OztBQUNBOzs7Ozs7QUFHQSxNQUFNQSxVQUFOLFNBQXlCQyxLQUF6QixDQUErQjs7QUFFN0JDLGNBQVlDLElBQVosRUFBa0JDLElBQWxCLEVBQXdCQyxLQUF4QixFQUErQkMsT0FBL0IsRUFBd0NDLFlBQXhDLEVBQXNEQyxhQUF0RCxFQUFxRTtBQUNuRTtBQUNBLFNBQUtDLFFBQUwsQ0FBYztBQUNaQyxVQUFLLFNBQVFDLG1CQUFLQyxFQUFMLEVBQVUsRUFEWDtBQUVaQyxnQkFBVU4sWUFGRTtBQUdaTyxpQkFBV04sZ0JBQWdCQSxhQUFoQixHQUFnQyxFQUgvQjtBQUlaTCxZQUFNQSxJQUpNO0FBS1pDLFlBQU1BLElBTE07QUFNWkMsYUFBT0EsS0FOSztBQU9aQyxlQUFTQTtBQVBHLEtBQWQ7QUFTRDs7QUFiNEI7O2tCQWtCaEJOLFU7O0FBQ2ZlLGdDQUFXQyxlQUFYLENBQTJCLENBQUNoQixVQUFELENBQTNCIiwiZmlsZSI6ImV2ZW50Lm1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHNwaW5hbENvcmUgZnJvbSBcInNwaW5hbC1jb3JlLWNvbm5lY3RvcmpzXCI7XG5pbXBvcnQgdXVpZCBmcm9tIFwibm9kZS11dWlkXCI7XG5cblxuY2xhc3MgRXZlbnRNb2RlbCBleHRlbmRzIE1vZGVsIHtcblxuICBjb25zdHJ1Y3RvcihuYW1lLCBkYXRlLCBzdGF0ZSwgZ3JvdXBJZCwgY3JlYXRpb25EYXRlLCByZWZlcmVuY2VOYW1lKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmFkZF9hdHRyKHtcbiAgICAgIGlkOiBgRXZlbnQtJHt1dWlkLnY0KCl9YCxcbiAgICAgIGNyZWF0aW9uOiBjcmVhdGlvbkRhdGUsXG4gICAgICByZWZlcmVuY2U6IHJlZmVyZW5jZU5hbWUgPyByZWZlcmVuY2VOYW1lIDogXCJcIixcbiAgICAgIG5hbWU6IG5hbWUsXG4gICAgICBkYXRlOiBkYXRlLFxuICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgZ3JvdXBJZDogZ3JvdXBJZFxuICAgIH0pXG4gIH1cblxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IEV2ZW50TW9kZWw7XG5zcGluYWxDb3JlLnJlZ2lzdGVyX21vZGVscyhbRXZlbnRNb2RlbF0pOyJdfQ==