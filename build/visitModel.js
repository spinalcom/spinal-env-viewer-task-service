"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _spinalCoreConnectorjs = require("spinal-core-connectorjs");

var _spinalCoreConnectorjs2 = _interopRequireDefault(_spinalCoreConnectorjs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class VisitModel extends Model {

  constructor(date) {
    super();
    this.add_attr({
      date: date,
      bims: []
    });
  }

}

exports.default = VisitModel;

_spinalCoreConnectorjs2.default.register_models([VisitModel]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy92aXNpdE1vZGVsLmpzIl0sIm5hbWVzIjpbIlZpc2l0TW9kZWwiLCJNb2RlbCIsImNvbnN0cnVjdG9yIiwiZGF0ZSIsImFkZF9hdHRyIiwiYmltcyIsInNwaW5hbENvcmUiLCJyZWdpc3Rlcl9tb2RlbHMiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7Ozs7QUFHQSxNQUFNQSxVQUFOLFNBQXlCQyxLQUF6QixDQUErQjs7QUFFN0JDLGNBQVlDLElBQVosRUFBa0I7QUFDaEI7QUFDQSxTQUFLQyxRQUFMLENBQWM7QUFDWkQsWUFBTUEsSUFETTtBQUVaRSxZQUFNO0FBRk0sS0FBZDtBQUlEOztBQVI0Qjs7a0JBWWhCTCxVOztBQUNmTSxnQ0FBV0MsZUFBWCxDQUEyQixDQUFDUCxVQUFELENBQTNCIiwiZmlsZSI6InZpc2l0TW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgc3BpbmFsQ29yZSBmcm9tIFwic3BpbmFsLWNvcmUtY29ubmVjdG9yanNcIjtcblxuXG5jbGFzcyBWaXNpdE1vZGVsIGV4dGVuZHMgTW9kZWwge1xuXG4gIGNvbnN0cnVjdG9yKGRhdGUpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuYWRkX2F0dHIoe1xuICAgICAgZGF0ZTogZGF0ZSxcbiAgICAgIGJpbXM6IFtdXG4gICAgfSlcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IFZpc2l0TW9kZWw7XG5zcGluYWxDb3JlLnJlZ2lzdGVyX21vZGVscyhbVmlzaXRNb2RlbF0pOyJdfQ==