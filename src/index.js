import {
  SPINAL_RELATION_PTR_LST_TYPE,
  SpinalGraphService
} from "spinal-env-viewer-graph-service";

import {
  EQUIPMENTS_TO_ELEMENT_RELATION
} from "spinal-env-viewer-room-manager/js/service";

import VisitModel from "./models/visit.model.js";
import EventModel from "./models/event.model.js";
import TaskModel from "./models/task.model.js";

import {
  Ptr,
  Lst,
  Model
} from "spinal-core-connectorjs_type";

import moment from "moment";

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


    this.MAINTENANCE_VISIT_EVENT_STATE_RELATION =
      "maintenanceVisithasEventState";

    this.REGULATORY_VISIT_EVENT_STATE_RELATION =
      "regulatoryVisithasEventState";

    this.SECURITY_VISIT_EVENT_STATE_RELATION = "securityVisithasEventState";

    this.DIAGNOSTIC_VISIT_EVENT_STATE_RELATION =
      "diagnosticVisithasEventState";

    this.GROUP_TO_TASK = "hasVisit";

    this.VISIT_TO_EVENT_RELATION = "visitHasEvent";

    this.VISIT_TYPE_TO_GROUP_RELATION = "visitHasGroup";
    this.EVENT_STATE_TO_EVENT_RELATION = "hasEvent";
    this.EVENT_TO_TASK_RELATION = "hasTask";
  }

  getAllVisits() {
    return this.VISITS;
  }

  addVisitOnGroup(
    groupId,
    visitName,
    periodicityNumber,
    periodicityMesure,
    visitType,
    interventionNumber,
    interventionMesure,
    description
  ) {
    return SpinalGraphService.getChildren(groupId, [this.GROUP_TO_TASK]).then(
      children => {
        let argNodeId;
        if (children.length === 0) {
          argNodeId = SpinalGraphService.createNode({
            name: "maintenance"
          });

          SpinalGraphService.addChild(
            groupId,
            argNodeId,
            this.GROUP_TO_TASK,
            SPINAL_RELATION_PTR_LST_TYPE
          );
        }

        let node =
          typeof argNodeId !== "undefined" ?
          SpinalGraphService.getInfo(argNodeId) :
          children[0];

        return this.getPtrValue(node, visitType).then(lst => {
          let task = new VisitModel(
            visitName,
            periodicityNumber,
            periodicityMesure,
            visitType,
            interventionNumber,
            interventionMesure,
            description
          );

          let nodeId = SpinalGraphService.createNode({
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
            },
            task
          );

          let realNode = SpinalGraphService.getRealNode(nodeId);

          lst.push(realNode);

          return realNode.info;
        });
      }
    );
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
      })
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

    return this.getEventsBetweenTwoDate(visitId, beginDate, endDate).then(
      events => {
        events.forEach(el => {
          SpinalGraphService.removeFromGraph(el.id);
        });

        return true;

      })

  }


  getEventsBetweenTwoDate(visitId, beginDate, endDate) {

    return SpinalGraphService.getChildren(visitId, [this
      .VISIT_TO_EVENT_RELATION
    ]).then((children) => {

      children = children.map(el => el.get());

      return children.filter(el => {
        return el.date >= beginDate && el.date <= endDate;
      })

    })

  }

  removeVisit(visitId) {
    let info = SpinalGraphService.getInfo(visitId);
    if (info) {
      let groupId = info.groupId.get();
      let visitContextType = info.visitType.get();

      return this.getGroupVisits(groupId, visitContextType).then(
        res => {
          for (let index = 0; index < res.length; index++) {
            const resVisitId = res[index].info.id.get();
            if (resVisitId == visitId) {
              res.remove(res[index]);
              return true;
            }
          }
          return false;
        })
    } else {
      return Promise.resolve(false);
    }
  }

  editVisit(visitId, newValuesObj) {
    if (typeof newValuesObj !== "object") {
      return false;
    }

    let visitNode = SpinalGraphService.getRealNode(visitId);

    if (typeof visitNode !== "undefined") {
      for (const key in newValuesObj) {
        const value = newValuesObj[key];

        if (typeof value === "string" && typeof visitNode.info[key] !==
          "undefined") {

          visitNode.info[key].set(value);

        } else if (typeof value === "object" && typeof visitNode.info[key] !==
          "undefined") {

          for (const key2 in value) {
            const value2 = value[key2];


            if (typeof visitNode.info[key][key2] !== "undefined") {

              if (key === "intervention" && key2 === "mesure") {

                if (typeof value2 !== "undefined") {

                  visitNode.info[key][key2].set(new Choice(
                    value2, [
                      "minute(s)", "day(s)",
                      "week(s)", "month(s)",
                      "year(s)"
                    ]));
                } else {
                  visitNode.info[key][key2].set(NaN);
                }

              } else if (key === "periodicity" && key2 === "mesure") {

                visitNode.info[key][key2].set(new Choice(value2, [
                  "day(s)", "week(s)",
                  "month(s)",
                  "year(s)"
                ]));
              } else {
                typeof value2 !== "undefined" ? visitNode.info[key][key2].set(
                  value2) : visitNode.info[key][key2].set(NaN);
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
    let realNode = SpinalGraphService.getRealNode(node.id.get());

    return new Promise(resolve => {
      if (!realNode.info[ptrName]) {
        realNode.info.add_attr(ptrName, {
          tasks: new Ptr(new Lst())
        });
      }

      realNode.info[ptrName].tasks.load(value => {
        return resolve(value);
      });
    });
  }

  getGroupVisits(groupId, visityType) {
    return SpinalGraphService.getChildren(groupId, [this.GROUP_TO_TASK]).then(
      res => {
        let nodeId;
        if (res.length === 0) {
          nodeId = SpinalGraphService.createNode({
            name: "maintenance"
          });

          SpinalGraphService.addChild(
            groupId,
            nodeId,
            this.GROUP_TO_TASK,
            SPINAL_RELATION_PTR_LST_TYPE
          );
        }

        let node =
          typeof nodeId !== "undefined" ?
          SpinalGraphService.getInfo(nodeId) :
          res[0];

        return this.getPtrValue(node, visityType);
      }
    );
  }

  generateEvent(visitType, groupId, beginDate, endDate, eventsData) {
    return this.createVisitContext(visitType)
      .then(el => {
        return this.linkGroupToVistContext(el.id.get(), groupId).then(
          res => {
            if (res) {
              this.getEventStateNode(
                el.id.get(),
                groupId,
                this.EVENT_STATES.declared.type
              ).then(stateNode => {
                let id = stateNode.id.get();

                eventsData.forEach(eventInfo => {
                  let eventsDate = this._getDate(
                    beginDate,
                    endDate,
                    eventInfo.periodNumber,
                    eventInfo.periodMesure
                  );

                  eventsDate.forEach(date => {
                    this.addEvent(
                      el.id.get(),
                      groupId,
                      id,
                      eventInfo,
                      `${eventInfo.name}`,
                      new Date(date).getTime()
                    );
                  });
                });
              });
            }
          });
      })
      .catch(err => {
        console.log(err);
        return Promise.resolve(err);
      });
  }

  addEvent(visitTypeContextId, groupId, stateId, visitInfo, name, date) {
    let state = SpinalGraphService.getInfo(stateId).state.get();

    let event = new EventModel(name, date, state, groupId);

    let eventNodeId = SpinalGraphService.createNode({
        name: name,
        date: date,
        stateId: stateId,
        state: state,
        groupId: groupId,
        visitId: visitInfo.id
      },
      event
    );

    return SpinalGraphService.addChildInContext(
        stateId,
        eventNodeId,
        visitTypeContextId,
        this.EVENT_STATE_TO_EVENT_RELATION,
        SPINAL_RELATION_PTR_LST_TYPE
      )
      .then(el => {
        if (el) return eventNodeId;
      })
      .then(eventId => {
        if (typeof eventId !== "undefined") {
          return SpinalGraphService.getChildren(groupId, [
            EQUIPMENTS_TO_ELEMENT_RELATION
          ]).then(children => {
            children.map(child => {
              let name = `${child.name.get()}`;
              let task = new TaskModel(
                name,
                child.dbid.get(),
                child.bimFileId.get(),
                visitInfo.name,
                0
              );

              let taskId = SpinalGraphService.createNode({
                  name: name,
                  type: "task",
                  dbId: child.dbid.get(),
                  bimFileId: child.bimFileId.get(),
                  visitId: visitInfo.id,
                  eventId: eventId,
                  groupId: groupId,
                  done: false
                },
                task
              );

              return Promise.all([
                SpinalGraphService.addChildInContext(
                  eventId,
                  taskId,
                  visitTypeContextId,
                  this.EVENT_TO_TASK_RELATION,
                  SPINAL_RELATION_PTR_LST_TYPE
                ),
                SpinalGraphService.addChild(
                  visitInfo.id,
                  eventId,
                  this.VISIT_TO_EVENT_RELATION,
                  SPINAL_RELATION_PTR_LST_TYPE
                )
              ]);
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

      let context = SpinalGraphService.getContext(contextName);
      if (typeof context !== "undefined") return Promise.resolve(context
        .info);

      return SpinalGraphService.addContext(
        contextName,
        visitType,
        new Model({
          name: this.VISIT_CONTEXT_NAME
        })
      ).then(contextCreated => {
        return contextCreated.info;
      });
    } else {
      return Promise.reject("visitNotFound");
    }
  }

  linkGroupToVistContext(visitContextId, groupId) {
    return SpinalGraphService.getChildren(visitContextId, [
        this.VISIT_TYPE_TO_GROUP_RELATION
      ])
      .then(children => {
        for (let i = 0; i < children.length; i++) {
          const child = children[i].id.get();
          if (child === groupId) return true;
        }
      })
      .then(el => {
        if (typeof el === "undefined") {
          return SpinalGraphService.addChildInContext(
            visitContextId,
            groupId,
            visitContextId,
            this.VISIT_TYPE_TO_GROUP_RELATION,
            SPINAL_RELATION_PTR_LST_TYPE
          ).then(async res => {
            if (res) {
              await this.getEventStateNode(
                visitContextId,
                groupId,
                this.EVENT_STATES.processing.type
              );
              await this.getEventStateNode(
                visitContextId,
                groupId,
                this.EVENT_STATES.done.type
              );
            }

            return res;
          });
        } else {
          return el;
        }
      });
  }

  getEventStateNode(visitContextId, groupId, eventSate) {
    let event = this._eventSateIsValid(eventSate);

    if (typeof event === "undefined") return;

    let contextType = SpinalGraphService.getInfo(visitContextId).type.get();
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

    return SpinalGraphService.getChildren(groupId, [relationName])
      .then(children => {
        for (let i = 0; i < children.length; i++) {
          const name = children[i].name.get();
          const type = children[i].state.get();

          if (name === eventSate || type === eventSate) {
            return children[i];
          }
        }
      })
      .then(el => {
        if (typeof el === "undefined") {
          let argNodeId = SpinalGraphService.createNode({
            name: event.name,
            state: event.type,
            groupId: groupId,
            type: "EventState"
          });

          return SpinalGraphService.addChildInContext(
            groupId,
            argNodeId,
            visitContextId,
            relationName,
            SPINAL_RELATION_PTR_LST_TYPE
          ).then(res => {
            if (res) return SpinalGraphService.getInfo(argNodeId);
          });
        } else {
          return el;
        }
      });
  }

  validateTask(contextId, groupId, eventId, taskId) {
    let taskNode = SpinalGraphService.getRealNode(taskId);
    taskNode.info.done.set(!taskNode.info.done.get());

    let currentStateId = SpinalGraphService.getInfo(eventId).stateId.get();

    return this._getState(contextId, groupId, eventId).then(nextState => {

      let nextStateId = nextState.id.get();

      if (nextStateId === currentStateId) return true;

      return this._switchEventState(eventId, currentStateId, nextStateId,
        contextId);

    });

  }



  ////////////////////////////////////////////////////////////////////////
  //                            PRIVATES                                //
  ////////////////////////////////////////////////////////////////////////

  _getDate(beginDate, endDate, periodNumber, periodMesure) {
    let mesure = ["days", "weeks", "months", "years"][periodMesure];

    let eventsDate = [];

    let date = moment(beginDate);
    let end = moment(endDate);

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
      if (
        this.EVENT_STATES[key].name === eventState ||
        this.EVENT_STATES[key].type === eventState
      ) {
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

    })

  }

  _switchEventState(eventId, fromStateId, toStateId, contextId) {


    return SpinalGraphService.removeChild(fromStateId, eventId, this
        .EVENT_STATE_TO_EVENT_RELATION, SPINAL_RELATION_PTR_LST_TYPE)
      .then(removed => {
        if (removed) {
          return SpinalGraphService.addChildInContext(toStateId, eventId,
              contextId,
              this.EVENT_STATE_TO_EVENT_RELATION,
              SPINAL_RELATION_PTR_LST_TYPE)
            .then(res => {
              if (typeof res !== "undefined") {
                let EventNode = SpinalGraphService.getRealNode(eventId);
                let newState = SpinalGraphService.getInfo(toStateId).state
                  .get();


                EventNode.info.state.set(newState);
                EventNode.info.stateId.set(toStateId);
              }

            })
        } else {
          return Promise.resolve(false);
        }
      })


  }

  ////////////////////////////////////////////////////////////////////////
  //                        GET INFORMATION                             //
  ////////////////////////////////////////////////////////////////////////

  getVisitGroups(visitType) {
    let contexts = SpinalGraphService.getContextWithType(visitType);
    if (contexts.length === 0) return [];

    let contextId = contexts[0].info.id.get();

    return SpinalGraphService.getChildren(
      contextId,
      this.VISIT_TYPE_TO_GROUP_RELATION
    ).then(res => {
      return res.map(el => el.get());
    });
  }


  getGroupEventStates(contextId, groupId) {
    let promises = [];

    for (const key in this.EVENT_STATES) {
      promises.push(
        this.getEventStateNode(
          contextId,
          groupId,
          this.EVENT_STATES[key].type
        )
      );
    }

    return Promise.all(promises);
  }

  getGroupEvents(
    groupId,
    VISIT_TYPES = [
      this.MAINTENANCE_VISIT,
      this.REGULATORY_VISIT,
      this.SECURITY_VISIT,
      this.DIAGNOSTIC_VISIT
    ]
  ) {
    if (!Array.isArray(VISIT_TYPES)) VISIT_TYPES = [VISIT_TYPES];

    return VISIT_TYPES.map(visitType => {
      let visit = this.VISITS.find(el => {
        return el.type === visitType;
      });

      let context = SpinalGraphService.getContext(visit.name);

      if (typeof context !== "undefined") {
        let contextId = context.info.id.get();

        return this.getGroupEventStates(contextId, groupId).then(
          values => {
            let prom = values.map(async eventType => {
              let res = eventType.get();

              res["visit_type"] = visitType;

              let events = await SpinalGraphService
                .getChildren(
                  res.id, [
                    this.EVENT_STATE_TO_EVENT_RELATION
                  ]);

              res["events"] = events.map(el => {
                return el.get();
              });

              return res;
            });

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
    return SpinalGraphService.getChildren(eventId, [this
        .EVENT_TO_TASK_RELATION
      ])
      .then(children => {
        return children.map(el => el.get())
      })
  }

}

let spinalVisitService = new SpinalVisitService();

export default spinalVisitService;