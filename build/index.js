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

  getVisitEvents(visitId) {
    return this.getEventsBetweenTwoDate(visitId);
  }

  getEventsBetweenTwoDate(visitId, beginDate, endDate) {

    if (typeof beginDate === "undefined") beginDate = 0;

    if (typeof endDate == "undefined") endDate = Date.now() * 31536000000 * 100;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJTcGluYWxWaXNpdFNlcnZpY2UiLCJjb25zdHJ1Y3RvciIsIlZJU0lUX0NPTlRFWFRfTkFNRSIsIkNPTlRFWFRfVFlQRSIsIlZJU0lUX1RZUEUiLCJNQUlOVEVOQU5DRV9WSVNJVCIsIlJFR1VMQVRPUllfVklTSVQiLCJTRUNVUklUWV9WSVNJVCIsIkRJQUdOT1NUSUNfVklTSVQiLCJFVkVOVF9TVEFURVMiLCJPYmplY3QiLCJmcmVlemUiLCJkZWNsYXJlZCIsIm5hbWUiLCJ0eXBlIiwicHJvY2Vzc2luZyIsImRvbmUiLCJWSVNJVFMiLCJNQUlOVEVOQU5DRV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIlJFR1VMQVRPUllfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJTRUNVUklUWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJHUk9VUF9UT19UQVNLIiwiVklTSVRfVE9fRVZFTlRfUkVMQVRJT04iLCJWSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OIiwiRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04iLCJFVkVOVF9UT19UQVNLX1JFTEFUSU9OIiwiVEFTS19UT19DT01NRU5UU19SRUxBVElPTiIsImdldEFsbFZpc2l0cyIsImFkZFZpc2l0T25Hcm91cCIsImdyb3VwSWQiLCJ2aXNpdE5hbWUiLCJwZXJpb2RpY2l0eU51bWJlciIsInBlcmlvZGljaXR5TWVzdXJlIiwidmlzaXRUeXBlIiwiaW50ZXJ2ZW50aW9uTnVtYmVyIiwiaW50ZXJ2ZW50aW9uTWVzdXJlIiwiZGVzY3JpcHRpb24iLCJTcGluYWxHcmFwaFNlcnZpY2UiLCJnZXRDaGlsZHJlbiIsInRoZW4iLCJjaGlsZHJlbiIsImFyZ05vZGVJZCIsImxlbmd0aCIsImNyZWF0ZU5vZGUiLCJhZGRDaGlsZCIsIlNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEUiLCJub2RlIiwiZ2V0SW5mbyIsImdldFB0clZhbHVlIiwibHN0IiwidGFzayIsIlZpc2l0TW9kZWwiLCJub2RlSWQiLCJwZXJpb2RpY2l0eSIsIm51bWJlciIsImdldCIsIm1lc3VyZSIsImludGVydmVudGlvbiIsInJlYWxOb2RlIiwiZ2V0UmVhbE5vZGUiLCJwdXNoIiwiaW5mbyIsImRlbGV0ZVZpc2l0IiwidmlzaXRJZCIsInJlbW92ZVZpc2l0IiwicmVtb3ZlUmVsYXRlZEV2ZW50IiwiYmVnaW5EYXRlIiwiZW5kRGF0ZSIsInJlbW92ZVZpc2l0RXZlbnRzIiwiZWwiLCJnZXRFdmVudHNCZXR3ZWVuVHdvRGF0ZSIsImV2ZW50cyIsImZvckVhY2giLCJyZW1vdmVGcm9tR3JhcGgiLCJpZCIsImdldFZpc2l0RXZlbnRzIiwiRGF0ZSIsIm5vdyIsIm1hcCIsImZpbHRlciIsImRhdGUiLCJ2aXNpdENvbnRleHRUeXBlIiwiZ2V0R3JvdXBWaXNpdHMiLCJyZXMiLCJpbmRleCIsInJlc1Zpc2l0SWQiLCJyZW1vdmUiLCJQcm9taXNlIiwicmVzb2x2ZSIsImVkaXRWaXNpdCIsIm5ld1ZhbHVlc09iaiIsInZpc2l0Tm9kZSIsImtleSIsInZhbHVlIiwic2V0Iiwia2V5MiIsInZhbHVlMiIsIkNob2ljZSIsIk5hTiIsInB0ck5hbWUiLCJhZGRfYXR0ciIsInRhc2tzIiwiUHRyIiwiTHN0IiwibG9hZCIsInZpc2l0eVR5cGUiLCJnZW5lcmF0ZUV2ZW50IiwiZXZlbnRzRGF0YSIsImNyZWF0ZVZpc2l0Q29udGV4dCIsImxpbmtHcm91cFRvVmlzdENvbnRleHQiLCJnZXRFdmVudFN0YXRlTm9kZSIsInN0YXRlTm9kZSIsImV2ZW50SW5mbyIsImV2ZW50c0RhdGUiLCJfZ2V0RGF0ZSIsInBlcmlvZE51bWJlciIsInBlcmlvZE1lc3VyZSIsImFkZEV2ZW50IiwiZ2V0VGltZSIsImNhdGNoIiwiZXJyIiwiY29uc29sZSIsImxvZyIsInZpc2l0VHlwZUNvbnRleHRJZCIsInN0YXRlSWQiLCJ2aXNpdEluZm8iLCJzdGF0ZSIsImV2ZW50IiwiRXZlbnRNb2RlbCIsImV2ZW50Tm9kZUlkIiwiYWRkQ2hpbGRJbkNvbnRleHQiLCJldmVudElkIiwiRVFVSVBNRU5UU19UT19FTEVNRU5UX1JFTEFUSU9OIiwiY2hpbGQiLCJUYXNrTW9kZWwiLCJkYmlkIiwiYmltRmlsZUlkIiwidGFza0lkIiwiZGJJZCIsImFsbCIsInZpc2l0IiwiZmluZCIsImNvbnRleHROYW1lIiwiY29udGV4dCIsImdldENvbnRleHQiLCJhZGRDb250ZXh0IiwiTW9kZWwiLCJjb250ZXh0Q3JlYXRlZCIsInJlamVjdCIsInZpc2l0Q29udGV4dElkIiwiaSIsImV2ZW50U2F0ZSIsIl9ldmVudFNhdGVJc1ZhbGlkIiwiY29udGV4dFR5cGUiLCJyZWxhdGlvbk5hbWUiLCJ2YWxpZGF0ZVRhc2siLCJjb250ZXh0SWQiLCJ0YXNrTm9kZSIsImN1cnJlbnRTdGF0ZUlkIiwiX2dldFN0YXRlIiwibmV4dFN0YXRlIiwibmV4dFN0YXRlSWQiLCJfc3dpdGNoRXZlbnRTdGF0ZSIsImVuZCIsImRpZmYiLCJ0b0RhdGUiLCJhZGQiLCJfZm9ybWF0RGF0ZSIsImFyZ0RhdGUiLCJkIiwiZ2V0RGF0ZSIsInRvU3RyaW5nIiwiZ2V0TW9udGgiLCJnZXRGdWxsWWVhciIsImV2ZW50U3RhdGUiLCJ1bmRlZmluZWQiLCJnZXRFdmVudFRhc2tzIiwidGFza3NWYWxpZGF0ZWQiLCJzdGF0ZU9iaiIsImZyb21TdGF0ZUlkIiwidG9TdGF0ZUlkIiwicmVtb3ZlQ2hpbGQiLCJyZW1vdmVkIiwiRXZlbnROb2RlIiwibmV3U3RhdGUiLCJnZXRWaXNpdEdyb3VwcyIsImNvbnRleHRzIiwiZ2V0Q29udGV4dFdpdGhUeXBlIiwiZ2V0R3JvdXBFdmVudFN0YXRlcyIsInByb21pc2VzIiwiZ2V0R3JvdXBFdmVudHMiLCJWSVNJVF9UWVBFUyIsIkFycmF5IiwiaXNBcnJheSIsInZhbHVlcyIsInByb20iLCJldmVudFR5cGUiLCJhbGxFdmVudHMiLCJ2YWwiLCJhZGRDb21tZW50IiwidXNlcklkIiwibWVzc2FnZSIsInRyaW0iLCJjb21tZW50Tm9kZUlkIiwiZ2V0VGFza3NDb21tZW50cyIsInNwaW5hbFZpc2l0U2VydmljZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7O0FBS0E7O0FBSUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBRUE7O0FBTUE7Ozs7Ozs7O0FBRUEsTUFBTUEsa0JBQU4sQ0FBeUI7QUFDdkJDLGdCQUFjO0FBQ1osU0FBS0Msa0JBQUwsR0FBMEIsZ0JBQTFCO0FBQ0EsU0FBS0MsWUFBTCxHQUFvQixlQUFwQjs7QUFFQSxTQUFLQyxVQUFMLEdBQWtCLE9BQWxCOztBQUVBLFNBQUtDLGlCQUFMLEdBQXlCLG1CQUF6QjtBQUNBLFNBQUtDLGdCQUFMLEdBQXdCLGtCQUF4QjtBQUNBLFNBQUtDLGNBQUwsR0FBc0IsZ0JBQXRCO0FBQ0EsU0FBS0MsZ0JBQUwsR0FBd0Isa0JBQXhCOztBQUVBLFNBQUtDLFlBQUwsR0FBb0JDLE9BQU9DLE1BQVAsQ0FBYztBQUNoQ0MsZ0JBQVU7QUFDUkMsY0FBTSxTQURFO0FBRVJDLGNBQU07QUFGRSxPQURzQjtBQUtoQ0Msa0JBQVk7QUFDVkYsY0FBTSxTQURJO0FBRVZDLGNBQU07QUFGSSxPQUxvQjtBQVNoQ0UsWUFBTTtBQUNKSCxjQUFNLFVBREY7QUFFSkMsY0FBTTtBQUZGO0FBVDBCLEtBQWQsQ0FBcEI7O0FBZUEsU0FBS0csTUFBTCxHQUFjUCxPQUFPQyxNQUFQLENBQWMsQ0FBQztBQUMzQkcsWUFBTSxLQUFLVCxpQkFEZ0I7QUFFM0JRLFlBQU07QUFGcUIsS0FBRCxFQUd6QjtBQUNEQyxZQUFNLEtBQUtSLGdCQURWO0FBRURPLFlBQU07QUFGTCxLQUh5QixFQU16QjtBQUNEQyxZQUFNLEtBQUtQLGNBRFY7QUFFRE0sWUFBTTtBQUZMLEtBTnlCLEVBU3pCO0FBQ0RDLFlBQU0sS0FBS04sZ0JBRFY7QUFFREssWUFBTTtBQUZMLEtBVHlCLENBQWQsQ0FBZDs7QUFlQSxTQUFLSyxzQ0FBTCxHQUNFLCtCQURGOztBQUdBLFNBQUtDLHFDQUFMLEdBQ0UsOEJBREY7O0FBR0EsU0FBS0MsbUNBQUwsR0FBMkMsNEJBQTNDOztBQUVBLFNBQUtDLHFDQUFMLEdBQ0UsOEJBREY7O0FBR0EsU0FBS0MsYUFBTCxHQUFxQixVQUFyQjs7QUFFQSxTQUFLQyx1QkFBTCxHQUErQixlQUEvQjs7QUFFQSxTQUFLQyw0QkFBTCxHQUFvQyxlQUFwQztBQUNBLFNBQUtDLDZCQUFMLEdBQXFDLFVBQXJDO0FBQ0EsU0FBS0Msc0JBQUwsR0FBOEIsU0FBOUI7O0FBRUEsU0FBS0MseUJBQUwsR0FBaUMsWUFBakM7QUFDRDs7QUFFREMsaUJBQWU7QUFDYixXQUFPLEtBQUtYLE1BQVo7QUFDRDs7QUFFRFksa0JBQ0VDLE9BREYsRUFFRUMsU0FGRixFQUdFQyxpQkFIRixFQUlFQyxpQkFKRixFQUtFQyxTQUxGLEVBTUVDLGtCQU5GLEVBT0VDLGtCQVBGLEVBUUVDLFdBUkYsRUFTRTtBQUNBLFdBQU9DLGdEQUFtQkMsV0FBbkIsQ0FBK0JULE9BQS9CLEVBQXdDLENBQUMsS0FBS1IsYUFBTixDQUF4QyxFQUE4RGtCLElBQTlELENBQ0xDLFlBQVk7QUFDVixVQUFJQyxTQUFKO0FBQ0EsVUFBSUQsU0FBU0UsTUFBVCxLQUFvQixDQUF4QixFQUEyQjtBQUN6QkQsb0JBQVlKLGdEQUFtQk0sVUFBbkIsQ0FBOEI7QUFDeEMvQixnQkFBTTtBQURrQyxTQUE5QixDQUFaOztBQUlBeUIsd0RBQW1CTyxRQUFuQixDQUNFZixPQURGLEVBRUVZLFNBRkYsRUFHRSxLQUFLcEIsYUFIUCxFQUlFd0IseURBSkY7QUFNRDs7QUFFRCxVQUFJQyxPQUNGLE9BQU9MLFNBQVAsS0FBcUIsV0FBckIsR0FDQUosZ0RBQW1CVSxPQUFuQixDQUEyQk4sU0FBM0IsQ0FEQSxHQUVBRCxTQUFTLENBQVQsQ0FIRjs7QUFLQSxhQUFPLEtBQUtRLFdBQUwsQ0FBaUJGLElBQWpCLEVBQXVCYixTQUF2QixFQUFrQ00sSUFBbEMsQ0FBdUNVLE9BQU87QUFDbkQsWUFBSUMsT0FBTyxJQUFJQyxvQkFBSixDQUNUckIsU0FEUyxFQUVUQyxpQkFGUyxFQUdUQyxpQkFIUyxFQUlUQyxTQUpTLEVBS1RDLGtCQUxTLEVBTVRDLGtCQU5TLEVBT1RDLFdBUFMsQ0FBWDs7QUFVQSxZQUFJZ0IsU0FBU2YsZ0RBQW1CTSxVQUFuQixDQUE4QjtBQUN2Q2QsbUJBQVNBLE9BRDhCO0FBRXZDakIsZ0JBQU1rQixTQUZpQztBQUd2Q3VCLHVCQUFhO0FBQ1hDLG9CQUFRSixLQUFLRyxXQUFMLENBQWlCQyxNQUFqQixDQUF3QkMsR0FBeEIsRUFERztBQUVYQyxvQkFBUU4sS0FBS0csV0FBTCxDQUFpQkc7QUFGZCxXQUgwQjtBQU92Q0Msd0JBQWM7QUFDWkgsb0JBQVFKLEtBQUtPLFlBQUwsQ0FBa0JILE1BQWxCLENBQXlCQyxHQUF6QixFQURJO0FBRVpDLG9CQUFRTixLQUFLTyxZQUFMLENBQWtCRDtBQUZkLFdBUHlCO0FBV3ZDdkIscUJBQVdBLFNBWDRCO0FBWXZDRyx1QkFBYUE7QUFaMEIsU0FBOUIsRUFjWGMsSUFkVyxDQUFiOztBQWlCQSxZQUFJUSxXQUFXckIsZ0RBQW1Cc0IsV0FBbkIsQ0FBK0JQLE1BQS9CLENBQWY7O0FBRUFILFlBQUlXLElBQUosQ0FBU0YsUUFBVDs7QUFFQSxlQUFPQSxTQUFTRyxJQUFoQjtBQUNELE9BakNNLENBQVA7QUFrQ0QsS0F2REksQ0FBUDtBQXlERDs7QUFFRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQUMsY0FBWUMsT0FBWixFQUFxQkMsV0FBckIsRUFBa0NDLGtCQUFsQyxFQUFzREMsU0FBdEQsRUFBaUVDLE9BQWpFLEVBQTBFOztBQUV4RSxRQUFJRixrQkFBSixFQUF3QjtBQUN0QixXQUFLRyxpQkFBTCxDQUF1QkwsT0FBdkIsRUFBZ0NHLFNBQWhDLEVBQTJDQyxPQUEzQyxFQUFvRDVCLElBQXBELENBQXlEOEIsTUFBTTtBQUM3RCxZQUFJTCxXQUFKLEVBQWlCO0FBQ2YsaUJBQU8sS0FBS0EsV0FBTCxDQUFpQkQsT0FBakIsQ0FBUDtBQUNEO0FBQ0QsZUFBT00sRUFBUDtBQUNELE9BTEQ7QUFNRCxLQVBELE1BT08sSUFBSUwsV0FBSixFQUFpQjtBQUN0QixhQUFPLEtBQUtBLFdBQUwsQ0FBaUJELE9BQWpCLENBQVA7QUFDRDtBQUVGOztBQUVESyxvQkFBa0JMLE9BQWxCLEVBQTJCRyxTQUEzQixFQUFzQ0MsT0FBdEMsRUFBK0M7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFdBQU8sS0FBS0csdUJBQUwsQ0FBNkJQLE9BQTdCLEVBQXNDRyxTQUF0QyxFQUFpREMsT0FBakQsRUFBMEQ1QixJQUExRCxDQUNMZ0MsVUFBVTtBQUNSQSxhQUFPQyxPQUFQLENBQWVILE1BQU07QUFDbkJoQyx3REFBbUJvQyxlQUFuQixDQUFtQ0osR0FBR0ssRUFBdEM7QUFDRCxPQUZEOztBQUlBLGFBQU8sSUFBUDtBQUVELEtBUkksQ0FBUDtBQVVEOztBQUVEQyxpQkFBZVosT0FBZixFQUF3QjtBQUN0QixXQUFPLEtBQUtPLHVCQUFMLENBQTZCUCxPQUE3QixDQUFQO0FBQ0Q7O0FBR0RPLDBCQUF3QlAsT0FBeEIsRUFBaUNHLFNBQWpDLEVBQTRDQyxPQUE1QyxFQUFxRDs7QUFFbkQsUUFBSSxPQUFPRCxTQUFQLEtBQXFCLFdBQXpCLEVBQ0VBLFlBQVksQ0FBWjs7QUFFRixRQUFJLE9BQU9DLE9BQVAsSUFBa0IsV0FBdEIsRUFDRUEsVUFBVVMsS0FBS0MsR0FBTCxLQUFhLFdBQWIsR0FBMkIsR0FBckM7O0FBRUYsV0FBT3hDLGdEQUFtQkMsV0FBbkIsQ0FBK0J5QixPQUEvQixFQUF3QyxDQUFDLEtBQzdDekMsdUJBRDRDLENBQXhDLEVBRUppQixJQUZJLENBRUVDLFFBQUQsSUFBYzs7QUFFcEJBLGlCQUFXQSxTQUFTc0MsR0FBVCxDQUFhVCxNQUFNQSxHQUFHZCxHQUFILEVBQW5CLENBQVg7O0FBRUEsYUFBT2YsU0FBU3VDLE1BQVQsQ0FBZ0JWLE1BQU07QUFDM0IsZUFBT0EsR0FBR1csSUFBSCxJQUFXZCxTQUFYLElBQXdCRyxHQUFHVyxJQUFILElBQVdiLE9BQTFDO0FBQ0QsT0FGTSxDQUFQO0FBSUQsS0FWTSxDQUFQO0FBWUQ7O0FBRURILGNBQVlELE9BQVosRUFBcUI7QUFDbkIsUUFBSUYsT0FBT3hCLGdEQUFtQlUsT0FBbkIsQ0FBMkJnQixPQUEzQixDQUFYO0FBQ0EsUUFBSUYsSUFBSixFQUFVO0FBQ1IsVUFBSWhDLFVBQVVnQyxLQUFLaEMsT0FBTCxDQUFhMEIsR0FBYixFQUFkO0FBQ0EsVUFBSTBCLG1CQUFtQnBCLEtBQUs1QixTQUFMLENBQWVzQixHQUFmLEVBQXZCOztBQUVBLGFBQU8sS0FBSzJCLGNBQUwsQ0FBb0JyRCxPQUFwQixFQUE2Qm9ELGdCQUE3QixFQUErQzFDLElBQS9DLENBQ0w0QyxPQUFPO0FBQ0wsYUFBSyxJQUFJQyxRQUFRLENBQWpCLEVBQW9CQSxRQUFRRCxJQUFJekMsTUFBaEMsRUFBd0MwQyxPQUF4QyxFQUFpRDtBQUMvQyxnQkFBTUMsYUFBYUYsSUFBSUMsS0FBSixFQUFXdkIsSUFBWCxDQUFnQmEsRUFBaEIsQ0FBbUJuQixHQUFuQixFQUFuQjtBQUNBLGNBQUk4QixjQUFjdEIsT0FBbEIsRUFBMkI7QUFDekJvQixnQkFBSUcsTUFBSixDQUFXSCxJQUFJQyxLQUFKLENBQVg7QUFDQSxtQkFBTyxJQUFQO0FBQ0Q7QUFDRjtBQUNELGVBQU8sS0FBUDtBQUNELE9BVkksQ0FBUDtBQVdELEtBZkQsTUFlTztBQUNMLGFBQU9HLFFBQVFDLE9BQVIsQ0FBZ0IsS0FBaEIsQ0FBUDtBQUNEO0FBQ0Y7O0FBRURDLFlBQVUxQixPQUFWLEVBQW1CMkIsWUFBbkIsRUFBaUM7QUFDL0IsUUFBSSxPQUFPQSxZQUFQLEtBQXdCLFFBQTVCLEVBQXNDO0FBQ3BDLGFBQU8sS0FBUDtBQUNEOztBQUVELFFBQUlDLFlBQVl0RCxnREFBbUJzQixXQUFuQixDQUErQkksT0FBL0IsQ0FBaEI7O0FBRUEsUUFBSSxPQUFPNEIsU0FBUCxLQUFxQixXQUF6QixFQUFzQztBQUNwQyxXQUFLLE1BQU1DLEdBQVgsSUFBa0JGLFlBQWxCLEVBQWdDO0FBQzlCLGNBQU1HLFFBQVFILGFBQWFFLEdBQWIsQ0FBZDs7QUFFQSxZQUFJLE9BQU9DLEtBQVAsS0FBaUIsUUFBakIsSUFBNkIsT0FBT0YsVUFBVTlCLElBQVYsQ0FBZStCLEdBQWYsQ0FBUCxLQUMvQixXQURGLEVBQ2U7O0FBRWJELG9CQUFVOUIsSUFBVixDQUFlK0IsR0FBZixFQUFvQkUsR0FBcEIsQ0FBd0JELEtBQXhCO0FBRUQsU0FMRCxNQUtPLElBQUksT0FBT0EsS0FBUCxLQUFpQixRQUFqQixJQUE2QixPQUFPRixVQUFVOUIsSUFBVixDQUFlK0IsR0FBZixDQUFQLEtBQ3RDLFdBREssRUFDUTs7QUFFYixlQUFLLE1BQU1HLElBQVgsSUFBbUJGLEtBQW5CLEVBQTBCO0FBQ3hCLGtCQUFNRyxTQUFTSCxNQUFNRSxJQUFOLENBQWY7O0FBR0EsZ0JBQUksT0FBT0osVUFBVTlCLElBQVYsQ0FBZStCLEdBQWYsRUFBb0JHLElBQXBCLENBQVAsS0FBcUMsV0FBekMsRUFBc0Q7O0FBRXBELGtCQUFJSCxRQUFRLGNBQVIsSUFBMEJHLFNBQVMsUUFBdkMsRUFBaUQ7O0FBRS9DLG9CQUFJLE9BQU9DLE1BQVAsS0FBa0IsV0FBdEIsRUFBbUM7O0FBRWpDTCw0QkFBVTlCLElBQVYsQ0FBZStCLEdBQWYsRUFBb0JHLElBQXBCLEVBQTBCRCxHQUExQixDQUE4QixJQUFJRyxNQUFKLENBQzVCRCxNQUQ0QixFQUNwQixDQUNOLFdBRE0sRUFDTyxRQURQLEVBRU4sU0FGTSxFQUVLLFVBRkwsRUFHTixTQUhNLENBRG9CLENBQTlCO0FBTUQsaUJBUkQsTUFRTztBQUNMTCw0QkFBVTlCLElBQVYsQ0FBZStCLEdBQWYsRUFBb0JHLElBQXBCLEVBQTBCRCxHQUExQixDQUE4QkksR0FBOUI7QUFDRDtBQUVGLGVBZEQsTUFjTyxJQUFJTixRQUFRLGFBQVIsSUFBeUJHLFNBQVMsUUFBdEMsRUFBZ0Q7O0FBRXJESiwwQkFBVTlCLElBQVYsQ0FBZStCLEdBQWYsRUFBb0JHLElBQXBCLEVBQTBCRCxHQUExQixDQUE4QixJQUFJRyxNQUFKLENBQVdELE1BQVgsRUFBbUIsQ0FDL0MsUUFEK0MsRUFDckMsU0FEcUMsRUFFL0MsVUFGK0MsRUFHL0MsU0FIK0MsQ0FBbkIsQ0FBOUI7QUFLRCxlQVBNLE1BT0E7QUFDTCx1QkFBT0EsTUFBUCxLQUFrQixXQUFsQixHQUFnQ0wsVUFBVTlCLElBQVYsQ0FBZStCLEdBQWYsRUFBb0JHLElBQXBCLEVBQTBCRCxHQUExQixDQUM5QkUsTUFEOEIsQ0FBaEMsR0FDWUwsVUFBVTlCLElBQVYsQ0FBZStCLEdBQWYsRUFBb0JHLElBQXBCLEVBQTBCRCxHQUExQixDQUE4QkksR0FBOUIsQ0FEWjtBQUVEO0FBR0Y7QUFFRjtBQUNGO0FBR0Y7O0FBRUQsYUFBTyxJQUFQO0FBRUQ7O0FBRUQsV0FBTyxLQUFQO0FBRUQ7O0FBRURsRCxjQUFZRixJQUFaLEVBQWtCcUQsT0FBbEIsRUFBMkI7QUFDekIsUUFBSXpDLFdBQVdyQixnREFBbUJzQixXQUFuQixDQUErQmIsS0FBSzRCLEVBQUwsQ0FBUW5CLEdBQVIsRUFBL0IsQ0FBZjs7QUFFQSxXQUFPLElBQUlnQyxPQUFKLENBQVlDLFdBQVc7QUFDNUIsVUFBSSxDQUFDOUIsU0FBU0csSUFBVCxDQUFjc0MsT0FBZCxDQUFMLEVBQTZCO0FBQzNCekMsaUJBQVNHLElBQVQsQ0FBY3VDLFFBQWQsQ0FBdUJELE9BQXZCLEVBQWdDO0FBQzlCRSxpQkFBTyxJQUFJQywrQkFBSixDQUFRLElBQUlDLCtCQUFKLEVBQVI7QUFEdUIsU0FBaEM7QUFHRDs7QUFFRDdDLGVBQVNHLElBQVQsQ0FBY3NDLE9BQWQsRUFBdUJFLEtBQXZCLENBQTZCRyxJQUE3QixDQUFrQ1gsU0FBUztBQUN6QyxlQUFPTCxRQUFRSyxLQUFSLENBQVA7QUFDRCxPQUZEO0FBR0QsS0FWTSxDQUFQO0FBV0Q7O0FBRURYLGlCQUFlckQsT0FBZixFQUF3QjRFLFVBQXhCLEVBQW9DO0FBQ2xDLFdBQU9wRSxnREFBbUJDLFdBQW5CLENBQStCVCxPQUEvQixFQUF3QyxDQUFDLEtBQUtSLGFBQU4sQ0FBeEMsRUFBOERrQixJQUE5RCxDQUNMNEMsT0FBTztBQUNMLFVBQUkvQixNQUFKO0FBQ0EsVUFBSStCLElBQUl6QyxNQUFKLEtBQWUsQ0FBbkIsRUFBc0I7QUFDcEJVLGlCQUFTZixnREFBbUJNLFVBQW5CLENBQThCO0FBQ3JDL0IsZ0JBQU07QUFEK0IsU0FBOUIsQ0FBVDs7QUFJQXlCLHdEQUFtQk8sUUFBbkIsQ0FDRWYsT0FERixFQUVFdUIsTUFGRixFQUdFLEtBQUsvQixhQUhQLEVBSUV3Qix5REFKRjtBQU1EOztBQUVELFVBQUlDLE9BQ0YsT0FBT00sTUFBUCxLQUFrQixXQUFsQixHQUNBZixnREFBbUJVLE9BQW5CLENBQTJCSyxNQUEzQixDQURBLEdBRUErQixJQUFJLENBQUosQ0FIRjs7QUFLQSxhQUFPLEtBQUtuQyxXQUFMLENBQWlCRixJQUFqQixFQUF1QjJELFVBQXZCLENBQVA7QUFDRCxLQXRCSSxDQUFQO0FBd0JEOztBQUVEQyxnQkFBY3pFLFNBQWQsRUFBeUJKLE9BQXpCLEVBQWtDcUMsU0FBbEMsRUFBNkNDLE9BQTdDLEVBQXNEd0MsVUFBdEQsRUFBa0U7QUFDaEUsV0FBTyxLQUFLQyxrQkFBTCxDQUF3QjNFLFNBQXhCLEVBQ0pNLElBREksQ0FDQzhCLE1BQU07QUFDVixhQUFPLEtBQUt3QyxzQkFBTCxDQUE0QnhDLEdBQUdLLEVBQUgsQ0FBTW5CLEdBQU4sRUFBNUIsRUFBeUMxQixPQUF6QyxFQUFrRFUsSUFBbEQsQ0FDTDRDLE9BQU87QUFDTCxZQUFJQSxHQUFKLEVBQVM7QUFDUCxlQUFLMkIsaUJBQUwsQ0FDRXpDLEdBQUdLLEVBQUgsQ0FBTW5CLEdBQU4sRUFERixFQUVFMUIsT0FGRixFQUdFLEtBQUtyQixZQUFMLENBQWtCRyxRQUFsQixDQUEyQkUsSUFIN0IsRUFJRTBCLElBSkYsQ0FJT3dFLGFBQWE7QUFDbEIsZ0JBQUlyQyxLQUFLcUMsVUFBVXJDLEVBQVYsQ0FBYW5CLEdBQWIsRUFBVDs7QUFFQW9ELHVCQUFXbkMsT0FBWCxDQUFtQndDLGFBQWE7QUFDOUIsa0JBQUlDLGFBQWEsS0FBS0MsUUFBTCxDQUNmaEQsU0FEZSxFQUVmQyxPQUZlLEVBR2Y2QyxVQUFVRyxZQUhLLEVBSWZILFVBQVVJLFlBSkssQ0FBakI7O0FBT0FILHlCQUFXekMsT0FBWCxDQUFtQlEsUUFBUTtBQUN6QixxQkFBS3FDLFFBQUwsQ0FDRWhELEdBQUdLLEVBQUgsQ0FBTW5CLEdBQU4sRUFERixFQUVFMUIsT0FGRixFQUdFNkMsRUFIRixFQUlFc0MsU0FKRixFQUtHLEdBQUVBLFVBQVVwRyxJQUFLLEVBTHBCLEVBTUUsSUFBSWdFLElBQUosQ0FBU0ksSUFBVCxFQUFlc0MsT0FBZixFQU5GO0FBUUQsZUFURDtBQVVELGFBbEJEO0FBbUJELFdBMUJEO0FBMkJEO0FBQ0YsT0EvQkksQ0FBUDtBQWdDRCxLQWxDSSxFQW1DSkMsS0FuQ0ksQ0FtQ0VDLE9BQU87QUFDWkMsY0FBUUMsR0FBUixDQUFZRixHQUFaO0FBQ0EsYUFBT2pDLFFBQVFDLE9BQVIsQ0FBZ0JnQyxHQUFoQixDQUFQO0FBQ0QsS0F0Q0ksQ0FBUDtBQXVDRDs7QUFFREgsV0FBU00sa0JBQVQsRUFBNkI5RixPQUE3QixFQUFzQytGLE9BQXRDLEVBQStDQyxTQUEvQyxFQUEwRGpILElBQTFELEVBQWdFb0UsSUFBaEUsRUFBc0U7QUFDcEUsUUFBSThDLFFBQVF6RixnREFBbUJVLE9BQW5CLENBQTJCNkUsT0FBM0IsRUFBb0NFLEtBQXBDLENBQTBDdkUsR0FBMUMsRUFBWjs7QUFFQSxRQUFJd0UsUUFBUSxJQUFJQyxvQkFBSixDQUFlcEgsSUFBZixFQUFxQm9FLElBQXJCLEVBQTJCOEMsS0FBM0IsRUFBa0NqRyxPQUFsQyxDQUFaOztBQUVBLFFBQUlvRyxjQUFjNUYsZ0RBQW1CTSxVQUFuQixDQUE4QjtBQUM1Qy9CLFlBQU1BLElBRHNDO0FBRTVDb0UsWUFBTUEsSUFGc0M7QUFHNUM0QyxlQUFTQSxPQUhtQztBQUk1Q0UsYUFBT0EsS0FKcUM7QUFLNUNqRyxlQUFTQSxPQUxtQztBQU01Q2tDLGVBQVM4RCxVQUFVbkQ7QUFOeUIsS0FBOUIsRUFRaEJxRCxLQVJnQixDQUFsQjs7QUFXQSxXQUFPMUYsZ0RBQW1CNkYsaUJBQW5CLENBQ0hOLE9BREcsRUFFSEssV0FGRyxFQUdITixrQkFIRyxFQUlILEtBQUtuRyw2QkFKRixFQUtIcUIseURBTEcsRUFPSk4sSUFQSSxDQU9DOEIsTUFBTTtBQUNWLFVBQUlBLEVBQUosRUFBUSxPQUFPNEQsV0FBUDtBQUNULEtBVEksRUFVSjFGLElBVkksQ0FVQzRGLFdBQVc7QUFDZixVQUFJLE9BQU9BLE9BQVAsS0FBbUIsV0FBdkIsRUFBb0M7QUFDbEMsZUFBTzlGLGdEQUFtQkMsV0FBbkIsQ0FBK0JULE9BQS9CLEVBQXdDLENBQzdDdUcsdUNBRDZDLENBQXhDLEVBRUo3RixJQUZJLENBRUNDLFlBQVk7QUFDbEJBLG1CQUFTc0MsR0FBVCxDQUFhdUQsU0FBUztBQUNwQixnQkFBSXpILE9BQVEsR0FBRXlILE1BQU16SCxJQUFOLENBQVcyQyxHQUFYLEVBQWlCLEVBQS9CO0FBQ0EsZ0JBQUlMLE9BQU8sSUFBSW9GLG1CQUFKLENBQ1QxSCxJQURTLEVBRVR5SCxNQUFNRSxJQUFOLENBQVdoRixHQUFYLEVBRlMsRUFHVDhFLE1BQU1HLFNBQU4sQ0FBZ0JqRixHQUFoQixFQUhTLEVBSVRzRSxVQUFVakgsSUFKRCxFQUtULENBTFMsQ0FBWDs7QUFRQSxnQkFBSTZILFNBQVNwRyxnREFBbUJNLFVBQW5CLENBQThCO0FBQ3ZDL0Isb0JBQU1BLElBRGlDO0FBRXZDQyxvQkFBTSxNQUZpQztBQUd2QzZILG9CQUFNTCxNQUFNRSxJQUFOLENBQVdoRixHQUFYLEVBSGlDO0FBSXZDaUYseUJBQVdILE1BQU1HLFNBQU4sQ0FBZ0JqRixHQUFoQixFQUo0QjtBQUt2Q1EsdUJBQVM4RCxVQUFVbkQsRUFMb0I7QUFNdkN5RCx1QkFBU0EsT0FOOEI7QUFPdkN0Ryx1QkFBU0EsT0FQOEI7QUFRdkNkLG9CQUFNO0FBUmlDLGFBQTlCLEVBVVhtQyxJQVZXLENBQWI7O0FBYUEsbUJBQU9xQyxRQUFRb0QsR0FBUixDQUFZLENBQ2pCdEcsZ0RBQW1CNkYsaUJBQW5CLENBQ0VDLE9BREYsRUFFRU0sTUFGRixFQUdFZCxrQkFIRixFQUlFLEtBQUtsRyxzQkFKUCxFQUtFb0IseURBTEYsQ0FEaUIsRUFRakJSLGdEQUFtQk8sUUFBbkIsQ0FDRWlGLFVBQVVuRCxFQURaLEVBRUV5RCxPQUZGLEVBR0UsS0FBSzdHLHVCQUhQLEVBSUV1Qix5REFKRixDQVJpQixDQUFaLENBQVA7QUFlRCxXQXRDRDtBQXVDRCxTQTFDTSxDQUFQO0FBMkNEO0FBQ0YsS0F4REksQ0FBUDtBQXlERDs7QUFFRCtELHFCQUFtQjNFLFNBQW5CLEVBQThCO0FBQzVCLFFBQUkyRyxRQUFRLEtBQUs1SCxNQUFMLENBQVk2SCxJQUFaLENBQWlCeEUsTUFBTTtBQUNqQyxhQUFPQSxHQUFHeEQsSUFBSCxLQUFZb0IsU0FBbkI7QUFDRCxLQUZXLENBQVo7O0FBSUEsUUFBSSxPQUFPMkcsS0FBUCxLQUFpQixXQUFyQixFQUFrQztBQUNoQyxZQUFNRSxjQUFlLEdBQUVGLE1BQU1oSSxJQUFLLEVBQWxDOztBQUVBLFVBQUltSSxVQUFVMUcsZ0RBQW1CMkcsVUFBbkIsQ0FBOEJGLFdBQTlCLENBQWQ7QUFDQSxVQUFJLE9BQU9DLE9BQVAsS0FBbUIsV0FBdkIsRUFBb0MsT0FBT3hELFFBQVFDLE9BQVIsQ0FBZ0J1RCxRQUN4RGxGLElBRHdDLENBQVA7O0FBR3BDLGFBQU94QixnREFBbUI0RyxVQUFuQixDQUNMSCxXQURLLEVBRUw3RyxTQUZLLEVBR0wsSUFBSWlILGlDQUFKLENBQVU7QUFDUnRJLGNBQU0sS0FBS1g7QUFESCxPQUFWLENBSEssRUFNTHNDLElBTkssQ0FNQTRHLGtCQUFrQjtBQUN2QixlQUFPQSxlQUFldEYsSUFBdEI7QUFDRCxPQVJNLENBQVA7QUFTRCxLQWhCRCxNQWdCTztBQUNMLGFBQU8wQixRQUFRNkQsTUFBUixDQUFlLGVBQWYsQ0FBUDtBQUNEO0FBQ0Y7O0FBRUR2Qyx5QkFBdUJ3QyxjQUF2QixFQUF1Q3hILE9BQXZDLEVBQWdEO0FBQUE7O0FBQzlDLFdBQU9RLGdEQUFtQkMsV0FBbkIsQ0FBK0IrRyxjQUEvQixFQUErQyxDQUNsRCxLQUFLOUgsNEJBRDZDLENBQS9DLEVBR0pnQixJQUhJLENBR0NDLFlBQVk7QUFDaEIsV0FBSyxJQUFJOEcsSUFBSSxDQUFiLEVBQWdCQSxJQUFJOUcsU0FBU0UsTUFBN0IsRUFBcUM0RyxHQUFyQyxFQUEwQztBQUN4QyxjQUFNakIsUUFBUTdGLFNBQVM4RyxDQUFULEVBQVk1RSxFQUFaLENBQWVuQixHQUFmLEVBQWQ7QUFDQSxZQUFJOEUsVUFBVXhHLE9BQWQsRUFBdUIsT0FBTyxJQUFQO0FBQ3hCO0FBQ0YsS0FSSSxFQVNKVSxJQVRJLENBU0M4QixNQUFNO0FBQ1YsVUFBSSxPQUFPQSxFQUFQLEtBQWMsV0FBbEIsRUFBK0I7QUFDN0IsZUFBT2hDLGdEQUFtQjZGLGlCQUFuQixDQUNMbUIsY0FESyxFQUVMeEgsT0FGSyxFQUdMd0gsY0FISyxFQUlMLEtBQUs5SCw0QkFKQSxFQUtMc0IseURBTEssRUFNTE4sSUFOSztBQUFBLHVDQU1BLFdBQU00QyxHQUFOLEVBQWE7QUFDbEIsZ0JBQUlBLEdBQUosRUFBUztBQUNQLG9CQUFNLE1BQUsyQixpQkFBTCxDQUNKdUMsY0FESSxFQUVKeEgsT0FGSSxFQUdKLE1BQUtyQixZQUFMLENBQWtCTSxVQUFsQixDQUE2QkQsSUFIekIsQ0FBTjtBQUtBLG9CQUFNLE1BQUtpRyxpQkFBTCxDQUNKdUMsY0FESSxFQUVKeEgsT0FGSSxFQUdKLE1BQUtyQixZQUFMLENBQWtCTyxJQUFsQixDQUF1QkYsSUFIbkIsQ0FBTjtBQUtEOztBQUVELG1CQUFPc0UsR0FBUDtBQUNELFdBckJNOztBQUFBO0FBQUE7QUFBQTtBQUFBLGFBQVA7QUFzQkQsT0F2QkQsTUF1Qk87QUFDTCxlQUFPZCxFQUFQO0FBQ0Q7QUFDRixLQXBDSSxDQUFQO0FBcUNEOztBQUVEeUMsb0JBQWtCdUMsY0FBbEIsRUFBa0N4SCxPQUFsQyxFQUEyQzBILFNBQTNDLEVBQXNEO0FBQ3BELFFBQUl4QixRQUFRLEtBQUt5QixpQkFBTCxDQUF1QkQsU0FBdkIsQ0FBWjs7QUFFQSxRQUFJLE9BQU94QixLQUFQLEtBQWlCLFdBQXJCLEVBQWtDOztBQUVsQyxRQUFJMEIsY0FBY3BILGdEQUFtQlUsT0FBbkIsQ0FBMkJzRyxjQUEzQixFQUEyQ3hJLElBQTNDLENBQWdEMEMsR0FBaEQsRUFBbEI7QUFDQSxRQUFJbUcsWUFBSjs7QUFFQSxZQUFRRCxXQUFSO0FBQ0UsV0FBSyxLQUFLckosaUJBQVY7QUFDRXNKLHVCQUFlLEtBQUt6SSxzQ0FBcEI7QUFDQTtBQUNGLFdBQUssS0FBS1gsY0FBVjtBQUNFb0osdUJBQWUsS0FBS3ZJLG1DQUFwQjtBQUNBO0FBQ0YsV0FBSyxLQUFLWixnQkFBVjtBQUNFbUosdUJBQWUsS0FBS3RJLHFDQUFwQjtBQUNBO0FBQ0YsV0FBSyxLQUFLZixnQkFBVjtBQUNFcUosdUJBQWUsS0FBS3hJLHFDQUFwQjtBQUNBO0FBWko7O0FBZUEsV0FBT21CLGdEQUFtQkMsV0FBbkIsQ0FBK0JULE9BQS9CLEVBQXdDLENBQUM2SCxZQUFELENBQXhDLEVBQ0puSCxJQURJLENBQ0NDLFlBQVk7QUFDaEIsV0FBSyxJQUFJOEcsSUFBSSxDQUFiLEVBQWdCQSxJQUFJOUcsU0FBU0UsTUFBN0IsRUFBcUM0RyxHQUFyQyxFQUEwQztBQUN4QyxjQUFNMUksT0FBTzRCLFNBQVM4RyxDQUFULEVBQVkxSSxJQUFaLENBQWlCMkMsR0FBakIsRUFBYjtBQUNBLGNBQU0xQyxPQUFPMkIsU0FBUzhHLENBQVQsRUFBWXhCLEtBQVosQ0FBa0J2RSxHQUFsQixFQUFiOztBQUVBLFlBQUkzQyxTQUFTMkksU0FBVCxJQUFzQjFJLFNBQVMwSSxTQUFuQyxFQUE4QztBQUM1QyxpQkFBTy9HLFNBQVM4RyxDQUFULENBQVA7QUFDRDtBQUNGO0FBQ0YsS0FWSSxFQVdKL0csSUFYSSxDQVdDOEIsTUFBTTtBQUNWLFVBQUksT0FBT0EsRUFBUCxLQUFjLFdBQWxCLEVBQStCO0FBQzdCLFlBQUk1QixZQUFZSixnREFBbUJNLFVBQW5CLENBQThCO0FBQzVDL0IsZ0JBQU1tSCxNQUFNbkgsSUFEZ0M7QUFFNUNrSCxpQkFBT0MsTUFBTWxILElBRitCO0FBRzVDZ0IsbUJBQVNBLE9BSG1DO0FBSTVDaEIsZ0JBQU07QUFKc0MsU0FBOUIsQ0FBaEI7O0FBT0EsZUFBT3dCLGdEQUFtQjZGLGlCQUFuQixDQUNMckcsT0FESyxFQUVMWSxTQUZLLEVBR0w0RyxjQUhLLEVBSUxLLFlBSkssRUFLTDdHLHlEQUxLLEVBTUxOLElBTkssQ0FNQTRDLE9BQU87QUFDWixjQUFJQSxHQUFKLEVBQVMsT0FBTzlDLGdEQUFtQlUsT0FBbkIsQ0FBMkJOLFNBQTNCLENBQVA7QUFDVixTQVJNLENBQVA7QUFTRCxPQWpCRCxNQWlCTztBQUNMLGVBQU80QixFQUFQO0FBQ0Q7QUFDRixLQWhDSSxDQUFQO0FBaUNEOztBQUVEc0YsZUFBYUMsU0FBYixFQUF3Qi9ILE9BQXhCLEVBQWlDc0csT0FBakMsRUFBMENNLE1BQTFDLEVBQWtEO0FBQ2hELFFBQUlvQixXQUFXeEgsZ0RBQW1Cc0IsV0FBbkIsQ0FBK0I4RSxNQUEvQixDQUFmO0FBQ0FvQixhQUFTaEcsSUFBVCxDQUFjOUMsSUFBZCxDQUFtQitFLEdBQW5CLENBQXVCLENBQUMrRCxTQUFTaEcsSUFBVCxDQUFjOUMsSUFBZCxDQUFtQndDLEdBQW5CLEVBQXhCOztBQUVBLFFBQUl1RyxpQkFBaUJ6SCxnREFBbUJVLE9BQW5CLENBQTJCb0YsT0FBM0IsRUFBb0NQLE9BQXBDLENBQTRDckUsR0FBNUMsRUFBckI7O0FBRUEsV0FBTyxLQUFLd0csU0FBTCxDQUFlSCxTQUFmLEVBQTBCL0gsT0FBMUIsRUFBbUNzRyxPQUFuQyxFQUE0QzVGLElBQTVDLENBQWlEeUgsYUFBYTs7QUFFbkUsVUFBSUMsY0FBY0QsVUFBVXRGLEVBQVYsQ0FBYW5CLEdBQWIsRUFBbEI7O0FBRUEsVUFBSTBHLGdCQUFnQkgsY0FBcEIsRUFBb0MsT0FBTyxJQUFQOztBQUVwQyxhQUFPLEtBQUtJLGlCQUFMLENBQXVCL0IsT0FBdkIsRUFBZ0MyQixjQUFoQyxFQUFnREcsV0FBaEQsRUFDTEwsU0FESyxDQUFQO0FBR0QsS0FUTSxDQUFQO0FBV0Q7O0FBSUQ7QUFDQTtBQUNBOztBQUVBMUMsV0FBU2hELFNBQVQsRUFBb0JDLE9BQXBCLEVBQTZCZ0QsWUFBN0IsRUFBMkNDLFlBQTNDLEVBQXlEO0FBQ3ZELFFBQUk1RCxTQUFTLENBQUMsTUFBRCxFQUFTLE9BQVQsRUFBa0IsUUFBbEIsRUFBNEIsT0FBNUIsRUFBcUM0RCxZQUFyQyxDQUFiOztBQUVBLFFBQUlILGFBQWEsRUFBakI7O0FBRUEsUUFBSWpDLE9BQU8sc0JBQU9kLFNBQVAsQ0FBWDtBQUNBLFFBQUlpRyxNQUFNLHNCQUFPaEcsT0FBUCxDQUFWOztBQUVBLFdBQU9nRyxJQUFJQyxJQUFKLENBQVNwRixJQUFULEtBQWtCLENBQXpCLEVBQTRCO0FBQzFCaUMsaUJBQVdyRCxJQUFYLENBQWdCb0IsS0FBS3FGLE1BQUwsRUFBaEI7O0FBRUFyRixhQUFPQSxLQUFLc0YsR0FBTCxDQUFTbkQsWUFBVCxFQUF1QjNELE1BQXZCLENBQVA7QUFDRDs7QUFFRCxXQUFPeUQsVUFBUDtBQUNEOztBQUVEc0QsY0FBWUMsT0FBWixFQUFxQjtBQUNuQixRQUFJeEYsT0FBTyxJQUFJSixJQUFKLENBQVM0RixPQUFULENBQVg7O0FBRUEsV0FBUSxHQUFFLENBQUMsTUFBTTtBQUNmLFVBQUlDLElBQUl6RixLQUFLMEYsT0FBTCxFQUFSO0FBQ0EsYUFBT0QsRUFBRUUsUUFBRixHQUFhakksTUFBYixHQUFzQixDQUF0QixHQUEwQitILENBQTFCLEdBQThCLE1BQU1BLENBQTNDO0FBQ0QsS0FIUyxHQUdMLElBQUcsQ0FBQyxNQUFNOztBQUViLFVBQUlBLElBQUl6RixLQUFLNEYsUUFBTCxLQUFrQixDQUExQjtBQUNBLGFBQU9ILEVBQUVFLFFBQUYsR0FBYWpJLE1BQWIsR0FBc0IsQ0FBdEIsR0FBMEIrSCxDQUExQixHQUE4QixNQUFNQSxDQUEzQztBQUVELEtBTE8sR0FLSCxJQUFHekYsS0FBSzZGLFdBQUwsRUFBbUIsRUFSM0I7QUFTRDs7QUFFRHJCLG9CQUFrQnNCLFVBQWxCLEVBQThCO0FBQzVCLFNBQUssTUFBTWxGLEdBQVgsSUFBa0IsS0FBS3BGLFlBQXZCLEVBQXFDO0FBQ25DLFVBQ0UsS0FBS0EsWUFBTCxDQUFrQm9GLEdBQWxCLEVBQXVCaEYsSUFBdkIsS0FBZ0NrSyxVQUFoQyxJQUNBLEtBQUt0SyxZQUFMLENBQWtCb0YsR0FBbEIsRUFBdUIvRSxJQUF2QixLQUFnQ2lLLFVBRmxDLEVBR0U7QUFDQSxlQUFPLEtBQUt0SyxZQUFMLENBQWtCb0YsR0FBbEIsQ0FBUDtBQUNEO0FBQ0Y7O0FBRUQsV0FBT21GLFNBQVA7QUFDRDs7QUFFRGhCLFlBQVVILFNBQVYsRUFBcUIvSCxPQUFyQixFQUE4QnNHLE9BQTlCLEVBQXVDOztBQUVyQyxXQUFPLEtBQUs2QyxhQUFMLENBQW1CN0MsT0FBbkIsRUFBNEI1RixJQUE1QixDQUFpQzhELFNBQVM7QUFDL0MsVUFBSTRFLGlCQUFpQjVFLE1BQU10QixNQUFOLENBQWFWLE1BQU1BLEdBQUd0RCxJQUF0QixDQUFyQjtBQUNBLFVBQUltSyxRQUFKOztBQUVBLFVBQUlELGVBQWV2SSxNQUFmLEtBQTBCLENBQTlCLEVBQWlDO0FBQy9Cd0ksbUJBQVcsS0FBSzFLLFlBQUwsQ0FBa0JHLFFBQTdCO0FBQ0QsT0FGRCxNQUVPLElBQUlzSyxlQUFldkksTUFBZixLQUEwQjJELE1BQU0zRCxNQUFwQyxFQUE0QztBQUNqRHdJLG1CQUFXLEtBQUsxSyxZQUFMLENBQWtCTyxJQUE3QjtBQUNELE9BRk0sTUFFQTtBQUNMbUssbUJBQVcsS0FBSzFLLFlBQUwsQ0FBa0JNLFVBQTdCO0FBQ0Q7O0FBRUQsYUFBTyxLQUFLZ0csaUJBQUwsQ0FBdUI4QyxTQUF2QixFQUFrQy9ILE9BQWxDLEVBQTJDcUosU0FBU3JLLElBQXBELENBQVA7QUFFRCxLQWRNLENBQVA7QUFnQkQ7O0FBRURxSixvQkFBa0IvQixPQUFsQixFQUEyQmdELFdBQTNCLEVBQXdDQyxTQUF4QyxFQUFtRHhCLFNBQW5ELEVBQThEOztBQUc1RCxXQUFPdkgsZ0RBQW1CZ0osV0FBbkIsQ0FBK0JGLFdBQS9CLEVBQTRDaEQsT0FBNUMsRUFBcUQsS0FDdkQzRyw2QkFERSxFQUM2QnFCLHlEQUQ3QixFQUVKTixJQUZJLENBRUMrSSxXQUFXO0FBQ2YsVUFBSUEsT0FBSixFQUFhO0FBQ1gsZUFBT2pKLGdEQUFtQjZGLGlCQUFuQixDQUFxQ2tELFNBQXJDLEVBQWdEakQsT0FBaEQsRUFDSHlCLFNBREcsRUFFSCxLQUFLcEksNkJBRkYsRUFHSHFCLHlEQUhHLEVBSUpOLElBSkksQ0FJQzRDLE9BQU87QUFDWCxjQUFJLE9BQU9BLEdBQVAsS0FBZSxXQUFuQixFQUFnQztBQUM5QixnQkFBSW9HLFlBQVlsSixnREFBbUJzQixXQUFuQixDQUErQndFLE9BQS9CLENBQWhCO0FBQ0EsZ0JBQUlxRCxXQUFXbkosZ0RBQW1CVSxPQUFuQixDQUEyQnFJLFNBQTNCLEVBQXNDdEQsS0FBdEMsQ0FDWnZFLEdBRFksRUFBZjs7QUFJQWdJLHNCQUFVMUgsSUFBVixDQUFlaUUsS0FBZixDQUFxQmhDLEdBQXJCLENBQXlCMEYsUUFBekI7QUFDQUQsc0JBQVUxSCxJQUFWLENBQWUrRCxPQUFmLENBQXVCOUIsR0FBdkIsQ0FBMkJzRixTQUEzQjtBQUNEO0FBRUYsU0FmSSxDQUFQO0FBZ0JELE9BakJELE1BaUJPO0FBQ0wsZUFBTzdGLFFBQVFDLE9BQVIsQ0FBZ0IsS0FBaEIsQ0FBUDtBQUNEO0FBQ0YsS0F2QkksQ0FBUDtBQTBCRDs7QUFFRDtBQUNBO0FBQ0E7O0FBRUFpRyxpQkFBZXhKLFNBQWYsRUFBMEI7QUFDeEIsUUFBSXlKLFdBQVdySixnREFBbUJzSixrQkFBbkIsQ0FBc0MxSixTQUF0QyxDQUFmO0FBQ0EsUUFBSXlKLFNBQVNoSixNQUFULEtBQW9CLENBQXhCLEVBQTJCLE9BQU8sRUFBUDs7QUFFM0IsUUFBSWtILFlBQVk4QixTQUFTLENBQVQsRUFBWTdILElBQVosQ0FBaUJhLEVBQWpCLENBQW9CbkIsR0FBcEIsRUFBaEI7O0FBRUEsV0FBT2xCLGdEQUFtQkMsV0FBbkIsQ0FDTHNILFNBREssRUFFTCxLQUFLckksNEJBRkEsRUFHTGdCLElBSEssQ0FHQTRDLE9BQU87QUFDWixhQUFPQSxJQUFJTCxHQUFKLENBQVFULE1BQU1BLEdBQUdkLEdBQUgsRUFBZCxDQUFQO0FBQ0QsS0FMTSxDQUFQO0FBTUQ7O0FBR0RxSSxzQkFBb0JoQyxTQUFwQixFQUErQi9ILE9BQS9CLEVBQXdDO0FBQ3RDLFFBQUlnSyxXQUFXLEVBQWY7O0FBRUEsU0FBSyxNQUFNakcsR0FBWCxJQUFrQixLQUFLcEYsWUFBdkIsRUFBcUM7QUFDbkNxTCxlQUFTakksSUFBVCxDQUNFLEtBQUtrRCxpQkFBTCxDQUNFOEMsU0FERixFQUVFL0gsT0FGRixFQUdFLEtBQUtyQixZQUFMLENBQWtCb0YsR0FBbEIsRUFBdUIvRSxJQUh6QixDQURGO0FBT0Q7O0FBRUQsV0FBTzBFLFFBQVFvRCxHQUFSLENBQVlrRCxRQUFaLENBQVA7QUFDRDs7QUFFREMsaUJBQ0VqSyxPQURGLEVBRUVrSyxjQUFjLENBQ1osS0FBSzNMLGlCQURPLEVBRVosS0FBS0MsZ0JBRk8sRUFHWixLQUFLQyxjQUhPLEVBSVosS0FBS0MsZ0JBSk8sQ0FGaEIsRUFRRTtBQUFBOztBQUNBLFFBQUksQ0FBQ3lMLE1BQU1DLE9BQU4sQ0FBY0YsV0FBZCxDQUFMLEVBQWlDQSxjQUFjLENBQUNBLFdBQUQsQ0FBZDs7QUFFakMsV0FBT0EsWUFBWWpILEdBQVosQ0FBZ0I3QyxhQUFhO0FBQ2xDLFVBQUkyRyxRQUFRLEtBQUs1SCxNQUFMLENBQVk2SCxJQUFaLENBQWlCeEUsTUFBTTtBQUNqQyxlQUFPQSxHQUFHeEQsSUFBSCxLQUFZb0IsU0FBbkI7QUFDRCxPQUZXLENBQVo7O0FBSUEsVUFBSThHLFVBQVUxRyxnREFBbUIyRyxVQUFuQixDQUE4QkosTUFBTWhJLElBQXBDLENBQWQ7O0FBRUEsVUFBSSxPQUFPbUksT0FBUCxLQUFtQixXQUF2QixFQUFvQztBQUNsQyxZQUFJYSxZQUFZYixRQUFRbEYsSUFBUixDQUFhYSxFQUFiLENBQWdCbkIsR0FBaEIsRUFBaEI7O0FBRUEsZUFBTyxLQUFLcUksbUJBQUwsQ0FBeUJoQyxTQUF6QixFQUFvQy9ILE9BQXBDLEVBQTZDVSxJQUE3QyxDQUNMMkosVUFBVTtBQUNSLGNBQUlDLE9BQU9ELE9BQU9wSCxHQUFQO0FBQUEsMENBQVcsV0FBTXNILFNBQU4sRUFBbUI7QUFDdkMsa0JBQUlqSCxNQUFNaUgsVUFBVTdJLEdBQVYsRUFBVjs7QUFFQTRCLGtCQUFJLFlBQUosSUFBb0JsRCxTQUFwQjs7QUFFQSxrQkFBSXNDLFNBQVMsTUFBTWxDLGdEQUNoQkMsV0FEZ0IsQ0FFZjZDLElBQUlULEVBRlcsRUFFUCxDQUNOLE9BQUtsRCw2QkFEQyxDQUZPLENBQW5COztBQU1BMkQsa0JBQUksUUFBSixJQUFnQlosT0FBT08sR0FBUCxDQUFXLGNBQU07QUFDL0IsdUJBQU9ULEdBQUdkLEdBQUgsRUFBUDtBQUNELGVBRmUsQ0FBaEI7O0FBSUEscUJBQU80QixHQUFQO0FBQ0QsYUFoQlU7O0FBQUE7QUFBQTtBQUFBO0FBQUEsZUFBWDs7QUFrQkEsaUJBQU9JLFFBQVFvRCxHQUFSLENBQVl3RCxJQUFaLEVBQWtCNUosSUFBbEIsQ0FBdUI4SixhQUFhO0FBQ3pDLGdCQUFJSCxTQUFTLEVBQWI7O0FBRUFHLHNCQUFVN0gsT0FBVixDQUFrQjhILE9BQU87QUFDdkJKLHFCQUFPSSxJQUFJeEUsS0FBWCxJQUFvQndFLElBQUkvSCxNQUF4QjtBQUNELGFBRkQ7O0FBSUEsbUJBQU87QUFDTCxlQUFDdEMsU0FBRCxHQUFhaUs7QUFEUixhQUFQO0FBR0QsV0FWTSxDQUFQO0FBV0QsU0EvQkksQ0FBUDtBQWdDRDtBQUNGLEtBM0NNLENBQVA7QUE0Q0Q7O0FBRURsQixnQkFBYzdDLE9BQWQsRUFBdUI7QUFDckIsV0FBTzlGLGdEQUFtQkMsV0FBbkIsQ0FBK0I2RixPQUEvQixFQUF3QyxDQUFDLEtBQzNDMUcsc0JBRDBDLENBQXhDLEVBR0pjLElBSEksQ0FHQ0MsWUFBWTtBQUNoQixhQUFPQSxTQUFTc0MsR0FBVCxDQUFhVCxNQUFNQSxHQUFHZCxHQUFILEVBQW5CLENBQVA7QUFDRCxLQUxJLENBQVA7QUFNRDs7QUFFRDtBQUNBO0FBQ0E7O0FBRUFnSixhQUFXOUQsTUFBWCxFQUFtQitELE1BQW5CLEVBQTJCQyxPQUEzQixFQUFvQztBQUNsQyxRQUFJQSxXQUFXQSxRQUFRQyxJQUFSLEdBQWVoSyxNQUFmLEdBQXdCLENBQW5DLElBQXdDOEosTUFBNUMsRUFBb0Q7QUFDbEQsVUFBSUcsZ0JBQWdCdEssZ0RBQW1CTSxVQUFuQixDQUE4QjtBQUNoRDZKLGdCQUFRQSxNQUR3QztBQUVoREMsaUJBQVNBLE9BRnVDO0FBR2hEaEUsZ0JBQVFBLE1BSHdDO0FBSWhEekQsY0FBTUosS0FBS0MsR0FBTDtBQUowQyxPQUE5QixDQUFwQjs7QUFPQSxVQUFJOEgsYUFBSixFQUFtQjtBQUNqQixlQUFPdEssZ0RBQW1CTyxRQUFuQixDQUE0QjZGLE1BQTVCLEVBQW9Da0UsYUFBcEMsRUFBbUQsS0FDdkRqTCx5QkFESSxFQUVMbUIseURBRkssQ0FBUDtBQUdEO0FBRUYsS0FkRCxNQWNPO0FBQ0wsYUFBTzBDLFFBQVE2RCxNQUFSLENBQWUsS0FBZixDQUFQO0FBQ0Q7QUFDRjs7QUFFRHdELG1CQUFpQm5FLE1BQWpCLEVBQXlCO0FBQ3ZCLFdBQU9wRyxnREFBbUJDLFdBQW5CLENBQStCbUcsTUFBL0IsRUFBdUMsQ0FBQyxLQUM1Qy9HLHlCQUQyQyxDQUF2QyxFQUVKYSxJQUZJLENBRUNDLFlBQVk7QUFDbEIsYUFBT0EsU0FBU3NDLEdBQVQsQ0FBYVQsTUFBTUEsR0FBR2QsR0FBSCxFQUFuQixDQUFQO0FBQ0QsS0FKTSxDQUFQO0FBS0Q7O0FBNTFCc0I7O0FBZzJCekIsSUFBSXNKLHFCQUFxQixJQUFJOU0sa0JBQUosRUFBekI7O2tCQUVlOE0sa0IiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFLFxuICBTcGluYWxHcmFwaFNlcnZpY2Vcbn0gZnJvbSBcInNwaW5hbC1lbnYtdmlld2VyLWdyYXBoLXNlcnZpY2VcIjtcblxuaW1wb3J0IHtcbiAgRVFVSVBNRU5UU19UT19FTEVNRU5UX1JFTEFUSU9OXG59IGZyb20gXCJzcGluYWwtZW52LXZpZXdlci1yb29tLW1hbmFnZXIvanMvc2VydmljZVwiO1xuXG5pbXBvcnQgVmlzaXRNb2RlbCBmcm9tIFwiLi9tb2RlbHMvdmlzaXQubW9kZWwuanNcIjtcbmltcG9ydCBFdmVudE1vZGVsIGZyb20gXCIuL21vZGVscy9ldmVudC5tb2RlbC5qc1wiO1xuaW1wb3J0IFRhc2tNb2RlbCBmcm9tIFwiLi9tb2RlbHMvdGFzay5tb2RlbC5qc1wiO1xuXG5pbXBvcnQge1xuICBQdHIsXG4gIExzdCxcbiAgTW9kZWxcbn0gZnJvbSBcInNwaW5hbC1jb3JlLWNvbm5lY3RvcmpzX3R5cGVcIjtcblxuaW1wb3J0IG1vbWVudCBmcm9tIFwibW9tZW50XCI7XG5cbmNsYXNzIFNwaW5hbFZpc2l0U2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuVklTSVRfQ09OVEVYVF9OQU1FID0gXCIudmlzaXRfY29udGV4dFwiO1xuICAgIHRoaXMuQ09OVEVYVF9UWVBFID0gXCJ2aXNpdF9jb250ZXh0XCI7XG5cbiAgICB0aGlzLlZJU0lUX1RZUEUgPSBcInZpc2l0XCI7XG5cbiAgICB0aGlzLk1BSU5URU5BTkNFX1ZJU0lUID0gXCJNQUlOVEVOQU5DRV9WSVNJVFwiO1xuICAgIHRoaXMuUkVHVUxBVE9SWV9WSVNJVCA9IFwiUkVHVUxBVE9SWV9WSVNJVFwiO1xuICAgIHRoaXMuU0VDVVJJVFlfVklTSVQgPSBcIlNFQ1VSSVRZX1ZJU0lUXCI7XG4gICAgdGhpcy5ESUFHTk9TVElDX1ZJU0lUID0gXCJESUFHTk9TVElDX1ZJU0lUXCI7XG5cbiAgICB0aGlzLkVWRU5UX1NUQVRFUyA9IE9iamVjdC5mcmVlemUoe1xuICAgICAgZGVjbGFyZWQ6IHtcbiAgICAgICAgbmFtZTogXCJkw6ljbGFyw6lcIixcbiAgICAgICAgdHlwZTogXCJkZWNsYXJlZFwiXG4gICAgICB9LFxuICAgICAgcHJvY2Vzc2luZzoge1xuICAgICAgICBuYW1lOiBcImVuY291cnNcIixcbiAgICAgICAgdHlwZTogXCJwcm9jZXNzaW5nXCJcbiAgICAgIH0sXG4gICAgICBkb25lOiB7XG4gICAgICAgIG5hbWU6IFwiw6lmZmVjdHXDqVwiLFxuICAgICAgICB0eXBlOiBcImRvbmVcIlxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5WSVNJVFMgPSBPYmplY3QuZnJlZXplKFt7XG4gICAgICB0eXBlOiB0aGlzLk1BSU5URU5BTkNFX1ZJU0lULFxuICAgICAgbmFtZTogXCJWaXNpdGUgZGUgbWFpbnRlbmFuY2VcIlxuICAgIH0sIHtcbiAgICAgIHR5cGU6IHRoaXMuUkVHVUxBVE9SWV9WSVNJVCxcbiAgICAgIG5hbWU6IFwiVmlzaXRlIHJlZ2xlbWVudGFpcmVcIlxuICAgIH0sIHtcbiAgICAgIHR5cGU6IHRoaXMuU0VDVVJJVFlfVklTSVQsXG4gICAgICBuYW1lOiBcIlZpc2l0ZSBkZSBzZWN1cml0ZVwiXG4gICAgfSwge1xuICAgICAgdHlwZTogdGhpcy5ESUFHTk9TVElDX1ZJU0lULFxuICAgICAgbmFtZTogXCJWaXNpdGUgZGUgZGlhZ25vc3RpY1wiXG4gICAgfV0pO1xuXG5cbiAgICB0aGlzLk1BSU5URU5BTkNFX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OID1cbiAgICAgIFwibWFpbnRlbmFuY2VWaXNpdGhhc0V2ZW50U3RhdGVcIjtcblxuICAgIHRoaXMuUkVHVUxBVE9SWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiA9XG4gICAgICBcInJlZ3VsYXRvcnlWaXNpdGhhc0V2ZW50U3RhdGVcIjtcblxuICAgIHRoaXMuU0VDVVJJVFlfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04gPSBcInNlY3VyaXR5VmlzaXRoYXNFdmVudFN0YXRlXCI7XG5cbiAgICB0aGlzLkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04gPVxuICAgICAgXCJkaWFnbm9zdGljVmlzaXRoYXNFdmVudFN0YXRlXCI7XG5cbiAgICB0aGlzLkdST1VQX1RPX1RBU0sgPSBcImhhc1Zpc2l0XCI7XG5cbiAgICB0aGlzLlZJU0lUX1RPX0VWRU5UX1JFTEFUSU9OID0gXCJ2aXNpdEhhc0V2ZW50XCI7XG5cbiAgICB0aGlzLlZJU0lUX1RZUEVfVE9fR1JPVVBfUkVMQVRJT04gPSBcInZpc2l0SGFzR3JvdXBcIjtcbiAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OID0gXCJoYXNFdmVudFwiO1xuICAgIHRoaXMuRVZFTlRfVE9fVEFTS19SRUxBVElPTiA9IFwiaGFzVGFza1wiO1xuXG4gICAgdGhpcy5UQVNLX1RPX0NPTU1FTlRTX1JFTEFUSU9OID0gXCJoYXNDb21tZW50XCJcbiAgfVxuXG4gIGdldEFsbFZpc2l0cygpIHtcbiAgICByZXR1cm4gdGhpcy5WSVNJVFM7XG4gIH1cblxuICBhZGRWaXNpdE9uR3JvdXAoXG4gICAgZ3JvdXBJZCxcbiAgICB2aXNpdE5hbWUsXG4gICAgcGVyaW9kaWNpdHlOdW1iZXIsXG4gICAgcGVyaW9kaWNpdHlNZXN1cmUsXG4gICAgdmlzaXRUeXBlLFxuICAgIGludGVydmVudGlvbk51bWJlcixcbiAgICBpbnRlcnZlbnRpb25NZXN1cmUsXG4gICAgZGVzY3JpcHRpb25cbiAgKSB7XG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihncm91cElkLCBbdGhpcy5HUk9VUF9UT19UQVNLXSkudGhlbihcbiAgICAgIGNoaWxkcmVuID0+IHtcbiAgICAgICAgbGV0IGFyZ05vZGVJZDtcbiAgICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGFyZ05vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgIG5hbWU6IFwibWFpbnRlbmFuY2VcIlxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkKFxuICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgIGFyZ05vZGVJZCxcbiAgICAgICAgICAgIHRoaXMuR1JPVVBfVE9fVEFTSyxcbiAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5vZGUgPVxuICAgICAgICAgIHR5cGVvZiBhcmdOb2RlSWQgIT09IFwidW5kZWZpbmVkXCIgP1xuICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKGFyZ05vZGVJZCkgOlxuICAgICAgICAgIGNoaWxkcmVuWzBdO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldFB0clZhbHVlKG5vZGUsIHZpc2l0VHlwZSkudGhlbihsc3QgPT4ge1xuICAgICAgICAgIGxldCB0YXNrID0gbmV3IFZpc2l0TW9kZWwoXG4gICAgICAgICAgICB2aXNpdE5hbWUsXG4gICAgICAgICAgICBwZXJpb2RpY2l0eU51bWJlcixcbiAgICAgICAgICAgIHBlcmlvZGljaXR5TWVzdXJlLFxuICAgICAgICAgICAgdmlzaXRUeXBlLFxuICAgICAgICAgICAgaW50ZXJ2ZW50aW9uTnVtYmVyLFxuICAgICAgICAgICAgaW50ZXJ2ZW50aW9uTWVzdXJlLFxuICAgICAgICAgICAgZGVzY3JpcHRpb25cbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbGV0IG5vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgICAgZ3JvdXBJZDogZ3JvdXBJZCxcbiAgICAgICAgICAgICAgbmFtZTogdmlzaXROYW1lLFxuICAgICAgICAgICAgICBwZXJpb2RpY2l0eToge1xuICAgICAgICAgICAgICAgIG51bWJlcjogdGFzay5wZXJpb2RpY2l0eS5udW1iZXIuZ2V0KCksXG4gICAgICAgICAgICAgICAgbWVzdXJlOiB0YXNrLnBlcmlvZGljaXR5Lm1lc3VyZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBpbnRlcnZlbnRpb246IHtcbiAgICAgICAgICAgICAgICBudW1iZXI6IHRhc2suaW50ZXJ2ZW50aW9uLm51bWJlci5nZXQoKSxcbiAgICAgICAgICAgICAgICBtZXN1cmU6IHRhc2suaW50ZXJ2ZW50aW9uLm1lc3VyZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB2aXNpdFR5cGU6IHZpc2l0VHlwZSxcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGFza1xuICAgICAgICAgICk7XG5cbiAgICAgICAgICBsZXQgcmVhbE5vZGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0UmVhbE5vZGUobm9kZUlkKTtcblxuICAgICAgICAgIGxzdC5wdXNoKHJlYWxOb2RlKTtcblxuICAgICAgICAgIHJldHVybiByZWFsTm9kZS5pbmZvO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgLy8gZGVsZXRlVmlzaXQodmlzaXRJZCwgcmVtb3ZlUmVsYXRlZEV2ZW50KSB7XG4gIC8vICAgcmV0dXJuIHRoaXMucmVtb3ZlVmlzaXRFdmVudHModmlzaXRJZCwgcmVtb3ZlUmVsYXRlZEV2ZW50KS50aGVuKChcbiAgLy8gICAgIGluZm8pID0+IHtcblxuICAvLyAgICAgaWYgKGluZm8pIHtcbiAgLy8gICAgICAgbGV0IGdyb3VwSWQgPSBpbmZvLmdyb3VwSWQuZ2V0KCk7XG4gIC8vICAgICAgIGxldCB2aXNpdENvbnRleHRUeXBlID0gaW5mby52aXNpdFR5cGUuZ2V0KCk7XG5cbiAgLy8gICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JvdXBWaXNpdHMoZ3JvdXBJZCwgdmlzaXRDb250ZXh0VHlwZSkudGhlbihcbiAgLy8gICAgICAgICByZXMgPT4ge1xuICAvLyAgICAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHJlcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgLy8gICAgICAgICAgICAgY29uc3QgcmVzVmlzaXRJZCA9IHJlc1tpbmRleF0uaW5mby5pZC5nZXQoKTtcbiAgLy8gICAgICAgICAgICAgaWYgKHJlc1Zpc2l0SWQgPT0gdmlzaXRJZCkge1xuICAvLyAgICAgICAgICAgICAgIHJlcy5yZW1vdmUocmVzW2luZGV4XSk7XG4gIC8vICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gIC8vICAgICAgICAgICAgIH1cbiAgLy8gICAgICAgICAgIH1cbiAgLy8gICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgLy8gICAgICAgICB9KVxuICAvLyAgICAgfSBlbHNlIHtcbiAgLy8gICAgICAgcmV0dXJuIGZhbHNlO1xuICAvLyAgICAgfVxuXG4gIC8vICAgfSlcbiAgLy8gfVxuXG4gIGRlbGV0ZVZpc2l0KHZpc2l0SWQsIHJlbW92ZVZpc2l0LCByZW1vdmVSZWxhdGVkRXZlbnQsIGJlZ2luRGF0ZSwgZW5kRGF0ZSkge1xuXG4gICAgaWYgKHJlbW92ZVJlbGF0ZWRFdmVudCkge1xuICAgICAgdGhpcy5yZW1vdmVWaXNpdEV2ZW50cyh2aXNpdElkLCBiZWdpbkRhdGUsIGVuZERhdGUpLnRoZW4oZWwgPT4ge1xuICAgICAgICBpZiAocmVtb3ZlVmlzaXQpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZW1vdmVWaXNpdCh2aXNpdElkKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWw7XG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAocmVtb3ZlVmlzaXQpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlbW92ZVZpc2l0KHZpc2l0SWQpO1xuICAgIH1cblxuICB9XG5cbiAgcmVtb3ZlVmlzaXRFdmVudHModmlzaXRJZCwgYmVnaW5EYXRlLCBlbmREYXRlKSB7XG4gICAgLy8gaWYgKHJlbW92ZVJlbGF0ZWRFdmVudCkge1xuICAgIC8vICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbih2aXNpdElkLCBbdGhpc1xuICAgIC8vICAgICAuVklTSVRfVE9fRVZFTlRfUkVMQVRJT05cbiAgICAvLyAgIF0pLnRoZW4oKGNoaWxkcmVuKSA9PiB7XG4gICAgLy8gICAgIGxldCBjaGlsZHJlblByb21pc2UgPSBjaGlsZHJlbi5tYXAoZWwgPT4ge1xuICAgIC8vICAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UucmVtb3ZlRnJvbUdyYXBoKGVsLmlkLmdldCgpKTtcbiAgICAvLyAgICAgfSlcblxuICAgIC8vICAgICByZXR1cm4gUHJvbWlzZS5hbGwoY2hpbGRyZW5Qcm9taXNlKS50aGVuKCgpID0+IHtcbiAgICAvLyAgICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8odmlzaXRJZCk7XG4gICAgLy8gICAgIH0pO1xuXG4gICAgLy8gICB9KVxuICAgIC8vIH0gZWxzZSB7XG4gICAgLy8gICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKHZpc2l0SWQpKTtcbiAgICAvLyB9XG5cbiAgICByZXR1cm4gdGhpcy5nZXRFdmVudHNCZXR3ZWVuVHdvRGF0ZSh2aXNpdElkLCBiZWdpbkRhdGUsIGVuZERhdGUpLnRoZW4oXG4gICAgICBldmVudHMgPT4ge1xuICAgICAgICBldmVudHMuZm9yRWFjaChlbCA9PiB7XG4gICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLnJlbW92ZUZyb21HcmFwaChlbC5pZCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICB9KVxuXG4gIH1cblxuICBnZXRWaXNpdEV2ZW50cyh2aXNpdElkKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0RXZlbnRzQmV0d2VlblR3b0RhdGUodmlzaXRJZCk7XG4gIH1cblxuXG4gIGdldEV2ZW50c0JldHdlZW5Ud29EYXRlKHZpc2l0SWQsIGJlZ2luRGF0ZSwgZW5kRGF0ZSkge1xuXG4gICAgaWYgKHR5cGVvZiBiZWdpbkRhdGUgPT09IFwidW5kZWZpbmVkXCIpXG4gICAgICBiZWdpbkRhdGUgPSAwO1xuXG4gICAgaWYgKHR5cGVvZiBlbmREYXRlID09IFwidW5kZWZpbmVkXCIpXG4gICAgICBlbmREYXRlID0gRGF0ZS5ub3coKSAqIDMxNTM2MDAwMDAwICogMTAwO1xuXG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbih2aXNpdElkLCBbdGhpc1xuICAgICAgLlZJU0lUX1RPX0VWRU5UX1JFTEFUSU9OXG4gICAgXSkudGhlbigoY2hpbGRyZW4pID0+IHtcblxuICAgICAgY2hpbGRyZW4gPSBjaGlsZHJlbi5tYXAoZWwgPT4gZWwuZ2V0KCkpO1xuXG4gICAgICByZXR1cm4gY2hpbGRyZW4uZmlsdGVyKGVsID0+IHtcbiAgICAgICAgcmV0dXJuIGVsLmRhdGUgPj0gYmVnaW5EYXRlICYmIGVsLmRhdGUgPD0gZW5kRGF0ZTtcbiAgICAgIH0pXG5cbiAgICB9KVxuXG4gIH1cblxuICByZW1vdmVWaXNpdCh2aXNpdElkKSB7XG4gICAgbGV0IGluZm8gPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyh2aXNpdElkKTtcbiAgICBpZiAoaW5mbykge1xuICAgICAgbGV0IGdyb3VwSWQgPSBpbmZvLmdyb3VwSWQuZ2V0KCk7XG4gICAgICBsZXQgdmlzaXRDb250ZXh0VHlwZSA9IGluZm8udmlzaXRUeXBlLmdldCgpO1xuXG4gICAgICByZXR1cm4gdGhpcy5nZXRHcm91cFZpc2l0cyhncm91cElkLCB2aXNpdENvbnRleHRUeXBlKS50aGVuKFxuICAgICAgICByZXMgPT4ge1xuICAgICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCByZXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICBjb25zdCByZXNWaXNpdElkID0gcmVzW2luZGV4XS5pbmZvLmlkLmdldCgpO1xuICAgICAgICAgICAgaWYgKHJlc1Zpc2l0SWQgPT0gdmlzaXRJZCkge1xuICAgICAgICAgICAgICByZXMucmVtb3ZlKHJlc1tpbmRleF0pO1xuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBlZGl0VmlzaXQodmlzaXRJZCwgbmV3VmFsdWVzT2JqKSB7XG4gICAgaWYgKHR5cGVvZiBuZXdWYWx1ZXNPYmogIT09IFwib2JqZWN0XCIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgdmlzaXROb2RlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldFJlYWxOb2RlKHZpc2l0SWQpO1xuXG4gICAgaWYgKHR5cGVvZiB2aXNpdE5vZGUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIG5ld1ZhbHVlc09iaikge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IG5ld1ZhbHVlc09ialtrZXldO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIHZpc2l0Tm9kZS5pbmZvW2tleV0gIT09XG4gICAgICAgICAgXCJ1bmRlZmluZWRcIikge1xuXG4gICAgICAgICAgdmlzaXROb2RlLmluZm9ba2V5XS5zZXQodmFsdWUpO1xuXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiB2aXNpdE5vZGUuaW5mb1trZXldICE9PVxuICAgICAgICAgIFwidW5kZWZpbmVkXCIpIHtcblxuICAgICAgICAgIGZvciAoY29uc3Qga2V5MiBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUyID0gdmFsdWVba2V5Ml07XG5cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2aXNpdE5vZGUuaW5mb1trZXldW2tleTJdICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cbiAgICAgICAgICAgICAgaWYgKGtleSA9PT0gXCJpbnRlcnZlbnRpb25cIiAmJiBrZXkyID09PSBcIm1lc3VyZVwiKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlMiAhPT0gXCJ1bmRlZmluZWRcIikge1xuXG4gICAgICAgICAgICAgICAgICB2aXNpdE5vZGUuaW5mb1trZXldW2tleTJdLnNldChuZXcgQ2hvaWNlKFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTIsIFtcbiAgICAgICAgICAgICAgICAgICAgICBcIm1pbnV0ZShzKVwiLCBcImRheShzKVwiLFxuICAgICAgICAgICAgICAgICAgICAgIFwid2VlayhzKVwiLCBcIm1vbnRoKHMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgXCJ5ZWFyKHMpXCJcbiAgICAgICAgICAgICAgICAgICAgXSkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB2aXNpdE5vZGUuaW5mb1trZXldW2tleTJdLnNldChOYU4pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGtleSA9PT0gXCJwZXJpb2RpY2l0eVwiICYmIGtleTIgPT09IFwibWVzdXJlXCIpIHtcblxuICAgICAgICAgICAgICAgIHZpc2l0Tm9kZS5pbmZvW2tleV1ba2V5Ml0uc2V0KG5ldyBDaG9pY2UodmFsdWUyLCBbXG4gICAgICAgICAgICAgICAgICBcImRheShzKVwiLCBcIndlZWsocylcIixcbiAgICAgICAgICAgICAgICAgIFwibW9udGgocylcIixcbiAgICAgICAgICAgICAgICAgIFwieWVhcihzKVwiXG4gICAgICAgICAgICAgICAgXSkpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHR5cGVvZiB2YWx1ZTIgIT09IFwidW5kZWZpbmVkXCIgPyB2aXNpdE5vZGUuaW5mb1trZXldW2tleTJdLnNldChcbiAgICAgICAgICAgICAgICAgIHZhbHVlMikgOiB2aXNpdE5vZGUuaW5mb1trZXldW2tleTJdLnNldChOYU4pO1xuICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcblxuICB9XG5cbiAgZ2V0UHRyVmFsdWUobm9kZSwgcHRyTmFtZSkge1xuICAgIGxldCByZWFsTm9kZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRSZWFsTm9kZShub2RlLmlkLmdldCgpKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIGlmICghcmVhbE5vZGUuaW5mb1twdHJOYW1lXSkge1xuICAgICAgICByZWFsTm9kZS5pbmZvLmFkZF9hdHRyKHB0ck5hbWUsIHtcbiAgICAgICAgICB0YXNrczogbmV3IFB0cihuZXcgTHN0KCkpXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZWFsTm9kZS5pbmZvW3B0ck5hbWVdLnRhc2tzLmxvYWQodmFsdWUgPT4ge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZSh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldEdyb3VwVmlzaXRzKGdyb3VwSWQsIHZpc2l0eVR5cGUpIHtcbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKGdyb3VwSWQsIFt0aGlzLkdST1VQX1RPX1RBU0tdKS50aGVuKFxuICAgICAgcmVzID0+IHtcbiAgICAgICAgbGV0IG5vZGVJZDtcbiAgICAgICAgaWYgKHJlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBub2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgICAgICBuYW1lOiBcIm1haW50ZW5hbmNlXCJcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZChcbiAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICBub2RlSWQsXG4gICAgICAgICAgICB0aGlzLkdST1VQX1RPX1RBU0ssXG4gICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBub2RlID1cbiAgICAgICAgICB0eXBlb2Ygbm9kZUlkICE9PSBcInVuZGVmaW5lZFwiID9cbiAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhub2RlSWQpIDpcbiAgICAgICAgICByZXNbMF07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHRyVmFsdWUobm9kZSwgdmlzaXR5VHlwZSk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGdlbmVyYXRlRXZlbnQodmlzaXRUeXBlLCBncm91cElkLCBiZWdpbkRhdGUsIGVuZERhdGUsIGV2ZW50c0RhdGEpIHtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVWaXNpdENvbnRleHQodmlzaXRUeXBlKVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5saW5rR3JvdXBUb1Zpc3RDb250ZXh0KGVsLmlkLmdldCgpLCBncm91cElkKS50aGVuKFxuICAgICAgICAgIHJlcyA9PiB7XG4gICAgICAgICAgICBpZiAocmVzKSB7XG4gICAgICAgICAgICAgIHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoXG4gICAgICAgICAgICAgICAgZWwuaWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFUy5kZWNsYXJlZC50eXBlXG4gICAgICAgICAgICAgICkudGhlbihzdGF0ZU5vZGUgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBpZCA9IHN0YXRlTm9kZS5pZC5nZXQoKTtcblxuICAgICAgICAgICAgICAgIGV2ZW50c0RhdGEuZm9yRWFjaChldmVudEluZm8gPT4ge1xuICAgICAgICAgICAgICAgICAgbGV0IGV2ZW50c0RhdGUgPSB0aGlzLl9nZXREYXRlKFxuICAgICAgICAgICAgICAgICAgICBiZWdpbkRhdGUsXG4gICAgICAgICAgICAgICAgICAgIGVuZERhdGUsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50SW5mby5wZXJpb2ROdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50SW5mby5wZXJpb2RNZXN1cmVcbiAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgIGV2ZW50c0RhdGUuZm9yRWFjaChkYXRlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudChcbiAgICAgICAgICAgICAgICAgICAgICBlbC5pZC5nZXQoKSxcbiAgICAgICAgICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgICAgICAgICAgIGV2ZW50SW5mbyxcbiAgICAgICAgICAgICAgICAgICAgICBgJHtldmVudEluZm8ubmFtZX1gLFxuICAgICAgICAgICAgICAgICAgICAgIG5ldyBEYXRlKGRhdGUpLmdldFRpbWUoKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGVycik7XG4gICAgICB9KTtcbiAgfVxuXG4gIGFkZEV2ZW50KHZpc2l0VHlwZUNvbnRleHRJZCwgZ3JvdXBJZCwgc3RhdGVJZCwgdmlzaXRJbmZvLCBuYW1lLCBkYXRlKSB7XG4gICAgbGV0IHN0YXRlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8oc3RhdGVJZCkuc3RhdGUuZ2V0KCk7XG5cbiAgICBsZXQgZXZlbnQgPSBuZXcgRXZlbnRNb2RlbChuYW1lLCBkYXRlLCBzdGF0ZSwgZ3JvdXBJZCk7XG5cbiAgICBsZXQgZXZlbnROb2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgIGRhdGU6IGRhdGUsXG4gICAgICAgIHN0YXRlSWQ6IHN0YXRlSWQsXG4gICAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgICAgZ3JvdXBJZDogZ3JvdXBJZCxcbiAgICAgICAgdmlzaXRJZDogdmlzaXRJbmZvLmlkXG4gICAgICB9LFxuICAgICAgZXZlbnRcbiAgICApO1xuXG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dChcbiAgICAgICAgc3RhdGVJZCxcbiAgICAgICAgZXZlbnROb2RlSWQsXG4gICAgICAgIHZpc2l0VHlwZUNvbnRleHRJZCxcbiAgICAgICAgdGhpcy5FVkVOVF9TVEFURV9UT19FVkVOVF9SRUxBVElPTixcbiAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgKVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICBpZiAoZWwpIHJldHVybiBldmVudE5vZGVJZDtcbiAgICAgIH0pXG4gICAgICAudGhlbihldmVudElkID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudElkICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihncm91cElkLCBbXG4gICAgICAgICAgICBFUVVJUE1FTlRTX1RPX0VMRU1FTlRfUkVMQVRJT05cbiAgICAgICAgICBdKS50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgICAgICAgIGNoaWxkcmVuLm1hcChjaGlsZCA9PiB7XG4gICAgICAgICAgICAgIGxldCBuYW1lID0gYCR7Y2hpbGQubmFtZS5nZXQoKX1gO1xuICAgICAgICAgICAgICBsZXQgdGFzayA9IG5ldyBUYXNrTW9kZWwoXG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBjaGlsZC5kYmlkLmdldCgpLFxuICAgICAgICAgICAgICAgIGNoaWxkLmJpbUZpbGVJZC5nZXQoKSxcbiAgICAgICAgICAgICAgICB2aXNpdEluZm8ubmFtZSxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgbGV0IHRhc2tJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICAgICAgICB0eXBlOiBcInRhc2tcIixcbiAgICAgICAgICAgICAgICAgIGRiSWQ6IGNoaWxkLmRiaWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgICBiaW1GaWxlSWQ6IGNoaWxkLmJpbUZpbGVJZC5nZXQoKSxcbiAgICAgICAgICAgICAgICAgIHZpc2l0SWQ6IHZpc2l0SW5mby5pZCxcbiAgICAgICAgICAgICAgICAgIGV2ZW50SWQ6IGV2ZW50SWQsXG4gICAgICAgICAgICAgICAgICBncm91cElkOiBncm91cElkLFxuICAgICAgICAgICAgICAgICAgZG9uZTogZmFsc2VcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHRhc2tcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dChcbiAgICAgICAgICAgICAgICAgIGV2ZW50SWQsXG4gICAgICAgICAgICAgICAgICB0YXNrSWQsXG4gICAgICAgICAgICAgICAgICB2aXNpdFR5cGVDb250ZXh0SWQsXG4gICAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1RPX1RBU0tfUkVMQVRJT04sXG4gICAgICAgICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGQoXG4gICAgICAgICAgICAgICAgICB2aXNpdEluZm8uaWQsXG4gICAgICAgICAgICAgICAgICBldmVudElkLFxuICAgICAgICAgICAgICAgICAgdGhpcy5WSVNJVF9UT19FVkVOVF9SRUxBVElPTixcbiAgICAgICAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgY3JlYXRlVmlzaXRDb250ZXh0KHZpc2l0VHlwZSkge1xuICAgIGxldCB2aXNpdCA9IHRoaXMuVklTSVRTLmZpbmQoZWwgPT4ge1xuICAgICAgcmV0dXJuIGVsLnR5cGUgPT09IHZpc2l0VHlwZTtcbiAgICB9KTtcblxuICAgIGlmICh0eXBlb2YgdmlzaXQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGNvbnN0IGNvbnRleHROYW1lID0gYCR7dmlzaXQubmFtZX1gO1xuXG4gICAgICBsZXQgY29udGV4dCA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRDb250ZXh0KGNvbnRleHROYW1lKTtcbiAgICAgIGlmICh0eXBlb2YgY29udGV4dCAhPT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjb250ZXh0XG4gICAgICAgIC5pbmZvKTtcblxuICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDb250ZXh0KFxuICAgICAgICBjb250ZXh0TmFtZSxcbiAgICAgICAgdmlzaXRUeXBlLFxuICAgICAgICBuZXcgTW9kZWwoe1xuICAgICAgICAgIG5hbWU6IHRoaXMuVklTSVRfQ09OVEVYVF9OQU1FXG4gICAgICAgIH0pXG4gICAgICApLnRoZW4oY29udGV4dENyZWF0ZWQgPT4ge1xuICAgICAgICByZXR1cm4gY29udGV4dENyZWF0ZWQuaW5mbztcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXCJ2aXNpdE5vdEZvdW5kXCIpO1xuICAgIH1cbiAgfVxuXG4gIGxpbmtHcm91cFRvVmlzdENvbnRleHQodmlzaXRDb250ZXh0SWQsIGdyb3VwSWQpIHtcbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKHZpc2l0Q29udGV4dElkLCBbXG4gICAgICAgIHRoaXMuVklTSVRfVFlQRV9UT19HUk9VUF9SRUxBVElPTlxuICAgICAgXSlcbiAgICAgIC50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV0uaWQuZ2V0KCk7XG4gICAgICAgICAgaWYgKGNoaWxkID09PSBncm91cElkKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC50aGVuKGVsID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBlbCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGRJbkNvbnRleHQoXG4gICAgICAgICAgICB2aXNpdENvbnRleHRJZCxcbiAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICB2aXNpdENvbnRleHRJZCxcbiAgICAgICAgICAgIHRoaXMuVklTSVRfVFlQRV9UT19HUk9VUF9SRUxBVElPTixcbiAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICApLnRoZW4oYXN5bmMgcmVzID0+IHtcbiAgICAgICAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5nZXRFdmVudFN0YXRlTm9kZShcbiAgICAgICAgICAgICAgICB2aXNpdENvbnRleHRJZCxcbiAgICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICAgIHRoaXMuRVZFTlRfU1RBVEVTLnByb2Nlc3NpbmcudHlwZVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdldEV2ZW50U3RhdGVOb2RlKFxuICAgICAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICAgICAgdGhpcy5FVkVOVF9TVEFURVMuZG9uZS50eXBlXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIGdldEV2ZW50U3RhdGVOb2RlKHZpc2l0Q29udGV4dElkLCBncm91cElkLCBldmVudFNhdGUpIHtcbiAgICBsZXQgZXZlbnQgPSB0aGlzLl9ldmVudFNhdGVJc1ZhbGlkKGV2ZW50U2F0ZSk7XG5cbiAgICBpZiAodHlwZW9mIGV2ZW50ID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm47XG5cbiAgICBsZXQgY29udGV4dFR5cGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyh2aXNpdENvbnRleHRJZCkudHlwZS5nZXQoKTtcbiAgICBsZXQgcmVsYXRpb25OYW1lO1xuXG4gICAgc3dpdGNoIChjb250ZXh0VHlwZSkge1xuICAgICAgY2FzZSB0aGlzLk1BSU5URU5BTkNFX1ZJU0lUOlxuICAgICAgICByZWxhdGlvbk5hbWUgPSB0aGlzLk1BSU5URU5BTkNFX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdGhpcy5TRUNVUklUWV9WSVNJVDpcbiAgICAgICAgcmVsYXRpb25OYW1lID0gdGhpcy5TRUNVUklUWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIHRoaXMuRElBR05PU1RJQ19WSVNJVDpcbiAgICAgICAgcmVsYXRpb25OYW1lID0gdGhpcy5ESUFHTk9TVElDX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdGhpcy5SRUdVTEFUT1JZX1ZJU0lUOlxuICAgICAgICByZWxhdGlvbk5hbWUgPSB0aGlzLlJFR1VMQVRPUllfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT047XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oZ3JvdXBJZCwgW3JlbGF0aW9uTmFtZV0pXG4gICAgICAudGhlbihjaGlsZHJlbiA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBuYW1lID0gY2hpbGRyZW5baV0ubmFtZS5nZXQoKTtcbiAgICAgICAgICBjb25zdCB0eXBlID0gY2hpbGRyZW5baV0uc3RhdGUuZ2V0KCk7XG5cbiAgICAgICAgICBpZiAobmFtZSA9PT0gZXZlbnRTYXRlIHx8IHR5cGUgPT09IGV2ZW50U2F0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGNoaWxkcmVuW2ldO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC50aGVuKGVsID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBlbCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIGxldCBhcmdOb2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgICAgICBuYW1lOiBldmVudC5uYW1lLFxuICAgICAgICAgICAgc3RhdGU6IGV2ZW50LnR5cGUsXG4gICAgICAgICAgICBncm91cElkOiBncm91cElkLFxuICAgICAgICAgICAgdHlwZTogXCJFdmVudFN0YXRlXCJcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGRJbkNvbnRleHQoXG4gICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgYXJnTm9kZUlkLFxuICAgICAgICAgICAgdmlzaXRDb250ZXh0SWQsXG4gICAgICAgICAgICByZWxhdGlvbk5hbWUsXG4gICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgKS50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICBpZiAocmVzKSByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8oYXJnTm9kZUlkKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgdmFsaWRhdGVUYXNrKGNvbnRleHRJZCwgZ3JvdXBJZCwgZXZlbnRJZCwgdGFza0lkKSB7XG4gICAgbGV0IHRhc2tOb2RlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldFJlYWxOb2RlKHRhc2tJZCk7XG4gICAgdGFza05vZGUuaW5mby5kb25lLnNldCghdGFza05vZGUuaW5mby5kb25lLmdldCgpKTtcblxuICAgIGxldCBjdXJyZW50U3RhdGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKGV2ZW50SWQpLnN0YXRlSWQuZ2V0KCk7XG5cbiAgICByZXR1cm4gdGhpcy5fZ2V0U3RhdGUoY29udGV4dElkLCBncm91cElkLCBldmVudElkKS50aGVuKG5leHRTdGF0ZSA9PiB7XG5cbiAgICAgIGxldCBuZXh0U3RhdGVJZCA9IG5leHRTdGF0ZS5pZC5nZXQoKTtcblxuICAgICAgaWYgKG5leHRTdGF0ZUlkID09PSBjdXJyZW50U3RhdGVJZCkgcmV0dXJuIHRydWU7XG5cbiAgICAgIHJldHVybiB0aGlzLl9zd2l0Y2hFdmVudFN0YXRlKGV2ZW50SWQsIGN1cnJlbnRTdGF0ZUlkLCBuZXh0U3RhdGVJZCxcbiAgICAgICAgY29udGV4dElkKTtcblxuICAgIH0pO1xuXG4gIH1cblxuXG5cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgIFBSSVZBVEVTICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICBfZ2V0RGF0ZShiZWdpbkRhdGUsIGVuZERhdGUsIHBlcmlvZE51bWJlciwgcGVyaW9kTWVzdXJlKSB7XG4gICAgbGV0IG1lc3VyZSA9IFtcImRheXNcIiwgXCJ3ZWVrc1wiLCBcIm1vbnRoc1wiLCBcInllYXJzXCJdW3BlcmlvZE1lc3VyZV07XG5cbiAgICBsZXQgZXZlbnRzRGF0ZSA9IFtdO1xuXG4gICAgbGV0IGRhdGUgPSBtb21lbnQoYmVnaW5EYXRlKTtcbiAgICBsZXQgZW5kID0gbW9tZW50KGVuZERhdGUpO1xuXG4gICAgd2hpbGUgKGVuZC5kaWZmKGRhdGUpID49IDApIHtcbiAgICAgIGV2ZW50c0RhdGUucHVzaChkYXRlLnRvRGF0ZSgpKTtcblxuICAgICAgZGF0ZSA9IGRhdGUuYWRkKHBlcmlvZE51bWJlciwgbWVzdXJlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZXZlbnRzRGF0ZTtcbiAgfVxuXG4gIF9mb3JtYXREYXRlKGFyZ0RhdGUpIHtcbiAgICBsZXQgZGF0ZSA9IG5ldyBEYXRlKGFyZ0RhdGUpO1xuXG4gICAgcmV0dXJuIGAkeygoKSA9PiB7XG4gICAgICBsZXQgZCA9IGRhdGUuZ2V0RGF0ZSgpO1xuICAgICAgcmV0dXJuIGQudG9TdHJpbmcoKS5sZW5ndGggPiAxID8gZCA6ICcwJyArIGQ7XG4gICAgfSkoKX0vJHsoKCkgPT4ge1xuXG4gICAgICBsZXQgZCA9IGRhdGUuZ2V0TW9udGgoKSArIDE7XG4gICAgICByZXR1cm4gZC50b1N0cmluZygpLmxlbmd0aCA+IDEgPyBkIDogJzAnICsgZDtcblxuICAgIH0pKCl9LyR7ZGF0ZS5nZXRGdWxsWWVhcigpfWA7XG4gIH1cblxuICBfZXZlbnRTYXRlSXNWYWxpZChldmVudFN0YXRlKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5FVkVOVF9TVEFURVMpIHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5FVkVOVF9TVEFURVNba2V5XS5uYW1lID09PSBldmVudFN0YXRlIHx8XG4gICAgICAgIHRoaXMuRVZFTlRfU1RBVEVTW2tleV0udHlwZSA9PT0gZXZlbnRTdGF0ZVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLkVWRU5UX1NUQVRFU1trZXldO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBfZ2V0U3RhdGUoY29udGV4dElkLCBncm91cElkLCBldmVudElkKSB7XG5cbiAgICByZXR1cm4gdGhpcy5nZXRFdmVudFRhc2tzKGV2ZW50SWQpLnRoZW4odGFza3MgPT4ge1xuICAgICAgbGV0IHRhc2tzVmFsaWRhdGVkID0gdGFza3MuZmlsdGVyKGVsID0+IGVsLmRvbmUpO1xuICAgICAgbGV0IHN0YXRlT2JqO1xuXG4gICAgICBpZiAodGFza3NWYWxpZGF0ZWQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHN0YXRlT2JqID0gdGhpcy5FVkVOVF9TVEFURVMuZGVjbGFyZWQ7XG4gICAgICB9IGVsc2UgaWYgKHRhc2tzVmFsaWRhdGVkLmxlbmd0aCA9PT0gdGFza3MubGVuZ3RoKSB7XG4gICAgICAgIHN0YXRlT2JqID0gdGhpcy5FVkVOVF9TVEFURVMuZG9uZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXRlT2JqID0gdGhpcy5FVkVOVF9TVEFURVMucHJvY2Vzc2luZztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoY29udGV4dElkLCBncm91cElkLCBzdGF0ZU9iai50eXBlKTtcblxuICAgIH0pXG5cbiAgfVxuXG4gIF9zd2l0Y2hFdmVudFN0YXRlKGV2ZW50SWQsIGZyb21TdGF0ZUlkLCB0b1N0YXRlSWQsIGNvbnRleHRJZCkge1xuXG5cbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLnJlbW92ZUNoaWxkKGZyb21TdGF0ZUlkLCBldmVudElkLCB0aGlzXG4gICAgICAgIC5FVkVOVF9TVEFURV9UT19FVkVOVF9SRUxBVElPTiwgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRSlcbiAgICAgIC50aGVuKHJlbW92ZWQgPT4ge1xuICAgICAgICBpZiAocmVtb3ZlZCkge1xuICAgICAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGRJbkNvbnRleHQodG9TdGF0ZUlkLCBldmVudElkLFxuICAgICAgICAgICAgICBjb250ZXh0SWQsXG4gICAgICAgICAgICAgIHRoaXMuRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04sXG4gICAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEUpXG4gICAgICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIHJlcyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIGxldCBFdmVudE5vZGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0UmVhbE5vZGUoZXZlbnRJZCk7XG4gICAgICAgICAgICAgICAgbGV0IG5ld1N0YXRlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8odG9TdGF0ZUlkKS5zdGF0ZVxuICAgICAgICAgICAgICAgICAgLmdldCgpO1xuXG5cbiAgICAgICAgICAgICAgICBFdmVudE5vZGUuaW5mby5zdGF0ZS5zZXQobmV3U3RhdGUpO1xuICAgICAgICAgICAgICAgIEV2ZW50Tm9kZS5pbmZvLnN0YXRlSWQuc2V0KHRvU3RhdGVJZCk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSlcblxuXG4gIH1cblxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gICAgICAgICAgICAgICAgICAgICAgICBHRVQgSU5GT1JNQVRJT04gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gIGdldFZpc2l0R3JvdXBzKHZpc2l0VHlwZSkge1xuICAgIGxldCBjb250ZXh0cyA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRDb250ZXh0V2l0aFR5cGUodmlzaXRUeXBlKTtcbiAgICBpZiAoY29udGV4dHMubGVuZ3RoID09PSAwKSByZXR1cm4gW107XG5cbiAgICBsZXQgY29udGV4dElkID0gY29udGV4dHNbMF0uaW5mby5pZC5nZXQoKTtcblxuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oXG4gICAgICBjb250ZXh0SWQsXG4gICAgICB0aGlzLlZJU0lUX1RZUEVfVE9fR1JPVVBfUkVMQVRJT05cbiAgICApLnRoZW4ocmVzID0+IHtcbiAgICAgIHJldHVybiByZXMubWFwKGVsID0+IGVsLmdldCgpKTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgZ2V0R3JvdXBFdmVudFN0YXRlcyhjb250ZXh0SWQsIGdyb3VwSWQpIHtcbiAgICBsZXQgcHJvbWlzZXMgPSBbXTtcblxuICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuRVZFTlRfU1RBVEVTKSB7XG4gICAgICBwcm9taXNlcy5wdXNoKFxuICAgICAgICB0aGlzLmdldEV2ZW50U3RhdGVOb2RlKFxuICAgICAgICAgIGNvbnRleHRJZCxcbiAgICAgICAgICBncm91cElkLFxuICAgICAgICAgIHRoaXMuRVZFTlRfU1RBVEVTW2tleV0udHlwZVxuICAgICAgICApXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcyk7XG4gIH1cblxuICBnZXRHcm91cEV2ZW50cyhcbiAgICBncm91cElkLFxuICAgIFZJU0lUX1RZUEVTID0gW1xuICAgICAgdGhpcy5NQUlOVEVOQU5DRV9WSVNJVCxcbiAgICAgIHRoaXMuUkVHVUxBVE9SWV9WSVNJVCxcbiAgICAgIHRoaXMuU0VDVVJJVFlfVklTSVQsXG4gICAgICB0aGlzLkRJQUdOT1NUSUNfVklTSVRcbiAgICBdXG4gICkge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShWSVNJVF9UWVBFUykpIFZJU0lUX1RZUEVTID0gW1ZJU0lUX1RZUEVTXTtcblxuICAgIHJldHVybiBWSVNJVF9UWVBFUy5tYXAodmlzaXRUeXBlID0+IHtcbiAgICAgIGxldCB2aXNpdCA9IHRoaXMuVklTSVRTLmZpbmQoZWwgPT4ge1xuICAgICAgICByZXR1cm4gZWwudHlwZSA9PT0gdmlzaXRUeXBlO1xuICAgICAgfSk7XG5cbiAgICAgIGxldCBjb250ZXh0ID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENvbnRleHQodmlzaXQubmFtZSk7XG5cbiAgICAgIGlmICh0eXBlb2YgY29udGV4dCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBsZXQgY29udGV4dElkID0gY29udGV4dC5pbmZvLmlkLmdldCgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyb3VwRXZlbnRTdGF0ZXMoY29udGV4dElkLCBncm91cElkKS50aGVuKFxuICAgICAgICAgIHZhbHVlcyA9PiB7XG4gICAgICAgICAgICBsZXQgcHJvbSA9IHZhbHVlcy5tYXAoYXN5bmMgZXZlbnRUeXBlID0+IHtcbiAgICAgICAgICAgICAgbGV0IHJlcyA9IGV2ZW50VHlwZS5nZXQoKTtcblxuICAgICAgICAgICAgICByZXNbXCJ2aXNpdF90eXBlXCJdID0gdmlzaXRUeXBlO1xuXG4gICAgICAgICAgICAgIGxldCBldmVudHMgPSBhd2FpdCBTcGluYWxHcmFwaFNlcnZpY2VcbiAgICAgICAgICAgICAgICAuZ2V0Q2hpbGRyZW4oXG4gICAgICAgICAgICAgICAgICByZXMuaWQsIFtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5FVkVOVF9TVEFURV9UT19FVkVOVF9SRUxBVElPTlxuICAgICAgICAgICAgICAgICAgXSk7XG5cbiAgICAgICAgICAgICAgcmVzW1wiZXZlbnRzXCJdID0gZXZlbnRzLm1hcChlbCA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsLmdldCgpO1xuICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9tKS50aGVuKGFsbEV2ZW50cyA9PiB7XG4gICAgICAgICAgICAgIGxldCB2YWx1ZXMgPSB7fTtcblxuICAgICAgICAgICAgICBhbGxFdmVudHMuZm9yRWFjaCh2YWwgPT4ge1xuICAgICAgICAgICAgICAgIHZhbHVlc1t2YWwuc3RhdGVdID0gdmFsLmV2ZW50cztcbiAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBbdmlzaXRUeXBlXTogdmFsdWVzXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGdldEV2ZW50VGFza3MoZXZlbnRJZCkge1xuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oZXZlbnRJZCwgW3RoaXNcbiAgICAgICAgLkVWRU5UX1RPX1RBU0tfUkVMQVRJT05cbiAgICAgIF0pXG4gICAgICAudGhlbihjaGlsZHJlbiA9PiB7XG4gICAgICAgIHJldHVybiBjaGlsZHJlbi5tYXAoZWwgPT4gZWwuZ2V0KCkpXG4gICAgICB9KVxuICB9XG5cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gIC8vICAgICAgICAgICAgICAgICAgICAgICAgQ29tbWVudCBNYW5hZ2VyICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICBhZGRDb21tZW50KHRhc2tJZCwgdXNlcklkLCBtZXNzYWdlKSB7XG4gICAgaWYgKG1lc3NhZ2UgJiYgbWVzc2FnZS50cmltKCkubGVuZ3RoID4gMCAmJiB1c2VySWQpIHtcbiAgICAgIGxldCBjb21tZW50Tm9kZUlkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmNyZWF0ZU5vZGUoe1xuICAgICAgICB1c2VySWQ6IHVzZXJJZCxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgdGFza0lkOiB0YXNrSWQsXG4gICAgICAgIGRhdGU6IERhdGUubm93KClcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoY29tbWVudE5vZGVJZCkge1xuICAgICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkKHRhc2tJZCwgY29tbWVudE5vZGVJZCwgdGhpc1xuICAgICAgICAgIC5UQVNLX1RPX0NPTU1FTlRTX1JFTEFUSU9OLFxuICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEUpO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0VGFza3NDb21tZW50cyh0YXNrSWQpIHtcbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKHRhc2tJZCwgW3RoaXNcbiAgICAgIC5UQVNLX1RPX0NPTU1FTlRTX1JFTEFUSU9OXG4gICAgXSkudGhlbihjaGlsZHJlbiA9PiB7XG4gICAgICByZXR1cm4gY2hpbGRyZW4ubWFwKGVsID0+IGVsLmdldCgpKTtcbiAgICB9KVxuICB9XG5cbn1cblxubGV0IHNwaW5hbFZpc2l0U2VydmljZSA9IG5ldyBTcGluYWxWaXNpdFNlcnZpY2UoKTtcblxuZXhwb3J0IGRlZmF1bHQgc3BpbmFsVmlzaXRTZXJ2aWNlOyJdfQ==