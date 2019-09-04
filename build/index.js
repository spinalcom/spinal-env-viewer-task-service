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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJTcGluYWxWaXNpdFNlcnZpY2UiLCJjb25zdHJ1Y3RvciIsIlZJU0lUX0NPTlRFWFRfTkFNRSIsIkNPTlRFWFRfVFlQRSIsIlZJU0lUX1RZUEUiLCJNQUlOVEVOQU5DRV9WSVNJVCIsIlJFR1VMQVRPUllfVklTSVQiLCJTRUNVUklUWV9WSVNJVCIsIkRJQUdOT1NUSUNfVklTSVQiLCJFVkVOVF9TVEFURVMiLCJPYmplY3QiLCJmcmVlemUiLCJkZWNsYXJlZCIsIm5hbWUiLCJ0eXBlIiwicHJvY2Vzc2luZyIsImRvbmUiLCJWSVNJVFMiLCJNQUlOVEVOQU5DRV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIlJFR1VMQVRPUllfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJTRUNVUklUWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJHUk9VUF9UT19UQVNLIiwiVklTSVRfVE9fRVZFTlRfUkVMQVRJT04iLCJWSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OIiwiRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04iLCJFVkVOVF9UT19UQVNLX1JFTEFUSU9OIiwiZ2V0QWxsVmlzaXRzIiwiYWRkVmlzaXRPbkdyb3VwIiwiZ3JvdXBJZCIsInZpc2l0TmFtZSIsInBlcmlvZGljaXR5TnVtYmVyIiwicGVyaW9kaWNpdHlNZXN1cmUiLCJ2aXNpdFR5cGUiLCJpbnRlcnZlbnRpb25OdW1iZXIiLCJpbnRlcnZlbnRpb25NZXN1cmUiLCJkZXNjcmlwdGlvbiIsIlNwaW5hbEdyYXBoU2VydmljZSIsImdldENoaWxkcmVuIiwidGhlbiIsImNoaWxkcmVuIiwiYXJnTm9kZUlkIiwibGVuZ3RoIiwiY3JlYXRlTm9kZSIsImFkZENoaWxkIiwiU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRSIsIm5vZGUiLCJnZXRJbmZvIiwiZ2V0UHRyVmFsdWUiLCJsc3QiLCJ0YXNrIiwiVmlzaXRNb2RlbCIsIm5vZGVJZCIsInBlcmlvZGljaXR5IiwibnVtYmVyIiwiZ2V0IiwibWVzdXJlIiwiaW50ZXJ2ZW50aW9uIiwicmVhbE5vZGUiLCJnZXRSZWFsTm9kZSIsInB1c2giLCJpbmZvIiwicHRyTmFtZSIsImlkIiwiUHJvbWlzZSIsInJlc29sdmUiLCJhZGRfYXR0ciIsInRhc2tzIiwiUHRyIiwiTHN0IiwibG9hZCIsInZhbHVlIiwiZ2V0R3JvdXBWaXNpdHMiLCJ2aXNpdHlUeXBlIiwicmVzIiwiZ2VuZXJhdGVFdmVudCIsImJlZ2luRGF0ZSIsImVuZERhdGUiLCJldmVudHNEYXRhIiwiY3JlYXRlVmlzaXRDb250ZXh0IiwiZWwiLCJsaW5rR3JvdXBUb1Zpc3RDb250ZXh0IiwiZ2V0RXZlbnRTdGF0ZU5vZGUiLCJzdGF0ZU5vZGUiLCJmb3JFYWNoIiwiZXZlbnRJbmZvIiwiZXZlbnRzRGF0ZSIsIl9nZXREYXRlIiwicGVyaW9kTnVtYmVyIiwicGVyaW9kTWVzdXJlIiwiZGF0ZSIsImFkZEV2ZW50IiwiX2Zvcm1hdERhdGUiLCJEYXRlIiwiZ2V0VGltZSIsImNhdGNoIiwiZXJyIiwiY29uc29sZSIsImxvZyIsInZpc2l0VHlwZUNvbnRleHRJZCIsInN0YXRlSWQiLCJ2aXNpdEluZm8iLCJzdGF0ZSIsImV2ZW50IiwiRXZlbnRNb2RlbCIsImV2ZW50Tm9kZUlkIiwidmlzaXRJZCIsImFkZENoaWxkSW5Db250ZXh0IiwiZXZlbnRJZCIsIkVRVUlQTUVOVFNfVE9fRUxFTUVOVF9SRUxBVElPTiIsIm1hcCIsImNoaWxkIiwiVGFza01vZGVsIiwiZGJpZCIsImJpbUZpbGVJZCIsInRhc2tJZCIsImRiSWQiLCJ0YXNrTmFtZSIsImFsbCIsInZpc2l0IiwiZmluZCIsImNvbnRleHROYW1lIiwiY29udGV4dCIsImdldENvbnRleHQiLCJhZGRDb250ZXh0IiwiTW9kZWwiLCJjb250ZXh0Q3JlYXRlZCIsInJlamVjdCIsInZpc2l0Q29udGV4dElkIiwiaSIsImV2ZW50U2F0ZSIsIl9ldmVudFNhdGVJc1ZhbGlkIiwiY29udGV4dFR5cGUiLCJyZWxhdGlvbk5hbWUiLCJlbmQiLCJkaWZmIiwidG9EYXRlIiwiYWRkIiwiYXJnRGF0ZSIsImdldERhdGUiLCJnZXRNb250aCIsImdldEZ1bGxZZWFyIiwiZXZlbnRTdGF0ZSIsImtleSIsInVuZGVmaW5lZCIsImdldFZpc2l0R3JvdXBzIiwiY29udGV4dHMiLCJnZXRDb250ZXh0V2l0aFR5cGUiLCJjb250ZXh0SWQiLCJnZXRHcm91cEV2ZW50cyIsIlZJU0lUX1RZUEVTIiwiQXJyYXkiLCJpc0FycmF5IiwicHJvbWlzZXMiLCJ2YWx1ZXMiLCJwcm9tIiwiZXZlbnRUeXBlIiwiZXZlbnRzIiwiYWxsRXZlbnRzIiwidmFsIiwic3BpbmFsVmlzaXRTZXJ2aWNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7QUFLQTs7QUFJQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQTs7QUFNQTs7Ozs7Ozs7QUFFQSxNQUFNQSxrQkFBTixDQUF5QjtBQUN2QkMsZ0JBQWM7QUFDWixTQUFLQyxrQkFBTCxHQUEwQixnQkFBMUI7QUFDQSxTQUFLQyxZQUFMLEdBQW9CLGVBQXBCOztBQUVBLFNBQUtDLFVBQUwsR0FBa0IsT0FBbEI7O0FBRUEsU0FBS0MsaUJBQUwsR0FBeUIsbUJBQXpCO0FBQ0EsU0FBS0MsZ0JBQUwsR0FBd0Isa0JBQXhCO0FBQ0EsU0FBS0MsY0FBTCxHQUFzQixnQkFBdEI7QUFDQSxTQUFLQyxnQkFBTCxHQUF3QixrQkFBeEI7O0FBRUEsU0FBS0MsWUFBTCxHQUFvQkMsT0FBT0MsTUFBUCxDQUFjO0FBQ2hDQyxnQkFBVTtBQUNSQyxjQUFNLFNBREU7QUFFUkMsY0FBTTtBQUZFLE9BRHNCO0FBS2hDQyxrQkFBWTtBQUNWRixjQUFNLFNBREk7QUFFVkMsY0FBTTtBQUZJLE9BTG9CO0FBU2hDRSxZQUFNO0FBQ0pILGNBQU0sVUFERjtBQUVKQyxjQUFNO0FBRkY7QUFUMEIsS0FBZCxDQUFwQjs7QUFlQSxTQUFLRyxNQUFMLEdBQWNQLE9BQU9DLE1BQVAsQ0FBYyxDQUFDO0FBQ3pCRyxZQUFNLEtBQUtULGlCQURjO0FBRXpCUSxZQUFNO0FBRm1CLEtBQUQsRUFJMUI7QUFDRUMsWUFBTSxLQUFLUixnQkFEYjtBQUVFTyxZQUFNO0FBRlIsS0FKMEIsRUFRMUI7QUFDRUMsWUFBTSxLQUFLUCxjQURiO0FBRUVNLFlBQU07QUFGUixLQVIwQixFQVkxQjtBQUNFQyxZQUFNLEtBQUtOLGdCQURiO0FBRUVLLFlBQU07QUFGUixLQVowQixDQUFkLENBQWQ7O0FBa0JBLFNBQUtLLHNDQUFMLEdBQ0UsK0JBREY7O0FBR0EsU0FBS0MscUNBQUwsR0FDRSw4QkFERjs7QUFHQSxTQUFLQyxtQ0FBTCxHQUEyQyw0QkFBM0M7O0FBRUEsU0FBS0MscUNBQUwsR0FDRSw4QkFERjs7QUFHQSxTQUFLQyxhQUFMLEdBQXFCLFVBQXJCOztBQUVBLFNBQUtDLHVCQUFMLEdBQStCLGVBQS9COztBQUVBLFNBQUtDLDRCQUFMLEdBQW9DLGVBQXBDO0FBQ0EsU0FBS0MsNkJBQUwsR0FBcUMsVUFBckM7QUFDQSxTQUFLQyxzQkFBTCxHQUE4QixTQUE5QjtBQUNEOztBQUVEQyxpQkFBZTtBQUNiLFdBQU8sS0FBS1YsTUFBWjtBQUNEOztBQUVEVyxrQkFDRUMsT0FERixFQUVFQyxTQUZGLEVBR0VDLGlCQUhGLEVBSUVDLGlCQUpGLEVBS0VDLFNBTEYsRUFNRUMsa0JBTkYsRUFPRUMsa0JBUEYsRUFRRUMsV0FSRixFQVNFO0FBQ0EsV0FBT0MsZ0RBQW1CQyxXQUFuQixDQUErQlQsT0FBL0IsRUFBd0MsQ0FBQyxLQUFLUCxhQUFOLENBQXhDLEVBQThEaUIsSUFBOUQsQ0FDTEMsWUFBWTtBQUNWLFVBQUlDLFNBQUo7QUFDQSxVQUFJRCxTQUFTRSxNQUFULEtBQW9CLENBQXhCLEVBQTJCO0FBQ3pCRCxvQkFBWUosZ0RBQW1CTSxVQUFuQixDQUE4QjtBQUN4QzlCLGdCQUFNO0FBRGtDLFNBQTlCLENBQVo7O0FBSUF3Qix3REFBbUJPLFFBQW5CLENBQ0VmLE9BREYsRUFFRVksU0FGRixFQUdFLEtBQUtuQixhQUhQLEVBSUV1Qix5REFKRjtBQU1EOztBQUVELFVBQUlDLE9BQ0YsT0FBT0wsU0FBUCxLQUFxQixXQUFyQixHQUNBSixnREFBbUJVLE9BQW5CLENBQTJCTixTQUEzQixDQURBLEdBRUFELFNBQVMsQ0FBVCxDQUhGOztBQUtBLGFBQU8sS0FBS1EsV0FBTCxDQUFpQkYsSUFBakIsRUFBdUJiLFNBQXZCLEVBQWtDTSxJQUFsQyxDQUF1Q1UsT0FBTztBQUNuRCxZQUFJQyxPQUFPLElBQUlDLG9CQUFKLENBQ1RyQixTQURTLEVBRVRDLGlCQUZTLEVBR1RDLGlCQUhTLEVBSVRDLFNBSlMsRUFLVEMsa0JBTFMsRUFNVEMsa0JBTlMsRUFPVEMsV0FQUyxDQUFYOztBQVVBLFlBQUlnQixTQUFTZixnREFBbUJNLFVBQW5CLENBQThCO0FBQ3ZDZCxtQkFBU0EsT0FEOEI7QUFFdkNoQixnQkFBTWlCLFNBRmlDO0FBR3ZDdUIsdUJBQWE7QUFDWEMsb0JBQVFKLEtBQUtHLFdBQUwsQ0FBaUJDLE1BQWpCLENBQXdCQyxHQUF4QixFQURHO0FBRVhDLG9CQUFRTixLQUFLRyxXQUFMLENBQWlCRyxNQUFqQixDQUF3QkQsR0FBeEI7QUFGRyxXQUgwQjtBQU92Q0Usd0JBQWM7QUFDWkgsb0JBQVFKLEtBQUtPLFlBQUwsQ0FBa0JILE1BQWxCLENBQXlCQyxHQUF6QixFQURJO0FBRVpDLG9CQUFRTixLQUFLTyxZQUFMLENBQWtCRCxNQUFsQixDQUF5QkQsR0FBekI7QUFGSSxXQVB5QjtBQVd2Q3RCLHFCQUFXQSxTQVg0QjtBQVl2Q0csdUJBQWFBO0FBWjBCLFNBQTlCLEVBY1hjLElBZFcsQ0FBYjs7QUFpQkEsWUFBSVEsV0FBV3JCLGdEQUFtQnNCLFdBQW5CLENBQStCUCxNQUEvQixDQUFmOztBQUVBSCxZQUFJVyxJQUFKLENBQVNGLFFBQVQ7O0FBRUEsZUFBT0EsU0FBU0csSUFBaEI7QUFDRCxPQWpDTSxDQUFQO0FBa0NELEtBdkRJLENBQVA7QUF5REQ7O0FBRURiLGNBQVlGLElBQVosRUFBa0JnQixPQUFsQixFQUEyQjtBQUN6QixRQUFJSixXQUFXckIsZ0RBQW1Cc0IsV0FBbkIsQ0FBK0JiLEtBQUtpQixFQUFMLENBQVFSLEdBQVIsRUFBL0IsQ0FBZjs7QUFFQSxXQUFPLElBQUlTLE9BQUosQ0FBWUMsV0FBVztBQUM1QixVQUFJLENBQUNQLFNBQVNHLElBQVQsQ0FBY0MsT0FBZCxDQUFMLEVBQTZCO0FBQzNCSixpQkFBU0csSUFBVCxDQUFjSyxRQUFkLENBQXVCSixPQUF2QixFQUFnQztBQUM5QkssaUJBQU8sSUFBSUMsK0JBQUosQ0FBUSxJQUFJQywrQkFBSixFQUFSO0FBRHVCLFNBQWhDO0FBR0Q7O0FBRURYLGVBQVNHLElBQVQsQ0FBY0MsT0FBZCxFQUF1QkssS0FBdkIsQ0FBNkJHLElBQTdCLENBQWtDQyxTQUFTO0FBQ3pDLGVBQU9OLFFBQVFNLEtBQVIsQ0FBUDtBQUNELE9BRkQ7QUFHRCxLQVZNLENBQVA7QUFXRDs7QUFFREMsaUJBQWUzQyxPQUFmLEVBQXdCNEMsVUFBeEIsRUFBb0M7QUFDbEMsV0FBT3BDLGdEQUFtQkMsV0FBbkIsQ0FBK0JULE9BQS9CLEVBQXdDLENBQUMsS0FBS1AsYUFBTixDQUF4QyxFQUE4RGlCLElBQTlELENBQ0xtQyxPQUFPO0FBQ0wsVUFBSXRCLE1BQUo7QUFDQSxVQUFJc0IsSUFBSWhDLE1BQUosS0FBZSxDQUFuQixFQUFzQjtBQUNwQlUsaUJBQVNmLGdEQUFtQk0sVUFBbkIsQ0FBOEI7QUFDckM5QixnQkFBTTtBQUQrQixTQUE5QixDQUFUOztBQUlBd0Isd0RBQW1CTyxRQUFuQixDQUNFZixPQURGLEVBRUV1QixNQUZGLEVBR0UsS0FBSzlCLGFBSFAsRUFJRXVCLHlEQUpGO0FBTUQ7O0FBRUQsVUFBSUMsT0FDRixPQUFPTSxNQUFQLEtBQWtCLFdBQWxCLEdBQ0FmLGdEQUFtQlUsT0FBbkIsQ0FBMkJLLE1BQTNCLENBREEsR0FFQXNCLElBQUksQ0FBSixDQUhGOztBQUtBLGFBQU8sS0FBSzFCLFdBQUwsQ0FBaUJGLElBQWpCLEVBQXVCMkIsVUFBdkIsQ0FBUDtBQUNELEtBdEJJLENBQVA7QUF3QkQ7O0FBRURFLGdCQUFjMUMsU0FBZCxFQUF5QkosT0FBekIsRUFBa0MrQyxTQUFsQyxFQUE2Q0MsT0FBN0MsRUFBc0RDLFVBQXRELEVBQWtFO0FBQ2hFLFdBQU8sS0FBS0Msa0JBQUwsQ0FBd0I5QyxTQUF4QixFQUNKTSxJQURJLENBQ0N5QyxNQUFNO0FBQ1YsYUFBTyxLQUFLQyxzQkFBTCxDQUE0QkQsR0FBR2pCLEVBQUgsQ0FBTVIsR0FBTixFQUE1QixFQUF5QzFCLE9BQXpDLEVBQWtEVSxJQUFsRCxDQUNMbUMsT0FBTztBQUNMLFlBQUlBLEdBQUosRUFBUztBQUNQLGVBQUtRLGlCQUFMLENBQ0VGLEdBQUdqQixFQUFILENBQU1SLEdBQU4sRUFERixFQUVFMUIsT0FGRixFQUdFLEtBQUtwQixZQUFMLENBQWtCRyxRQUFsQixDQUEyQkUsSUFIN0IsRUFJRXlCLElBSkYsQ0FJTzRDLGFBQWE7QUFDbEIsZ0JBQUlwQixLQUFLb0IsVUFBVXBCLEVBQVYsQ0FBYVIsR0FBYixFQUFUOztBQUVBdUIsdUJBQVdNLE9BQVgsQ0FBbUJDLGFBQWE7QUFDOUIsa0JBQUlDLGFBQWEsS0FBS0MsUUFBTCxDQUNmWCxTQURlLEVBRWZDLE9BRmUsRUFHZlEsVUFBVUcsWUFISyxFQUlmSCxVQUFVSSxZQUpLLENBQWpCOztBQU9BSCx5QkFBV0YsT0FBWCxDQUFtQk0sUUFBUTtBQUN6QixxQkFBS0MsUUFBTCxDQUNFWCxHQUFHakIsRUFBSCxDQUFNUixHQUFOLEVBREYsRUFFRTFCLE9BRkYsRUFHRWtDLEVBSEYsRUFJRXNCLFNBSkYsRUFLRyxHQUFFQSxVQUFVeEUsSUFBSyxJQUFHLEtBQUsrRSxXQUFMLENBQWlCRixJQUFqQixDQUF1QixFQUw5QyxFQU1FLElBQUlHLElBQUosQ0FBU0gsSUFBVCxFQUFlSSxPQUFmLEVBTkY7QUFRRCxlQVREO0FBVUQsYUFsQkQ7QUFtQkQsV0ExQkQ7QUEyQkQ7QUFDRixPQS9CSSxDQUFQO0FBZ0NELEtBbENJLEVBbUNKQyxLQW5DSSxDQW1DRUMsT0FBTztBQUNaQyxjQUFRQyxHQUFSLENBQVlGLEdBQVo7QUFDQSxhQUFPaEMsUUFBUUMsT0FBUixDQUFnQitCLEdBQWhCLENBQVA7QUFDRCxLQXRDSSxDQUFQO0FBdUNEOztBQUVETCxXQUFTUSxrQkFBVCxFQUE2QnRFLE9BQTdCLEVBQXNDdUUsT0FBdEMsRUFBK0NDLFNBQS9DLEVBQTBEeEYsSUFBMUQsRUFBZ0U2RSxJQUFoRSxFQUFzRTtBQUNwRSxRQUFJWSxRQUFRakUsZ0RBQW1CVSxPQUFuQixDQUEyQnFELE9BQTNCLEVBQW9DRSxLQUFwQyxDQUEwQy9DLEdBQTFDLEVBQVo7O0FBRUEsUUFBSWdELFFBQVEsSUFBSUMsb0JBQUosQ0FBZTNGLElBQWYsRUFBcUI2RSxJQUFyQixFQUEyQlksS0FBM0IsRUFBa0N6RSxPQUFsQyxDQUFaOztBQUVBLFFBQUk0RSxjQUFjcEUsZ0RBQW1CTSxVQUFuQixDQUE4QjtBQUM1QzlCLFlBQU1BLElBRHNDO0FBRTVDNkUsWUFBTUEsSUFGc0M7QUFHNUNZLGFBQU9BLEtBSHFDO0FBSTVDekUsZUFBU0EsT0FKbUM7QUFLNUM2RSxlQUFTTCxVQUFVdEM7QUFMeUIsS0FBOUIsRUFPaEJ3QyxLQVBnQixDQUFsQjs7QUFVQSxXQUFPbEUsZ0RBQW1Cc0UsaUJBQW5CLENBQ0hQLE9BREcsRUFFSEssV0FGRyxFQUdITixrQkFIRyxFQUlILEtBQUsxRSw2QkFKRixFQUtIb0IseURBTEcsRUFPSk4sSUFQSSxDQU9DeUMsTUFBTTtBQUNWLFVBQUlBLEVBQUosRUFBUSxPQUFPeUIsV0FBUDtBQUNULEtBVEksRUFVSmxFLElBVkksQ0FVQ3FFLFdBQVc7QUFDZixVQUFJLE9BQU9BLE9BQVAsS0FBbUIsV0FBdkIsRUFBb0M7QUFDbEMsZUFBT3ZFLGdEQUFtQkMsV0FBbkIsQ0FBK0JULE9BQS9CLEVBQXdDLENBQzdDZ0YsdUNBRDZDLENBQXhDLEVBRUp0RSxJQUZJLENBRUNDLFlBQVk7QUFDbEJBLG1CQUFTc0UsR0FBVCxDQUFhQyxTQUFTO0FBQ3BCLGdCQUFJbEcsT0FBUSxHQUFFd0YsVUFBVXhGLElBQUssS0FBSWtHLE1BQU1sRyxJQUFOLENBQVcwQyxHQUFYLEVBQWlCLEVBQWxEO0FBQ0EsZ0JBQUlMLE9BQU8sSUFBSThELG1CQUFKLENBQ1RuRyxJQURTLEVBRVRrRyxNQUFNRSxJQUFOLENBQVcxRCxHQUFYLEVBRlMsRUFHVHdELE1BQU1HLFNBQU4sQ0FBZ0IzRCxHQUFoQixFQUhTLEVBSVQ4QyxVQUFVeEYsSUFKRCxFQUtULENBTFMsQ0FBWDs7QUFRQSxnQkFBSXNHLFNBQVM5RSxnREFBbUJNLFVBQW5CLENBQThCO0FBQ3ZDOUIsb0JBQU1BLElBRGlDO0FBRXZDdUcsb0JBQU1MLE1BQU1FLElBQU4sQ0FBVzFELEdBQVgsRUFGaUM7QUFHdkMyRCx5QkFBV0gsTUFBTUcsU0FBTixDQUFnQjNELEdBQWhCLEVBSDRCO0FBSXZDOEQsd0JBQVVoQixVQUFVeEYsSUFKbUI7QUFLdkM2Rix1QkFBU0wsVUFBVXRDLEVBTG9CO0FBTXZDdUMscUJBQU9wRCxLQUFLb0QsS0FBTCxDQUFXL0MsR0FBWDtBQU5nQyxhQUE5QixFQVFYTCxJQVJXLENBQWI7O0FBV0EsbUJBQU9jLFFBQVFzRCxHQUFSLENBQVksQ0FDakJqRixnREFBbUJzRSxpQkFBbkIsQ0FDRUMsT0FERixFQUVFTyxNQUZGLEVBR0VoQixrQkFIRixFQUlFLEtBQUt6RSxzQkFKUCxFQUtFbUIseURBTEYsQ0FEaUIsRUFRakJSLGdEQUFtQk8sUUFBbkIsQ0FDRXlELFVBQVV0QyxFQURaLEVBRUU2QyxPQUZGLEVBR0UsS0FBS3JGLHVCQUhQLEVBSUVzQix5REFKRixDQVJpQixDQUFaLENBQVA7QUFlRCxXQXBDRDtBQXFDRCxTQXhDTSxDQUFQO0FBeUNEO0FBQ0YsS0F0REksQ0FBUDtBQXVERDs7QUFFRGtDLHFCQUFtQjlDLFNBQW5CLEVBQThCO0FBQzVCLFFBQUlzRixRQUFRLEtBQUt0RyxNQUFMLENBQVl1RyxJQUFaLENBQWlCeEMsTUFBTTtBQUNqQyxhQUFPQSxHQUFHbEUsSUFBSCxLQUFZbUIsU0FBbkI7QUFDRCxLQUZXLENBQVo7O0FBSUEsUUFBSSxPQUFPc0YsS0FBUCxLQUFpQixXQUFyQixFQUFrQztBQUNoQyxZQUFNRSxjQUFlLEdBQUVGLE1BQU0xRyxJQUFLLEVBQWxDOztBQUVBLFVBQUk2RyxVQUFVckYsZ0RBQW1Cc0YsVUFBbkIsQ0FBOEJGLFdBQTlCLENBQWQ7QUFDQSxVQUFJLE9BQU9DLE9BQVAsS0FBbUIsV0FBdkIsRUFBb0MsT0FBTzFELFFBQVFDLE9BQVIsQ0FBZ0J5RCxRQUN4RDdELElBRHdDLENBQVA7O0FBR3BDLGFBQU94QixnREFBbUJ1RixVQUFuQixDQUNMSCxXQURLLEVBRUx4RixTQUZLLEVBR0wsSUFBSTRGLGlDQUFKLENBQVU7QUFDUmhILGNBQU0sS0FBS1g7QUFESCxPQUFWLENBSEssRUFNTHFDLElBTkssQ0FNQXVGLGtCQUFrQjtBQUN2QixlQUFPQSxlQUFlakUsSUFBdEI7QUFDRCxPQVJNLENBQVA7QUFTRCxLQWhCRCxNQWdCTztBQUNMLGFBQU9HLFFBQVErRCxNQUFSLENBQWUsZUFBZixDQUFQO0FBQ0Q7QUFDRjs7QUFFRDlDLHlCQUF1QitDLGNBQXZCLEVBQXVDbkcsT0FBdkMsRUFBZ0Q7QUFBQTs7QUFDOUMsV0FBT1EsZ0RBQW1CQyxXQUFuQixDQUErQjBGLGNBQS9CLEVBQStDLENBQ2xELEtBQUt4Ryw0QkFENkMsQ0FBL0MsRUFHSmUsSUFISSxDQUdDQyxZQUFZO0FBQ2hCLFdBQUssSUFBSXlGLElBQUksQ0FBYixFQUFnQkEsSUFBSXpGLFNBQVNFLE1BQTdCLEVBQXFDdUYsR0FBckMsRUFBMEM7QUFDeEMsY0FBTWxCLFFBQVF2RSxTQUFTeUYsQ0FBVCxFQUFZbEUsRUFBWixDQUFlUixHQUFmLEVBQWQ7QUFDQSxZQUFJd0QsVUFBVWxGLE9BQWQsRUFBdUIsT0FBTyxJQUFQO0FBQ3hCO0FBQ0YsS0FSSSxFQVNKVSxJQVRJLENBU0N5QyxNQUFNO0FBQ1YsVUFBSSxPQUFPQSxFQUFQLEtBQWMsV0FBbEIsRUFBK0I7QUFDN0IsZUFBTzNDLGdEQUFtQnNFLGlCQUFuQixDQUNMcUIsY0FESyxFQUVMbkcsT0FGSyxFQUdMbUcsY0FISyxFQUlMLEtBQUt4Ryw0QkFKQSxFQUtMcUIseURBTEssRUFNTE4sSUFOSztBQUFBLHVDQU1BLFdBQU1tQyxHQUFOLEVBQWE7QUFDbEIsZ0JBQUlBLEdBQUosRUFBUztBQUNQLG9CQUFNLE1BQUtRLGlCQUFMLENBQ0o4QyxjQURJLEVBRUpuRyxPQUZJLEVBR0osTUFBS3BCLFlBQUwsQ0FBa0JNLFVBQWxCLENBQTZCRCxJQUh6QixDQUFOO0FBS0Esb0JBQU0sTUFBS29FLGlCQUFMLENBQ0o4QyxjQURJLEVBRUpuRyxPQUZJLEVBR0osTUFBS3BCLFlBQUwsQ0FBa0JPLElBQWxCLENBQXVCRixJQUhuQixDQUFOO0FBS0Q7O0FBRUQsbUJBQU80RCxHQUFQO0FBQ0QsV0FyQk07O0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFBUDtBQXNCRCxPQXZCRCxNQXVCTztBQUNMLGVBQU9NLEVBQVA7QUFDRDtBQUNGLEtBcENJLENBQVA7QUFxQ0Q7O0FBRURFLG9CQUFrQjhDLGNBQWxCLEVBQWtDbkcsT0FBbEMsRUFBMkNxRyxTQUEzQyxFQUFzRDtBQUNwRCxRQUFJM0IsUUFBUSxLQUFLNEIsaUJBQUwsQ0FBdUJELFNBQXZCLENBQVo7O0FBRUEsUUFBSSxPQUFPM0IsS0FBUCxLQUFpQixXQUFyQixFQUFrQzs7QUFFbEMsUUFBSTZCLGNBQWMvRixnREFBbUJVLE9BQW5CLENBQTJCaUYsY0FBM0IsRUFBMkNsSCxJQUEzQyxDQUFnRHlDLEdBQWhELEVBQWxCO0FBQ0EsUUFBSThFLFlBQUo7O0FBRUEsWUFBUUQsV0FBUjtBQUNFLFdBQUssS0FBSy9ILGlCQUFWO0FBQ0VnSSx1QkFBZSxLQUFLbkgsc0NBQXBCO0FBQ0E7QUFDRixXQUFLLEtBQUtYLGNBQVY7QUFDRThILHVCQUFlLEtBQUtqSCxtQ0FBcEI7QUFDQTtBQUNGLFdBQUssS0FBS1osZ0JBQVY7QUFDRTZILHVCQUFlLEtBQUtoSCxxQ0FBcEI7QUFDQTtBQUNGLFdBQUssS0FBS2YsZ0JBQVY7QUFDRStILHVCQUFlLEtBQUtsSCxxQ0FBcEI7QUFDQTtBQVpKOztBQWVBLFdBQU9rQixnREFBbUJDLFdBQW5CLENBQStCVCxPQUEvQixFQUF3QyxDQUFDd0csWUFBRCxDQUF4QyxFQUNKOUYsSUFESSxDQUNDQyxZQUFZO0FBQ2hCLFdBQUssSUFBSXlGLElBQUksQ0FBYixFQUFnQkEsSUFBSXpGLFNBQVNFLE1BQTdCLEVBQXFDdUYsR0FBckMsRUFBMEM7QUFDeEMsY0FBTXBILE9BQU8yQixTQUFTeUYsQ0FBVCxFQUFZcEgsSUFBWixDQUFpQjBDLEdBQWpCLEVBQWI7QUFDQSxjQUFNekMsT0FBTzBCLFNBQVN5RixDQUFULEVBQVkzQixLQUFaLENBQWtCL0MsR0FBbEIsRUFBYjs7QUFFQSxZQUFJMUMsU0FBU3FILFNBQVQsSUFBc0JwSCxTQUFTb0gsU0FBbkMsRUFBOEM7QUFDNUMsaUJBQU8xRixTQUFTeUYsQ0FBVCxDQUFQO0FBQ0Q7QUFDRjtBQUNGLEtBVkksRUFXSjFGLElBWEksQ0FXQ3lDLE1BQU07QUFDVixVQUFJLE9BQU9BLEVBQVAsS0FBYyxXQUFsQixFQUErQjtBQUM3QixZQUFJdkMsWUFBWUosZ0RBQW1CTSxVQUFuQixDQUE4QjtBQUM1QzlCLGdCQUFNMEYsTUFBTTFGLElBRGdDO0FBRTVDeUYsaUJBQU9DLE1BQU16RixJQUYrQjtBQUc1Q2UsbUJBQVNBLE9BSG1DO0FBSTVDZixnQkFBTTtBQUpzQyxTQUE5QixDQUFoQjs7QUFPQSxlQUFPdUIsZ0RBQW1Cc0UsaUJBQW5CLENBQ0w5RSxPQURLLEVBRUxZLFNBRkssRUFHTHVGLGNBSEssRUFJTEssWUFKSyxFQUtMeEYseURBTEssRUFNTE4sSUFOSyxDQU1BbUMsT0FBTztBQUNaLGNBQUlBLEdBQUosRUFBUyxPQUFPckMsZ0RBQW1CVSxPQUFuQixDQUEyQk4sU0FBM0IsQ0FBUDtBQUNWLFNBUk0sQ0FBUDtBQVNELE9BakJELE1BaUJPO0FBQ0wsZUFBT3VDLEVBQVA7QUFDRDtBQUNGLEtBaENJLENBQVA7QUFpQ0Q7O0FBRUQ7QUFDQTtBQUNBOztBQUVBTyxXQUFTWCxTQUFULEVBQW9CQyxPQUFwQixFQUE2QlcsWUFBN0IsRUFBMkNDLFlBQTNDLEVBQXlEO0FBQ3ZELFFBQUlqQyxTQUFTLENBQUMsTUFBRCxFQUFTLE9BQVQsRUFBa0IsUUFBbEIsRUFBNEIsT0FBNUIsRUFBcUNpQyxZQUFyQyxDQUFiOztBQUVBLFFBQUlILGFBQWEsRUFBakI7O0FBRUEsUUFBSUksT0FBTyxzQkFBT2QsU0FBUCxDQUFYO0FBQ0EsUUFBSTBELE1BQU0sc0JBQU96RCxPQUFQLENBQVY7O0FBRUEsV0FBT3lELElBQUlDLElBQUosQ0FBUzdDLElBQVQsS0FBa0IsQ0FBekIsRUFBNEI7QUFDMUJKLGlCQUFXMUIsSUFBWCxDQUFnQjhCLEtBQUs4QyxNQUFMLEVBQWhCOztBQUVBOUMsYUFBT0EsS0FBSytDLEdBQUwsQ0FBU2pELFlBQVQsRUFBdUJoQyxNQUF2QixDQUFQO0FBQ0Q7O0FBRUQsV0FBTzhCLFVBQVA7QUFDRDs7QUFFRE0sY0FBWThDLE9BQVosRUFBcUI7QUFDbkIsUUFBSWhELE9BQU8sSUFBSUcsSUFBSixDQUFTNkMsT0FBVCxDQUFYOztBQUVBLFdBQVEsR0FBRWhELEtBQUtpRCxPQUFMLEVBQWUsSUFBR2pELEtBQUtrRCxRQUFMLEtBQWtCLENBQUUsSUFBR2xELEtBQUttRCxXQUFMLEVBQW1CLEVBQXRFO0FBQ0Q7O0FBRURWLG9CQUFrQlcsVUFBbEIsRUFBOEI7QUFDNUIsU0FBSyxNQUFNQyxHQUFYLElBQWtCLEtBQUt0SSxZQUF2QixFQUFxQztBQUNuQyxVQUNFLEtBQUtBLFlBQUwsQ0FBa0JzSSxHQUFsQixFQUF1QmxJLElBQXZCLEtBQWdDaUksVUFBaEMsSUFDQSxLQUFLckksWUFBTCxDQUFrQnNJLEdBQWxCLEVBQXVCakksSUFBdkIsS0FBZ0NnSSxVQUZsQyxFQUdFO0FBQ0EsZUFBTyxLQUFLckksWUFBTCxDQUFrQnNJLEdBQWxCLENBQVA7QUFDRDtBQUNGOztBQUVELFdBQU9DLFNBQVA7QUFDRDs7QUFFRDtBQUNBO0FBQ0E7O0FBRUFDLGlCQUFlaEgsU0FBZixFQUEwQjtBQUN4QixRQUFJaUgsV0FBVzdHLGdEQUFtQjhHLGtCQUFuQixDQUFzQ2xILFNBQXRDLENBQWY7QUFDQSxRQUFJaUgsU0FBU3hHLE1BQVQsS0FBb0IsQ0FBeEIsRUFBMkIsT0FBTyxFQUFQOztBQUUzQixRQUFJMEcsWUFBWUYsU0FBUyxDQUFULEVBQVlyRixJQUFaLENBQWlCRSxFQUFqQixDQUFvQlIsR0FBcEIsRUFBaEI7O0FBRUEsV0FBT2xCLGdEQUFtQkMsV0FBbkIsQ0FDTDhHLFNBREssRUFFTCxLQUFLNUgsNEJBRkEsRUFHTGUsSUFISyxDQUdBbUMsT0FBTztBQUNaLGFBQU9BLElBQUlvQyxHQUFKLENBQVE5QixNQUFNQSxHQUFHekIsR0FBSCxFQUFkLENBQVA7QUFDRCxLQUxNLENBQVA7QUFNRDs7QUFFRDhGLGlCQUNFeEgsT0FERixFQUVFeUgsY0FBYyxDQUNaLEtBQUtqSixpQkFETyxFQUVaLEtBQUtDLGdCQUZPLEVBR1osS0FBS0MsY0FITyxFQUlaLEtBQUtDLGdCQUpPLENBRmhCLEVBUUU7QUFBQTs7QUFDQSxRQUFJLENBQUMrSSxNQUFNQyxPQUFOLENBQWNGLFdBQWQsQ0FBTCxFQUFpQ0EsY0FBYyxDQUFDQSxXQUFELENBQWQ7O0FBRWpDLFdBQU9BLFlBQVl4QyxHQUFaLENBQWdCN0UsYUFBYTtBQUNsQyxVQUFJc0YsUUFBUSxLQUFLdEcsTUFBTCxDQUFZdUcsSUFBWixDQUFpQnhDLE1BQU07QUFDakMsZUFBT0EsR0FBR2xFLElBQUgsS0FBWW1CLFNBQW5CO0FBQ0QsT0FGVyxDQUFaOztBQUlBLFVBQUl5RixVQUFVckYsZ0RBQW1Cc0YsVUFBbkIsQ0FBOEJKLE1BQU0xRyxJQUFwQyxDQUFkOztBQUVBLFVBQUksT0FBTzZHLE9BQVAsS0FBbUIsV0FBdkIsRUFBb0M7QUFDbEMsWUFBSTBCLFlBQVkxQixRQUFRN0QsSUFBUixDQUFhRSxFQUFiLENBQWdCUixHQUFoQixFQUFoQjtBQUNBLFlBQUlrRyxXQUFXLEVBQWY7O0FBRUEsYUFBSyxNQUFNVixHQUFYLElBQWtCLEtBQUt0SSxZQUF2QixFQUFxQztBQUNuQ2dKLG1CQUFTN0YsSUFBVCxDQUNFLEtBQUtzQixpQkFBTCxDQUNFa0UsU0FERixFQUVFdkgsT0FGRixFQUdFLEtBQUtwQixZQUFMLENBQWtCc0ksR0FBbEIsRUFBdUJqSSxJQUh6QixDQURGO0FBT0Q7O0FBRUQsZUFBT2tELFFBQVFzRCxHQUFSLENBQVltQyxRQUFaLEVBQXNCbEgsSUFBdEIsQ0FBMkJtSCxVQUFVO0FBQzFDLGNBQUlDLE9BQU9ELE9BQU81QyxHQUFQO0FBQUEsMENBQVcsV0FBTThDLFNBQU4sRUFBbUI7QUFDdkMsa0JBQUlsRixNQUFNa0YsVUFBVXJHLEdBQVYsRUFBVjs7QUFFQW1CLGtCQUFJLFlBQUosSUFBb0J6QyxTQUFwQjs7QUFFQSxrQkFBSTRILFNBQVMsTUFBTXhILGdEQUFtQkMsV0FBbkIsQ0FDakJvQyxJQUFJWCxFQURhLEVBQ1QsQ0FDTixPQUFLdEMsNkJBREMsQ0FEUyxDQUFuQjs7QUFLQWlELGtCQUFJLFFBQUosSUFBZ0JtRixPQUFPL0MsR0FBUCxDQUFXLGNBQU07QUFDL0IsdUJBQU85QixHQUFHekIsR0FBSCxFQUFQO0FBQ0QsZUFGZSxDQUFoQjs7QUFJQSxxQkFBT21CLEdBQVA7QUFDRCxhQWZVOztBQUFBO0FBQUE7QUFBQTtBQUFBLGVBQVg7O0FBaUJBLGlCQUFPVixRQUFRc0QsR0FBUixDQUFZcUMsSUFBWixFQUFrQnBILElBQWxCLENBQXVCdUgsYUFBYTtBQUN6QyxnQkFBSUosU0FBUyxFQUFiOztBQUVBSSxzQkFBVTFFLE9BQVYsQ0FBa0IyRSxPQUFPO0FBQ3ZCTCxxQkFBT0ssSUFBSXpELEtBQVgsSUFBb0J5RCxJQUFJRixNQUF4QjtBQUNELGFBRkQ7O0FBSUEsbUJBQU87QUFDTCxlQUFDNUgsU0FBRCxHQUFheUg7QUFEUixhQUFQO0FBR0QsV0FWTSxDQUFQO0FBV0QsU0E3Qk0sQ0FBUDtBQThCRDtBQUNGLEtBcERNLENBQVA7QUFxREQ7QUE3aEJzQjs7QUFnaUJ6QixJQUFJTSxxQkFBcUIsSUFBSWhLLGtCQUFKLEVBQXpCOztrQkFFZWdLLGtCIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRSxcbiAgU3BpbmFsR3JhcGhTZXJ2aWNlXG59IGZyb20gXCJzcGluYWwtZW52LXZpZXdlci1ncmFwaC1zZXJ2aWNlXCI7XG5cbmltcG9ydCB7XG4gIEVRVUlQTUVOVFNfVE9fRUxFTUVOVF9SRUxBVElPTlxufSBmcm9tIFwic3BpbmFsLWVudi12aWV3ZXItcm9vbS1tYW5hZ2VyL2pzL3NlcnZpY2VcIjtcblxuaW1wb3J0IFZpc2l0TW9kZWwgZnJvbSBcIi4vbW9kZWxzL3Zpc2l0Lm1vZGVsLmpzXCI7XG5pbXBvcnQgRXZlbnRNb2RlbCBmcm9tIFwiLi9tb2RlbHMvZXZlbnQubW9kZWwuanNcIjtcbmltcG9ydCBUYXNrTW9kZWwgZnJvbSBcIi4vbW9kZWxzL3Rhc2subW9kZWwuanNcIjtcblxuaW1wb3J0IHtcbiAgUHRyLFxuICBMc3QsXG4gIE1vZGVsXG59IGZyb20gXCJzcGluYWwtY29yZS1jb25uZWN0b3Jqc190eXBlXCI7XG5cbmltcG9ydCBtb21lbnQgZnJvbSBcIm1vbWVudFwiO1xuXG5jbGFzcyBTcGluYWxWaXNpdFNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLlZJU0lUX0NPTlRFWFRfTkFNRSA9IFwiLnZpc2l0X2NvbnRleHRcIjtcbiAgICB0aGlzLkNPTlRFWFRfVFlQRSA9IFwidmlzaXRfY29udGV4dFwiO1xuXG4gICAgdGhpcy5WSVNJVF9UWVBFID0gXCJ2aXNpdFwiO1xuXG4gICAgdGhpcy5NQUlOVEVOQU5DRV9WSVNJVCA9IFwiTUFJTlRFTkFOQ0VfVklTSVRcIjtcbiAgICB0aGlzLlJFR1VMQVRPUllfVklTSVQgPSBcIlJFR1VMQVRPUllfVklTSVRcIjtcbiAgICB0aGlzLlNFQ1VSSVRZX1ZJU0lUID0gXCJTRUNVUklUWV9WSVNJVFwiO1xuICAgIHRoaXMuRElBR05PU1RJQ19WSVNJVCA9IFwiRElBR05PU1RJQ19WSVNJVFwiO1xuXG4gICAgdGhpcy5FVkVOVF9TVEFURVMgPSBPYmplY3QuZnJlZXplKHtcbiAgICAgIGRlY2xhcmVkOiB7XG4gICAgICAgIG5hbWU6IFwiZMOpY2xhcsOpXCIsXG4gICAgICAgIHR5cGU6IFwiZGVjbGFyZWRcIlxuICAgICAgfSxcbiAgICAgIHByb2Nlc3Npbmc6IHtcbiAgICAgICAgbmFtZTogXCJlbmNvdXJzXCIsXG4gICAgICAgIHR5cGU6IFwicHJvY2Vzc2luZ1wiXG4gICAgICB9LFxuICAgICAgZG9uZToge1xuICAgICAgICBuYW1lOiBcIsOpZmZlY3R1w6lcIixcbiAgICAgICAgdHlwZTogXCJkb25lXCJcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuVklTSVRTID0gT2JqZWN0LmZyZWV6ZShbe1xuICAgICAgICB0eXBlOiB0aGlzLk1BSU5URU5BTkNFX1ZJU0lULFxuICAgICAgICBuYW1lOiBcIk1haW50ZW5hbmNlIHZpc2l0XCJcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6IHRoaXMuUkVHVUxBVE9SWV9WSVNJVCxcbiAgICAgICAgbmFtZTogXCJSZWd1bGF0b3J5IHZpc2l0XCJcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6IHRoaXMuU0VDVVJJVFlfVklTSVQsXG4gICAgICAgIG5hbWU6IFwiU2VjdXJpdHkgVmlzaXRcIlxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogdGhpcy5ESUFHTk9TVElDX1ZJU0lULFxuICAgICAgICBuYW1lOiBcIkRpYWdub3N0aWMgdmlzaXRcIlxuICAgICAgfVxuICAgIF0pO1xuXG4gICAgdGhpcy5NQUlOVEVOQU5DRV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiA9XG4gICAgICBcIm1haW50ZW5hbmNlVmlzaXRoYXNFdmVudFN0YXRlXCI7XG5cbiAgICB0aGlzLlJFR1VMQVRPUllfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04gPVxuICAgICAgXCJyZWd1bGF0b3J5VmlzaXRoYXNFdmVudFN0YXRlXCI7XG5cbiAgICB0aGlzLlNFQ1VSSVRZX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OID0gXCJzZWN1cml0eVZpc2l0aGFzRXZlbnRTdGF0ZVwiO1xuXG4gICAgdGhpcy5ESUFHTk9TVElDX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OID1cbiAgICAgIFwiZGlhZ25vc3RpY1Zpc2l0aGFzRXZlbnRTdGF0ZVwiO1xuXG4gICAgdGhpcy5HUk9VUF9UT19UQVNLID0gXCJoYXNWaXNpdFwiO1xuXG4gICAgdGhpcy5WSVNJVF9UT19FVkVOVF9SRUxBVElPTiA9IFwidmlzaXRIYXNFdmVudFwiO1xuXG4gICAgdGhpcy5WSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OID0gXCJ2aXNpdEhhc0dyb3VwXCI7XG4gICAgdGhpcy5FVkVOVF9TVEFURV9UT19FVkVOVF9SRUxBVElPTiA9IFwiaGFzRXZlbnRcIjtcbiAgICB0aGlzLkVWRU5UX1RPX1RBU0tfUkVMQVRJT04gPSBcImhhc1Rhc2tcIjtcbiAgfVxuXG4gIGdldEFsbFZpc2l0cygpIHtcbiAgICByZXR1cm4gdGhpcy5WSVNJVFM7XG4gIH1cblxuICBhZGRWaXNpdE9uR3JvdXAoXG4gICAgZ3JvdXBJZCxcbiAgICB2aXNpdE5hbWUsXG4gICAgcGVyaW9kaWNpdHlOdW1iZXIsXG4gICAgcGVyaW9kaWNpdHlNZXN1cmUsXG4gICAgdmlzaXRUeXBlLFxuICAgIGludGVydmVudGlvbk51bWJlcixcbiAgICBpbnRlcnZlbnRpb25NZXN1cmUsXG4gICAgZGVzY3JpcHRpb25cbiAgKSB7XG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihncm91cElkLCBbdGhpcy5HUk9VUF9UT19UQVNLXSkudGhlbihcbiAgICAgIGNoaWxkcmVuID0+IHtcbiAgICAgICAgbGV0IGFyZ05vZGVJZDtcbiAgICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGFyZ05vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgIG5hbWU6IFwibWFpbnRlbmFuY2VcIlxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkKFxuICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgIGFyZ05vZGVJZCxcbiAgICAgICAgICAgIHRoaXMuR1JPVVBfVE9fVEFTSyxcbiAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5vZGUgPVxuICAgICAgICAgIHR5cGVvZiBhcmdOb2RlSWQgIT09IFwidW5kZWZpbmVkXCIgP1xuICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKGFyZ05vZGVJZCkgOlxuICAgICAgICAgIGNoaWxkcmVuWzBdO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldFB0clZhbHVlKG5vZGUsIHZpc2l0VHlwZSkudGhlbihsc3QgPT4ge1xuICAgICAgICAgIGxldCB0YXNrID0gbmV3IFZpc2l0TW9kZWwoXG4gICAgICAgICAgICB2aXNpdE5hbWUsXG4gICAgICAgICAgICBwZXJpb2RpY2l0eU51bWJlcixcbiAgICAgICAgICAgIHBlcmlvZGljaXR5TWVzdXJlLFxuICAgICAgICAgICAgdmlzaXRUeXBlLFxuICAgICAgICAgICAgaW50ZXJ2ZW50aW9uTnVtYmVyLFxuICAgICAgICAgICAgaW50ZXJ2ZW50aW9uTWVzdXJlLFxuICAgICAgICAgICAgZGVzY3JpcHRpb25cbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbGV0IG5vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgICAgZ3JvdXBJZDogZ3JvdXBJZCxcbiAgICAgICAgICAgICAgbmFtZTogdmlzaXROYW1lLFxuICAgICAgICAgICAgICBwZXJpb2RpY2l0eToge1xuICAgICAgICAgICAgICAgIG51bWJlcjogdGFzay5wZXJpb2RpY2l0eS5udW1iZXIuZ2V0KCksXG4gICAgICAgICAgICAgICAgbWVzdXJlOiB0YXNrLnBlcmlvZGljaXR5Lm1lc3VyZS5nZXQoKVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBpbnRlcnZlbnRpb246IHtcbiAgICAgICAgICAgICAgICBudW1iZXI6IHRhc2suaW50ZXJ2ZW50aW9uLm51bWJlci5nZXQoKSxcbiAgICAgICAgICAgICAgICBtZXN1cmU6IHRhc2suaW50ZXJ2ZW50aW9uLm1lc3VyZS5nZXQoKVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB2aXNpdFR5cGU6IHZpc2l0VHlwZSxcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGFza1xuICAgICAgICAgICk7XG5cbiAgICAgICAgICBsZXQgcmVhbE5vZGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0UmVhbE5vZGUobm9kZUlkKTtcblxuICAgICAgICAgIGxzdC5wdXNoKHJlYWxOb2RlKTtcblxuICAgICAgICAgIHJldHVybiByZWFsTm9kZS5pbmZvO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgZ2V0UHRyVmFsdWUobm9kZSwgcHRyTmFtZSkge1xuICAgIGxldCByZWFsTm9kZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRSZWFsTm9kZShub2RlLmlkLmdldCgpKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIGlmICghcmVhbE5vZGUuaW5mb1twdHJOYW1lXSkge1xuICAgICAgICByZWFsTm9kZS5pbmZvLmFkZF9hdHRyKHB0ck5hbWUsIHtcbiAgICAgICAgICB0YXNrczogbmV3IFB0cihuZXcgTHN0KCkpXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZWFsTm9kZS5pbmZvW3B0ck5hbWVdLnRhc2tzLmxvYWQodmFsdWUgPT4ge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZSh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldEdyb3VwVmlzaXRzKGdyb3VwSWQsIHZpc2l0eVR5cGUpIHtcbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKGdyb3VwSWQsIFt0aGlzLkdST1VQX1RPX1RBU0tdKS50aGVuKFxuICAgICAgcmVzID0+IHtcbiAgICAgICAgbGV0IG5vZGVJZDtcbiAgICAgICAgaWYgKHJlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBub2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgICAgICBuYW1lOiBcIm1haW50ZW5hbmNlXCJcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZChcbiAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICBub2RlSWQsXG4gICAgICAgICAgICB0aGlzLkdST1VQX1RPX1RBU0ssXG4gICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBub2RlID1cbiAgICAgICAgICB0eXBlb2Ygbm9kZUlkICE9PSBcInVuZGVmaW5lZFwiID9cbiAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhub2RlSWQpIDpcbiAgICAgICAgICByZXNbMF07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHRyVmFsdWUobm9kZSwgdmlzaXR5VHlwZSk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGdlbmVyYXRlRXZlbnQodmlzaXRUeXBlLCBncm91cElkLCBiZWdpbkRhdGUsIGVuZERhdGUsIGV2ZW50c0RhdGEpIHtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVWaXNpdENvbnRleHQodmlzaXRUeXBlKVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5saW5rR3JvdXBUb1Zpc3RDb250ZXh0KGVsLmlkLmdldCgpLCBncm91cElkKS50aGVuKFxuICAgICAgICAgIHJlcyA9PiB7XG4gICAgICAgICAgICBpZiAocmVzKSB7XG4gICAgICAgICAgICAgIHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoXG4gICAgICAgICAgICAgICAgZWwuaWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFUy5kZWNsYXJlZC50eXBlXG4gICAgICAgICAgICAgICkudGhlbihzdGF0ZU5vZGUgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBpZCA9IHN0YXRlTm9kZS5pZC5nZXQoKTtcblxuICAgICAgICAgICAgICAgIGV2ZW50c0RhdGEuZm9yRWFjaChldmVudEluZm8gPT4ge1xuICAgICAgICAgICAgICAgICAgbGV0IGV2ZW50c0RhdGUgPSB0aGlzLl9nZXREYXRlKFxuICAgICAgICAgICAgICAgICAgICBiZWdpbkRhdGUsXG4gICAgICAgICAgICAgICAgICAgIGVuZERhdGUsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50SW5mby5wZXJpb2ROdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50SW5mby5wZXJpb2RNZXN1cmVcbiAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgIGV2ZW50c0RhdGUuZm9yRWFjaChkYXRlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudChcbiAgICAgICAgICAgICAgICAgICAgICBlbC5pZC5nZXQoKSxcbiAgICAgICAgICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgICAgICAgICAgIGV2ZW50SW5mbyxcbiAgICAgICAgICAgICAgICAgICAgICBgJHtldmVudEluZm8ubmFtZX0gJHt0aGlzLl9mb3JtYXREYXRlKGRhdGUpfWAsXG4gICAgICAgICAgICAgICAgICAgICAgbmV3IERhdGUoZGF0ZSkuZ2V0VGltZSgpXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZXJyKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgYWRkRXZlbnQodmlzaXRUeXBlQ29udGV4dElkLCBncm91cElkLCBzdGF0ZUlkLCB2aXNpdEluZm8sIG5hbWUsIGRhdGUpIHtcbiAgICBsZXQgc3RhdGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhzdGF0ZUlkKS5zdGF0ZS5nZXQoKTtcblxuICAgIGxldCBldmVudCA9IG5ldyBFdmVudE1vZGVsKG5hbWUsIGRhdGUsIHN0YXRlLCBncm91cElkKTtcblxuICAgIGxldCBldmVudE5vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgZGF0ZTogZGF0ZSxcbiAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgICBncm91cElkOiBncm91cElkLFxuICAgICAgICB2aXNpdElkOiB2aXNpdEluZm8uaWRcbiAgICAgIH0sXG4gICAgICBldmVudFxuICAgICk7XG5cbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkSW5Db250ZXh0KFxuICAgICAgICBzdGF0ZUlkLFxuICAgICAgICBldmVudE5vZGVJZCxcbiAgICAgICAgdmlzaXRUeXBlQ29udGV4dElkLFxuICAgICAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OLFxuICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICApXG4gICAgICAudGhlbihlbCA9PiB7XG4gICAgICAgIGlmIChlbCkgcmV0dXJuIGV2ZW50Tm9kZUlkO1xuICAgICAgfSlcbiAgICAgIC50aGVuKGV2ZW50SWQgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGV2ZW50SWQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKGdyb3VwSWQsIFtcbiAgICAgICAgICAgIEVRVUlQTUVOVFNfVE9fRUxFTUVOVF9SRUxBVElPTlxuICAgICAgICAgIF0pLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgICAgICAgICAgY2hpbGRyZW4ubWFwKGNoaWxkID0+IHtcbiAgICAgICAgICAgICAgbGV0IG5hbWUgPSBgJHt2aXNpdEluZm8ubmFtZX1fXyR7Y2hpbGQubmFtZS5nZXQoKX1gO1xuICAgICAgICAgICAgICBsZXQgdGFzayA9IG5ldyBUYXNrTW9kZWwoXG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBjaGlsZC5kYmlkLmdldCgpLFxuICAgICAgICAgICAgICAgIGNoaWxkLmJpbUZpbGVJZC5nZXQoKSxcbiAgICAgICAgICAgICAgICB2aXNpdEluZm8ubmFtZSxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgbGV0IHRhc2tJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICAgICAgICBkYklkOiBjaGlsZC5kYmlkLmdldCgpLFxuICAgICAgICAgICAgICAgICAgYmltRmlsZUlkOiBjaGlsZC5iaW1GaWxlSWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgICB0YXNrTmFtZTogdmlzaXRJbmZvLm5hbWUsXG4gICAgICAgICAgICAgICAgICB2aXNpdElkOiB2aXNpdEluZm8uaWQsXG4gICAgICAgICAgICAgICAgICBzdGF0ZTogdGFzay5zdGF0ZS5nZXQoKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdGFza1xuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkSW5Db250ZXh0KFxuICAgICAgICAgICAgICAgICAgZXZlbnRJZCxcbiAgICAgICAgICAgICAgICAgIHRhc2tJZCxcbiAgICAgICAgICAgICAgICAgIHZpc2l0VHlwZUNvbnRleHRJZCxcbiAgICAgICAgICAgICAgICAgIHRoaXMuRVZFTlRfVE9fVEFTS19SRUxBVElPTixcbiAgICAgICAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZChcbiAgICAgICAgICAgICAgICAgIHZpc2l0SW5mby5pZCxcbiAgICAgICAgICAgICAgICAgIGV2ZW50SWQsXG4gICAgICAgICAgICAgICAgICB0aGlzLlZJU0lUX1RPX0VWRU5UX1JFTEFUSU9OLFxuICAgICAgICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBjcmVhdGVWaXNpdENvbnRleHQodmlzaXRUeXBlKSB7XG4gICAgbGV0IHZpc2l0ID0gdGhpcy5WSVNJVFMuZmluZChlbCA9PiB7XG4gICAgICByZXR1cm4gZWwudHlwZSA9PT0gdmlzaXRUeXBlO1xuICAgIH0pO1xuXG4gICAgaWYgKHR5cGVvZiB2aXNpdCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgY29uc3QgY29udGV4dE5hbWUgPSBgJHt2aXNpdC5uYW1lfWA7XG5cbiAgICAgIGxldCBjb250ZXh0ID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENvbnRleHQoY29udGV4dE5hbWUpO1xuICAgICAgaWYgKHR5cGVvZiBjb250ZXh0ICE9PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbnRleHRcbiAgICAgICAgLmluZm8pO1xuXG4gICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENvbnRleHQoXG4gICAgICAgIGNvbnRleHROYW1lLFxuICAgICAgICB2aXNpdFR5cGUsXG4gICAgICAgIG5ldyBNb2RlbCh7XG4gICAgICAgICAgbmFtZTogdGhpcy5WSVNJVF9DT05URVhUX05BTUVcbiAgICAgICAgfSlcbiAgICAgICkudGhlbihjb250ZXh0Q3JlYXRlZCA9PiB7XG4gICAgICAgIHJldHVybiBjb250ZXh0Q3JlYXRlZC5pbmZvO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcInZpc2l0Tm90Rm91bmRcIik7XG4gICAgfVxuICB9XG5cbiAgbGlua0dyb3VwVG9WaXN0Q29udGV4dCh2aXNpdENvbnRleHRJZCwgZ3JvdXBJZCkge1xuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4odmlzaXRDb250ZXh0SWQsIFtcbiAgICAgICAgdGhpcy5WSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OXG4gICAgICBdKVxuICAgICAgLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZHJlbltpXS5pZC5nZXQoKTtcbiAgICAgICAgICBpZiAoY2hpbGQgPT09IGdyb3VwSWQpIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGVsID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dChcbiAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgdGhpcy5WSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OLFxuICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICkudGhlbihhc3luYyByZXMgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdldEV2ZW50U3RhdGVOb2RlKFxuICAgICAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICAgICAgdGhpcy5FVkVOVF9TVEFURVMucHJvY2Vzc2luZy50eXBlXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoXG4gICAgICAgICAgICAgICAgdmlzaXRDb250ZXh0SWQsXG4gICAgICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFUy5kb25lLnR5cGVcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgZ2V0RXZlbnRTdGF0ZU5vZGUodmlzaXRDb250ZXh0SWQsIGdyb3VwSWQsIGV2ZW50U2F0ZSkge1xuICAgIGxldCBldmVudCA9IHRoaXMuX2V2ZW50U2F0ZUlzVmFsaWQoZXZlbnRTYXRlKTtcblxuICAgIGlmICh0eXBlb2YgZXZlbnQgPT09IFwidW5kZWZpbmVkXCIpIHJldHVybjtcblxuICAgIGxldCBjb250ZXh0VHlwZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKHZpc2l0Q29udGV4dElkKS50eXBlLmdldCgpO1xuICAgIGxldCByZWxhdGlvbk5hbWU7XG5cbiAgICBzd2l0Y2ggKGNvbnRleHRUeXBlKSB7XG4gICAgICBjYXNlIHRoaXMuTUFJTlRFTkFOQ0VfVklTSVQ6XG4gICAgICAgIHJlbGF0aW9uTmFtZSA9IHRoaXMuTUFJTlRFTkFOQ0VfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT047XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLlNFQ1VSSVRZX1ZJU0lUOlxuICAgICAgICByZWxhdGlvbk5hbWUgPSB0aGlzLlNFQ1VSSVRZX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdGhpcy5ESUFHTk9TVElDX1ZJU0lUOlxuICAgICAgICByZWxhdGlvbk5hbWUgPSB0aGlzLkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT047XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLlJFR1VMQVRPUllfVklTSVQ6XG4gICAgICAgIHJlbGF0aW9uTmFtZSA9IHRoaXMuUkVHVUxBVE9SWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTjtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihncm91cElkLCBbcmVsYXRpb25OYW1lXSlcbiAgICAgIC50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG5hbWUgPSBjaGlsZHJlbltpXS5uYW1lLmdldCgpO1xuICAgICAgICAgIGNvbnN0IHR5cGUgPSBjaGlsZHJlbltpXS5zdGF0ZS5nZXQoKTtcblxuICAgICAgICAgIGlmIChuYW1lID09PSBldmVudFNhdGUgfHwgdHlwZSA9PT0gZXZlbnRTYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gY2hpbGRyZW5baV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGVsID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgbGV0IGFyZ05vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgIG5hbWU6IGV2ZW50Lm5hbWUsXG4gICAgICAgICAgICBzdGF0ZTogZXZlbnQudHlwZSxcbiAgICAgICAgICAgIGdyb3VwSWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICB0eXBlOiBcIkV2ZW50U3RhdGVcIlxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dChcbiAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICBhcmdOb2RlSWQsXG4gICAgICAgICAgICB2aXNpdENvbnRleHRJZCxcbiAgICAgICAgICAgIHJlbGF0aW9uTmFtZSxcbiAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICApLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgIGlmIChyZXMpIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhhcmdOb2RlSWQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBlbDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgUFJJVkFURVMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gIF9nZXREYXRlKGJlZ2luRGF0ZSwgZW5kRGF0ZSwgcGVyaW9kTnVtYmVyLCBwZXJpb2RNZXN1cmUpIHtcbiAgICBsZXQgbWVzdXJlID0gW1wiZGF5c1wiLCBcIndlZWtzXCIsIFwibW9udGhzXCIsIFwieWVhcnNcIl1bcGVyaW9kTWVzdXJlXTtcblxuICAgIGxldCBldmVudHNEYXRlID0gW107XG5cbiAgICBsZXQgZGF0ZSA9IG1vbWVudChiZWdpbkRhdGUpO1xuICAgIGxldCBlbmQgPSBtb21lbnQoZW5kRGF0ZSk7XG5cbiAgICB3aGlsZSAoZW5kLmRpZmYoZGF0ZSkgPj0gMCkge1xuICAgICAgZXZlbnRzRGF0ZS5wdXNoKGRhdGUudG9EYXRlKCkpO1xuXG4gICAgICBkYXRlID0gZGF0ZS5hZGQocGVyaW9kTnVtYmVyLCBtZXN1cmUpO1xuICAgIH1cblxuICAgIHJldHVybiBldmVudHNEYXRlO1xuICB9XG5cbiAgX2Zvcm1hdERhdGUoYXJnRGF0ZSkge1xuICAgIGxldCBkYXRlID0gbmV3IERhdGUoYXJnRGF0ZSk7XG5cbiAgICByZXR1cm4gYCR7ZGF0ZS5nZXREYXRlKCl9LyR7ZGF0ZS5nZXRNb250aCgpICsgMX0vJHtkYXRlLmdldEZ1bGxZZWFyKCl9YDtcbiAgfVxuXG4gIF9ldmVudFNhdGVJc1ZhbGlkKGV2ZW50U3RhdGUpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLkVWRU5UX1NUQVRFUykge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLkVWRU5UX1NUQVRFU1trZXldLm5hbWUgPT09IGV2ZW50U3RhdGUgfHxcbiAgICAgICAgdGhpcy5FVkVOVF9TVEFURVNba2V5XS50eXBlID09PSBldmVudFN0YXRlXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuRVZFTlRfU1RBVEVTW2tleV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyAgICAgICAgICAgICAgICAgICAgICAgIEdFVCBJTkZPUk1BVElPTiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgZ2V0VmlzaXRHcm91cHModmlzaXRUeXBlKSB7XG4gICAgbGV0IGNvbnRleHRzID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENvbnRleHRXaXRoVHlwZSh2aXNpdFR5cGUpO1xuICAgIGlmIChjb250ZXh0cy5sZW5ndGggPT09IDApIHJldHVybiBbXTtcblxuICAgIGxldCBjb250ZXh0SWQgPSBjb250ZXh0c1swXS5pbmZvLmlkLmdldCgpO1xuXG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihcbiAgICAgIGNvbnRleHRJZCxcbiAgICAgIHRoaXMuVklTSVRfVFlQRV9UT19HUk9VUF9SRUxBVElPTlxuICAgICkudGhlbihyZXMgPT4ge1xuICAgICAgcmV0dXJuIHJlcy5tYXAoZWwgPT4gZWwuZ2V0KCkpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0R3JvdXBFdmVudHMoXG4gICAgZ3JvdXBJZCxcbiAgICBWSVNJVF9UWVBFUyA9IFtcbiAgICAgIHRoaXMuTUFJTlRFTkFOQ0VfVklTSVQsXG4gICAgICB0aGlzLlJFR1VMQVRPUllfVklTSVQsXG4gICAgICB0aGlzLlNFQ1VSSVRZX1ZJU0lULFxuICAgICAgdGhpcy5ESUFHTk9TVElDX1ZJU0lUXG4gICAgXVxuICApIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoVklTSVRfVFlQRVMpKSBWSVNJVF9UWVBFUyA9IFtWSVNJVF9UWVBFU107XG5cbiAgICByZXR1cm4gVklTSVRfVFlQRVMubWFwKHZpc2l0VHlwZSA9PiB7XG4gICAgICBsZXQgdmlzaXQgPSB0aGlzLlZJU0lUUy5maW5kKGVsID0+IHtcbiAgICAgICAgcmV0dXJuIGVsLnR5cGUgPT09IHZpc2l0VHlwZTtcbiAgICAgIH0pO1xuXG4gICAgICBsZXQgY29udGV4dCA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRDb250ZXh0KHZpc2l0Lm5hbWUpO1xuXG4gICAgICBpZiAodHlwZW9mIGNvbnRleHQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgbGV0IGNvbnRleHRJZCA9IGNvbnRleHQuaW5mby5pZC5nZXQoKTtcbiAgICAgICAgbGV0IHByb21pc2VzID0gW107XG5cbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5FVkVOVF9TVEFURVMpIHtcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKFxuICAgICAgICAgICAgdGhpcy5nZXRFdmVudFN0YXRlTm9kZShcbiAgICAgICAgICAgICAgY29udGV4dElkLFxuICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFU1trZXldLnR5cGVcbiAgICAgICAgICAgIClcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgICAgbGV0IHByb20gPSB2YWx1ZXMubWFwKGFzeW5jIGV2ZW50VHlwZSA9PiB7XG4gICAgICAgICAgICBsZXQgcmVzID0gZXZlbnRUeXBlLmdldCgpO1xuXG4gICAgICAgICAgICByZXNbXCJ2aXNpdF90eXBlXCJdID0gdmlzaXRUeXBlO1xuXG4gICAgICAgICAgICBsZXQgZXZlbnRzID0gYXdhaXQgU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKFxuICAgICAgICAgICAgICByZXMuaWQsIFtcbiAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OXG4gICAgICAgICAgICAgIF0pO1xuXG4gICAgICAgICAgICByZXNbXCJldmVudHNcIl0gPSBldmVudHMubWFwKGVsID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIGVsLmdldCgpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbSkudGhlbihhbGxFdmVudHMgPT4ge1xuICAgICAgICAgICAgbGV0IHZhbHVlcyA9IHt9O1xuXG4gICAgICAgICAgICBhbGxFdmVudHMuZm9yRWFjaCh2YWwgPT4ge1xuICAgICAgICAgICAgICB2YWx1ZXNbdmFsLnN0YXRlXSA9IHZhbC5ldmVudHM7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgW3Zpc2l0VHlwZV06IHZhbHVlc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxubGV0IHNwaW5hbFZpc2l0U2VydmljZSA9IG5ldyBTcGluYWxWaXNpdFNlcnZpY2UoKTtcblxuZXhwb3J0IGRlZmF1bHQgc3BpbmFsVmlzaXRTZXJ2aWNlOyJdfQ==