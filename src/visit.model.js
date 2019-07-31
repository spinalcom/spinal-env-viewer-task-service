import spinalCore from "spinal-core-connectorjs";
import uuid from "node-uuid";

class VisitModel extends Model {
  constructor(name, periodicityNumber, periodicityMesure, visitId, visitType,
    interventionNumber, interventionMesure, description) {
    super();
    this.add_attr({
      id: `visit-${uuid.v4()}`,
      name: name,
      periodicity: {
        number: periodicityNumber,
        mesure: new Choice(periodicityMesure, ["day(s)", "week(s)",
          "month(s)",
          "year(s)"
        ])
      },
      intervention: {
        number: interventionNumber ? interventionNumber : "",
        mesure: typeof interventionMesure !== "undefined" ? new Choice(
          interventionMesure, [
            "minute(s)", "day(s)",
            "week(s)", "month(s)",
            "year(s)"
          ]) : ""
      },
      visitType: visitType,
      visitId: visitId,
      description: description ? description : ""
    })
  }
}



export default VisitModel;
spinalCore.register_models([VisitModel]);