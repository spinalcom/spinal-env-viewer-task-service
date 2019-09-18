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

    this.TASK_TO_COMMENTS_RELATION = "hasComment";
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

  ////////////////////////////////////////////////////////////////////////
  //                        Comment Manager                             //
  ////////////////////////////////////////////////////////////////////////

  addComment(taskId, userId, message) {
    if (message && message.trim().length > 0 && userId) {
      let commentNodeId = _spinalEnvViewerGraphService.SpinalGraphService.createNode({
        userId: userId,
        message: message,
        taskId: taskId,
        date: Date.now()
      });

      if (commentNodeId) {
        return _spinalEnvViewerGraphService.SpinalGraphService.addChild(taskId, commentNodeId, this.TASK_TO_COMMENTS_RELATION, _spinalEnvViewerGraphService.SPINAL_RELATION_PTR_LST_TYPE);
      }
    } else {
      return Promise.reject(false);
    }
  }

  getTasksComments(taskId) {
    return _spinalEnvViewerGraphService.SpinalGraphService.getChildren(taskId, [this.TASK_TO_COMMENTS_RELATION]).then(children => {
      return children.map(el => el.get());
    });
  }

}

let spinalVisitService = new SpinalVisitService();

exports.default = spinalVisitService;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJTcGluYWxWaXNpdFNlcnZpY2UiLCJjb25zdHJ1Y3RvciIsIlZJU0lUX0NPTlRFWFRfTkFNRSIsIkNPTlRFWFRfVFlQRSIsIlZJU0lUX1RZUEUiLCJNQUlOVEVOQU5DRV9WSVNJVCIsIlJFR1VMQVRPUllfVklTSVQiLCJTRUNVUklUWV9WSVNJVCIsIkRJQUdOT1NUSUNfVklTSVQiLCJFVkVOVF9TVEFURVMiLCJPYmplY3QiLCJmcmVlemUiLCJkZWNsYXJlZCIsIm5hbWUiLCJ0eXBlIiwicHJvY2Vzc2luZyIsImRvbmUiLCJWSVNJVFMiLCJNQUlOVEVOQU5DRV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIlJFR1VMQVRPUllfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJTRUNVUklUWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJHUk9VUF9UT19UQVNLIiwiVklTSVRfVE9fRVZFTlRfUkVMQVRJT04iLCJWSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OIiwiRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04iLCJFVkVOVF9UT19UQVNLX1JFTEFUSU9OIiwiVEFTS19UT19DT01NRU5UU19SRUxBVElPTiIsImdldEFsbFZpc2l0cyIsImFkZFZpc2l0T25Hcm91cCIsImdyb3VwSWQiLCJ2aXNpdE5hbWUiLCJwZXJpb2RpY2l0eU51bWJlciIsInBlcmlvZGljaXR5TWVzdXJlIiwidmlzaXRUeXBlIiwiaW50ZXJ2ZW50aW9uTnVtYmVyIiwiaW50ZXJ2ZW50aW9uTWVzdXJlIiwiZGVzY3JpcHRpb24iLCJTcGluYWxHcmFwaFNlcnZpY2UiLCJnZXRDaGlsZHJlbiIsInRoZW4iLCJjaGlsZHJlbiIsImFyZ05vZGVJZCIsImxlbmd0aCIsImNyZWF0ZU5vZGUiLCJhZGRDaGlsZCIsIlNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEUiLCJub2RlIiwiZ2V0SW5mbyIsImdldFB0clZhbHVlIiwibHN0IiwidGFzayIsIlZpc2l0TW9kZWwiLCJub2RlSWQiLCJwZXJpb2RpY2l0eSIsIm51bWJlciIsImdldCIsIm1lc3VyZSIsImludGVydmVudGlvbiIsInJlYWxOb2RlIiwiZ2V0UmVhbE5vZGUiLCJwdXNoIiwiaW5mbyIsImRlbGV0ZVZpc2l0IiwidmlzaXRJZCIsInJlbW92ZVZpc2l0IiwicmVtb3ZlUmVsYXRlZEV2ZW50IiwiYmVnaW5EYXRlIiwiZW5kRGF0ZSIsInJlbW92ZVZpc2l0RXZlbnRzIiwiZWwiLCJnZXRFdmVudHNCZXR3ZWVuVHdvRGF0ZSIsImV2ZW50cyIsImZvckVhY2giLCJyZW1vdmVGcm9tR3JhcGgiLCJpZCIsIm1hcCIsImZpbHRlciIsImRhdGUiLCJ2aXNpdENvbnRleHRUeXBlIiwiZ2V0R3JvdXBWaXNpdHMiLCJyZXMiLCJpbmRleCIsInJlc1Zpc2l0SWQiLCJyZW1vdmUiLCJQcm9taXNlIiwicmVzb2x2ZSIsImVkaXRWaXNpdCIsIm5ld1ZhbHVlc09iaiIsInZpc2l0Tm9kZSIsImtleSIsInZhbHVlIiwic2V0Iiwia2V5MiIsInZhbHVlMiIsIkNob2ljZSIsIk5hTiIsInB0ck5hbWUiLCJhZGRfYXR0ciIsInRhc2tzIiwiUHRyIiwiTHN0IiwibG9hZCIsInZpc2l0eVR5cGUiLCJnZW5lcmF0ZUV2ZW50IiwiZXZlbnRzRGF0YSIsImNyZWF0ZVZpc2l0Q29udGV4dCIsImxpbmtHcm91cFRvVmlzdENvbnRleHQiLCJnZXRFdmVudFN0YXRlTm9kZSIsInN0YXRlTm9kZSIsImV2ZW50SW5mbyIsImV2ZW50c0RhdGUiLCJfZ2V0RGF0ZSIsInBlcmlvZE51bWJlciIsInBlcmlvZE1lc3VyZSIsImFkZEV2ZW50IiwiRGF0ZSIsImdldFRpbWUiLCJjYXRjaCIsImVyciIsImNvbnNvbGUiLCJsb2ciLCJ2aXNpdFR5cGVDb250ZXh0SWQiLCJzdGF0ZUlkIiwidmlzaXRJbmZvIiwic3RhdGUiLCJldmVudCIsIkV2ZW50TW9kZWwiLCJldmVudE5vZGVJZCIsImFkZENoaWxkSW5Db250ZXh0IiwiZXZlbnRJZCIsIkVRVUlQTUVOVFNfVE9fRUxFTUVOVF9SRUxBVElPTiIsImNoaWxkIiwiVGFza01vZGVsIiwiZGJpZCIsImJpbUZpbGVJZCIsInRhc2tJZCIsImRiSWQiLCJhbGwiLCJ2aXNpdCIsImZpbmQiLCJjb250ZXh0TmFtZSIsImNvbnRleHQiLCJnZXRDb250ZXh0IiwiYWRkQ29udGV4dCIsIk1vZGVsIiwiY29udGV4dENyZWF0ZWQiLCJyZWplY3QiLCJ2aXNpdENvbnRleHRJZCIsImkiLCJldmVudFNhdGUiLCJfZXZlbnRTYXRlSXNWYWxpZCIsImNvbnRleHRUeXBlIiwicmVsYXRpb25OYW1lIiwidmFsaWRhdGVUYXNrIiwiY29udGV4dElkIiwidGFza05vZGUiLCJjdXJyZW50U3RhdGVJZCIsIl9nZXRTdGF0ZSIsIm5leHRTdGF0ZSIsIm5leHRTdGF0ZUlkIiwiX3N3aXRjaEV2ZW50U3RhdGUiLCJlbmQiLCJkaWZmIiwidG9EYXRlIiwiYWRkIiwiX2Zvcm1hdERhdGUiLCJhcmdEYXRlIiwiZCIsImdldERhdGUiLCJ0b1N0cmluZyIsImdldE1vbnRoIiwiZ2V0RnVsbFllYXIiLCJldmVudFN0YXRlIiwidW5kZWZpbmVkIiwiZ2V0RXZlbnRUYXNrcyIsInRhc2tzVmFsaWRhdGVkIiwic3RhdGVPYmoiLCJmcm9tU3RhdGVJZCIsInRvU3RhdGVJZCIsInJlbW92ZUNoaWxkIiwicmVtb3ZlZCIsIkV2ZW50Tm9kZSIsIm5ld1N0YXRlIiwiZ2V0VmlzaXRHcm91cHMiLCJjb250ZXh0cyIsImdldENvbnRleHRXaXRoVHlwZSIsImdldEdyb3VwRXZlbnRTdGF0ZXMiLCJwcm9taXNlcyIsImdldEdyb3VwRXZlbnRzIiwiVklTSVRfVFlQRVMiLCJBcnJheSIsImlzQXJyYXkiLCJ2YWx1ZXMiLCJwcm9tIiwiZXZlbnRUeXBlIiwiYWxsRXZlbnRzIiwidmFsIiwiYWRkQ29tbWVudCIsInVzZXJJZCIsIm1lc3NhZ2UiLCJ0cmltIiwi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LEVBQW9EO0FBQ2xELFVBQUlHLGdCQUFnQnBLLGdEQUFtQk0sVUFBbkIsQ0FBOEI7QUFDaEQySixnQkFBUUEsTUFEd0M7QUFFaERDLGlCQUFTQSxPQUZ1QztBQUdoRGhFLGdCQUFRQSxNQUh3QztBQUloRDFELGNBQU1zQyxLQUFLdUYsR0FBTDtBQUowQyxPQUE5QixDQUFwQjs7QUFPQSxVQUFJRCxhQUFKLEVBQW1CO0FBQ2pCLGVBQU9wSyxnREFBbUJPLFFBQW5CLENBQTRCMkYsTUFBNUIsRUFBb0NrRSxhQUFwQyxFQUFtRCxLQUN2RC9LLHlCQURJLEVBRUxtQix5REFGSyxDQUFQO0FBR0Q7QUFFRixLQWRELE1BY087QUFDTCxhQUFPdUMsUUFBUThELE1BQVIsQ0FBZSxLQUFmLENBQVA7QUFDRDtBQUNGOztBQUVEeUQsbUJBQWlCcEUsTUFBakIsRUFBeUI7QUFDdkIsV0FBT2xHLGdEQUFtQkMsV0FBbkIsQ0FBK0JpRyxNQUEvQixFQUF1QyxDQUFDLEtBQzVDN0cseUJBRDJDLENBQXZDLEVBRUphLElBRkksQ0FFQ0MsWUFBWTtBQUNsQixhQUFPQSxTQUFTbUMsR0FBVCxDQUFhTixNQUFNQSxHQUFHZCxHQUFILEVBQW5CLENBQVA7QUFDRCxLQUpNLENBQVA7QUFLRDs7QUFsMUJzQjs7QUFzMUJ6QixJQUFJcUoscUJBQXFCLElBQUk3TSxrQkFBSixFQUF6Qjs7a0JBRWU2TSxrQiIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEUsXG4gIFNwaW5hbEdyYXBoU2VydmljZVxufSBmcm9tIFwic3BpbmFsLWVudi12aWV3ZXItZ3JhcGgtc2VydmljZVwiO1xuXG5pbXBvcnQge1xuICBFUVVJUE1FTlRTX1RPX0VMRU1FTlRfUkVMQVRJT05cbn0gZnJvbSBcInNwaW5hbC1lbnYtdmlld2VyLXJvb20tbWFuYWdlci9qcy9zZXJ2aWNlXCI7XG5cbmltcG9ydCBWaXNpdE1vZGVsIGZyb20gXCIuL21vZGVscy92aXNpdC5tb2RlbC5qc1wiO1xuaW1wb3J0IEV2ZW50TW9kZWwgZnJvbSBcIi4vbW9kZWxzL2V2ZW50Lm1vZGVsLmpzXCI7XG5pbXBvcnQgVGFza01vZGVsIGZyb20gXCIuL21vZGVscy90YXNrLm1vZGVsLmpzXCI7XG5cbmltcG9ydCB7XG4gIFB0cixcbiAgTHN0LFxuICBNb2RlbFxufSBmcm9tIFwic3BpbmFsLWNvcmUtY29ubmVjdG9yanNfdHlwZVwiO1xuXG5pbXBvcnQgbW9tZW50IGZyb20gXCJtb21lbnRcIjtcblxuY2xhc3MgU3BpbmFsVmlzaXRTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5WSVNJVF9DT05URVhUX05BTUUgPSBcIi52aXNpdF9jb250ZXh0XCI7XG4gICAgdGhpcy5DT05URVhUX1RZUEUgPSBcInZpc2l0X2NvbnRleHRcIjtcblxuICAgIHRoaXMuVklTSVRfVFlQRSA9IFwidmlzaXRcIjtcblxuICAgIHRoaXMuTUFJTlRFTkFOQ0VfVklTSVQgPSBcIk1BSU5URU5BTkNFX1ZJU0lUXCI7XG4gICAgdGhpcy5SRUdVTEFUT1JZX1ZJU0lUID0gXCJSRUdVTEFUT1JZX1ZJU0lUXCI7XG4gICAgdGhpcy5TRUNVUklUWV9WSVNJVCA9IFwiU0VDVVJJVFlfVklTSVRcIjtcbiAgICB0aGlzLkRJQUdOT1NUSUNfVklTSVQgPSBcIkRJQUdOT1NUSUNfVklTSVRcIjtcblxuICAgIHRoaXMuRVZFTlRfU1RBVEVTID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgICBkZWNsYXJlZDoge1xuICAgICAgICBuYW1lOiBcImTDqWNsYXLDqVwiLFxuICAgICAgICB0eXBlOiBcImRlY2xhcmVkXCJcbiAgICAgIH0sXG4gICAgICBwcm9jZXNzaW5nOiB7XG4gICAgICAgIG5hbWU6IFwiZW5jb3Vyc1wiLFxuICAgICAgICB0eXBlOiBcInByb2Nlc3NpbmdcIlxuICAgICAgfSxcbiAgICAgIGRvbmU6IHtcbiAgICAgICAgbmFtZTogXCLDqWZmZWN0dcOpXCIsXG4gICAgICAgIHR5cGU6IFwiZG9uZVwiXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLlZJU0lUUyA9IE9iamVjdC5mcmVlemUoW3tcbiAgICAgIHR5cGU6IHRoaXMuTUFJTlRFTkFOQ0VfVklTSVQsXG4gICAgICBuYW1lOiBcIlZpc2l0ZSBkZSBtYWludGVuYW5jZVwiXG4gICAgfSwge1xuICAgICAgdHlwZTogdGhpcy5SRUdVTEFUT1JZX1ZJU0lULFxuICAgICAgbmFtZTogXCJWaXNpdGUgcmVnbGVtZW50YWlyZVwiXG4gICAgfSwge1xuICAgICAgdHlwZTogdGhpcy5TRUNVUklUWV9WSVNJVCxcbiAgICAgIG5hbWU6IFwiVmlzaXRlIGRlIHNlY3VyaXRlXCJcbiAgICB9LCB7XG4gICAgICB0eXBlOiB0aGlzLkRJQUdOT1NUSUNfVklTSVQsXG4gICAgICBuYW1lOiBcIlZpc2l0ZSBkZSBkaWFnbm9zdGljXCJcbiAgICB9XSk7XG5cblxuICAgIHRoaXMuTUFJTlRFTkFOQ0VfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04gPVxuICAgICAgXCJtYWludGVuYW5jZVZpc2l0aGFzRXZlbnRTdGF0ZVwiO1xuXG4gICAgdGhpcy5SRUdVTEFUT1JZX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OID1cbiAgICAgIFwicmVndWxhdG9yeVZpc2l0aGFzRXZlbnRTdGF0ZVwiO1xuXG4gICAgdGhpcy5TRUNVUklUWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiA9IFwic2VjdXJpdHlWaXNpdGhhc0V2ZW50U3RhdGVcIjtcblxuICAgIHRoaXMuRElBR05PU1RJQ19WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiA9XG4gICAgICBcImRpYWdub3N0aWNWaXNpdGhhc0V2ZW50U3RhdGVcIjtcblxuICAgIHRoaXMuR1JPVVBfVE9fVEFTSyA9IFwiaGFzVmlzaXRcIjtcblxuICAgIHRoaXMuVklTSVRfVE9fRVZFTlRfUkVMQVRJT04gPSBcInZpc2l0SGFzRXZlbnRcIjtcblxuICAgIHRoaXMuVklTSVRfVFlQRV9UT19HUk9VUF9SRUxBVElPTiA9IFwidmlzaXRIYXNHcm91cFwiO1xuICAgIHRoaXMuRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04gPSBcImhhc0V2ZW50XCI7XG4gICAgdGhpcy5FVkVOVF9UT19UQVNLX1JFTEFUSU9OID0gXCJoYXNUYXNrXCI7XG5cbiAgICB0aGlzLlRBU0tfVE9fQ09NTUVOVFNfUkVMQVRJT04gPSBcImhhc0NvbW1lbnRcIlxuICB9XG5cbiAgZ2V0QWxsVmlzaXRzKCkge1xuICAgIHJldHVybiB0aGlzLlZJU0lUUztcbiAgfVxuXG4gIGFkZFZpc2l0T25Hcm91cChcbiAgICBncm91cElkLFxuICAgIHZpc2l0TmFtZSxcbiAgICBwZXJpb2RpY2l0eU51bWJlcixcbiAgICBwZXJpb2RpY2l0eU1lc3VyZSxcbiAgICB2aXNpdFR5cGUsXG4gICAgaW50ZXJ2ZW50aW9uTnVtYmVyLFxuICAgIGludGVydmVudGlvbk1lc3VyZSxcbiAgICBkZXNjcmlwdGlvblxuICApIHtcbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKGdyb3VwSWQsIFt0aGlzLkdST1VQX1RPX1RBU0tdKS50aGVuKFxuICAgICAgY2hpbGRyZW4gPT4ge1xuICAgICAgICBsZXQgYXJnTm9kZUlkO1xuICAgICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgYXJnTm9kZUlkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmNyZWF0ZU5vZGUoe1xuICAgICAgICAgICAgbmFtZTogXCJtYWludGVuYW5jZVwiXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGQoXG4gICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgYXJnTm9kZUlkLFxuICAgICAgICAgICAgdGhpcy5HUk9VUF9UT19UQVNLLFxuICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbm9kZSA9XG4gICAgICAgICAgdHlwZW9mIGFyZ05vZGVJZCAhPT0gXCJ1bmRlZmluZWRcIiA/XG4gICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8oYXJnTm9kZUlkKSA6XG4gICAgICAgICAgY2hpbGRyZW5bMF07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHRyVmFsdWUobm9kZSwgdmlzaXRUeXBlKS50aGVuKGxzdCA9PiB7XG4gICAgICAgICAgbGV0IHRhc2sgPSBuZXcgVmlzaXRNb2RlbChcbiAgICAgICAgICAgIHZpc2l0TmFtZSxcbiAgICAgICAgICAgIHBlcmlvZGljaXR5TnVtYmVyLFxuICAgICAgICAgICAgcGVyaW9kaWNpdHlNZXN1cmUsXG4gICAgICAgICAgICB2aXNpdFR5cGUsXG4gICAgICAgICAgICBpbnRlcnZlbnRpb25OdW1iZXIsXG4gICAgICAgICAgICBpbnRlcnZlbnRpb25NZXN1cmUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvblxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBsZXQgbm9kZUlkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmNyZWF0ZU5vZGUoe1xuICAgICAgICAgICAgICBncm91cElkOiBncm91cElkLFxuICAgICAgICAgICAgICBuYW1lOiB2aXNpdE5hbWUsXG4gICAgICAgICAgICAgIHBlcmlvZGljaXR5OiB7XG4gICAgICAgICAgICAgICAgbnVtYmVyOiB0YXNrLnBlcmlvZGljaXR5Lm51bWJlci5nZXQoKSxcbiAgICAgICAgICAgICAgICBtZXN1cmU6IHRhc2sucGVyaW9kaWNpdHkubWVzdXJlXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGludGVydmVudGlvbjoge1xuICAgICAgICAgICAgICAgIG51bWJlcjogdGFzay5pbnRlcnZlbnRpb24ubnVtYmVyLmdldCgpLFxuICAgICAgICAgICAgICAgIG1lc3VyZTogdGFzay5pbnRlcnZlbnRpb24ubWVzdXJlXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHZpc2l0VHlwZTogdmlzaXRUeXBlLFxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0YXNrXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGxldCByZWFsTm9kZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRSZWFsTm9kZShub2RlSWQpO1xuXG4gICAgICAgICAgbHN0LnB1c2gocmVhbE5vZGUpO1xuXG4gICAgICAgICAgcmV0dXJuIHJlYWxOb2RlLmluZm87XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICAvLyBkZWxldGVWaXNpdCh2aXNpdElkLCByZW1vdmVSZWxhdGVkRXZlbnQpIHtcbiAgLy8gICByZXR1cm4gdGhpcy5yZW1vdmVWaXNpdEV2ZW50cyh2aXNpdElkLCByZW1vdmVSZWxhdGVkRXZlbnQpLnRoZW4oKFxuICAvLyAgICAgaW5mbykgPT4ge1xuXG4gIC8vICAgICBpZiAoaW5mbykge1xuICAvLyAgICAgICBsZXQgZ3JvdXBJZCA9IGluZm8uZ3JvdXBJZC5nZXQoKTtcbiAgLy8gICAgICAgbGV0IHZpc2l0Q29udGV4dFR5cGUgPSBpbmZvLnZpc2l0VHlwZS5nZXQoKTtcblxuICAvLyAgICAgICByZXR1cm4gdGhpcy5nZXRHcm91cFZpc2l0cyhncm91cElkLCB2aXNpdENvbnRleHRUeXBlKS50aGVuKFxuICAvLyAgICAgICAgIHJlcyA9PiB7XG4gIC8vICAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcmVzLmxlbmd0aDsgaW5kZXgrKykge1xuICAvLyAgICAgICAgICAgICBjb25zdCByZXNWaXNpdElkID0gcmVzW2luZGV4XS5pbmZvLmlkLmdldCgpO1xuICAvLyAgICAgICAgICAgICBpZiAocmVzVmlzaXRJZCA9PSB2aXNpdElkKSB7XG4gIC8vICAgICAgICAgICAgICAgcmVzLnJlbW92ZShyZXNbaW5kZXhdKTtcbiAgLy8gICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgLy8gICAgICAgICAgICAgfVxuICAvLyAgICAgICAgICAgfVxuICAvLyAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAvLyAgICAgICAgIH0pXG4gIC8vICAgICB9IGVsc2Uge1xuICAvLyAgICAgICByZXR1cm4gZmFsc2U7XG4gIC8vICAgICB9XG5cbiAgLy8gICB9KVxuICAvLyB9XG5cbiAgZGVsZXRlVmlzaXQodmlzaXRJZCwgcmVtb3ZlVmlzaXQsIHJlbW92ZVJlbGF0ZWRFdmVudCwgYmVnaW5EYXRlLCBlbmREYXRlKSB7XG5cbiAgICBpZiAocmVtb3ZlUmVsYXRlZEV2ZW50KSB7XG4gICAgICB0aGlzLnJlbW92ZVZpc2l0RXZlbnRzKHZpc2l0SWQsIGJlZ2luRGF0ZSwgZW5kRGF0ZSkudGhlbihlbCA9PiB7XG4gICAgICAgIGlmIChyZW1vdmVWaXNpdCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnJlbW92ZVZpc2l0KHZpc2l0SWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbDtcbiAgICAgIH0pXG4gICAgfSBlbHNlIGlmIChyZW1vdmVWaXNpdCkge1xuICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlVmlzaXQodmlzaXRJZCk7XG4gICAgfVxuXG4gIH1cblxuICByZW1vdmVWaXNpdEV2ZW50cyh2aXNpdElkLCBiZWdpbkRhdGUsIGVuZERhdGUpIHtcbiAgICAvLyBpZiAocmVtb3ZlUmVsYXRlZEV2ZW50KSB7XG4gICAgLy8gICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKHZpc2l0SWQsIFt0aGlzXG4gICAgLy8gICAgIC5WSVNJVF9UT19FVkVOVF9SRUxBVElPTlxuICAgIC8vICAgXSkudGhlbigoY2hpbGRyZW4pID0+IHtcbiAgICAvLyAgICAgbGV0IGNoaWxkcmVuUHJvbWlzZSA9IGNoaWxkcmVuLm1hcChlbCA9PiB7XG4gICAgLy8gICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5yZW1vdmVGcm9tR3JhcGgoZWwuaWQuZ2V0KCkpO1xuICAgIC8vICAgICB9KVxuXG4gICAgLy8gICAgIHJldHVybiBQcm9taXNlLmFsbChjaGlsZHJlblByb21pc2UpLnRoZW4oKCkgPT4ge1xuICAgIC8vICAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyh2aXNpdElkKTtcbiAgICAvLyAgICAgfSk7XG5cbiAgICAvLyAgIH0pXG4gICAgLy8gfSBlbHNlIHtcbiAgICAvLyAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8odmlzaXRJZCkpO1xuICAgIC8vIH1cblxuICAgIHJldHVybiB0aGlzLmdldEV2ZW50c0JldHdlZW5Ud29EYXRlKHZpc2l0SWQsIGJlZ2luRGF0ZSwgZW5kRGF0ZSkudGhlbihcbiAgICAgIGV2ZW50cyA9PiB7XG4gICAgICAgIGV2ZW50cy5mb3JFYWNoKGVsID0+IHtcbiAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UucmVtb3ZlRnJvbUdyYXBoKGVsLmlkKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgIH0pXG5cbiAgfVxuXG5cbiAgZ2V0RXZlbnRzQmV0d2VlblR3b0RhdGUodmlzaXRJZCwgYmVnaW5EYXRlLCBlbmREYXRlKSB7XG5cbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKHZpc2l0SWQsIFt0aGlzXG4gICAgICAuVklTSVRfVE9fRVZFTlRfUkVMQVRJT05cbiAgICBdKS50aGVuKChjaGlsZHJlbikgPT4ge1xuXG4gICAgICBjaGlsZHJlbiA9IGNoaWxkcmVuLm1hcChlbCA9PiBlbC5nZXQoKSk7XG5cbiAgICAgIHJldHVybiBjaGlsZHJlbi5maWx0ZXIoZWwgPT4ge1xuICAgICAgICByZXR1cm4gZWwuZGF0ZSA+PSBiZWdpbkRhdGUgJiYgZWwuZGF0ZSA8PSBlbmREYXRlO1xuICAgICAgfSlcblxuICAgIH0pXG5cbiAgfVxuXG4gIHJlbW92ZVZpc2l0KHZpc2l0SWQpIHtcbiAgICBsZXQgaW5mbyA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKHZpc2l0SWQpO1xuICAgIGlmIChpbmZvKSB7XG4gICAgICBsZXQgZ3JvdXBJZCA9IGluZm8uZ3JvdXBJZC5nZXQoKTtcbiAgICAgIGxldCB2aXNpdENvbnRleHRUeXBlID0gaW5mby52aXNpdFR5cGUuZ2V0KCk7XG5cbiAgICAgIHJldHVybiB0aGlzLmdldEdyb3VwVmlzaXRzKGdyb3VwSWQsIHZpc2l0Q29udGV4dFR5cGUpLnRoZW4oXG4gICAgICAgIHJlcyA9PiB7XG4gICAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHJlcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc1Zpc2l0SWQgPSByZXNbaW5kZXhdLmluZm8uaWQuZ2V0KCk7XG4gICAgICAgICAgICBpZiAocmVzVmlzaXRJZCA9PSB2aXNpdElkKSB7XG4gICAgICAgICAgICAgIHJlcy5yZW1vdmUocmVzW2luZGV4XSk7XG4gICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIGVkaXRWaXNpdCh2aXNpdElkLCBuZXdWYWx1ZXNPYmopIHtcbiAgICBpZiAodHlwZW9mIG5ld1ZhbHVlc09iaiAhPT0gXCJvYmplY3RcIikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCB2aXNpdE5vZGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0UmVhbE5vZGUodmlzaXRJZCk7XG5cbiAgICBpZiAodHlwZW9mIHZpc2l0Tm9kZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgZm9yIChjb25zdCBrZXkgaW4gbmV3VmFsdWVzT2JqKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gbmV3VmFsdWVzT2JqW2tleV07XG5cbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiB0eXBlb2YgdmlzaXROb2RlLmluZm9ba2V5XSAhPT1cbiAgICAgICAgICBcInVuZGVmaW5lZFwiKSB7XG5cbiAgICAgICAgICB2aXNpdE5vZGUuaW5mb1trZXldLnNldCh2YWx1ZSk7XG5cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHZpc2l0Tm9kZS5pbmZvW2tleV0gIT09XG4gICAgICAgICAgXCJ1bmRlZmluZWRcIikge1xuXG4gICAgICAgICAgZm9yIChjb25zdCBrZXkyIGluIHZhbHVlKSB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZTIgPSB2YWx1ZVtrZXkyXTtcblxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHZpc2l0Tm9kZS5pbmZvW2tleV1ba2V5Ml0gIT09IFwidW5kZWZpbmVkXCIpIHtcblxuICAgICAgICAgICAgICBpZiAoa2V5ID09PSBcImludGVydmVudGlvblwiICYmIGtleTIgPT09IFwibWVzdXJlXCIpIHtcblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUyICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cbiAgICAgICAgICAgICAgICAgIHZpc2l0Tm9kZS5pbmZvW2tleV1ba2V5Ml0uc2V0KG5ldyBDaG9pY2UoXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlMiwgW1xuICAgICAgICAgICAgICAgICAgICAgIFwibWludXRlKHMpXCIsIFwiZGF5KHMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgXCJ3ZWVrKHMpXCIsIFwibW9udGgocylcIixcbiAgICAgICAgICAgICAgICAgICAgICBcInllYXIocylcIlxuICAgICAgICAgICAgICAgICAgICBdKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHZpc2l0Tm9kZS5pbmZvW2tleV1ba2V5Ml0uc2V0KE5hTik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSBcInBlcmlvZGljaXR5XCIgJiYga2V5MiA9PT0gXCJtZXN1cmVcIikge1xuXG4gICAgICAgICAgICAgICAgdmlzaXROb2RlLmluZm9ba2V5XVtrZXkyXS5zZXQobmV3IENob2ljZSh2YWx1ZTIsIFtcbiAgICAgICAgICAgICAgICAgIFwiZGF5KHMpXCIsIFwid2VlayhzKVwiLFxuICAgICAgICAgICAgICAgICAgXCJtb250aChzKVwiLFxuICAgICAgICAgICAgICAgICAgXCJ5ZWFyKHMpXCJcbiAgICAgICAgICAgICAgICBdKSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdHlwZW9mIHZhbHVlMiAhPT0gXCJ1bmRlZmluZWRcIiA/IHZpc2l0Tm9kZS5pbmZvW2tleV1ba2V5Ml0uc2V0KFxuICAgICAgICAgICAgICAgICAgdmFsdWUyKSA6IHZpc2l0Tm9kZS5pbmZvW2tleV1ba2V5Ml0uc2V0KE5hTik7XG4gICAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIH1cblxuICBnZXRQdHJWYWx1ZShub2RlLCBwdHJOYW1lKSB7XG4gICAgbGV0IHJlYWxOb2RlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldFJlYWxOb2RlKG5vZGUuaWQuZ2V0KCkpO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgaWYgKCFyZWFsTm9kZS5pbmZvW3B0ck5hbWVdKSB7XG4gICAgICAgIHJlYWxOb2RlLmluZm8uYWRkX2F0dHIocHRyTmFtZSwge1xuICAgICAgICAgIHRhc2tzOiBuZXcgUHRyKG5ldyBMc3QoKSlcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJlYWxOb2RlLmluZm9bcHRyTmFtZV0udGFza3MubG9hZCh2YWx1ZSA9PiB7XG4gICAgICAgIHJldHVybiByZXNvbHZlKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0R3JvdXBWaXNpdHMoZ3JvdXBJZCwgdmlzaXR5VHlwZSkge1xuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oZ3JvdXBJZCwgW3RoaXMuR1JPVVBfVE9fVEFTS10pLnRoZW4oXG4gICAgICByZXMgPT4ge1xuICAgICAgICBsZXQgbm9kZUlkO1xuICAgICAgICBpZiAocmVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIG5vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgIG5hbWU6IFwibWFpbnRlbmFuY2VcIlxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkKFxuICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgIG5vZGVJZCxcbiAgICAgICAgICAgIHRoaXMuR1JPVVBfVE9fVEFTSyxcbiAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5vZGUgPVxuICAgICAgICAgIHR5cGVvZiBub2RlSWQgIT09IFwidW5kZWZpbmVkXCIgP1xuICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKG5vZGVJZCkgOlxuICAgICAgICAgIHJlc1swXTtcblxuICAgICAgICByZXR1cm4gdGhpcy5nZXRQdHJWYWx1ZShub2RlLCB2aXNpdHlUeXBlKTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgZ2VuZXJhdGVFdmVudCh2aXNpdFR5cGUsIGdyb3VwSWQsIGJlZ2luRGF0ZSwgZW5kRGF0ZSwgZXZlbnRzRGF0YSkge1xuICAgIHJldHVybiB0aGlzLmNyZWF0ZVZpc2l0Q29udGV4dCh2aXNpdFR5cGUpXG4gICAgICAudGhlbihlbCA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmxpbmtHcm91cFRvVmlzdENvbnRleHQoZWwuaWQuZ2V0KCksIGdyb3VwSWQpLnRoZW4oXG4gICAgICAgICAgcmVzID0+IHtcbiAgICAgICAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgICAgICAgdGhpcy5nZXRFdmVudFN0YXRlTm9kZShcbiAgICAgICAgICAgICAgICBlbC5pZC5nZXQoKSxcbiAgICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICAgIHRoaXMuRVZFTlRfU1RBVEVTLmRlY2xhcmVkLnR5cGVcbiAgICAgICAgICAgICAgKS50aGVuKHN0YXRlTm9kZSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGlkID0gc3RhdGVOb2RlLmlkLmdldCgpO1xuXG4gICAgICAgICAgICAgICAgZXZlbnRzRGF0YS5mb3JFYWNoKGV2ZW50SW5mbyA9PiB7XG4gICAgICAgICAgICAgICAgICBsZXQgZXZlbnRzRGF0ZSA9IHRoaXMuX2dldERhdGUoXG4gICAgICAgICAgICAgICAgICAgIGJlZ2luRGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgZW5kRGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRJbmZvLnBlcmlvZE51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRJbmZvLnBlcmlvZE1lc3VyZVxuICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgICAgZXZlbnRzRGF0ZS5mb3JFYWNoKGRhdGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50KFxuICAgICAgICAgICAgICAgICAgICAgIGVsLmlkLmdldCgpLFxuICAgICAgICAgICAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICAgICAgICAgICAgZXZlbnRJbmZvLFxuICAgICAgICAgICAgICAgICAgICAgIGAke2V2ZW50SW5mby5uYW1lfWAsXG4gICAgICAgICAgICAgICAgICAgICAgbmV3IERhdGUoZGF0ZSkuZ2V0VGltZSgpXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZXJyKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgYWRkRXZlbnQodmlzaXRUeXBlQ29udGV4dElkLCBncm91cElkLCBzdGF0ZUlkLCB2aXNpdEluZm8sIG5hbWUsIGRhdGUpIHtcbiAgICBsZXQgc3RhdGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhzdGF0ZUlkKS5zdGF0ZS5nZXQoKTtcblxuICAgIGxldCBldmVudCA9IG5ldyBFdmVudE1vZGVsKG5hbWUsIGRhdGUsIHN0YXRlLCBncm91cElkKTtcblxuICAgIGxldCBldmVudE5vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgZGF0ZTogZGF0ZSxcbiAgICAgICAgc3RhdGVJZDogc3RhdGVJZCxcbiAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgICBncm91cElkOiBncm91cElkLFxuICAgICAgICB2aXNpdElkOiB2aXNpdEluZm8uaWRcbiAgICAgIH0sXG4gICAgICBldmVudFxuICAgICk7XG5cbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkSW5Db250ZXh0KFxuICAgICAgICBzdGF0ZUlkLFxuICAgICAgICBldmVudE5vZGVJZCxcbiAgICAgICAgdmlzaXRUeXBlQ29udGV4dElkLFxuICAgICAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OLFxuICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICApXG4gICAgICAudGhlbihlbCA9PiB7XG4gICAgICAgIGlmIChlbCkgcmV0dXJuIGV2ZW50Tm9kZUlkO1xuICAgICAgfSlcbiAgICAgIC50aGVuKGV2ZW50SWQgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGV2ZW50SWQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKGdyb3VwSWQsIFtcbiAgICAgICAgICAgIEVRVUlQTUVOVFNfVE9fRUxFTUVOVF9SRUxBVElPTlxuICAgICAgICAgIF0pLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgICAgICAgICAgY2hpbGRyZW4ubWFwKGNoaWxkID0+IHtcbiAgICAgICAgICAgICAgbGV0IG5hbWUgPSBgJHtjaGlsZC5uYW1lLmdldCgpfWA7XG4gICAgICAgICAgICAgIGxldCB0YXNrID0gbmV3IFRhc2tNb2RlbChcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGNoaWxkLmRiaWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgY2hpbGQuYmltRmlsZUlkLmdldCgpLFxuICAgICAgICAgICAgICAgIHZpc2l0SW5mby5uYW1lLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICBsZXQgdGFza0lkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmNyZWF0ZU5vZGUoe1xuICAgICAgICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgICAgIHR5cGU6IFwidGFza1wiLFxuICAgICAgICAgICAgICAgICAgZGJJZDogY2hpbGQuZGJpZC5nZXQoKSxcbiAgICAgICAgICAgICAgICAgIGJpbUZpbGVJZDogY2hpbGQuYmltRmlsZUlkLmdldCgpLFxuICAgICAgICAgICAgICAgICAgdmlzaXRJZDogdmlzaXRJbmZvLmlkLFxuICAgICAgICAgICAgICAgICAgZXZlbnRJZDogZXZlbnRJZCxcbiAgICAgICAgICAgICAgICAgIGdyb3VwSWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICAgICAgICBkb25lOiBmYWxzZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdGFza1xuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkSW5Db250ZXh0KFxuICAgICAgICAgICAgICAgICAgZXZlbnRJZCxcbiAgICAgICAgICAgICAgICAgIHRhc2tJZCxcbiAgICAgICAgICAgICAgICAgIHZpc2l0VHlwZUNvbnRleHRJZCxcbiAgICAgICAgICAgICAgICAgIHRoaXMuRVZFTlRfVE9fVEFTS19SRUxBVElPTixcbiAgICAgICAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZChcbiAgICAgICAgICAgICAgICAgIHZpc2l0SW5mby5pZCxcbiAgICAgICAgICAgICAgICAgIGV2ZW50SWQsXG4gICAgICAgICAgICAgICAgICB0aGlzLlZJU0lUX1RPX0VWRU5UX1JFTEFUSU9OLFxuICAgICAgICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBjcmVhdGVWaXNpdENvbnRleHQodmlzaXRUeXBlKSB7XG4gICAgbGV0IHZpc2l0ID0gdGhpcy5WSVNJVFMuZmluZChlbCA9PiB7XG4gICAgICByZXR1cm4gZWwudHlwZSA9PT0gdmlzaXRUeXBlO1xuICAgIH0pO1xuXG4gICAgaWYgKHR5cGVvZiB2aXNpdCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgY29uc3QgY29udGV4dE5hbWUgPSBgJHt2aXNpdC5uYW1lfWA7XG5cbiAgICAgIGxldCBjb250ZXh0ID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENvbnRleHQoY29udGV4dE5hbWUpO1xuICAgICAgaWYgKHR5cGVvZiBjb250ZXh0ICE9PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbnRleHRcbiAgICAgICAgLmluZm8pO1xuXG4gICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENvbnRleHQoXG4gICAgICAgIGNvbnRleHROYW1lLFxuICAgICAgICB2aXNpdFR5cGUsXG4gICAgICAgIG5ldyBNb2RlbCh7XG4gICAgICAgICAgbmFtZTogdGhpcy5WSVNJVF9DT05URVhUX05BTUVcbiAgICAgICAgfSlcbiAgICAgICkudGhlbihjb250ZXh0Q3JlYXRlZCA9PiB7XG4gICAgICAgIHJldHVybiBjb250ZXh0Q3JlYXRlZC5pbmZvO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcInZpc2l0Tm90Rm91bmRcIik7XG4gICAgfVxuICB9XG5cbiAgbGlua0dyb3VwVG9WaXN0Q29udGV4dCh2aXNpdENvbnRleHRJZCwgZ3JvdXBJZCkge1xuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4odmlzaXRDb250ZXh0SWQsIFtcbiAgICAgICAgdGhpcy5WSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OXG4gICAgICBdKVxuICAgICAgLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZHJlbltpXS5pZC5nZXQoKTtcbiAgICAgICAgICBpZiAoY2hpbGQgPT09IGdyb3VwSWQpIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGVsID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dChcbiAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgdGhpcy5WSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OLFxuICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICkudGhlbihhc3luYyByZXMgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdldEV2ZW50U3RhdGVOb2RlKFxuICAgICAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICAgICAgdGhpcy5FVkVOVF9TVEFURVMucHJvY2Vzc2luZy50eXBlXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoXG4gICAgICAgICAgICAgICAgdmlzaXRDb250ZXh0SWQsXG4gICAgICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFUy5kb25lLnR5cGVcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgZ2V0RXZlbnRTdGF0ZU5vZGUodmlzaXRDb250ZXh0SWQsIGdyb3VwSWQsIGV2ZW50U2F0ZSkge1xuICAgIGxldCBldmVudCA9IHRoaXMuX2V2ZW50U2F0ZUlzVmFsaWQoZXZlbnRTYXRlKTtcblxuICAgIGlmICh0eXBlb2YgZXZlbnQgPT09IFwidW5kZWZpbmVkXCIpIHJldHVybjtcblxuICAgIGxldCBjb250ZXh0VHlwZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKHZpc2l0Q29udGV4dElkKS50eXBlLmdldCgpO1xuICAgIGxldCByZWxhdGlvbk5hbWU7XG5cbiAgICBzd2l0Y2ggKGNvbnRleHRUeXBlKSB7XG4gICAgICBjYXNlIHRoaXMuTUFJTlRFTkFOQ0VfVklTSVQ6XG4gICAgICAgIHJlbGF0aW9uTmFtZSA9IHRoaXMuTUFJTlRFTkFOQ0VfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT047XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLlNFQ1VSSVRZX1ZJU0lUOlxuICAgICAgICByZWxhdGlvbk5hbWUgPSB0aGlzLlNFQ1VSSVRZX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdGhpcy5ESUFHTk9TVElDX1ZJU0lUOlxuICAgICAgICByZWxhdGlvbk5hbWUgPSB0aGlzLkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT047XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLlJFR1VMQVRPUllfVklTSVQ6XG4gICAgICAgIHJlbGF0aW9uTmFtZSA9IHRoaXMuUkVHVUxBVE9SWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTjtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihncm91cElkLCBbcmVsYXRpb25OYW1lXSlcbiAgICAgIC50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG5hbWUgPSBjaGlsZHJlbltpXS5uYW1lLmdldCgpO1xuICAgICAgICAgIGNvbnN0IHR5cGUgPSBjaGlsZHJlbltpXS5zdGF0ZS5nZXQoKTtcblxuICAgICAgICAgIGlmIChuYW1lID09PSBldmVudFNhdGUgfHwgdHlwZSA9PT0gZXZlbnRTYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gY2hpbGRyZW5baV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGVsID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgbGV0IGFyZ05vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgIG5hbWU6IGV2ZW50Lm5hbWUsXG4gICAgICAgICAgICBzdGF0ZTogZXZlbnQudHlwZSxcbiAgICAgICAgICAgIGdyb3VwSWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICB0eXBlOiBcIkV2ZW50U3RhdGVcIlxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dChcbiAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICBhcmdOb2RlSWQsXG4gICAgICAgICAgICB2aXNpdENvbnRleHRJZCxcbiAgICAgICAgICAgIHJlbGF0aW9uTmFtZSxcbiAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICApLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgIGlmIChyZXMpIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhhcmdOb2RlSWQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBlbDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICB2YWxpZGF0ZVRhc2soY29udGV4dElkLCBncm91cElkLCBldmVudElkLCB0YXNrSWQpIHtcbiAgICBsZXQgdGFza05vZGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0UmVhbE5vZGUodGFza0lkKTtcbiAgICB0YXNrTm9kZS5pbmZvLmRvbmUuc2V0KCF0YXNrTm9kZS5pbmZvLmRvbmUuZ2V0KCkpO1xuXG4gICAgbGV0IGN1cnJlbnRTdGF0ZUlkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8oZXZlbnRJZCkuc3RhdGVJZC5nZXQoKTtcblxuICAgIHJldHVybiB0aGlzLl9nZXRTdGF0ZShjb250ZXh0SWQsIGdyb3VwSWQsIGV2ZW50SWQpLnRoZW4obmV4dFN0YXRlID0+IHtcblxuICAgICAgbGV0IG5leHRTdGF0ZUlkID0gbmV4dFN0YXRlLmlkLmdldCgpO1xuXG4gICAgICBpZiAobmV4dFN0YXRlSWQgPT09IGN1cnJlbnRTdGF0ZUlkKSByZXR1cm4gdHJ1ZTtcblxuICAgICAgcmV0dXJuIHRoaXMuX3N3aXRjaEV2ZW50U3RhdGUoZXZlbnRJZCwgY3VycmVudFN0YXRlSWQsIG5leHRTdGF0ZUlkLFxuICAgICAgICBjb250ZXh0SWQpO1xuXG4gICAgfSk7XG5cbiAgfVxuXG5cblxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgUFJJVkFURVMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gIF9nZXREYXRlKGJlZ2luRGF0ZSwgZW5kRGF0ZSwgcGVyaW9kTnVtYmVyLCBwZXJpb2RNZXN1cmUpIHtcbiAgICBsZXQgbWVzdXJlID0gW1wiZGF5c1wiLCBcIndlZWtzXCIsIFwibW9udGhzXCIsIFwieWVhcnNcIl1bcGVyaW9kTWVzdXJlXTtcblxuICAgIGxldCBldmVudHNEYXRlID0gW107XG5cbiAgICBsZXQgZGF0ZSA9IG1vbWVudChiZWdpbkRhdGUpO1xuICAgIGxldCBlbmQgPSBtb21lbnQoZW5kRGF0ZSk7XG5cbiAgICB3aGlsZSAoZW5kLmRpZmYoZGF0ZSkgPj0gMCkge1xuICAgICAgZXZlbnRzRGF0ZS5wdXNoKGRhdGUudG9EYXRlKCkpO1xuXG4gICAgICBkYXRlID0gZGF0ZS5hZGQocGVyaW9kTnVtYmVyLCBtZXN1cmUpO1xuICAgIH1cblxuICAgIHJldHVybiBldmVudHNEYXRlO1xuICB9XG5cbiAgX2Zvcm1hdERhdGUoYXJnRGF0ZSkge1xuICAgIGxldCBkYXRlID0gbmV3IERhdGUoYXJnRGF0ZSk7XG5cbiAgICByZXR1cm4gYCR7KCgpID0+IHtcbiAgICAgIGxldCBkID0gZGF0ZS5nZXREYXRlKCk7XG4gICAgICByZXR1cm4gZC50b1N0cmluZygpLmxlbmd0aCA+IDEgPyBkIDogJzAnICsgZDtcbiAgICB9KSgpfS8keygoKSA9PiB7XG5cbiAgICAgIGxldCBkID0gZGF0ZS5nZXRNb250aCgpICsgMTtcbiAgICAgIHJldHVybiBkLnRvU3RyaW5nKCkubGVuZ3RoID4gMSA/IGQgOiAnMCcgKyBkO1xuXG4gICAgfSkoKX0vJHtkYXRlLmdldEZ1bGxZZWFyKCl9YDtcbiAgfVxuXG4gIF9ldmVudFNhdGVJc1ZhbGlkKGV2ZW50U3RhdGUpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLkVWRU5UX1NUQVRFUykge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLkVWRU5UX1NUQVRFU1trZXldLm5hbWUgPT09IGV2ZW50U3RhdGUgfHxcbiAgICAgICAgdGhpcy5FVkVOVF9TVEFURVNba2V5XS50eXBlID09PSBldmVudFN0YXRlXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuRVZFTlRfU1RBVEVTW2tleV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIF9nZXRTdGF0ZShjb250ZXh0SWQsIGdyb3VwSWQsIGV2ZW50SWQpIHtcblxuICAgIHJldHVybiB0aGlzLmdldEV2ZW50VGFza3MoZXZlbnRJZCkudGhlbih0YXNrcyA9PiB7XG4gICAgICBsZXQgdGFza3NWYWxpZGF0ZWQgPSB0YXNrcy5maWx0ZXIoZWwgPT4gZWwuZG9uZSk7XG4gICAgICBsZXQgc3RhdGVPYmo7XG5cbiAgICAgIGlmICh0YXNrc1ZhbGlkYXRlZC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgc3RhdGVPYmogPSB0aGlzLkVWRU5UX1NUQVRFUy5kZWNsYXJlZDtcbiAgICAgIH0gZWxzZSBpZiAodGFza3NWYWxpZGF0ZWQubGVuZ3RoID09PSB0YXNrcy5sZW5ndGgpIHtcbiAgICAgICAgc3RhdGVPYmogPSB0aGlzLkVWRU5UX1NUQVRFUy5kb25lO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGVPYmogPSB0aGlzLkVWRU5UX1NUQVRFUy5wcm9jZXNzaW5nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5nZXRFdmVudFN0YXRlTm9kZShjb250ZXh0SWQsIGdyb3VwSWQsIHN0YXRlT2JqLnR5cGUpO1xuXG4gICAgfSlcblxuICB9XG5cbiAgX3N3aXRjaEV2ZW50U3RhdGUoZXZlbnRJZCwgZnJvbVN0YXRlSWQsIHRvU3RhdGVJZCwgY29udGV4dElkKSB7XG5cblxuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UucmVtb3ZlQ2hpbGQoZnJvbVN0YXRlSWQsIGV2ZW50SWQsIHRoaXNcbiAgICAgICAgLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OLCBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFKVxuICAgICAgLnRoZW4ocmVtb3ZlZCA9PiB7XG4gICAgICAgIGlmIChyZW1vdmVkKSB7XG4gICAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dCh0b1N0YXRlSWQsIGV2ZW50SWQsXG4gICAgICAgICAgICAgIGNvbnRleHRJZCxcbiAgICAgICAgICAgICAgdGhpcy5FVkVOVF9TVEFURV9UT19FVkVOVF9SRUxBVElPTixcbiAgICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRSlcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgbGV0IEV2ZW50Tm9kZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRSZWFsTm9kZShldmVudElkKTtcbiAgICAgICAgICAgICAgICBsZXQgbmV3U3RhdGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyh0b1N0YXRlSWQpLnN0YXRlXG4gICAgICAgICAgICAgICAgICAuZ2V0KCk7XG5cblxuICAgICAgICAgICAgICAgIEV2ZW50Tm9kZS5pbmZvLnN0YXRlLnNldChuZXdTdGF0ZSk7XG4gICAgICAgICAgICAgICAgRXZlbnROb2RlLmluZm8uc3RhdGVJZC5zZXQodG9TdGF0ZUlkKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9KVxuXG5cbiAgfVxuXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyAgICAgICAgICAgICAgICAgICAgICAgIEdFVCBJTkZPUk1BVElPTiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgZ2V0VmlzaXRHcm91cHModmlzaXRUeXBlKSB7XG4gICAgbGV0IGNvbnRleHRzID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENvbnRleHRXaXRoVHlwZSh2aXNpdFR5cGUpO1xuICAgIGlmIChjb250ZXh0cy5sZW5ndGggPT09IDApIHJldHVybiBbXTtcblxuICAgIGxldCBjb250ZXh0SWQgPSBjb250ZXh0c1swXS5pbmZvLmlkLmdldCgpO1xuXG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihcbiAgICAgIGNvbnRleHRJZCxcbiAgICAgIHRoaXMuVklTSVRfVFlQRV9UT19HUk9VUF9SRUxBVElPTlxuICAgICkudGhlbihyZXMgPT4ge1xuICAgICAgcmV0dXJuIHJlcy5tYXAoZWwgPT4gZWwuZ2V0KCkpO1xuICAgIH0pO1xuICB9XG5cblxuICBnZXRHcm91cEV2ZW50U3RhdGVzKGNvbnRleHRJZCwgZ3JvdXBJZCkge1xuICAgIGxldCBwcm9taXNlcyA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5FVkVOVF9TVEFURVMpIHtcbiAgICAgIHByb21pc2VzLnB1c2goXG4gICAgICAgIHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoXG4gICAgICAgICAgY29udGV4dElkLFxuICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgdGhpcy5FVkVOVF9TVEFURVNba2V5XS50eXBlXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcbiAgfVxuXG4gIGdldEdyb3VwRXZlbnRzKFxuICAgIGdyb3VwSWQsXG4gICAgVklTSVRfVFlQRVMgPSBbXG4gICAgICB0aGlzLk1BSU5URU5BTkNFX1ZJU0lULFxuICAgICAgdGhpcy5SRUdVTEFUT1JZX1ZJU0lULFxuICAgICAgdGhpcy5TRUNVUklUWV9WSVNJVCxcbiAgICAgIHRoaXMuRElBR05PU1RJQ19WSVNJVFxuICAgIF1cbiAgKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KFZJU0lUX1RZUEVTKSkgVklTSVRfVFlQRVMgPSBbVklTSVRfVFlQRVNdO1xuXG4gICAgcmV0dXJuIFZJU0lUX1RZUEVTLm1hcCh2aXNpdFR5cGUgPT4ge1xuICAgICAgbGV0IHZpc2l0ID0gdGhpcy5WSVNJVFMuZmluZChlbCA9PiB7XG4gICAgICAgIHJldHVybiBlbC50eXBlID09PSB2aXNpdFR5cGU7XG4gICAgICB9KTtcblxuICAgICAgbGV0IGNvbnRleHQgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q29udGV4dCh2aXNpdC5uYW1lKTtcblxuICAgICAgaWYgKHR5cGVvZiBjb250ZXh0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGxldCBjb250ZXh0SWQgPSBjb250ZXh0LmluZm8uaWQuZ2V0KCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JvdXBFdmVudFN0YXRlcyhjb250ZXh0SWQsIGdyb3VwSWQpLnRoZW4oXG4gICAgICAgICAgdmFsdWVzID0+IHtcbiAgICAgICAgICAgIGxldCBwcm9tID0gdmFsdWVzLm1hcChhc3luYyBldmVudFR5cGUgPT4ge1xuICAgICAgICAgICAgICBsZXQgcmVzID0gZXZlbnRUeXBlLmdldCgpO1xuXG4gICAgICAgICAgICAgIHJlc1tcInZpc2l0X3R5cGVcIl0gPSB2aXNpdFR5cGU7XG5cbiAgICAgICAgICAgICAgbGV0IGV2ZW50cyA9IGF3YWl0IFNwaW5hbEdyYXBoU2VydmljZVxuICAgICAgICAgICAgICAgIC5nZXRDaGlsZHJlbihcbiAgICAgICAgICAgICAgICAgIHJlcy5pZCwgW1xuICAgICAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OXG4gICAgICAgICAgICAgICAgICBdKTtcblxuICAgICAgICAgICAgICByZXNbXCJldmVudHNcIl0gPSBldmVudHMubWFwKGVsID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwuZ2V0KCk7XG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb20pLnRoZW4oYWxsRXZlbnRzID0+IHtcbiAgICAgICAgICAgICAgbGV0IHZhbHVlcyA9IHt9O1xuXG4gICAgICAgICAgICAgIGFsbEV2ZW50cy5mb3JFYWNoKHZhbCA9PiB7XG4gICAgICAgICAgICAgICAgdmFsdWVzW3ZhbC5zdGF0ZV0gPSB2YWwuZXZlbnRzO1xuICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIFt2aXNpdFR5cGVdOiB2YWx1ZXNcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZ2V0RXZlbnRUYXNrcyhldmVudElkKSB7XG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihldmVudElkLCBbdGhpc1xuICAgICAgICAuRVZFTlRfVE9fVEFTS19SRUxBVElPTlxuICAgICAgXSlcbiAgICAgIC50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgICAgcmV0dXJuIGNoaWxkcmVuLm1hcChlbCA9PiBlbC5nZXQoKSlcbiAgICAgIH0pXG4gIH1cblxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gICAgICAgICAgICAgICAgICAgICAgICBDb21tZW50IE1hbmFnZXIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gIGFkZENvbW1lbnQodGFza0lkLCB1c2VySWQsIG1lc3NhZ2UpIHtcbiAgICBpZiAobWVzc2FnZSAmJiBtZXNzYWdlLnRyaW0oKS5sZW5ndGggPiAwICYmIHVzZXJJZCkge1xuICAgICAgbGV0IGNvbW1lbnROb2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgIHVzZXJJZDogdXNlcklkLFxuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICB0YXNrSWQ6IHRhc2tJZCxcbiAgICAgICAgZGF0ZTogRGF0ZS5ub3coKVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChjb21tZW50Tm9kZUlkKSB7XG4gICAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGQodGFza0lkLCBjb21tZW50Tm9kZUlkLCB0aGlzXG4gICAgICAgICAgLlRBU0tfVE9fQ09NTUVOVFNfUkVMQVRJT04sXG4gICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRSk7XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBnZXRUYXNrc0NvbW1lbnRzKHRhc2tJZCkge1xuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4odGFza0lkLCBbdGhpc1xuICAgICAgLlRBU0tfVE9fQ09NTUVOVFNfUkVMQVRJT05cbiAgICBdKS50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgIHJldHVybiBjaGlsZHJlbi5tYXAoZWwgPT4gZWwuZ2V0KCkpO1xuICAgIH0pXG4gIH1cblxufVxuXG5sZXQgc3BpbmFsVmlzaXRTZXJ2aWNlID0gbmV3IFNwaW5hbFZpc2l0U2VydmljZSgpO1xuXG5leHBvcnQgZGVmYXVsdCBzcGluYWxWaXNpdFNlcnZpY2U7Il19