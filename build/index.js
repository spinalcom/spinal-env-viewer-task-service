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

  // deleteVisit(visitId, removeRelatedEvent) {
  //   return this.removeVisitEvents(visitId, removeRelatedEvent).then((
  //     info) => {

  //     if (info) {
  //       let groupId = info.groupId.get();
  //       let visitContextType = info.visitType.get();

  //       return this.getGroupVisits(groupId, visitContextType).then(
  //         res => {
  //           for (let index = 0; index < res.length; index++) {
  //             const resVisitId = res[index].info.id.get();
  //             if (resVisitId == visitId) {
  //               res.remove(res[index]);
  //               return true;
  //             }
  //           }
  //           return false;
  //         })
  //     } else {
  //       return false;
  //     }

  //   })
  // }

  deleteVisit(visitId, removeVisit, removeRelatedEvent, beginDate, endDate) {

    if (removeRelatedEvent) {
      this.removeVisitEvents(visitId, beginDate, endDate).then(el => {
        if (removeVisit) {
          return this.removeVisit(visitId);
        }
        return el;
      });
    } else if (removeVisit) {
      return this.removeVisit(visitId);
    }
  }

  removeVisitEvents(visitId, beginDate, endDate) {
    // if (removeRelatedEvent) {
    //   return SpinalGraphService.getChildren(visitId, [this
    //     .VISIT_TO_EVENT_RELATION
    //   ]).then((children) => {
    //     let childrenPromise = children.map(el => {
    //       return SpinalGraphService.removeFromGraph(el.id.get());
    //     })

    //     return Promise.all(childrenPromise).then(() => {
    //       return SpinalGraphService.getInfo(visitId);
    //     });

    //   })
    // } else {
    //   return Promise.resolve(SpinalGraphService.getInfo(visitId));
    // }

    return this.getEventsBetweenTwoDate(visitId, beginDate, endDate).then(events => {
      events.forEach(el => {
        _spinalEnvViewerGraphService.SpinalGraphService.removeFromGraph(el.id);
      });

      return true;
    });
  }

  getEventsBetweenTwoDate(visitId, beginDate, endDate) {

    return _spinalEnvViewerGraphService.SpinalGraphService.getChildren(visitId, [this.VISIT_TO_EVENT_RELATION]).then(children => {

      children = children.map(el => el.get());

      return children.filter(el => {
        return el.date >= beginDate && el.date <= endDate;
      });
    });
  }

  removeVisit(visitId) {
    let info = _spinalEnvViewerGraphService.SpinalGraphService.getInfo(visitId);
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
      return Promise.resolve(false);
    }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJTcGluYWxWaXNpdFNlcnZpY2UiLCJjb25zdHJ1Y3RvciIsIlZJU0lUX0NPTlRFWFRfTkFNRSIsIkNPTlRFWFRfVFlQRSIsIlZJU0lUX1RZUEUiLCJNQUlOVEVOQU5DRV9WSVNJVCIsIlJFR1VMQVRPUllfVklTSVQiLCJTRUNVUklUWV9WSVNJVCIsIkRJQUdOT1NUSUNfVklTSVQiLCJFVkVOVF9TVEFURVMiLCJPYmplY3QiLCJmcmVlemUiLCJkZWNsYXJlZCIsIm5hbWUiLCJ0eXBlIiwicHJvY2Vzc2luZyIsImRvbmUiLCJWSVNJVFMiLCJNQUlOVEVOQU5DRV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIlJFR1VMQVRPUllfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJTRUNVUklUWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJHUk9VUF9UT19UQVNLIiwiVklTSVRfVE9fRVZFTlRfUkVMQVRJT04iLCJWSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OIiwiRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04iLCJFVkVOVF9UT19UQVNLX1JFTEFUSU9OIiwiZ2V0QWxsVmlzaXRzIiwiYWRkVmlzaXRPbkdyb3VwIiwiZ3JvdXBJZCIsInZpc2l0TmFtZSIsInBlcmlvZGljaXR5TnVtYmVyIiwicGVyaW9kaWNpdHlNZXN1cmUiLCJ2aXNpdFR5cGUiLCJpbnRlcnZlbnRpb25OdW1iZXIiLCJpbnRlcnZlbnRpb25NZXN1cmUiLCJkZXNjcmlwdGlvbiIsIlNwaW5hbEdyYXBoU2VydmljZSIsImdldENoaWxkcmVuIiwidGhlbiIsImNoaWxkcmVuIiwiYXJnTm9kZUlkIiwibGVuZ3RoIiwiY3JlYXRlTm9kZSIsImFkZENoaWxkIiwiU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRSIsIm5vZGUiLCJnZXRJbmZvIiwiZ2V0UHRyVmFsdWUiLCJsc3QiLCJ0YXNrIiwiVmlzaXRNb2RlbCIsIm5vZGVJZCIsInBlcmlvZGljaXR5IiwibnVtYmVyIiwiZ2V0IiwibWVzdXJlIiwiaW50ZXJ2ZW50aW9uIiwicmVhbE5vZGUiLCJnZXRSZWFsTm9kZSIsInB1c2giLCJpbmZvIiwiZGVsZXRlVmlzaXQiLCJ2aXNpdElkIiwicmVtb3ZlVmlzaXQiLCJyZW1vdmVSZWxhdGVkRXZlbnQiLCJiZWdpbkRhdGUiLCJlbmREYXRlIiwicmVtb3ZlVmlzaXRFdmVudHMiLCJlbCIsImdldEV2ZW50c0JldHdlZW5Ud29EYXRlIiwiZXZlbnRzIiwiZm9yRWFjaCIsInJlbW92ZUZyb21HcmFwaCIsImlkIiwibWFwIiwiZmlsdGVyIiwiZGF0ZSIsInZpc2l0Q29udGV4dFR5cGUiLCJnZXRHcm91cFZpc2l0cyIsInJlcyIsImluZGV4IiwicmVzVmlzaXRJZCIsInJlbW92ZSIsIlByb21pc2UiLCJyZXNvbHZlIiwiZWRpdFZpc2l0IiwibmV3VmFsdWVzT2JqIiwidmlzaXROb2RlIiwia2V5IiwidmFsdWUiLCJzZXQiLCJrZXkyIiwidmFsdWUyIiwiQ2hvaWNlIiwiTmFOIiwicHRyTmFtZSIsImFkZF9hdHRyIiwidGFza3MiLCJQdHIiLCJMc3QiLCJsb2FkIiwidmlzaXR5VHlwZSIsImdlbmVyYXRlRXZlbnQiLCJldmVudHNEYXRhIiwiY3JlYXRlVmlzaXRDb250ZXh0IiwibGlua0dyb3VwVG9WaXN0Q29udGV4dCIsImdldEV2ZW50U3RhdGVOb2RlIiwic3RhdGVOb2RlIiwiZXZlbnRJbmZvIiwiZXZlbnRzRGF0ZSIsIl9nZXREYXRlIiwicGVyaW9kTnVtYmVyIiwicGVyaW9kTWVzdXJlIiwiYWRkRXZlbnQiLCJEYXRlIiwiZ2V0VGltZSIsImNhdGNoIiwiZXJyIiwiY29uc29sZSIsImxvZyIsInZpc2l0VHlwZUNvbnRleHRJZCIsInN0YXRlSWQiLCJ2aXNpdEluZm8iLCJzdGF0ZSIsImV2ZW50IiwiRXZlbnRNb2RlbCIsImV2ZW50Tm9kZUlkIiwiYWRkQ2hpbGRJbkNvbnRleHQiLCJldmVudElkIiwiRVFVSVBNRU5UU19UT19FTEVNRU5UX1JFTEFUSU9OIiwiY2hpbGQiLCJUYXNrTW9kZWwiLCJkYmlkIiwiYmltRmlsZUlkIiwidGFza0lkIiwiZGJJZCIsImFsbCIsInZpc2l0IiwiZmluZCIsImNvbnRleHROYW1lIiwiY29udGV4dCIsImdldENvbnRleHQiLCJhZGRDb250ZXh0IiwiTW9kZWwiLCJjb250ZXh0Q3JlYXRlZCIsInJlamVjdCIsInZpc2l0Q29udGV4dElkIiwiaSIsImV2ZW50U2F0ZSIsIl9ldmVudFNhdGVJc1ZhbGlkIiwiY29udGV4dFR5cGUiLCJyZWxhdGlvbk5hbWUiLCJ2YWxpZGF0ZVRhc2siLCJjb250ZXh0SWQiLCJ0YXNrTm9kZSIsImN1cnJlbnRTdGF0ZUlkIiwiX2dldFN0YXRlIiwibmV4dFN0YXRlIiwibmV4dFN0YXRlSWQiLCJfc3dpdGNoRXZlbnRTdGF0ZSIsImVuZCIsImRpZmYiLCJ0b0RhdGUiLCJhZGQiLCJfZm9ybWF0RGF0ZSIsImFyZ0RhdGUiLCJkIiwiZ2V0RGF0ZSIsInRvU3RyaW5nIiwiZ2V0TW9udGgiLCJnZXRGdWxsWWVhciIsImV2ZW50U3RhdGUiLCJ1bmRlZmluZWQiLCJnZXRFdmVudFRhc2tzIiwidGFza3NWYWxpZGF0ZWQiLCJzdGF0ZU9iaiIsImZyb21TdGF0ZUlkIiwidG9TdGF0ZUlkIiwicmVtb3ZlQ2hpbGQiLCJyZW1vdmVkIiwiRXZlbnROb2RlIiwibmV3U3RhdGUiLCJnZXRWaXNpdEdyb3VwcyIsImNvbnRleHRzIiwiZ2V0Q29udGV4dFdpdGhUeXBlIiwiZ2V0R3JvdXBFdmVudFN0YXRlcyIsInByb21pc2VzIiwiZ2V0R3JvdXBFdmVudHMiLCJWSVNJVF9UWVBFUyIsIkFycmF5IiwiaXNBcnJheSIsInZhbHVlcyIsInByb20iLCJldmVudFR5cGUiLCJhbGxFdmVudHMiLCJ2YWwiLCJzcGluYWxWaXNpdFNlcnZpY2UiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOztBQUtBOztBQUlBOzs7O0FBQ0E7Ozs7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a0JBQUksUUFBSixJQUFnQlQsT0FBT0ksR0FBUCxDQUFXLGNBQU07QUFDL0IsdUJBQU9OLEdBQUdkLEdBQUgsRUFBUDtBQUNELGVBRmUsQ0FBaEI7O0FBSUEscUJBQU95QixHQUFQO0FBQ0QsYUFoQlU7O0FBQUE7QUFBQTtBQUFBO0FBQUEsZUFBWDs7QUFrQkEsaUJBQU9JLFFBQVFxRCxHQUFSLENBQVl3RCxJQUFaLEVBQWtCMUosSUFBbEIsQ0FBdUI0SixhQUFhO0FBQ3pDLGdCQUFJSCxTQUFTLEVBQWI7O0FBRUFHLHNCQUFVM0gsT0FBVixDQUFrQjRILE9BQU87QUFDdkJKLHFCQUFPSSxJQUFJeEUsS0FBWCxJQUFvQndFLElBQUk3SCxNQUF4QjtBQUNELGFBRkQ7O0FBSUEsbUJBQU87QUFDTCxlQUFDdEMsU0FBRCxHQUFhK0o7QUFEUixhQUFQO0FBR0QsV0FWTSxDQUFQO0FBV0QsU0EvQkksQ0FBUDtBQWdDRDtBQUNGLEtBM0NNLENBQVA7QUE0Q0Q7O0FBRURsQixnQkFBYzdDLE9BQWQsRUFBdUI7QUFDckIsV0FBTzVGLGdEQUFtQkMsV0FBbkIsQ0FBK0IyRixPQUEvQixFQUF3QyxDQUFDLEtBQzNDdkcsc0JBRDBDLENBQXhDLEVBR0phLElBSEksQ0FHQ0MsWUFBWTtBQUNoQixhQUFPQSxTQUFTbUMsR0FBVCxDQUFhTixNQUFNQSxHQUFHZCxHQUFILEVBQW5CLENBQVA7QUFDRCxLQUxJLENBQVA7QUFNRDs7QUFoekJzQjs7QUFvekJ6QixJQUFJOEkscUJBQXFCLElBQUlyTSxrQkFBSixFQUF6Qjs7a0JBRWVxTSxrQiIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEUsXG4gIFNwaW5hbEdyYXBoU2VydmljZVxufSBmcm9tIFwic3BpbmFsLWVudi12aWV3ZXItZ3JhcGgtc2VydmljZVwiO1xuXG5pbXBvcnQge1xuICBFUVVJUE1FTlRTX1RPX0VMRU1FTlRfUkVMQVRJT05cbn0gZnJvbSBcInNwaW5hbC1lbnYtdmlld2VyLXJvb20tbWFuYWdlci9qcy9zZXJ2aWNlXCI7XG5cbmltcG9ydCBWaXNpdE1vZGVsIGZyb20gXCIuL21vZGVscy92aXNpdC5tb2RlbC5qc1wiO1xuaW1wb3J0IEV2ZW50TW9kZWwgZnJvbSBcIi4vbW9kZWxzL2V2ZW50Lm1vZGVsLmpzXCI7XG5pbXBvcnQgVGFza01vZGVsIGZyb20gXCIuL21vZGVscy90YXNrLm1vZGVsLmpzXCI7XG5cbmltcG9ydCB7XG4gIFB0cixcbiAgTHN0LFxuICBNb2RlbFxufSBmcm9tIFwic3BpbmFsLWNvcmUtY29ubmVjdG9yanNfdHlwZVwiO1xuXG5pbXBvcnQgbW9tZW50IGZyb20gXCJtb21lbnRcIjtcblxuY2xhc3MgU3BpbmFsVmlzaXRTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5WSVNJVF9DT05URVhUX05BTUUgPSBcIi52aXNpdF9jb250ZXh0XCI7XG4gICAgdGhpcy5DT05URVhUX1RZUEUgPSBcInZpc2l0X2NvbnRleHRcIjtcblxuICAgIHRoaXMuVklTSVRfVFlQRSA9IFwidmlzaXRcIjtcblxuICAgIHRoaXMuTUFJTlRFTkFOQ0VfVklTSVQgPSBcIk1BSU5URU5BTkNFX1ZJU0lUXCI7XG4gICAgdGhpcy5SRUdVTEFUT1JZX1ZJU0lUID0gXCJSRUdVTEFUT1JZX1ZJU0lUXCI7XG4gICAgdGhpcy5TRUNVUklUWV9WSVNJVCA9IFwiU0VDVVJJVFlfVklTSVRcIjtcbiAgICB0aGlzLkRJQUdOT1NUSUNfVklTSVQgPSBcIkRJQUdOT1NUSUNfVklTSVRcIjtcblxuICAgIHRoaXMuRVZFTlRfU1RBVEVTID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgICBkZWNsYXJlZDoge1xuICAgICAgICBuYW1lOiBcImTDqWNsYXLDqVwiLFxuICAgICAgICB0eXBlOiBcImRlY2xhcmVkXCJcbiAgICAgIH0sXG4gICAgICBwcm9jZXNzaW5nOiB7XG4gICAgICAgIG5hbWU6IFwiZW5jb3Vyc1wiLFxuICAgICAgICB0eXBlOiBcInByb2Nlc3NpbmdcIlxuICAgICAgfSxcbiAgICAgIGRvbmU6IHtcbiAgICAgICAgbmFtZTogXCLDqWZmZWN0dcOpXCIsXG4gICAgICAgIHR5cGU6IFwiZG9uZVwiXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLlZJU0lUUyA9IE9iamVjdC5mcmVlemUoW3tcbiAgICAgIHR5cGU6IHRoaXMuTUFJTlRFTkFOQ0VfVklTSVQsXG4gICAgICBuYW1lOiBcIlZpc2l0ZSBkZSBtYWludGVuYW5jZVwiXG4gICAgfSwge1xuICAgICAgdHlwZTogdGhpcy5SRUdVTEFUT1JZX1ZJU0lULFxuICAgICAgbmFtZTogXCJWaXNpdGUgcmVnbGVtZW50YWlyZVwiXG4gICAgfSwge1xuICAgICAgdHlwZTogdGhpcy5TRUNVUklUWV9WSVNJVCxcbiAgICAgIG5hbWU6IFwiVmlzaXRlIGRlIHNlY3VyaXRlXCJcbiAgICB9LCB7XG4gICAgICB0eXBlOiB0aGlzLkRJQUdOT1NUSUNfVklTSVQsXG4gICAgICBuYW1lOiBcIlZpc2l0ZSBkZSBkaWFnbm9zdGljXCJcbiAgICB9XSk7XG5cblxuICAgIHRoaXMuTUFJTlRFTkFOQ0VfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04gPVxuICAgICAgXCJtYWludGVuYW5jZVZpc2l0aGFzRXZlbnRTdGF0ZVwiO1xuXG4gICAgdGhpcy5SRUdVTEFUT1JZX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OID1cbiAgICAgIFwicmVndWxhdG9yeVZpc2l0aGFzRXZlbnRTdGF0ZVwiO1xuXG4gICAgdGhpcy5TRUNVUklUWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiA9IFwic2VjdXJpdHlWaXNpdGhhc0V2ZW50U3RhdGVcIjtcblxuICAgIHRoaXMuRElBR05PU1RJQ19WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiA9XG4gICAgICBcImRpYWdub3N0aWNWaXNpdGhhc0V2ZW50U3RhdGVcIjtcblxuICAgIHRoaXMuR1JPVVBfVE9fVEFTSyA9IFwiaGFzVmlzaXRcIjtcblxuICAgIHRoaXMuVklTSVRfVE9fRVZFTlRfUkVMQVRJT04gPSBcInZpc2l0SGFzRXZlbnRcIjtcblxuICAgIHRoaXMuVklTSVRfVFlQRV9UT19HUk9VUF9SRUxBVElPTiA9IFwidmlzaXRIYXNHcm91cFwiO1xuICAgIHRoaXMuRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04gPSBcImhhc0V2ZW50XCI7XG4gICAgdGhpcy5FVkVOVF9UT19UQVNLX1JFTEFUSU9OID0gXCJoYXNUYXNrXCI7XG4gIH1cblxuICBnZXRBbGxWaXNpdHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuVklTSVRTO1xuICB9XG5cbiAgYWRkVmlzaXRPbkdyb3VwKFxuICAgIGdyb3VwSWQsXG4gICAgdmlzaXROYW1lLFxuICAgIHBlcmlvZGljaXR5TnVtYmVyLFxuICAgIHBlcmlvZGljaXR5TWVzdXJlLFxuICAgIHZpc2l0VHlwZSxcbiAgICBpbnRlcnZlbnRpb25OdW1iZXIsXG4gICAgaW50ZXJ2ZW50aW9uTWVzdXJlLFxuICAgIGRlc2NyaXB0aW9uXG4gICkge1xuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oZ3JvdXBJZCwgW3RoaXMuR1JPVVBfVE9fVEFTS10pLnRoZW4oXG4gICAgICBjaGlsZHJlbiA9PiB7XG4gICAgICAgIGxldCBhcmdOb2RlSWQ7XG4gICAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBhcmdOb2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgICAgICBuYW1lOiBcIm1haW50ZW5hbmNlXCJcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZChcbiAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICBhcmdOb2RlSWQsXG4gICAgICAgICAgICB0aGlzLkdST1VQX1RPX1RBU0ssXG4gICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBub2RlID1cbiAgICAgICAgICB0eXBlb2YgYXJnTm9kZUlkICE9PSBcInVuZGVmaW5lZFwiID9cbiAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhhcmdOb2RlSWQpIDpcbiAgICAgICAgICBjaGlsZHJlblswXTtcblxuICAgICAgICByZXR1cm4gdGhpcy5nZXRQdHJWYWx1ZShub2RlLCB2aXNpdFR5cGUpLnRoZW4obHN0ID0+IHtcbiAgICAgICAgICBsZXQgdGFzayA9IG5ldyBWaXNpdE1vZGVsKFxuICAgICAgICAgICAgdmlzaXROYW1lLFxuICAgICAgICAgICAgcGVyaW9kaWNpdHlOdW1iZXIsXG4gICAgICAgICAgICBwZXJpb2RpY2l0eU1lc3VyZSxcbiAgICAgICAgICAgIHZpc2l0VHlwZSxcbiAgICAgICAgICAgIGludGVydmVudGlvbk51bWJlcixcbiAgICAgICAgICAgIGludGVydmVudGlvbk1lc3VyZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGxldCBub2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgICAgICAgIGdyb3VwSWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICAgIG5hbWU6IHZpc2l0TmFtZSxcbiAgICAgICAgICAgICAgcGVyaW9kaWNpdHk6IHtcbiAgICAgICAgICAgICAgICBudW1iZXI6IHRhc2sucGVyaW9kaWNpdHkubnVtYmVyLmdldCgpLFxuICAgICAgICAgICAgICAgIG1lc3VyZTogdGFzay5wZXJpb2RpY2l0eS5tZXN1cmVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgaW50ZXJ2ZW50aW9uOiB7XG4gICAgICAgICAgICAgICAgbnVtYmVyOiB0YXNrLmludGVydmVudGlvbi5udW1iZXIuZ2V0KCksXG4gICAgICAgICAgICAgICAgbWVzdXJlOiB0YXNrLmludGVydmVudGlvbi5tZXN1cmVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgdmlzaXRUeXBlOiB2aXNpdFR5cGUsXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRhc2tcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbGV0IHJlYWxOb2RlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldFJlYWxOb2RlKG5vZGVJZCk7XG5cbiAgICAgICAgICBsc3QucHVzaChyZWFsTm9kZSk7XG5cbiAgICAgICAgICByZXR1cm4gcmVhbE5vZGUuaW5mbztcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIC8vIGRlbGV0ZVZpc2l0KHZpc2l0SWQsIHJlbW92ZVJlbGF0ZWRFdmVudCkge1xuICAvLyAgIHJldHVybiB0aGlzLnJlbW92ZVZpc2l0RXZlbnRzKHZpc2l0SWQsIHJlbW92ZVJlbGF0ZWRFdmVudCkudGhlbigoXG4gIC8vICAgICBpbmZvKSA9PiB7XG5cbiAgLy8gICAgIGlmIChpbmZvKSB7XG4gIC8vICAgICAgIGxldCBncm91cElkID0gaW5mby5ncm91cElkLmdldCgpO1xuICAvLyAgICAgICBsZXQgdmlzaXRDb250ZXh0VHlwZSA9IGluZm8udmlzaXRUeXBlLmdldCgpO1xuXG4gIC8vICAgICAgIHJldHVybiB0aGlzLmdldEdyb3VwVmlzaXRzKGdyb3VwSWQsIHZpc2l0Q29udGV4dFR5cGUpLnRoZW4oXG4gIC8vICAgICAgICAgcmVzID0+IHtcbiAgLy8gICAgICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCByZXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gIC8vICAgICAgICAgICAgIGNvbnN0IHJlc1Zpc2l0SWQgPSByZXNbaW5kZXhdLmluZm8uaWQuZ2V0KCk7XG4gIC8vICAgICAgICAgICAgIGlmIChyZXNWaXNpdElkID09IHZpc2l0SWQpIHtcbiAgLy8gICAgICAgICAgICAgICByZXMucmVtb3ZlKHJlc1tpbmRleF0pO1xuICAvLyAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAvLyAgICAgICAgICAgICB9XG4gIC8vICAgICAgICAgICB9XG4gIC8vICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gIC8vICAgICAgICAgfSlcbiAgLy8gICAgIH0gZWxzZSB7XG4gIC8vICAgICAgIHJldHVybiBmYWxzZTtcbiAgLy8gICAgIH1cblxuICAvLyAgIH0pXG4gIC8vIH1cblxuICBkZWxldGVWaXNpdCh2aXNpdElkLCByZW1vdmVWaXNpdCwgcmVtb3ZlUmVsYXRlZEV2ZW50LCBiZWdpbkRhdGUsIGVuZERhdGUpIHtcblxuICAgIGlmIChyZW1vdmVSZWxhdGVkRXZlbnQpIHtcbiAgICAgIHRoaXMucmVtb3ZlVmlzaXRFdmVudHModmlzaXRJZCwgYmVnaW5EYXRlLCBlbmREYXRlKS50aGVuKGVsID0+IHtcbiAgICAgICAgaWYgKHJlbW92ZVZpc2l0KSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlVmlzaXQodmlzaXRJZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgfSlcbiAgICB9IGVsc2UgaWYgKHJlbW92ZVZpc2l0KSB7XG4gICAgICByZXR1cm4gdGhpcy5yZW1vdmVWaXNpdCh2aXNpdElkKTtcbiAgICB9XG5cbiAgfVxuXG4gIHJlbW92ZVZpc2l0RXZlbnRzKHZpc2l0SWQsIGJlZ2luRGF0ZSwgZW5kRGF0ZSkge1xuICAgIC8vIGlmIChyZW1vdmVSZWxhdGVkRXZlbnQpIHtcbiAgICAvLyAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4odmlzaXRJZCwgW3RoaXNcbiAgICAvLyAgICAgLlZJU0lUX1RPX0VWRU5UX1JFTEFUSU9OXG4gICAgLy8gICBdKS50aGVuKChjaGlsZHJlbikgPT4ge1xuICAgIC8vICAgICBsZXQgY2hpbGRyZW5Qcm9taXNlID0gY2hpbGRyZW4ubWFwKGVsID0+IHtcbiAgICAvLyAgICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLnJlbW92ZUZyb21HcmFwaChlbC5pZC5nZXQoKSk7XG4gICAgLy8gICAgIH0pXG5cbiAgICAvLyAgICAgcmV0dXJuIFByb21pc2UuYWxsKGNoaWxkcmVuUHJvbWlzZSkudGhlbigoKSA9PiB7XG4gICAgLy8gICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKHZpc2l0SWQpO1xuICAgIC8vICAgICB9KTtcblxuICAgIC8vICAgfSlcbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyh2aXNpdElkKSk7XG4gICAgLy8gfVxuXG4gICAgcmV0dXJuIHRoaXMuZ2V0RXZlbnRzQmV0d2VlblR3b0RhdGUodmlzaXRJZCwgYmVnaW5EYXRlLCBlbmREYXRlKS50aGVuKFxuICAgICAgZXZlbnRzID0+IHtcbiAgICAgICAgZXZlbnRzLmZvckVhY2goZWwgPT4ge1xuICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5yZW1vdmVGcm9tR3JhcGgoZWwuaWQpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgfSlcblxuICB9XG5cblxuICBnZXRFdmVudHNCZXR3ZWVuVHdvRGF0ZSh2aXNpdElkLCBiZWdpbkRhdGUsIGVuZERhdGUpIHtcblxuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4odmlzaXRJZCwgW3RoaXNcbiAgICAgIC5WSVNJVF9UT19FVkVOVF9SRUxBVElPTlxuICAgIF0pLnRoZW4oKGNoaWxkcmVuKSA9PiB7XG5cbiAgICAgIGNoaWxkcmVuID0gY2hpbGRyZW4ubWFwKGVsID0+IGVsLmdldCgpKTtcblxuICAgICAgcmV0dXJuIGNoaWxkcmVuLmZpbHRlcihlbCA9PiB7XG4gICAgICAgIHJldHVybiBlbC5kYXRlID49IGJlZ2luRGF0ZSAmJiBlbC5kYXRlIDw9IGVuZERhdGU7XG4gICAgICB9KVxuXG4gICAgfSlcblxuICB9XG5cbiAgcmVtb3ZlVmlzaXQodmlzaXRJZCkge1xuICAgIGxldCBpbmZvID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8odmlzaXRJZCk7XG4gICAgaWYgKGluZm8pIHtcbiAgICAgIGxldCBncm91cElkID0gaW5mby5ncm91cElkLmdldCgpO1xuICAgICAgbGV0IHZpc2l0Q29udGV4dFR5cGUgPSBpbmZvLnZpc2l0VHlwZS5nZXQoKTtcblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JvdXBWaXNpdHMoZ3JvdXBJZCwgdmlzaXRDb250ZXh0VHlwZSkudGhlbihcbiAgICAgICAgcmVzID0+IHtcbiAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcmVzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgY29uc3QgcmVzVmlzaXRJZCA9IHJlc1tpbmRleF0uaW5mby5pZC5nZXQoKTtcbiAgICAgICAgICAgIGlmIChyZXNWaXNpdElkID09IHZpc2l0SWQpIHtcbiAgICAgICAgICAgICAgcmVzLnJlbW92ZShyZXNbaW5kZXhdKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgZWRpdFZpc2l0KHZpc2l0SWQsIG5ld1ZhbHVlc09iaikge1xuICAgIGlmICh0eXBlb2YgbmV3VmFsdWVzT2JqICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IHZpc2l0Tm9kZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRSZWFsTm9kZSh2aXNpdElkKTtcblxuICAgIGlmICh0eXBlb2YgdmlzaXROb2RlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBmb3IgKGNvbnN0IGtleSBpbiBuZXdWYWx1ZXNPYmopIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBuZXdWYWx1ZXNPYmpba2V5XTtcblxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmIHR5cGVvZiB2aXNpdE5vZGUuaW5mb1trZXldICE9PVxuICAgICAgICAgIFwidW5kZWZpbmVkXCIpIHtcblxuICAgICAgICAgIHZpc2l0Tm9kZS5pbmZvW2tleV0uc2V0KHZhbHVlKTtcblxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgdmlzaXROb2RlLmluZm9ba2V5XSAhPT1cbiAgICAgICAgICBcInVuZGVmaW5lZFwiKSB7XG5cbiAgICAgICAgICBmb3IgKGNvbnN0IGtleTIgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlMiA9IHZhbHVlW2tleTJdO1xuXG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmlzaXROb2RlLmluZm9ba2V5XVtrZXkyXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuXG4gICAgICAgICAgICAgIGlmIChrZXkgPT09IFwiaW50ZXJ2ZW50aW9uXCIgJiYga2V5MiA9PT0gXCJtZXN1cmVcIikge1xuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZTIgIT09IFwidW5kZWZpbmVkXCIpIHtcblxuICAgICAgICAgICAgICAgICAgdmlzaXROb2RlLmluZm9ba2V5XVtrZXkyXS5zZXQobmV3IENob2ljZShcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUyLCBbXG4gICAgICAgICAgICAgICAgICAgICAgXCJtaW51dGUocylcIiwgXCJkYXkocylcIixcbiAgICAgICAgICAgICAgICAgICAgICBcIndlZWsocylcIiwgXCJtb250aChzKVwiLFxuICAgICAgICAgICAgICAgICAgICAgIFwieWVhcihzKVwiXG4gICAgICAgICAgICAgICAgICAgIF0pKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgdmlzaXROb2RlLmluZm9ba2V5XVtrZXkyXS5zZXQoTmFOKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChrZXkgPT09IFwicGVyaW9kaWNpdHlcIiAmJiBrZXkyID09PSBcIm1lc3VyZVwiKSB7XG5cbiAgICAgICAgICAgICAgICB2aXNpdE5vZGUuaW5mb1trZXldW2tleTJdLnNldChuZXcgQ2hvaWNlKHZhbHVlMiwgW1xuICAgICAgICAgICAgICAgICAgXCJkYXkocylcIiwgXCJ3ZWVrKHMpXCIsXG4gICAgICAgICAgICAgICAgICBcIm1vbnRoKHMpXCIsXG4gICAgICAgICAgICAgICAgICBcInllYXIocylcIlxuICAgICAgICAgICAgICAgIF0pKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0eXBlb2YgdmFsdWUyICE9PSBcInVuZGVmaW5lZFwiID8gdmlzaXROb2RlLmluZm9ba2V5XVtrZXkyXS5zZXQoXG4gICAgICAgICAgICAgICAgICB2YWx1ZTIpIDogdmlzaXROb2RlLmluZm9ba2V5XVtrZXkyXS5zZXQoTmFOKTtcbiAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgfVxuXG4gIGdldFB0clZhbHVlKG5vZGUsIHB0ck5hbWUpIHtcbiAgICBsZXQgcmVhbE5vZGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0UmVhbE5vZGUobm9kZS5pZC5nZXQoKSk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICBpZiAoIXJlYWxOb2RlLmluZm9bcHRyTmFtZV0pIHtcbiAgICAgICAgcmVhbE5vZGUuaW5mby5hZGRfYXR0cihwdHJOYW1lLCB7XG4gICAgICAgICAgdGFza3M6IG5ldyBQdHIobmV3IExzdCgpKVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmVhbE5vZGUuaW5mb1twdHJOYW1lXS50YXNrcy5sb2FkKHZhbHVlID0+IHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUodmFsdWUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBnZXRHcm91cFZpc2l0cyhncm91cElkLCB2aXNpdHlUeXBlKSB7XG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihncm91cElkLCBbdGhpcy5HUk9VUF9UT19UQVNLXSkudGhlbihcbiAgICAgIHJlcyA9PiB7XG4gICAgICAgIGxldCBub2RlSWQ7XG4gICAgICAgIGlmIChyZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgbm9kZUlkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmNyZWF0ZU5vZGUoe1xuICAgICAgICAgICAgbmFtZTogXCJtYWludGVuYW5jZVwiXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGQoXG4gICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgbm9kZUlkLFxuICAgICAgICAgICAgdGhpcy5HUk9VUF9UT19UQVNLLFxuICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbm9kZSA9XG4gICAgICAgICAgdHlwZW9mIG5vZGVJZCAhPT0gXCJ1bmRlZmluZWRcIiA/XG4gICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8obm9kZUlkKSA6XG4gICAgICAgICAgcmVzWzBdO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldFB0clZhbHVlKG5vZGUsIHZpc2l0eVR5cGUpO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBnZW5lcmF0ZUV2ZW50KHZpc2l0VHlwZSwgZ3JvdXBJZCwgYmVnaW5EYXRlLCBlbmREYXRlLCBldmVudHNEYXRhKSB7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlVmlzaXRDb250ZXh0KHZpc2l0VHlwZSlcbiAgICAgIC50aGVuKGVsID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlua0dyb3VwVG9WaXN0Q29udGV4dChlbC5pZC5nZXQoKSwgZ3JvdXBJZCkudGhlbihcbiAgICAgICAgICByZXMgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgICAgICB0aGlzLmdldEV2ZW50U3RhdGVOb2RlKFxuICAgICAgICAgICAgICAgIGVsLmlkLmdldCgpLFxuICAgICAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICAgICAgdGhpcy5FVkVOVF9TVEFURVMuZGVjbGFyZWQudHlwZVxuICAgICAgICAgICAgICApLnRoZW4oc3RhdGVOb2RlID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgaWQgPSBzdGF0ZU5vZGUuaWQuZ2V0KCk7XG5cbiAgICAgICAgICAgICAgICBldmVudHNEYXRhLmZvckVhY2goZXZlbnRJbmZvID0+IHtcbiAgICAgICAgICAgICAgICAgIGxldCBldmVudHNEYXRlID0gdGhpcy5fZ2V0RGF0ZShcbiAgICAgICAgICAgICAgICAgICAgYmVnaW5EYXRlLFxuICAgICAgICAgICAgICAgICAgICBlbmREYXRlLFxuICAgICAgICAgICAgICAgICAgICBldmVudEluZm8ucGVyaW9kTnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICBldmVudEluZm8ucGVyaW9kTWVzdXJlXG4gICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICBldmVudHNEYXRlLmZvckVhY2goZGF0ZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnQoXG4gICAgICAgICAgICAgICAgICAgICAgZWwuaWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICBpZCxcbiAgICAgICAgICAgICAgICAgICAgICBldmVudEluZm8sXG4gICAgICAgICAgICAgICAgICAgICAgYCR7ZXZlbnRJbmZvLm5hbWV9YCxcbiAgICAgICAgICAgICAgICAgICAgICBuZXcgRGF0ZShkYXRlKS5nZXRUaW1lKClcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShlcnIpO1xuICAgICAgfSk7XG4gIH1cblxuICBhZGRFdmVudCh2aXNpdFR5cGVDb250ZXh0SWQsIGdyb3VwSWQsIHN0YXRlSWQsIHZpc2l0SW5mbywgbmFtZSwgZGF0ZSkge1xuICAgIGxldCBzdGF0ZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKHN0YXRlSWQpLnN0YXRlLmdldCgpO1xuXG4gICAgbGV0IGV2ZW50ID0gbmV3IEV2ZW50TW9kZWwobmFtZSwgZGF0ZSwgc3RhdGUsIGdyb3VwSWQpO1xuXG4gICAgbGV0IGV2ZW50Tm9kZUlkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmNyZWF0ZU5vZGUoe1xuICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICBkYXRlOiBkYXRlLFxuICAgICAgICBzdGF0ZUlkOiBzdGF0ZUlkLFxuICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgIGdyb3VwSWQ6IGdyb3VwSWQsXG4gICAgICAgIHZpc2l0SWQ6IHZpc2l0SW5mby5pZFxuICAgICAgfSxcbiAgICAgIGV2ZW50XG4gICAgKTtcblxuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGRJbkNvbnRleHQoXG4gICAgICAgIHN0YXRlSWQsXG4gICAgICAgIGV2ZW50Tm9kZUlkLFxuICAgICAgICB2aXNpdFR5cGVDb250ZXh0SWQsXG4gICAgICAgIHRoaXMuRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04sXG4gICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgIClcbiAgICAgIC50aGVuKGVsID0+IHtcbiAgICAgICAgaWYgKGVsKSByZXR1cm4gZXZlbnROb2RlSWQ7XG4gICAgICB9KVxuICAgICAgLnRoZW4oZXZlbnRJZCA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnRJZCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oZ3JvdXBJZCwgW1xuICAgICAgICAgICAgRVFVSVBNRU5UU19UT19FTEVNRU5UX1JFTEFUSU9OXG4gICAgICAgICAgXSkudGhlbihjaGlsZHJlbiA9PiB7XG4gICAgICAgICAgICBjaGlsZHJlbi5tYXAoY2hpbGQgPT4ge1xuICAgICAgICAgICAgICBsZXQgbmFtZSA9IGAke2NoaWxkLm5hbWUuZ2V0KCl9YDtcbiAgICAgICAgICAgICAgbGV0IHRhc2sgPSBuZXcgVGFza01vZGVsKFxuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgY2hpbGQuZGJpZC5nZXQoKSxcbiAgICAgICAgICAgICAgICBjaGlsZC5iaW1GaWxlSWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgdmlzaXRJbmZvLm5hbWUsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIGxldCB0YXNrSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgICAgICAgdHlwZTogXCJ0YXNrXCIsXG4gICAgICAgICAgICAgICAgICBkYklkOiBjaGlsZC5kYmlkLmdldCgpLFxuICAgICAgICAgICAgICAgICAgYmltRmlsZUlkOiBjaGlsZC5iaW1GaWxlSWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgICB2aXNpdElkOiB2aXNpdEluZm8uaWQsXG4gICAgICAgICAgICAgICAgICBldmVudElkOiBldmVudElkLFxuICAgICAgICAgICAgICAgICAgZ3JvdXBJZDogZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICAgIGRvbmU6IGZhbHNlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0YXNrXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGRJbkNvbnRleHQoXG4gICAgICAgICAgICAgICAgICBldmVudElkLFxuICAgICAgICAgICAgICAgICAgdGFza0lkLFxuICAgICAgICAgICAgICAgICAgdmlzaXRUeXBlQ29udGV4dElkLFxuICAgICAgICAgICAgICAgICAgdGhpcy5FVkVOVF9UT19UQVNLX1JFTEFUSU9OLFxuICAgICAgICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkKFxuICAgICAgICAgICAgICAgICAgdmlzaXRJbmZvLmlkLFxuICAgICAgICAgICAgICAgICAgZXZlbnRJZCxcbiAgICAgICAgICAgICAgICAgIHRoaXMuVklTSVRfVE9fRVZFTlRfUkVMQVRJT04sXG4gICAgICAgICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIGNyZWF0ZVZpc2l0Q29udGV4dCh2aXNpdFR5cGUpIHtcbiAgICBsZXQgdmlzaXQgPSB0aGlzLlZJU0lUUy5maW5kKGVsID0+IHtcbiAgICAgIHJldHVybiBlbC50eXBlID09PSB2aXNpdFR5cGU7XG4gICAgfSk7XG5cbiAgICBpZiAodHlwZW9mIHZpc2l0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBjb25zdCBjb250ZXh0TmFtZSA9IGAke3Zpc2l0Lm5hbWV9YDtcblxuICAgICAgbGV0IGNvbnRleHQgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q29udGV4dChjb250ZXh0TmFtZSk7XG4gICAgICBpZiAodHlwZW9mIGNvbnRleHQgIT09IFwidW5kZWZpbmVkXCIpIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29udGV4dFxuICAgICAgICAuaW5mbyk7XG5cbiAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ29udGV4dChcbiAgICAgICAgY29udGV4dE5hbWUsXG4gICAgICAgIHZpc2l0VHlwZSxcbiAgICAgICAgbmV3IE1vZGVsKHtcbiAgICAgICAgICBuYW1lOiB0aGlzLlZJU0lUX0NPTlRFWFRfTkFNRVxuICAgICAgICB9KVxuICAgICAgKS50aGVuKGNvbnRleHRDcmVhdGVkID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbnRleHRDcmVhdGVkLmluZm87XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFwidmlzaXROb3RGb3VuZFwiKTtcbiAgICB9XG4gIH1cblxuICBsaW5rR3JvdXBUb1Zpc3RDb250ZXh0KHZpc2l0Q29udGV4dElkLCBncm91cElkKSB7XG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbih2aXNpdENvbnRleHRJZCwgW1xuICAgICAgICB0aGlzLlZJU0lUX1RZUEVfVE9fR1JPVVBfUkVMQVRJT05cbiAgICAgIF0pXG4gICAgICAudGhlbihjaGlsZHJlbiA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldLmlkLmdldCgpO1xuICAgICAgICAgIGlmIChjaGlsZCA9PT0gZ3JvdXBJZCkgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAudGhlbihlbCA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgZWwgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkSW5Db250ZXh0KFxuICAgICAgICAgICAgdmlzaXRDb250ZXh0SWQsXG4gICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgdmlzaXRDb250ZXh0SWQsXG4gICAgICAgICAgICB0aGlzLlZJU0lUX1RZUEVfVE9fR1JPVVBfUkVMQVRJT04sXG4gICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgKS50aGVuKGFzeW5jIHJlcyA9PiB7XG4gICAgICAgICAgICBpZiAocmVzKSB7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoXG4gICAgICAgICAgICAgICAgdmlzaXRDb250ZXh0SWQsXG4gICAgICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFUy5wcm9jZXNzaW5nLnR5cGVcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5nZXRFdmVudFN0YXRlTm9kZShcbiAgICAgICAgICAgICAgICB2aXNpdENvbnRleHRJZCxcbiAgICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICAgIHRoaXMuRVZFTlRfU1RBVEVTLmRvbmUudHlwZVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBlbDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBnZXRFdmVudFN0YXRlTm9kZSh2aXNpdENvbnRleHRJZCwgZ3JvdXBJZCwgZXZlbnRTYXRlKSB7XG4gICAgbGV0IGV2ZW50ID0gdGhpcy5fZXZlbnRTYXRlSXNWYWxpZChldmVudFNhdGUpO1xuXG4gICAgaWYgKHR5cGVvZiBldmVudCA9PT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuO1xuXG4gICAgbGV0IGNvbnRleHRUeXBlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8odmlzaXRDb250ZXh0SWQpLnR5cGUuZ2V0KCk7XG4gICAgbGV0IHJlbGF0aW9uTmFtZTtcblxuICAgIHN3aXRjaCAoY29udGV4dFR5cGUpIHtcbiAgICAgIGNhc2UgdGhpcy5NQUlOVEVOQU5DRV9WSVNJVDpcbiAgICAgICAgcmVsYXRpb25OYW1lID0gdGhpcy5NQUlOVEVOQU5DRV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIHRoaXMuU0VDVVJJVFlfVklTSVQ6XG4gICAgICAgIHJlbGF0aW9uTmFtZSA9IHRoaXMuU0VDVVJJVFlfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT047XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLkRJQUdOT1NUSUNfVklTSVQ6XG4gICAgICAgIHJlbGF0aW9uTmFtZSA9IHRoaXMuRElBR05PU1RJQ19WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIHRoaXMuUkVHVUxBVE9SWV9WSVNJVDpcbiAgICAgICAgcmVsYXRpb25OYW1lID0gdGhpcy5SRUdVTEFUT1JZX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKGdyb3VwSWQsIFtyZWxhdGlvbk5hbWVdKVxuICAgICAgLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgbmFtZSA9IGNoaWxkcmVuW2ldLm5hbWUuZ2V0KCk7XG4gICAgICAgICAgY29uc3QgdHlwZSA9IGNoaWxkcmVuW2ldLnN0YXRlLmdldCgpO1xuXG4gICAgICAgICAgaWYgKG5hbWUgPT09IGV2ZW50U2F0ZSB8fCB0eXBlID09PSBldmVudFNhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiBjaGlsZHJlbltpXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAudGhlbihlbCA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgZWwgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICBsZXQgYXJnTm9kZUlkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmNyZWF0ZU5vZGUoe1xuICAgICAgICAgICAgbmFtZTogZXZlbnQubmFtZSxcbiAgICAgICAgICAgIHN0YXRlOiBldmVudC50eXBlLFxuICAgICAgICAgICAgZ3JvdXBJZDogZ3JvdXBJZCxcbiAgICAgICAgICAgIHR5cGU6IFwiRXZlbnRTdGF0ZVwiXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkSW5Db250ZXh0KFxuICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgIGFyZ05vZGVJZCxcbiAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgcmVsYXRpb25OYW1lLFxuICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICkudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcykgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKGFyZ05vZGVJZCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIHZhbGlkYXRlVGFzayhjb250ZXh0SWQsIGdyb3VwSWQsIGV2ZW50SWQsIHRhc2tJZCkge1xuICAgIGxldCB0YXNrTm9kZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRSZWFsTm9kZSh0YXNrSWQpO1xuICAgIHRhc2tOb2RlLmluZm8uZG9uZS5zZXQoIXRhc2tOb2RlLmluZm8uZG9uZS5nZXQoKSk7XG5cbiAgICBsZXQgY3VycmVudFN0YXRlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhldmVudElkKS5zdGF0ZUlkLmdldCgpO1xuXG4gICAgcmV0dXJuIHRoaXMuX2dldFN0YXRlKGNvbnRleHRJZCwgZ3JvdXBJZCwgZXZlbnRJZCkudGhlbihuZXh0U3RhdGUgPT4ge1xuXG4gICAgICBsZXQgbmV4dFN0YXRlSWQgPSBuZXh0U3RhdGUuaWQuZ2V0KCk7XG5cbiAgICAgIGlmIChuZXh0U3RhdGVJZCA9PT0gY3VycmVudFN0YXRlSWQpIHJldHVybiB0cnVlO1xuXG4gICAgICByZXR1cm4gdGhpcy5fc3dpdGNoRXZlbnRTdGF0ZShldmVudElkLCBjdXJyZW50U3RhdGVJZCwgbmV4dFN0YXRlSWQsXG4gICAgICAgIGNvbnRleHRJZCk7XG5cbiAgICB9KTtcblxuICB9XG5cblxuXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICBQUklWQVRFUyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgX2dldERhdGUoYmVnaW5EYXRlLCBlbmREYXRlLCBwZXJpb2ROdW1iZXIsIHBlcmlvZE1lc3VyZSkge1xuICAgIGxldCBtZXN1cmUgPSBbXCJkYXlzXCIsIFwid2Vla3NcIiwgXCJtb250aHNcIiwgXCJ5ZWFyc1wiXVtwZXJpb2RNZXN1cmVdO1xuXG4gICAgbGV0IGV2ZW50c0RhdGUgPSBbXTtcblxuICAgIGxldCBkYXRlID0gbW9tZW50KGJlZ2luRGF0ZSk7XG4gICAgbGV0IGVuZCA9IG1vbWVudChlbmREYXRlKTtcblxuICAgIHdoaWxlIChlbmQuZGlmZihkYXRlKSA+PSAwKSB7XG4gICAgICBldmVudHNEYXRlLnB1c2goZGF0ZS50b0RhdGUoKSk7XG5cbiAgICAgIGRhdGUgPSBkYXRlLmFkZChwZXJpb2ROdW1iZXIsIG1lc3VyZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGV2ZW50c0RhdGU7XG4gIH1cblxuICBfZm9ybWF0RGF0ZShhcmdEYXRlKSB7XG4gICAgbGV0IGRhdGUgPSBuZXcgRGF0ZShhcmdEYXRlKTtcblxuICAgIHJldHVybiBgJHsoKCkgPT4ge1xuICAgICAgbGV0IGQgPSBkYXRlLmdldERhdGUoKTtcbiAgICAgIHJldHVybiBkLnRvU3RyaW5nKCkubGVuZ3RoID4gMSA/IGQgOiAnMCcgKyBkO1xuICAgIH0pKCl9LyR7KCgpID0+IHtcblxuICAgICAgbGV0IGQgPSBkYXRlLmdldE1vbnRoKCkgKyAxO1xuICAgICAgcmV0dXJuIGQudG9TdHJpbmcoKS5sZW5ndGggPiAxID8gZCA6ICcwJyArIGQ7XG5cbiAgICB9KSgpfS8ke2RhdGUuZ2V0RnVsbFllYXIoKX1gO1xuICB9XG5cbiAgX2V2ZW50U2F0ZUlzVmFsaWQoZXZlbnRTdGF0ZSkge1xuICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuRVZFTlRfU1RBVEVTKSB7XG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMuRVZFTlRfU1RBVEVTW2tleV0ubmFtZSA9PT0gZXZlbnRTdGF0ZSB8fFxuICAgICAgICB0aGlzLkVWRU5UX1NUQVRFU1trZXldLnR5cGUgPT09IGV2ZW50U3RhdGVcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5FVkVOVF9TVEFURVNba2V5XTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgX2dldFN0YXRlKGNvbnRleHRJZCwgZ3JvdXBJZCwgZXZlbnRJZCkge1xuXG4gICAgcmV0dXJuIHRoaXMuZ2V0RXZlbnRUYXNrcyhldmVudElkKS50aGVuKHRhc2tzID0+IHtcbiAgICAgIGxldCB0YXNrc1ZhbGlkYXRlZCA9IHRhc2tzLmZpbHRlcihlbCA9PiBlbC5kb25lKTtcbiAgICAgIGxldCBzdGF0ZU9iajtcblxuICAgICAgaWYgKHRhc2tzVmFsaWRhdGVkLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBzdGF0ZU9iaiA9IHRoaXMuRVZFTlRfU1RBVEVTLmRlY2xhcmVkO1xuICAgICAgfSBlbHNlIGlmICh0YXNrc1ZhbGlkYXRlZC5sZW5ndGggPT09IHRhc2tzLmxlbmd0aCkge1xuICAgICAgICBzdGF0ZU9iaiA9IHRoaXMuRVZFTlRfU1RBVEVTLmRvbmU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZU9iaiA9IHRoaXMuRVZFTlRfU1RBVEVTLnByb2Nlc3Npbmc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmdldEV2ZW50U3RhdGVOb2RlKGNvbnRleHRJZCwgZ3JvdXBJZCwgc3RhdGVPYmoudHlwZSk7XG5cbiAgICB9KVxuXG4gIH1cblxuICBfc3dpdGNoRXZlbnRTdGF0ZShldmVudElkLCBmcm9tU3RhdGVJZCwgdG9TdGF0ZUlkLCBjb250ZXh0SWQpIHtcblxuXG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5yZW1vdmVDaGlsZChmcm9tU3RhdGVJZCwgZXZlbnRJZCwgdGhpc1xuICAgICAgICAuRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04sIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEUpXG4gICAgICAudGhlbihyZW1vdmVkID0+IHtcbiAgICAgICAgaWYgKHJlbW92ZWQpIHtcbiAgICAgICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkSW5Db250ZXh0KHRvU3RhdGVJZCwgZXZlbnRJZCxcbiAgICAgICAgICAgICAgY29udGV4dElkLFxuICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OLFxuICAgICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFKVxuICAgICAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICBsZXQgRXZlbnROb2RlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldFJlYWxOb2RlKGV2ZW50SWQpO1xuICAgICAgICAgICAgICAgIGxldCBuZXdTdGF0ZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKHRvU3RhdGVJZCkuc3RhdGVcbiAgICAgICAgICAgICAgICAgIC5nZXQoKTtcblxuXG4gICAgICAgICAgICAgICAgRXZlbnROb2RlLmluZm8uc3RhdGUuc2V0KG5ld1N0YXRlKTtcbiAgICAgICAgICAgICAgICBFdmVudE5vZGUuaW5mby5zdGF0ZUlkLnNldCh0b1N0YXRlSWQpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0pXG5cblxuICB9XG5cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gIC8vICAgICAgICAgICAgICAgICAgICAgICAgR0VUIElORk9STUFUSU9OICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICBnZXRWaXNpdEdyb3Vwcyh2aXNpdFR5cGUpIHtcbiAgICBsZXQgY29udGV4dHMgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q29udGV4dFdpdGhUeXBlKHZpc2l0VHlwZSk7XG4gICAgaWYgKGNvbnRleHRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFtdO1xuXG4gICAgbGV0IGNvbnRleHRJZCA9IGNvbnRleHRzWzBdLmluZm8uaWQuZ2V0KCk7XG5cbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKFxuICAgICAgY29udGV4dElkLFxuICAgICAgdGhpcy5WSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OXG4gICAgKS50aGVuKHJlcyA9PiB7XG4gICAgICByZXR1cm4gcmVzLm1hcChlbCA9PiBlbC5nZXQoKSk7XG4gICAgfSk7XG4gIH1cblxuXG4gIGdldEdyb3VwRXZlbnRTdGF0ZXMoY29udGV4dElkLCBncm91cElkKSB7XG4gICAgbGV0IHByb21pc2VzID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLkVWRU5UX1NUQVRFUykge1xuICAgICAgcHJvbWlzZXMucHVzaChcbiAgICAgICAgdGhpcy5nZXRFdmVudFN0YXRlTm9kZShcbiAgICAgICAgICBjb250ZXh0SWQsXG4gICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFU1trZXldLnR5cGVcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICB9XG5cbiAgZ2V0R3JvdXBFdmVudHMoXG4gICAgZ3JvdXBJZCxcbiAgICBWSVNJVF9UWVBFUyA9IFtcbiAgICAgIHRoaXMuTUFJTlRFTkFOQ0VfVklTSVQsXG4gICAgICB0aGlzLlJFR1VMQVRPUllfVklTSVQsXG4gICAgICB0aGlzLlNFQ1VSSVRZX1ZJU0lULFxuICAgICAgdGhpcy5ESUFHTk9TVElDX1ZJU0lUXG4gICAgXVxuICApIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoVklTSVRfVFlQRVMpKSBWSVNJVF9UWVBFUyA9IFtWSVNJVF9UWVBFU107XG5cbiAgICByZXR1cm4gVklTSVRfVFlQRVMubWFwKHZpc2l0VHlwZSA9PiB7XG4gICAgICBsZXQgdmlzaXQgPSB0aGlzLlZJU0lUUy5maW5kKGVsID0+IHtcbiAgICAgICAgcmV0dXJuIGVsLnR5cGUgPT09IHZpc2l0VHlwZTtcbiAgICAgIH0pO1xuXG4gICAgICBsZXQgY29udGV4dCA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRDb250ZXh0KHZpc2l0Lm5hbWUpO1xuXG4gICAgICBpZiAodHlwZW9mIGNvbnRleHQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgbGV0IGNvbnRleHRJZCA9IGNvbnRleHQuaW5mby5pZC5nZXQoKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcm91cEV2ZW50U3RhdGVzKGNvbnRleHRJZCwgZ3JvdXBJZCkudGhlbihcbiAgICAgICAgICB2YWx1ZXMgPT4ge1xuICAgICAgICAgICAgbGV0IHByb20gPSB2YWx1ZXMubWFwKGFzeW5jIGV2ZW50VHlwZSA9PiB7XG4gICAgICAgICAgICAgIGxldCByZXMgPSBldmVudFR5cGUuZ2V0KCk7XG5cbiAgICAgICAgICAgICAgcmVzW1widmlzaXRfdHlwZVwiXSA9IHZpc2l0VHlwZTtcblxuICAgICAgICAgICAgICBsZXQgZXZlbnRzID0gYXdhaXQgU3BpbmFsR3JhcGhTZXJ2aWNlXG4gICAgICAgICAgICAgICAgLmdldENoaWxkcmVuKFxuICAgICAgICAgICAgICAgICAgcmVzLmlkLCBbXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT05cbiAgICAgICAgICAgICAgICAgIF0pO1xuXG4gICAgICAgICAgICAgIHJlc1tcImV2ZW50c1wiXSA9IGV2ZW50cy5tYXAoZWwgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbC5nZXQoKTtcbiAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbSkudGhlbihhbGxFdmVudHMgPT4ge1xuICAgICAgICAgICAgICBsZXQgdmFsdWVzID0ge307XG5cbiAgICAgICAgICAgICAgYWxsRXZlbnRzLmZvckVhY2godmFsID0+IHtcbiAgICAgICAgICAgICAgICB2YWx1ZXNbdmFsLnN0YXRlXSA9IHZhbC5ldmVudHM7XG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgW3Zpc2l0VHlwZV06IHZhbHVlc1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBnZXRFdmVudFRhc2tzKGV2ZW50SWQpIHtcbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKGV2ZW50SWQsIFt0aGlzXG4gICAgICAgIC5FVkVOVF9UT19UQVNLX1JFTEFUSU9OXG4gICAgICBdKVxuICAgICAgLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgICAgICByZXR1cm4gY2hpbGRyZW4ubWFwKGVsID0+IGVsLmdldCgpKVxuICAgICAgfSlcbiAgfVxuXG59XG5cbmxldCBzcGluYWxWaXNpdFNlcnZpY2UgPSBuZXcgU3BpbmFsVmlzaXRTZXJ2aWNlKCk7XG5cbmV4cG9ydCBkZWZhdWx0IHNwaW5hbFZpc2l0U2VydmljZTsiXX0=