"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _spinalEnvViewerGraphService = require("spinal-env-viewer-graph-service");

var _service = require("spinal-env-viewer-room-manager/services/service");

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

  deleteVisit(visitId, removeVisit, removeRelatedEvent, beginDate, endDate, reference) {

    if (removeRelatedEvent) {
      this.removeVisitEvents(visitId, beginDate, endDate, reference).then(el => {
        if (removeVisit) {
          return this.removeVisit(visitId);
        }
        return el;
      });
    } else if (removeVisit) {
      return this.removeVisit(visitId);
    }
  }

  removeVisitEvents(visitId, beginDate, endDate, reference) {
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

    let conditionValid = element => {
      if (!reference || reference.trim().length === 0) return true;

      return element.reference === reference;
    };

    return this.getEventsBetweenTwoDate(visitId, beginDate, endDate).then(events => {

      events.forEach(el => {
        if (conditionValid(el)) {
          _spinalEnvViewerGraphService.SpinalGraphService.removeFromGraph(el.id);
        }
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

  generateEvent(visitType, groupId, beginDate, endDate, eventsData, referenceName) {
    return this.createVisitContext(visitType).then(el => {
      return this.linkGroupToVistContext(el.id.get(), groupId).then(res => {
        if (res) {
          this.getEventStateNode(el.id.get(), groupId, this.EVENT_STATES.declared.type).then(stateNode => {
            let id = stateNode.id.get();

            eventsData.forEach(eventInfo => {
              let eventsDate = this._getDate(beginDate, endDate, eventInfo.periodNumber, eventInfo.periodMesure);

              eventsDate.forEach(date => {
                this.addEvent(el.id.get(), groupId, id, eventInfo, `${eventInfo.name}`, new Date(date).getTime(), Date.now(), referenceName);
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

  addEvent(visitTypeContextId, groupId, stateId, visitInfo, name, date, creationDate, referenceName) {
    let state = _spinalEnvViewerGraphService.SpinalGraphService.getInfo(stateId).state.get();

    let event = new _eventModel2.default(name, date, state, groupId, creationDate, referenceName);

    let eventNodeId = _spinalEnvViewerGraphService.SpinalGraphService.createNode({
      name: name,
      date: date,
      creation: creationDate,
      reference: referenceName,
      stateId: stateId,
      state: state,
      groupId: groupId,
      visitId: visitInfo.id
    }, event);

    return _spinalEnvViewerGraphService.SpinalGraphService.addChildInContext(stateId, eventNodeId, visitTypeContextId, this.EVENT_STATE_TO_EVENT_RELATION, _spinalEnvViewerGraphService.SPINAL_RELATION_PTR_LST_TYPE).then(el => {
      if (el) return eventNodeId;
    }).then(eventId => {
      if (typeof eventId !== "undefined") {
        return _spinalEnvViewerGraphService.SpinalGraphService.getChildren(groupId, [_service.groupService.constants.GROUP_TO_EQUIPMENTS_RELATION]).then(children => {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJTcGluYWxWaXNpdFNlcnZpY2UiLCJjb25zdHJ1Y3RvciIsIlZJU0lUX0NPTlRFWFRfTkFNRSIsIkNPTlRFWFRfVFlQRSIsIlZJU0lUX1RZUEUiLCJNQUlOVEVOQU5DRV9WSVNJVCIsIlJFR1VMQVRPUllfVklTSVQiLCJTRUNVUklUWV9WSVNJVCIsIkRJQUdOT1NUSUNfVklTSVQiLCJFVkVOVF9TVEFURVMiLCJPYmplY3QiLCJmcmVlemUiLCJkZWNsYXJlZCIsIm5hbWUiLCJ0eXBlIiwicHJvY2Vzc2luZyIsImRvbmUiLCJWSVNJVFMiLCJNQUlOVEVOQU5DRV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIlJFR1VMQVRPUllfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJTRUNVUklUWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJHUk9VUF9UT19UQVNLIiwiVklTSVRfVE9fRVZFTlRfUkVMQVRJT04iLCJWSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OIiwiRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04iLCJFVkVOVF9UT19UQVNLX1JFTEFUSU9OIiwiVEFTS19UT19DT01NRU5UU19SRUxBVElPTiIsImdldEFsbFZpc2l0cyIsImFkZFZpc2l0T25Hcm91cCIsImdyb3VwSWQiLCJ2aXNpdE5hbWUiLCJwZXJpb2RpY2l0eU51bWJlciIsInBlcmlvZGljaXR5TWVzdXJlIiwidmlzaXRUeXBlIiwiaW50ZXJ2ZW50aW9uTnVtYmVyIiwiaW50ZXJ2ZW50aW9uTWVzdXJlIiwiZGVzY3JpcHRpb24iLCJTcGluYWxHcmFwaFNlcnZpY2UiLCJnZXRDaGlsZHJlbiIsInRoZW4iLCJjaGlsZHJlbiIsImFyZ05vZGVJZCIsImxlbmd0aCIsImNyZWF0ZU5vZGUiLCJhZGRDaGlsZCIsIlNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEUiLCJub2RlIiwiZ2V0SW5mbyIsImdldFB0clZhbHVlIiwibHN0IiwidGFzayIsIlZpc2l0TW9kZWwiLCJub2RlSWQiLCJwZXJpb2RpY2l0eSIsIm51bWJlciIsImdldCIsIm1lc3VyZSIsImludGVydmVudGlvbiIsInJlYWxOb2RlIiwiZ2V0UmVhbE5vZGUiLCJwdXNoIiwiaW5mbyIsImRlbGV0ZVZpc2l0IiwidmlzaXRJZCIsInJlbW92ZVZpc2l0IiwicmVtb3ZlUmVsYXRlZEV2ZW50IiwiYmVnaW5EYXRlIiwiZW5kRGF0ZSIsInJlZmVyZW5jZSIsInJlbW92ZVZpc2l0RXZlbnRzIiwiZWwiLCJjb25kaXRpb25WYWxpZCIsImVsZW1lbnQiLCJ0cmltIiwiZ2V0RXZlbnRzQmV0d2VlblR3b0RhdGUiLCJldmVudHMiLCJmb3JFYWNoIiwicmVtb3ZlRnJvbUdyYXBoIiwiaWQiLCJnZXRWaXNpdEV2ZW50cyIsIkRhdGUiLCJub3ciLCJtYXAiLCJmaWx0ZXIiLCJkYXRlIiwidmlzaXRDb250ZXh0VHlwZSIsImdldEdyb3VwVmlzaXRzIiwicmVzIiwiaW5kZXgiLCJyZXNWaXNpdElkIiwicmVtb3ZlIiwiUHJvbWlzZSIsInJlc29sdmUiLCJlZGl0VmlzaXQiLCJuZXdWYWx1ZXNPYmoiLCJ2aXNpdE5vZGUiLCJrZXkiLCJ2YWx1ZSIsInNldCIsImtleTIiLCJ2YWx1ZTIiLCJDaG9pY2UiLCJOYU4iLCJwdHJOYW1lIiwiYWRkX2F0dHIiLCJ0YXNrcyIsIlB0ciIsIkxzdCIsImxvYWQiLCJ2aXNpdHlUeXBlIiwiZ2VuZXJhdGVFdmVudCIsImV2ZW50c0RhdGEiLCJyZWZlcmVuY2VOYW1lIiwiY3JlYXRlVmlzaXRDb250ZXh0IiwibGlua0dyb3VwVG9WaXN0Q29udGV4dCIsImdldEV2ZW50U3RhdGVOb2RlIiwic3RhdGVOb2RlIiwiZXZlbnRJbmZvIiwiZXZlbnRzRGF0ZSIsIl9nZXREYXRlIiwicGVyaW9kTnVtYmVyIiwicGVyaW9kTWVzdXJlIiwiYWRkRXZlbnQiLCJnZXRUaW1lIiwiY2F0Y2giLCJlcnIiLCJjb25zb2xlIiwibG9nIiwidmlzaXRUeXBlQ29udGV4dElkIiwic3RhdGVJZCIsInZpc2l0SW5mbyIsImNyZWF0aW9uRGF0ZSIsInN0YXRlIiwiZXZlbnQiLCJFdmVudE1vZGVsIiwiZXZlbnROb2RlSWQiLCJjcmVhdGlvbiIsImFkZENoaWxkSW5Db250ZXh0IiwiZXZlbnRJZCIsImdyb3VwU2VydmljZSIsImNvbnN0YW50cyIsIkdST1VQX1RPX0VRVUlQTUVOVFNfUkVMQVRJT04iLCJjaGlsZCIsIlRhc2tNb2RlbCIsImRiaWQiLCJiaW1GaWxlSWQiLCJ0YXNrSWQiLCJkYklkIiwiYWxsIiwidmlzaXQiLCJmaW5kIiwiY29udGV4dE5hbWUiLCJjb250ZXh0IiwiZ2V0Q29udGV4dCIsImFkZENvbnRleHQiLCJNb2RlbCIsImNvbnRleHRDcmVhdGVkIiwicmVqZWN0IiwidmlzaXRDb250ZXh0SWQiLCJpIiwiZXZlbnRTYXRlIiwiX2V2ZW50U2F0ZUlzVmFsaWQiLCJjb250ZXh0VHlwZSIsInJlbGF0aW9uTmFtZSIsInZhbGlkYXRlVGFzayIsImNvbnRleHRJZCIsInRhc2tOb2RlIiwiY3VycmVudFN0YXRlSWQiLCJfZ2V0U3RhdGUiLCJuZXh0U3RhdGUiLCJuZXh0U3RhdGVJZCIsIl9zd2l0Y2hFdmVudFN0YXRlIiwiZW5kIiwiZGlmZiIsInRvRGF0ZSIsImFkZCIsIl9mb3JtYXREYXRlIiwiYXJnRGF0ZSIsImQiLCJnZXREYXRlIiwidG9TdHJpbmciLCJnZXRNb250aCIsImdldEZ1bGxZZWFyIiwiZXZlbnRTdGF0ZSIsInVuZGVmaW5lZCIsImdldEV2ZW50VGFza3MiLCJ0YXNrc1ZhbGlkYXRlZCIsInN0YXRlT2JqIiwiZnJvbVN0YXRlSWQiLCJ0b1N0YXRlSWQiLCJyZW1vdmVDaGlsZCIsInJlbW92ZWQiLCJFdmVudE5vZGUiLCJuZXdTdGF0ZSIsImdldFZpc2l0R3JvdXBzIiwiY29udGV4dHMiLCJnZXRDb250ZXh0V2l0aFR5cGUiLCJnZXRHcm91cEV2ZW50U3RhdGVzIiwicHJvbWlzZXMiLCJnZXRHcm91cEV2ZW50cyIsIlZJU0lUX1RZUEVTIiwiQXJyYXkiLCJpc0FycmF5IiwidmFsdWVzIiwicHJvbSIsImV2ZW50VHlwZSIsImFsbEV2ZW50cyIsInZhbCIsImFkZENvbW1lbnQiLCJ1c2VySWQiLCJtZXNzYWdlIiwiY29tbWVudE5vZGVJZCIsImdldFRhc2tzQ29tbWVudHMiLCJzcGluYWxWaXNpdFNlcnZpY2UiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOztBQUtBOztBQUlBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBOztBQU1BOzs7Ozs7OztBQUVBLE1BQU1BLGtCQUFOLENBQXlCO0FBQ3ZCQyxnQkFBYztBQUNaLFNBQUtDLGtCQUFMLEdBQTBCLGdCQUExQjtBQUNBLFNBQUtDLFlBQUwsR0FBb0IsZUFBcEI7O0FBRUEsU0FBS0MsVUFBTCxHQUFrQixPQUFsQjs7QUFFQSxTQUFLQyxpQkFBTCxHQUF5QixtQkFBekI7QUFDQSxTQUFLQyxnQkFBTCxHQUF3QixrQkFBeEI7QUFDQSxTQUFLQyxjQUFMLEdBQXNCLGdCQUF0QjtBQUNBLFNBQUtDLGdCQUFMLEdBQXdCLGtCQUF4Qjs7QUFFQSxTQUFLQyxZQUFMLEdBQW9CQyxPQUFPQyxNQUFQLENBQWM7QUFDaENDLGdCQUFVO0FBQ1JDLGNBQU0sU0FERTtBQUVSQyxjQUFNO0FBRkUsT0FEc0I7QUFLaENDLGtCQUFZO0FBQ1ZGLGNBQU0sU0FESTtBQUVWQyxjQUFNO0FBRkksT0FMb0I7QUFTaENFLFlBQU07QUFDSkgsY0FBTSxVQURGO0FBRUpDLGNBQU07QUFGRjtBQVQwQixLQUFkLENBQXBCOztBQWVBLFNBQUtHLE1BQUwsR0FBY1AsT0FBT0MsTUFBUCxDQUFjLENBQUM7QUFDM0JHLFlBQU0sS0FBS1QsaUJBRGdCO0FBRTNCUSxZQUFNO0FBRnFCLEtBQUQsRUFHekI7QUFDREMsWUFBTSxLQUFLUixnQkFEVjtBQUVETyxZQUFNO0FBRkwsS0FIeUIsRUFNekI7QUFDREMsWUFBTSxLQUFLUCxjQURWO0FBRURNLFlBQU07QUFGTCxLQU55QixFQVN6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QUNqQixlQUFPOUssZ0RBQW1CTyxRQUFuQixDQUE0QnNHLE1BQTVCLEVBQW9DaUUsYUFBcEMsRUFBbUQsS0FDdkR6TCx5QkFESSxFQUVMbUIseURBRkssQ0FBUDtBQUdEO0FBRUYsS0FkRCxNQWNPO0FBQ0wsYUFBTzhDLFFBQVFrRSxNQUFSLENBQWUsS0FBZixDQUFQO0FBQ0Q7QUFDRjs7QUFFRHVELG1CQUFpQmxFLE1BQWpCLEVBQXlCO0FBQ3ZCLFdBQU83RyxnREFBbUJDLFdBQW5CLENBQStCNEcsTUFBL0IsRUFBdUMsQ0FBQyxLQUM1Q3hILHlCQUQyQyxDQUF2QyxFQUVKYSxJQUZJLENBRUNDLFlBQVk7QUFDbEIsYUFBT0EsU0FBUzBDLEdBQVQsQ0FBYVosTUFBTUEsR0FBR2YsR0FBSCxFQUFuQixDQUFQO0FBQ0QsS0FKTSxDQUFQO0FBS0Q7O0FBOTJCc0I7O0FBazNCekIsSUFBSThKLHFCQUFxQixJQUFJdE4sa0JBQUosRUFBekI7O2tCQUVlc04sa0IiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFLFxuICBTcGluYWxHcmFwaFNlcnZpY2Vcbn0gZnJvbSBcInNwaW5hbC1lbnYtdmlld2VyLWdyYXBoLXNlcnZpY2VcIjtcblxuaW1wb3J0IHtcbiAgZ3JvdXBTZXJ2aWNlXG59IGZyb20gXCJzcGluYWwtZW52LXZpZXdlci1yb29tLW1hbmFnZXIvc2VydmljZXMvc2VydmljZVwiO1xuXG5pbXBvcnQgVmlzaXRNb2RlbCBmcm9tIFwiLi9tb2RlbHMvdmlzaXQubW9kZWwuanNcIjtcbmltcG9ydCBFdmVudE1vZGVsIGZyb20gXCIuL21vZGVscy9ldmVudC5tb2RlbC5qc1wiO1xuaW1wb3J0IFRhc2tNb2RlbCBmcm9tIFwiLi9tb2RlbHMvdGFzay5tb2RlbC5qc1wiO1xuXG5pbXBvcnQge1xuICBQdHIsXG4gIExzdCxcbiAgTW9kZWxcbn0gZnJvbSBcInNwaW5hbC1jb3JlLWNvbm5lY3RvcmpzX3R5cGVcIjtcblxuaW1wb3J0IG1vbWVudCBmcm9tIFwibW9tZW50XCI7XG5cbmNsYXNzIFNwaW5hbFZpc2l0U2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuVklTSVRfQ09OVEVYVF9OQU1FID0gXCIudmlzaXRfY29udGV4dFwiO1xuICAgIHRoaXMuQ09OVEVYVF9UWVBFID0gXCJ2aXNpdF9jb250ZXh0XCI7XG5cbiAgICB0aGlzLlZJU0lUX1RZUEUgPSBcInZpc2l0XCI7XG5cbiAgICB0aGlzLk1BSU5URU5BTkNFX1ZJU0lUID0gXCJNQUlOVEVOQU5DRV9WSVNJVFwiO1xuICAgIHRoaXMuUkVHVUxBVE9SWV9WSVNJVCA9IFwiUkVHVUxBVE9SWV9WSVNJVFwiO1xuICAgIHRoaXMuU0VDVVJJVFlfVklTSVQgPSBcIlNFQ1VSSVRZX1ZJU0lUXCI7XG4gICAgdGhpcy5ESUFHTk9TVElDX1ZJU0lUID0gXCJESUFHTk9TVElDX1ZJU0lUXCI7XG5cbiAgICB0aGlzLkVWRU5UX1NUQVRFUyA9IE9iamVjdC5mcmVlemUoe1xuICAgICAgZGVjbGFyZWQ6IHtcbiAgICAgICAgbmFtZTogXCJkw6ljbGFyw6lcIixcbiAgICAgICAgdHlwZTogXCJkZWNsYXJlZFwiXG4gICAgICB9LFxuICAgICAgcHJvY2Vzc2luZzoge1xuICAgICAgICBuYW1lOiBcImVuY291cnNcIixcbiAgICAgICAgdHlwZTogXCJwcm9jZXNzaW5nXCJcbiAgICAgIH0sXG4gICAgICBkb25lOiB7XG4gICAgICAgIG5hbWU6IFwiw6lmZmVjdHXDqVwiLFxuICAgICAgICB0eXBlOiBcImRvbmVcIlxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5WSVNJVFMgPSBPYmplY3QuZnJlZXplKFt7XG4gICAgICB0eXBlOiB0aGlzLk1BSU5URU5BTkNFX1ZJU0lULFxuICAgICAgbmFtZTogXCJWaXNpdGUgZGUgbWFpbnRlbmFuY2VcIlxuICAgIH0sIHtcbiAgICAgIHR5cGU6IHRoaXMuUkVHVUxBVE9SWV9WSVNJVCxcbiAgICAgIG5hbWU6IFwiVmlzaXRlIHJlZ2xlbWVudGFpcmVcIlxuICAgIH0sIHtcbiAgICAgIHR5cGU6IHRoaXMuU0VDVVJJVFlfVklTSVQsXG4gICAgICBuYW1lOiBcIlZpc2l0ZSBkZSBzZWN1cml0ZVwiXG4gICAgfSwge1xuICAgICAgdHlwZTogdGhpcy5ESUFHTk9TVElDX1ZJU0lULFxuICAgICAgbmFtZTogXCJWaXNpdGUgZGUgZGlhZ25vc3RpY1wiXG4gICAgfV0pO1xuXG5cbiAgICB0aGlzLk1BSU5URU5BTkNFX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OID1cbiAgICAgIFwibWFpbnRlbmFuY2VWaXNpdGhhc0V2ZW50U3RhdGVcIjtcblxuICAgIHRoaXMuUkVHVUxBVE9SWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiA9XG4gICAgICBcInJlZ3VsYXRvcnlWaXNpdGhhc0V2ZW50U3RhdGVcIjtcblxuICAgIHRoaXMuU0VDVVJJVFlfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04gPSBcInNlY3VyaXR5VmlzaXRoYXNFdmVudFN0YXRlXCI7XG5cbiAgICB0aGlzLkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04gPVxuICAgICAgXCJkaWFnbm9zdGljVmlzaXRoYXNFdmVudFN0YXRlXCI7XG5cbiAgICB0aGlzLkdST1VQX1RPX1RBU0sgPSBcImhhc1Zpc2l0XCI7XG5cbiAgICB0aGlzLlZJU0lUX1RPX0VWRU5UX1JFTEFUSU9OID0gXCJ2aXNpdEhhc0V2ZW50XCI7XG5cbiAgICB0aGlzLlZJU0lUX1RZUEVfVE9fR1JPVVBfUkVMQVRJT04gPSBcInZpc2l0SGFzR3JvdXBcIjtcbiAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OID0gXCJoYXNFdmVudFwiO1xuICAgIHRoaXMuRVZFTlRfVE9fVEFTS19SRUxBVElPTiA9IFwiaGFzVGFza1wiO1xuXG4gICAgdGhpcy5UQVNLX1RPX0NPTU1FTlRTX1JFTEFUSU9OID0gXCJoYXNDb21tZW50XCJcbiAgfVxuXG4gIGdldEFsbFZpc2l0cygpIHtcbiAgICByZXR1cm4gdGhpcy5WSVNJVFM7XG4gIH1cblxuICBhZGRWaXNpdE9uR3JvdXAoXG4gICAgZ3JvdXBJZCxcbiAgICB2aXNpdE5hbWUsXG4gICAgcGVyaW9kaWNpdHlOdW1iZXIsXG4gICAgcGVyaW9kaWNpdHlNZXN1cmUsXG4gICAgdmlzaXRUeXBlLFxuICAgIGludGVydmVudGlvbk51bWJlcixcbiAgICBpbnRlcnZlbnRpb25NZXN1cmUsXG4gICAgZGVzY3JpcHRpb25cbiAgKSB7XG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihncm91cElkLCBbdGhpcy5HUk9VUF9UT19UQVNLXSkudGhlbihcbiAgICAgIGNoaWxkcmVuID0+IHtcbiAgICAgICAgbGV0IGFyZ05vZGVJZDtcbiAgICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGFyZ05vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgIG5hbWU6IFwibWFpbnRlbmFuY2VcIlxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkKFxuICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgIGFyZ05vZGVJZCxcbiAgICAgICAgICAgIHRoaXMuR1JPVVBfVE9fVEFTSyxcbiAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5vZGUgPVxuICAgICAgICAgIHR5cGVvZiBhcmdOb2RlSWQgIT09IFwidW5kZWZpbmVkXCIgP1xuICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKGFyZ05vZGVJZCkgOlxuICAgICAgICAgIGNoaWxkcmVuWzBdO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldFB0clZhbHVlKG5vZGUsIHZpc2l0VHlwZSkudGhlbihsc3QgPT4ge1xuICAgICAgICAgIGxldCB0YXNrID0gbmV3IFZpc2l0TW9kZWwoXG4gICAgICAgICAgICB2aXNpdE5hbWUsXG4gICAgICAgICAgICBwZXJpb2RpY2l0eU51bWJlcixcbiAgICAgICAgICAgIHBlcmlvZGljaXR5TWVzdXJlLFxuICAgICAgICAgICAgdmlzaXRUeXBlLFxuICAgICAgICAgICAgaW50ZXJ2ZW50aW9uTnVtYmVyLFxuICAgICAgICAgICAgaW50ZXJ2ZW50aW9uTWVzdXJlLFxuICAgICAgICAgICAgZGVzY3JpcHRpb25cbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbGV0IG5vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgICAgZ3JvdXBJZDogZ3JvdXBJZCxcbiAgICAgICAgICAgICAgbmFtZTogdmlzaXROYW1lLFxuICAgICAgICAgICAgICBwZXJpb2RpY2l0eToge1xuICAgICAgICAgICAgICAgIG51bWJlcjogdGFzay5wZXJpb2RpY2l0eS5udW1iZXIuZ2V0KCksXG4gICAgICAgICAgICAgICAgbWVzdXJlOiB0YXNrLnBlcmlvZGljaXR5Lm1lc3VyZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBpbnRlcnZlbnRpb246IHtcbiAgICAgICAgICAgICAgICBudW1iZXI6IHRhc2suaW50ZXJ2ZW50aW9uLm51bWJlci5nZXQoKSxcbiAgICAgICAgICAgICAgICBtZXN1cmU6IHRhc2suaW50ZXJ2ZW50aW9uLm1lc3VyZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB2aXNpdFR5cGU6IHZpc2l0VHlwZSxcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGFza1xuICAgICAgICAgICk7XG5cbiAgICAgICAgICBsZXQgcmVhbE5vZGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0UmVhbE5vZGUobm9kZUlkKTtcblxuICAgICAgICAgIGxzdC5wdXNoKHJlYWxOb2RlKTtcblxuICAgICAgICAgIHJldHVybiByZWFsTm9kZS5pbmZvO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgLy8gZGVsZXRlVmlzaXQodmlzaXRJZCwgcmVtb3ZlUmVsYXRlZEV2ZW50KSB7XG4gIC8vICAgcmV0dXJuIHRoaXMucmVtb3ZlVmlzaXRFdmVudHModmlzaXRJZCwgcmVtb3ZlUmVsYXRlZEV2ZW50KS50aGVuKChcbiAgLy8gICAgIGluZm8pID0+IHtcblxuICAvLyAgICAgaWYgKGluZm8pIHtcbiAgLy8gICAgICAgbGV0IGdyb3VwSWQgPSBpbmZvLmdyb3VwSWQuZ2V0KCk7XG4gIC8vICAgICAgIGxldCB2aXNpdENvbnRleHRUeXBlID0gaW5mby52aXNpdFR5cGUuZ2V0KCk7XG5cbiAgLy8gICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JvdXBWaXNpdHMoZ3JvdXBJZCwgdmlzaXRDb250ZXh0VHlwZSkudGhlbihcbiAgLy8gICAgICAgICByZXMgPT4ge1xuICAvLyAgICAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHJlcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgLy8gICAgICAgICAgICAgY29uc3QgcmVzVmlzaXRJZCA9IHJlc1tpbmRleF0uaW5mby5pZC5nZXQoKTtcbiAgLy8gICAgICAgICAgICAgaWYgKHJlc1Zpc2l0SWQgPT0gdmlzaXRJZCkge1xuICAvLyAgICAgICAgICAgICAgIHJlcy5yZW1vdmUocmVzW2luZGV4XSk7XG4gIC8vICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gIC8vICAgICAgICAgICAgIH1cbiAgLy8gICAgICAgICAgIH1cbiAgLy8gICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgLy8gICAgICAgICB9KVxuICAvLyAgICAgfSBlbHNlIHtcbiAgLy8gICAgICAgcmV0dXJuIGZhbHNlO1xuICAvLyAgICAgfVxuXG4gIC8vICAgfSlcbiAgLy8gfVxuXG4gIGRlbGV0ZVZpc2l0KHZpc2l0SWQsIHJlbW92ZVZpc2l0LCByZW1vdmVSZWxhdGVkRXZlbnQsIGJlZ2luRGF0ZSwgZW5kRGF0ZSxcbiAgICByZWZlcmVuY2UpIHtcblxuICAgIGlmIChyZW1vdmVSZWxhdGVkRXZlbnQpIHtcbiAgICAgIHRoaXMucmVtb3ZlVmlzaXRFdmVudHModmlzaXRJZCwgYmVnaW5EYXRlLCBlbmREYXRlLCByZWZlcmVuY2UpLnRoZW4oXG4gICAgICAgIGVsID0+IHtcbiAgICAgICAgICBpZiAocmVtb3ZlVmlzaXQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlbW92ZVZpc2l0KHZpc2l0SWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgIH0pXG4gICAgfSBlbHNlIGlmIChyZW1vdmVWaXNpdCkge1xuICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlVmlzaXQodmlzaXRJZCk7XG4gICAgfVxuXG4gIH1cblxuICByZW1vdmVWaXNpdEV2ZW50cyh2aXNpdElkLCBiZWdpbkRhdGUsIGVuZERhdGUsIHJlZmVyZW5jZSkge1xuICAgIC8vIGlmIChyZW1vdmVSZWxhdGVkRXZlbnQpIHtcbiAgICAvLyAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4odmlzaXRJZCwgW3RoaXNcbiAgICAvLyAgICAgLlZJU0lUX1RPX0VWRU5UX1JFTEFUSU9OXG4gICAgLy8gICBdKS50aGVuKChjaGlsZHJlbikgPT4ge1xuICAgIC8vICAgICBsZXQgY2hpbGRyZW5Qcm9taXNlID0gY2hpbGRyZW4ubWFwKGVsID0+IHtcbiAgICAvLyAgICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLnJlbW92ZUZyb21HcmFwaChlbC5pZC5nZXQoKSk7XG4gICAgLy8gICAgIH0pXG5cbiAgICAvLyAgICAgcmV0dXJuIFByb21pc2UuYWxsKGNoaWxkcmVuUHJvbWlzZSkudGhlbigoKSA9PiB7XG4gICAgLy8gICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKHZpc2l0SWQpO1xuICAgIC8vICAgICB9KTtcblxuICAgIC8vICAgfSlcbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyh2aXNpdElkKSk7XG4gICAgLy8gfVxuXG4gICAgbGV0IGNvbmRpdGlvblZhbGlkID0gKGVsZW1lbnQpID0+IHtcbiAgICAgIGlmICghcmVmZXJlbmNlIHx8IHJlZmVyZW5jZS50cmltKCkubGVuZ3RoID09PSAwKSByZXR1cm4gdHJ1ZTtcblxuICAgICAgcmV0dXJuIGVsZW1lbnQucmVmZXJlbmNlID09PSByZWZlcmVuY2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZ2V0RXZlbnRzQmV0d2VlblR3b0RhdGUodmlzaXRJZCwgYmVnaW5EYXRlLCBlbmREYXRlKS50aGVuKFxuICAgICAgZXZlbnRzID0+IHtcblxuICAgICAgICBldmVudHMuZm9yRWFjaChlbCA9PiB7XG4gICAgICAgICAgaWYgKGNvbmRpdGlvblZhbGlkKGVsKSkge1xuICAgICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLnJlbW92ZUZyb21HcmFwaChlbC5pZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgfSlcblxuICB9XG5cbiAgZ2V0VmlzaXRFdmVudHModmlzaXRJZCkge1xuICAgIHJldHVybiB0aGlzLmdldEV2ZW50c0JldHdlZW5Ud29EYXRlKHZpc2l0SWQpO1xuICB9XG5cblxuICBnZXRFdmVudHNCZXR3ZWVuVHdvRGF0ZSh2aXNpdElkLCBiZWdpbkRhdGUsIGVuZERhdGUpIHtcblxuICAgIGlmICh0eXBlb2YgYmVnaW5EYXRlID09PSBcInVuZGVmaW5lZFwiKVxuICAgICAgYmVnaW5EYXRlID0gMDtcblxuICAgIGlmICh0eXBlb2YgZW5kRGF0ZSA9PSBcInVuZGVmaW5lZFwiKVxuICAgICAgZW5kRGF0ZSA9IERhdGUubm93KCkgKiAzMTUzNjAwMDAwMCAqIDEwMDtcblxuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4odmlzaXRJZCwgW3RoaXNcbiAgICAgIC5WSVNJVF9UT19FVkVOVF9SRUxBVElPTlxuICAgIF0pLnRoZW4oKGNoaWxkcmVuKSA9PiB7XG5cbiAgICAgIGNoaWxkcmVuID0gY2hpbGRyZW4ubWFwKGVsID0+IGVsLmdldCgpKTtcblxuICAgICAgcmV0dXJuIGNoaWxkcmVuLmZpbHRlcihlbCA9PiB7XG4gICAgICAgIHJldHVybiBlbC5kYXRlID49IGJlZ2luRGF0ZSAmJiBlbC5kYXRlIDw9IGVuZERhdGU7XG4gICAgICB9KVxuXG4gICAgfSlcblxuICB9XG5cbiAgcmVtb3ZlVmlzaXQodmlzaXRJZCkge1xuICAgIGxldCBpbmZvID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8odmlzaXRJZCk7XG4gICAgaWYgKGluZm8pIHtcbiAgICAgIGxldCBncm91cElkID0gaW5mby5ncm91cElkLmdldCgpO1xuICAgICAgbGV0IHZpc2l0Q29udGV4dFR5cGUgPSBpbmZvLnZpc2l0VHlwZS5nZXQoKTtcblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JvdXBWaXNpdHMoZ3JvdXBJZCwgdmlzaXRDb250ZXh0VHlwZSkudGhlbihcbiAgICAgICAgcmVzID0+IHtcbiAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcmVzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgY29uc3QgcmVzVmlzaXRJZCA9IHJlc1tpbmRleF0uaW5mby5pZC5nZXQoKTtcbiAgICAgICAgICAgIGlmIChyZXNWaXNpdElkID09IHZpc2l0SWQpIHtcbiAgICAgICAgICAgICAgcmVzLnJlbW92ZShyZXNbaW5kZXhdKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgZWRpdFZpc2l0KHZpc2l0SWQsIG5ld1ZhbHVlc09iaikge1xuICAgIGlmICh0eXBlb2YgbmV3VmFsdWVzT2JqICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IHZpc2l0Tm9kZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRSZWFsTm9kZSh2aXNpdElkKTtcblxuICAgIGlmICh0eXBlb2YgdmlzaXROb2RlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBmb3IgKGNvbnN0IGtleSBpbiBuZXdWYWx1ZXNPYmopIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBuZXdWYWx1ZXNPYmpba2V5XTtcblxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmIHR5cGVvZiB2aXNpdE5vZGUuaW5mb1trZXldICE9PVxuICAgICAgICAgIFwidW5kZWZpbmVkXCIpIHtcblxuICAgICAgICAgIHZpc2l0Tm9kZS5pbmZvW2tleV0uc2V0KHZhbHVlKTtcblxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgdmlzaXROb2RlLmluZm9ba2V5XSAhPT1cbiAgICAgICAgICBcInVuZGVmaW5lZFwiKSB7XG5cbiAgICAgICAgICBmb3IgKGNvbnN0IGtleTIgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlMiA9IHZhbHVlW2tleTJdO1xuXG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmlzaXROb2RlLmluZm9ba2V5XVtrZXkyXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuXG4gICAgICAgICAgICAgIGlmIChrZXkgPT09IFwiaW50ZXJ2ZW50aW9uXCIgJiYga2V5MiA9PT0gXCJtZXN1cmVcIikge1xuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZTIgIT09IFwidW5kZWZpbmVkXCIpIHtcblxuICAgICAgICAgICAgICAgICAgdmlzaXROb2RlLmluZm9ba2V5XVtrZXkyXS5zZXQobmV3IENob2ljZShcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUyLCBbXG4gICAgICAgICAgICAgICAgICAgICAgXCJtaW51dGUocylcIiwgXCJkYXkocylcIixcbiAgICAgICAgICAgICAgICAgICAgICBcIndlZWsocylcIiwgXCJtb250aChzKVwiLFxuICAgICAgICAgICAgICAgICAgICAgIFwieWVhcihzKVwiXG4gICAgICAgICAgICAgICAgICAgIF0pKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgdmlzaXROb2RlLmluZm9ba2V5XVtrZXkyXS5zZXQoTmFOKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChrZXkgPT09IFwicGVyaW9kaWNpdHlcIiAmJiBrZXkyID09PSBcIm1lc3VyZVwiKSB7XG5cbiAgICAgICAgICAgICAgICB2aXNpdE5vZGUuaW5mb1trZXldW2tleTJdLnNldChuZXcgQ2hvaWNlKHZhbHVlMiwgW1xuICAgICAgICAgICAgICAgICAgXCJkYXkocylcIiwgXCJ3ZWVrKHMpXCIsXG4gICAgICAgICAgICAgICAgICBcIm1vbnRoKHMpXCIsXG4gICAgICAgICAgICAgICAgICBcInllYXIocylcIlxuICAgICAgICAgICAgICAgIF0pKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0eXBlb2YgdmFsdWUyICE9PSBcInVuZGVmaW5lZFwiID8gdmlzaXROb2RlLmluZm9ba2V5XVtrZXkyXS5zZXQoXG4gICAgICAgICAgICAgICAgICB2YWx1ZTIpIDogdmlzaXROb2RlLmluZm9ba2V5XVtrZXkyXS5zZXQoTmFOKTtcbiAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgfVxuXG4gIGdldFB0clZhbHVlKG5vZGUsIHB0ck5hbWUpIHtcbiAgICBsZXQgcmVhbE5vZGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0UmVhbE5vZGUobm9kZS5pZC5nZXQoKSk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICBpZiAoIXJlYWxOb2RlLmluZm9bcHRyTmFtZV0pIHtcbiAgICAgICAgcmVhbE5vZGUuaW5mby5hZGRfYXR0cihwdHJOYW1lLCB7XG4gICAgICAgICAgdGFza3M6IG5ldyBQdHIobmV3IExzdCgpKVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmVhbE5vZGUuaW5mb1twdHJOYW1lXS50YXNrcy5sb2FkKHZhbHVlID0+IHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUodmFsdWUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBnZXRHcm91cFZpc2l0cyhncm91cElkLCB2aXNpdHlUeXBlKSB7XG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihncm91cElkLCBbdGhpcy5HUk9VUF9UT19UQVNLXSkudGhlbihcbiAgICAgIHJlcyA9PiB7XG4gICAgICAgIGxldCBub2RlSWQ7XG4gICAgICAgIGlmIChyZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgbm9kZUlkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmNyZWF0ZU5vZGUoe1xuICAgICAgICAgICAgbmFtZTogXCJtYWludGVuYW5jZVwiXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGQoXG4gICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgbm9kZUlkLFxuICAgICAgICAgICAgdGhpcy5HUk9VUF9UT19UQVNLLFxuICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbm9kZSA9XG4gICAgICAgICAgdHlwZW9mIG5vZGVJZCAhPT0gXCJ1bmRlZmluZWRcIiA/XG4gICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8obm9kZUlkKSA6XG4gICAgICAgICAgcmVzWzBdO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldFB0clZhbHVlKG5vZGUsIHZpc2l0eVR5cGUpO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBnZW5lcmF0ZUV2ZW50KHZpc2l0VHlwZSwgZ3JvdXBJZCwgYmVnaW5EYXRlLCBlbmREYXRlLCBldmVudHNEYXRhLFxuICAgIHJlZmVyZW5jZU5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVWaXNpdENvbnRleHQodmlzaXRUeXBlKVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5saW5rR3JvdXBUb1Zpc3RDb250ZXh0KGVsLmlkLmdldCgpLCBncm91cElkKS50aGVuKFxuICAgICAgICAgIHJlcyA9PiB7XG4gICAgICAgICAgICBpZiAocmVzKSB7XG4gICAgICAgICAgICAgIHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoXG4gICAgICAgICAgICAgICAgZWwuaWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFUy5kZWNsYXJlZC50eXBlXG4gICAgICAgICAgICAgICkudGhlbihzdGF0ZU5vZGUgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBpZCA9IHN0YXRlTm9kZS5pZC5nZXQoKTtcblxuICAgICAgICAgICAgICAgIGV2ZW50c0RhdGEuZm9yRWFjaChldmVudEluZm8gPT4ge1xuICAgICAgICAgICAgICAgICAgbGV0IGV2ZW50c0RhdGUgPSB0aGlzLl9nZXREYXRlKFxuICAgICAgICAgICAgICAgICAgICBiZWdpbkRhdGUsXG4gICAgICAgICAgICAgICAgICAgIGVuZERhdGUsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50SW5mby5wZXJpb2ROdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50SW5mby5wZXJpb2RNZXN1cmVcbiAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgIGV2ZW50c0RhdGUuZm9yRWFjaChkYXRlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudChcbiAgICAgICAgICAgICAgICAgICAgICBlbC5pZC5nZXQoKSxcbiAgICAgICAgICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgICAgICAgICAgIGV2ZW50SW5mbyxcbiAgICAgICAgICAgICAgICAgICAgICBgJHtldmVudEluZm8ubmFtZX1gLFxuICAgICAgICAgICAgICAgICAgICAgIG5ldyBEYXRlKGRhdGUpLmdldFRpbWUoKSxcbiAgICAgICAgICAgICAgICAgICAgICBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jZU5hbWVcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShlcnIpO1xuICAgICAgfSk7XG4gIH1cblxuICBhZGRFdmVudCh2aXNpdFR5cGVDb250ZXh0SWQsIGdyb3VwSWQsIHN0YXRlSWQsIHZpc2l0SW5mbywgbmFtZSwgZGF0ZSxcbiAgICBjcmVhdGlvbkRhdGUsIHJlZmVyZW5jZU5hbWUpIHtcbiAgICBsZXQgc3RhdGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhzdGF0ZUlkKS5zdGF0ZS5nZXQoKTtcblxuICAgIGxldCBldmVudCA9IG5ldyBFdmVudE1vZGVsKG5hbWUsIGRhdGUsIHN0YXRlLCBncm91cElkLCBjcmVhdGlvbkRhdGUsXG4gICAgICByZWZlcmVuY2VOYW1lKTtcblxuICAgIGxldCBldmVudE5vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgZGF0ZTogZGF0ZSxcbiAgICAgICAgY3JlYXRpb246IGNyZWF0aW9uRGF0ZSxcbiAgICAgICAgcmVmZXJlbmNlOiByZWZlcmVuY2VOYW1lLFxuICAgICAgICBzdGF0ZUlkOiBzdGF0ZUlkLFxuICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgIGdyb3VwSWQ6IGdyb3VwSWQsXG4gICAgICAgIHZpc2l0SWQ6IHZpc2l0SW5mby5pZFxuICAgICAgfSxcbiAgICAgIGV2ZW50XG4gICAgKTtcblxuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGRJbkNvbnRleHQoXG4gICAgICAgIHN0YXRlSWQsXG4gICAgICAgIGV2ZW50Tm9kZUlkLFxuICAgICAgICB2aXNpdFR5cGVDb250ZXh0SWQsXG4gICAgICAgIHRoaXMuRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04sXG4gICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgIClcbiAgICAgIC50aGVuKGVsID0+IHtcbiAgICAgICAgaWYgKGVsKSByZXR1cm4gZXZlbnROb2RlSWQ7XG4gICAgICB9KVxuICAgICAgLnRoZW4oZXZlbnRJZCA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnRJZCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oZ3JvdXBJZCwgW1xuICAgICAgICAgICAgZ3JvdXBTZXJ2aWNlLmNvbnN0YW50cy5HUk9VUF9UT19FUVVJUE1FTlRTX1JFTEFUSU9OXG4gICAgICAgICAgXSkudGhlbihjaGlsZHJlbiA9PiB7XG4gICAgICAgICAgICBjaGlsZHJlbi5tYXAoY2hpbGQgPT4ge1xuICAgICAgICAgICAgICBsZXQgbmFtZSA9IGAke2NoaWxkLm5hbWUuZ2V0KCl9YDtcbiAgICAgICAgICAgICAgbGV0IHRhc2sgPSBuZXcgVGFza01vZGVsKFxuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgY2hpbGQuZGJpZC5nZXQoKSxcbiAgICAgICAgICAgICAgICBjaGlsZC5iaW1GaWxlSWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgdmlzaXRJbmZvLm5hbWUsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIGxldCB0YXNrSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgICAgICAgdHlwZTogXCJ0YXNrXCIsXG4gICAgICAgICAgICAgICAgICBkYklkOiBjaGlsZC5kYmlkLmdldCgpLFxuICAgICAgICAgICAgICAgICAgYmltRmlsZUlkOiBjaGlsZC5iaW1GaWxlSWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgICB2aXNpdElkOiB2aXNpdEluZm8uaWQsXG4gICAgICAgICAgICAgICAgICBldmVudElkOiBldmVudElkLFxuICAgICAgICAgICAgICAgICAgZ3JvdXBJZDogZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICAgIGRvbmU6IGZhbHNlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0YXNrXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGRJbkNvbnRleHQoXG4gICAgICAgICAgICAgICAgICBldmVudElkLFxuICAgICAgICAgICAgICAgICAgdGFza0lkLFxuICAgICAgICAgICAgICAgICAgdmlzaXRUeXBlQ29udGV4dElkLFxuICAgICAgICAgICAgICAgICAgdGhpcy5FVkVOVF9UT19UQVNLX1JFTEFUSU9OLFxuICAgICAgICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkKFxuICAgICAgICAgICAgICAgICAgdmlzaXRJbmZvLmlkLFxuICAgICAgICAgICAgICAgICAgZXZlbnRJZCxcbiAgICAgICAgICAgICAgICAgIHRoaXMuVklTSVRfVE9fRVZFTlRfUkVMQVRJT04sXG4gICAgICAgICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIGNyZWF0ZVZpc2l0Q29udGV4dCh2aXNpdFR5cGUpIHtcbiAgICBsZXQgdmlzaXQgPSB0aGlzLlZJU0lUUy5maW5kKGVsID0+IHtcbiAgICAgIHJldHVybiBlbC50eXBlID09PSB2aXNpdFR5cGU7XG4gICAgfSk7XG5cbiAgICBpZiAodHlwZW9mIHZpc2l0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBjb25zdCBjb250ZXh0TmFtZSA9IGAke3Zpc2l0Lm5hbWV9YDtcblxuICAgICAgbGV0IGNvbnRleHQgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q29udGV4dChjb250ZXh0TmFtZSk7XG4gICAgICBpZiAodHlwZW9mIGNvbnRleHQgIT09IFwidW5kZWZpbmVkXCIpIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29udGV4dFxuICAgICAgICAuaW5mbyk7XG5cbiAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ29udGV4dChcbiAgICAgICAgY29udGV4dE5hbWUsXG4gICAgICAgIHZpc2l0VHlwZSxcbiAgICAgICAgbmV3IE1vZGVsKHtcbiAgICAgICAgICBuYW1lOiB0aGlzLlZJU0lUX0NPTlRFWFRfTkFNRVxuICAgICAgICB9KVxuICAgICAgKS50aGVuKGNvbnRleHRDcmVhdGVkID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbnRleHRDcmVhdGVkLmluZm87XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFwidmlzaXROb3RGb3VuZFwiKTtcbiAgICB9XG4gIH1cblxuICBsaW5rR3JvdXBUb1Zpc3RDb250ZXh0KHZpc2l0Q29udGV4dElkLCBncm91cElkKSB7XG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbih2aXNpdENvbnRleHRJZCwgW1xuICAgICAgICB0aGlzLlZJU0lUX1RZUEVfVE9fR1JPVVBfUkVMQVRJT05cbiAgICAgIF0pXG4gICAgICAudGhlbihjaGlsZHJlbiA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldLmlkLmdldCgpO1xuICAgICAgICAgIGlmIChjaGlsZCA9PT0gZ3JvdXBJZCkgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAudGhlbihlbCA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgZWwgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkSW5Db250ZXh0KFxuICAgICAgICAgICAgdmlzaXRDb250ZXh0SWQsXG4gICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgdmlzaXRDb250ZXh0SWQsXG4gICAgICAgICAgICB0aGlzLlZJU0lUX1RZUEVfVE9fR1JPVVBfUkVMQVRJT04sXG4gICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgKS50aGVuKGFzeW5jIHJlcyA9PiB7XG4gICAgICAgICAgICBpZiAocmVzKSB7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoXG4gICAgICAgICAgICAgICAgdmlzaXRDb250ZXh0SWQsXG4gICAgICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFUy5wcm9jZXNzaW5nLnR5cGVcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5nZXRFdmVudFN0YXRlTm9kZShcbiAgICAgICAgICAgICAgICB2aXNpdENvbnRleHRJZCxcbiAgICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICAgIHRoaXMuRVZFTlRfU1RBVEVTLmRvbmUudHlwZVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBlbDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBnZXRFdmVudFN0YXRlTm9kZSh2aXNpdENvbnRleHRJZCwgZ3JvdXBJZCwgZXZlbnRTYXRlKSB7XG4gICAgbGV0IGV2ZW50ID0gdGhpcy5fZXZlbnRTYXRlSXNWYWxpZChldmVudFNhdGUpO1xuXG4gICAgaWYgKHR5cGVvZiBldmVudCA9PT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuO1xuXG4gICAgbGV0IGNvbnRleHRUeXBlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8odmlzaXRDb250ZXh0SWQpLnR5cGUuZ2V0KCk7XG4gICAgbGV0IHJlbGF0aW9uTmFtZTtcblxuICAgIHN3aXRjaCAoY29udGV4dFR5cGUpIHtcbiAgICAgIGNhc2UgdGhpcy5NQUlOVEVOQU5DRV9WSVNJVDpcbiAgICAgICAgcmVsYXRpb25OYW1lID0gdGhpcy5NQUlOVEVOQU5DRV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIHRoaXMuU0VDVVJJVFlfVklTSVQ6XG4gICAgICAgIHJlbGF0aW9uTmFtZSA9IHRoaXMuU0VDVVJJVFlfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT047XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLkRJQUdOT1NUSUNfVklTSVQ6XG4gICAgICAgIHJlbGF0aW9uTmFtZSA9IHRoaXMuRElBR05PU1RJQ19WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIHRoaXMuUkVHVUxBVE9SWV9WSVNJVDpcbiAgICAgICAgcmVsYXRpb25OYW1lID0gdGhpcy5SRUdVTEFUT1JZX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKGdyb3VwSWQsIFtyZWxhdGlvbk5hbWVdKVxuICAgICAgLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgbmFtZSA9IGNoaWxkcmVuW2ldLm5hbWUuZ2V0KCk7XG4gICAgICAgICAgY29uc3QgdHlwZSA9IGNoaWxkcmVuW2ldLnN0YXRlLmdldCgpO1xuXG4gICAgICAgICAgaWYgKG5hbWUgPT09IGV2ZW50U2F0ZSB8fCB0eXBlID09PSBldmVudFNhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiBjaGlsZHJlbltpXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAudGhlbihlbCA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgZWwgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICBsZXQgYXJnTm9kZUlkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmNyZWF0ZU5vZGUoe1xuICAgICAgICAgICAgbmFtZTogZXZlbnQubmFtZSxcbiAgICAgICAgICAgIHN0YXRlOiBldmVudC50eXBlLFxuICAgICAgICAgICAgZ3JvdXBJZDogZ3JvdXBJZCxcbiAgICAgICAgICAgIHR5cGU6IFwiRXZlbnRTdGF0ZVwiXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkSW5Db250ZXh0KFxuICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgIGFyZ05vZGVJZCxcbiAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgcmVsYXRpb25OYW1lLFxuICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICkudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcykgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKGFyZ05vZGVJZCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIHZhbGlkYXRlVGFzayhjb250ZXh0SWQsIGdyb3VwSWQsIGV2ZW50SWQsIHRhc2tJZCkge1xuICAgIGxldCB0YXNrTm9kZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRSZWFsTm9kZSh0YXNrSWQpO1xuICAgIHRhc2tOb2RlLmluZm8uZG9uZS5zZXQoIXRhc2tOb2RlLmluZm8uZG9uZS5nZXQoKSk7XG5cbiAgICBsZXQgY3VycmVudFN0YXRlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhldmVudElkKS5zdGF0ZUlkLmdldCgpO1xuXG4gICAgcmV0dXJuIHRoaXMuX2dldFN0YXRlKGNvbnRleHRJZCwgZ3JvdXBJZCwgZXZlbnRJZCkudGhlbihuZXh0U3RhdGUgPT4ge1xuXG4gICAgICBsZXQgbmV4dFN0YXRlSWQgPSBuZXh0U3RhdGUuaWQuZ2V0KCk7XG5cbiAgICAgIGlmIChuZXh0U3RhdGVJZCA9PT0gY3VycmVudFN0YXRlSWQpIHJldHVybiB0cnVlO1xuXG4gICAgICByZXR1cm4gdGhpcy5fc3dpdGNoRXZlbnRTdGF0ZShldmVudElkLCBjdXJyZW50U3RhdGVJZCwgbmV4dFN0YXRlSWQsXG4gICAgICAgIGNvbnRleHRJZCk7XG5cbiAgICB9KTtcblxuICB9XG5cblxuXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICBQUklWQVRFUyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgX2dldERhdGUoYmVnaW5EYXRlLCBlbmREYXRlLCBwZXJpb2ROdW1iZXIsIHBlcmlvZE1lc3VyZSkge1xuICAgIGxldCBtZXN1cmUgPSBbXCJkYXlzXCIsIFwid2Vla3NcIiwgXCJtb250aHNcIiwgXCJ5ZWFyc1wiXVtwZXJpb2RNZXN1cmVdO1xuXG4gICAgbGV0IGV2ZW50c0RhdGUgPSBbXTtcblxuICAgIGxldCBkYXRlID0gbW9tZW50KGJlZ2luRGF0ZSk7XG4gICAgbGV0IGVuZCA9IG1vbWVudChlbmREYXRlKTtcblxuICAgIHdoaWxlIChlbmQuZGlmZihkYXRlKSA+PSAwKSB7XG4gICAgICBldmVudHNEYXRlLnB1c2goZGF0ZS50b0RhdGUoKSk7XG5cbiAgICAgIGRhdGUgPSBkYXRlLmFkZChwZXJpb2ROdW1iZXIsIG1lc3VyZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGV2ZW50c0RhdGU7XG4gIH1cblxuICBfZm9ybWF0RGF0ZShhcmdEYXRlKSB7XG4gICAgbGV0IGRhdGUgPSBuZXcgRGF0ZShhcmdEYXRlKTtcblxuICAgIHJldHVybiBgJHsoKCkgPT4ge1xuICAgICAgbGV0IGQgPSBkYXRlLmdldERhdGUoKTtcbiAgICAgIHJldHVybiBkLnRvU3RyaW5nKCkubGVuZ3RoID4gMSA/IGQgOiAnMCcgKyBkO1xuICAgIH0pKCl9LyR7KCgpID0+IHtcblxuICAgICAgbGV0IGQgPSBkYXRlLmdldE1vbnRoKCkgKyAxO1xuICAgICAgcmV0dXJuIGQudG9TdHJpbmcoKS5sZW5ndGggPiAxID8gZCA6ICcwJyArIGQ7XG5cbiAgICB9KSgpfS8ke2RhdGUuZ2V0RnVsbFllYXIoKX1gO1xuICB9XG5cbiAgX2V2ZW50U2F0ZUlzVmFsaWQoZXZlbnRTdGF0ZSkge1xuICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuRVZFTlRfU1RBVEVTKSB7XG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMuRVZFTlRfU1RBVEVTW2tleV0ubmFtZSA9PT0gZXZlbnRTdGF0ZSB8fFxuICAgICAgICB0aGlzLkVWRU5UX1NUQVRFU1trZXldLnR5cGUgPT09IGV2ZW50U3RhdGVcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5FVkVOVF9TVEFURVNba2V5XTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgX2dldFN0YXRlKGNvbnRleHRJZCwgZ3JvdXBJZCwgZXZlbnRJZCkge1xuXG4gICAgcmV0dXJuIHRoaXMuZ2V0RXZlbnRUYXNrcyhldmVudElkKS50aGVuKHRhc2tzID0+IHtcbiAgICAgIGxldCB0YXNrc1ZhbGlkYXRlZCA9IHRhc2tzLmZpbHRlcihlbCA9PiBlbC5kb25lKTtcbiAgICAgIGxldCBzdGF0ZU9iajtcblxuICAgICAgaWYgKHRhc2tzVmFsaWRhdGVkLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBzdGF0ZU9iaiA9IHRoaXMuRVZFTlRfU1RBVEVTLmRlY2xhcmVkO1xuICAgICAgfSBlbHNlIGlmICh0YXNrc1ZhbGlkYXRlZC5sZW5ndGggPT09IHRhc2tzLmxlbmd0aCkge1xuICAgICAgICBzdGF0ZU9iaiA9IHRoaXMuRVZFTlRfU1RBVEVTLmRvbmU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZU9iaiA9IHRoaXMuRVZFTlRfU1RBVEVTLnByb2Nlc3Npbmc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmdldEV2ZW50U3RhdGVOb2RlKGNvbnRleHRJZCwgZ3JvdXBJZCwgc3RhdGVPYmoudHlwZSk7XG5cbiAgICB9KVxuXG4gIH1cblxuICBfc3dpdGNoRXZlbnRTdGF0ZShldmVudElkLCBmcm9tU3RhdGVJZCwgdG9TdGF0ZUlkLCBjb250ZXh0SWQpIHtcblxuXG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5yZW1vdmVDaGlsZChmcm9tU3RhdGVJZCwgZXZlbnRJZCwgdGhpc1xuICAgICAgICAuRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04sIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEUpXG4gICAgICAudGhlbihyZW1vdmVkID0+IHtcbiAgICAgICAgaWYgKHJlbW92ZWQpIHtcbiAgICAgICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkSW5Db250ZXh0KHRvU3RhdGVJZCwgZXZlbnRJZCxcbiAgICAgICAgICAgICAgY29udGV4dElkLFxuICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OLFxuICAgICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFKVxuICAgICAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICBsZXQgRXZlbnROb2RlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldFJlYWxOb2RlKGV2ZW50SWQpO1xuICAgICAgICAgICAgICAgIGxldCBuZXdTdGF0ZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKHRvU3RhdGVJZCkuc3RhdGVcbiAgICAgICAgICAgICAgICAgIC5nZXQoKTtcblxuXG4gICAgICAgICAgICAgICAgRXZlbnROb2RlLmluZm8uc3RhdGUuc2V0KG5ld1N0YXRlKTtcbiAgICAgICAgICAgICAgICBFdmVudE5vZGUuaW5mby5zdGF0ZUlkLnNldCh0b1N0YXRlSWQpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0pXG5cblxuICB9XG5cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gIC8vICAgICAgICAgICAgICAgICAgICAgICAgR0VUIElORk9STUFUSU9OICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICBnZXRWaXNpdEdyb3Vwcyh2aXNpdFR5cGUpIHtcbiAgICBsZXQgY29udGV4dHMgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q29udGV4dFdpdGhUeXBlKHZpc2l0VHlwZSk7XG4gICAgaWYgKGNvbnRleHRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFtdO1xuXG4gICAgbGV0IGNvbnRleHRJZCA9IGNvbnRleHRzWzBdLmluZm8uaWQuZ2V0KCk7XG5cbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKFxuICAgICAgY29udGV4dElkLFxuICAgICAgdGhpcy5WSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OXG4gICAgKS50aGVuKHJlcyA9PiB7XG4gICAgICByZXR1cm4gcmVzLm1hcChlbCA9PiBlbC5nZXQoKSk7XG4gICAgfSk7XG4gIH1cblxuXG4gIGdldEdyb3VwRXZlbnRTdGF0ZXMoY29udGV4dElkLCBncm91cElkKSB7XG4gICAgbGV0IHByb21pc2VzID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLkVWRU5UX1NUQVRFUykge1xuICAgICAgcHJvbWlzZXMucHVzaChcbiAgICAgICAgdGhpcy5nZXRFdmVudFN0YXRlTm9kZShcbiAgICAgICAgICBjb250ZXh0SWQsXG4gICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFU1trZXldLnR5cGVcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICB9XG5cbiAgZ2V0R3JvdXBFdmVudHMoXG4gICAgZ3JvdXBJZCxcbiAgICBWSVNJVF9UWVBFUyA9IFtcbiAgICAgIHRoaXMuTUFJTlRFTkFOQ0VfVklTSVQsXG4gICAgICB0aGlzLlJFR1VMQVRPUllfVklTSVQsXG4gICAgICB0aGlzLlNFQ1VSSVRZX1ZJU0lULFxuICAgICAgdGhpcy5ESUFHTk9TVElDX1ZJU0lUXG4gICAgXVxuICApIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoVklTSVRfVFlQRVMpKSBWSVNJVF9UWVBFUyA9IFtWSVNJVF9UWVBFU107XG5cbiAgICByZXR1cm4gVklTSVRfVFlQRVMubWFwKHZpc2l0VHlwZSA9PiB7XG4gICAgICBsZXQgdmlzaXQgPSB0aGlzLlZJU0lUUy5maW5kKGVsID0+IHtcbiAgICAgICAgcmV0dXJuIGVsLnR5cGUgPT09IHZpc2l0VHlwZTtcbiAgICAgIH0pO1xuXG4gICAgICBsZXQgY29udGV4dCA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRDb250ZXh0KHZpc2l0Lm5hbWUpO1xuXG4gICAgICBpZiAodHlwZW9mIGNvbnRleHQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgbGV0IGNvbnRleHRJZCA9IGNvbnRleHQuaW5mby5pZC5nZXQoKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcm91cEV2ZW50U3RhdGVzKGNvbnRleHRJZCwgZ3JvdXBJZCkudGhlbihcbiAgICAgICAgICB2YWx1ZXMgPT4ge1xuICAgICAgICAgICAgbGV0IHByb20gPSB2YWx1ZXMubWFwKGFzeW5jIGV2ZW50VHlwZSA9PiB7XG4gICAgICAgICAgICAgIGxldCByZXMgPSBldmVudFR5cGUuZ2V0KCk7XG5cbiAgICAgICAgICAgICAgcmVzW1widmlzaXRfdHlwZVwiXSA9IHZpc2l0VHlwZTtcblxuICAgICAgICAgICAgICBsZXQgZXZlbnRzID0gYXdhaXQgU3BpbmFsR3JhcGhTZXJ2aWNlXG4gICAgICAgICAgICAgICAgLmdldENoaWxkcmVuKFxuICAgICAgICAgICAgICAgICAgcmVzLmlkLCBbXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT05cbiAgICAgICAgICAgICAgICAgIF0pO1xuXG4gICAgICAgICAgICAgIHJlc1tcImV2ZW50c1wiXSA9IGV2ZW50cy5tYXAoZWwgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbC5nZXQoKTtcbiAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbSkudGhlbihhbGxFdmVudHMgPT4ge1xuICAgICAgICAgICAgICBsZXQgdmFsdWVzID0ge307XG5cbiAgICAgICAgICAgICAgYWxsRXZlbnRzLmZvckVhY2godmFsID0+IHtcbiAgICAgICAgICAgICAgICB2YWx1ZXNbdmFsLnN0YXRlXSA9IHZhbC5ldmVudHM7XG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgW3Zpc2l0VHlwZV06IHZhbHVlc1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBnZXRFdmVudFRhc2tzKGV2ZW50SWQpIHtcbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKGV2ZW50SWQsIFt0aGlzXG4gICAgICAgIC5FVkVOVF9UT19UQVNLX1JFTEFUSU9OXG4gICAgICBdKVxuICAgICAgLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgICAgICByZXR1cm4gY2hpbGRyZW4ubWFwKGVsID0+IGVsLmdldCgpKVxuICAgICAgfSlcbiAgfVxuXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyAgICAgICAgICAgICAgICAgICAgICAgIENvbW1lbnQgTWFuYWdlciAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgYWRkQ29tbWVudCh0YXNrSWQsIHVzZXJJZCwgbWVzc2FnZSkge1xuICAgIGlmIChtZXNzYWdlICYmIG1lc3NhZ2UudHJpbSgpLmxlbmd0aCA+IDAgJiYgdXNlcklkKSB7XG4gICAgICBsZXQgY29tbWVudE5vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgdXNlcklkOiB1c2VySWQsXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHRhc2tJZDogdGFza0lkLFxuICAgICAgICBkYXRlOiBEYXRlLm5vdygpXG4gICAgICB9KTtcblxuICAgICAgaWYgKGNvbW1lbnROb2RlSWQpIHtcbiAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZCh0YXNrSWQsIGNvbW1lbnROb2RlSWQsIHRoaXNcbiAgICAgICAgICAuVEFTS19UT19DT01NRU5UU19SRUxBVElPTixcbiAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFKTtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIGdldFRhc2tzQ29tbWVudHModGFza0lkKSB7XG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbih0YXNrSWQsIFt0aGlzXG4gICAgICAuVEFTS19UT19DT01NRU5UU19SRUxBVElPTlxuICAgIF0pLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgICAgcmV0dXJuIGNoaWxkcmVuLm1hcChlbCA9PiBlbC5nZXQoKSk7XG4gICAgfSlcbiAgfVxuXG59XG5cbmxldCBzcGluYWxWaXNpdFNlcnZpY2UgPSBuZXcgU3BpbmFsVmlzaXRTZXJ2aWNlKCk7XG5cbmV4cG9ydCBkZWZhdWx0IHNwaW5hbFZpc2l0U2VydmljZTsiXX0=