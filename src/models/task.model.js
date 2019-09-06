import spinalCore from "spinal-core-connectorjs";
import uuid from "node-uuid";
import {
  Choice
} from "spinal-core-connectorjs_type";

class TaskModel extends Model {

  constructor(name, dbId, bimFileId, taskName) {
    super();
    this.add_attr({
      id: uuid.v4(),
      name: name,
      dbId: dbId,
      bimFileId: bimFileId,
      taskName: taskName,
      done: false
    })
  }

}

export default TaskModel;
spinalCore.register_models([TaskModel]);