import spinalCore from "spinal-core-connectorjs";
import uuid from "node-uuid";


class EventModel extends Model {

  constructor(name, date, state, groupId) {
    super();
    this.add_attr({
      id: `Event-${uuid.v4()}`,
      name: name,
      date: date,
      state: state,
      groupId: groupId
    })
  }

}


export default EventModel;
spinalCore.register_models([EventModel]);