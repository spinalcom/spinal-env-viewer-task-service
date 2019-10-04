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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJTcGluYWxWaXNpdFNlcnZpY2UiLCJjb25zdHJ1Y3RvciIsIlZJU0lUX0NPTlRFWFRfTkFNRSIsIkNPTlRFWFRfVFlQRSIsIlZJU0lUX1RZUEUiLCJNQUlOVEVOQU5DRV9WSVNJVCIsIlJFR1VMQVRPUllfVklTSVQiLCJTRUNVUklUWV9WSVNJVCIsIkRJQUdOT1NUSUNfVklTSVQiLCJFVkVOVF9TVEFURVMiLCJPYmplY3QiLCJmcmVlemUiLCJkZWNsYXJlZCIsIm5hbWUiLCJ0eXBlIiwicHJvY2Vzc2luZyIsImRvbmUiLCJWSVNJVFMiLCJNQUlOVEVOQU5DRV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIlJFR1VMQVRPUllfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJTRUNVUklUWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJHUk9VUF9UT19UQVNLIiwiVklTSVRfVE9fRVZFTlRfUkVMQVRJT04iLCJWSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OIiwiRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04iLCJFVkVOVF9UT19UQVNLX1JFTEFUSU9OIiwiVEFTS19UT19DT01NRU5UU19SRUxBVElPTiIsImdldEFsbFZpc2l0cyIsImFkZFZpc2l0T25Hcm91cCIsImdyb3VwSWQiLCJ2aXNpdE5hbWUiLCJwZXJpb2RpY2l0eU51bWJlciIsInBlcmlvZGljaXR5TWVzdXJlIiwidmlzaXRUeXBlIiwiaW50ZXJ2ZW50aW9uTnVtYmVyIiwiaW50ZXJ2ZW50aW9uTWVzdXJlIiwiZGVzY3JpcHRpb24iLCJTcGluYWxHcmFwaFNlcnZpY2UiLCJnZXRDaGlsZHJlbiIsInRoZW4iLCJjaGlsZHJlbiIsImFyZ05vZGVJZCIsImxlbmd0aCIsImNyZWF0ZU5vZGUiLCJhZGRDaGlsZCIsIlNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEUiLCJub2RlIiwiZ2V0SW5mbyIsImdldFB0clZhbHVlIiwibHN0IiwidGFzayIsIlZpc2l0TW9kZWwiLCJub2RlSWQiLCJwZXJpb2RpY2l0eSIsIm51bWJlciIsImdldCIsIm1lc3VyZSIsImludGVydmVudGlvbiIsInJlYWxOb2RlIiwiZ2V0UmVhbE5vZGUiLCJwdXNoIiwiaW5mbyIsImRlbGV0ZVZpc2l0IiwidmlzaXRJZCIsInJlbW92ZVZpc2l0IiwicmVtb3ZlUmVsYXRlZEV2ZW50IiwiYmVnaW5EYXRlIiwiZW5kRGF0ZSIsInJlZmVyZW5jZSIsInJlbW92ZVZpc2l0RXZlbnRzIiwiZWwiLCJjb25kaXRpb25WYWxpZCIsImVsZW1lbnQiLCJ0cmltIiwiZ2V0RXZlbnRzQmV0d2VlblR3b0RhdGUiLCJldmVudHMiLCJmb3JFYWNoIiwicmVtb3ZlRnJvbUdyYXBoIiwiaWQiLCJnZXRWaXNpdEV2ZW50cyIsIkRhdGUiLCJub3ciLCJtYXAiLCJmaWx0ZXIiLCJkYXRlIiwidmlzaXRDb250ZXh0VHlwZSIsImdldEdyb3VwVmlzaXRzIiwicmVzIiwiaW5kZXgiLCJyZXNWaXNpdElkIiwicmVtb3ZlIiwiUHJvbWlzZSIsInJlc29sdmUiLCJlZGl0VmlzaXQiLCJuZXdWYWx1ZXNPYmoiLCJ2aXNpdE5vZGUiLCJrZXkiLCJ2YWx1ZSIsInNldCIsImtleTIiLCJ2YWx1ZTIiLCJDaG9pY2UiLCJOYU4iLCJwdHJOYW1lIiwiYWRkX2F0dHIiLCJ0YXNrcyIsIlB0ciIsIkxzdCIsImxvYWQiLCJ2aXNpdHlUeXBlIiwiZ2VuZXJhdGVFdmVudCIsImV2ZW50c0RhdGEiLCJyZWZlcmVuY2VOYW1lIiwiY3JlYXRlVmlzaXRDb250ZXh0IiwibGlua0dyb3VwVG9WaXN0Q29udGV4dCIsImdldEV2ZW50U3RhdGVOb2RlIiwic3RhdGVOb2RlIiwiZXZlbnRJbmZvIiwiZXZlbnRzRGF0ZSIsIl9nZXREYXRlIiwicGVyaW9kTnVtYmVyIiwicGVyaW9kTWVzdXJlIiwiYWRkRXZlbnQiLCJnZXRUaW1lIiwiY2F0Y2giLCJlcnIiLCJjb25zb2xlIiwibG9nIiwidmlzaXRUeXBlQ29udGV4dElkIiwic3RhdGVJZCIsInZpc2l0SW5mbyIsImNyZWF0aW9uRGF0ZSIsInN0YXRlIiwiZXZlbnQiLCJFdmVudE1vZGVsIiwiZXZlbnROb2RlSWQiLCJjcmVhdGlvbiIsImFkZENoaWxkSW5Db250ZXh0IiwiZXZlbnRJZCIsIkVRVUlQTUVOVFNfVE9fRUxFTUVOVF9SRUxBVElPTiIsImNoaWxkIiwiVGFza01vZGVsIiwiZGJpZCIsImJpbUZpbGVJZCIsInRhc2tJZCIsImRiSWQiLCJhbGwiLCJ2aXNpdCIsImZpbmQiLCJjb250ZXh0TmFtZSIsImNvbnRleHQiLCJnZXRDb250ZXh0IiwiYWRkQ29udGV4dCIsIk1vZGVsIiwiY29udGV4dENyZWF0ZWQiLCJyZWplY3QiLCJ2aXNpdENvbnRleHRJZCIsImkiLCJldmVudFNhdGUiLCJfZXZlbnRTYXRlSXNWYWxpZCIsImNvbnRleHRUeXBlIiwicmVsYXRpb25OYW1lIiwidmFsaWRhdGVUYXNrIiwiY29udGV4dElkIiwidGFza05vZGUiLCJjdXJyZW50U3RhdGVJZCIsIl9nZXRTdGF0ZSIsIm5leHRTdGF0ZSIsIm5leHRTdGF0ZUlkIiwiX3N3aXRjaEV2ZW50U3RhdGUiLCJlbmQiLCJkaWZmIiwidG9EYXRlIiwiYWRkIiwiX2Zvcm1hdERhdGUiLCJhcmdEYXRlIiwiZCIsImdldERhdGUiLCJ0b1N0cmluZyIsImdldE1vbnRoIiwiZ2V0RnVsbFllYXIiLCJldmVudFN0YXRlIiwidW5kZWZpbmVkIiwiZ2V0RXZlbnRUYXNrcyIsInRhc2tzVmFsaWRhdGVkIiwic3RhdGVPYmoiLCJmcm9tU3RhdGVJZCIsInRvU3RhdGVJZCIsInJlbW92ZUNoaWxkIiwicmVtb3ZlZCIsIkV2ZW50Tm9kZSIsIm5ld1N0YXRlIiwiZ2V0VmlzaXRHcm91cHMiLCJjb250ZXh0cyIsImdldENvbnRleHRXaXRoVHlwZSIsImdldEdyb3VwRXZlbnRTdGF0ZXMiLCJwcm9taXNlcyIsImdldEdyb3VwRXZlbnRzIiwiVklTSVRfVFlQRVMiLCJBcnJheSIsImlzQXJyYXkiLCJ2YWx1ZXMiLCJwcm9tIiwiZXZlbnRUeXBlIiwiYWxsRXZlbnRzIiwidmFsIiwiYWRkQ29tbWVudCIsInVzZXJJZCIsIm1lc3NhZ2UiLCJjb21tZW50Tm9kZUlkIiwiZ2V0VGFza3NDb21tZW50cyIsInNwaW5hbFZpc2l0U2VydmljZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7O0FBS0E7O0FBSUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBRUE7O0FBTUE7Ozs7Ozs7O0FBRUEsTUFBTUEsa0JBQU4sQ0FBeUI7QUFDdkJDLGdCQUFjO0FBQ1osU0FBS0Msa0JBQUwsR0FBMEIsZ0JBQTFCO0FBQ0EsU0FBS0MsWUFBTCxHQUFvQixlQUFwQjs7QUFFQSxTQUFLQyxVQUFMLEdBQWtCLE9BQWxCOztBQUVBLFNBQUtDLGlCQUFMLEdBQXlCLG1CQUF6QjtBQUNBLFNBQUtDLGdCQUFMLEdBQXdCLGtCQUF4QjtBQUNBLFNBQUtDLGNBQUwsR0FBc0IsZ0JBQXRCO0FBQ0EsU0FBS0MsZ0JBQUwsR0FBd0Isa0JBQXhCOztBQUVBLFNBQUtDLFlBQUwsR0FBb0JDLE9BQU9DLE1BQVAsQ0FBYztBQUNoQ0MsZ0JBQVU7QUFDUkMsY0FBTSxTQURFO0FBRVJDLGNBQU07QUFGRSxPQURzQjtBQUtoQ0Msa0JBQVk7QUFDVkYsY0FBTSxTQURJO0FBRVZDLGNBQU07QUFGSSxPQUxvQjtBQVNoQ0UsWUFBTTtBQUNKSCxjQUFNLFVBREY7QUFFSkMsY0FBTTtBQUZGO0FBVDBCLEtBQWQsQ0FBcEI7O0FBZUEsU0FBS0csTUFBTCxHQUFjUCxPQUFPQyxNQUFQLENBQWMsQ0FBQztBQUMzQkcsWUFBTSxLQUFLVCxpQkFEZ0I7QUFFM0JRLFlBQU07QUFGcUIsS0FBRCxFQUd6QjtBQUNEQyxZQUFNLEtBQUtSLGdCQURWO0FBRURPLFlBQU07QUFGTCxLQUh5QixFQU16QjtBQUNEQyxZQUFNLEtBQUtQLGNBRFY7QUFFRE0sWUFBTTtBQUZMLEtBTnlCLEVBU3pCO0FBQ0RDLFlBQU0sS0FBS04sZ0JBRFY7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Q2lFLGFBQXBDLEVBQW1ELEtBQ3ZEdkwseUJBREksRUFFTG1CLHlEQUZLLENBQVA7QUFHRDtBQUVGLEtBZEQsTUFjTztBQUNMLGFBQU84QyxRQUFRZ0UsTUFBUixDQUFlLEtBQWYsQ0FBUDtBQUNEO0FBQ0Y7O0FBRUR1RCxtQkFBaUJsRSxNQUFqQixFQUF5QjtBQUN2QixXQUFPM0csZ0RBQW1CQyxXQUFuQixDQUErQjBHLE1BQS9CLEVBQXVDLENBQUMsS0FDNUN0SCx5QkFEMkMsQ0FBdkMsRUFFSmEsSUFGSSxDQUVDQyxZQUFZO0FBQ2xCLGFBQU9BLFNBQVMwQyxHQUFULENBQWFaLE1BQU1BLEdBQUdmLEdBQUgsRUFBbkIsQ0FBUDtBQUNELEtBSk0sQ0FBUDtBQUtEOztBQTkyQnNCOztBQWszQnpCLElBQUk0SixxQkFBcUIsSUFBSXBOLGtCQUFKLEVBQXpCOztrQkFFZW9OLGtCIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRSxcbiAgU3BpbmFsR3JhcGhTZXJ2aWNlXG59IGZyb20gXCJzcGluYWwtZW52LXZpZXdlci1ncmFwaC1zZXJ2aWNlXCI7XG5cbmltcG9ydCB7XG4gIEVRVUlQTUVOVFNfVE9fRUxFTUVOVF9SRUxBVElPTlxufSBmcm9tIFwic3BpbmFsLWVudi12aWV3ZXItcm9vbS1tYW5hZ2VyL2pzL3NlcnZpY2VcIjtcblxuaW1wb3J0IFZpc2l0TW9kZWwgZnJvbSBcIi4vbW9kZWxzL3Zpc2l0Lm1vZGVsLmpzXCI7XG5pbXBvcnQgRXZlbnRNb2RlbCBmcm9tIFwiLi9tb2RlbHMvZXZlbnQubW9kZWwuanNcIjtcbmltcG9ydCBUYXNrTW9kZWwgZnJvbSBcIi4vbW9kZWxzL3Rhc2subW9kZWwuanNcIjtcblxuaW1wb3J0IHtcbiAgUHRyLFxuICBMc3QsXG4gIE1vZGVsXG59IGZyb20gXCJzcGluYWwtY29yZS1jb25uZWN0b3Jqc190eXBlXCI7XG5cbmltcG9ydCBtb21lbnQgZnJvbSBcIm1vbWVudFwiO1xuXG5jbGFzcyBTcGluYWxWaXNpdFNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLlZJU0lUX0NPTlRFWFRfTkFNRSA9IFwiLnZpc2l0X2NvbnRleHRcIjtcbiAgICB0aGlzLkNPTlRFWFRfVFlQRSA9IFwidmlzaXRfY29udGV4dFwiO1xuXG4gICAgdGhpcy5WSVNJVF9UWVBFID0gXCJ2aXNpdFwiO1xuXG4gICAgdGhpcy5NQUlOVEVOQU5DRV9WSVNJVCA9IFwiTUFJTlRFTkFOQ0VfVklTSVRcIjtcbiAgICB0aGlzLlJFR1VMQVRPUllfVklTSVQgPSBcIlJFR1VMQVRPUllfVklTSVRcIjtcbiAgICB0aGlzLlNFQ1VSSVRZX1ZJU0lUID0gXCJTRUNVUklUWV9WSVNJVFwiO1xuICAgIHRoaXMuRElBR05PU1RJQ19WSVNJVCA9IFwiRElBR05PU1RJQ19WSVNJVFwiO1xuXG4gICAgdGhpcy5FVkVOVF9TVEFURVMgPSBPYmplY3QuZnJlZXplKHtcbiAgICAgIGRlY2xhcmVkOiB7XG4gICAgICAgIG5hbWU6IFwiZMOpY2xhcsOpXCIsXG4gICAgICAgIHR5cGU6IFwiZGVjbGFyZWRcIlxuICAgICAgfSxcbiAgICAgIHByb2Nlc3Npbmc6IHtcbiAgICAgICAgbmFtZTogXCJlbmNvdXJzXCIsXG4gICAgICAgIHR5cGU6IFwicHJvY2Vzc2luZ1wiXG4gICAgICB9LFxuICAgICAgZG9uZToge1xuICAgICAgICBuYW1lOiBcIsOpZmZlY3R1w6lcIixcbiAgICAgICAgdHlwZTogXCJkb25lXCJcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuVklTSVRTID0gT2JqZWN0LmZyZWV6ZShbe1xuICAgICAgdHlwZTogdGhpcy5NQUlOVEVOQU5DRV9WSVNJVCxcbiAgICAgIG5hbWU6IFwiVmlzaXRlIGRlIG1haW50ZW5hbmNlXCJcbiAgICB9LCB7XG4gICAgICB0eXBlOiB0aGlzLlJFR1VMQVRPUllfVklTSVQsXG4gICAgICBuYW1lOiBcIlZpc2l0ZSByZWdsZW1lbnRhaXJlXCJcbiAgICB9LCB7XG4gICAgICB0eXBlOiB0aGlzLlNFQ1VSSVRZX1ZJU0lULFxuICAgICAgbmFtZTogXCJWaXNpdGUgZGUgc2VjdXJpdGVcIlxuICAgIH0sIHtcbiAgICAgIHR5cGU6IHRoaXMuRElBR05PU1RJQ19WSVNJVCxcbiAgICAgIG5hbWU6IFwiVmlzaXRlIGRlIGRpYWdub3N0aWNcIlxuICAgIH1dKTtcblxuXG4gICAgdGhpcy5NQUlOVEVOQU5DRV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiA9XG4gICAgICBcIm1haW50ZW5hbmNlVmlzaXRoYXNFdmVudFN0YXRlXCI7XG5cbiAgICB0aGlzLlJFR1VMQVRPUllfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04gPVxuICAgICAgXCJyZWd1bGF0b3J5VmlzaXRoYXNFdmVudFN0YXRlXCI7XG5cbiAgICB0aGlzLlNFQ1VSSVRZX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OID0gXCJzZWN1cml0eVZpc2l0aGFzRXZlbnRTdGF0ZVwiO1xuXG4gICAgdGhpcy5ESUFHTk9TVElDX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OID1cbiAgICAgIFwiZGlhZ25vc3RpY1Zpc2l0aGFzRXZlbnRTdGF0ZVwiO1xuXG4gICAgdGhpcy5HUk9VUF9UT19UQVNLID0gXCJoYXNWaXNpdFwiO1xuXG4gICAgdGhpcy5WSVNJVF9UT19FVkVOVF9SRUxBVElPTiA9IFwidmlzaXRIYXNFdmVudFwiO1xuXG4gICAgdGhpcy5WSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OID0gXCJ2aXNpdEhhc0dyb3VwXCI7XG4gICAgdGhpcy5FVkVOVF9TVEFURV9UT19FVkVOVF9SRUxBVElPTiA9IFwiaGFzRXZlbnRcIjtcbiAgICB0aGlzLkVWRU5UX1RPX1RBU0tfUkVMQVRJT04gPSBcImhhc1Rhc2tcIjtcblxuICAgIHRoaXMuVEFTS19UT19DT01NRU5UU19SRUxBVElPTiA9IFwiaGFzQ29tbWVudFwiXG4gIH1cblxuICBnZXRBbGxWaXNpdHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuVklTSVRTO1xuICB9XG5cbiAgYWRkVmlzaXRPbkdyb3VwKFxuICAgIGdyb3VwSWQsXG4gICAgdmlzaXROYW1lLFxuICAgIHBlcmlvZGljaXR5TnVtYmVyLFxuICAgIHBlcmlvZGljaXR5TWVzdXJlLFxuICAgIHZpc2l0VHlwZSxcbiAgICBpbnRlcnZlbnRpb25OdW1iZXIsXG4gICAgaW50ZXJ2ZW50aW9uTWVzdXJlLFxuICAgIGRlc2NyaXB0aW9uXG4gICkge1xuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oZ3JvdXBJZCwgW3RoaXMuR1JPVVBfVE9fVEFTS10pLnRoZW4oXG4gICAgICBjaGlsZHJlbiA9PiB7XG4gICAgICAgIGxldCBhcmdOb2RlSWQ7XG4gICAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBhcmdOb2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgICAgICBuYW1lOiBcIm1haW50ZW5hbmNlXCJcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZChcbiAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICBhcmdOb2RlSWQsXG4gICAgICAgICAgICB0aGlzLkdST1VQX1RPX1RBU0ssXG4gICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBub2RlID1cbiAgICAgICAgICB0eXBlb2YgYXJnTm9kZUlkICE9PSBcInVuZGVmaW5lZFwiID9cbiAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhhcmdOb2RlSWQpIDpcbiAgICAgICAgICBjaGlsZHJlblswXTtcblxuICAgICAgICByZXR1cm4gdGhpcy5nZXRQdHJWYWx1ZShub2RlLCB2aXNpdFR5cGUpLnRoZW4obHN0ID0+IHtcbiAgICAgICAgICBsZXQgdGFzayA9IG5ldyBWaXNpdE1vZGVsKFxuICAgICAgICAgICAgdmlzaXROYW1lLFxuICAgICAgICAgICAgcGVyaW9kaWNpdHlOdW1iZXIsXG4gICAgICAgICAgICBwZXJpb2RpY2l0eU1lc3VyZSxcbiAgICAgICAgICAgIHZpc2l0VHlwZSxcbiAgICAgICAgICAgIGludGVydmVudGlvbk51bWJlcixcbiAgICAgICAgICAgIGludGVydmVudGlvbk1lc3VyZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGxldCBub2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgICAgICAgIGdyb3VwSWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICAgIG5hbWU6IHZpc2l0TmFtZSxcbiAgICAgICAgICAgICAgcGVyaW9kaWNpdHk6IHtcbiAgICAgICAgICAgICAgICBudW1iZXI6IHRhc2sucGVyaW9kaWNpdHkubnVtYmVyLmdldCgpLFxuICAgICAgICAgICAgICAgIG1lc3VyZTogdGFzay5wZXJpb2RpY2l0eS5tZXN1cmVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgaW50ZXJ2ZW50aW9uOiB7XG4gICAgICAgICAgICAgICAgbnVtYmVyOiB0YXNrLmludGVydmVudGlvbi5udW1iZXIuZ2V0KCksXG4gICAgICAgICAgICAgICAgbWVzdXJlOiB0YXNrLmludGVydmVudGlvbi5tZXN1cmVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgdmlzaXRUeXBlOiB2aXNpdFR5cGUsXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRhc2tcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbGV0IHJlYWxOb2RlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldFJlYWxOb2RlKG5vZGVJZCk7XG5cbiAgICAgICAgICBsc3QucHVzaChyZWFsTm9kZSk7XG5cbiAgICAgICAgICByZXR1cm4gcmVhbE5vZGUuaW5mbztcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIC8vIGRlbGV0ZVZpc2l0KHZpc2l0SWQsIHJlbW92ZVJlbGF0ZWRFdmVudCkge1xuICAvLyAgIHJldHVybiB0aGlzLnJlbW92ZVZpc2l0RXZlbnRzKHZpc2l0SWQsIHJlbW92ZVJlbGF0ZWRFdmVudCkudGhlbigoXG4gIC8vICAgICBpbmZvKSA9PiB7XG5cbiAgLy8gICAgIGlmIChpbmZvKSB7XG4gIC8vICAgICAgIGxldCBncm91cElkID0gaW5mby5ncm91cElkLmdldCgpO1xuICAvLyAgICAgICBsZXQgdmlzaXRDb250ZXh0VHlwZSA9IGluZm8udmlzaXRUeXBlLmdldCgpO1xuXG4gIC8vICAgICAgIHJldHVybiB0aGlzLmdldEdyb3VwVmlzaXRzKGdyb3VwSWQsIHZpc2l0Q29udGV4dFR5cGUpLnRoZW4oXG4gIC8vICAgICAgICAgcmVzID0+IHtcbiAgLy8gICAgICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCByZXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gIC8vICAgICAgICAgICAgIGNvbnN0IHJlc1Zpc2l0SWQgPSByZXNbaW5kZXhdLmluZm8uaWQuZ2V0KCk7XG4gIC8vICAgICAgICAgICAgIGlmIChyZXNWaXNpdElkID09IHZpc2l0SWQpIHtcbiAgLy8gICAgICAgICAgICAgICByZXMucmVtb3ZlKHJlc1tpbmRleF0pO1xuICAvLyAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAvLyAgICAgICAgICAgICB9XG4gIC8vICAgICAgICAgICB9XG4gIC8vICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gIC8vICAgICAgICAgfSlcbiAgLy8gICAgIH0gZWxzZSB7XG4gIC8vICAgICAgIHJldHVybiBmYWxzZTtcbiAgLy8gICAgIH1cblxuICAvLyAgIH0pXG4gIC8vIH1cblxuICBkZWxldGVWaXNpdCh2aXNpdElkLCByZW1vdmVWaXNpdCwgcmVtb3ZlUmVsYXRlZEV2ZW50LCBiZWdpbkRhdGUsIGVuZERhdGUsXG4gICAgcmVmZXJlbmNlKSB7XG5cbiAgICBpZiAocmVtb3ZlUmVsYXRlZEV2ZW50KSB7XG4gICAgICB0aGlzLnJlbW92ZVZpc2l0RXZlbnRzKHZpc2l0SWQsIGJlZ2luRGF0ZSwgZW5kRGF0ZSwgcmVmZXJlbmNlKS50aGVuKFxuICAgICAgICBlbCA9PiB7XG4gICAgICAgICAgaWYgKHJlbW92ZVZpc2l0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZW1vdmVWaXNpdCh2aXNpdElkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgICB9KVxuICAgIH0gZWxzZSBpZiAocmVtb3ZlVmlzaXQpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlbW92ZVZpc2l0KHZpc2l0SWQpO1xuICAgIH1cblxuICB9XG5cbiAgcmVtb3ZlVmlzaXRFdmVudHModmlzaXRJZCwgYmVnaW5EYXRlLCBlbmREYXRlLCByZWZlcmVuY2UpIHtcbiAgICAvLyBpZiAocmVtb3ZlUmVsYXRlZEV2ZW50KSB7XG4gICAgLy8gICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKHZpc2l0SWQsIFt0aGlzXG4gICAgLy8gICAgIC5WSVNJVF9UT19FVkVOVF9SRUxBVElPTlxuICAgIC8vICAgXSkudGhlbigoY2hpbGRyZW4pID0+IHtcbiAgICAvLyAgICAgbGV0IGNoaWxkcmVuUHJvbWlzZSA9IGNoaWxkcmVuLm1hcChlbCA9PiB7XG4gICAgLy8gICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5yZW1vdmVGcm9tR3JhcGgoZWwuaWQuZ2V0KCkpO1xuICAgIC8vICAgICB9KVxuXG4gICAgLy8gICAgIHJldHVybiBQcm9taXNlLmFsbChjaGlsZHJlblByb21pc2UpLnRoZW4oKCkgPT4ge1xuICAgIC8vICAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyh2aXNpdElkKTtcbiAgICAvLyAgICAgfSk7XG5cbiAgICAvLyAgIH0pXG4gICAgLy8gfSBlbHNlIHtcbiAgICAvLyAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8odmlzaXRJZCkpO1xuICAgIC8vIH1cblxuICAgIGxldCBjb25kaXRpb25WYWxpZCA9IChlbGVtZW50KSA9PiB7XG4gICAgICBpZiAoIXJlZmVyZW5jZSB8fCByZWZlcmVuY2UudHJpbSgpLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRydWU7XG5cbiAgICAgIHJldHVybiBlbGVtZW50LnJlZmVyZW5jZSA9PT0gcmVmZXJlbmNlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmdldEV2ZW50c0JldHdlZW5Ud29EYXRlKHZpc2l0SWQsIGJlZ2luRGF0ZSwgZW5kRGF0ZSkudGhlbihcbiAgICAgIGV2ZW50cyA9PiB7XG5cbiAgICAgICAgZXZlbnRzLmZvckVhY2goZWwgPT4ge1xuICAgICAgICAgIGlmIChjb25kaXRpb25WYWxpZChlbCkpIHtcbiAgICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5yZW1vdmVGcm9tR3JhcGgoZWwuaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgIH0pXG5cbiAgfVxuXG4gIGdldFZpc2l0RXZlbnRzKHZpc2l0SWQpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRFdmVudHNCZXR3ZWVuVHdvRGF0ZSh2aXNpdElkKTtcbiAgfVxuXG5cbiAgZ2V0RXZlbnRzQmV0d2VlblR3b0RhdGUodmlzaXRJZCwgYmVnaW5EYXRlLCBlbmREYXRlKSB7XG5cbiAgICBpZiAodHlwZW9mIGJlZ2luRGF0ZSA9PT0gXCJ1bmRlZmluZWRcIilcbiAgICAgIGJlZ2luRGF0ZSA9IDA7XG5cbiAgICBpZiAodHlwZW9mIGVuZERhdGUgPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgIGVuZERhdGUgPSBEYXRlLm5vdygpICogMzE1MzYwMDAwMDAgKiAxMDA7XG5cbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKHZpc2l0SWQsIFt0aGlzXG4gICAgICAuVklTSVRfVE9fRVZFTlRfUkVMQVRJT05cbiAgICBdKS50aGVuKChjaGlsZHJlbikgPT4ge1xuXG4gICAgICBjaGlsZHJlbiA9IGNoaWxkcmVuLm1hcChlbCA9PiBlbC5nZXQoKSk7XG5cbiAgICAgIHJldHVybiBjaGlsZHJlbi5maWx0ZXIoZWwgPT4ge1xuICAgICAgICByZXR1cm4gZWwuZGF0ZSA+PSBiZWdpbkRhdGUgJiYgZWwuZGF0ZSA8PSBlbmREYXRlO1xuICAgICAgfSlcblxuICAgIH0pXG5cbiAgfVxuXG4gIHJlbW92ZVZpc2l0KHZpc2l0SWQpIHtcbiAgICBsZXQgaW5mbyA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKHZpc2l0SWQpO1xuICAgIGlmIChpbmZvKSB7XG4gICAgICBsZXQgZ3JvdXBJZCA9IGluZm8uZ3JvdXBJZC5nZXQoKTtcbiAgICAgIGxldCB2aXNpdENvbnRleHRUeXBlID0gaW5mby52aXNpdFR5cGUuZ2V0KCk7XG5cbiAgICAgIHJldHVybiB0aGlzLmdldEdyb3VwVmlzaXRzKGdyb3VwSWQsIHZpc2l0Q29udGV4dFR5cGUpLnRoZW4oXG4gICAgICAgIHJlcyA9PiB7XG4gICAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHJlcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc1Zpc2l0SWQgPSByZXNbaW5kZXhdLmluZm8uaWQuZ2V0KCk7XG4gICAgICAgICAgICBpZiAocmVzVmlzaXRJZCA9PSB2aXNpdElkKSB7XG4gICAgICAgICAgICAgIHJlcy5yZW1vdmUocmVzW2luZGV4XSk7XG4gICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIGVkaXRWaXNpdCh2aXNpdElkLCBuZXdWYWx1ZXNPYmopIHtcbiAgICBpZiAodHlwZW9mIG5ld1ZhbHVlc09iaiAhPT0gXCJvYmplY3RcIikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCB2aXNpdE5vZGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0UmVhbE5vZGUodmlzaXRJZCk7XG5cbiAgICBpZiAodHlwZW9mIHZpc2l0Tm9kZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgZm9yIChjb25zdCBrZXkgaW4gbmV3VmFsdWVzT2JqKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gbmV3VmFsdWVzT2JqW2tleV07XG5cbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiB0eXBlb2YgdmlzaXROb2RlLmluZm9ba2V5XSAhPT1cbiAgICAgICAgICBcInVuZGVmaW5lZFwiKSB7XG5cbiAgICAgICAgICB2aXNpdE5vZGUuaW5mb1trZXldLnNldCh2YWx1ZSk7XG5cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHZpc2l0Tm9kZS5pbmZvW2tleV0gIT09XG4gICAgICAgICAgXCJ1bmRlZmluZWRcIikge1xuXG4gICAgICAgICAgZm9yIChjb25zdCBrZXkyIGluIHZhbHVlKSB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZTIgPSB2YWx1ZVtrZXkyXTtcblxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHZpc2l0Tm9kZS5pbmZvW2tleV1ba2V5Ml0gIT09IFwidW5kZWZpbmVkXCIpIHtcblxuICAgICAgICAgICAgICBpZiAoa2V5ID09PSBcImludGVydmVudGlvblwiICYmIGtleTIgPT09IFwibWVzdXJlXCIpIHtcblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUyICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cbiAgICAgICAgICAgICAgICAgIHZpc2l0Tm9kZS5pbmZvW2tleV1ba2V5Ml0uc2V0KG5ldyBDaG9pY2UoXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlMiwgW1xuICAgICAgICAgICAgICAgICAgICAgIFwibWludXRlKHMpXCIsIFwiZGF5KHMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgXCJ3ZWVrKHMpXCIsIFwibW9udGgocylcIixcbiAgICAgICAgICAgICAgICAgICAgICBcInllYXIocylcIlxuICAgICAgICAgICAgICAgICAgICBdKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHZpc2l0Tm9kZS5pbmZvW2tleV1ba2V5Ml0uc2V0KE5hTik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSBcInBlcmlvZGljaXR5XCIgJiYga2V5MiA9PT0gXCJtZXN1cmVcIikge1xuXG4gICAgICAgICAgICAgICAgdmlzaXROb2RlLmluZm9ba2V5XVtrZXkyXS5zZXQobmV3IENob2ljZSh2YWx1ZTIsIFtcbiAgICAgICAgICAgICAgICAgIFwiZGF5KHMpXCIsIFwid2VlayhzKVwiLFxuICAgICAgICAgICAgICAgICAgXCJtb250aChzKVwiLFxuICAgICAgICAgICAgICAgICAgXCJ5ZWFyKHMpXCJcbiAgICAgICAgICAgICAgICBdKSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdHlwZW9mIHZhbHVlMiAhPT0gXCJ1bmRlZmluZWRcIiA/IHZpc2l0Tm9kZS5pbmZvW2tleV1ba2V5Ml0uc2V0KFxuICAgICAgICAgICAgICAgICAgdmFsdWUyKSA6IHZpc2l0Tm9kZS5pbmZvW2tleV1ba2V5Ml0uc2V0KE5hTik7XG4gICAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIH1cblxuICBnZXRQdHJWYWx1ZShub2RlLCBwdHJOYW1lKSB7XG4gICAgbGV0IHJlYWxOb2RlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldFJlYWxOb2RlKG5vZGUuaWQuZ2V0KCkpO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgaWYgKCFyZWFsTm9kZS5pbmZvW3B0ck5hbWVdKSB7XG4gICAgICAgIHJlYWxOb2RlLmluZm8uYWRkX2F0dHIocHRyTmFtZSwge1xuICAgICAgICAgIHRhc2tzOiBuZXcgUHRyKG5ldyBMc3QoKSlcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJlYWxOb2RlLmluZm9bcHRyTmFtZV0udGFza3MubG9hZCh2YWx1ZSA9PiB7XG4gICAgICAgIHJldHVybiByZXNvbHZlKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0R3JvdXBWaXNpdHMoZ3JvdXBJZCwgdmlzaXR5VHlwZSkge1xuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oZ3JvdXBJZCwgW3RoaXMuR1JPVVBfVE9fVEFTS10pLnRoZW4oXG4gICAgICByZXMgPT4ge1xuICAgICAgICBsZXQgbm9kZUlkO1xuICAgICAgICBpZiAocmVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIG5vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgIG5hbWU6IFwibWFpbnRlbmFuY2VcIlxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkKFxuICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgIG5vZGVJZCxcbiAgICAgICAgICAgIHRoaXMuR1JPVVBfVE9fVEFTSyxcbiAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5vZGUgPVxuICAgICAgICAgIHR5cGVvZiBub2RlSWQgIT09IFwidW5kZWZpbmVkXCIgP1xuICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKG5vZGVJZCkgOlxuICAgICAgICAgIHJlc1swXTtcblxuICAgICAgICByZXR1cm4gdGhpcy5nZXRQdHJWYWx1ZShub2RlLCB2aXNpdHlUeXBlKTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgZ2VuZXJhdGVFdmVudCh2aXNpdFR5cGUsIGdyb3VwSWQsIGJlZ2luRGF0ZSwgZW5kRGF0ZSwgZXZlbnRzRGF0YSxcbiAgICByZWZlcmVuY2VOYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlVmlzaXRDb250ZXh0KHZpc2l0VHlwZSlcbiAgICAgIC50aGVuKGVsID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlua0dyb3VwVG9WaXN0Q29udGV4dChlbC5pZC5nZXQoKSwgZ3JvdXBJZCkudGhlbihcbiAgICAgICAgICByZXMgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgICAgICB0aGlzLmdldEV2ZW50U3RhdGVOb2RlKFxuICAgICAgICAgICAgICAgIGVsLmlkLmdldCgpLFxuICAgICAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICAgICAgdGhpcy5FVkVOVF9TVEFURVMuZGVjbGFyZWQudHlwZVxuICAgICAgICAgICAgICApLnRoZW4oc3RhdGVOb2RlID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgaWQgPSBzdGF0ZU5vZGUuaWQuZ2V0KCk7XG5cbiAgICAgICAgICAgICAgICBldmVudHNEYXRhLmZvckVhY2goZXZlbnRJbmZvID0+IHtcbiAgICAgICAgICAgICAgICAgIGxldCBldmVudHNEYXRlID0gdGhpcy5fZ2V0RGF0ZShcbiAgICAgICAgICAgICAgICAgICAgYmVnaW5EYXRlLFxuICAgICAgICAgICAgICAgICAgICBlbmREYXRlLFxuICAgICAgICAgICAgICAgICAgICBldmVudEluZm8ucGVyaW9kTnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICBldmVudEluZm8ucGVyaW9kTWVzdXJlXG4gICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICBldmVudHNEYXRlLmZvckVhY2goZGF0ZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnQoXG4gICAgICAgICAgICAgICAgICAgICAgZWwuaWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICBpZCxcbiAgICAgICAgICAgICAgICAgICAgICBldmVudEluZm8sXG4gICAgICAgICAgICAgICAgICAgICAgYCR7ZXZlbnRJbmZvLm5hbWV9YCxcbiAgICAgICAgICAgICAgICAgICAgICBuZXcgRGF0ZShkYXRlKS5nZXRUaW1lKCksXG4gICAgICAgICAgICAgICAgICAgICAgRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2VOYW1lXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZXJyKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgYWRkRXZlbnQodmlzaXRUeXBlQ29udGV4dElkLCBncm91cElkLCBzdGF0ZUlkLCB2aXNpdEluZm8sIG5hbWUsIGRhdGUsXG4gICAgY3JlYXRpb25EYXRlLCByZWZlcmVuY2VOYW1lKSB7XG4gICAgbGV0IHN0YXRlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8oc3RhdGVJZCkuc3RhdGUuZ2V0KCk7XG5cbiAgICBsZXQgZXZlbnQgPSBuZXcgRXZlbnRNb2RlbChuYW1lLCBkYXRlLCBzdGF0ZSwgZ3JvdXBJZCwgY3JlYXRpb25EYXRlLFxuICAgICAgcmVmZXJlbmNlTmFtZSk7XG5cbiAgICBsZXQgZXZlbnROb2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgIGRhdGU6IGRhdGUsXG4gICAgICAgIGNyZWF0aW9uOiBjcmVhdGlvbkRhdGUsXG4gICAgICAgIHJlZmVyZW5jZTogcmVmZXJlbmNlTmFtZSxcbiAgICAgICAgc3RhdGVJZDogc3RhdGVJZCxcbiAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgICBncm91cElkOiBncm91cElkLFxuICAgICAgICB2aXNpdElkOiB2aXNpdEluZm8uaWRcbiAgICAgIH0sXG4gICAgICBldmVudFxuICAgICk7XG5cbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkSW5Db250ZXh0KFxuICAgICAgICBzdGF0ZUlkLFxuICAgICAgICBldmVudE5vZGVJZCxcbiAgICAgICAgdmlzaXRUeXBlQ29udGV4dElkLFxuICAgICAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OLFxuICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICApXG4gICAgICAudGhlbihlbCA9PiB7XG4gICAgICAgIGlmIChlbCkgcmV0dXJuIGV2ZW50Tm9kZUlkO1xuICAgICAgfSlcbiAgICAgIC50aGVuKGV2ZW50SWQgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGV2ZW50SWQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKGdyb3VwSWQsIFtcbiAgICAgICAgICAgIEVRVUlQTUVOVFNfVE9fRUxFTUVOVF9SRUxBVElPTlxuICAgICAgICAgIF0pLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgICAgICAgICAgY2hpbGRyZW4ubWFwKGNoaWxkID0+IHtcbiAgICAgICAgICAgICAgbGV0IG5hbWUgPSBgJHtjaGlsZC5uYW1lLmdldCgpfWA7XG4gICAgICAgICAgICAgIGxldCB0YXNrID0gbmV3IFRhc2tNb2RlbChcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGNoaWxkLmRiaWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgY2hpbGQuYmltRmlsZUlkLmdldCgpLFxuICAgICAgICAgICAgICAgIHZpc2l0SW5mby5uYW1lLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICBsZXQgdGFza0lkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmNyZWF0ZU5vZGUoe1xuICAgICAgICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgICAgIHR5cGU6IFwidGFza1wiLFxuICAgICAgICAgICAgICAgICAgZGJJZDogY2hpbGQuZGJpZC5nZXQoKSxcbiAgICAgICAgICAgICAgICAgIGJpbUZpbGVJZDogY2hpbGQuYmltRmlsZUlkLmdldCgpLFxuICAgICAgICAgICAgICAgICAgdmlzaXRJZDogdmlzaXRJbmZvLmlkLFxuICAgICAgICAgICAgICAgICAgZXZlbnRJZDogZXZlbnRJZCxcbiAgICAgICAgICAgICAgICAgIGdyb3VwSWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICAgICAgICBkb25lOiBmYWxzZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdGFza1xuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkSW5Db250ZXh0KFxuICAgICAgICAgICAgICAgICAgZXZlbnRJZCxcbiAgICAgICAgICAgICAgICAgIHRhc2tJZCxcbiAgICAgICAgICAgICAgICAgIHZpc2l0VHlwZUNvbnRleHRJZCxcbiAgICAgICAgICAgICAgICAgIHRoaXMuRVZFTlRfVE9fVEFTS19SRUxBVElPTixcbiAgICAgICAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZChcbiAgICAgICAgICAgICAgICAgIHZpc2l0SW5mby5pZCxcbiAgICAgICAgICAgICAgICAgIGV2ZW50SWQsXG4gICAgICAgICAgICAgICAgICB0aGlzLlZJU0lUX1RPX0VWRU5UX1JFTEFUSU9OLFxuICAgICAgICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBjcmVhdGVWaXNpdENvbnRleHQodmlzaXRUeXBlKSB7XG4gICAgbGV0IHZpc2l0ID0gdGhpcy5WSVNJVFMuZmluZChlbCA9PiB7XG4gICAgICByZXR1cm4gZWwudHlwZSA9PT0gdmlzaXRUeXBlO1xuICAgIH0pO1xuXG4gICAgaWYgKHR5cGVvZiB2aXNpdCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgY29uc3QgY29udGV4dE5hbWUgPSBgJHt2aXNpdC5uYW1lfWA7XG5cbiAgICAgIGxldCBjb250ZXh0ID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENvbnRleHQoY29udGV4dE5hbWUpO1xuICAgICAgaWYgKHR5cGVvZiBjb250ZXh0ICE9PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbnRleHRcbiAgICAgICAgLmluZm8pO1xuXG4gICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENvbnRleHQoXG4gICAgICAgIGNvbnRleHROYW1lLFxuICAgICAgICB2aXNpdFR5cGUsXG4gICAgICAgIG5ldyBNb2RlbCh7XG4gICAgICAgICAgbmFtZTogdGhpcy5WSVNJVF9DT05URVhUX05BTUVcbiAgICAgICAgfSlcbiAgICAgICkudGhlbihjb250ZXh0Q3JlYXRlZCA9PiB7XG4gICAgICAgIHJldHVybiBjb250ZXh0Q3JlYXRlZC5pbmZvO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcInZpc2l0Tm90Rm91bmRcIik7XG4gICAgfVxuICB9XG5cbiAgbGlua0dyb3VwVG9WaXN0Q29udGV4dCh2aXNpdENvbnRleHRJZCwgZ3JvdXBJZCkge1xuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4odmlzaXRDb250ZXh0SWQsIFtcbiAgICAgICAgdGhpcy5WSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OXG4gICAgICBdKVxuICAgICAgLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZHJlbltpXS5pZC5nZXQoKTtcbiAgICAgICAgICBpZiAoY2hpbGQgPT09IGdyb3VwSWQpIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGVsID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dChcbiAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgdGhpcy5WSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OLFxuICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICkudGhlbihhc3luYyByZXMgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdldEV2ZW50U3RhdGVOb2RlKFxuICAgICAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICAgICAgdGhpcy5FVkVOVF9TVEFURVMucHJvY2Vzc2luZy50eXBlXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoXG4gICAgICAgICAgICAgICAgdmlzaXRDb250ZXh0SWQsXG4gICAgICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFUy5kb25lLnR5cGVcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgZ2V0RXZlbnRTdGF0ZU5vZGUodmlzaXRDb250ZXh0SWQsIGdyb3VwSWQsIGV2ZW50U2F0ZSkge1xuICAgIGxldCBldmVudCA9IHRoaXMuX2V2ZW50U2F0ZUlzVmFsaWQoZXZlbnRTYXRlKTtcblxuICAgIGlmICh0eXBlb2YgZXZlbnQgPT09IFwidW5kZWZpbmVkXCIpIHJldHVybjtcblxuICAgIGxldCBjb250ZXh0VHlwZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKHZpc2l0Q29udGV4dElkKS50eXBlLmdldCgpO1xuICAgIGxldCByZWxhdGlvbk5hbWU7XG5cbiAgICBzd2l0Y2ggKGNvbnRleHRUeXBlKSB7XG4gICAgICBjYXNlIHRoaXMuTUFJTlRFTkFOQ0VfVklTSVQ6XG4gICAgICAgIHJlbGF0aW9uTmFtZSA9IHRoaXMuTUFJTlRFTkFOQ0VfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT047XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLlNFQ1VSSVRZX1ZJU0lUOlxuICAgICAgICByZWxhdGlvbk5hbWUgPSB0aGlzLlNFQ1VSSVRZX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdGhpcy5ESUFHTk9TVElDX1ZJU0lUOlxuICAgICAgICByZWxhdGlvbk5hbWUgPSB0aGlzLkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT047XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLlJFR1VMQVRPUllfVklTSVQ6XG4gICAgICAgIHJlbGF0aW9uTmFtZSA9IHRoaXMuUkVHVUxBVE9SWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTjtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihncm91cElkLCBbcmVsYXRpb25OYW1lXSlcbiAgICAgIC50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG5hbWUgPSBjaGlsZHJlbltpXS5uYW1lLmdldCgpO1xuICAgICAgICAgIGNvbnN0IHR5cGUgPSBjaGlsZHJlbltpXS5zdGF0ZS5nZXQoKTtcblxuICAgICAgICAgIGlmIChuYW1lID09PSBldmVudFNhdGUgfHwgdHlwZSA9PT0gZXZlbnRTYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gY2hpbGRyZW5baV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGVsID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgbGV0IGFyZ05vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgIG5hbWU6IGV2ZW50Lm5hbWUsXG4gICAgICAgICAgICBzdGF0ZTogZXZlbnQudHlwZSxcbiAgICAgICAgICAgIGdyb3VwSWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICB0eXBlOiBcIkV2ZW50U3RhdGVcIlxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dChcbiAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICBhcmdOb2RlSWQsXG4gICAgICAgICAgICB2aXNpdENvbnRleHRJZCxcbiAgICAgICAgICAgIHJlbGF0aW9uTmFtZSxcbiAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICApLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgIGlmIChyZXMpIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhhcmdOb2RlSWQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBlbDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICB2YWxpZGF0ZVRhc2soY29udGV4dElkLCBncm91cElkLCBldmVudElkLCB0YXNrSWQpIHtcbiAgICBsZXQgdGFza05vZGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0UmVhbE5vZGUodGFza0lkKTtcbiAgICB0YXNrTm9kZS5pbmZvLmRvbmUuc2V0KCF0YXNrTm9kZS5pbmZvLmRvbmUuZ2V0KCkpO1xuXG4gICAgbGV0IGN1cnJlbnRTdGF0ZUlkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldEluZm8oZXZlbnRJZCkuc3RhdGVJZC5nZXQoKTtcblxuICAgIHJldHVybiB0aGlzLl9nZXRTdGF0ZShjb250ZXh0SWQsIGdyb3VwSWQsIGV2ZW50SWQpLnRoZW4obmV4dFN0YXRlID0+IHtcblxuICAgICAgbGV0IG5leHRTdGF0ZUlkID0gbmV4dFN0YXRlLmlkLmdldCgpO1xuXG4gICAgICBpZiAobmV4dFN0YXRlSWQgPT09IGN1cnJlbnRTdGF0ZUlkKSByZXR1cm4gdHJ1ZTtcblxuICAgICAgcmV0dXJuIHRoaXMuX3N3aXRjaEV2ZW50U3RhdGUoZXZlbnRJZCwgY3VycmVudFN0YXRlSWQsIG5leHRTdGF0ZUlkLFxuICAgICAgICBjb250ZXh0SWQpO1xuXG4gICAgfSk7XG5cbiAgfVxuXG5cblxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgUFJJVkFURVMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gIF9nZXREYXRlKGJlZ2luRGF0ZSwgZW5kRGF0ZSwgcGVyaW9kTnVtYmVyLCBwZXJpb2RNZXN1cmUpIHtcbiAgICBsZXQgbWVzdXJlID0gW1wiZGF5c1wiLCBcIndlZWtzXCIsIFwibW9udGhzXCIsIFwieWVhcnNcIl1bcGVyaW9kTWVzdXJlXTtcblxuICAgIGxldCBldmVudHNEYXRlID0gW107XG5cbiAgICBsZXQgZGF0ZSA9IG1vbWVudChiZWdpbkRhdGUpO1xuICAgIGxldCBlbmQgPSBtb21lbnQoZW5kRGF0ZSk7XG5cbiAgICB3aGlsZSAoZW5kLmRpZmYoZGF0ZSkgPj0gMCkge1xuICAgICAgZXZlbnRzRGF0ZS5wdXNoKGRhdGUudG9EYXRlKCkpO1xuXG4gICAgICBkYXRlID0gZGF0ZS5hZGQocGVyaW9kTnVtYmVyLCBtZXN1cmUpO1xuICAgIH1cblxuICAgIHJldHVybiBldmVudHNEYXRlO1xuICB9XG5cbiAgX2Zvcm1hdERhdGUoYXJnRGF0ZSkge1xuICAgIGxldCBkYXRlID0gbmV3IERhdGUoYXJnRGF0ZSk7XG5cbiAgICByZXR1cm4gYCR7KCgpID0+IHtcbiAgICAgIGxldCBkID0gZGF0ZS5nZXREYXRlKCk7XG4gICAgICByZXR1cm4gZC50b1N0cmluZygpLmxlbmd0aCA+IDEgPyBkIDogJzAnICsgZDtcbiAgICB9KSgpfS8keygoKSA9PiB7XG5cbiAgICAgIGxldCBkID0gZGF0ZS5nZXRNb250aCgpICsgMTtcbiAgICAgIHJldHVybiBkLnRvU3RyaW5nKCkubGVuZ3RoID4gMSA/IGQgOiAnMCcgKyBkO1xuXG4gICAgfSkoKX0vJHtkYXRlLmdldEZ1bGxZZWFyKCl9YDtcbiAgfVxuXG4gIF9ldmVudFNhdGVJc1ZhbGlkKGV2ZW50U3RhdGUpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLkVWRU5UX1NUQVRFUykge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLkVWRU5UX1NUQVRFU1trZXldLm5hbWUgPT09IGV2ZW50U3RhdGUgfHxcbiAgICAgICAgdGhpcy5FVkVOVF9TVEFURVNba2V5XS50eXBlID09PSBldmVudFN0YXRlXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuRVZFTlRfU1RBVEVTW2tleV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIF9nZXRTdGF0ZShjb250ZXh0SWQsIGdyb3VwSWQsIGV2ZW50SWQpIHtcblxuICAgIHJldHVybiB0aGlzLmdldEV2ZW50VGFza3MoZXZlbnRJZCkudGhlbih0YXNrcyA9PiB7XG4gICAgICBsZXQgdGFza3NWYWxpZGF0ZWQgPSB0YXNrcy5maWx0ZXIoZWwgPT4gZWwuZG9uZSk7XG4gICAgICBsZXQgc3RhdGVPYmo7XG5cbiAgICAgIGlmICh0YXNrc1ZhbGlkYXRlZC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgc3RhdGVPYmogPSB0aGlzLkVWRU5UX1NUQVRFUy5kZWNsYXJlZDtcbiAgICAgIH0gZWxzZSBpZiAodGFza3NWYWxpZGF0ZWQubGVuZ3RoID09PSB0YXNrcy5sZW5ndGgpIHtcbiAgICAgICAgc3RhdGVPYmogPSB0aGlzLkVWRU5UX1NUQVRFUy5kb25lO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGVPYmogPSB0aGlzLkVWRU5UX1NUQVRFUy5wcm9jZXNzaW5nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5nZXRFdmVudFN0YXRlTm9kZShjb250ZXh0SWQsIGdyb3VwSWQsIHN0YXRlT2JqLnR5cGUpO1xuXG4gICAgfSlcblxuICB9XG5cbiAgX3N3aXRjaEV2ZW50U3RhdGUoZXZlbnRJZCwgZnJvbVN0YXRlSWQsIHRvU3RhdGVJZCwgY29udGV4dElkKSB7XG5cblxuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UucmVtb3ZlQ2hpbGQoZnJvbVN0YXRlSWQsIGV2ZW50SWQsIHRoaXNcbiAgICAgICAgLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OLCBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFKVxuICAgICAgLnRoZW4ocmVtb3ZlZCA9PiB7XG4gICAgICAgIGlmIChyZW1vdmVkKSB7XG4gICAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dCh0b1N0YXRlSWQsIGV2ZW50SWQsXG4gICAgICAgICAgICAgIGNvbnRleHRJZCxcbiAgICAgICAgICAgICAgdGhpcy5FVkVOVF9TVEFURV9UT19FVkVOVF9SRUxBVElPTixcbiAgICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRSlcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgbGV0IEV2ZW50Tm9kZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRSZWFsTm9kZShldmVudElkKTtcbiAgICAgICAgICAgICAgICBsZXQgbmV3U3RhdGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyh0b1N0YXRlSWQpLnN0YXRlXG4gICAgICAgICAgICAgICAgICAuZ2V0KCk7XG5cblxuICAgICAgICAgICAgICAgIEV2ZW50Tm9kZS5pbmZvLnN0YXRlLnNldChuZXdTdGF0ZSk7XG4gICAgICAgICAgICAgICAgRXZlbnROb2RlLmluZm8uc3RhdGVJZC5zZXQodG9TdGF0ZUlkKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9KVxuXG5cbiAgfVxuXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyAgICAgICAgICAgICAgICAgICAgICAgIEdFVCBJTkZPUk1BVElPTiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgZ2V0VmlzaXRHcm91cHModmlzaXRUeXBlKSB7XG4gICAgbGV0IGNvbnRleHRzID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENvbnRleHRXaXRoVHlwZSh2aXNpdFR5cGUpO1xuICAgIGlmIChjb250ZXh0cy5sZW5ndGggPT09IDApIHJldHVybiBbXTtcblxuICAgIGxldCBjb250ZXh0SWQgPSBjb250ZXh0c1swXS5pbmZvLmlkLmdldCgpO1xuXG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihcbiAgICAgIGNvbnRleHRJZCxcbiAgICAgIHRoaXMuVklTSVRfVFlQRV9UT19HUk9VUF9SRUxBVElPTlxuICAgICkudGhlbihyZXMgPT4ge1xuICAgICAgcmV0dXJuIHJlcy5tYXAoZWwgPT4gZWwuZ2V0KCkpO1xuICAgIH0pO1xuICB9XG5cblxuICBnZXRHcm91cEV2ZW50U3RhdGVzKGNvbnRleHRJZCwgZ3JvdXBJZCkge1xuICAgIGxldCBwcm9taXNlcyA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5FVkVOVF9TVEFURVMpIHtcbiAgICAgIHByb21pc2VzLnB1c2goXG4gICAgICAgIHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoXG4gICAgICAgICAgY29udGV4dElkLFxuICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgdGhpcy5FVkVOVF9TVEFURVNba2V5XS50eXBlXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcbiAgfVxuXG4gIGdldEdyb3VwRXZlbnRzKFxuICAgIGdyb3VwSWQsXG4gICAgVklTSVRfVFlQRVMgPSBbXG4gICAgICB0aGlzLk1BSU5URU5BTkNFX1ZJU0lULFxuICAgICAgdGhpcy5SRUdVTEFUT1JZX1ZJU0lULFxuICAgICAgdGhpcy5TRUNVUklUWV9WSVNJVCxcbiAgICAgIHRoaXMuRElBR05PU1RJQ19WSVNJVFxuICAgIF1cbiAgKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KFZJU0lUX1RZUEVTKSkgVklTSVRfVFlQRVMgPSBbVklTSVRfVFlQRVNdO1xuXG4gICAgcmV0dXJuIFZJU0lUX1RZUEVTLm1hcCh2aXNpdFR5cGUgPT4ge1xuICAgICAgbGV0IHZpc2l0ID0gdGhpcy5WSVNJVFMuZmluZChlbCA9PiB7XG4gICAgICAgIHJldHVybiBlbC50eXBlID09PSB2aXNpdFR5cGU7XG4gICAgICB9KTtcblxuICAgICAgbGV0IGNvbnRleHQgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q29udGV4dCh2aXNpdC5uYW1lKTtcblxuICAgICAgaWYgKHR5cGVvZiBjb250ZXh0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGxldCBjb250ZXh0SWQgPSBjb250ZXh0LmluZm8uaWQuZ2V0KCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JvdXBFdmVudFN0YXRlcyhjb250ZXh0SWQsIGdyb3VwSWQpLnRoZW4oXG4gICAgICAgICAgdmFsdWVzID0+IHtcbiAgICAgICAgICAgIGxldCBwcm9tID0gdmFsdWVzLm1hcChhc3luYyBldmVudFR5cGUgPT4ge1xuICAgICAgICAgICAgICBsZXQgcmVzID0gZXZlbnRUeXBlLmdldCgpO1xuXG4gICAgICAgICAgICAgIHJlc1tcInZpc2l0X3R5cGVcIl0gPSB2aXNpdFR5cGU7XG5cbiAgICAgICAgICAgICAgbGV0IGV2ZW50cyA9IGF3YWl0IFNwaW5hbEdyYXBoU2VydmljZVxuICAgICAgICAgICAgICAgIC5nZXRDaGlsZHJlbihcbiAgICAgICAgICAgICAgICAgIHJlcy5pZCwgW1xuICAgICAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OXG4gICAgICAgICAgICAgICAgICBdKTtcblxuICAgICAgICAgICAgICByZXNbXCJldmVudHNcIl0gPSBldmVudHMubWFwKGVsID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwuZ2V0KCk7XG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb20pLnRoZW4oYWxsRXZlbnRzID0+IHtcbiAgICAgICAgICAgICAgbGV0IHZhbHVlcyA9IHt9O1xuXG4gICAgICAgICAgICAgIGFsbEV2ZW50cy5mb3JFYWNoKHZhbCA9PiB7XG4gICAgICAgICAgICAgICAgdmFsdWVzW3ZhbC5zdGF0ZV0gPSB2YWwuZXZlbnRzO1xuICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIFt2aXNpdFR5cGVdOiB2YWx1ZXNcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZ2V0RXZlbnRUYXNrcyhldmVudElkKSB7XG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihldmVudElkLCBbdGhpc1xuICAgICAgICAuRVZFTlRfVE9fVEFTS19SRUxBVElPTlxuICAgICAgXSlcbiAgICAgIC50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgICAgcmV0dXJuIGNoaWxkcmVuLm1hcChlbCA9PiBlbC5nZXQoKSlcbiAgICAgIH0pXG4gIH1cblxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gICAgICAgICAgICAgICAgICAgICAgICBDb21tZW50IE1hbmFnZXIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gIGFkZENvbW1lbnQodGFza0lkLCB1c2VySWQsIG1lc3NhZ2UpIHtcbiAgICBpZiAobWVzc2FnZSAmJiBtZXNzYWdlLnRyaW0oKS5sZW5ndGggPiAwICYmIHVzZXJJZCkge1xuICAgICAgbGV0IGNvbW1lbnROb2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgIHVzZXJJZDogdXNlcklkLFxuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICB0YXNrSWQ6IHRhc2tJZCxcbiAgICAgICAgZGF0ZTogRGF0ZS5ub3coKVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChjb21tZW50Tm9kZUlkKSB7XG4gICAgICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuYWRkQ2hpbGQodGFza0lkLCBjb21tZW50Tm9kZUlkLCB0aGlzXG4gICAgICAgICAgLlRBU0tfVE9fQ09NTUVOVFNfUkVMQVRJT04sXG4gICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRSk7XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBnZXRUYXNrc0NvbW1lbnRzKHRhc2tJZCkge1xuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4odGFza0lkLCBbdGhpc1xuICAgICAgLlRBU0tfVE9fQ09NTUVOVFNfUkVMQVRJT05cbiAgICBdKS50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgIHJldHVybiBjaGlsZHJlbi5tYXAoZWwgPT4gZWwuZ2V0KCkpO1xuICAgIH0pXG4gIH1cblxufVxuXG5sZXQgc3BpbmFsVmlzaXRTZXJ2aWNlID0gbmV3IFNwaW5hbFZpc2l0U2VydmljZSgpO1xuXG5leHBvcnQgZGVmYXVsdCBzcGluYWxWaXNpdFNlcnZpY2U7Il19