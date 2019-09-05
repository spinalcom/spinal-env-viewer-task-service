"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _spinalEnvViewerGraphService = require("spinal-env-viewer-graph-service");

var _service = require("spinal-env-viewer-room-manager/js/service");

var _visitModel = require("./models/visit.model.js");

var _visitModel2 = _interopRequireDefault(_visitModel);

var _eventModel = require("./models/event.model.js");

var _eventModel2 = _interopRequireDefault(_eventModel);

var _taskModel = require("./models/task.model.js");

var _taskModel2 = _interopRequireDefault(_taskModel);

var _spinalCoreConnectorjs_type = require("spinal-core-connectorjs_type");

var _moment = require("moment");

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

class SpinalVisitService {
  constructor() {
    this.VISIT_CONTEXT_NAME = ".visit_context";
    this.CONTEXT_TYPE = "visit_context";

    this.VISIT_TYPE = "visit";

    this.MAINTENANCE_VISIT = "MAINTENANCE_VISIT";
    this.REGULATORY_VISIT = "REGULATORY_VISIT";
    this.SECURITY_VISIT = "SECURITY_VISIT";
    this.DIAGNOSTIC_VISIT = "DIAGNOSTIC_VISIT";

    this.EVENT_STATES = Object.freeze({
      declared: {
        name: "déclaré",
        type: "declared"
      },
      processing: {
        name: "encours",
        type: "processing"
      },
      done: {
        name: "éffectué",
        type: "done"
      }
    });

    this.VISITS = Object.freeze([{
      type: this.MAINTENANCE_VISIT,
      name: "Maintenance visit"
    }, {
      type: this.REGULATORY_VISIT,
      name: "Regulatory visit"
    }, {
      type: this.SECURITY_VISIT,
      name: "Security Visit"
    }, {
      type: this.DIAGNOSTIC_VISIT,
      name: "Diagnostic visit"
    }]);

    this.MAINTENANCE_VISIT_EVENT_STATE_RELATION = "maintenanceVisithasEventState";

    this.REGULATORY_VISIT_EVENT_STATE_RELATION = "regulatoryVisithasEventState";

    this.SECURITY_VISIT_EVENT_STATE_RELATION = "securityVisithasEventState";

    this.DIAGNOSTIC_VISIT_EVENT_STATE_RELATION = "diagnosticVisithasEventState";

    this.GROUP_TO_TASK = "hasVisit";

    this.VISIT_TO_EVENT_RELATION = "visitHasEvent";

    this.VISIT_TYPE_TO_GROUP_RELATION = "visitHasGroup";
    this.EVENT_STATE_TO_EVENT_RELATION = "hasEvent";
    this.EVENT_TO_TASK_RELATION = "hasTask";
  }

  getAllVisits() {
    return this.VISITS;
  }

  addVisitOnGroup(groupId, visitName, periodicityNumber, periodicityMesure, visitType, interventionNumber, interventionMesure, description) {
    return _spinalEnvViewerGraphService.SpinalGraphService.getChildren(groupId, [this.GROUP_TO_TASK]).then(children => {
      let argNodeId;
      if (children.length === 0) {
        argNodeId = _spinalEnvViewerGraphService.SpinalGraphService.createNode({
          name: "maintenance"
        });

        _spinalEnvViewerGraphService.SpinalGraphService.addChild(groupId, argNodeId, this.GROUP_TO_TASK, _spinalEnvViewerGraphService.SPINAL_RELATION_PTR_LST_TYPE);
      }

      let node = typeof argNodeId !== "undefined" ? _spinalEnvViewerGraphService.SpinalGraphService.getInfo(argNodeId) : children[0];

      return this.getPtrValue(node, visitType).then(lst => {
        let task = new _visitModel2.default(visitName, periodicityNumber, periodicityMesure, visitType, interventionNumber, interventionMesure, description);

        let nodeId = _spinalEnvViewerGraphService.SpinalGraphService.createNode({
          groupId: groupId,
          name: visitName,
          periodicity: {
            number: task.periodicity.number.get(),
            mesure: task.periodicity.mesure.get()
          },
          intervention: {
            number: task.intervention.number.get(),
            mesure: task.intervention.mesure.get()
          },
          visitType: visitType,
          description: description
        }, task);

        let realNode = _spinalEnvViewerGraphService.SpinalGraphService.getRealNode(nodeId);

        lst.push(realNode);

        return realNode.info;
      });
    });
  }

  getPtrValue(node, ptrName) {
    let realNode = _spinalEnvViewerGraphService.SpinalGraphService.getRealNode(node.id.get());

    return new Promise(resolve => {
      if (!realNode.info[ptrName]) {
        realNode.info.add_attr(ptrName, {
          tasks: new _spinalCoreConnectorjs_type.Ptr(new _spinalCoreConnectorjs_type.Lst())
        });
      }

      realNode.info[ptrName].tasks.load(value => {
        return resolve(value);
      });
    });
  }

  getGroupVisits(groupId, visityType) {
    return _spinalEnvViewerGraphService.SpinalGraphService.getChildren(groupId, [this.GROUP_TO_TASK]).then(res => {
      let nodeId;
      if (res.length === 0) {
        nodeId = _spinalEnvViewerGraphService.SpinalGraphService.createNode({
          name: "maintenance"
        });

        _spinalEnvViewerGraphService.SpinalGraphService.addChild(groupId, nodeId, this.GROUP_TO_TASK, _spinalEnvViewerGraphService.SPINAL_RELATION_PTR_LST_TYPE);
      }

      let node = typeof nodeId !== "undefined" ? _spinalEnvViewerGraphService.SpinalGraphService.getInfo(nodeId) : res[0];

      return this.getPtrValue(node, visityType);
    });
  }

  generateEvent(visitType, groupId, beginDate, endDate, eventsData) {
    return this.createVisitContext(visitType).then(el => {
      return this.linkGroupToVistContext(el.id.get(), groupId).then(res => {
        if (res) {
          this.getEventStateNode(el.id.get(), groupId, this.EVENT_STATES.declared.type).then(stateNode => {
            let id = stateNode.id.get();

            eventsData.forEach(eventInfo => {
              let eventsDate = this._getDate(beginDate, endDate, eventInfo.periodNumber, eventInfo.periodMesure);

              eventsDate.forEach(date => {
                this.addEvent(el.id.get(), groupId, id, eventInfo, `${eventInfo.name} ${this._formatDate(date)}`, new Date(date).getTime());
              });
            });
          });
        }
      });
    }).catch(err => {
      console.log(err);
      return Promise.resolve(err);
    });
  }

