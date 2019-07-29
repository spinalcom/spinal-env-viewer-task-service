import spinalCore from "spinal-core-connectorjs";
import {
  Choice
} from "spinal-core-connectorjs_type";

class OperationModel extends Model {

  constructor(name, dbId) {
    super();
    this.add_attr({
      creation: Date.now(),
      lastUpdate: Date.now(),
      dbId: dbId,
      name: name,
      state: new Choice(0, ["processing", "validated", "not validated"]),
      comments: ""
    })
  }

  validate() {
    this.state.set(1);
    this.lastUpdate.set(Date.now());
  }

  invalidate() {
    this.state.set(2);
    this.lastUpdate.set(Date.now());
  }

  initializeSate() {
    this.state.set(0);
    this.lastUpdate.set(Date.now());
  }

  addComment(comment) {
    this.comments.set(comment);
  }

}

export default OperationModel;
spinalCore.register_models([OperationModel]);