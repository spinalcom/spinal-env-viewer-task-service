import {
  SPINAL_RELATION_PTR_LST_TYPE,
  SpinalGraphService
} from "spinal-env-viewer-graph-service";

import {
  EQUIPMENTS_TO_ELEMENT_RELATION,
  EQUIPMENTS_GROUP
} from "spinal-env-viewer-room-manager/js/service";

import VisitModel from "./models/visit.model.js";

import {
  Ptr,
  Lst,
  Model
} from "spinal-core-connectorjs_type";

import moment from "moment";

// import OperationModel from "./operationModel";
// import VisitModel from "./visitModel";

class SpinalVisitService {
  constructor() {
    this.VISIT_CONTEXT_NAME = ".visit_context";
    this.CONTEXT_TYPE = "visit_context";

    this.VISIT_TYPE = "visit";

    this.MAINTENANCE_VISIT = "MAINTENANCE_VISIT";
    this.REGULATORY_VISIT = "REGULATORY_VISIT";
    this.SECURITY_VISIT = "SECURITY_VISIT";
    this.DIAGNOSTIC_VISIT = "DIAGNOSTIC_VISIT";

    this.VISITS = Object.freeze([{
        type: this.MAINTENANCE_VISIT,
        name: "Maintenace visit"
      },
      {
        type: this.REGULATORY_VISIT,
        name: "Regulatory visit"
      },
      {
        type: this.SECURITY_VISIT,
        name: "Security Visit"
      },
      {
        type: this.DIAGNOSTIC_VISIT,
        name: "Diagnostic visit"
      }
    ]);

    //RELATIONS
    // this.CONTEXT_TO_VISIT_RELATION = "hasVisit";
    this.GROUP_TO_TASK = "hasTask";

    this.VISIT_TO_GROUP_RELATION = "visitHasGroup";
    this.GROUP_TO_EVENT_RELATION = "hasEventState";
    // this.TASK_TO_STATE = "hasState";

    // this._init();
  }

  _init() {
    SpinalGraphService.waitForInitialization().then(() => {
      let context = SpinalGraphService.getContext(this
        .VISIT_CONTEXT_NAME);

      if (typeof context !== "undefined") return;

      SpinalGraphService.addContext(
        this.VISIT_CONTEXT_NAME,
        this.CONTEXT_TYPE,
        new Model({
          name: this.VISIT_CONTEXT_NAME
        })
      ).then(contextCreated => {
        let contextId = contextCreated.getId().get();

        this.VISITS.forEach(el => {
          let nodeId = SpinalGraphService.createNode({
              name: el.name,
              type: el.type
            },
            new Model({
              name: el
            })
          );

          SpinalGraphService.addChildInContext(
            contextId,
            nodeId,
            contextId,
            this.CONTEXT_TO_VISIT_RELATION,
            SPINAL_RELATION_PTR_LST_TYPE
          );
        });
      });
    });
  }


  getAllVisits() {
    return this.VISITS;

  }

