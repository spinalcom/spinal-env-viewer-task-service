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
      name: "Visite de maintenance"
    }, {
      type: this.REGULATORY_VISIT,
      name: "Visite reglementaire"
    }, {
      type: this.SECURITY_VISIT,
      name: "Visite de securite"
    }, {
      type: this.DIAGNOSTIC_VISIT,
      name: "Visite de diagnostic"
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
            mesure: task.periodicity.mesure
          },
          intervention: {
            number: task.intervention.number.get(),
            mesure: task.intervention.mesure
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

  deleteVisit(visitId, removeRelatedEvent) {
    return this.removeVisitEvents(visitId, removeRelatedEvent).then(info => {

      if (info) {
        let groupId = info.groupId.get();
        let visitContextType = info.visitType.get();

        return this.getGroupVisits(groupId, visitContextType).then(res => {
          for (let index = 0; index < res.length; index++) {
            const resVisitId = res[index].info.id.get();
            if (resVisitId == visitId) {
              res.remove(res[index]);
              return true;
            }
          }
          return false;
        });
      } else {
        return false;
      }
    });
  }

  editVisit(visitId, newValuesObj) {
    if (typeof newValuesObj !== "object") {
      return false;
    }

    let visitNode = _spinalEnvViewerGraphService.SpinalGraphService.getRealNode(visitId);

    if (typeof visitNode !== "undefined") {
      for (const key in newValuesObj) {
        const value = newValuesObj[key];

        if (typeof value === "string" && typeof visitNode.info[key] !== "undefined") {

          visitNode.info[key].set(value);
        } else if (typeof value === "object" && typeof visitNode.info[key] !== "undefined") {

          for (const key2 in value) {
            const value2 = value[key2];

            if (typeof visitNode.info[key][key2] !== "undefined") {

              if (key === "intervention" && key2 === "mesure") {

                if (typeof value2 !== "undefined") {

                  visitNode.info[key][key2].set(new Choice(value2, ["minute(s)", "day(s)", "week(s)", "month(s)", "year(s)"]));
                } else {
                  visitNode.info[key][key2].set(NaN);
                }
              } else if (key === "periodicity" && key2 === "mesure") {

                visitNode.info[key][key2].set(new Choice(value2, ["day(s)", "week(s)", "month(s)", "year(s)"]));
              } else {
                typeof value2 !== "undefined" ? visitNode.info[key][key2].set(value2) : visitNode.info[key][key2].set(NaN);
              }
            }
          }
        }
      }

      return true;
    }

    return false;
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

  removeVisitEvents(visitId, removeRelatedEvent) {
    if (removeRelatedEvent) {
      return _spinalEnvViewerGraphService.SpinalGraphService.getChildren(visitId, [this.VISIT_TO_EVENT_RELATION]).then(children => {
        let childrenPromise = children.map(el => {
          return _spinalEnvViewerGraphService.SpinalGraphService.removeFromGraph(el.id.get());
        });

        return Promise.all(childrenPromise).then(() => {
          return _spinalEnvViewerGraphService.SpinalGraphService.getInfo(visitId);
        });
      });
    } else {
      return Promise.resolve(_spinalEnvViewerGraphService.SpinalGraphService.getInfo(visitId));
    }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJTcGluYWxWaXNpdFNlcnZpY2UiLCJjb25zdHJ1Y3RvciIsIlZJU0lUX0NPTlRFWFRfTkFNRSIsIkNPTlRFWFRfVFlQRSIsIlZJU0lUX1RZUEUiLCJNQUlOVEVOQU5DRV9WSVNJVCIsIlJFR1VMQVRPUllfVklTSVQiLCJTRUNVUklUWV9WSVNJVCIsIkRJQUdOT1NUSUNfVklTSVQiLCJFVkVOVF9TVEFURVMiLCJPYmplY3QiLCJmcmVlemUiLCJkZWNsYXJlZCIsIm5hbWUiLCJ0eXBlIiwicHJvY2Vzc2luZyIsImRvbmUiLCJWSVNJVFMiLCJNQUlOVEVOQU5DRV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIlJFR1VMQVRPUllfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJTRUNVUklUWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJHUk9VUF9UT19UQVNLIiwiVklTSVRfVE9fRVZFTlRfUkVMQVRJT04iLCJWSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OIiwiRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04iLCJFVkVOVF9UT19UQVNLX1JFTEFUSU9OIiwiZ2V0QWxsVmlzaXRzIiwiYWRkVmlzaXRPbkdyb3VwIiwiZ3JvdXBJZCIsInZpc2l0TmFtZSIsInBlcmlvZGljaXR5TnVtYmVyIiwicGVyaW9kaWNpdHlNZXN1cmUiLCJ2aXNpdFR5cGUiLCJpbnRlcnZlbnRpb25OdW1iZXIiLCJpbnRlcnZlbnRpb25NZXN1cmUiLCJkZXNjcmlwdGlvbiIsIlNwaW5hbEdyYXBoU2VydmljZSIsImdldENoaWxkcmVuIiwidGhlbiIsImNoaWxkcmVuIiwiYXJnTm9kZUlkIiwibGVuZ3RoIiwiY3JlYXRlTm9kZSIsImFkZENoaWxkIiwiU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRSIsIm5vZGUiLCJnZXRJbmZvIiwiZ2V0UHRyVmFsdWUiLCJsc3QiLCJ0YXNrIiwiVmlzaXRNb2RlbCIsIm5vZGVJZCIsInBlcmlvZGljaXR5IiwibnVtYmVyIiwiZ2V0IiwibWVzdXJlIiwiaW50ZXJ2ZW50aW9uIiwicmVhbE5vZGUiLCJnZXRSZWFsTm9kZSIsInB1c2giLCJpbmZvIiwiZGVsZXRlVmlzaXQiLCJ2aXNpdElkIiwicmVtb3ZlUmVsYXRlZEV2ZW50IiwicmVtb3ZlVmlzaXRFdmVudHMiLCJ2aXNpdENvbnRleHRUeXBlIiwiZ2V0R3JvdXBWaXNpdHMiLCJyZXMiLCJpbmRleCIsInJlc1Zpc2l0SWQiLCJpZCIsInJlbW92ZSIsImVkaXRWaXNpdCIsIm5ld1ZhbHVlc09iaiIsInZpc2l0Tm9kZSIsImtleSIsInZhbHVlIiwic2V0Iiwia2V5MiIsInZhbHVlMiIsIkNob2ljZSIsIk5hTiIsInB0ck5hbWUiLCJQcm9taXNlIiwicmVzb2x2ZSIsImFkZF9hdHRyIiwidGFza3MiLCJQdHIiLCJMc3QiLCJsb2FkIiwidmlzaXR5VHlwZSIsImdlbmVyYXRlRXZlbnQiLCJiZWdpbkRhdGUiLCJlbmREYXRlIiwiZXZlbnRzRGF0YSIsImNyZWF0ZVZpc2l0Q29udGV4dCIsImVsIiwibGlua0dyb3VwVG9WaXN0Q29udGV4dCIsImdldEV2ZW50U3RhdGVOb2RlIiwic3RhdGVOb2RlIiwiZm9yRWFjaCIsImV2ZW50SW5mbyIsImV2ZW50c0RhdGUiLCJfZ2V0RGF0ZSIsInBlcmlvZE51bWJlciIsInBlcmlvZE1lc3VyZSIsImRhdGUiLCJhZGRFdmVudCIsIkRhdGUiLCJnZXRUaW1lIiwiY2F0Y2giLCJlcnIiLCJjb25zb2xlIiwibG9nIiwidmlzaXRUeXBlQ29udGV4dElkIiwic3RhdGVJZCIsInZpc2l0SW5mbyIsInN0YXRlIiwiZXZlbnQiLCJFdmVudE1vZGVsIiwiZXZlbnROb2RlSWQiLCJhZGRDaGlsZEluQ29udGV4dCIsImV2ZW50SWQiLCJFUVVJUE1FTlRTX1RPX0VMRU1FTlRfUkVMQVRJT04iLCJtYXAiLCJjaGlsZCIsIlRhc2tNb2RlbCIsImRiaWQiLCJiaW1GaWxlSWQiLCJ0YXNrSWQiLCJkYklkIiwiYWxsIiwidmlzaXQiLCJmaW5kIiwiY29udGV4dE5hbWUiLCJjb250ZXh0IiwiZ2V0Q29udGV4dCIsImFkZENvbnRleHQiLCJNb2RlbCIsImNvbnRleHRDcmVhdGVkIiwicmVqZWN0IiwidmlzaXRDb250ZXh0SWQiLCJpIiwiZXZlbnRTYXRlIiwiX2V2ZW50U2F0ZUlzVmFsaWQiLCJjb250ZXh0VHlwZSIsInJlbGF0aW9uTmFtZSIsInZhbGlkYXRlVGFzayIsImNvbnRleHRJZCIsInRhc2tOb2RlIiwiY3VycmVudFN0YXRlSWQiLCJfZ2V0U3RhdGUiLCJuZXh0U3RhdGUiLCJuZXh0U3RhdGVJZCIsIl9zd2l0Y2hFdmVudFN0YXRlIiwiY2hpbGRyZW5Qcm9taXNlIiwicmVtb3ZlRnJvbUdyYXBoIiwiZW5kIiwiZGlmZiIsInRvRGF0ZSIsImFkZCIsIl9mb3JtYXREYXRlIiwiYXJnRGF0ZSIsImQiLCJnZXREYXRlIiwidG9TdHJpbmciLCJnZXRNb250aCIsImdldEZ1bGxZZWFyIiwiZXZlbnRTdGF0ZSIsInVuZGVmaW5lZCIsImdldEV2ZW50VGFza3MiLCJ0YXNrc1ZhbGlkYXRlZCIsImZpbHRlciIsInN0YXRlT2JqIiwiZnJvbVN0YXRlSWQiLCJ0b1N0YXRlSWQiLCJyZW1vdmVDaGlsZCIsInJlbW92ZWQiLCJFdmVudE5vZGUiLCJuZXdTdGF0ZSIsImdldFZpc2l0R3JvdXBzIiwiY29udGV4dHMiLCJnZXRDb250ZXh0V2l0aFR5cGUiLCJnZXRHcm91cEV2ZW50U3RhdGVzIiwicHJvbWlzZXMiLCJnZXRHcm91cEV2ZW50cyIsIlZJU0lUX1RZUEVTIiwiQXJyYXkiLCJpc0FycmF5IiwidmFsdWVzIiwicHJvbSIsImV2ZW50VHlwZSIsImV2ZW50cyIsImFsbEV2ZW50cyIsInZhbCIsInNwaW5hbFZpc2l0U2VydmljZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7O0FBS0E7O0FBSUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBRUE7O0FBTUE7Ozs7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QUFJNkkscUJBQXFCLElBQUlwTSxrQkFBSixFQUF6Qjs7a0JBRWVvTSxrQiIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEUsXG4gIFNwaW5hbEdyYXBoU2VydmljZVxufSBmcm9tIFwic3BpbmFsLWVudi12aWV3ZXItZ3JhcGgtc2VydmljZVwiO1xuXG5pbXBvcnQge1xuICBFUVVJUE1FTlRTX1RPX0VMRU1FTlRfUkVMQVRJT05cbn0gZnJvbSBcInNwaW5hbC1lbnYtdmlld2VyLXJvb20tbWFuYWdlci9qcy9zZXJ2aWNlXCI7XG5cbmltcG9ydCBWaXNpdE1vZGVsIGZyb20gXCIuL21vZGVscy92aXNpdC5tb2RlbC5qc1wiO1xuaW1wb3J0IEV2ZW50TW9kZWwgZnJvbSBcIi4vbW9kZWxzL2V2ZW50Lm1vZGVsLmpzXCI7XG5pbXBvcnQgVGFza01vZGVsIGZyb20gXCIuL21vZGVscy90YXNrLm1vZGVsLmpzXCI7XG5cbmltcG9ydCB7XG4gIFB0cixcbiAgTHN0LFxuICBNb2RlbFxufSBmcm9tIFwic3BpbmFsLWNvcmUtY29ubmVjdG9yanNfdHlwZVwiO1xuXG5pbXBvcnQgbW9tZW50IGZyb20gXCJtb21lbnRcIjtcblxuY2xhc3MgU3BpbmFsVmlzaXRTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5WSVNJVF9DT05URVhUX05BTUUgPSBcIi52aXNpdF9jb250ZXh0XCI7XG4gICAgdGhpcy5DT05URVhUX1RZUEUgPSBcInZpc2l0X2NvbnRleHRcIjtcblxuICAgIHRoaXMuVklTSVRfVFlQRSA9IFwidmlzaXRcIjtcblxuICAgIHRoaXMuTUFJTlRFTkFOQ0VfVklTSVQgPSBcIk1BSU5URU5BTkNFX1ZJU0lUXCI7XG4gICAgdGhpcy5SRUdVTEFUT1JZX1ZJU0lUID0gXCJSRUdVTEFUT1JZX1ZJU0lUXCI7XG4gICAgdGhpcy5TRUNVUklUWV9WSVNJVCA9IFwiU0VDVVJJVFlfVklTSVRcIjtcbiAgICB0aGlzLkRJQUdOT1NUSUNfVklTSVQgPSBcIkRJQUdOT1NUSUNfVklTSVRcIjtcblxuICAgIHRoaXMuRVZFTlRfU1RBVEVTID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgICBkZWNsYXJlZDoge1xuICAgICAgICBuYW1lOiBcImTDqWNsYXLDqVwiLFxuICAgICAgICB0eXBlOiBcImRlY2xhcmVkXCJcbiAgICAgIH0sXG4gICAgICBwcm9jZXNzaW5nOiB7XG4gICAgICAgIG5hbWU6IFwiZW5jb3Vyc1wiLFxuICAgICAgICB0eXBlOiBcInByb2Nlc3NpbmdcIlxuICAgICAgfSxcbiAgICAgIGRvbmU6IHtcbiAgICAgICAgbmFtZTogXCLDqWZmZWN0dcOpXCIsXG4gICAgICAgIHR5cGU6IFwiZG9uZVwiXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLlZJU0lUUyA9IE9iamVjdC5mcmVlemUoW3tcbiAgICAgIHR5cGU6IHRoaXMuTUFJTlRFTkFOQ0VfVklTSVQsXG4gICAgICBuYW1lOiBcIlZpc2l0ZSBkZSBtYWludGVuYW5jZVwiXG4gICAgfSwge1xuICAgICAgdHlwZTogdGhpcy5SRUdVTEFUT1JZX1ZJU0lULFxuICAgICAgbmFtZTogXCJWaXNpdGUgcmVnbGVtZW50YWlyZVwiXG4gICAgfSwge1xuICAgICAgdHlwZTogdGhpcy5TRUNVUklUWV9WSVNJVCxcbiAgICAgIG5hbWU6IFwiVmlzaXRlIGRlIHNlY3VyaXRlXCJcbiAgICB9LCB7XG4gICAgICB0eXBlOiB0aGlzLkRJQUdOT1NUSUNfVklTSVQsXG4gICAgICBuYW1lOiBcIlZpc2l0ZSBkZSBkaWFnbm9zdGljXCJcbiAgICB9XSk7XG5cblxuICAgIHRoaXMuTUFJTlRFTkFOQ0VfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04gPVxuICAgICAgXCJtYWludGVuYW5jZVZpc2l0aGFzRXZlbnRTdGF0ZVwiO1xuXG4gICAgdGhpcy5SRUdVTEFUT1JZX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OID1cbiAgICAgIFwicmVndWxhdG9yeVZpc2l0aGFzRXZlbnRTdGF0ZVwiO1xuXG4gICAgdGhpcy5TRUNVUklUWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiA9IFwic2VjdXJpdHlWaXNpdGhhc0V2ZW50U3RhdGVcIjtcblxuICAgIHRoaXMuRElBR05PU1RJQ19WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiA9XG4gICAgICBcImRpYWdub3N0aWNWaXNpdGhhc0V2ZW50U3RhdGVcIjtcblxuICAgIHRoaXMuR1JPVVBfVE9fVEFTSyA9IFwiaGFzVmlzaXRcIjtcblxuICAgIHRoaXMuVklTSVRfVE9fRVZFTlRfUkVMQVRJT04gPSBcInZpc2l0SGFzRXZlbnRcIjtcblxuICAgIHRoaXMuVklTSVRfVFlQRV9UT19HUk9VUF9SRUxBVElPTiA9IFwidmlzaXRIYXNHcm91cFwiO1xuICAgIHRoaXMuRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04gPSBcImhhc0V2ZW50XCI7XG4gICAgdGhpcy5FVkVOVF9UT19UQVNLX1JFTEFUSU9OID0gXCJoYXNUYXNrXCI7XG4gIH1cblxuICBnZXRBbGxWaXNpdHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuVklTSVRTO1xuICB9XG5cbiAgYWRkVmlzaXRPbkdyb3VwKFxuICAgIGdyb3VwSWQsXG4gICAgdmlzaXROYW1lLFxuICAgIHBlcmlvZGljaXR5TnVtYmVyLFxuICAgIHBlcmlvZGljaXR5TWVzdXJlLFxuICAgIHZpc2l0VHlwZSxcbiAgICBpbnRlcnZlbnRpb25OdW1iZXIsXG4gICAgaW50ZXJ2ZW50aW9uTWVzdXJlLFxuICAgIGRlc2NyaXB0aW9uXG4gICkge1xuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oZ3JvdXBJZCwgW3RoaXMuR1JPVVBfVE9fVEFTS10pLnRoZW4oXG4gICAgICBjaGlsZHJlbiA9PiB7XG4gICAgICAgIGxldCBhcmdOb2RlSWQ7XG4gICAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBhcmdOb2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgICAgICBuYW1lOiBcIm1haW50ZW5hbmNlXCJcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZChcbiAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICBhcmdOb2RlSWQsXG4gICAgICAgICAgICB0aGlzLkdST1VQX1RPX1RBU0ssXG4gICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBub2RlID1cbiAgICAgICAgICB0eXBlb2YgYXJnTm9kZUlkICE9PSBcInVuZGVmaW5lZFwiID9cbiAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhhcmdOb2RlSWQpIDpcbiAgICAgICAgICBjaGlsZHJlblswXTtcblxuICAgICAgICByZXR1cm4gdGhpcy5nZXRQdHJWYWx1ZShub2RlLCB2aXNpdFR5cGUpLnRoZW4obHN0ID0+IHtcbiAgICAgICAgICBsZXQgdGFzayA9IG5ldyBWaXNpdE1vZGVsKFxuICAgICAgICAgICAgdmlzaXROYW1lLFxuICAgICAgICAgICAgcGVyaW9kaWNpdHlOdW1iZXIsXG4gICAgICAgICAgICBwZXJpb2RpY2l0eU1lc3VyZSxcbiAgICAgICAgICAgIHZpc2l0VHlwZSxcbiAgICAgICAgICAgIGludGVydmVudGlvbk51bWJlcixcbiAgICAgICAgICAgIGludGVydmVudGlvbk1lc3VyZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGxldCBub2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgICAgICAgIGdyb3VwSWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICAgIG5hbWU6IHZpc2l0TmFtZSxcbiAgICAgICAgICAgICAgcGVyaW9kaWNpdHk6IHtcbiAgICAgICAgICAgICAgICBudW1iZXI6IHRhc2sucGVyaW9kaWNpdHkubnVtYmVyLmdldCgpLFxuICAgICAgICAgICAgICAgIG1lc3VyZTogdGFzay5wZXJpb2RpY2l0eS5tZXN1cmVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgaW50ZXJ2ZW50aW9uOiB7XG4gICAgICAgICAgICAgICAgbnVtYmVyOiB0YXNrLmludGVydmVudGlvbi5udW1iZXIuZ2V0KCksXG4gICAgICAgICAgICAgICAgbWVzdXJlOiB0YXNrLmludGVydmVudGlvbi5tZXN1cmVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgdmlzaXRUeXBlOiB2aXNpdFR5cGUsXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRhc2tcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbGV0IHJlYWxOb2RlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldFJlYWxOb2RlKG5vZGVJZCk7XG5cbiAgICAgICAgICBsc3QucHVzaChyZWFsTm9kZSk7XG5cbiAgICAgICAgICByZXR1cm4gcmVhbE5vZGUuaW5mbztcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGRlbGV0ZVZpc2l0KHZpc2l0SWQsIHJlbW92ZVJlbGF0ZWRFdmVudCkge1xuICAgIHJldHVybiB0aGlzLnJlbW92ZVZpc2l0RXZlbnRzKHZpc2l0SWQsIHJlbW92ZVJlbGF0ZWRFdmVudCkudGhlbigoXG4gICAgICBpbmZvKSA9PiB7XG5cbiAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgIGxldCBncm91cElkID0gaW5mby5ncm91cElkLmdldCgpO1xuICAgICAgICBsZXQgdmlzaXRDb250ZXh0VHlwZSA9IGluZm8udmlzaXRUeXBlLmdldCgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyb3VwVmlzaXRzKGdyb3VwSWQsIHZpc2l0Q29udGV4dFR5cGUpLnRoZW4oXG4gICAgICAgICAgcmVzID0+IHtcbiAgICAgICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCByZXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHJlc1Zpc2l0SWQgPSByZXNbaW5kZXhdLmluZm8uaWQuZ2V0KCk7XG4gICAgICAgICAgICAgIGlmIChyZXNWaXNpdElkID09IHZpc2l0SWQpIHtcbiAgICAgICAgICAgICAgICByZXMucmVtb3ZlKHJlc1tpbmRleF0pO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgIH0pXG4gIH1cblxuICBlZGl0VmlzaXQodmlzaXRJZCwgbmV3VmFsdWVzT2JqKSB7XG4gICAgaWYgKHR5cGVvZiBuZXdWYWx1ZXNPYmogIT09IFwib2JqZWN0XCIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgdmlzaXROb2RlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldFJlYWxOb2RlKHZpc2l0SWQpO1xuXG4gICAgaWYgKHR5cGVvZiB2aXNpdE5vZGUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIG5ld1ZhbHVlc09iaikge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IG5ld1ZhbHVlc09ialtrZXldO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIHZpc2l0Tm9kZS5pbmZvW2tleV0gIT09XG4gICAgICAgICAgXCJ1bmRlZmluZWRcIikge1xuXG4gICAgICAgICAgdmlzaXROb2RlLmluZm9ba2V5XS5zZXQodmFsdWUpO1xuXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiB2aXNpdE5vZGUuaW5mb1trZXldICE9PVxuICAgICAgICAgIFwidW5kZWZpbmVkXCIpIHtcblxuICAgICAgICAgIGZvciAoY29uc3Qga2V5MiBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUyID0gdmFsdWVba2V5Ml07XG5cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2aXNpdE5vZGUuaW5mb1trZXldW2tleTJdICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cbiAgICAgICAgICAgICAgaWYgKGtleSA9PT0gXCJpbnRlcnZlbnRpb25cIiAmJiBrZXkyID09PSBcIm1lc3VyZVwiKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlMiAhPT0gXCJ1bmRlZmluZWRcIikge1xuXG4gICAgICAgICAgICAgICAgICB2aXNpdE5vZGUuaW5mb1trZXldW2tleTJdLnNldChuZXcgQ2hvaWNlKFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTIsIFtcbiAgICAgICAgICAgICAgICAgICAgICBcIm1pbnV0ZShzKVwiLCBcImRheShzKVwiLFxuICAgICAgICAgICAgICAgICAgICAgIFwid2VlayhzKVwiLCBcIm1vbnRoKHMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgXCJ5ZWFyKHMpXCJcbiAgICAgICAgICAgICAgICAgICAgXSkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB2aXNpdE5vZGUuaW5mb1trZXldW2tleTJdLnNldChOYU4pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGtleSA9PT0gXCJwZXJpb2RpY2l0eVwiICYmIGtleTIgPT09IFwibWVzdXJlXCIpIHtcblxuICAgICAgICAgICAgICAgIHZpc2l0Tm9kZS5pbmZvW2tleV1ba2V5Ml0uc2V0KG5ldyBDaG9pY2UodmFsdWUyLCBbXG4gICAgICAgICAgICAgICAgICBcImRheShzKVwiLCBcIndlZWsocylcIixcbiAgICAgICAgICAgICAgICAgIFwibW9udGgocylcIixcbiAgICAgICAgICAgICAgICAgIFwieWVhcihzKVwiXG4gICAgICAgICAgICAgICAgXSkpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHR5cGVvZiB2YWx1ZTIgIT09IFwidW5kZWZpbmVkXCIgPyB2aXNpdE5vZGUuaW5mb1trZXldW2tleTJdLnNldChcbiAgICAgICAgICAgICAgICAgIHZhbHVlMikgOiB2aXNpdE5vZGUuaW5mb1trZXldW2tleTJdLnNldChOYU4pO1xuICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcblxuICB9XG5cbiAgZ2V0UHRyVmFsdWUobm9kZSwgcHRyTmFtZSkge1xuICAgIGxldCByZWFsTm9kZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRSZWFsTm9kZShub2RlLmlkLmdldCgpKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIGlmICghcmVhbE5vZGUuaW5mb1twdHJOYW1lXSkge1xuICAgICAgICByZWFsTm9kZS5pbmZvLmFkZF9hdHRyKHB0ck5hbWUsIHtcbiAgICAgICAgICB0YXNrczogbmV3IFB0cihuZXcgTHN0KCkpXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZWFsTm9kZS5pbmZvW3B0ck5hbWVdLnRhc2tzLmxvYWQodmFsdWUgPT4ge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZSh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldEdyb3VwVmlzaXRzKGdyb3VwSWQsIHZpc2l0eVR5cGUpIHtcbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKGdyb3VwSWQsIFt0aGlzLkdST1VQX1RPX1RBU0tdKS50aGVuKFxuICAgICAgcmVzID0+IHtcbiAgICAgICAgbGV0IG5vZGVJZDtcbiAgICAgICAgaWYgKHJlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBub2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgICAgICBuYW1lOiBcIm1haW50ZW5hbmNlXCJcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZChcbiAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICBub2RlSWQsXG4gICAgICAgICAgICB0aGlzLkdST1VQX1RPX1RBU0ssXG4gICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBub2RlID1cbiAgICAgICAgICB0eXBlb2Ygbm9kZUlkICE9PSBcInVuZGVmaW5lZFwiID9cbiAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhub2RlSWQpIDpcbiAgICAgICAgICByZXNbMF07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHRyVmFsdWUobm9kZSwgdmlzaXR5VHlwZSk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGdlbmVyYXRlRXZlbnQodmlzaXRUeXBlLCBncm91cElkLCBiZWdpbkRhdGUsIGVuZERhdGUsIGV2ZW50c0RhdGEpIHtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVWaXNpdENvbnRleHQodmlzaXRUeXBlKVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5saW5rR3JvdXBUb1Zpc3RDb250ZXh0KGVsLmlkLmdldCgpLCBncm91cElkKS50aGVuKFxuICAgICAgICAgIHJlcyA9PiB7XG4gICAgICAgICAgICBpZiAocmVzKSB7XG4gICAgICAgICAgICAgIHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoXG4gICAgICAgICAgICAgICAgZWwuaWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFUy5kZWNsYXJlZC50eXBlXG4gICAgICAgICAgICAgICkudGhlbihzdGF0ZU5vZGUgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBpZCA9IHN0YXRlTm9kZS5pZC5nZXQoKTtcblxuICAgICAgICAgICAgICAgIGV2ZW50c0RhdGEuZm9yRWFjaChldmVudEluZm8gPT4ge1xuICAgICAgICAgICAgICAgICAgbGV0IGV2ZW50c0RhdGUgPSB0aGlzLl9nZXREYXRlKFxuICAgICAgICAgICAgICAgICAgICBiZWdpbkRhdGUsXG4gICAgICAgICAgICAgICAgICAgIGVuZERhdGUsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50SW5mby5wZXJpb2ROdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50SW5mby5wZXJpb2RNZXN1cmVcbiAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgIGV2ZW50c0RhdGUuZm9yRWFjaChkYXRlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudChcbiAgICAgICAgICAgICAgICAgICAgICBlbC5pZC5nZXQoKSxcbiAgICAgICAgICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgICAgICAgICAgIGV2ZW50SW5mbyxcbiAgICAgICAgICAgICAgICAgICAgICBgJHtldmVudEluZm8ubmFtZX1gLFxuICAgICAgICAgICAgICAgICAgICAgIG5ldyBEYXRlKGRhdGUpLmdldFRpbWUoKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGVycik7XG4gICAgICB9KTtcbiAgfVxuXG4gIGFkZEV2ZW50KHZpc2l0VHlwZUNvbnRleHRJZCwgZ3JvdXBJZCwgc3RhdGVJZCwgdmlzaXRJbmZvLCBuYW1lLCBkYXRlKSB7XG4gICAgbGV0IHN0YXRlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8oc3RhdGVJZCkuc3RhdGUuZ2V0KCk7XG5cbiAgICBsZXQgZXZlbnQgPSBuZXcgRXZlbnRNb2RlbChuYW1lLCBkYXRlLCBzdGF0ZSwgZ3JvdXBJZCk7XG5cbiAgICBsZXQgZXZlbnROb2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgIGRhdGU6IGRhdGUsXG4gICAgICAgIHN0YXRlSWQ6IHN0YXRlSWQsXG4gICAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgICAgZ3JvdXBJZDogZ3JvdXBJZCxcbiAgICAgICAgdmlzaXRJZDogdmlzaXRJbmZvLmlkXG4gICAgICB9LFxuICAgICAgZXZlbnRcbiAgICApO1xuXG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dChcbiAgICAgICAgc3RhdGVJZCxcbiAgICAgICAgZXZlbnROb2RlSWQsXG4gICAgICAgIHZpc2l0VHlwZUNvbnRleHRJZCxcbiAgICAgICAgdGhpcy5FVkVOVF9TVEFURV9UT19FVkVOVF9SRUxBVElPTixcbiAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgKVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICBpZiAoZWwpIHJldHVybiBldmVudE5vZGVJZDtcbiAgICAgIH0pXG4gICAgICAudGhlbihldmVudElkID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudElkICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihncm91cElkLCBbXG4gICAgICAgICAgICBFUVVJUE1FTlRTX1RPX0VMRU1FTlRfUkVMQVRJT05cbiAgICAgICAgICBdKS50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgICAgICAgIGNoaWxkcmVuLm1hcChjaGlsZCA9PiB7XG4gICAgICAgICAgICAgIGxldCBuYW1lID0gYCR7Y2hpbGQubmFtZS5nZXQoKX1gO1xuICAgICAgICAgICAgICBsZXQgdGFzayA9IG5ldyBUYXNrTW9kZWwoXG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBjaGlsZC5kYmlkLmdldCgpLFxuICAgICAgICAgICAgICAgIGNoaWxkLmJpbUZpbGVJZC5nZXQoKSxcbiAgICAgICAgICAgICAgICB2aXNpdEluZm8ubmFtZSxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgbGV0IHRhc2tJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICAgICAgICB0eXBlOiBcInRhc2tcIixcbiAgICAgICAgICAgICAgICAgIGRiSWQ6IGNoaWxkLmRiaWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgICBiaW1GaWxlSWQ6IGNoaWxkLmJpbUZpbGVJZC5nZXQoKSxcbiAgICAgICAgICAgICAgICAgIHZpc2l0SWQ6IHZpc2l0SW5mby5pZCxcbiAgICAgICAgICAgICAgICAgIGV2ZW50SWQ6IGV2ZW50SWQsXG4gICAgICAgICAgICAgICAgICBncm91cElkOiBncm91cElkLFxuICAgICAgICAgICAgICAgICAgZG9uZTogZmFsc2VcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHRhc2tcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dChcbiAgICAgICAgICAgICAgICAgIGV2ZW50SWQsXG4gICAgICAgICAgICAgICAgICB0YXNrSWQsXG4gICAgICAgICAgICAgICAgICB2aXNpdFR5cGVDb250ZXh0SWQsXG4gICAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1RPX1RBU0tfUkVMQVRJT04sXG4gICAgICAgICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGQoXG4gICAgICAgICAgICAgICAgICB2aXNpdEluZm8uaWQsXG4gICAgICAgICAgICAgICAgICBldmVudElkLFxuICAgICAgICAgICAgICAgICAgdGhpcy5WSVNJVF9UT19FVkVOVF9SRUxBVElPTixcbiAgICAgICAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgY3JlYXRlVmlzaXRDb250ZXh0KHZpc2l0VHlwZSkge1xuICAgIGxldCB2aXNpdCA9IHRoaXMuVklTSVRTLmZpbmQoZWwgPT4ge1xuICAgICAgcmV0dXJuIGVsLnR5cGUgPT09IHZpc2l0VHlwZTtcbiAgICB9KTtcblxuICAgIGlmICh0eXBlb2YgdmlzaXQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGNvbnN0IGNvbnRleHROYW1lID0gYCR7dmlzaXQubmFtZX1gO1xuXG4gICAgICBsZXQgY29udGV4dCA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRDb250ZXh0KGNvbnRleHROYW1lKTtcbiAgICAgIGlmICh0eXBlb2YgY29udGV4dCAhPT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjb250ZXh0XG4gICAgICAgIC5pbmZvKTtcblxuICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDb250ZXh0KFxuICAgICAgICBjb250ZXh0TmFtZSxcbiAgICAgICAgdmlzaXRUeXBlLFxuICAgICAgICBuZXcgTW9kZWwoe1xuICAgICAgICAgIG5hbWU6IHRoaXMuVklTSVRfQ09OVEVYVF9OQU1FXG4gICAgICAgIH0pXG4gICAgICApLnRoZW4oY29udGV4dENyZWF0ZWQgPT4ge1xuICAgICAgICByZXR1cm4gY29udGV4dENyZWF0ZWQuaW5mbztcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXCJ2aXNpdE5vdEZvdW5kXCIpO1xuICAgIH1cbiAgfVxuXG4gIGxpbmtHcm91cFRvVmlzdENvbnRleHQodmlzaXRDb250ZXh0SWQsIGdyb3VwSWQpIHtcbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKHZpc2l0Q29udGV4dElkLCBbXG4gICAgICAgIHRoaXMuVklTSVRfVFlQRV9UT19HUk9VUF9SRUxBVElPTlxuICAgICAgXSlcbiAgICAgIC50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV0uaWQuZ2V0KCk7XG4gICAgICAgICAgaWYgKGNoaWxkID09PSBncm91cElkKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC50aGVuKGVsID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBlbCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGRJbkNvbnRleHQoXG4gICAgICAgICAgICB2aXNpdENvbnRleHRJZCxcbiAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICB2aXNpdENvbnRleHRJZCxcbiAgICAgICAgICAgIHRoaXMuVklTSVRfVFlQRV9UT19HUk9VUF9SRUxBVElPTixcbiAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICApLnRoZW4oYXN5bmMgcmVzID0+IHtcbiAgICAgICAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5nZXRFdmVudFN0YXRlTm9kZShcbiAgICAgICAgICAgICAgICB2aXNpdENvbnRleHRJZCxcbiAgICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICAgIHRoaXMuRVZFTlRfU1RBVEVTLnByb2Nlc3NpbmcudHlwZVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdldEV2ZW50U3RhdGVOb2RlKFxuICAgICAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICAgICAgdGhpcy5FVkVOVF9TVEFURVMuZG9uZS50eXBlXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIGdldEV2ZW50U3RhdGVOb2RlKHZpc2l0Q29udGV4dElkLCBncm91cElkLCBldmVudFNhdGUpIHtcbiAgICBsZXQgZXZlbnQgPSB0aGlzLl9ldmVudFNhdGVJc1ZhbGlkKGV2ZW50U2F0ZSk7XG5cbiAgICBpZiAodHlwZW9mIGV2ZW50ID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm47XG5cbiAgICBsZXQgY29udGV4dFR5cGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyh2aXNpdENvbnRleHRJZCkudHlwZS5nZXQoKTtcbiAgICBsZXQgcmVsYXRpb25OYW1lO1xuXG4gICAgc3dpdGNoIChjb250ZXh0VHlwZSkge1xuICAgICAgY2FzZSB0aGlzLk1BSU5URU5BTkNFX1ZJU0lUOlxuICAgICAgICByZWxhdGlvbk5hbWUgPSB0aGlzLk1BSU5URU5BTkNFX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdGhpcy5TRUNVUklUWV9WSVNJVDpcbiAgICAgICAgcmVsYXRpb25OYW1lID0gdGhpcy5TRUNVUklUWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIHRoaXMuRElBR05PU1RJQ19WSVNJVDpcbiAgICAgICAgcmVsYXRpb25OYW1lID0gdGhpcy5ESUFHTk9TVElDX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdGhpcy5SRUdVTEFUT1JZX1ZJU0lUOlxuICAgICAgICByZWxhdGlvbk5hbWUgPSB0aGlzLlJFR1VMQVRPUllfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT047XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oZ3JvdXBJZCwgW3JlbGF0aW9uTmFtZV0pXG4gICAgICAudGhlbihjaGlsZHJlbiA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBuYW1lID0gY2hpbGRyZW5baV0ubmFtZS5nZXQoKTtcbiAgICAgICAgICBjb25zdCB0eXBlID0gY2hpbGRyZW5baV0uc3RhdGUuZ2V0KCk7XG5cbiAgICAgICAgICBpZiAobmFtZSA9PT0gZXZlbnRTYXRlIHx8IHR5cGUgPT09IGV2ZW50U2F0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGNoaWxkcmVuW2ldO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC50aGVuKGVsID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBlbCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIGxldCBhcmdOb2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgICAgICBuYW1lOiBldmVudC5uYW1lLFxuICAgICAgICAgICAgc3RhdGU6IGV2ZW50LnR5cGUsXG4gICAgICAgICAgICBncm91cElkOiBncm91cElkLFxuICAgICAgICAgICAgdHlwZTogXCJFdmVudFN0YXRlXCJcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGRJbkNvbnRleHQoXG4gICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgYXJnTm9kZUlkLFxuICAgICAgICAgICAgdmlzaXRDb250ZXh0SWQsXG4gICAgICAgICAgICByZWxhdGlvbk5hbWUsXG4gICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgKS50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICBpZiAocmVzKSByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8oYXJnTm9kZUlkKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgdmFsaWRhdGVUYXNrKGNvbnRleHRJZCwgZ3JvdXBJZCwgZXZlbnRJZCwgdGFza0lkKSB7XG4gICAgbGV0IHRhc2tOb2RlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldFJlYWxOb2RlKHRhc2tJZCk7XG4gICAgdGFza05vZGUuaW5mby5kb25lLnNldCghdGFza05vZGUuaW5mby5kb25lLmdldCgpKTtcblxuICAgIGxldCBjdXJyZW50U3RhdGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKGV2ZW50SWQpLnN0YXRlSWQuZ2V0KCk7XG5cbiAgICByZXR1cm4gdGhpcy5fZ2V0U3RhdGUoY29udGV4dElkLCBncm91cElkLCBldmVudElkKS50aGVuKG5leHRTdGF0ZSA9PiB7XG5cbiAgICAgIGxldCBuZXh0U3RhdGVJZCA9IG5leHRTdGF0ZS5pZC5nZXQoKTtcblxuICAgICAgaWYgKG5leHRTdGF0ZUlkID09PSBjdXJyZW50U3RhdGVJZCkgcmV0dXJuIHRydWU7XG5cbiAgICAgIHJldHVybiB0aGlzLl9zd2l0Y2hFdmVudFN0YXRlKGV2ZW50SWQsIGN1cnJlbnRTdGF0ZUlkLCBuZXh0U3RhdGVJZCxcbiAgICAgICAgY29udGV4dElkKTtcblxuICAgIH0pO1xuXG4gIH1cblxuICByZW1vdmVWaXNpdEV2ZW50cyh2aXNpdElkLCByZW1vdmVSZWxhdGVkRXZlbnQpIHtcbiAgICBpZiAocmVtb3ZlUmVsYXRlZEV2ZW50KSB7XG4gICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKHZpc2l0SWQsIFt0aGlzXG4gICAgICAgIC5WSVNJVF9UT19FVkVOVF9SRUxBVElPTlxuICAgICAgXSkudGhlbigoY2hpbGRyZW4pID0+IHtcbiAgICAgICAgbGV0IGNoaWxkcmVuUHJvbWlzZSA9IGNoaWxkcmVuLm1hcChlbCA9PiB7XG4gICAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5yZW1vdmVGcm9tR3JhcGgoZWwuaWQuZ2V0KCkpO1xuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChjaGlsZHJlblByb21pc2UpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyh2aXNpdElkKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8odmlzaXRJZCkpO1xuICAgIH1cbiAgfVxuXG5cblxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgUFJJVkFURVMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gIF9nZXREYXRlKGJlZ2luRGF0ZSwgZW5kRGF0ZSwgcGVyaW9kTnVtYmVyLCBwZXJpb2RNZXN1cmUpIHtcbiAgICBsZXQgbWVzdXJlID0gW1wiZGF5c1wiLCBcIndlZWtzXCIsIFwibW9udGhzXCIsIFwieWVhcnNcIl1bcGVyaW9kTWVzdXJlXTtcblxuICAgIGxldCBldmVudHNEYXRlID0gW107XG5cbiAgICBsZXQgZGF0ZSA9IG1vbWVudChiZWdpbkRhdGUpO1xuICAgIGxldCBlbmQgPSBtb21lbnQoZW5kRGF0ZSk7XG5cbiAgICB3aGlsZSAoZW5kLmRpZmYoZGF0ZSkgPj0gMCkge1xuICAgICAgZXZlbnRzRGF0ZS5wdXNoKGRhdGUudG9EYXRlKCkpO1xuXG4gICAgICBkYXRlID0gZGF0ZS5hZGQocGVyaW9kTnVtYmVyLCBtZXN1cmUpO1xuICAgIH1cblxuICAgIHJldHVybiBldmVudHNEYXRlO1xuICB9XG5cbiAgX2Zvcm1hdERhdGUoYXJnRGF0ZSkge1xuICAgIGxldCBkYXRlID0gbmV3IERhdGUoYXJnRGF0ZSk7XG5cbiAgICByZXR1cm4gYCR7KCgpID0+IHtcbiAgICAgIGxldCBkID0gZGF0ZS5nZXREYXRlKCk7XG4gICAgICByZXR1cm4gZC50b1N0cmluZygpLmxlbmd0aCA+IDEgPyBkIDogJzAnICsgZDtcbiAgICB9KSgpfS8keygoKSA9PiB7XG5cbiAgICAgIGxldCBkID0gZGF0ZS5nZXRNb250aCgpICsgMTtcbiAgICAgIHJldHVybiBkLnRvU3RyaW5nKCkubGVuZ3RoID4gMSA/IGQgOiAnMCcgKyBkO1xuXG4gICAgfSkoKX0vJHtkYXRlLmdldEZ1bGxZZWFyKCl9YDtcbiAgfVxuXG4gIF9ldmVudFNhdGVJc1ZhbGlkKGV2ZW50U3RhdGUpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLkVWRU5UX1NUQVRFUykge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLkVWRU5UX1NUQVRFU1trZXldLm5hbWUgPT09IGV2ZW50U3RhdGUgfHxcbiAgICAgICAgdGhpcy5FVkVOVF9TVEFURVNba2V5XS50eXBlID09PSBldmVudFN0YXRlXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuRVZFTlRfU1RBVEVTW2tleV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIF9nZXRTdGF0ZShjb250ZXh0SWQsIGdyb3VwSWQsIGV2ZW50SWQpIHtcblxuICAgIHJldHVybiB0aGlzLmdldEV2ZW50VGFza3MoZXZlbnRJZCkudGhlbih0YXNrcyA9PiB7XG4gICAgICBsZXQgdGFza3NWYWxpZGF0ZWQgPSB0YXNrcy5maWx0ZXIoZWwgPT4gZWwuZG9uZSk7XG4gICAgICBsZXQgc3RhdGVPYmo7XG5cbiAgICAgIGlmICh0YXNrc1ZhbGlkYXRlZC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgc3RhdGVPYmogPSB0aGlzLkVWRU5UX1NUQVRFUy5kZWNsYXJlZDtcbiAgICAgIH0gZWxzZSBpZiAodGFza3NWYWxpZGF0ZWQubGVuZ3RoID09PSB0YXNrcy5sZW5ndGgpIHtcbiAgICAgICAgc3RhdGVPYmogPSB0aGlzLkVWRU5UX1NUQVRFUy5kb25lO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGVPYmogPSB0aGlzLkVWRU5UX1NUQVRFUy5wcm9jZXNzaW5nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5nZXRFdmVudFN0YXRlTm9kZShjb250ZXh0SWQsIGdyb3VwSWQsIHN0YXRlT2JqLnR5cGUpO1xuXG4gICAgfSlcblxuICB9XG5cbiAgX3N3aXRjaEV2ZW50U3RhdGUoZXZlbnRJZCwgZnJvbVN0YXRlSWQsIHRvU3RhdGVJZCwgY29udGV4dElkKSB7XG5cblxuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UucmVtb3ZlQ2hpbGQoZnJvbVN0YXRlSWQsIGV2ZW50SWQsIHRoaXNcbiAgICAgICAgLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OLCBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFKVxuICAgICAgLnRoZW4ocmVtb3ZlZCA9PiB7XG4gICAgICAgIGlmIChyZW1vdmVkKSB7XG4gICAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dCh0b1N0YXRlSWQsIGV2ZW50SWQsXG4gICAgICAgICAgICAgIGNvbnRleHRJZCxcbiAgICAgICAgICAgICAgdGhpcy5FVkVOVF9TVEFURV9UT19FVkVOVF9SRUxBVElPTixcbiAgICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRSlcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgbGV0IEV2ZW50Tm9kZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRSZWFsTm9kZShldmVudElkKTtcbiAgICAgICAgICAgICAgICBsZXQgbmV3U3RhdGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyh0b1N0YXRlSWQpLnN0YXRlXG4gICAgICAgICAgICAgICAgICAuZ2V0KCk7XG5cblxuICAgICAgICAgICAgICAgIEV2ZW50Tm9kZS5pbmZvLnN0YXRlLnNldChuZXdTdGF0ZSk7XG4gICAgICAgICAgICAgICAgRXZlbnROb2RlLmluZm8uc3RhdGVJZC5zZXQodG9TdGF0ZUlkKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9KVxuXG5cbiAgfVxuXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyAgICAgICAgICAgICAgICAgICAgICAgIEdFVCBJTkZPUk1BVElPTiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgZ2V0VmlzaXRHcm91cHModmlzaXRUeXBlKSB7XG4gICAgbGV0IGNvbnRleHRzID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENvbnRleHRXaXRoVHlwZSh2aXNpdFR5cGUpO1xuICAgIGlmIChjb250ZXh0cy5sZW5ndGggPT09IDApIHJldHVybiBbXTtcblxuICAgIGxldCBjb250ZXh0SWQgPSBjb250ZXh0c1swXS5pbmZvLmlkLmdldCgpO1xuXG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihcbiAgICAgIGNvbnRleHRJZCxcbiAgICAgIHRoaXMuVklTSVRfVFlQRV9UT19HUk9VUF9SRUxBVElPTlxuICAgICkudGhlbihyZXMgPT4ge1xuICAgICAgcmV0dXJuIHJlcy5tYXAoZWwgPT4gZWwuZ2V0KCkpO1xuICAgIH0pO1xuICB9XG5cblxuICBnZXRHcm91cEV2ZW50U3RhdGVzKGNvbnRleHRJZCwgZ3JvdXBJZCkge1xuICAgIGxldCBwcm9taXNlcyA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5FVkVOVF9TVEFURVMpIHtcbiAgICAgIHByb21pc2VzLnB1c2goXG4gICAgICAgIHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoXG4gICAgICAgICAgY29udGV4dElkLFxuICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgdGhpcy5FVkVOVF9TVEFURVNba2V5XS50eXBlXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcbiAgfVxuXG4gIGdldEdyb3VwRXZlbnRzKFxuICAgIGdyb3VwSWQsXG4gICAgVklTSVRfVFlQRVMgPSBbXG4gICAgICB0aGlzLk1BSU5URU5BTkNFX1ZJU0lULFxuICAgICAgdGhpcy5SRUdVTEFUT1JZX1ZJU0lULFxuICAgICAgdGhpcy5TRUNVUklUWV9WSVNJVCxcbiAgICAgIHRoaXMuRElBR05PU1RJQ19WSVNJVFxuICAgIF1cbiAgKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KFZJU0lUX1RZUEVTKSkgVklTSVRfVFlQRVMgPSBbVklTSVRfVFlQRVNdO1xuXG4gICAgcmV0dXJuIFZJU0lUX1RZUEVTLm1hcCh2aXNpdFR5cGUgPT4ge1xuICAgICAgbGV0IHZpc2l0ID0gdGhpcy5WSVNJVFMuZmluZChlbCA9PiB7XG4gICAgICAgIHJldHVybiBlbC50eXBlID09PSB2aXNpdFR5cGU7XG4gICAgICB9KTtcblxuICAgICAgbGV0IGNvbnRleHQgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q29udGV4dCh2aXNpdC5uYW1lKTtcblxuICAgICAgaWYgKHR5cGVvZiBjb250ZXh0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGxldCBjb250ZXh0SWQgPSBjb250ZXh0LmluZm8uaWQuZ2V0KCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JvdXBFdmVudFN0YXRlcyhjb250ZXh0SWQsIGdyb3VwSWQpLnRoZW4oXG4gICAgICAgICAgdmFsdWVzID0+IHtcbiAgICAgICAgICAgIGxldCBwcm9tID0gdmFsdWVzLm1hcChhc3luYyBldmVudFR5cGUgPT4ge1xuICAgICAgICAgICAgICBsZXQgcmVzID0gZXZlbnRUeXBlLmdldCgpO1xuXG4gICAgICAgICAgICAgIHJlc1tcInZpc2l0X3R5cGVcIl0gPSB2aXNpdFR5cGU7XG5cbiAgICAgICAgICAgICAgbGV0IGV2ZW50cyA9IGF3YWl0IFNwaW5hbEdyYXBoU2VydmljZVxuICAgICAgICAgICAgICAgIC5nZXRDaGlsZHJlbihcbiAgICAgICAgICAgICAgICAgIHJlcy5pZCwgW1xuICAgICAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OXG4gICAgICAgICAgICAgICAgICBdKTtcblxuICAgICAgICAgICAgICByZXNbXCJldmVudHNcIl0gPSBldmVudHMubWFwKGVsID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwuZ2V0KCk7XG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb20pLnRoZW4oYWxsRXZlbnRzID0+IHtcbiAgICAgICAgICAgICAgbGV0IHZhbHVlcyA9IHt9O1xuXG4gICAgICAgICAgICAgIGFsbEV2ZW50cy5mb3JFYWNoKHZhbCA9PiB7XG4gICAgICAgICAgICAgICAgdmFsdWVzW3ZhbC5zdGF0ZV0gPSB2YWwuZXZlbnRzO1xuICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIFt2aXNpdFR5cGVdOiB2YWx1ZXNcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZ2V0RXZlbnRUYXNrcyhldmVudElkKSB7XG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihldmVudElkLCBbdGhpc1xuICAgICAgICAuRVZFTlRfVE9fVEFTS19SRUxBVElPTlxuICAgICAgXSlcbiAgICAgIC50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgICAgcmV0dXJuIGNoaWxkcmVuLm1hcChlbCA9PiBlbC5nZXQoKSlcbiAgICAgIH0pXG4gIH1cblxufVxuXG5sZXQgc3BpbmFsVmlzaXRTZXJ2aWNlID0gbmV3IFNwaW5hbFZpc2l0U2VydmljZSgpO1xuXG5leHBvcnQgZGVmYXVsdCBzcGluYWxWaXNpdFNlcnZpY2U7Il19