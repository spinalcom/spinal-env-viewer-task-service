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
                this.addEvent(el.id.get(), groupId, id, eventInfo, `${eventInfo.name}`, new Date(date).getTime());
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
      stateId: stateId,
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
            let name = `${child.name.get()}`;
            let task = new _taskModel2.default(name, child.dbid.get(), child.bimFileId.get(), visitInfo.name, 0);

            let taskId = _spinalEnvViewerGraphService.SpinalGraphService.createNode({
              name: name,
              type: "task",
              dbId: child.dbid.get(),
              bimFileId: child.bimFileId.get(),
              visitId: visitInfo.id,
              eventId: eventId,
              groupId: groupId,
              done: false
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

  validateTask(contextId, groupId, eventId, taskId) {
    let taskNode = _spinalEnvViewerGraphService.SpinalGraphService.getRealNode(taskId);
    taskNode.info.done.set(!taskNode.info.done.get());

    let currentStateId = _spinalEnvViewerGraphService.SpinalGraphService.getInfo(eventId).stateId.get();

    return this._getState(contextId, groupId, eventId).then(nextState => {

      let nextStateId = nextState.id.get();

      if (nextStateId === currentStateId) return true;

      return this._switchEventState(eventId, currentStateId, nextStateId, contextId);
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
      return d.toString().length > 1 ? d : '0' + d;
    })()}/${(() => {

      let d = date.getMonth() + 1;
      return d.toString().length > 1 ? d : '0' + d;
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

  _getState(contextId, groupId, eventId) {

    return this.getEventTasks(eventId).then(tasks => {
      let tasksValidated = tasks.filter(el => el.done);
      let stateObj;

      if (tasksValidated.length === 0) {
        stateObj = this.EVENT_STATES.declared;
      } else if (tasksValidated.length === tasks.length) {
        stateObj = this.EVENT_STATES.done;
      } else {
        stateObj = this.EVENT_STATES.processing;
      }

      return this.getEventStateNode(contextId, groupId, stateObj.type);
    });
  }

  _switchEventState(eventId, fromStateId, toStateId, contextId) {

    return _spinalEnvViewerGraphService.SpinalGraphService.removeChild(fromStateId, eventId, this.EVENT_STATE_TO_EVENT_RELATION, _spinalEnvViewerGraphService.SPINAL_RELATION_PTR_LST_TYPE).then(removed => {
      if (removed) {
        return _spinalEnvViewerGraphService.SpinalGraphService.addChildInContext(toStateId, eventId, contextId, this.EVENT_STATE_TO_EVENT_RELATION, _spinalEnvViewerGraphService.SPINAL_RELATION_PTR_LST_TYPE).then(res => {
          if (typeof res !== "undefined") {
            let EventNode = _spinalEnvViewerGraphService.SpinalGraphService.getRealNode(eventId);
            let newState = _spinalEnvViewerGraphService.SpinalGraphService.getInfo(toStateId).state.get();

            EventNode.info.state.set(newState);
            EventNode.info.stateId.set(toStateId);
          }
        });
      } else {
        return Promise.resolve(false);
      }
    });
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

  getGroupEventStates(contextId, groupId) {
    let promises = [];

    for (const key in this.EVENT_STATES) {
      promises.push(this.getEventStateNode(contextId, groupId, this.EVENT_STATES[key].type));
    }

    return Promise.all(promises);
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

        return this.getGroupEventStates(contextId, groupId).then(values => {
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

  getEventTasks(eventId) {
    return _spinalEnvViewerGraphService.SpinalGraphService.getChildren(eventId, [this.EVENT_TO_TASK_RELATION]).then(children => {
      return children.map(el => el.get());
    });
  }

}

let spinalVisitService = new SpinalVisitService();

exports.default = spinalVisitService;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJTcGluYWxWaXNpdFNlcnZpY2UiLCJjb25zdHJ1Y3RvciIsIlZJU0lUX0NPTlRFWFRfTkFNRSIsIkNPTlRFWFRfVFlQRSIsIlZJU0lUX1RZUEUiLCJNQUlOVEVOQU5DRV9WSVNJVCIsIlJFR1VMQVRPUllfVklTSVQiLCJTRUNVUklUWV9WSVNJVCIsIkRJQUdOT1NUSUNfVklTSVQiLCJFVkVOVF9TVEFURVMiLCJPYmplY3QiLCJmcmVlemUiLCJkZWNsYXJlZCIsIm5hbWUiLCJ0eXBlIiwicHJvY2Vzc2luZyIsImRvbmUiLCJWSVNJVFMiLCJNQUlOVEVOQU5DRV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIlJFR1VMQVRPUllfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJTRUNVUklUWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJHUk9VUF9UT19UQVNLIiwiVklTSVRfVE9fRVZFTlRfUkVMQVRJT04iLCJWSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OIiwiRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04iLCJFVkVOVF9UT19UQVNLX1JFTEFUSU9OIiwiZ2V0QWxsVmlzaXRzIiwiYWRkVmlzaXRPbkdyb3VwIiwiZ3JvdXBJZCIsInZpc2l0TmFtZSIsInBlcmlvZGljaXR5TnVtYmVyIiwicGVyaW9kaWNpdHlNZXN1cmUiLCJ2aXNpdFR5cGUiLCJpbnRlcnZlbnRpb25OdW1iZXIiLCJpbnRlcnZlbnRpb25NZXN1cmUiLCJkZXNjcmlwdGlvbiIsIlNwaW5hbEdyYXBoU2VydmljZSIsImdldENoaWxkcmVuIiwidGhlbiIsImNoaWxkcmVuIiwiYXJnTm9kZUlkIiwibGVuZ3RoIiwiY3JlYXRlTm9kZSIsImFkZENoaWxkIiwiU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRSIsIm5vZGUiLCJnZXRJbmZvIiwiZ2V0UHRyVmFsdWUiLCJsc3QiLCJ0YXNrIiwiVmlzaXRNb2RlbCIsIm5vZGVJZCIsInBlcmlvZGljaXR5IiwibnVtYmVyIiwiZ2V0IiwibWVzdXJlIiwiaW50ZXJ2ZW50aW9uIiwicmVhbE5vZGUiLCJnZXRSZWFsTm9kZSIsInB1c2giLCJpbmZvIiwicHRyTmFtZSIsImlkIiwiUHJvbWlzZSIsInJlc29sdmUiLCJhZGRfYXR0ciIsInRhc2tzIiwiUHRyIiwiTHN0IiwibG9hZCIsInZhbHVlIiwiZ2V0R3JvdXBWaXNpdHMiLCJ2aXNpdHlUeXBlIiwicmVzIiwiZ2VuZXJhdGVFdmVudCIsImJlZ2luRGF0ZSIsImVuZERhdGUiLCJldmVudHNEYXRhIiwiY3JlYXRlVmlzaXRDb250ZXh0IiwiZWwiLCJsaW5rR3JvdXBUb1Zpc3RDb250ZXh0IiwiZ2V0RXZlbnRTdGF0ZU5vZGUiLCJzdGF0ZU5vZGUiLCJmb3JFYWNoIiwiZXZlbnRJbmZvIiwiZXZlbnRzRGF0ZSIsIl9nZXREYXRlIiwicGVyaW9kTnVtYmVyIiwicGVyaW9kTWVzdXJlIiwiZGF0ZSIsImFkZEV2ZW50IiwiRGF0ZSIsImdldFRpbWUiLCJjYXRjaCIsImVyciIsImNvbnNvbGUiLCJsb2ciLCJ2aXNpdFR5cGVDb250ZXh0SWQiLCJzdGF0ZUlkIiwidmlzaXRJbmZvIiwic3RhdGUiLCJldmVudCIsIkV2ZW50TW9kZWwiLCJldmVudE5vZGVJZCIsInZpc2l0SWQiLCJhZGRDaGlsZEluQ29udGV4dCIsImV2ZW50SWQiLCJFUVVJUE1FTlRTX1RPX0VMRU1FTlRfUkVMQVRJT04iLCJtYXAiLCJjaGlsZCIsIlRhc2tNb2RlbCIsImRiaWQiLCJiaW1GaWxlSWQiLCJ0YXNrSWQiLCJkYklkIiwiYWxsIiwidmlzaXQiLCJmaW5kIiwiY29udGV4dE5hbWUiLCJjb250ZXh0IiwiZ2V0Q29udGV4dCIsImFkZENvbnRleHQiLCJNb2RlbCIsImNvbnRleHRDcmVhdGVkIiwicmVqZWN0IiwidmlzaXRDb250ZXh0SWQiLCJpIiwiZXZlbnRTYXRlIiwiX2V2ZW50U2F0ZUlzVmFsaWQiLCJjb250ZXh0VHlwZSIsInJlbGF0aW9uTmFtZSIsInZhbGlkYXRlVGFzayIsImNvbnRleHRJZCIsInRhc2tOb2RlIiwic2V0IiwiY3VycmVudFN0YXRlSWQiLCJfZ2V0U3RhdGUiLCJuZXh0U3RhdGUiLCJuZXh0U3RhdGVJZCIsIl9zd2l0Y2hFdmVudFN0YXRlIiwiZW5kIiwiZGlmZiIsInRvRGF0ZSIsImFkZCIsIl9mb3JtYXREYXRlIiwiYXJnRGF0ZSIsImQiLCJnZXREYXRlIiwidG9TdHJpbmciLCJnZXRNb250aCIsImdldEZ1bGxZZWFyIiwiZXZlbnRTdGF0ZSIsImtleSIsInVuZGVmaW5lZCIsImdldEV2ZW50VGFza3MiLCJ0YXNrc1ZhbGlkYXRlZCIsImZpbHRlciIsInN0YXRlT2JqIiwiZnJvbVN0YXRlSWQiLCJ0b1N0YXRlSWQiLCJyZW1vdmVDaGlsZCIsInJlbW92ZWQiLCJFdmVudE5vZGUiLCJuZXdTdGF0ZSIsImdldFZpc2l0R3JvdXBzIiwiY29udGV4dHMiLCJnZXRDb250ZXh0V2l0aFR5cGUiLCJnZXRHcm91cEV2ZW50U3RhdGVzIiwicHJvbWlzZXMiLCJnZXRHcm91cEV2ZW50cyIsIlZJU0lUX1RZUEVTIiwiQXJyYXkiLCJpc0FycmF5IiwidmFsdWVzIiwicHJvbSIsImV2ZW50VHlwZSIsImV2ZW50cyIsImFsbEV2ZW50cyIsInZhbCIsInNwaW5hbFZpc2l0U2VydmljZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7O0FBS0E7O0FBSUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBRUE7O0FBTUE7Ozs7Ozs7O0FBRUEsTUFBTUEsa0JBQU4sQ0FBeUI7QUFDdkJDLGdCQUFjO0FBQ1osU0FBS0Msa0JBQUwsR0FBMEIsZ0JBQTFCO0FBQ0EsU0FBS0MsWUFBTCxHQUFvQixlQUFwQjs7QUFFQSxTQUFLQyxVQUFMLEdBQWtCLE9BQWxCOztBQUVBLFNBQUtDLGlCQUFMLEdBQXlCLG1CQUF6QjtBQUNBLFNBQUtDLGdCQUFMLEdBQXdCLGtCQUF4QjtBQUNBLFNBQUtDLGNBQUwsR0FBc0Is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SUFBb0J6QyxTQUFwQjs7QUFFQSxrQkFBSWdKLFNBQVMsTUFBTTVJLGdEQUNoQkMsV0FEZ0IsQ0FFZm9DLElBQUlYLEVBRlcsRUFFUCxDQUNOLE9BQUt0Qyw2QkFEQyxDQUZPLENBQW5COztBQU1BaUQsa0JBQUksUUFBSixJQUFnQnVHLE9BQU9wRSxHQUFQLENBQVcsY0FBTTtBQUMvQix1QkFBTzdCLEdBQUd6QixHQUFILEVBQVA7QUFDRCxlQUZlLENBQWhCOztBQUlBLHFCQUFPbUIsR0FBUDtBQUNELGFBaEJVOztBQUFBO0FBQUE7QUFBQTtBQUFBLGVBQVg7O0FBa0JBLGlCQUFPVixRQUFRb0QsR0FBUixDQUFZMkQsSUFBWixFQUFrQnhJLElBQWxCLENBQXVCMkksYUFBYTtBQUN6QyxnQkFBSUosU0FBUyxFQUFiOztBQUVBSSxzQkFBVTlGLE9BQVYsQ0FBa0IrRixPQUFPO0FBQ3ZCTCxxQkFBT0ssSUFBSTlFLEtBQVgsSUFBb0I4RSxJQUFJRixNQUF4QjtBQUNELGFBRkQ7O0FBSUEsbUJBQU87QUFDTCxlQUFDaEosU0FBRCxHQUFhNkk7QUFEUixhQUFQO0FBR0QsV0FWTSxDQUFQO0FBV0QsU0EvQkksQ0FBUDtBQWdDRDtBQUNGLEtBM0NNLENBQVA7QUE0Q0Q7O0FBRURuQixnQkFBY2hELE9BQWQsRUFBdUI7QUFDckIsV0FBT3RFLGdEQUFtQkMsV0FBbkIsQ0FBK0JxRSxPQUEvQixFQUF3QyxDQUFDLEtBQzNDakYsc0JBRDBDLENBQXhDLEVBR0phLElBSEksQ0FHQ0MsWUFBWTtBQUNoQixhQUFPQSxTQUFTcUUsR0FBVCxDQUFhN0IsTUFBTUEsR0FBR3pCLEdBQUgsRUFBbkIsQ0FBUDtBQUNELEtBTEksQ0FBUDtBQU1EOztBQS9uQnNCOztBQW1vQnpCLElBQUk2SCxxQkFBcUIsSUFBSXBMLGtCQUFKLEVBQXpCOztrQkFFZW9MLGtCIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRSxcbiAgU3BpbmFsR3JhcGhTZXJ2aWNlXG59IGZyb20gXCJzcGluYWwtZW52LXZpZXdlci1ncmFwaC1zZXJ2aWNlXCI7XG5cbmltcG9ydCB7XG4gIEVRVUlQTUVOVFNfVE9fRUxFTUVOVF9SRUxBVElPTlxufSBmcm9tIFwic3BpbmFsLWVudi12aWV3ZXItcm9vbS1tYW5hZ2VyL2pzL3NlcnZpY2VcIjtcblxuaW1wb3J0IFZpc2l0TW9kZWwgZnJvbSBcIi4vbW9kZWxzL3Zpc2l0Lm1vZGVsLmpzXCI7XG5pbXBvcnQgRXZlbnRNb2RlbCBmcm9tIFwiLi9tb2RlbHMvZXZlbnQubW9kZWwuanNcIjtcbmltcG9ydCBUYXNrTW9kZWwgZnJvbSBcIi4vbW9kZWxzL3Rhc2subW9kZWwuanNcIjtcblxuaW1wb3J0IHtcbiAgUHRyLFxuICBMc3QsXG4gIE1vZGVsXG59IGZyb20gXCJzcGluYWwtY29yZS1jb25uZWN0b3Jqc190eXBlXCI7XG5cbmltcG9ydCBtb21lbnQgZnJvbSBcIm1vbWVudFwiO1xuXG5jbGFzcyBTcGluYWxWaXNpdFNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLlZJU0lUX0NPTlRFWFRfTkFNRSA9IFwiLnZpc2l0X2NvbnRleHRcIjtcbiAgICB0aGlzLkNPTlRFWFRfVFlQRSA9IFwidmlzaXRfY29udGV4dFwiO1xuXG4gICAgdGhpcy5WSVNJVF9UWVBFID0gXCJ2aXNpdFwiO1xuXG4gICAgdGhpcy5NQUlOVEVOQU5DRV9WSVNJVCA9IFwiTUFJTlRFTkFOQ0VfVklTSVRcIjtcbiAgICB0aGlzLlJFR1VMQVRPUllfVklTSVQgPSBcIlJFR1VMQVRPUllfVklTSVRcIjtcbiAgICB0aGlzLlNFQ1VSSVRZX1ZJU0lUID0gXCJTRUNVUklUWV9WSVNJVFwiO1xuICAgIHRoaXMuRElBR05PU1RJQ19WSVNJVCA9IFwiRElBR05PU1RJQ19WSVNJVFwiO1xuXG4gICAgdGhpcy5FVkVOVF9TVEFURVMgPSBPYmplY3QuZnJlZXplKHtcbiAgICAgIGRlY2xhcmVkOiB7XG4gICAgICAgIG5hbWU6IFwiZMOpY2xhcsOpXCIsXG4gICAgICAgIHR5cGU6IFwiZGVjbGFyZWRcIlxuICAgICAgfSxcbiAgICAgIHByb2Nlc3Npbmc6IHtcbiAgICAgICAgbmFtZTogXCJlbmNvdXJzXCIsXG4gICAgICAgIHR5cGU6IFwicHJvY2Vzc2luZ1wiXG4gICAgICB9LFxuICAgICAgZG9uZToge1xuICAgICAgICBuYW1lOiBcIsOpZmZlY3R1w6lcIixcbiAgICAgICAgdHlwZTogXCJkb25lXCJcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuVklTSVRTID0gT2JqZWN0LmZyZWV6ZShbe1xuICAgICAgICB0eXBlOiB0aGlzLk1BSU5URU5BTkNFX1ZJU0lULFxuICAgICAgICBuYW1lOiBcIk1haW50ZW5hbmNlIHZpc2l0XCJcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6IHRoaXMuUkVHVUxBVE9SWV9WSVNJVCxcbiAgICAgICAgbmFtZTogXCJSZWd1bGF0b3J5IHZpc2l0XCJcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6IHRoaXMuU0VDVVJJVFlfVklTSVQsXG4gICAgICAgIG5hbWU6IFwiU2VjdXJpdHkgVmlzaXRcIlxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogdGhpcy5ESUFHTk9TVElDX1ZJU0lULFxuICAgICAgICBuYW1lOiBcIkRpYWdub3N0aWMgdmlzaXRcIlxuICAgICAgfVxuICAgIF0pO1xuXG4gICAgdGhpcy5NQUlOVEVOQU5DRV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiA9XG4gICAgICBcIm1haW50ZW5hbmNlVmlzaXRoYXNFdmVudFN0YXRlXCI7XG5cbiAgICB0aGlzLlJFR1VMQVRPUllfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04gPVxuICAgICAgXCJyZWd1bGF0b3J5VmlzaXRoYXNFdmVudFN0YXRlXCI7XG5cbiAgICB0aGlzLlNFQ1VSSVRZX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OID0gXCJzZWN1cml0eVZpc2l0aGFzRXZlbnRTdGF0ZVwiO1xuXG4gICAgdGhpcy5ESUFHTk9TVElDX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OID1cbiAgICAgIFwiZGlhZ25vc3RpY1Zpc2l0aGFzRXZlbnRTdGF0ZVwiO1xuXG4gICAgdGhpcy5HUk9VUF9UT19UQVNLID0gXCJoYXNWaXNpdFwiO1xuXG4gICAgdGhpcy5WSVNJVF9UT19FVkVOVF9SRUxBVElPTiA9IFwidmlzaXRIYXNFdmVudFwiO1xuXG4gICAgdGhpcy5WSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OID0gXCJ2aXNpdEhhc0dyb3VwXCI7XG4gICAgdGhpcy5FVkVOVF9TVEFURV9UT19FVkVOVF9SRUxBVElPTiA9IFwiaGFzRXZlbnRcIjtcbiAgICB0aGlzLkVWRU5UX1RPX1RBU0tfUkVMQVRJT04gPSBcImhhc1Rhc2tcIjtcbiAgfVxuXG4gIGdldEFsbFZpc2l0cygpIHtcbiAgICByZXR1cm4gdGhpcy5WSVNJVFM7XG4gIH1cblxuICBhZGRWaXNpdE9uR3JvdXAoXG4gICAgZ3JvdXBJZCxcbiAgICB2aXNpdE5hbWUsXG4gICAgcGVyaW9kaWNpdHlOdW1iZXIsXG4gICAgcGVyaW9kaWNpdHlNZXN1cmUsXG4gICAgdmlzaXRUeXBlLFxuICAgIGludGVydmVudGlvbk51bWJlcixcbiAgICBpbnRlcnZlbnRpb25NZXN1cmUsXG4gICAgZGVzY3JpcHRpb25cbiAgKSB7XG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihncm91cElkLCBbdGhpcy5HUk9VUF9UT19UQVNLXSkudGhlbihcbiAgICAgIGNoaWxkcmVuID0+IHtcbiAgICAgICAgbGV0IGFyZ05vZGVJZDtcbiAgICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGFyZ05vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgIG5hbWU6IFwibWFpbnRlbmFuY2VcIlxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkKFxuICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgIGFyZ05vZGVJZCxcbiAgICAgICAgICAgIHRoaXMuR1JPVVBfVE9fVEFTSyxcbiAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5vZGUgPVxuICAgICAgICAgIHR5cGVvZiBhcmdOb2RlSWQgIT09IFwidW5kZWZpbmVkXCIgP1xuICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKGFyZ05vZGVJZCkgOlxuICAgICAgICAgIGNoaWxkcmVuWzBdO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldFB0clZhbHVlKG5vZGUsIHZpc2l0VHlwZSkudGhlbihsc3QgPT4ge1xuICAgICAgICAgIGxldCB0YXNrID0gbmV3IFZpc2l0TW9kZWwoXG4gICAgICAgICAgICB2aXNpdE5hbWUsXG4gICAgICAgICAgICBwZXJpb2RpY2l0eU51bWJlcixcbiAgICAgICAgICAgIHBlcmlvZGljaXR5TWVzdXJlLFxuICAgICAgICAgICAgdmlzaXRUeXBlLFxuICAgICAgICAgICAgaW50ZXJ2ZW50aW9uTnVtYmVyLFxuICAgICAgICAgICAgaW50ZXJ2ZW50aW9uTWVzdXJlLFxuICAgICAgICAgICAgZGVzY3JpcHRpb25cbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbGV0IG5vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgICAgZ3JvdXBJZDogZ3JvdXBJZCxcbiAgICAgICAgICAgICAgbmFtZTogdmlzaXROYW1lLFxuICAgICAgICAgICAgICBwZXJpb2RpY2l0eToge1xuICAgICAgICAgICAgICAgIG51bWJlcjogdGFzay5wZXJpb2RpY2l0eS5udW1iZXIuZ2V0KCksXG4gICAgICAgICAgICAgICAgbWVzdXJlOiB0YXNrLnBlcmlvZGljaXR5Lm1lc3VyZS5nZXQoKVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBpbnRlcnZlbnRpb246IHtcbiAgICAgICAgICAgICAgICBudW1iZXI6IHRhc2suaW50ZXJ2ZW50aW9uLm51bWJlci5nZXQoKSxcbiAgICAgICAgICAgICAgICBtZXN1cmU6IHRhc2suaW50ZXJ2ZW50aW9uLm1lc3VyZS5nZXQoKVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB2aXNpdFR5cGU6IHZpc2l0VHlwZSxcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGFza1xuICAgICAgICAgICk7XG5cbiAgICAgICAgICBsZXQgcmVhbE5vZGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0UmVhbE5vZGUobm9kZUlkKTtcblxuICAgICAgICAgIGxzdC5wdXNoKHJlYWxOb2RlKTtcblxuICAgICAgICAgIHJldHVybiByZWFsTm9kZS5pbmZvO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgZ2V0UHRyVmFsdWUobm9kZSwgcHRyTmFtZSkge1xuICAgIGxldCByZWFsTm9kZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRSZWFsTm9kZShub2RlLmlkLmdldCgpKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIGlmICghcmVhbE5vZGUuaW5mb1twdHJOYW1lXSkge1xuICAgICAgICByZWFsTm9kZS5pbmZvLmFkZF9hdHRyKHB0ck5hbWUsIHtcbiAgICAgICAgICB0YXNrczogbmV3IFB0cihuZXcgTHN0KCkpXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZWFsTm9kZS5pbmZvW3B0ck5hbWVdLnRhc2tzLmxvYWQodmFsdWUgPT4ge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZSh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldEdyb3VwVmlzaXRzKGdyb3VwSWQsIHZpc2l0eVR5cGUpIHtcbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKGdyb3VwSWQsIFt0aGlzLkdST1VQX1RPX1RBU0tdKS50aGVuKFxuICAgICAgcmVzID0+IHtcbiAgICAgICAgbGV0IG5vZGVJZDtcbiAgICAgICAgaWYgKHJlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBub2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgICAgICBuYW1lOiBcIm1haW50ZW5hbmNlXCJcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZChcbiAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICBub2RlSWQsXG4gICAgICAgICAgICB0aGlzLkdST1VQX1RPX1RBU0ssXG4gICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBub2RlID1cbiAgICAgICAgICB0eXBlb2Ygbm9kZUlkICE9PSBcInVuZGVmaW5lZFwiID9cbiAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhub2RlSWQpIDpcbiAgICAgICAgICByZXNbMF07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHRyVmFsdWUobm9kZSwgdmlzaXR5VHlwZSk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGdlbmVyYXRlRXZlbnQodmlzaXRUeXBlLCBncm91cElkLCBiZWdpbkRhdGUsIGVuZERhdGUsIGV2ZW50c0RhdGEpIHtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVWaXNpdENvbnRleHQodmlzaXRUeXBlKVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5saW5rR3JvdXBUb1Zpc3RDb250ZXh0KGVsLmlkLmdldCgpLCBncm91cElkKS50aGVuKFxuICAgICAgICAgIHJlcyA9PiB7XG4gICAgICAgICAgICBpZiAocmVzKSB7XG4gICAgICAgICAgICAgIHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoXG4gICAgICAgICAgICAgICAgZWwuaWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFUy5kZWNsYXJlZC50eXBlXG4gICAgICAgICAgICAgICkudGhlbihzdGF0ZU5vZGUgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBpZCA9IHN0YXRlTm9kZS5pZC5nZXQoKTtcblxuICAgICAgICAgICAgICAgIGV2ZW50c0RhdGEuZm9yRWFjaChldmVudEluZm8gPT4ge1xuICAgICAgICAgICAgICAgICAgbGV0IGV2ZW50c0RhdGUgPSB0aGlzLl9nZXREYXRlKFxuICAgICAgICAgICAgICAgICAgICBiZWdpbkRhdGUsXG4gICAgICAgICAgICAgICAgICAgIGVuZERhdGUsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50SW5mby5wZXJpb2ROdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50SW5mby5wZXJpb2RNZXN1cmVcbiAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgIGV2ZW50c0RhdGUuZm9yRWFjaChkYXRlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudChcbiAgICAgICAgICAgICAgICAgICAgICBlbC5pZC5nZXQoKSxcbiAgICAgICAgICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgICAgICAgICAgIGV2ZW50SW5mbyxcbiAgICAgICAgICAgICAgICAgICAgICBgJHtldmVudEluZm8ubmFtZX1gLFxuICAgICAgICAgICAgICAgICAgICAgIG5ldyBEYXRlKGRhdGUpLmdldFRpbWUoKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGVycik7XG4gICAgICB9KTtcbiAgfVxuXG4gIGFkZEV2ZW50KHZpc2l0VHlwZUNvbnRleHRJZCwgZ3JvdXBJZCwgc3RhdGVJZCwgdmlzaXRJbmZvLCBuYW1lLCBkYXRlKSB7XG4gICAgbGV0IHN0YXRlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8oc3RhdGVJZCkuc3RhdGUuZ2V0KCk7XG5cbiAgICBsZXQgZXZlbnQgPSBuZXcgRXZlbnRNb2RlbChuYW1lLCBkYXRlLCBzdGF0ZSwgZ3JvdXBJZCk7XG5cbiAgICBsZXQgZXZlbnROb2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgIGRhdGU6IGRhdGUsXG4gICAgICAgIHN0YXRlSWQ6IHN0YXRlSWQsXG4gICAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgICAgZ3JvdXBJZDogZ3JvdXBJZCxcbiAgICAgICAgdmlzaXRJZDogdmlzaXRJbmZvLmlkXG4gICAgICB9LFxuICAgICAgZXZlbnRcbiAgICApO1xuXG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dChcbiAgICAgICAgc3RhdGVJZCxcbiAgICAgICAgZXZlbnROb2RlSWQsXG4gICAgICAgIHZpc2l0VHlwZUNvbnRleHRJZCxcbiAgICAgICAgdGhpcy5FVkVOVF9TVEFURV9UT19FVkVOVF9SRUxBVElPTixcbiAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgKVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICBpZiAoZWwpIHJldHVybiBldmVudE5vZGVJZDtcbiAgICAgIH0pXG4gICAgICAudGhlbihldmVudElkID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudElkICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihncm91cElkLCBbXG4gICAgICAgICAgICBFUVVJUE1FTlRTX1RPX0VMRU1FTlRfUkVMQVRJT05cbiAgICAgICAgICBdKS50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgICAgICAgIGNoaWxkcmVuLm1hcChjaGlsZCA9PiB7XG4gICAgICAgICAgICAgIGxldCBuYW1lID0gYCR7Y2hpbGQubmFtZS5nZXQoKX1gO1xuICAgICAgICAgICAgICBsZXQgdGFzayA9IG5ldyBUYXNrTW9kZWwoXG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBjaGlsZC5kYmlkLmdldCgpLFxuICAgICAgICAgICAgICAgIGNoaWxkLmJpbUZpbGVJZC5nZXQoKSxcbiAgICAgICAgICAgICAgICB2aXNpdEluZm8ubmFtZSxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgbGV0IHRhc2tJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICAgICAgICB0eXBlOiBcInRhc2tcIixcbiAgICAgICAgICAgICAgICAgIGRiSWQ6IGNoaWxkLmRiaWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgICBiaW1GaWxlSWQ6IGNoaWxkLmJpbUZpbGVJZC5nZXQoKSxcbiAgICAgICAgICAgICAgICAgIHZpc2l0SWQ6IHZpc2l0SW5mby5pZCxcbiAgICAgICAgICAgICAgICAgIGV2ZW50SWQ6IGV2ZW50SWQsXG4gICAgICAgICAgICAgICAgICBncm91cElkOiBncm91cElkLFxuICAgICAgICAgICAgICAgICAgZG9uZTogZmFsc2VcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHRhc2tcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dChcbiAgICAgICAgICAgICAgICAgIGV2ZW50SWQsXG4gICAgICAgICAgICAgICAgICB0YXNrSWQsXG4gICAgICAgICAgICAgICAgICB2aXNpdFR5cGVDb250ZXh0SWQsXG4gICAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1RPX1RBU0tfUkVMQVRJT04sXG4gICAgICAgICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGQoXG4gICAgICAgICAgICAgICAgICB2aXNpdEluZm8uaWQsXG4gICAgICAgICAgICAgICAgICBldmVudElkLFxuICAgICAgICAgICAgICAgICAgdGhpcy5WSVNJVF9UT19FVkVOVF9SRUxBVElPTixcbiAgICAgICAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgY3JlYXRlVmlzaXRDb250ZXh0KHZpc2l0VHlwZSkge1xuICAgIGxldCB2aXNpdCA9IHRoaXMuVklTSVRTLmZpbmQoZWwgPT4ge1xuICAgICAgcmV0dXJuIGVsLnR5cGUgPT09IHZpc2l0VHlwZTtcbiAgICB9KTtcblxuICAgIGlmICh0eXBlb2YgdmlzaXQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGNvbnN0IGNvbnRleHROYW1lID0gYCR7dmlzaXQubmFtZX1gO1xuXG4gICAgICBsZXQgY29udGV4dCA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRDb250ZXh0KGNvbnRleHROYW1lKTtcbiAgICAgIGlmICh0eXBlb2YgY29udGV4dCAhPT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjb250ZXh0XG4gICAgICAgIC5pbmZvKTtcblxuICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDb250ZXh0KFxuICAgICAgICBjb250ZXh0TmFtZSxcbiAgICAgICAgdmlzaXRUeXBlLFxuICAgICAgICBuZXcgTW9kZWwoe1xuICAgICAgICAgIG5hbWU6IHRoaXMuVklTSVRfQ09OVEVYVF9OQU1FXG4gICAgICAgIH0pXG4gICAgICApLnRoZW4oY29udGV4dENyZWF0ZWQgPT4ge1xuICAgICAgICByZXR1cm4gY29udGV4dENyZWF0ZWQuaW5mbztcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXCJ2aXNpdE5vdEZvdW5kXCIpO1xuICAgIH1cbiAgfVxuXG4gIGxpbmtHcm91cFRvVmlzdENvbnRleHQodmlzaXRDb250ZXh0SWQsIGdyb3VwSWQpIHtcbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKHZpc2l0Q29udGV4dElkLCBbXG4gICAgICAgIHRoaXMuVklTSVRfVFlQRV9UT19HUk9VUF9SRUxBVElPTlxuICAgICAgXSlcbiAgICAgIC50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV0uaWQuZ2V0KCk7XG4gICAgICAgICAgaWYgKGNoaWxkID09PSBncm91cElkKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC50aGVuKGVsID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBlbCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGRJbkNvbnRleHQoXG4gICAgICAgICAgICB2aXNpdENvbnRleHRJZCxcbiAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICB2aXNpdENvbnRleHRJZCxcbiAgICAgICAgICAgIHRoaXMuVklTSVRfVFlQRV9UT19HUk9VUF9SRUxBVElPTixcbiAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICApLnRoZW4oYXN5bmMgcmVzID0+IHtcbiAgICAgICAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5nZXRFdmVudFN0YXRlTm9kZShcbiAgICAgICAgICAgICAgICB2aXNpdENvbnRleHRJZCxcbiAgICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICAgIHRoaXMuRVZFTlRfU1RBVEVTLnByb2Nlc3NpbmcudHlwZVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdldEV2ZW50U3RhdGVOb2RlKFxuICAgICAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICAgICAgdGhpcy5FVkVOVF9TVEFURVMuZG9uZS50eXBlXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIGdldEV2ZW50U3RhdGVOb2RlKHZpc2l0Q29udGV4dElkLCBncm91cElkLCBldmVudFNhdGUpIHtcbiAgICBsZXQgZXZlbnQgPSB0aGlzLl9ldmVudFNhdGVJc1ZhbGlkKGV2ZW50U2F0ZSk7XG5cbiAgICBpZiAodHlwZW9mIGV2ZW50ID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm47XG5cbiAgICBsZXQgY29udGV4dFR5cGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyh2aXNpdENvbnRleHRJZCkudHlwZS5nZXQoKTtcbiAgICBsZXQgcmVsYXRpb25OYW1lO1xuXG4gICAgc3dpdGNoIChjb250ZXh0VHlwZSkge1xuICAgICAgY2FzZSB0aGlzLk1BSU5URU5BTkNFX1ZJU0lUOlxuICAgICAgICByZWxhdGlvbk5hbWUgPSB0aGlzLk1BSU5URU5BTkNFX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdGhpcy5TRUNVUklUWV9WSVNJVDpcbiAgICAgICAgcmVsYXRpb25OYW1lID0gdGhpcy5TRUNVUklUWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIHRoaXMuRElBR05PU1RJQ19WSVNJVDpcbiAgICAgICAgcmVsYXRpb25OYW1lID0gdGhpcy5ESUFHTk9TVElDX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdGhpcy5SRUdVTEFUT1JZX1ZJU0lUOlxuICAgICAgICByZWxhdGlvbk5hbWUgPSB0aGlzLlJFR1VMQVRPUllfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT047XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oZ3JvdXBJZCwgW3JlbGF0aW9uTmFtZV0pXG4gICAgICAudGhlbihjaGlsZHJlbiA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBuYW1lID0gY2hpbGRyZW5baV0ubmFtZS5nZXQoKTtcbiAgICAgICAgICBjb25zdCB0eXBlID0gY2hpbGRyZW5baV0uc3RhdGUuZ2V0KCk7XG5cbiAgICAgICAgICBpZiAobmFtZSA9PT0gZXZlbnRTYXRlIHx8IHR5cGUgPT09IGV2ZW50U2F0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGNoaWxkcmVuW2ldO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC50aGVuKGVsID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBlbCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIGxldCBhcmdOb2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgICAgICBuYW1lOiBldmVudC5uYW1lLFxuICAgICAgICAgICAgc3RhdGU6IGV2ZW50LnR5cGUsXG4gICAgICAgICAgICBncm91cElkOiBncm91cElkLFxuICAgICAgICAgICAgdHlwZTogXCJFdmVudFN0YXRlXCJcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGRJbkNvbnRleHQoXG4gICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgYXJnTm9kZUlkLFxuICAgICAgICAgICAgdmlzaXRDb250ZXh0SWQsXG4gICAgICAgICAgICByZWxhdGlvbk5hbWUsXG4gICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgKS50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICBpZiAocmVzKSByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8oYXJnTm9kZUlkKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgdmFsaWRhdGVUYXNrKGNvbnRleHRJZCwgZ3JvdXBJZCwgZXZlbnRJZCwgdGFza0lkKSB7XG4gICAgbGV0IHRhc2tOb2RlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldFJlYWxOb2RlKHRhc2tJZCk7XG4gICAgdGFza05vZGUuaW5mby5kb25lLnNldCghdGFza05vZGUuaW5mby5kb25lLmdldCgpKTtcblxuICAgIGxldCBjdXJyZW50U3RhdGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKGV2ZW50SWQpLnN0YXRlSWQuZ2V0KCk7XG5cbiAgICByZXR1cm4gdGhpcy5fZ2V0U3RhdGUoY29udGV4dElkLCBncm91cElkLCBldmVudElkKS50aGVuKG5leHRTdGF0ZSA9PiB7XG5cbiAgICAgIGxldCBuZXh0U3RhdGVJZCA9IG5leHRTdGF0ZS5pZC5nZXQoKTtcblxuICAgICAgaWYgKG5leHRTdGF0ZUlkID09PSBjdXJyZW50U3RhdGVJZCkgcmV0dXJuIHRydWU7XG5cbiAgICAgIHJldHVybiB0aGlzLl9zd2l0Y2hFdmVudFN0YXRlKGV2ZW50SWQsIGN1cnJlbnRTdGF0ZUlkLCBuZXh0U3RhdGVJZCxcbiAgICAgICAgY29udGV4dElkKTtcblxuICAgIH0pO1xuXG4gIH1cblxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgUFJJVkFURVMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gIF9nZXREYXRlKGJlZ2luRGF0ZSwgZW5kRGF0ZSwgcGVyaW9kTnVtYmVyLCBwZXJpb2RNZXN1cmUpIHtcbiAgICBsZXQgbWVzdXJlID0gW1wiZGF5c1wiLCBcIndlZWtzXCIsIFwibW9udGhzXCIsIFwieWVhcnNcIl1bcGVyaW9kTWVzdXJlXTtcblxuICAgIGxldCBldmVudHNEYXRlID0gW107XG5cbiAgICBsZXQgZGF0ZSA9IG1vbWVudChiZWdpbkRhdGUpO1xuICAgIGxldCBlbmQgPSBtb21lbnQoZW5kRGF0ZSk7XG5cbiAgICB3aGlsZSAoZW5kLmRpZmYoZGF0ZSkgPj0gMCkge1xuICAgICAgZXZlbnRzRGF0ZS5wdXNoKGRhdGUudG9EYXRlKCkpO1xuXG4gICAgICBkYXRlID0gZGF0ZS5hZGQocGVyaW9kTnVtYmVyLCBtZXN1cmUpO1xuICAgIH1cblxuICAgIHJldHVybiBldmVudHNEYXRlO1xuICB9XG5cbiAgX2Zvcm1hdERhdGUoYXJnRGF0ZSkge1xuICAgIGxldCBkYXRlID0gbmV3IERhdGUoYXJnRGF0ZSk7XG5cbiAgICByZXR1cm4gYCR7KCgpID0+IHtcbiAgICAgIGxldCBkID0gZGF0ZS5nZXREYXRlKCk7XG4gICAgICByZXR1cm4gZC50b1N0cmluZygpLmxlbmd0aCA+IDEgPyBkIDogJzAnICsgZDtcbiAgICB9KSgpfS8keygoKSA9PiB7XG5cbiAgICAgIGxldCBkID0gZGF0ZS5nZXRNb250aCgpICsgMTtcbiAgICAgIHJldHVybiBkLnRvU3RyaW5nKCkubGVuZ3RoID4gMSA/IGQgOiAnMCcgKyBkO1xuXG4gICAgfSkoKX0vJHtkYXRlLmdldEZ1bGxZZWFyKCl9YDtcbiAgfVxuXG4gIF9ldmVudFNhdGVJc1ZhbGlkKGV2ZW50U3RhdGUpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLkVWRU5UX1NUQVRFUykge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLkVWRU5UX1NUQVRFU1trZXldLm5hbWUgPT09IGV2ZW50U3RhdGUgfHxcbiAgICAgICAgdGhpcy5FVkVOVF9TVEFURVNba2V5XS50eXBlID09PSBldmVudFN0YXRlXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuRVZFTlRfU1RBVEVTW2tleV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIF9nZXRTdGF0ZShjb250ZXh0SWQsIGdyb3VwSWQsIGV2ZW50SWQpIHtcblxuICAgIHJldHVybiB0aGlzLmdldEV2ZW50VGFza3MoZXZlbnRJZCkudGhlbih0YXNrcyA9PiB7XG4gICAgICBsZXQgdGFza3NWYWxpZGF0ZWQgPSB0YXNrcy5maWx0ZXIoZWwgPT4gZWwuZG9uZSk7XG4gICAgICBsZXQgc3RhdGVPYmo7XG5cbiAgICAgIGlmICh0YXNrc1ZhbGlkYXRlZC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgc3RhdGVPYmogPSB0aGlzLkVWRU5UX1NUQVRFUy5kZWNsYXJlZDtcbiAgICAgIH0gZWxzZSBpZiAodGFza3NWYWxpZGF0ZWQubGVuZ3RoID09PSB0YXNrcy5sZW5ndGgpIHtcbiAgICAgICAgc3RhdGVPYmogPSB0aGlzLkVWRU5UX1NUQVRFUy5kb25lO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGVPYmogPSB0aGlzLkVWRU5UX1NUQVRFUy5wcm9jZXNzaW5nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5nZXRFdmVudFN0YXRlTm9kZShjb250ZXh0SWQsIGdyb3VwSWQsIHN0YXRlT2JqLnR5cGUpO1xuXG4gICAgfSlcblxuICB9XG5cbiAgX3N3aXRjaEV2ZW50U3RhdGUoZXZlbnRJZCwgZnJvbVN0YXRlSWQsIHRvU3RhdGVJZCwgY29udGV4dElkKSB7XG5cblxuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UucmVtb3ZlQ2hpbGQoZnJvbVN0YXRlSWQsIGV2ZW50SWQsIHRoaXNcbiAgICAgICAgLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OLCBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFKVxuICAgICAgLnRoZW4ocmVtb3ZlZCA9PiB7XG4gICAgICAgIGlmIChyZW1vdmVkKSB7XG4gICAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dCh0b1N0YXRlSWQsIGV2ZW50SWQsXG4gICAgICAgICAgICAgIGNvbnRleHRJZCxcbiAgICAgICAgICAgICAgdGhpcy5FVkVOVF9TVEFURV9UT19FVkVOVF9SRUxBVElPTixcbiAgICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRSlcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgbGV0IEV2ZW50Tm9kZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRSZWFsTm9kZShldmVudElkKTtcbiAgICAgICAgICAgICAgICBsZXQgbmV3U3RhdGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyh0b1N0YXRlSWQpLnN0YXRlXG4gICAgICAgICAgICAgICAgICAuZ2V0KCk7XG5cblxuICAgICAgICAgICAgICAgIEV2ZW50Tm9kZS5pbmZvLnN0YXRlLnNldChuZXdTdGF0ZSk7XG4gICAgICAgICAgICAgICAgRXZlbnROb2RlLmluZm8uc3RhdGVJZC5zZXQodG9TdGF0ZUlkKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9KVxuXG5cbiAgfVxuXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyAgICAgICAgICAgICAgICAgICAgICAgIEdFVCBJTkZPUk1BVElPTiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgZ2V0VmlzaXRHcm91cHModmlzaXRUeXBlKSB7XG4gICAgbGV0IGNvbnRleHRzID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENvbnRleHRXaXRoVHlwZSh2aXNpdFR5cGUpO1xuICAgIGlmIChjb250ZXh0cy5sZW5ndGggPT09IDApIHJldHVybiBbXTtcblxuICAgIGxldCBjb250ZXh0SWQgPSBjb250ZXh0c1swXS5pbmZvLmlkLmdldCgpO1xuXG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihcbiAgICAgIGNvbnRleHRJZCxcbiAgICAgIHRoaXMuVklTSVRfVFlQRV9UT19HUk9VUF9SRUxBVElPTlxuICAgICkudGhlbihyZXMgPT4ge1xuICAgICAgcmV0dXJuIHJlcy5tYXAoZWwgPT4gZWwuZ2V0KCkpO1xuICAgIH0pO1xuICB9XG5cblxuICBnZXRHcm91cEV2ZW50U3RhdGVzKGNvbnRleHRJZCwgZ3JvdXBJZCkge1xuICAgIGxldCBwcm9taXNlcyA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5FVkVOVF9TVEFURVMpIHtcbiAgICAgIHByb21pc2VzLnB1c2goXG4gICAgICAgIHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoXG4gICAgICAgICAgY29udGV4dElkLFxuICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgdGhpcy5FVkVOVF9TVEFURVNba2V5XS50eXBlXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcbiAgfVxuXG4gIGdldEdyb3VwRXZlbnRzKFxuICAgIGdyb3VwSWQsXG4gICAgVklTSVRfVFlQRVMgPSBbXG4gICAgICB0aGlzLk1BSU5URU5BTkNFX1ZJU0lULFxuICAgICAgdGhpcy5SRUdVTEFUT1JZX1ZJU0lULFxuICAgICAgdGhpcy5TRUNVUklUWV9WSVNJVCxcbiAgICAgIHRoaXMuRElBR05PU1RJQ19WSVNJVFxuICAgIF1cbiAgKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KFZJU0lUX1RZUEVTKSkgVklTSVRfVFlQRVMgPSBbVklTSVRfVFlQRVNdO1xuXG4gICAgcmV0dXJuIFZJU0lUX1RZUEVTLm1hcCh2aXNpdFR5cGUgPT4ge1xuICAgICAgbGV0IHZpc2l0ID0gdGhpcy5WSVNJVFMuZmluZChlbCA9PiB7XG4gICAgICAgIHJldHVybiBlbC50eXBlID09PSB2aXNpdFR5cGU7XG4gICAgICB9KTtcblxuICAgICAgbGV0IGNvbnRleHQgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q29udGV4dCh2aXNpdC5uYW1lKTtcblxuICAgICAgaWYgKHR5cGVvZiBjb250ZXh0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGxldCBjb250ZXh0SWQgPSBjb250ZXh0LmluZm8uaWQuZ2V0KCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JvdXBFdmVudFN0YXRlcyhjb250ZXh0SWQsIGdyb3VwSWQpLnRoZW4oXG4gICAgICAgICAgdmFsdWVzID0+IHtcbiAgICAgICAgICAgIGxldCBwcm9tID0gdmFsdWVzLm1hcChhc3luYyBldmVudFR5cGUgPT4ge1xuICAgICAgICAgICAgICBsZXQgcmVzID0gZXZlbnRUeXBlLmdldCgpO1xuXG4gICAgICAgICAgICAgIHJlc1tcInZpc2l0X3R5cGVcIl0gPSB2aXNpdFR5cGU7XG5cbiAgICAgICAgICAgICAgbGV0IGV2ZW50cyA9IGF3YWl0IFNwaW5hbEdyYXBoU2VydmljZVxuICAgICAgICAgICAgICAgIC5nZXRDaGlsZHJlbihcbiAgICAgICAgICAgICAgICAgIHJlcy5pZCwgW1xuICAgICAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OXG4gICAgICAgICAgICAgICAgICBdKTtcblxuICAgICAgICAgICAgICByZXNbXCJldmVudHNcIl0gPSBldmVudHMubWFwKGVsID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwuZ2V0KCk7XG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb20pLnRoZW4oYWxsRXZlbnRzID0+IHtcbiAgICAgICAgICAgICAgbGV0IHZhbHVlcyA9IHt9O1xuXG4gICAgICAgICAgICAgIGFsbEV2ZW50cy5mb3JFYWNoKHZhbCA9PiB7XG4gICAgICAgICAgICAgICAgdmFsdWVzW3ZhbC5zdGF0ZV0gPSB2YWwuZXZlbnRzO1xuICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIFt2aXNpdFR5cGVdOiB2YWx1ZXNcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZ2V0RXZlbnRUYXNrcyhldmVudElkKSB7XG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihldmVudElkLCBbdGhpc1xuICAgICAgICAuRVZFTlRfVE9fVEFTS19SRUxBVElPTlxuICAgICAgXSlcbiAgICAgIC50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgICAgcmV0dXJuIGNoaWxkcmVuLm1hcChlbCA9PiBlbC5nZXQoKSlcbiAgICAgIH0pXG4gIH1cblxufVxuXG5sZXQgc3BpbmFsVmlzaXRTZXJ2aWNlID0gbmV3IFNwaW5hbFZpc2l0U2VydmljZSgpO1xuXG5leHBvcnQgZGVmYXVsdCBzcGluYWxWaXNpdFNlcnZpY2U7Il19