  addEvent(visitTypeContextId, groupId, stateId, visitInfo, name, date) {
    let state = _spinalEnvViewerGraphService.SpinalGraphService.getInfo(stateId).state.get();

    let event = new _eventModel2.default(name, date, state, groupId);

    let eventNodeId = _spinalEnvViewerGraphService.SpinalGraphService.createNode({
      name: name,
      date: date,
      state: state,
      groupId: groupId,
      visitId: visitInfo.id
    }, event);

    return _spinalEnvViewerGraphService.SpinalGraphService.addChildInContext(stateId, eventNodeId, visitTypeContextId, this.EVENT_STATE_TO_EVENT_RELATION, _spinalEnvViewerGraphService.SPINAL_RELATION_PTR_LST_TYPE).then(el => {
      if (el) return eventNodeId;
    }).then(eventId => {
      if (typeof eventId !== "undefined") {
        return _spinalEnvViewerGraphService.SpinalGraphService.getChildren(groupId, [_service.EQUIPMENTS_TO_ELEMENT_RELATION]).then(children => {
          children.map(child => {
            let name = `${visitInfo.name}__${child.name.get()}`;
            let task = new _taskModel2.default(name, child.dbid.get(), child.bimFileId.get(), visitInfo.name, 0);

            let taskId = _spinalEnvViewerGraphService.SpinalGraphService.createNode({
              name: name,
              dbId: child.dbid.get(),
              bimFileId: child.bimFileId.get(),
              taskName: visitInfo.name,
              visitId: visitInfo.id,
              state: task.state.get()
            }, task);

            return Promise.all([_spinalEnvViewerGraphService.SpinalGraphService.addChildInContext(eventId, taskId, visitTypeContextId, this.EVENT_TO_TASK_RELATION, _spinalEnvViewerGraphService.SPINAL_RELATION_PTR_LST_TYPE), _spinalEnvViewerGraphService.SpinalGraphService.addChild(visitInfo.id, eventId, this.VISIT_TO_EVENT_RELATION, _spinalEnvViewerGraphService.SPINAL_RELATION_PTR_LST_TYPE)]);
          });
        });
      }
    });
  }

  createVisitContext(visitType) {
    let visit = this.VISITS.find(el => {
      return el.type === visitType;
    });

    if (typeof visit !== "undefined") {
      const contextName = `${visit.name}`;

      let context = _spinalEnvViewerGraphService.SpinalGraphService.getContext(contextName);
      if (typeof context !== "undefined") return Promise.resolve(context.info);

      return _spinalEnvViewerGraphService.SpinalGraphService.addContext(contextName, visitType, new _spinalCoreConnectorjs_type.Model({
        name: this.VISIT_CONTEXT_NAME
      })).then(contextCreated => {
        return contextCreated.info;
      });
    } else {
      return Promise.reject("visitNotFound");
    }
  }

  linkGroupToVistContext(visitContextId, groupId) {
    var _this = this;

    return _spinalEnvViewerGraphService.SpinalGraphService.getChildren(visitContextId, [this.VISIT_TYPE_TO_GROUP_RELATION]).then(children => {
      for (let i = 0; i < children.length; i++) {
        const child = children[i].id.get();
        if (child === groupId) return true;
      }
    }).then(el => {
      if (typeof el === "undefined") {
        return _spinalEnvViewerGraphService.SpinalGraphService.addChildInContext(visitContextId, groupId, visitContextId, this.VISIT_TYPE_TO_GROUP_RELATION, _spinalEnvViewerGraphService.SPINAL_RELATION_PTR_LST_TYPE).then((() => {
          var _ref = _asyncToGenerator(function* (res) {
            if (res) {
              yield _this.getEventStateNode(visitContextId, groupId, _this.EVENT_STATES.processing.type);
              yield _this.getEventStateNode(visitContextId, groupId, _this.EVENT_STATES.done.type);
            }

            return res;
          });

          return function (_x) {
            return _ref.apply(this, arguments);
          };
        })());
      } else {
        return el;
      }
    });
  }

  getEventStateNode(visitContextId, groupId, eventSate) {
    let event = this._eventSateIsValid(eventSate);

    if (typeof event === "undefined") return;

    let contextType = _spinalEnvViewerGraphService.SpinalGraphService.getInfo(visitContextId).type.get();
    let relationName;

    switch (contextType) {
      case this.MAINTENANCE_VISIT:
        relationName = this.MAINTENANCE_VISIT_EVENT_STATE_RELATION;
        break;
      case this.SECURITY_VISIT:
        relationName = this.SECURITY_VISIT_EVENT_STATE_RELATION;
        break;
      case this.DIAGNOSTIC_VISIT:
        relationName = this.DIAGNOSTIC_VISIT_EVENT_STATE_RELATION;
        break;
      case this.REGULATORY_VISIT:
        relationName = this.REGULATORY_VISIT_EVENT_STATE_RELATION;
        break;
    }

    return _spinalEnvViewerGraphService.SpinalGraphService.getChildren(groupId, [relationName]).then(children => {
      for (let i = 0; i < children.length; i++) {
        const name = children[i].name.get();
        const type = children[i].state.get();

        if (name === eventSate || type === eventSate) {
          return children[i];
        }
      }
    }).then(el => {
      if (typeof el === "undefined") {
        let argNodeId = _spinalEnvViewerGraphService.SpinalGraphService.createNode({
          name: event.name,
          state: event.type,
          groupId: groupId,
          type: "EventState"
        });

        return _spinalEnvViewerGraphService.SpinalGraphService.addChildInContext(groupId, argNodeId, visitContextId, relationName, _spinalEnvViewerGraphService.SPINAL_RELATION_PTR_LST_TYPE).then(res => {
          if (res) return _spinalEnvViewerGraphService.SpinalGraphService.getInfo(argNodeId);
        });
      } else {
        return el;
      }
    });
  }

  ////////////////////////////////////////////////////////////////////////
  //                            PRIVATES                                //
  ////////////////////////////////////////////////////////////////////////

  _getDate(beginDate, endDate, periodNumber, periodMesure) {
    let mesure = ["days", "weeks", "months", "years"][periodMesure];

    let eventsDate = [];

    let date = (0, _moment2.default)(beginDate);
    let end = (0, _moment2.default)(endDate);

    while (end.diff(date) >= 0) {
      eventsDate.push(date.toDate());

      date = date.add(periodNumber, mesure);
    }

    return eventsDate;
  }

  _formatDate(argDate) {
    let date = new Date(argDate);

    return `${(() => {
      let d = date.getDate();
      d.toString().length > 1 ? d : '0' + d;
    })()}/${(() => {

      let d = date.getMonth() + 1;
      d.toString().length > 1 ? d : '0' + d;
    })()}/${date.getFullYear()}`;
  }

  _eventSateIsValid(eventState) {
    for (const key in this.EVENT_STATES) {
      if (this.EVENT_STATES[key].name === eventState || this.EVENT_STATES[key].type === eventState) {
        return this.EVENT_STATES[key];
      }
    }

    return undefined;
  }

  ////////////////////////////////////////////////////////////////////////
  //                        GET INFORMATION                             //
  ////////////////////////////////////////////////////////////////////////