  addTaskOnGroup(
    groupId,
    taskName,
    periodicityNumber,
    periodicityMesure,
    visitName,
    interventionNumber,
    interventionMesure,
    description
  ) {

    // let visitName = SpinalGraphService.getInfo(visitId).type.get();

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

        return this.getPtrValue(node, visitName).then(lst => {

          // let nodeId = this._prepareNode(groupId, taskName,
          //   periodicityNumber,
          //   periodicityMesure,
          //   visitId,
          //   visitName,
          //   interventionNumber,
          //   interventionMesure,
          //   description);

          // SpinalGraphService.addChild(visitId, nodeId, this
          //   .VISIT_TO_TASK_RELATION, SPINAL_RELATION_PTR_LST_TYPE);



          let task = new VisitModel(taskName, periodicityNumber,
            periodicityMesure, visitName, interventionNumber,
            interventionMesure, description);

          let nodeId = SpinalGraphService.createNode({
            groupId: groupId,
            name: taskName,
            periodicity: {
              number: task.periodicity.number.get(),
              mesure: task.periodicity.mesure.get()
            },
            intervention: {
              number: task.intervention.number.get(),
              mesure: task.intervention.mesure.get()
            },
            visitType: visitName,
            description: description

          }, task);


          let realNode = SpinalGraphService.getRealNode(nodeId);

          lst.push(realNode);

          return realNode.info;

        })
      }
    );

    // let task = new VisitModel(taskName, beginDate, periodicityNumber,
    //   periodicityMesure,
    //   visitId, visitName);

    // let nodeId = SpinalGraphService.createNode({
    //   name: taskName,
    //   type: "task",
    //   visitId: visitId
    // }, task);

    // // return SpinalGraphService.addChild(groupId, nodeId, this.GROUP_TO_TASK,
    // //   SPINAL_RELATION_PTR_LST_TYPE).then(el => {
    // //   if (el) {
    // //     this.addOperations(groupId, nodeId, beginDate);
    // //     return task;
    // //   }
    // // })
  }

  getPtrValue(node, ptrName) {
    let realNode = SpinalGraphService.getRealNode(node.id.get());

    return new Promise((resolve) => {
      if (!realNode.info[ptrName]) {
        realNode.info.add_attr(ptrName, {
          tasks: new Ptr(new Lst())
        });
      }

      realNode.info[ptrName].tasks.load((value) => {
        return resolve(value);
      })
    })


  }

  getGroupTasks(groupId, visityType) {
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
      });

  }



  generateEvent(visitType, groupId, eventsData) {


    // console.log("inside js", visitType, groupId, taskName, beginDate, endDate,
    //   periodicityNumber, periodicityMesure);


    return this.createVisitContext(visitType)
      .then(el => {
        console.log("el", el);
        return this.linkGroupToVistContext(el.id.get(), groupId).then(
          res => {
            console.log("res", res);
            if (res) {
              this.addEvent(groupId, "déclaré");
              this.addEvent(groupId, "Encours");
              this.addEvent(groupId, "Effectué");
              this.addEvent(groupId, "déclaré");
              this.addEvent(groupId, "Encours");
              this.addEvent(groupId, "Effectué");
              this.addEvent(groupId, "déclaré");
              this.addEvent(groupId, "Encours");
              this.addEvent(groupId, "Effectué");
              this.addEvent(groupId, "déclaré");
              this.addEvent(groupId, "Encours");
              this.addEvent(groupId, "Effectué");
            }
          });
      })
      .catch(err => {
        console.log(err);
        return Promise.resolve(err);
      })


  }


  addEvent(groupId, state, name, date) {
    return this.getEventStateNode(groupId, state).then(eventStateNode => {
      console.log("eventStateNode", eventStateNode);
    })
  }




  createVisitContext(visitType) {

    let visit = this.VISITS.find(el => {
      return el.type === visitType;
    })

    if (typeof visit !== "undefined") {
      const contextName = `.${visit.name}`;

      let context = SpinalGraphService.getContext(contextName);
      if (typeof context !== "undefined") return Promise.resolve(context
        .info);

      return SpinalGraphService.addContext(contextName, visitType, new Model({
        name: this.VISIT_CONTEXT_NAME
      })).then(contextCreated => {
        return contextCreated.info;
      });

    } else {
      return Promise.reject("visitNotFound");
    }

  }


  linkGroupToVistContext(visitContextId, groupId) {
    return SpinalGraphService.getChildren(visitContextId, [this
      .VISIT_TO_GROUP_RELATION
    ]).then(children => {
      console.log("children", children);

      for (let i = 0; i < children.length; i++) {
        const child = children[i].id.get();
        if (child === groupId) return true;
      }

    }).then(el => {

      console.log("el2222", el)

      if (typeof el === "undefined") {
        console.log("yes el222 is undefined", visitContextId, groupId)
        return SpinalGraphService.addChild(visitContextId, groupId, this
          .VISIT_TO_GROUP_RELATION, SPINAL_RELATION_PTR_LST_TYPE)
      } else {
        console.log("node not undefined");

        return el;
      }

    })
  }


  getEventStateNode(groupId, eventSate) {
    return SpinalGraphService.getChildren(groupId, [this
        .GROUP_TO_EVENT_RELATION
      ])
      .then(children => {

        for (let i = 0; i < children.length; i++) {
          const name = children[i].name.get();

          if (name === eventSate) {
            return children[i];
          }

        }

      }).then(el => {
        if (typeof el === "undefined") {
          let argNodeId = SpinalGraphService.createNode({
            name: eventSate,
            state: eventSate,
            type: "EventState"
          });

          return SpinalGraphService.addChild(groupId,
            argNodeId,
            this.GROUP_TO_EVENT_RELATION,
            SPINAL_RELATION_PTR_LST_TYPE).then(res => {
            if (res) return SpinalGraphService.getInfo(
              argNodeId);
          })
        } else {
          return el;
        }

      })
  }



}

let spinalVisitService = new SpinalVisitService();

export default spinalVisitService;