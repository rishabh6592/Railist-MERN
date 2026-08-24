import { Bookmark, Bell, ArrowRight, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { getTrips, removeTrip } from "../storage";

export default function Trips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState(getTrips());

  const remove = number => {
    removeTrip(number);
    setTrips(getTrips());
  };

  return <div>
    <div className="page-title"><div><span className="eyebrow">YOUR JOURNEYS</span><h1>My trips</h1><p>Saved trains and live alert preferences.</p></div></div>
    {!trips.length ? <div className="empty-state panel">No saved trips yet. Open a live train and tap the star.</div> :
    <div className="trip-list">{trips.map(t=><div className="trip-card panel" key={t.number} onClick={()=>navigate(`/live/${t.number}`)} style={{cursor:"pointer"}}><span className="trip-icon"><Bookmark size={19}/></span><div className="trip-main"><div><b>{t.number}</b><h3>{t.name}</h3></div><p>{t.route} · {t.date}</p><span className="trip-alert"><Bell size={13}/>{t.alert}</span></div><button className="icon-btn danger-btn" onClick={e=>{e.stopPropagation();remove(t.number);}}><Trash2 size={16}/></button><ArrowRight className="trip-arrow" size={18}/></div>)}</div>}
  </div>;
}
