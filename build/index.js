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
                this.addEvent(el.id.get(), groupId, id, eventInfo, `Event_${eventInfo.name}_${this._formatDate(date)}`, new Date(date).getTime());
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
    let state = _spinalEnvViewerGraphService.SpinalGraphService.getInfo(stateId).name.get();

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

    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
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

            return { [visitType]: values };
          });
        });
      }
    });
  }
}

let spinalVisitService = new SpinalVisitService();

exports.default = spinalVisitService;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJTcGluYWxWaXNpdFNlcnZpY2UiLCJjb25zdHJ1Y3RvciIsIlZJU0lUX0NPTlRFWFRfTkFNRSIsIkNPTlRFWFRfVFlQRSIsIlZJU0lUX1RZUEUiLCJNQUlOVEVOQU5DRV9WSVNJVCIsIlJFR1VMQVRPUllfVklTSVQiLCJTRUNVUklUWV9WSVNJVCIsIkRJQUdOT1NUSUNfVklTSVQiLCJFVkVOVF9TVEFURVMiLCJPYmplY3QiLCJmcmVlemUiLCJkZWNsYXJlZCIsIm5hbWUiLCJ0eXBlIiwicHJvY2Vzc2luZyIsImRvbmUiLCJWSVNJVFMiLCJNQUlOVEVOQU5DRV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIlJFR1VMQVRPUllfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJTRUNVUklUWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJHUk9VUF9UT19UQVNLIiwiVklTSVRfVE9fRVZFTlRfUkVMQVRJT04iLCJWSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OIiwiRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04iLCJFVkVOVF9UT19UQVNLX1JFTEFUSU9OIiwiZ2V0QWxsVmlzaXRzIiwiYWRkVmlzaXRPbkdyb3VwIiwiZ3JvdXBJZCIsInZpc2l0TmFtZSIsInBlcmlvZGljaXR5TnVtYmVyIiwicGVyaW9kaWNpdHlNZXN1cmUiLCJ2aXNpdFR5cGUiLCJpbnRlcnZlbnRpb25OdW1iZXIiLCJpbnRlcnZlbnRpb25NZXN1cmUiLCJkZXNjcmlwdGlvbiIsIlNwaW5hbEdyYXBoU2VydmljZSIsImdldENoaWxkcmVuIiwidGhlbiIsImNoaWxkcmVuIiwiYXJnTm9kZUlkIiwibGVuZ3RoIiwiY3JlYXRlTm9kZSIsImFkZENoaWxkIiwiU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRSIsIm5vZGUiLCJnZXRJbmZvIiwiZ2V0UHRyVmFsdWUiLCJsc3QiLCJ0YXNrIiwiVmlzaXRNb2RlbCIsIm5vZGVJZCIsInBlcmlvZGljaXR5IiwibnVtYmVyIiwiZ2V0IiwibWVzdXJlIiwiaW50ZXJ2ZW50aW9uIiwicmVhbE5vZGUiLCJnZXRSZWFsTm9kZSIsInB1c2giLCJpbmZvIiwicHRyTmFtZSIsImlkIiwiUHJvbWlzZSIsInJlc29sdmUiLCJhZGRfYXR0ciIsInRhc2tzIiwiUHRyIiwiTHN0IiwibG9hZCIsInZhbHVlIiwiZ2V0R3JvdXBWaXNpdHMiLCJ2aXNpdHlUeXBlIiwicmVzIiwiZ2VuZXJhdGVFdmVudCIsImJlZ2luRGF0ZSIsImVuZERhdGUiLCJldmVudHNEYXRhIiwiY3JlYXRlVmlzaXRDb250ZXh0IiwiZWwiLCJsaW5rR3JvdXBUb1Zpc3RDb250ZXh0IiwiZ2V0RXZlbnRTdGF0ZU5vZGUiLCJzdGF0ZU5vZGUiLCJmb3JFYWNoIiwiZXZlbnRJbmZvIiwiZXZlbnRzRGF0ZSIsIl9nZXREYXRlIiwicGVyaW9kTnVtYmVyIiwicGVyaW9kTWVzdXJlIiwiZGF0ZSIsImFkZEV2ZW50IiwiX2Zvcm1hdERhdGUiLCJEYXRlIiwiZ2V0VGltZSIsImNhdGNoIiwiZXJyIiwiY29uc29sZSIsImxvZyIsInZpc2l0VHlwZUNvbnRleHRJZCIsInN0YXRlSWQiLCJ2aXNpdEluZm8iLCJzdGF0ZSIsImV2ZW50IiwiRXZlbnRNb2RlbCIsImV2ZW50Tm9kZUlkIiwidmlzaXRJZCIsImFkZENoaWxkSW5Db250ZXh0IiwiZXZlbnRJZCIsIkVRVUlQTUVOVFNfVE9fRUxFTUVOVF9SRUxBVElPTiIsIm1hcCIsImNoaWxkIiwiVGFza01vZGVsIiwiZGJpZCIsImJpbUZpbGVJZCIsInRhc2tJZCIsImRiSWQiLCJ0YXNrTmFtZSIsImFsbCIsInZpc2l0IiwiZmluZCIsImNvbnRleHROYW1lIiwiY29udGV4dCIsImdldENvbnRleHQiLCJhZGRDb250ZXh0IiwiTW9kZWwiLCJjb250ZXh0Q3JlYXRlZCIsInJlamVjdCIsInZpc2l0Q29udGV4dElkIiwiaSIsImV2ZW50U2F0ZSIsIl9ldmVudFNhdGVJc1ZhbGlkIiwiY29udGV4dFR5cGUiLCJyZWxhdGlvbk5hbWUiLCJlbmQiLCJkaWZmIiwidG9EYXRlIiwiYWRkIiwiYXJnRGF0ZSIsImdldERhdGUiLCJnZXRNb250aCIsImdldEZ1bGxZZWFyIiwiZXZlbnRTdGF0ZSIsImtleSIsInVuZGVmaW5lZCIsImdldFZpc2l0R3JvdXBzIiwiY29udGV4dHMiLCJnZXRDb250ZXh0V2l0aFR5cGUiLCJjb250ZXh0SWQiLCJnZXRHcm91cEV2ZW50cyIsIlZJU0lUX1RZUEVTIiwiQXJyYXkiLCJpc0FycmF5IiwicHJvbWlzZXMiLCJ2YWx1ZXMiLCJwcm9tIiwiZXZlbnRUeXBlIiwiZXZlbnRzIiwiYWxsRXZlbnRzIiwidmFsIiwic3BpbmFsVmlzaXRTZXJ2aWNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7QUFLQTs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQTs7QUFFQTs7Ozs7Ozs7QUFFQSxNQUFNQSxrQkFBTixDQUF5QjtBQUN2QkMsZ0JBQWM7QUFDWixTQUFLQyxrQkFBTCxHQUEwQixnQkFBMUI7QUFDQSxTQUFLQyxZQUFMLEdBQW9CLGVBQXBCOztBQUVBLFNBQUtDLFVBQUwsR0FBa0IsT0FBbEI7O0FBRUEsU0FBS0MsaUJBQUwsR0FBeUIsbUJBQXpCO0FBQ0EsU0FBS0MsZ0JBQUwsR0FBd0Isa0JBQXhCO0FBQ0EsU0FBS0MsY0FBTCxHQUFzQixnQkFBdEI7QUFDQSxTQUFLQyxnQkFBTCxHQUF3QixrQkFBeEI7O0FBRUEsU0FBS0MsWUFBTCxHQUFvQkMsT0FBT0MsTUFBUCxDQUFjO0FBQ2hDQyxnQkFBVTtBQUNSQyxjQUFNLFNBREU7QUFFUkMsY0FBTTtBQUZFLE9BRHNCO0FBS2hDQyxrQkFBWTtBQUNWRixjQUFNLFNBREk7QUFFVkMsY0FBTTtBQUZJLE9BTG9CO0FBU2hDRSxZQUFNO0FBQ0pILGNBQU0sVUFERjtBQUVKQyxjQUFNO0FBRkY7QUFUMEIsS0FBZCxDQUFwQjs7QUFlQSxTQUFLRyxNQUFMLEdB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IFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEUsXG4gIFNwaW5hbEdyYXBoU2VydmljZVxufSBmcm9tIFwic3BpbmFsLWVudi12aWV3ZXItZ3JhcGgtc2VydmljZVwiO1xuXG5pbXBvcnQgeyBFUVVJUE1FTlRTX1RPX0VMRU1FTlRfUkVMQVRJT04gfSBmcm9tIFwic3BpbmFsLWVudi12aWV3ZXItcm9vbS1tYW5hZ2VyL2pzL3NlcnZpY2VcIjtcblxuaW1wb3J0IFZpc2l0TW9kZWwgZnJvbSBcIi4vbW9kZWxzL3Zpc2l0Lm1vZGVsLmpzXCI7XG5pbXBvcnQgRXZlbnRNb2RlbCBmcm9tIFwiLi9tb2RlbHMvZXZlbnQubW9kZWwuanNcIjtcbmltcG9ydCBUYXNrTW9kZWwgZnJvbSBcIi4vbW9kZWxzL3Rhc2subW9kZWwuanNcIjtcblxuaW1wb3J0IHsgUHRyLCBMc3QsIE1vZGVsIH0gZnJvbSBcInNwaW5hbC1jb3JlLWNvbm5lY3RvcmpzX3R5cGVcIjtcblxuaW1wb3J0IG1vbWVudCBmcm9tIFwibW9tZW50XCI7XG5cbmNsYXNzIFNwaW5hbFZpc2l0U2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuVklTSVRfQ09OVEVYVF9OQU1FID0gXCIudmlzaXRfY29udGV4dFwiO1xuICAgIHRoaXMuQ09OVEVYVF9UWVBFID0gXCJ2aXNpdF9jb250ZXh0XCI7XG5cbiAgICB0aGlzLlZJU0lUX1RZUEUgPSBcInZpc2l0XCI7XG5cbiAgICB0aGlzLk1BSU5URU5BTkNFX1ZJU0lUID0gXCJNQUlOVEVOQU5DRV9WSVNJVFwiO1xuICAgIHRoaXMuUkVHVUxBVE9SWV9WSVNJVCA9IFwiUkVHVUxBVE9SWV9WSVNJVFwiO1xuICAgIHRoaXMuU0VDVVJJVFlfVklTSVQgPSBcIlNFQ1VSSVRZX1ZJU0lUXCI7XG4gICAgdGhpcy5ESUFHTk9TVElDX1ZJU0lUID0gXCJESUFHTk9TVElDX1ZJU0lUXCI7XG5cbiAgICB0aGlzLkVWRU5UX1NUQVRFUyA9IE9iamVjdC5mcmVlemUoe1xuICAgICAgZGVjbGFyZWQ6IHtcbiAgICAgICAgbmFtZTogXCJkw6ljbGFyw6lcIixcbiAgICAgICAgdHlwZTogXCJkZWNsYXJlZFwiXG4gICAgICB9LFxuICAgICAgcHJvY2Vzc2luZzoge1xuICAgICAgICBuYW1lOiBcImVuY291cnNcIixcbiAgICAgICAgdHlwZTogXCJwcm9jZXNzaW5nXCJcbiAgICAgIH0sXG4gICAgICBkb25lOiB7XG4gICAgICAgIG5hbWU6IFwiw6lmZmVjdHXDqVwiLFxuICAgICAgICB0eXBlOiBcImRvbmVcIlxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5WSVNJVFMgPSBPYmplY3QuZnJlZXplKFtcbiAgICAgIHtcbiAgICAgICAgdHlwZTogdGhpcy5NQUlOVEVOQU5DRV9WSVNJVCxcbiAgICAgICAgbmFtZTogXCJNYWludGVuYW5jZSB2aXNpdFwiXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0eXBlOiB0aGlzLlJFR1VMQVRPUllfVklTSVQsXG4gICAgICAgIG5hbWU6IFwiUmVndWxhdG9yeSB2aXNpdFwiXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0eXBlOiB0aGlzLlNFQ1VSSVRZX1ZJU0lULFxuICAgICAgICBuYW1lOiBcIlNlY3VyaXR5IFZpc2l0XCJcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6IHRoaXMuRElBR05PU1RJQ19WSVNJVCxcbiAgICAgICAgbmFtZTogXCJEaWFnbm9zdGljIHZpc2l0XCJcbiAgICAgIH1cbiAgICBdKTtcblxuICAgIHRoaXMuTUFJTlRFTkFOQ0VfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04gPVxuICAgICAgXCJtYWludGVuYW5jZVZpc2l0aGFzRXZlbnRTdGF0ZVwiO1xuXG4gICAgdGhpcy5SRUdVTEFUT1JZX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OID0gXCJyZWd1bGF0b3J5VmlzaXRoYXNFdmVudFN0YXRlXCI7XG5cbiAgICB0aGlzLlNFQ1VSSVRZX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OID0gXCJzZWN1cml0eVZpc2l0aGFzRXZlbnRTdGF0ZVwiO1xuXG4gICAgdGhpcy5ESUFHTk9TVElDX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OID0gXCJkaWFnbm9zdGljVmlzaXRoYXNFdmVudFN0YXRlXCI7XG5cbiAgICB0aGlzLkdST1VQX1RPX1RBU0sgPSBcImhhc1Zpc2l0XCI7XG5cbiAgICB0aGlzLlZJU0lUX1RPX0VWRU5UX1JFTEFUSU9OID0gXCJ2aXNpdEhhc0V2ZW50XCI7XG5cbiAgICB0aGlzLlZJU0lUX1RZUEVfVE9fR1JPVVBfUkVMQVRJT04gPSBcInZpc2l0SGFzR3JvdXBcIjtcbiAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OID0gXCJoYXNFdmVudFwiO1xuICAgIHRoaXMuRVZFTlRfVE9fVEFTS19SRUxBVElPTiA9IFwiaGFzVGFza1wiO1xuICB9XG5cbiAgZ2V0QWxsVmlzaXRzKCkge1xuICAgIHJldHVybiB0aGlzLlZJU0lUUztcbiAgfVxuXG4gIGFkZFZpc2l0T25Hcm91cChcbiAgICBncm91cElkLFxuICAgIHZpc2l0TmFtZSxcbiAgICBwZXJpb2RpY2l0eU51bWJlcixcbiAgICBwZXJpb2RpY2l0eU1lc3VyZSxcbiAgICB2aXNpdFR5cGUsXG4gICAgaW50ZXJ2ZW50aW9uTnVtYmVyLFxuICAgIGludGVydmVudGlvbk1lc3VyZSxcbiAgICBkZXNjcmlwdGlvblxuICApIHtcbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKGdyb3VwSWQsIFt0aGlzLkdST1VQX1RPX1RBU0tdKS50aGVuKFxuICAgICAgY2hpbGRyZW4gPT4ge1xuICAgICAgICBsZXQgYXJnTm9kZUlkO1xuICAgICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgYXJnTm9kZUlkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmNyZWF0ZU5vZGUoe1xuICAgICAgICAgICAgbmFtZTogXCJtYWludGVuYW5jZVwiXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGQoXG4gICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgYXJnTm9kZUlkLFxuICAgICAgICAgICAgdGhpcy5HUk9VUF9UT19UQVNLLFxuICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbm9kZSA9XG4gICAgICAgICAgdHlwZW9mIGFyZ05vZGVJZCAhPT0gXCJ1bmRlZmluZWRcIlxuICAgICAgICAgICAgPyBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhhcmdOb2RlSWQpXG4gICAgICAgICAgICA6IGNoaWxkcmVuWzBdO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldFB0clZhbHVlKG5vZGUsIHZpc2l0VHlwZSkudGhlbihsc3QgPT4ge1xuICAgICAgICAgIGxldCB0YXNrID0gbmV3IFZpc2l0TW9kZWwoXG4gICAgICAgICAgICB2aXNpdE5hbWUsXG4gICAgICAgICAgICBwZXJpb2RpY2l0eU51bWJlcixcbiAgICAgICAgICAgIHBlcmlvZGljaXR5TWVzdXJlLFxuICAgICAgICAgICAgdmlzaXRUeXBlLFxuICAgICAgICAgICAgaW50ZXJ2ZW50aW9uTnVtYmVyLFxuICAgICAgICAgICAgaW50ZXJ2ZW50aW9uTWVzdXJlLFxuICAgICAgICAgICAgZGVzY3JpcHRpb25cbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbGV0IG5vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBncm91cElkOiBncm91cElkLFxuICAgICAgICAgICAgICBuYW1lOiB2aXNpdE5hbWUsXG4gICAgICAgICAgICAgIHBlcmlvZGljaXR5OiB7XG4gICAgICAgICAgICAgICAgbnVtYmVyOiB0YXNrLnBlcmlvZGljaXR5Lm51bWJlci5nZXQoKSxcbiAgICAgICAgICAgICAgICBtZXN1cmU6IHRhc2sucGVyaW9kaWNpdHkubWVzdXJlLmdldCgpXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGludGVydmVudGlvbjoge1xuICAgICAgICAgICAgICAgIG51bWJlcjogdGFzay5pbnRlcnZlbnRpb24ubnVtYmVyLmdldCgpLFxuICAgICAgICAgICAgICAgIG1lc3VyZTogdGFzay5pbnRlcnZlbnRpb24ubWVzdXJlLmdldCgpXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHZpc2l0VHlwZTogdmlzaXRUeXBlLFxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0YXNrXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGxldCByZWFsTm9kZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRSZWFsTm9kZShub2RlSWQpO1xuXG4gICAgICAgICAgbHN0LnB1c2gocmVhbE5vZGUpO1xuXG4gICAgICAgICAgcmV0dXJuIHJlYWxOb2RlLmluZm87XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBnZXRQdHJWYWx1ZShub2RlLCBwdHJOYW1lKSB7XG4gICAgbGV0IHJlYWxOb2RlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldFJlYWxOb2RlKG5vZGUuaWQuZ2V0KCkpO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgaWYgKCFyZWFsTm9kZS5pbmZvW3B0ck5hbWVdKSB7XG4gICAgICAgIHJlYWxOb2RlLmluZm8uYWRkX2F0dHIocHRyTmFtZSwge1xuICAgICAgICAgIHRhc2tzOiBuZXcgUHRyKG5ldyBMc3QoKSlcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJlYWxOb2RlLmluZm9bcHRyTmFtZV0udGFza3MubG9hZCh2YWx1ZSA9PiB7XG4gICAgICAgIHJldHVybiByZXNvbHZlKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0R3JvdXBWaXNpdHMoZ3JvdXBJZCwgdmlzaXR5VHlwZSkge1xuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oZ3JvdXBJZCwgW3RoaXMuR1JPVVBfVE9fVEFTS10pLnRoZW4oXG4gICAgICByZXMgPT4ge1xuICAgICAgICBsZXQgbm9kZUlkO1xuICAgICAgICBpZiAocmVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIG5vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgIG5hbWU6IFwibWFpbnRlbmFuY2VcIlxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkKFxuICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgIG5vZGVJZCxcbiAgICAgICAgICAgIHRoaXMuR1JPVVBfVE9fVEFTSyxcbiAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5vZGUgPVxuICAgICAgICAgIHR5cGVvZiBub2RlSWQgIT09IFwidW5kZWZpbmVkXCJcbiAgICAgICAgICAgID8gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8obm9kZUlkKVxuICAgICAgICAgICAgOiByZXNbMF07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHRyVmFsdWUobm9kZSwgdmlzaXR5VHlwZSk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGdlbmVyYXRlRXZlbnQodmlzaXRUeXBlLCBncm91cElkLCBiZWdpbkRhdGUsIGVuZERhdGUsIGV2ZW50c0RhdGEpIHtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVWaXNpdENvbnRleHQodmlzaXRUeXBlKVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5saW5rR3JvdXBUb1Zpc3RDb250ZXh0KGVsLmlkLmdldCgpLCBncm91cElkKS50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgICAgdGhpcy5nZXRFdmVudFN0YXRlTm9kZShcbiAgICAgICAgICAgICAgZWwuaWQuZ2V0KCksXG4gICAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICAgIHRoaXMuRVZFTlRfU1RBVEVTLmRlY2xhcmVkLnR5cGVcbiAgICAgICAgICAgICkudGhlbihzdGF0ZU5vZGUgPT4ge1xuICAgICAgICAgICAgICBsZXQgaWQgPSBzdGF0ZU5vZGUuaWQuZ2V0KCk7XG5cbiAgICAgICAgICAgICAgZXZlbnRzRGF0YS5mb3JFYWNoKGV2ZW50SW5mbyA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGV2ZW50c0RhdGUgPSB0aGlzLl9nZXREYXRlKFxuICAgICAgICAgICAgICAgICAgYmVnaW5EYXRlLFxuICAgICAgICAgICAgICAgICAgZW5kRGF0ZSxcbiAgICAgICAgICAgICAgICAgIGV2ZW50SW5mby5wZXJpb2ROdW1iZXIsXG4gICAgICAgICAgICAgICAgICBldmVudEluZm8ucGVyaW9kTWVzdXJlXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIGV2ZW50c0RhdGUuZm9yRWFjaChkYXRlID0+IHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnQoXG4gICAgICAgICAgICAgICAgICAgIGVsLmlkLmdldCgpLFxuICAgICAgICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICAgICAgICBpZCxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRJbmZvLFxuICAgICAgICAgICAgICAgICAgICBgRXZlbnRfJHtldmVudEluZm8ubmFtZX1fJHt0aGlzLl9mb3JtYXREYXRlKGRhdGUpfWAsXG4gICAgICAgICAgICAgICAgICAgIG5ldyBEYXRlKGRhdGUpLmdldFRpbWUoKVxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGVycik7XG4gICAgICB9KTtcbiAgfVxuXG4gIGFkZEV2ZW50KHZpc2l0VHlwZUNvbnRleHRJZCwgZ3JvdXBJZCwgc3RhdGVJZCwgdmlzaXRJbmZvLCBuYW1lLCBkYXRlKSB7XG4gICAgbGV0IHN0YXRlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8oc3RhdGVJZCkubmFtZS5nZXQoKTtcblxuICAgIGxldCBldmVudCA9IG5ldyBFdmVudE1vZGVsKG5hbWUsIGRhdGUsIHN0YXRlLCBncm91cElkKTtcblxuICAgIGxldCBldmVudE5vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKFxuICAgICAge1xuICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICBkYXRlOiBkYXRlLFxuICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgIGdyb3VwSWQ6IGdyb3VwSWQsXG4gICAgICAgIHZpc2l0SWQ6IHZpc2l0SW5mby5pZFxuICAgICAgfSxcbiAgICAgIGV2ZW50XG4gICAgKTtcblxuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGRJbkNvbnRleHQoXG4gICAgICBzdGF0ZUlkLFxuICAgICAgZXZlbnROb2RlSWQsXG4gICAgICB2aXNpdFR5cGVDb250ZXh0SWQsXG4gICAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OLFxuICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgIClcbiAgICAgIC50aGVuKGVsID0+IHtcbiAgICAgICAgaWYgKGVsKSByZXR1cm4gZXZlbnROb2RlSWQ7XG4gICAgICB9KVxuICAgICAgLnRoZW4oZXZlbnRJZCA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnRJZCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oZ3JvdXBJZCwgW1xuICAgICAgICAgICAgRVFVSVBNRU5UU19UT19FTEVNRU5UX1JFTEFUSU9OXG4gICAgICAgICAgXSkudGhlbihjaGlsZHJlbiA9PiB7XG4gICAgICAgICAgICBjaGlsZHJlbi5tYXAoY2hpbGQgPT4ge1xuICAgICAgICAgICAgICBsZXQgbmFtZSA9IGAke3Zpc2l0SW5mby5uYW1lfV9fJHtjaGlsZC5uYW1lLmdldCgpfWA7XG4gICAgICAgICAgICAgIGxldCB0YXNrID0gbmV3IFRhc2tNb2RlbChcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGNoaWxkLmRiaWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgY2hpbGQuYmltRmlsZUlkLmdldCgpLFxuICAgICAgICAgICAgICAgIHZpc2l0SW5mby5uYW1lLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICBsZXQgdGFza0lkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmNyZWF0ZU5vZGUoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgICAgIGRiSWQ6IGNoaWxkLmRiaWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgICBiaW1GaWxlSWQ6IGNoaWxkLmJpbUZpbGVJZC5nZXQoKSxcbiAgICAgICAgICAgICAgICAgIHRhc2tOYW1lOiB2aXNpdEluZm8ubmFtZSxcbiAgICAgICAgICAgICAgICAgIHZpc2l0SWQ6IHZpc2l0SW5mby5pZCxcbiAgICAgICAgICAgICAgICAgIHN0YXRlOiB0YXNrLnN0YXRlLmdldCgpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0YXNrXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGRJbkNvbnRleHQoXG4gICAgICAgICAgICAgICAgICBldmVudElkLFxuICAgICAgICAgICAgICAgICAgdGFza0lkLFxuICAgICAgICAgICAgICAgICAgdmlzaXRUeXBlQ29udGV4dElkLFxuICAgICAgICAgICAgICAgICAgdGhpcy5FVkVOVF9UT19UQVNLX1JFTEFUSU9OLFxuICAgICAgICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkKFxuICAgICAgICAgICAgICAgICAgdmlzaXRJbmZvLmlkLFxuICAgICAgICAgICAgICAgICAgZXZlbnRJZCxcbiAgICAgICAgICAgICAgICAgIHRoaXMuVklTSVRfVE9fRVZFTlRfUkVMQVRJT04sXG4gICAgICAgICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIGNyZWF0ZVZpc2l0Q29udGV4dCh2aXNpdFR5cGUpIHtcbiAgICBsZXQgdmlzaXQgPSB0aGlzLlZJU0lUUy5maW5kKGVsID0+IHtcbiAgICAgIHJldHVybiBlbC50eXBlID09PSB2aXNpdFR5cGU7XG4gICAgfSk7XG5cbiAgICBpZiAodHlwZW9mIHZpc2l0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBjb25zdCBjb250ZXh0TmFtZSA9IGAke3Zpc2l0Lm5hbWV9YDtcblxuICAgICAgbGV0IGNvbnRleHQgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q29udGV4dChjb250ZXh0TmFtZSk7XG4gICAgICBpZiAodHlwZW9mIGNvbnRleHQgIT09IFwidW5kZWZpbmVkXCIpIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29udGV4dC5pbmZvKTtcblxuICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDb250ZXh0KFxuICAgICAgICBjb250ZXh0TmFtZSxcbiAgICAgICAgdmlzaXRUeXBlLFxuICAgICAgICBuZXcgTW9kZWwoe1xuICAgICAgICAgIG5hbWU6IHRoaXMuVklTSVRfQ09OVEVYVF9OQU1FXG4gICAgICAgIH0pXG4gICAgICApLnRoZW4oY29udGV4dENyZWF0ZWQgPT4ge1xuICAgICAgICByZXR1cm4gY29udGV4dENyZWF0ZWQuaW5mbztcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXCJ2aXNpdE5vdEZvdW5kXCIpO1xuICAgIH1cbiAgfVxuXG4gIGxpbmtHcm91cFRvVmlzdENvbnRleHQodmlzaXRDb250ZXh0SWQsIGdyb3VwSWQpIHtcbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKHZpc2l0Q29udGV4dElkLCBbXG4gICAgICB0aGlzLlZJU0lUX1RZUEVfVE9fR1JPVVBfUkVMQVRJT05cbiAgICBdKVxuICAgICAgLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZHJlbltpXS5pZC5nZXQoKTtcbiAgICAgICAgICBpZiAoY2hpbGQgPT09IGdyb3VwSWQpIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGVsID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dChcbiAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgdGhpcy5WSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OLFxuICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICkudGhlbihhc3luYyByZXMgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdldEV2ZW50U3RhdGVOb2RlKFxuICAgICAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICAgICAgdGhpcy5FVkVOVF9TVEFURVMucHJvY2Vzc2luZy50eXBlXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoXG4gICAgICAgICAgICAgICAgdmlzaXRDb250ZXh0SWQsXG4gICAgICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFUy5kb25lLnR5cGVcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgZ2V0RXZlbnRTdGF0ZU5vZGUodmlzaXRDb250ZXh0SWQsIGdyb3VwSWQsIGV2ZW50U2F0ZSkge1xuICAgIGxldCBldmVudCA9IHRoaXMuX2V2ZW50U2F0ZUlzVmFsaWQoZXZlbnRTYXRlKTtcblxuICAgIGlmICh0eXBlb2YgZXZlbnQgPT09IFwidW5kZWZpbmVkXCIpIHJldHVybjtcblxuICAgIGxldCBjb250ZXh0VHlwZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKHZpc2l0Q29udGV4dElkKS50eXBlLmdldCgpO1xuICAgIGxldCByZWxhdGlvbk5hbWU7XG5cbiAgICBzd2l0Y2ggKGNvbnRleHRUeXBlKSB7XG4gICAgICBjYXNlIHRoaXMuTUFJTlRFTkFOQ0VfVklTSVQ6XG4gICAgICAgIHJlbGF0aW9uTmFtZSA9IHRoaXMuTUFJTlRFTkFOQ0VfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT047XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLlNFQ1VSSVRZX1ZJU0lUOlxuICAgICAgICByZWxhdGlvbk5hbWUgPSB0aGlzLlNFQ1VSSVRZX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdGhpcy5ESUFHTk9TVElDX1ZJU0lUOlxuICAgICAgICByZWxhdGlvbk5hbWUgPSB0aGlzLkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT047XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLlJFR1VMQVRPUllfVklTSVQ6XG4gICAgICAgIHJlbGF0aW9uTmFtZSA9IHRoaXMuUkVHVUxBVE9SWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTjtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihncm91cElkLCBbcmVsYXRpb25OYW1lXSlcbiAgICAgIC50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG5hbWUgPSBjaGlsZHJlbltpXS5uYW1lLmdldCgpO1xuICAgICAgICAgIGNvbnN0IHR5cGUgPSBjaGlsZHJlbltpXS5zdGF0ZS5nZXQoKTtcblxuICAgICAgICAgIGlmIChuYW1lID09PSBldmVudFNhdGUgfHwgdHlwZSA9PT0gZXZlbnRTYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gY2hpbGRyZW5baV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGVsID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgbGV0IGFyZ05vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgIG5hbWU6IGV2ZW50Lm5hbWUsXG4gICAgICAgICAgICBzdGF0ZTogZXZlbnQudHlwZSxcbiAgICAgICAgICAgIGdyb3VwSWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICB0eXBlOiBcIkV2ZW50U3RhdGVcIlxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dChcbiAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICBhcmdOb2RlSWQsXG4gICAgICAgICAgICB2aXNpdENvbnRleHRJZCxcbiAgICAgICAgICAgIHJlbGF0aW9uTmFtZSxcbiAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICApLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgIGlmIChyZXMpIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhhcmdOb2RlSWQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBlbDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgUFJJVkFURVMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gIF9nZXREYXRlKGJlZ2luRGF0ZSwgZW5kRGF0ZSwgcGVyaW9kTnVtYmVyLCBwZXJpb2RNZXN1cmUpIHtcbiAgICBsZXQgbWVzdXJlID0gW1wiZGF5c1wiLCBcIndlZWtzXCIsIFwibW9udGhzXCIsIFwieWVhcnNcIl1bcGVyaW9kTWVzdXJlXTtcblxuICAgIGxldCBldmVudHNEYXRlID0gW107XG5cbiAgICBsZXQgZGF0ZSA9IG1vbWVudChiZWdpbkRhdGUpO1xuICAgIGxldCBlbmQgPSBtb21lbnQoZW5kRGF0ZSk7XG5cbiAgICB3aGlsZSAoZW5kLmRpZmYoZGF0ZSkgPj0gMCkge1xuICAgICAgZXZlbnRzRGF0ZS5wdXNoKGRhdGUudG9EYXRlKCkpO1xuXG4gICAgICBkYXRlID0gZGF0ZS5hZGQocGVyaW9kTnVtYmVyLCBtZXN1cmUpO1xuICAgIH1cblxuICAgIHJldHVybiBldmVudHNEYXRlO1xuICB9XG5cbiAgX2Zvcm1hdERhdGUoYXJnRGF0ZSkge1xuICAgIGxldCBkYXRlID0gbmV3IERhdGUoYXJnRGF0ZSk7XG5cbiAgICByZXR1cm4gYCR7ZGF0ZS5nZXREYXRlKCl9LyR7ZGF0ZS5nZXRNb250aCgpICsgMX0vJHtkYXRlLmdldEZ1bGxZZWFyKCl9YDtcbiAgfVxuXG4gIF9ldmVudFNhdGVJc1ZhbGlkKGV2ZW50U3RhdGUpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLkVWRU5UX1NUQVRFUykge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLkVWRU5UX1NUQVRFU1trZXldLm5hbWUgPT09IGV2ZW50U3RhdGUgfHxcbiAgICAgICAgdGhpcy5FVkVOVF9TVEFURVNba2V5XS50eXBlID09PSBldmVudFN0YXRlXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuRVZFTlRfU1RBVEVTW2tleV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyAgICAgICAgICAgICAgICAgICAgICAgIEdFVCBJTkZPUk1BVElPTiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgZ2V0VmlzaXRHcm91cHModmlzaXRUeXBlKSB7XG4gICAgbGV0IGNvbnRleHRzID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENvbnRleHRXaXRoVHlwZSh2aXNpdFR5cGUpO1xuICAgIGlmIChjb250ZXh0cy5sZW5ndGggPT09IDApIHJldHVybiBbXTtcblxuICAgIGxldCBjb250ZXh0SWQgPSBjb250ZXh0c1swXS5pbmZvLmlkLmdldCgpO1xuXG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihcbiAgICAgIGNvbnRleHRJZCxcbiAgICAgIHRoaXMuVklTSVRfVFlQRV9UT19HUk9VUF9SRUxBVElPTlxuICAgICkudGhlbihyZXMgPT4ge1xuICAgICAgcmV0dXJuIHJlcy5tYXAoZWwgPT4gZWwuZ2V0KCkpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0R3JvdXBFdmVudHMoXG4gICAgZ3JvdXBJZCxcbiAgICBWSVNJVF9UWVBFUyA9IFtcbiAgICAgIHRoaXMuTUFJTlRFTkFOQ0VfVklTSVQsXG4gICAgICB0aGlzLlJFR1VMQVRPUllfVklTSVQsXG4gICAgICB0aGlzLlNFQ1VSSVRZX1ZJU0lULFxuICAgICAgdGhpcy5ESUFHTk9TVElDX1ZJU0lUXG4gICAgXVxuICApIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoVklTSVRfVFlQRVMpKSBWSVNJVF9UWVBFUyA9IFtWSVNJVF9UWVBFU107XG5cbiAgICByZXR1cm4gVklTSVRfVFlQRVMubWFwKHZpc2l0VHlwZSA9PiB7XG4gICAgICBsZXQgdmlzaXQgPSB0aGlzLlZJU0lUUy5maW5kKGVsID0+IHtcbiAgICAgICAgcmV0dXJuIGVsLnR5cGUgPT09IHZpc2l0VHlwZTtcbiAgICAgIH0pO1xuXG4gICAgICBsZXQgY29udGV4dCA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRDb250ZXh0KHZpc2l0Lm5hbWUpO1xuXG4gICAgICBpZiAodHlwZW9mIGNvbnRleHQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgbGV0IGNvbnRleHRJZCA9IGNvbnRleHQuaW5mby5pZC5nZXQoKTtcbiAgICAgICAgbGV0IHByb21pc2VzID0gW107XG5cbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5FVkVOVF9TVEFURVMpIHtcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKFxuICAgICAgICAgICAgdGhpcy5nZXRFdmVudFN0YXRlTm9kZShcbiAgICAgICAgICAgICAgY29udGV4dElkLFxuICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFU1trZXldLnR5cGVcbiAgICAgICAgICAgIClcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgICAgbGV0IHByb20gPSB2YWx1ZXMubWFwKGFzeW5jIGV2ZW50VHlwZSA9PiB7XG4gICAgICAgICAgICBsZXQgcmVzID0gZXZlbnRUeXBlLmdldCgpO1xuXG4gICAgICAgICAgICByZXNbXCJ2aXNpdF90eXBlXCJdID0gdmlzaXRUeXBlO1xuXG4gICAgICAgICAgICBsZXQgZXZlbnRzID0gYXdhaXQgU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKHJlcy5pZCwgW1xuICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OXG4gICAgICAgICAgICBdKTtcblxuICAgICAgICAgICAgcmVzW1wiZXZlbnRzXCJdID0gZXZlbnRzLm1hcChlbCA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBlbC5nZXQoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb20pLnRoZW4oYWxsRXZlbnRzID0+IHtcbiAgICAgICAgICAgIGxldCB2YWx1ZXMgPSB7fTtcblxuICAgICAgICAgICAgYWxsRXZlbnRzLmZvckVhY2godmFsID0+IHtcbiAgICAgICAgICAgICAgdmFsdWVzW3ZhbC5zdGF0ZV0gPSB2YWwuZXZlbnRzO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiB7IFt2aXNpdFR5cGVdOiB2YWx1ZXMgfTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxubGV0IHNwaW5hbFZpc2l0U2VydmljZSA9IG5ldyBTcGluYWxWaXNpdFNlcnZpY2UoKTtcblxuZXhwb3J0IGRlZmF1bHQgc3BpbmFsVmlzaXRTZXJ2aWNlO1xuIl19