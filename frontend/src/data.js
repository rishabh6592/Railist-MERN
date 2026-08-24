export const trains = [
  { number:"12951", name:"Mumbai Rajdhani", from:"Mumbai", fromCode:"MMCT", to:"New Delhi", toCode:"NDLS", platform:"PF 1", status:"On Time", time:"10:25" },
  { number:"12004", name:"Lucknow Shatabdi", from:"Lucknow", fromCode:"LKO", to:"New Delhi", toCode:"NDLS", platform:"PF 5", status:"On Time", time:"11:10" },
  { number:"12424", name:"Dibrugarh Rajdhani", from:"Dibrugarh", fromCode:"DBRG", to:"New Delhi", toCode:"NDLS", platform:"PF 16", status:"Delayed", time:"12:05" },
  { number:"15012", name:"Chauri Chaura Exp", from:"Gorakhpur", fromCode:"GKP", to:"Lucknow", toCode:"LKO", platform:"PF 9", status:"On Time", time:"12:40" },
  { number:"12310", name:"Jan Sadharan Exp", from:"New Delhi", fromCode:"NDLS", to:"Rajendra Nagar", toCode:"RJPB", platform:"PF 8", status:"Delayed", time:"13:20" },
  { number:"18237", name:"Chhattisgarh Exp", from:"Amritsar", fromCode:"ASR", to:"Bilaspur", toCode:"BSP", platform:"PF 11", status:"On Time", time:"14:10" }
];

export const stations = [
  { name:"Gorakhpur Jn", code:"GKP", city:"Gorakhpur", platforms:10, trains:74, status:"Operational" },
  { name:"Lucknow", code:"LKO", city:"Lucknow", platforms:9, trains:126, status:"Operational" },
  { name:"Barabanki", code:"BBK", city:"Barabanki", platforms:6, trains:62, status:"Operational" },
  { name:"Ayodhya Cantt", code:"AY", city:"Ayodhya", platforms:4, trains:38, status:"Operational" },
  { name:"Prayagraj Jn", code:"PRYJ", city:"Prayagraj", platforms:10, trains:112, status:"Operational" },
  { name:"New Delhi", code:"NDLS", city:"New Delhi", platforms:16, trains:184, status:"Busy" }
];

export const pnrDemo = {
  pnr:"2456789123", trainNumber:"12556", trainName:"Gorakhham Express",
  date:"12 May, 2025", from:"GKP", to:"NDLS", chartStatus:"Chart Prepared",
  passengers:[
    {name:"RISHABH KUMAR", age:23, gender:"M", status:"Confirmed", berth:"B2 / 35 / LB"},
    {name:"SONU KUMAR", age:25, gender:"M", status:"Confirmed", berth:"B2 / 36 / MB"},
    {name:"SIMA DEVI", age:48, gender:"F", status:"RAC 1", berth:"B2 / 37 / UB"},
    {name:"MONU KUMAR", age:21, gender:"M", status:"WL 5", berth:"—"}
  ]
};

export const routePoints = [
  ["Lucknow", 82, 10], ["Barabanki", 104, 22], ["Ayodhya", 129, 42],
  ["Sultanpur", 151, 70], ["Prayagraj", 159, 101], ["New Delhi", 173, 134]
];
