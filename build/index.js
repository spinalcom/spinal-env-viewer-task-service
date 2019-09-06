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
    let currentState = _spinalEnvViewerGraphService.SpinalGraphService.getInfo(eventId).stateId.get();

    return this._getState(contextId, groupId, eventId).then(state => {
      let nextStateId = state.id.get();
      if (nextStateId === currentState) return true;

      //////////////////////////////////////////////////////
      //    Deplacer le child de currentState à nextState //
      //////////////////////////////////////////////////////
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

      console.log("stateObj", stateObj);
      return this.getEventStateNode(contextId, groupId, stateObj.type);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJTcGluYWxWaXNpdFNlcnZpY2UiLCJjb25zdHJ1Y3RvciIsIlZJU0lUX0NPTlRFWFRfTkFNRSIsIkNPTlRFWFRfVFlQRSIsIlZJU0lUX1RZUEUiLCJNQUlOVEVOQU5DRV9WSVNJVCIsIlJFR1VMQVRPUllfVklTSVQiLCJTRUNVUklUWV9WSVNJVCIsIkRJQUdOT1NUSUNfVklTSVQiLCJFVkVOVF9TVEFURVMiLCJPYmplY3QiLCJmcmVlemUiLCJkZWNsYXJlZCIsIm5hbWUiLCJ0eXBlIiwicHJvY2Vzc2luZyIsImRvbmUiLCJWSVNJVFMiLCJNQUlOVEVOQU5DRV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIlJFR1VMQVRPUllfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJTRUNVUklUWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiIsIkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04iLCJHUk9VUF9UT19UQVNLIiwiVklTSVRfVE9fRVZFTlRfUkVMQVRJT04iLCJWSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OIiwiRVZFTlRfU1RBVEVfVE9fRVZFTlRfUkVMQVRJT04iLCJFVkVOVF9UT19UQVNLX1JFTEFUSU9OIiwiZ2V0QWxsVmlzaXRzIiwiYWRkVmlzaXRPbkdyb3VwIiwiZ3JvdXBJZCIsInZpc2l0TmFtZSIsInBlcmlvZGljaXR5TnVtYmVyIiwicGVyaW9kaWNpdHlNZXN1cmUiLCJ2aXNpdFR5cGUiLCJpbnRlcnZlbnRpb25OdW1iZXIiLCJpbnRlcnZlbnRpb25NZXN1cmUiLCJkZXNjcmlwdGlvbiIsIlNwaW5hbEdyYXBoU2VydmljZSIsImdldENoaWxkcmVuIiwidGhlbiIsImNoaWxkcmVuIiwiYXJnTm9kZUlkIiwibGVuZ3RoIiwiY3JlYXRlTm9kZSIsImFkZENoaWxkIiwiU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRSIsIm5vZGUiLCJnZXRJbmZvIiwiZ2V0UHRyVmFsdWUiLCJsc3QiLCJ0YXNrIiwiVmlzaXRNb2RlbCIsIm5vZGVJZCIsInBlcmlvZGljaXR5IiwibnVtYmVyIiwiZ2V0IiwibWVzdXJlIiwiaW50ZXJ2ZW50aW9uIiwicmVhbE5vZGUiLCJnZXRSZWFsTm9kZSIsInB1c2giLCJpbmZvIiwicHRyTmFtZSIsImlkIiwiUHJvbWlzZSIsInJlc29sdmUiLCJhZGRfYXR0ciIsInRhc2tzIiwiUHRyIiwiTHN0IiwibG9hZCIsInZhbHVlIiwiZ2V0R3JvdXBWaXNpdHMiLCJ2aXNpdHlUeXBlIiwicmVzIiwiZ2VuZXJhdGVFdmVudCIsImJlZ2luRGF0ZSIsImVuZERhdGUiLCJldmVudHNEYXRhIiwiY3JlYXRlVmlzaXRDb250ZXh0IiwiZWwiLCJsaW5rR3JvdXBUb1Zpc3RDb250ZXh0IiwiZ2V0RXZlbnRTdGF0ZU5vZGUiLCJzdGF0ZU5vZGUiLCJmb3JFYWNoIiwiZXZlbnRJbmZvIiwiZXZlbnRzRGF0ZSIsIl9nZXREYXRlIiwicGVyaW9kTnVtYmVyIiwicGVyaW9kTWVzdXJlIiwiZGF0ZSIsImFkZEV2ZW50IiwiX2Zvcm1hdERhdGUiLCJEYXRlIiwiZ2V0VGltZSIsImNhdGNoIiwiZXJyIiwiY29uc29sZSIsImxvZyIsInZpc2l0VHlwZUNvbnRleHRJZCIsInN0YXRlSWQiLCJ2aXNpdEluZm8iLCJzdGF0ZSIsImV2ZW50IiwiRXZlbnRNb2RlbCIsImV2ZW50Tm9kZUlkIiwidmlzaXRJZCIsImFkZENoaWxkSW5Db250ZXh0IiwiZXZlbnRJZCIsIkVRVUlQTUVOVFNfVE9fRUxFTUVOVF9SRUxBVElPTiIsIm1hcCIsImNoaWxkIiwiVGFza01vZGVsIiwiZGJpZCIsImJpbUZpbGVJZCIsInRhc2tJZCIsImRiSWQiLCJhbGwiLCJ2aXNpdCIsImZpbmQiLCJjb250ZXh0TmFtZSIsImNvbnRleHQiLCJnZXRDb250ZXh0IiwiYWRkQ29udGV4dCIsIk1vZGVsIiwiY29udGV4dENyZWF0ZWQiLCJyZWplY3QiLCJ2aXNpdENvbnRleHRJZCIsImkiLCJldmVudFNhdGUiLCJfZXZlbnRTYXRlSXNWYWxpZCIsImNvbnRleHRUeXBlIiwicmVsYXRpb25OYW1lIiwidmFsaWRhdGVUYXNrIiwiY29udGV4dElkIiwidGFza05vZGUiLCJzZXQiLCJjdXJyZW50U3RhdGUiLCJfZ2V0U3RhdGUiLCJuZXh0U3RhdGVJZCIsImVuZCIsImRpZmYiLCJ0b0RhdGUiLCJhZGQiLCJhcmdEYXRlIiwiZCIsImdldERhdGUiLCJ0b1N0cmluZyIsImdldE1vbnRoIiwiZ2V0RnVsbFllYXIiLCJldmVudFN0YXRlIiwia2V5IiwidW5kZWZpbmVkIiwiZ2V0RXZlbnRUYXNrcyIsInRhc2tzVmFsaWRhdGVkIiwiZmlsdGVyIiwic3RhdGVPYmoiLCJnZXRWaXNpdEdyb3VwcyIsImNvbnRleHRzIiwiZ2V0Q29udGV4dFdpdGhUeXBlIiwiZ2V0R3JvdXBFdmVudFN0YXRlcyIsInByb21pc2VzIiwiZ2V0R3JvdXBFdmVudHMiLCJWSVNJVF9UWVBFUyIsIkFycmF5IiwiaXNBcnJheSIsInZhbHVlcyIsInByb20iLCJldmVudFR5cGUiLCJldmVudHMiLCJhbGxFdmVudHMiLCJ2YWwiLCJzcGluYWxWaXNpdFNlcnZpY2UiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOztBQUtBOztBQUlBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBOztBQU1BOzs7Ozs7OztBQUVBLE1BQU1BLGtCQUFOLENBQXlCO0FBQ3ZCQyxnQkFBYztBQUNaLFNBQUtDLGtCQUFMLEdBQTBCLGdCQUExQjtBQUNBLFNBQUtDLFlBQUwsR0FBb0IsZUFBcEI7O0FBRUEsU0FBS0MsVUFBTCxHQUFrQixPQUFsQjs7QUFFQSxTQUFLQyxpQkFBTCxHQUF5QixtQkFBekI7QUFDQSxTQUFLQyxnQkFBTCxHQUF3QixrQkFBeEI7QUFDQSxTQUFLQyxjQUFMLEdBQXNCLGdCQUF0QjtBQUNBLFNBQUtDLGdCQUFMLEdBQXdCLGtCQUF4Qjs7QUFFQSxTQUFLQyxZQUFMLEdBQW9CQyxPQUFPQyxNQUFQLENBQWM7QUFDaENDLGdCQUFVO0FBQ1JDLGNBQU0sU0FERTtB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c291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRSxcbiAgU3BpbmFsR3JhcGhTZXJ2aWNlXG59IGZyb20gXCJzcGluYWwtZW52LXZpZXdlci1ncmFwaC1zZXJ2aWNlXCI7XG5cbmltcG9ydCB7XG4gIEVRVUlQTUVOVFNfVE9fRUxFTUVOVF9SRUxBVElPTlxufSBmcm9tIFwic3BpbmFsLWVudi12aWV3ZXItcm9vbS1tYW5hZ2VyL2pzL3NlcnZpY2VcIjtcblxuaW1wb3J0IFZpc2l0TW9kZWwgZnJvbSBcIi4vbW9kZWxzL3Zpc2l0Lm1vZGVsLmpzXCI7XG5pbXBvcnQgRXZlbnRNb2RlbCBmcm9tIFwiLi9tb2RlbHMvZXZlbnQubW9kZWwuanNcIjtcbmltcG9ydCBUYXNrTW9kZWwgZnJvbSBcIi4vbW9kZWxzL3Rhc2subW9kZWwuanNcIjtcblxuaW1wb3J0IHtcbiAgUHRyLFxuICBMc3QsXG4gIE1vZGVsXG59IGZyb20gXCJzcGluYWwtY29yZS1jb25uZWN0b3Jqc190eXBlXCI7XG5cbmltcG9ydCBtb21lbnQgZnJvbSBcIm1vbWVudFwiO1xuXG5jbGFzcyBTcGluYWxWaXNpdFNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLlZJU0lUX0NPTlRFWFRfTkFNRSA9IFwiLnZpc2l0X2NvbnRleHRcIjtcbiAgICB0aGlzLkNPTlRFWFRfVFlQRSA9IFwidmlzaXRfY29udGV4dFwiO1xuXG4gICAgdGhpcy5WSVNJVF9UWVBFID0gXCJ2aXNpdFwiO1xuXG4gICAgdGhpcy5NQUlOVEVOQU5DRV9WSVNJVCA9IFwiTUFJTlRFTkFOQ0VfVklTSVRcIjtcbiAgICB0aGlzLlJFR1VMQVRPUllfVklTSVQgPSBcIlJFR1VMQVRPUllfVklTSVRcIjtcbiAgICB0aGlzLlNFQ1VSSVRZX1ZJU0lUID0gXCJTRUNVUklUWV9WSVNJVFwiO1xuICAgIHRoaXMuRElBR05PU1RJQ19WSVNJVCA9IFwiRElBR05PU1RJQ19WSVNJVFwiO1xuXG4gICAgdGhpcy5FVkVOVF9TVEFURVMgPSBPYmplY3QuZnJlZXplKHtcbiAgICAgIGRlY2xhcmVkOiB7XG4gICAgICAgIG5hbWU6IFwiZMOpY2xhcsOpXCIsXG4gICAgICAgIHR5cGU6IFwiZGVjbGFyZWRcIlxuICAgICAgfSxcbiAgICAgIHByb2Nlc3Npbmc6IHtcbiAgICAgICAgbmFtZTogXCJlbmNvdXJzXCIsXG4gICAgICAgIHR5cGU6IFwicHJvY2Vzc2luZ1wiXG4gICAgICB9LFxuICAgICAgZG9uZToge1xuICAgICAgICBuYW1lOiBcIsOpZmZlY3R1w6lcIixcbiAgICAgICAgdHlwZTogXCJkb25lXCJcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuVklTSVRTID0gT2JqZWN0LmZyZWV6ZShbe1xuICAgICAgICB0eXBlOiB0aGlzLk1BSU5URU5BTkNFX1ZJU0lULFxuICAgICAgICBuYW1lOiBcIk1haW50ZW5hbmNlIHZpc2l0XCJcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6IHRoaXMuUkVHVUxBVE9SWV9WSVNJVCxcbiAgICAgICAgbmFtZTogXCJSZWd1bGF0b3J5IHZpc2l0XCJcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6IHRoaXMuU0VDVVJJVFlfVklTSVQsXG4gICAgICAgIG5hbWU6IFwiU2VjdXJpdHkgVmlzaXRcIlxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogdGhpcy5ESUFHTk9TVElDX1ZJU0lULFxuICAgICAgICBuYW1lOiBcIkRpYWdub3N0aWMgdmlzaXRcIlxuICAgICAgfVxuICAgIF0pO1xuXG4gICAgdGhpcy5NQUlOVEVOQU5DRV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTiA9XG4gICAgICBcIm1haW50ZW5hbmNlVmlzaXRoYXNFdmVudFN0YXRlXCI7XG5cbiAgICB0aGlzLlJFR1VMQVRPUllfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT04gPVxuICAgICAgXCJyZWd1bGF0b3J5VmlzaXRoYXNFdmVudFN0YXRlXCI7XG5cbiAgICB0aGlzLlNFQ1VSSVRZX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OID0gXCJzZWN1cml0eVZpc2l0aGFzRXZlbnRTdGF0ZVwiO1xuXG4gICAgdGhpcy5ESUFHTk9TVElDX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OID1cbiAgICAgIFwiZGlhZ25vc3RpY1Zpc2l0aGFzRXZlbnRTdGF0ZVwiO1xuXG4gICAgdGhpcy5HUk9VUF9UT19UQVNLID0gXCJoYXNWaXNpdFwiO1xuXG4gICAgdGhpcy5WSVNJVF9UT19FVkVOVF9SRUxBVElPTiA9IFwidmlzaXRIYXNFdmVudFwiO1xuXG4gICAgdGhpcy5WSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OID0gXCJ2aXNpdEhhc0dyb3VwXCI7XG4gICAgdGhpcy5FVkVOVF9TVEFURV9UT19FVkVOVF9SRUxBVElPTiA9IFwiaGFzRXZlbnRcIjtcbiAgICB0aGlzLkVWRU5UX1RPX1RBU0tfUkVMQVRJT04gPSBcImhhc1Rhc2tcIjtcbiAgfVxuXG4gIGdldEFsbFZpc2l0cygpIHtcbiAgICByZXR1cm4gdGhpcy5WSVNJVFM7XG4gIH1cblxuICBhZGRWaXNpdE9uR3JvdXAoXG4gICAgZ3JvdXBJZCxcbiAgICB2aXNpdE5hbWUsXG4gICAgcGVyaW9kaWNpdHlOdW1iZXIsXG4gICAgcGVyaW9kaWNpdHlNZXN1cmUsXG4gICAgdmlzaXRUeXBlLFxuICAgIGludGVydmVudGlvbk51bWJlcixcbiAgICBpbnRlcnZlbnRpb25NZXN1cmUsXG4gICAgZGVzY3JpcHRpb25cbiAgKSB7XG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihncm91cElkLCBbdGhpcy5HUk9VUF9UT19UQVNLXSkudGhlbihcbiAgICAgIGNoaWxkcmVuID0+IHtcbiAgICAgICAgbGV0IGFyZ05vZGVJZDtcbiAgICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGFyZ05vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgIG5hbWU6IFwibWFpbnRlbmFuY2VcIlxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkKFxuICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgIGFyZ05vZGVJZCxcbiAgICAgICAgICAgIHRoaXMuR1JPVVBfVE9fVEFTSyxcbiAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5vZGUgPVxuICAgICAgICAgIHR5cGVvZiBhcmdOb2RlSWQgIT09IFwidW5kZWZpbmVkXCIgP1xuICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKGFyZ05vZGVJZCkgOlxuICAgICAgICAgIGNoaWxkcmVuWzBdO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldFB0clZhbHVlKG5vZGUsIHZpc2l0VHlwZSkudGhlbihsc3QgPT4ge1xuICAgICAgICAgIGxldCB0YXNrID0gbmV3IFZpc2l0TW9kZWwoXG4gICAgICAgICAgICB2aXNpdE5hbWUsXG4gICAgICAgICAgICBwZXJpb2RpY2l0eU51bWJlcixcbiAgICAgICAgICAgIHBlcmlvZGljaXR5TWVzdXJlLFxuICAgICAgICAgICAgdmlzaXRUeXBlLFxuICAgICAgICAgICAgaW50ZXJ2ZW50aW9uTnVtYmVyLFxuICAgICAgICAgICAgaW50ZXJ2ZW50aW9uTWVzdXJlLFxuICAgICAgICAgICAgZGVzY3JpcHRpb25cbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbGV0IG5vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgICAgZ3JvdXBJZDogZ3JvdXBJZCxcbiAgICAgICAgICAgICAgbmFtZTogdmlzaXROYW1lLFxuICAgICAgICAgICAgICBwZXJpb2RpY2l0eToge1xuICAgICAgICAgICAgICAgIG51bWJlcjogdGFzay5wZXJpb2RpY2l0eS5udW1iZXIuZ2V0KCksXG4gICAgICAgICAgICAgICAgbWVzdXJlOiB0YXNrLnBlcmlvZGljaXR5Lm1lc3VyZS5nZXQoKVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBpbnRlcnZlbnRpb246IHtcbiAgICAgICAgICAgICAgICBudW1iZXI6IHRhc2suaW50ZXJ2ZW50aW9uLm51bWJlci5nZXQoKSxcbiAgICAgICAgICAgICAgICBtZXN1cmU6IHRhc2suaW50ZXJ2ZW50aW9uLm1lc3VyZS5nZXQoKVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB2aXNpdFR5cGU6IHZpc2l0VHlwZSxcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGFza1xuICAgICAgICAgICk7XG5cbiAgICAgICAgICBsZXQgcmVhbE5vZGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0UmVhbE5vZGUobm9kZUlkKTtcblxuICAgICAgICAgIGxzdC5wdXNoKHJlYWxOb2RlKTtcblxuICAgICAgICAgIHJldHVybiByZWFsTm9kZS5pbmZvO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgZ2V0UHRyVmFsdWUobm9kZSwgcHRyTmFtZSkge1xuICAgIGxldCByZWFsTm9kZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRSZWFsTm9kZShub2RlLmlkLmdldCgpKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIGlmICghcmVhbE5vZGUuaW5mb1twdHJOYW1lXSkge1xuICAgICAgICByZWFsTm9kZS5pbmZvLmFkZF9hdHRyKHB0ck5hbWUsIHtcbiAgICAgICAgICB0YXNrczogbmV3IFB0cihuZXcgTHN0KCkpXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZWFsTm9kZS5pbmZvW3B0ck5hbWVdLnRhc2tzLmxvYWQodmFsdWUgPT4ge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZSh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldEdyb3VwVmlzaXRzKGdyb3VwSWQsIHZpc2l0eVR5cGUpIHtcbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKGdyb3VwSWQsIFt0aGlzLkdST1VQX1RPX1RBU0tdKS50aGVuKFxuICAgICAgcmVzID0+IHtcbiAgICAgICAgbGV0IG5vZGVJZDtcbiAgICAgICAgaWYgKHJlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBub2RlSWQgPSBTcGluYWxHcmFwaFNlcnZpY2UuY3JlYXRlTm9kZSh7XG4gICAgICAgICAgICBuYW1lOiBcIm1haW50ZW5hbmNlXCJcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZChcbiAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICBub2RlSWQsXG4gICAgICAgICAgICB0aGlzLkdST1VQX1RPX1RBU0ssXG4gICAgICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBub2RlID1cbiAgICAgICAgICB0eXBlb2Ygbm9kZUlkICE9PSBcInVuZGVmaW5lZFwiID9cbiAgICAgICAgICBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhub2RlSWQpIDpcbiAgICAgICAgICByZXNbMF07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHRyVmFsdWUobm9kZSwgdmlzaXR5VHlwZSk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGdlbmVyYXRlRXZlbnQodmlzaXRUeXBlLCBncm91cElkLCBiZWdpbkRhdGUsIGVuZERhdGUsIGV2ZW50c0RhdGEpIHtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVWaXNpdENvbnRleHQodmlzaXRUeXBlKVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5saW5rR3JvdXBUb1Zpc3RDb250ZXh0KGVsLmlkLmdldCgpLCBncm91cElkKS50aGVuKFxuICAgICAgICAgIHJlcyA9PiB7XG4gICAgICAgICAgICBpZiAocmVzKSB7XG4gICAgICAgICAgICAgIHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoXG4gICAgICAgICAgICAgICAgZWwuaWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFUy5kZWNsYXJlZC50eXBlXG4gICAgICAgICAgICAgICkudGhlbihzdGF0ZU5vZGUgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBpZCA9IHN0YXRlTm9kZS5pZC5nZXQoKTtcblxuICAgICAgICAgICAgICAgIGV2ZW50c0RhdGEuZm9yRWFjaChldmVudEluZm8gPT4ge1xuICAgICAgICAgICAgICAgICAgbGV0IGV2ZW50c0RhdGUgPSB0aGlzLl9nZXREYXRlKFxuICAgICAgICAgICAgICAgICAgICBiZWdpbkRhdGUsXG4gICAgICAgICAgICAgICAgICAgIGVuZERhdGUsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50SW5mby5wZXJpb2ROdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50SW5mby5wZXJpb2RNZXN1cmVcbiAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgIGV2ZW50c0RhdGUuZm9yRWFjaChkYXRlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudChcbiAgICAgICAgICAgICAgICAgICAgICBlbC5pZC5nZXQoKSxcbiAgICAgICAgICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgICAgICAgICAgIGV2ZW50SW5mbyxcbiAgICAgICAgICAgICAgICAgICAgICBgJHtldmVudEluZm8ubmFtZX0gJHt0aGlzLl9mb3JtYXREYXRlKGRhdGUpfWAsXG4gICAgICAgICAgICAgICAgICAgICAgbmV3IERhdGUoZGF0ZSkuZ2V0VGltZSgpXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZXJyKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgYWRkRXZlbnQodmlzaXRUeXBlQ29udGV4dElkLCBncm91cElkLCBzdGF0ZUlkLCB2aXNpdEluZm8sIG5hbWUsIGRhdGUpIHtcbiAgICBsZXQgc3RhdGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhzdGF0ZUlkKS5zdGF0ZS5nZXQoKTtcblxuICAgIGxldCBldmVudCA9IG5ldyBFdmVudE1vZGVsKG5hbWUsIGRhdGUsIHN0YXRlLCBncm91cElkKTtcblxuICAgIGxldCBldmVudE5vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgZGF0ZTogZGF0ZSxcbiAgICAgICAgc3RhdGVJZDogc3RhdGVJZCxcbiAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgICBncm91cElkOiBncm91cElkLFxuICAgICAgICB2aXNpdElkOiB2aXNpdEluZm8uaWRcbiAgICAgIH0sXG4gICAgICBldmVudFxuICAgICk7XG5cbiAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkSW5Db250ZXh0KFxuICAgICAgICBzdGF0ZUlkLFxuICAgICAgICBldmVudE5vZGVJZCxcbiAgICAgICAgdmlzaXRUeXBlQ29udGV4dElkLFxuICAgICAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OLFxuICAgICAgICBTUElOQUxfUkVMQVRJT05fUFRSX0xTVF9UWVBFXG4gICAgICApXG4gICAgICAudGhlbihlbCA9PiB7XG4gICAgICAgIGlmIChlbCkgcmV0dXJuIGV2ZW50Tm9kZUlkO1xuICAgICAgfSlcbiAgICAgIC50aGVuKGV2ZW50SWQgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGV2ZW50SWQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENoaWxkcmVuKGdyb3VwSWQsIFtcbiAgICAgICAgICAgIEVRVUlQTUVOVFNfVE9fRUxFTUVOVF9SRUxBVElPTlxuICAgICAgICAgIF0pLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgICAgICAgICAgY2hpbGRyZW4ubWFwKGNoaWxkID0+IHtcbiAgICAgICAgICAgICAgbGV0IG5hbWUgPSBgJHtjaGlsZC5uYW1lLmdldCgpfWA7XG4gICAgICAgICAgICAgIGxldCB0YXNrID0gbmV3IFRhc2tNb2RlbChcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGNoaWxkLmRiaWQuZ2V0KCksXG4gICAgICAgICAgICAgICAgY2hpbGQuYmltRmlsZUlkLmdldCgpLFxuICAgICAgICAgICAgICAgIHZpc2l0SW5mby5uYW1lLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICBsZXQgdGFza0lkID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmNyZWF0ZU5vZGUoe1xuICAgICAgICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgICAgIHR5cGU6IFwidGFza1wiLFxuICAgICAgICAgICAgICAgICAgZGJJZDogY2hpbGQuZGJpZC5nZXQoKSxcbiAgICAgICAgICAgICAgICAgIGJpbUZpbGVJZDogY2hpbGQuYmltRmlsZUlkLmdldCgpLFxuICAgICAgICAgICAgICAgICAgdmlzaXRJZDogdmlzaXRJbmZvLmlkLFxuICAgICAgICAgICAgICAgICAgZXZlbnRJZDogZXZlbnRJZCxcbiAgICAgICAgICAgICAgICAgIGdyb3VwSWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICAgICAgICBkb25lOiBmYWxzZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdGFza1xuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICAgICAgU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENoaWxkSW5Db250ZXh0KFxuICAgICAgICAgICAgICAgICAgZXZlbnRJZCxcbiAgICAgICAgICAgICAgICAgIHRhc2tJZCxcbiAgICAgICAgICAgICAgICAgIHZpc2l0VHlwZUNvbnRleHRJZCxcbiAgICAgICAgICAgICAgICAgIHRoaXMuRVZFTlRfVE9fVEFTS19SRUxBVElPTixcbiAgICAgICAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZChcbiAgICAgICAgICAgICAgICAgIHZpc2l0SW5mby5pZCxcbiAgICAgICAgICAgICAgICAgIGV2ZW50SWQsXG4gICAgICAgICAgICAgICAgICB0aGlzLlZJU0lUX1RPX0VWRU5UX1JFTEFUSU9OLFxuICAgICAgICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBjcmVhdGVWaXNpdENvbnRleHQodmlzaXRUeXBlKSB7XG4gICAgbGV0IHZpc2l0ID0gdGhpcy5WSVNJVFMuZmluZChlbCA9PiB7XG4gICAgICByZXR1cm4gZWwudHlwZSA9PT0gdmlzaXRUeXBlO1xuICAgIH0pO1xuXG4gICAgaWYgKHR5cGVvZiB2aXNpdCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgY29uc3QgY29udGV4dE5hbWUgPSBgJHt2aXNpdC5uYW1lfWA7XG5cbiAgICAgIGxldCBjb250ZXh0ID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENvbnRleHQoY29udGV4dE5hbWUpO1xuICAgICAgaWYgKHR5cGVvZiBjb250ZXh0ICE9PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbnRleHRcbiAgICAgICAgLmluZm8pO1xuXG4gICAgICByZXR1cm4gU3BpbmFsR3JhcGhTZXJ2aWNlLmFkZENvbnRleHQoXG4gICAgICAgIGNvbnRleHROYW1lLFxuICAgICAgICB2aXNpdFR5cGUsXG4gICAgICAgIG5ldyBNb2RlbCh7XG4gICAgICAgICAgbmFtZTogdGhpcy5WSVNJVF9DT05URVhUX05BTUVcbiAgICAgICAgfSlcbiAgICAgICkudGhlbihjb250ZXh0Q3JlYXRlZCA9PiB7XG4gICAgICAgIHJldHVybiBjb250ZXh0Q3JlYXRlZC5pbmZvO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcInZpc2l0Tm90Rm91bmRcIik7XG4gICAgfVxuICB9XG5cbiAgbGlua0dyb3VwVG9WaXN0Q29udGV4dCh2aXNpdENvbnRleHRJZCwgZ3JvdXBJZCkge1xuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4odmlzaXRDb250ZXh0SWQsIFtcbiAgICAgICAgdGhpcy5WSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OXG4gICAgICBdKVxuICAgICAgLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZHJlbltpXS5pZC5nZXQoKTtcbiAgICAgICAgICBpZiAoY2hpbGQgPT09IGdyb3VwSWQpIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGVsID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dChcbiAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgdGhpcy5WSVNJVF9UWVBFX1RPX0dST1VQX1JFTEFUSU9OLFxuICAgICAgICAgICAgU1BJTkFMX1JFTEFUSU9OX1BUUl9MU1RfVFlQRVxuICAgICAgICAgICkudGhlbihhc3luYyByZXMgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdldEV2ZW50U3RhdGVOb2RlKFxuICAgICAgICAgICAgICAgIHZpc2l0Q29udGV4dElkLFxuICAgICAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICAgICAgdGhpcy5FVkVOVF9TVEFURVMucHJvY2Vzc2luZy50eXBlXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2V0RXZlbnRTdGF0ZU5vZGUoXG4gICAgICAgICAgICAgICAgdmlzaXRDb250ZXh0SWQsXG4gICAgICAgICAgICAgICAgZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFUy5kb25lLnR5cGVcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgZ2V0RXZlbnRTdGF0ZU5vZGUodmlzaXRDb250ZXh0SWQsIGdyb3VwSWQsIGV2ZW50U2F0ZSkge1xuICAgIGxldCBldmVudCA9IHRoaXMuX2V2ZW50U2F0ZUlzVmFsaWQoZXZlbnRTYXRlKTtcblxuICAgIGlmICh0eXBlb2YgZXZlbnQgPT09IFwidW5kZWZpbmVkXCIpIHJldHVybjtcblxuICAgIGxldCBjb250ZXh0VHlwZSA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRJbmZvKHZpc2l0Q29udGV4dElkKS50eXBlLmdldCgpO1xuICAgIGxldCByZWxhdGlvbk5hbWU7XG5cbiAgICBzd2l0Y2ggKGNvbnRleHRUeXBlKSB7XG4gICAgICBjYXNlIHRoaXMuTUFJTlRFTkFOQ0VfVklTSVQ6XG4gICAgICAgIHJlbGF0aW9uTmFtZSA9IHRoaXMuTUFJTlRFTkFOQ0VfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT047XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLlNFQ1VSSVRZX1ZJU0lUOlxuICAgICAgICByZWxhdGlvbk5hbWUgPSB0aGlzLlNFQ1VSSVRZX1ZJU0lUX0VWRU5UX1NUQVRFX1JFTEFUSU9OO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdGhpcy5ESUFHTk9TVElDX1ZJU0lUOlxuICAgICAgICByZWxhdGlvbk5hbWUgPSB0aGlzLkRJQUdOT1NUSUNfVklTSVRfRVZFTlRfU1RBVEVfUkVMQVRJT047XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLlJFR1VMQVRPUllfVklTSVQ6XG4gICAgICAgIHJlbGF0aW9uTmFtZSA9IHRoaXMuUkVHVUxBVE9SWV9WSVNJVF9FVkVOVF9TVEFURV9SRUxBVElPTjtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5nZXRDaGlsZHJlbihncm91cElkLCBbcmVsYXRpb25OYW1lXSlcbiAgICAgIC50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG5hbWUgPSBjaGlsZHJlbltpXS5uYW1lLmdldCgpO1xuICAgICAgICAgIGNvbnN0IHR5cGUgPSBjaGlsZHJlbltpXS5zdGF0ZS5nZXQoKTtcblxuICAgICAgICAgIGlmIChuYW1lID09PSBldmVudFNhdGUgfHwgdHlwZSA9PT0gZXZlbnRTYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gY2hpbGRyZW5baV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnRoZW4oZWwgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGVsID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgbGV0IGFyZ05vZGVJZCA9IFNwaW5hbEdyYXBoU2VydmljZS5jcmVhdGVOb2RlKHtcbiAgICAgICAgICAgIG5hbWU6IGV2ZW50Lm5hbWUsXG4gICAgICAgICAgICBzdGF0ZTogZXZlbnQudHlwZSxcbiAgICAgICAgICAgIGdyb3VwSWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICB0eXBlOiBcIkV2ZW50U3RhdGVcIlxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIFNwaW5hbEdyYXBoU2VydmljZS5hZGRDaGlsZEluQ29udGV4dChcbiAgICAgICAgICAgIGdyb3VwSWQsXG4gICAgICAgICAgICBhcmdOb2RlSWQsXG4gICAgICAgICAgICB2aXNpdENvbnRleHRJZCxcbiAgICAgICAgICAgIHJlbGF0aW9uTmFtZSxcbiAgICAgICAgICAgIFNQSU5BTF9SRUxBVElPTl9QVFJfTFNUX1RZUEVcbiAgICAgICAgICApLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgIGlmIChyZXMpIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhhcmdOb2RlSWQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBlbDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICB2YWxpZGF0ZVRhc2soY29udGV4dElkLCBncm91cElkLCBldmVudElkLCB0YXNrSWQpIHtcbiAgICBsZXQgdGFza05vZGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0UmVhbE5vZGUodGFza0lkKTtcbiAgICB0YXNrTm9kZS5pbmZvLmRvbmUuc2V0KCF0YXNrTm9kZS5pbmZvLmRvbmUuZ2V0KCkpO1xuICAgIGxldCBjdXJyZW50U3RhdGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0SW5mbyhldmVudElkKS5zdGF0ZUlkLmdldCgpO1xuXG4gICAgcmV0dXJuIHRoaXMuX2dldFN0YXRlKGNvbnRleHRJZCwgZ3JvdXBJZCwgZXZlbnRJZCkudGhlbihzdGF0ZSA9PiB7XG4gICAgICBsZXQgbmV4dFN0YXRlSWQgPSBzdGF0ZS5pZC5nZXQoKTtcbiAgICAgIGlmIChuZXh0U3RhdGVJZCA9PT0gY3VycmVudFN0YXRlKSByZXR1cm4gdHJ1ZTtcblxuICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgICAvLyAgICBEZXBsYWNlciBsZSBjaGlsZCBkZSBjdXJyZW50U3RhdGUgw6AgbmV4dFN0YXRlIC8vXG4gICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIH0pO1xuXG4gIH1cblxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgUFJJVkFURVMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gIF9nZXREYXRlKGJlZ2luRGF0ZSwgZW5kRGF0ZSwgcGVyaW9kTnVtYmVyLCBwZXJpb2RNZXN1cmUpIHtcbiAgICBsZXQgbWVzdXJlID0gW1wiZGF5c1wiLCBcIndlZWtzXCIsIFwibW9udGhzXCIsIFwieWVhcnNcIl1bcGVyaW9kTWVzdXJlXTtcblxuICAgIGxldCBldmVudHNEYXRlID0gW107XG5cbiAgICBsZXQgZGF0ZSA9IG1vbWVudChiZWdpbkRhdGUpO1xuICAgIGxldCBlbmQgPSBtb21lbnQoZW5kRGF0ZSk7XG5cbiAgICB3aGlsZSAoZW5kLmRpZmYoZGF0ZSkgPj0gMCkge1xuICAgICAgZXZlbnRzRGF0ZS5wdXNoKGRhdGUudG9EYXRlKCkpO1xuXG4gICAgICBkYXRlID0gZGF0ZS5hZGQocGVyaW9kTnVtYmVyLCBtZXN1cmUpO1xuICAgIH1cblxuICAgIHJldHVybiBldmVudHNEYXRlO1xuICB9XG5cbiAgX2Zvcm1hdERhdGUoYXJnRGF0ZSkge1xuICAgIGxldCBkYXRlID0gbmV3IERhdGUoYXJnRGF0ZSk7XG5cbiAgICByZXR1cm4gYCR7KCgpID0+IHtcbiAgICAgIGxldCBkID0gZGF0ZS5nZXREYXRlKCk7XG4gICAgICByZXR1cm4gZC50b1N0cmluZygpLmxlbmd0aCA+IDEgPyBkIDogJzAnICsgZDtcbiAgICB9KSgpfS8keygoKSA9PiB7XG5cbiAgICAgIGxldCBkID0gZGF0ZS5nZXRNb250aCgpICsgMTtcbiAgICAgIHJldHVybiBkLnRvU3RyaW5nKCkubGVuZ3RoID4gMSA/IGQgOiAnMCcgKyBkO1xuXG4gICAgfSkoKX0vJHtkYXRlLmdldEZ1bGxZZWFyKCl9YDtcbiAgfVxuXG4gIF9ldmVudFNhdGVJc1ZhbGlkKGV2ZW50U3RhdGUpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLkVWRU5UX1NUQVRFUykge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLkVWRU5UX1NUQVRFU1trZXldLm5hbWUgPT09IGV2ZW50U3RhdGUgfHxcbiAgICAgICAgdGhpcy5FVkVOVF9TVEFURVNba2V5XS50eXBlID09PSBldmVudFN0YXRlXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuRVZFTlRfU1RBVEVTW2tleV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIF9nZXRTdGF0ZShjb250ZXh0SWQsIGdyb3VwSWQsIGV2ZW50SWQpIHtcblxuICAgIHJldHVybiB0aGlzLmdldEV2ZW50VGFza3MoZXZlbnRJZCkudGhlbih0YXNrcyA9PiB7XG4gICAgICBsZXQgdGFza3NWYWxpZGF0ZWQgPSB0YXNrcy5maWx0ZXIoZWwgPT4gZWwuZG9uZSk7XG4gICAgICBsZXQgc3RhdGVPYmo7XG5cbiAgICAgIGlmICh0YXNrc1ZhbGlkYXRlZC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgc3RhdGVPYmogPSB0aGlzLkVWRU5UX1NUQVRFUy5kZWNsYXJlZDtcbiAgICAgIH0gZWxzZSBpZiAodGFza3NWYWxpZGF0ZWQubGVuZ3RoID09PSB0YXNrcy5sZW5ndGgpIHtcbiAgICAgICAgc3RhdGVPYmogPSB0aGlzLkVWRU5UX1NUQVRFUy5kb25lO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGVPYmogPSB0aGlzLkVWRU5UX1NUQVRFUy5wcm9jZXNzaW5nO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZyhcInN0YXRlT2JqXCIsIHN0YXRlT2JqKTtcbiAgICAgIHJldHVybiB0aGlzLmdldEV2ZW50U3RhdGVOb2RlKGNvbnRleHRJZCwgZ3JvdXBJZCwgc3RhdGVPYmoudHlwZSk7XG5cbiAgICB9KVxuXG4gIH1cblxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gICAgICAgICAgICAgICAgICAgICAgICBHRVQgSU5GT1JNQVRJT04gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gIGdldFZpc2l0R3JvdXBzKHZpc2l0VHlwZSkge1xuICAgIGxldCBjb250ZXh0cyA9IFNwaW5hbEdyYXBoU2VydmljZS5nZXRDb250ZXh0V2l0aFR5cGUodmlzaXRUeXBlKTtcbiAgICBpZiAoY29udGV4dHMubGVuZ3RoID09PSAwKSByZXR1cm4gW107XG5cbiAgICBsZXQgY29udGV4dElkID0gY29udGV4dHNbMF0uaW5mby5pZC5nZXQoKTtcblxuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oXG4gICAgICBjb250ZXh0SWQsXG4gICAgICB0aGlzLlZJU0lUX1RZUEVfVE9fR1JPVVBfUkVMQVRJT05cbiAgICApLnRoZW4ocmVzID0+IHtcbiAgICAgIHJldHVybiByZXMubWFwKGVsID0+IGVsLmdldCgpKTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgZ2V0R3JvdXBFdmVudFN0YXRlcyhjb250ZXh0SWQsIGdyb3VwSWQpIHtcbiAgICBsZXQgcHJvbWlzZXMgPSBbXTtcblxuICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuRVZFTlRfU1RBVEVTKSB7XG4gICAgICBwcm9taXNlcy5wdXNoKFxuICAgICAgICB0aGlzLmdldEV2ZW50U3RhdGVOb2RlKFxuICAgICAgICAgIGNvbnRleHRJZCxcbiAgICAgICAgICBncm91cElkLFxuICAgICAgICAgIHRoaXMuRVZFTlRfU1RBVEVTW2tleV0udHlwZVxuICAgICAgICApXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcyk7XG4gIH1cblxuICBnZXRHcm91cEV2ZW50cyhcbiAgICBncm91cElkLFxuICAgIFZJU0lUX1RZUEVTID0gW1xuICAgICAgdGhpcy5NQUlOVEVOQU5DRV9WSVNJVCxcbiAgICAgIHRoaXMuUkVHVUxBVE9SWV9WSVNJVCxcbiAgICAgIHRoaXMuU0VDVVJJVFlfVklTSVQsXG4gICAgICB0aGlzLkRJQUdOT1NUSUNfVklTSVRcbiAgICBdXG4gICkge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShWSVNJVF9UWVBFUykpIFZJU0lUX1RZUEVTID0gW1ZJU0lUX1RZUEVTXTtcblxuICAgIHJldHVybiBWSVNJVF9UWVBFUy5tYXAodmlzaXRUeXBlID0+IHtcbiAgICAgIGxldCB2aXNpdCA9IHRoaXMuVklTSVRTLmZpbmQoZWwgPT4ge1xuICAgICAgICByZXR1cm4gZWwudHlwZSA9PT0gdmlzaXRUeXBlO1xuICAgICAgfSk7XG5cbiAgICAgIGxldCBjb250ZXh0ID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldENvbnRleHQodmlzaXQubmFtZSk7XG5cbiAgICAgIGlmICh0eXBlb2YgY29udGV4dCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBsZXQgY29udGV4dElkID0gY29udGV4dC5pbmZvLmlkLmdldCgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyb3VwRXZlbnRTdGF0ZXMoY29udGV4dElkLCBncm91cElkKS50aGVuKFxuICAgICAgICAgIHZhbHVlcyA9PiB7XG4gICAgICAgICAgICBsZXQgcHJvbSA9IHZhbHVlcy5tYXAoYXN5bmMgZXZlbnRUeXBlID0+IHtcbiAgICAgICAgICAgICAgbGV0IHJlcyA9IGV2ZW50VHlwZS5nZXQoKTtcblxuICAgICAgICAgICAgICByZXNbXCJ2aXNpdF90eXBlXCJdID0gdmlzaXRUeXBlO1xuXG4gICAgICAgICAgICAgIGxldCBldmVudHMgPSBhd2FpdCBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oXG4gICAgICAgICAgICAgICAgcmVzLmlkLCBbXG4gICAgICAgICAgICAgICAgICB0aGlzLkVWRU5UX1NUQVRFX1RPX0VWRU5UX1JFTEFUSU9OXG4gICAgICAgICAgICAgICAgXSk7XG5cbiAgICAgICAgICAgICAgcmVzW1wiZXZlbnRzXCJdID0gZXZlbnRzLm1hcChlbCA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsLmdldCgpO1xuICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9tKS50aGVuKGFsbEV2ZW50cyA9PiB7XG4gICAgICAgICAgICAgIGxldCB2YWx1ZXMgPSB7fTtcblxuICAgICAgICAgICAgICBhbGxFdmVudHMuZm9yRWFjaCh2YWwgPT4ge1xuICAgICAgICAgICAgICAgIHZhbHVlc1t2YWwuc3RhdGVdID0gdmFsLmV2ZW50cztcbiAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBbdmlzaXRUeXBlXTogdmFsdWVzXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGdldEV2ZW50VGFza3MoZXZlbnRJZCkge1xuICAgIHJldHVybiBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0Q2hpbGRyZW4oZXZlbnRJZCwgW3RoaXNcbiAgICAgICAgLkVWRU5UX1RPX1RBU0tfUkVMQVRJT05cbiAgICAgIF0pXG4gICAgICAudGhlbihjaGlsZHJlbiA9PiB7XG4gICAgICAgIHJldHVybiBjaGlsZHJlbi5tYXAoZWwgPT4gZWwuZ2V0KCkpXG4gICAgICB9KVxuICB9XG5cbn1cblxubGV0IHNwaW5hbFZpc2l0U2VydmljZSA9IG5ldyBTcGluYWxWaXNpdFNlcnZpY2UoKTtcblxuZXhwb3J0IGRlZmF1bHQgc3BpbmFsVmlzaXRTZXJ2aWNlOyJdfQ==