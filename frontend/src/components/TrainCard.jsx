import { ArrowRight, Clock3, MapPin } from "lucide-react";

export default function TrainCard({ train, onClick }) {
  // Platform number safe verification
  const rawPf = String(train.platform || "").trim();
  const isValidPf =
    rawPf &&
    rawPf !== "—" &&
    rawPf !== "-" &&
    rawPf !== "--" &&
    rawPf !== "0" &&
    rawPf !== "null" &&
    rawPf !== "undefined" &&
    rawPf !== "Platform —" &&
    !rawPf.toLowerCase().includes("not assigned");

  let displayPlatform = "PF TBA";
  if (isValidPf) {
    displayPlatform = rawPf.toUpperCase().startsWith("PF")
      ? rawPf
      : `PF ${rawPf}`;
  }

  return (
    <button className="train-card" onClick={onClick}>
      <div className="train-card-head">
        <div>
          <b>{train.number}</b>
          <span>{train.name}</span>
        </div>
        <span
          className={`status ${
            train.status === "Delayed"
              ? "danger"
              : train.status === "Live" || train.status === "On Time"
              ? "live"
              : ""
          }`}
        >
          {train.status || "On Time"}
        </span>
      </div>

      <div className="train-route">
        <div>
          <strong>{train.fromCode || "—"}</strong>
          <span>{train.from}</span>
        </div>
        <div className="route-line">
          <i></i>
          <ArrowRight size={16} />
          <i></i>
        </div>
        <div className="right">
          <strong>{train.toCode || "—"}</strong>
          <span>{train.to}</span>
        </div>
      </div>

      <div className="train-meta">
        <span>
          <Clock3 size={14} />
          {train.departureTime || train.time || `${train.delay || 0} min delay`}
        </span>
        <span>
          <MapPin size={14} />
          {displayPlatform}
        </span>
      </div>
    </button>
  );
}