  getVisitGroups(visitType) {
    let contexts = _spinalEnvViewerGraphService.SpinalGraphService.getContextWithType(visitType);
    if (contexts.length === 0) return [];

    let contextId = contexts[0].info.id.get();

    return _spinalEnvViewerGraphService.SpinalGraphService.getChildren(contextId, this.VISIT_TYPE_TO_GROUP_RELATION).then(res => {
      return res.map(el => el.get());
    });
  }

  getGroupEvents(groupId, VISIT_TYPES = [this.MAINTENANCE_VISIT, this.REGULATORY_VISIT, this.SECURITY_VISIT, this.DIAGNOSTIC_VISIT]) {
    var _this2 = this;

    if (!Array.isArray(VISIT_TYPES)) VISIT_TYPES = [VISIT_TYPES];

    return VISIT_TYPES.map(visitType => {
      let visit = this.VISITS.find(el => {
        return el.type === visitType;
      });

      let context = _spinalEnvViewerGraphService.SpinalGraphService.getContext(visit.name);

      if (typeof context !== "undefined") {
        let contextId = context.info.id.get();
        let promises = [];

        for (const key in this.EVENT_STATES) {
          promises.push(this.getEventStateNode(contextId, groupId, this.EVENT_STATES[key].type));
        }

        return Promise.all(promises).then(values => {
          let prom = values.map((() => {
            var _ref2 = _asyncToGenerator(function* (eventType) {
              let res = eventType.get();

              res["visit_type"] = visitType;

              let events = yield _spinalEnvViewerGraphService.SpinalGraphService.getChildren(res.id, [_this2.EVENT_STATE_TO_EVENT_RELATION]);

              res["events"] = events.map(function (el) {
                return el.get();
              });

              return res;
            });

            return function (_x2) {
              return _ref2.apply(this, arguments);
            };
          })());

          return Promise.all(prom).then(allEvents => {
            let values = {};

            allEvents.forEach(val => {
              values[val.state] = val.events;
            });

            return {
              [visitType]: values
            };
          });
        });
      }
    });
  }
}

let spinalVisitService = new SpinalVisitService();

