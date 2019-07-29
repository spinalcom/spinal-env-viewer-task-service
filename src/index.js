import {
  SPINAL_RELATION_PTR_LST_TYPE,
  SpinalGraphService
} from "spinal-env-viewer-graph-service";

import {
  EQUIPMENTS_TO_ELEMENT_RELATION,
  EQUIPMENTS_GROUP
} from "spinal-env-viewer-room-manager/js/service";
import VisitModel from "./visit.model";
import {
  Ptr,
  Lst
} from "spinal-core-connectorjs_type";

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
    this.CONTEXT_TO_VISIT_RELATION = "hasVisit";
    this.GROUP_TO_TASK = "hasTask";

    this._init();
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
    let context = SpinalGraphService.getContext(this.VISIT_CONTEXT_NAME);

    if (typeof context === "undefined") return Promise.resolve([]);

    let contextId = context.getId().get();

    return SpinalGraphService.getChildren(contextId, [
      this.CONTEXT_TO_VISIT_RELATION
    ]);
  }

  addTaskOnGroup(
    groupId,
    taskName,
    periodicityNumber,
    periodicityMesure,
    visitId,
    interventionNumber,
    interventionMesure,
    description
  ) {
    let visitName = SpinalGraphService.getInfo(visitId).type.get();

    return SpinalGraphService.getChildren(groupId, [this.GROUP_TO_TASK]).then(
      children => {
        let nodeId;
        if (children.length === 0) {
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
          children[0];

        return this.getPtrValue(node, visitName).then(lst => {
          let task = new VisitModel(taskName, periodicityNumber,
            periodicityMesure, visitName, interventionNumber,
            interventionMesure, description);

          lst.push(task);

          return task;

          // let nodeId = SpinalGraphService.createNode({
          //   name: taskName,
          //   type: "task",
          //   visitId: visitId
          // }, task);
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
        realNode.info.add_attr(ptrName, new Ptr(new Lst()));
      }

      realNode.info[ptrName].load((value) => {
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

  // addOperations(groupId, taskId, date) {
  //   Promise.all([SpinalGraphService.getInfo(taskId).element.load(),
  //     SpinalGraphService.getChildren(
  //       groupId, [EQUIPMENTS_TO_ELEMENT_RELATION])
  //   ]).then(async values => {
  //     let visit = new VisitModel(date);

  //     let taskOperations = await values[0].operations.data.model;

  //     values[1].forEach(el => {
  //       visit.bims.push(new OperationModel(el.name.get(), el.dbid
  //         .get()))
  //     });

  //     taskOperations.push(visit);

  //   })
  // }

  // getGroupOperation(nodeId) {
  //   let nodeInfo = SpinalGraphService.getInfo(nodeId);

  //   if (nodeInfo.type.get() === EQUIPMENTS_GROUP) {
  //     return this.getGroupTasks(nodeId).then(tasks => {
  //       let promises = tasks.map(async el => {
  //         return {
  //           taskId: el.id.get(),
  //           taskName: el.name.get(),
  //           operations: (await this.getTaskOperations(el.id.get()))
  //             .get()
  //         };
  //       })

  //       return Promise.all(promises);
  //     })
  //   } else {
  //     return Promise.resolve([]);
  //   }

  // }

  // getTaskOperations(taskId, operationDate) {
  //   let info = SpinalGraphService.getInfo(taskId);
  //   return info.element.load().then(element => {
  //     return new Promise((resolve) => {
  //       element.operations.load((operations) => {
  //         if (typeof operationDate === "undefined") {
  //           resolve(operations);
  //         } else {
  //           for (let i = 0; i < operations.length; i++) {
  //             const operation = operations[i];
  //             if (operation.date.get().toString() ===
  //               operationDate
  //               .toString()) {
  //               resolve(operation[i]);
  //             }
  //           }
  //         }
  //       })
  //     })
  //   })
  // }
}

let spinalVisitService = new SpinalVisitService();

export default spinalVisitService;