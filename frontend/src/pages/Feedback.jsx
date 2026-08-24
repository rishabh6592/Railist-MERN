import { useState } from "react";
import { Check, Send } from "lucide-react";
import { submitFeedback } from "../api";

const tags = ["Accurate information","Live updates","Easy to use","Clean UI","Fast response","Other"];

export default function Feedback() {
  const [rating,setRating] = useState(4);
  const [selected,setSelected] = useState(["Accurate information"]);
  const [message,setMessage] = useState("");
  const [sent,setSent] = useState(false);

  const submit = async e => {
    e.preventDefault();
    await submitFeedback({rating,tags:selected,message}).catch(()=>{});
    setSent(true);
  };

  return <div>
    <div className="page-title"><div><span className="eyebrow">PRODUCT FEEDBACK</span><h1>How was your experience?</h1><p>Your feedback helps us improve the journey.</p></div></div>
    <form className="panel feedback-card" onSubmit={submit}>
      {sent ? <div className="success-state"><span><Check size={25}/></span><h2>Thanks for the feedback!</h2><p>Your response has been recorded.</p><button type="button" className="secondary" onClick={()=>setSent(false)}>Send another</button></div> :
      <>
        <div className="stars">{[1,2,3,4,5].map(n=><button type="button" key={n} className={n<=rating?"selected":""} onClick={()=>setRating(n)}>★</button>)}</div>
        <div className="rating-copy">{["","Needs work","Could be better","Good","Great","Excellent"][rating]}</div>
        <label>What did you like most?</label>
        <div className="tag-picker">{tags.map(t=><button type="button" key={t} className={selected.includes(t)?"selected":""} onClick={()=>setSelected(x=>x.includes(t)?x.filter(y=>y!==t):[...x,t])}>{t}</button>)}</div>
        <label>Write your feedback <span>Optional</span></label>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} maxLength={300} placeholder="Tell us what felt useful, confusing or missing..."></textarea>
        <div className="form-footer"><small>{message.length}/300</small><button className="primary"><Send size={16}/> Submit feedback</button></div>
      </>}
    </form>
  </div>;
}