exports.default = spinalVisitService;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJTcGluYWxWaXNpdFNlcnZpY2UiLCJjb25zdHJ1Y3RvciIsIlZJU0lUX0NPTlRFWFRfTkFNRSIsIkNPTlRFWFRfVFlQRSIsIlZJU0lUX1RZUEUiLCJNQUlOVEVOQU5DRV9WSVNJVCIsIlJFR1VMQVRPUllfVklTSVQiLCJTRUNVUklUWV9WSVNJVCIsIkRJQUdOT1NUSUNfVklTSVQiLCJFVkVOVF9TVEFURVMiLCJPYmplY3QiLCJmcmVlemUiLCJkZWNsYXJlZCIsIm5hbWUiLCJ0eXBlIiwicHJvY2Vzc2luZyIsImRvbmUiLCJWSVNJVFMiLCJNQUlOVEVOQU5DRV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIlJFR1VMQVRPUllfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJTRUNVUklUWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJHUk9VUF9UT19UQVNLIiwiVklTSVRfVE9fRVZFTlRfUkVMQVRJT04iLCJWSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OIiwiRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04iLCJFVkVOVF9UT19UQVNLX1JFTEFUSU9OIiwiZ2V0QWxsVmlzaXRzIiwiYWRkVmlzaXRPbkdyb3VwIiwiZ3JvdXBJZCIsInZpc2l0TmFtZSIsInBlcmlvZGljaXR5TnVtYmVyIiwicGVyaW9kaWNpdHlNZXN1cmUiLCJ2aXNpdFR5cGUiLCJpbnRlcnZlbnRpb25OdW1iZXIiLCJpbnRlcnZlbnRpb25NZXN1cmUiLCJkZXNjcmlwdGlvbiIsIlNwaW5hbEdyYXBoU2VydmljZSIsImdldENoaWxkcmVuIiwidGhlbiIsImNoaWxkcmVuIiwiYXJnTm9kZUlkIiwibGVuZ3RoIiwiY3JlYXRlTm9kZSIsImFkZENoaWxkIiwiU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRSIsIm5vZGUiLCJnZXRJbmZvIiwiZ2V0UHRyVmFsdWUiLCJsc3QiLCJ0YXNrIiwiVmlzaXRNb2RlbCIsIm5vZGVJZCIsInBlcmlvZGljaXR5IiwibnVtYmVyIiwiZ2V0IiwibWVzdXJlIiwiaW50ZXJ2ZW50aW9uIiwicmVhbE5vZGUiLCJnZXRSZWFsTm9kZSIsInB1c2giLCJpbmZvIiwicHRyTmFtZSIsImlkIiwiUHJvbWlzZSIsInJlc29sdmUiLCJhZGRfYXR0ciIsInRhc2tzIiwiUHRyIiwiTHN0IiwibG9hZCIsInZhbHVlIiwiZ2V0R3JvdXBWaXNpdHMiLCJ2aXNpdHlUeXBlIiwicmVzIiwiZ2VuZXJhdGVFdmVudCIsImJlZ2luRGF0ZSIsImVuZERhdGUiLCJldmVudHNEYXRhIiwiY3JlYXRlVmlzaXRDb250ZXh0IiwiZWwiLCJsaW5rR3JvdXBUb1Zpc3RDb250ZXh0IiwiZ2V0RXZlbnRTdGF0ZU5vZGUiLCJzdGF0ZU5vZGUiLCJmb3JFYWNoIiwiZXZlbnRJbmZvIiwiZXZlbnRzRGF0ZSIsIl9nZXREYXRlIiwicGVyaW9kTnVtYmVyIiwicGVyaW9kTWVzdXJlIiwiZGF0ZSIsImFkZEV2ZW50IiwiX2Zvcm1hdERhdGUiLCJEYXRlIiwiZ2V0VGltZSIsImNhdGNoIiwiZXJyIiwiY29uc29sZSIsImxvZyIsInZpc2l0VHlwZUNvbnRleHRJZCIsInN0YXRlSWQiLCJ2aXNpdEluZm8iLCJzdGF0ZSIsImV2ZW50IiwiRXZlbnRNb2RlbCIsImV2ZW50Tm9kZUlkIiwidmlzaXRJZCIsImFkZENoaWxkSW5Db250ZXh0IiwiZXZlbnRJZCIsIkVRVUlQTUVOVFNfVE9fRUxFTUVOVF9SRUxBVElPTiIsIm1hcCIsImNoaWxkIiwiVGFza01vZGVsIiwiZGJpZCIsImJpbUZpbGVJZCIsInRhc2tJZCIsImRiSWQiLCJ0YXNrTmFtZSIsImFsbCIsInZpc2l0IiwiZmluZCIsImNvbnRleHROYW1lIiwiY29udGV4dCIsImdldENvbnRleHQiLCJhZGRDb250ZXh0IiwiTW9kZWwiLCJjb250ZXh0Q3JlYXRlZCIsInJlamVjdCIsInZpc2l0Q29udGV4dElkIiwiaSIsImV2ZW50U2F0ZSIsIl9ldmVudFNhdGVJc1ZhbGlkIiwiY29udGV4dFR5cGUiLCJyZWxhdGlvbk5hbWUiLCJlbmQiLCJkaWZmIiwidG9EYXRlIiwiYWRkIiwiYXJnRGF0ZSIsImQiLCJnZXREYXRlIiwidG9TdHJpbmciLCJnZXRNb250aCIsImdldEZ1bGxZZWFyIiwiZXZlbnRTdGF0ZSIsImtleSIsInVuZGVmaW5lZCIsImdldFZpc2l0R3JvdXBzIiwiY29udGV4dHMiLCJnZXRDb250ZXh0V2l0aFR5cGUiLCJjb250ZXh0SWQiLCJnZXRHcm91cEV2ZW50cyIsIlZJU0lUX1RZUEVTIiwiQXJyYXkiLCJpc0FycmF5IiwicHJvbWlzZXMiLCJ2YWx1ZXMiLCJwcm9tIiwiZXZlbnRUeXBlIiwiZXZlbnRzIiwiYWxsRXZlbnRzIiwidmFsIiwic3BpbmFsVmlzaXRTZXJ2aWNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7QUFLQTs7QUFJQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQTs7QUFNQTs7Ozs7Ozs7QUFFQSxNQUFNQSxrQkFBTixDQUF5QjtBQUN2QkMsZ0JBQWM7QUFDWixTQUFLQyxrQkFBTCxHQUEwQixnQkFBMUI7QUFDQSxTQUFLQyxZQUFMLEdBQW9CLGVBQXBCOztBQUVBLFNBQUtDLFVBQUwsR0FBa0IsT0FBbEI7O0FBRUEsU0FBS0MsaUJBQUwsR0FBeUIsbUJBQXpCO0FBQ0EsU0FBS0MsZ0JBQUwsR0FBd0Isa0JBQXhCO0FBQ0EsU0FBS0MsY0FBTCxHQUFzQixnQkFBdEI7QUFDQSxTQUFLQyxnQkFBTCxHQUF3QixrQkFBeEI7O0FBRUEsU0FBS0MsWUFBTCxHQUFvQkMsT0FBT0MsTUFBUCxDQUFjO0FBQ2hDQyxnQkFBVTtBQUNSQyxjQUFNLFNBREU7QUFFUkMsY0FBTTtBQUZFLE9BRHNCO0FBS2hDQyxrQkFBWTtBQUNWRixjQUFNLFNBREk7QUFFVkMsY0FBTTtBQUZJLE9BTG9CO0FBU2hDRSxZQUFNO0FBQ0pILGNBQU0sVUFERjtBQUVKQyxjQUFNO0FBRkY7QUFUMEIsS0FBZCxDQUFwQjs7QUFl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QUFDdkJMLHFCQUFPSyxJQUFJM0QsS0FBWCxJQUFvQjJELElBQUlGLE1BQXhCO0FBQ0QsYUFGRDs7QUFJQSxtQkFBTztBQUNMLGVBQUM5SCxTQUFELEdBQWEySDtBQURSLGFBQVA7QUFHRCxXQVZNLENBQVA7QUFXRCxTQTdCTSxDQUFQO0FBOEJEO0FBQ0YsS0FwRE0sQ0FBUDtBQXFERDtBQXJpQnNCOztBQXdpQnpCLElBQUlNLHFCQUFxQixJQUFJbEssa0JBQUosRUFBekI7O2tCQUVla0ssa0IiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFLFxuICBTcGluYWxHcmFwaFNlcnZpY2Vcbn0gZnJvbSBcInNwaW5hbC1lbnYtdmlld2VyLWdyYXBoLXNlcnZpY2VcIjtcblxuaW1wb3J0IHtcbiAgRVFVSVBNRU5UU19UT19FTEVNRU5UX1JFTEFUSU9OXG59IGZyb20gXCJzcGluYWwtZW52LXZpZXdlci1yb29tLW1hbmFnZXIvanMvc2VydmljZVwiO1xuXG5pbXBvcnQgVmlzaXRNb2RlbCBmcm9tIFwiLi9tb2RlbHMvdmlzaXQubW9kZWwuanNcIjtcbmltcG9ydCBFdmVudE1vZGVsIGZyb20gXCIuL21vZGVscy9ldmVudC5tb2RlbC5qc1wiO1xuaW1wb3J0IFRhc2tNb2RlbCBmcm9tIFwiLi9tb2RlbHMvdGFzay5tb2RlbC5qc1wiO1xuXG5pbXBvcnQge1xuICBQdHIsXG4gIExzdCxcbiAgTW9kZWxcbn0gZnJvbSBcInNwaW5hbC1jb3JlLWNvbm5lY3RvcmpzX3R5cGVcIjtcblxuaW1wb3J0IG1vbWVudCBmcm9tIFwibW9tZW50XCI7XG5cbmNsYXNzIFNwaW5hbFZpc2l0U2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuVklTSVRfQ09OVEVYVF9OQU1FID0gXCIudmlzaXRfY29udGV4dFwiO1xuICAgIHRoaXMuQ09OVEVYVF9UWVBFID0gXCJ2aXNpdF9jb250ZXh0XCI7XG5cbiAgICB0aGlzLlZJU0lUX1RZUEUgPSBcInZpc2l0XCI7XG5cbiAgICB0aGlzLk1BSU5URU5BTkNFX1ZJU0lUID0gXCJNQUlOVEVOQU5DRV9WSVNJVFwiO1xuICAgIHRoaXMuUkVHVUxBVE9SWV9WSVNJVCA9IFwiUkVHVUxBVE9SWV9WSVNJVFwiO1xuICAgIHRoaXMuU0VDVVJJVFlfVklTSVQgPSBcIlNFQ1VSSVRZX1ZJU0lUXCI7XG4gICAgdGhpcy5ESUFHTk9TVElDX1ZJU0lUID0gXCJESUFHTk9TVElDX1ZJU0lUXCI7XG5cbiAgICB0aGlzLkVWRU5UX1NUQVRFUyA9IE9iamVjdC5mcmVlemUoe1xuICAgICAgZGVjbGFyZWQ6IHtcbiAgICAgICAgbmFtZTogXCJkw6ljbGFyw6lcIixcbiAgICAgICAgdHlwZTogXCJkZWNsYXJlZFwiXG4gICAgICB9LFxuICAgICAgcHJvY2Vzc2luZzoge1xuICAgICAgICBuYW1lOiBcImVuY291cnNcIixcbiAgICAgICAgdHlwZTogXCJwcm9jZXNzaW5nXCJcbiAgICAgIH0sXG4gICAgICBkb25lOiB7XG4gICAgICAgIG5hbWU6IFwiw6lmZmVjdHXDqVwiLFxuICAgICAgICB0eXBlOiBcImRvbmVcIlxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5WSVNJVFMgPSBPYmplY3QuZnJlZXplKFt7XG4gICAgICAgIHR5cGU6IHRoaXMuTUFJTlRFTkFOQ0VfVklTSVQsXG4gICAgICAgIG5hbWU6IFwiTWFpbnRlbmFuY2UgdmlzaXRcIlxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogdGhpcy5SRUdVTEFUT1JZX1ZJU0lULFxuICAgICAgICBuYW1lOiBcIlJlZ3VsYXRvcnkgdmlzaXRcIlxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogdGhpcy5TRUNVUklUWV9WSVNJVCxcbiAgICAgICAgbmFtZTogXCJTZWN1cml0eSBWaXNpdFwiXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0eXBlOiB0aGlzLkRJQUdOT1NUSUNfVklTSVQsXG4gICAgICAgIG5hbWU6IFwiRGlhZ25vc3RpYyB2aXNpdFwiXG4gICAgICB9XG4gICAgXSk7XG5cbiAgICB0aGlzLk1BSU5URU5BTkNFX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OID1cbiAgICAgIFwibWFpbnRlbmFuY2VWaXNpdGhhc0V2ZW50U3RhdGVcIjtcblxuICAgIHRoaXMuUkVHVUxBVE9SWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiA9XG4gICAgICBcInJlZ3VsYXRvcnlWaXNpdGhhc0V2ZW50U3RhdGVcIjtcblxuICAgIHRoaXMuU0VDVVJJVFlfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04gPSBcInNlY3VyaXR5VmlzaXRoYXNFdmVudFN0YXRlXCI7XG5cbiAgICB0aGlzLkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04gPVxuICAgICAgXCJkaWFnbm9zdGljVmlzaXRoYXNFdmVudFN0YXRlXCI7XG5cbiAgICB0aGlzLkdST1VQX1RPX1RBU0sgPSBcImhhc1Zpc2l0XCI7XG5cbiAgICB0aGlzLlZJU0lUX1RPX0VWRU5UX1JFTEFUSU9OID0gXCJ2aXNpdEhhc0V2ZW50XCI7XG5cbiAgICB0aGlzLlZJU0lUX1RZUEVfVE9fR1JPVVBfUkVMQVRJT04gPSBcInZpc2l0SGFzR3JvdXBcIjtcbiAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OID0gXCJoYXNFdmVudFwiO1xuICAgIHRoaXMuRVZFTlRfVE9fVEFTS19SRUxBVElPTiA9IFwiaGFzVGFza1wiO1xuICB9XG5cbiAgZ2V0QWxsVmlzaXRzKCkge1xuICAgIHJldHVybiB0aGlzLlZJU0lUUztcbiAgfVxuXG4gIGFkZFZpc2l0T25Hcm91cChcbiAgICBncm91cElkLFxuICAgIHZpc2l0TmFtZSxcbiAgICBwZXJpb2RpY2l0eU51bWJlcixcbiAgICBwZXJpb2RpY2l0eU1lc3VyZSxcbiAgICB2aXNpdFR5cGUsXG4gICAgaW50ZXJ2ZW50aW9uTnVtYmVyLFxuICAgIGludGVydmVudGlvbk1lc3VyZSxcbiAgICBkZXNjcmlwdGlvblxuICApIHtcbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKGdyb3VwSWQsIFt0aGlzLkdST1VQX1RPX1RBU0tdKS50aGVuKFxuICAgICAgY2hpbGRyZW4gPT4ge1xuICAgICAgICBsZXQgYXJnTm9kZUlkO1xuICAgICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgYXJnTm9kZUlkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmNyZWF0ZU5vZGUoe1xuICAgICAgICAgICAgbmFtZTogXCJtYWludGVuYW5jZVwiXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGQoXG4gICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgYXJnTm9kZUlkLFxuICAgICAgICAgICAgdGhpcy5HUk9VUF9UT19UQVNLLFxuICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbm9kZSA9XG4gICAgICAgICAgdHlwZW9mIGFyZ05vZGVJZCAhPT0gXCJ1bmRlZmluZWRcIiA/XG4gICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8oYXJnTm9kZUlkKSA6XG4gICAgICAgICAgY2hpbGRyZW5bMF07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHRyVmFsdWUobm9kZSwgdmlzaXRUeXBlKS50aGVuKGxzdCA9PiB7XG4gICAgICAgICAgbGV0IHRhc2sgPSBuZXcgVmlzaXRNb2RlbChcbiAgICAgICAgICAgIHZpc2l0TmFtZSxcbiAgICAgICAgICAgIHBlcmlvZGljaXR5TnVtYmVyLFxuICAgICAgICAgICAgcGVyaW9kaWNpdHlNZXN1cmUsXG4gICAgICAgICAgICB2aXNpdFR5cGUsXG4gICAgICAgICAgICBpbnRlcnZlbnRpb25OdW1iZXIsXG4gICAgICAgICAgICBpbnRlcnZlbnRpb25NZXN1cmUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvblxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBsZXQgbm9kZUlkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmNyZWF0ZU5vZGUoe1xuICAgICAgICAgICAgICBncm91cElkOiBncm91cElkLFxuICAgICAgICAgICAgICBuYW1lOiB2aXNpdE5hbWUsXG4gICAgICAgICAgICAgIHBlcmlvZGljaXR5OiB7XG4gICAgICAgICAgICAgICAgbnVtYmVyOiB0YXNrLnBlcmlvZGljaXR5Lm51bWJlci5nZXQoKSxcbiAgICAgICAgICAgICAgICBtZXN1cmU6IHRhc2sucGVyaW9kaWNpdHkubWVzdXJlLmdldCgpXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGludGVydmVudGlvbjoge1xuICAgICAgICAgICAgICAgIG51bWJlcjogdGFzay5pbnRlcnZlbnRpb24ubnVtYmVyLmdldCgpLFxuICAgICAgICAgICAgICAgIG1lc3VyZTogdGFzay5pbnRlcnZlbnRpb24ubWVzdXJlLmdldCgpXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHZpc2l0VHlwZTogdmlzaXRUeXBlLFxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0YXNrXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGxldCByZWFsTm9kZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRSZWFsTm9kZShub2RlSWQpO1xuXG4gICAgICAgICAgbHN0LnB1c2gocmVhbE5vZGUpO1xuXG4gICAgICAgICAgcmV0dXJuIHJlYWxOb2RlLmluZm87XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBnZXRQdHJWYWx1ZShub2RlLCBwdHJOYW1lKSB7XG4gICAgbGV0IHJlYWxOb2RlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldFJlYWxOb2RlKG5vZGUuaWQuZ2V0KCkpO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgaWYgKCFyZWFsTm9kZS5pbmZvW3B0ck5hbWVdKSB7XG4gICAgICAgIHJlYWxOb2RlLmluZm8uYWRkX2F0dHIocHRyTmFtZSwge1xuICAgICAgICAgIHRhc2tzOiBuZXcgUHRyKG5ldyBMc3QoKSlcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJlYWxOb2RlLmluZm9bcHRyTmFtZV0udGFza3MubG9hZCh2YWx1ZSA9PiB7XG4gICAgICAgIHJldHVybiByZXNvbHZlKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0R3JvdXBWaXNpdHMoZ3JvdXBJZCwgdmlzaXR5VHlwZSkge1xuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oZ3JvdXBJZCwgW3RoaXMuR1JPVVBfVE9fVEFTS10pLnRoZW4oXG4gICAgICByZXMgPT4ge1xuICAgICAgICBsZXQgbm9kZUlkO1xuICAgICAgICBpZiAocmVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIG5vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgIG5hbWU6IFwibWFpbnRlbmFuY2VcIlxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkKFxuICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgIG5vZGVJZCxcbiAgICAgICAgICAgIHRoaXMuR1JPVVBfVE9fVEFTSyxcbiAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5vZGUgPVxuICAgICAgICAgIHR5cGVvZiBub2RlSWQgIT09IFwidW5kZWZpbmVkXCIgP1xuICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKG5vZGVJZCkgOlxuICAgICAgICAgIHJlc1swXTtcblxuICAgICAgICByZXR1cm4gdGhpcy5nZXRQdHJWYWx1ZShub2RlLCB2aXNpdHlUeXBlKTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgZ2VuZXJhdGVFdmVudCh2aXNpdFR5cGUsIGdyb3VwSWQsIGJlZ2luRGF0ZSwgZW5kRGF0ZSwgZXZlbnRzRGF0YSkge1xuICAgIHJldHVybiB0aGlzLmNyZWF0ZVZpc2l0Q29udGV4dCh2aXNpdFR5cGUpXG4gICAgICAudGhlbihlbCA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmxpbmtHcm91cFRvVmlzdENvbnRleHQoZWwuaWQuZ2V0KCksIGdyb3VwSWQpLnRoZW4oXG4gICAgICAgICAgcmVzID0+IHtcbiAgICAgICAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgICAgICAgdGhpcy5nZXRFdmVudFN0YXRlTm9kZShcbiAgICAgICAgICAgICAgICBlbC5pZC5nZXQoKSxcbiAgICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICAgIHRoaXMuRVZFTlRfU1RBVEVTLmRlY2xhcmVkLnR5cGVcbiAgICAgICAgICAgICAgKS50aGVuKHN0YXRlTm9kZSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGlkID0gc3RhdGVOb2RlLmlkLmdldCgpO1xuXG4gICAgICAgICAgICAgICAgZXZlbnRzRGF0YS5mb3JFYWNoKGV2ZW50SW5mbyA9PiB7XG4gICAgICAgICAgICAgICAgICBsZXQgZXZlbnRzRGF0ZSA9IHRoaXMuX2dldERhdGUoXG4gICAgICAgICAgICAgICAgICAgIGJlZ2luRGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgZW5kRGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRJbmZvLnBlcmlvZE51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRJbmZvLnBlcmlvZE1lc3VyZVxuICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgICAgZXZlbnRzRGF0ZS5mb3JFYWNoKGRhdGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50KFxuICAgICAgICAgICAgICAgICAgICAgIGVsLmlkLmdldCgpLFxuICAgICAgICAgICAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICAgICAgICAgICAgZXZlbnRJbmZvLFxuICAgICAgICAgICAgICAgICAgICAgIGAke2V2ZW50SW5mby5uYW1lfSAke3RoaXMuX2Zvcm1hdERhdGUoZGF0ZSl9YCxcbiAgICAgICAgICAgICAgICAgICAgICBuZXcgRGF0ZShkYXRlKS5nZXRUaW1lKClcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShlcnIpO1xuICAgICAgfSk7XG4gIH1cblxuICBhZGRFdmVudCh2aXNpdFR5cGVDb250ZXh0SWQsIGdyb3VwSWQsIHN0YXRlSWQsIHZpc2l0SW5mbywgbmFtZSwgZGF0ZSkge1xuICAgIGxldCBzdGF0ZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKHN0YXRlSWQpLnN0YXRlLmdldCgpO1xuXG4gICAgbGV0IGV2ZW50ID0gbmV3IEV2ZW50TW9kZWwobmFtZSwgZGF0ZSwgc3RhdGUsIGdyb3VwSWQpO1xuXG4gICAgbGV0IGV2ZW50Tm9kZUlkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmNyZWF0ZU5vZGUoe1xuICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICBkYXRlOiBkYXRlLFxuICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgIGdyb3VwSWQ6IGdyb3VwSWQsXG4gICAgICAgIHZpc2l0SWQ6IHZpc2l0SW5mby5pZFxuICAgICAgfSxcbiAgICAgIGV2ZW50XG4gICAgKTtcblxuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGRJbkNvbnRleHQoXG4gICAgICAgIHN0YXRlSWQsXG4gICAgICAgIGV2ZW50Tm9kZUlkLFxuICAgICAgICB2aXNpdFR5cGVDb250ZXh0SWQsXG4gICAgICAgIHRoaXMuRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04sXG4gICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgIClcbiAgICAgIC50aGVuKGVsID0+IHtcbiAgICAgICAgaWYgKGVsKSByZXR1cm4gZXZlbnROb2RlSWQ7XG4gICAgICB9KVxuICAgICAgLnRoZW4oZXZlbnRJZCA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnRJZCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oZ3JvdXBJZCwgW1xuICAgICAgICAgICAgRVFVSVBNRU5UU19UT19FTEVNRU5UX1JFTEFUSU9OXG4gICAgICAgICAgXSkudGhlbihjaGlsZHJlbiA9PiB7XG4gICAgICAgICAgICBjaGlsZHJlbi5tYXAoY2hpbGQgPT4ge1xuICAgICAgICAgICAgICBsZXQgbmFtZSA9IGAke3Zpc2l0SW5mby5uYW1lfV9fJHtjaGlsZC5uYW1lLmdldCgpfWA7XG4gICAgICAgICAgICAgIGxldCB0YXNrID0gbmV3IFRhc2tNb2RlbChcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGNoaWxkLmRiaWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgY2hpbGQuYmltRmlsZUlkLmdldCgpLFxuICAgICAgICAgICAgICAgIHZpc2l0SW5mby5uYW1lLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICBsZXQgdGFza0lkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmNyZWF0ZU5vZGUoe1xuICAgICAgICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgICAgIGRiSWQ6IGNoaWxkLmRiaWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgICBiaW1GaWxlSWQ6IGNoaWxkLmJpbUZpbGVJZC5nZXQoKSxcbiAgICAgICAgICAgICAgICAgIHRhc2tOYW1lOiB2aXNpdEluZm8ubmFtZSxcbiAgICAgICAgICAgICAgICAgIHZpc2l0SWQ6IHZpc2l0SW5mby5pZCxcbiAgICAgICAgICAgICAgICAgIHN0YXRlOiB0YXNrLnN0YXRlLmdldCgpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0YXNrXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGRJbkNvbnRleHQoXG4gICAgICAgICAgICAgICAgICBldmVudElkLFxuICAgICAgICAgICAgICAgICAgdGFza0lkLFxuICAgICAgICAgICAgICAgICAgdmlzaXRUeXBlQ29udGV4dElkLFxuICAgICAgICAgICAgICAgICAgdGhpcy5FVkVOVF9UT19UQVNLX1JFTEFUSU9OLFxuICAgICAgICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkKFxuICAgICAgICAgICAgICAgICAgdmlzaXRJbmZvLmlkLFxuICAgICAgICAgICAgICAgICAgZXZlbnRJZCxcbiAgICAgICAgICAgICAgICAgIHRoaXMuVklTSVRfVE9fRVZFTlRfUkVMQVRJT04sXG4gICAgICAgICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIGNyZWF0ZVZpc2l0Q29udGV4dCh2aXNpdFR5cGUpIHtcbiAgICBsZXQgdmlzaXQgPSB0aGlzLlZJU0lUUy5maW5kKGVsID0+IHtcbiAgICAgIHJldHVybiBlbC50eXBlID09PSB2aXNpdFR5cGU7XG4gICAgfSk7XG5cbiAgICBpZiAodHlwZW9mIHZpc2l0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBjb25zdCBjb250ZXh0TmFtZSA9IGAke3Zpc2l0Lm5hbWV9YDtcblxuICAgICAgbGV0IGNvbnRleHQgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q29udGV4dChjb250ZXh0TmFtZSk7XG4gICAgICBpZiAodHlwZW9mIGNvbnRleHQgIT09IFwidW5kZWZpbmVkXCIpIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29udGV4dFxuICAgICAgICAuaW5mbyk7XG5cbiAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ29udGV4dChcbiAgICAgICAgY29udGV4dE5hbWUsXG4gICAgICAgIHZpc2l0VHlwZSxcbiAgICAgICAgbmV3IE1vZGVsKHtcbiAgICAgICAgICBuYW1lOiB0aGlzLlZJU0lUX0NPTlRFWFRfTkFNRVxuICAgICAgICB9KVxuICAgICAgKS50aGVuKGNvbnRleHRDcmVhdGVkID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbnRleHRDcmVhdGVkLmluZm87XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFwidmlzaXROb3RGb3VuZFwiKTtcbiAgICB9XG4gIH1cblxuICBsaW5rR3JvdXBUb1Zpc3RDb250ZXh0KHZpc2l0Q29udGV4dElkLCBncm91cElkKSB7XG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbih2aXNpdENvbnRleHRJZCwgW1xuICAgICAgICB0aGlzLlZJU0lUX1RZUEVfVE9fR1JPVVBfUkVMQVRJT05cbiAgICAgIF0pXG4gICAgICAudGhlbihjaGlsZHJlbiA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldLmlkLmdldCgpO1xuICAgICAgICAgIGlmIChjaGlsZCA9PT0gZ3JvdXBJZCkgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAudGhlbihlbCA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgZWwgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkSW5Db250ZXh0KFxuICAgICAgICAgICAgdmlzaXRDb250ZXh0SWQsXG4gICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgdmlzaXRDb250ZXh0SWQsXG4gICAgICAgICAgICB0aGlzLlZJU0lUX1RZUEVfVE9fR1JPVVBfUkVMQVRJT04sXG4gICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgKS50aGVuKGFzeW5jIHJlcyA9PiB7XG4gICAgICAgICAgICBpZiAocmVzKSB7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoXG4gICAgICAgICAgICAgICAgdmlzaXRDb250ZXh0SWQsXG4gICAgICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFUy5wcm9jZXNzaW5nLnR5cGVcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5nZXRFdmVudFN0YXRlTm9kZShcbiAgICAgICAgICAgICAgICB2aXNpdENvbnRleHRJZCxcbiAgICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICAgIHRoaXMuRVZFTlRfU1RBVEVTLmRvbmUudHlwZVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBlbDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBnZXRFdmVudFN0YXRlTm9kZSh2aXNpdENvbnRleHRJZCwgZ3JvdXBJZCwgZXZlbnRTYXRlKSB7XG4gICAgbGV0IGV2ZW50ID0gdGhpcy5fZXZlbnRTYXRlSXNWYWxpZChldmVudFNhdGUpO1xuXG4gICAgaWYgKHR5cGVvZiBldmVudCA9PT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuO1xuXG4gICAgbGV0IGNvbnRleHRUeXBlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8odmlzaXRDb250ZXh0SWQpLnR5cGUuZ2V0KCk7XG4gICAgbGV0IHJlbGF0aW9uTmFtZTtcblxuICAgIHN3aXRjaCAoY29udGV4dFR5cGUpIHtcbiAgICAgIGNhc2UgdGhpcy5NQUlOVEVOQU5DRV9WSVNJVDpcbiAgICAgICAgcmVsYXRpb25OYW1lID0gdGhpcy5NQUlOVEVOQU5DRV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIHRoaXMuU0VDVVJJVFlfVklTSVQ6XG4gICAgICAgIHJlbGF0aW9uTmFtZSA9IHRoaXMuU0VDVVJJVFlfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT047XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLkRJQUdOT1NUSUNfVklTSVQ6XG4gICAgICAgIHJlbGF0aW9uTmFtZSA9IHRoaXMuRElBR05PU1RJQ19WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIHRoaXMuUkVHVUxBVE9SWV9WSVNJVDpcbiAgICAgICAgcmVsYXRpb25OYW1lID0gdGhpcy5SRUdVTEFUT1JZX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKGdyb3VwSWQsIFtyZWxhdGlvbk5hbWVdKVxuICAgICAgLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgbmFtZSA9IGNoaWxkcmVuW2ldLm5hbWUuZ2V0KCk7XG4gICAgICAgICAgY29uc3QgdHlwZSA9IGNoaWxkcmVuW2ldLnN0YXRlLmdldCgpO1xuXG4gICAgICAgICAgaWYgKG5hbWUgPT09IGV2ZW50U2F0ZSB8fCB0eXBlID09PSBldmVudFNhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiBjaGlsZHJlbltpXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAudGhlbihlbCA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgZWwgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICBsZXQgYXJnTm9kZUlkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmNyZWF0ZU5vZGUoe1xuICAgICAgICAgICAgbmFtZTogZXZlbnQubmFtZSxcbiAgICAgICAgICAgIHN0YXRlOiBldmVudC50eXBlLFxuICAgICAgICAgICAgZ3JvdXBJZDogZ3JvdXBJZCxcbiAgICAgICAgICAgIHR5cGU6IFwiRXZlbnRTdGF0ZVwiXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkSW5Db250ZXh0KFxuICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgIGFyZ05vZGVJZCxcbiAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgcmVsYXRpb25OYW1lLFxuICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICkudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcykgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKGFyZ05vZGVJZCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICBQUklWQVRFUyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgX2dldERhdGUoYmVnaW5EYXRlLCBlbmREYXRlLCBwZXJpb2ROdW1iZXIsIHBlcmlvZE1lc3VyZSkge1xuICAgIGxldCBtZXN1cmUgPSBbXCJkYXlzXCIsIFwid2Vla3NcIiwgXCJtb250aHNcIiwgXCJ5ZWFyc1wiXVtwZXJpb2RNZXN1cmVdO1xuXG4gICAgbGV0IGV2ZW50c0RhdGUgPSBbXTtcblxuICAgIGxldCBkYXRlID0gbW9tZW50KGJlZ2luRGF0ZSk7XG4gICAgbGV0IGVuZCA9IG1vbWVudChlbmREYXRlKTtcblxuICAgIHdoaWxlIChlbmQuZGlmZihkYXRlKSA+PSAwKSB7XG4gICAgICBldmVudHNEYXRlLnB1c2goZGF0ZS50b0RhdGUoKSk7XG5cbiAgICAgIGRhdGUgPSBkYXRlLmFkZChwZXJpb2ROdW1iZXIsIG1lc3VyZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGV2ZW50c0RhdGU7XG4gIH1cblxuICBfZm9ybWF0RGF0ZShhcmdEYXRlKSB7XG4gICAgbGV0IGRhdGUgPSBuZXcgRGF0ZShhcmdEYXRlKTtcblxuICAgIHJldHVybiBgJHsoKCkgPT4ge1xuICAgICAgbGV0IGQgPSBkYXRlLmdldERhdGUoKTtcbiAgICAgIGQudG9TdHJpbmcoKS5sZW5ndGggPiAxID8gZCA6ICcwJyArIGQ7XG4gICAgfSkoKX0vJHsoKCkgPT4ge1xuXG4gICAgICBsZXQgZCA9IGRhdGUuZ2V0TW9udGgoKSArIDE7XG4gICAgICBkLnRvU3RyaW5nKCkubGVuZ3RoID4gMSA/IGQgOiAnMCcgKyBkO1xuXG4gICAgfSkoKX0vJHtkYXRlLmdldEZ1bGxZZWFyKCl9YDtcbiAgfVxuXG4gIF9ldmVudFNhdGVJc1ZhbGlkKGV2ZW50U3RhdGUpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLkVWRU5UX1NUQVRFUykge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLkVWRU5UX1NUQVRFU1trZXldLm5hbWUgPT09IGV2ZW50U3RhdGUgfHxcbiAgICAgICAgdGhpcy5FVkVOVF9TVEFURVNba2V5XS50eXBlID09PSBldmVudFN0YXRlXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuRVZFTlRfU1RBVEVTW2tleV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyAgICAgICAgICAgICAgICAgICAgICAgIEdFVCBJTkZPUk1BVElPTiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgZ2V0VmlzaXRHcm91cHModmlzaXRUeXBlKSB7XG4gICAgbGV0IGNvbnRleHRzID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENvbnRleHRXaXRoVHlwZSh2aXNpdFR5cGUpO1xuICAgIGlmIChjb250ZXh0cy5sZW5ndGggPT09IDApIHJldHVybiBbXTtcblxuICAgIGxldCBjb250ZXh0SWQgPSBjb250ZXh0c1swXS5pbmZvLmlkLmdldCgpO1xuXG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihcbiAgICAgIGNvbnRleHRJZCxcbiAgICAgIHRoaXMuVklTSVRfVFlQRV9UT19HUk9VUF9SRUxBVElPTlxuICAgICkudGhlbihyZXMgPT4ge1xuICAgICAgcmV0dXJuIHJlcy5tYXAoZWwgPT4gZWwuZ2V0KCkpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0R3JvdXBFdmVudHMoXG4gICAgZ3JvdXBJZCxcbiAgICBWSVNJVF9UWVBFUyA9IFtcbiAgICAgIHRoaXMuTUFJTlRFTkFOQ0VfVklTSVQsXG4gICAgICB0aGlzLlJFR1VMQVRPUllfVklTSVQsXG4gICAgICB0aGlzLlNFQ1VSSVRZX1ZJU0lULFxuICAgICAgdGhpcy5ESUFHTk9TVElDX1ZJU0lUXG4gICAgXVxuICApIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoVklTSVRfVFlQRVMpKSBWSVNJVF9UWVBFUyA9IFtWSVNJVF9UWVBFU107XG5cbiAgICByZXR1cm4gVklTSVRfVFlQRVMubWFwKHZpc2l0VHlwZSA9PiB7XG4gICAgICBsZXQgdmlzaXQgPSB0aGlzLlZJU0lUUy5maW5kKGVsID0+IHtcbiAgICAgICAgcmV0dXJuIGVsLnR5cGUgPT09IHZpc2l0VHlwZTtcbiAgICAgIH0pO1xuXG4gICAgICBsZXQgY29udGV4dCA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRDb250ZXh0KHZpc2l0Lm5hbWUpO1xuXG4gICAgICBpZiAodHlwZW9mIGNvbnRleHQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgbGV0IGNvbnRleHRJZCA9IGNvbnRleHQuaW5mby5pZC5nZXQoKTtcbiAgICAgICAgbGV0IHByb21pc2VzID0gW107XG5cbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5FVkVOVF9TVEFURVMpIHtcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKFxuICAgICAgICAgICAgdGhpcy5nZXRFdmVudFN0YXRlTm9kZShcbiAgICAgICAgICAgICAgY29udGV4dElkLFxuICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFU1trZXldLnR5cGVcbiAgICAgICAgICAgIClcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgICAgbGV0IHByb20gPSB2YWx1ZXMubWFwKGFzeW5jIGV2ZW50VHlwZSA9PiB7XG4gICAgICAgICAgICBsZXQgcmVzID0gZXZlbnRUeXBlLmdldCgpO1xuXG4gICAgICAgICAgICByZXNbXCJ2aXNpdF90eXBlXCJdID0gdmlzaXRUeXBlO1xuXG4gICAgICAgICAgICBsZXQgZXZlbnRzID0gYXdhaXQgU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKFxuICAgICAgICAgICAgICByZXMuaWQsIFtcbiAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OXG4gICAgICAgICAgICAgIF0pO1xuXG4gICAgICAgICAgICByZXNbXCJldmVudHNcIl0gPSBldmVudHMubWFwKGVsID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIGVsLmdldCgpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbSkudGhlbihhbGxFdmVudHMgPT4ge1xuICAgICAgICAgICAgbGV0IHZhbHVlcyA9IHt9O1xuXG4gICAgICAgICAgICBhbGxFdmVudHMuZm9yRWFjaCh2YWwgPT4ge1xuICAgICAgICAgICAgICB2YWx1ZXNbdmFsLnN0YXRlXSA9IHZhbC5ldmVudHM7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgW3Zpc2l0VHlwZV06IHZhbHVlc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxubGV0IHNwaW5hbFZpc2l0U2VydmljZSA9IG5ldyBTcGluYWxWaXNpdFNlcnZpY2UoKTtcblxuZXhwb3J0IGRlZmF1bHQgc3BpbmFsVmlzaXRTZXJ2aWNlOyJdfQ==