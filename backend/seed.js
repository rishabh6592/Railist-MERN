import "dotenv/config";
import mongoose from "mongoose";
import Train from "./models/Train.js";
import PNR from "./models/PNR.js";
import Station from "./models/Station.js";

const station = (name, code, scheduled, actual, delay = 0, status = "On Time") => ({
  name, code, scheduled, actual, delay, status
});

const trains = [
  {
    number: "12556", name: "Gorakhham Express", from: "Gorakhpur Jn", fromCode: "GKP",
    to: "New Delhi", toCode: "NDLS", platform: "3", status: "Live", delay: 18,
    currentLocation: "Near Barabanki", currentCode: "BBK", nextStop: "Ayodhya Cantt", nextCode: "AY",
    speed: 72,
    stations: [
      station("Gorakhpur Jn", "GKP", "08:10", "08:12", 2, "Departed"),
      station("Basti", "BST", "08:56", "09:10", 14, "Departed"),
      station("Khalilabad", "KLD", "09:38", "09:50", 12, "Departed"),
      station("Barabanki", "BBK", "10:08", "10:20", 12, "Current"),
      station("Ayodhya Cantt", "AY", "10:28", "10:46", 18, "Upcoming"),
      station("Prayagraj Jn", "PRYJ", "11:35", "11:56", 21, "Upcoming"),
      station("New Delhi", "NDLS", "23:45", "00:06", 21, "Upcoming")
    ]
  },
  {
    number: "15056", name: "Gorakhpur - Anand Vihar Exp", from: "Gorakhpur Jn", fromCode: "GKP",
    to: "Anand Vihar", toCode: "ANVT", platform: "2", status: "On Time", delay: 0,
    currentLocation: "Gorakhpur Jn", currentCode: "GKP", nextStop: "Basti", nextCode: "BST", speed: 0,
    stations: []
  },
  {
    number: "15055", name: "Anand Vihar - Gorakhpur Jn Exp", from: "Anand Vihar", fromCode: "ANVT",
    to: "Gorakhpur Jn", toCode: "GKP", platform: "6", status: "On Time", delay: 0,
    currentLocation: "Kanpur Central", currentCode: "CNB", nextStop: "Lucknow", nextCode: "LKO", speed: 62,
    stations: []
  },
  {
    number: "12555", name: "North East Express", from: "Gorakhpur Jn", fromCode: "GKP",
    to: "Anand Vihar", toCode: "ANVT", platform: "4", status: "Delayed", delay: 22,
    currentLocation: "Barabanki", currentCode: "BBK", nextStop: "Lucknow", nextCode: "LKO", speed: 58,
    stations: []
  },
  {
    number: "12951", name: "Mumbai Rajdhani", from: "Mumbai Central", fromCode: "MMCT",
    to: "New Delhi", toCode: "NDLS", platform: "1", status: "On Time", delay: 0,
    currentLocation: "Kota", currentCode: "KOTA", nextStop: "Sawai Madhopur", nextCode: "SWM", speed: 96,
    stations: []
  },
  {
    number: "12004", name: "Lucknow Shatabdi", from: "Lucknow", fromCode: "LKO",
    to: "New Delhi", toCode: "NDLS", platform: "5", status: "On Time", delay: 0,
    currentLocation: "Kanpur", currentCode: "CNB", nextStop: "Etawah", nextCode: "ETW", speed: 104,
    stations: []
  },
  {
    number: "12424", name: "Dibrugarh Rajdhani", from: "Dibrugarh", fromCode: "DBRG",
    to: "New Delhi", toCode: "NDLS", platform: "16", status: "Delayed", delay: 11,
    currentLocation: "Guwahati", currentCode: "GHY", nextStop: "New Jalpaiguri", nextCode: "NJP", speed: 78,
    stations: []
  },
  {
    number: "15012", name: "Chauri Chaura Exp", from: "Gorakhpur", fromCode: "GKP",
    to: "Lucknow", toCode: "LKO", platform: "9", status: "On Time", delay: 0,
    currentLocation: "Gonda", currentCode: "GD", nextStop: "Barabanki", nextCode: "BBK", speed: 64,
    stations: []
  },
  {
    number: "12310", name: "Jan Sadharan Exp", from: "New Delhi", fromCode: "NDLS",
    to: "Rajendra Nagar", toCode: "RJPB", platform: "8", status: "Delayed", delay: 7,
    currentLocation: "Kanpur", currentCode: "CNB", nextStop: "Prayagraj", nextCode: "PRYJ", speed: 71,
    stations: []
  },
  {
    number: "18237", name: "Chhattisgarh Express", from: "Amritsar", fromCode: "ASR",
    to: "Bilaspur", toCode: "BSP", platform: "11", status: "On Time", delay: 0,
    currentLocation: "Delhi", currentCode: "DLI", nextStop: "Agra", nextCode: "AGC", speed: 68,
    stations: []
  }
];

const pnr = {
  pnr: "2456789123",
  trainNumber: "12556",
  trainName: "Gorakhham Express",
  date: "12 May, 2025",
  from: "GKP",
  to: "NDLS",
  chartStatus: "Chart Prepared",
  passengers: [
    { name: "RISHABH KUMAR", age: 23, gender: "M", status: "Confirmed", berth: "B2 / 35 / LB" },
    { name: "SONU KUMAR", age: 25, gender: "M", status: "Confirmed", berth: "B2 / 36 / MB" },
    { name: "SIMA DEVI", age: 48, gender: "F", status: "RAC 1", berth: "B2 / 37 / UB" },
    { name: "MONU KUMAR", age: 21, gender: "M", status: "WL 5", berth: "—" }
  ]
};

const stations = [
  { name:"Gorakhpur Jn", code:"GKP", city:"Gorakhpur", platforms:10, trains:74, status:"Operational" },
  { name:"Lucknow", code:"LKO", city:"Lucknow", platforms:9, trains:126, status:"Operational" },
  { name:"Barabanki", code:"BBK", city:"Barabanki", platforms:6, trains:62, status:"Operational" },
  { name:"Ayodhya Cantt", code:"AY", city:"Ayodhya", platforms:4, trains:38, status:"Operational" },
  { name:"Prayagraj Jn", code:"PRYJ", city:"Prayagraj", platforms:10, trains:112, status:"Operational" },
  { name:"New Delhi", code:"NDLS", city:"New Delhi", platforms:16, trains:184, status:"Busy" },
  { name:"Mumbai Central", code:"MMCT", city:"Mumbai", platforms:7, trains:96, status:"Operational" },
  { name:"Anand Vihar", code:"ANVT", city:"Delhi", platforms:7, trains:64, status:"Operational" },
  { name:"Kanpur Central", code:"CNB", city:"Kanpur", platforms:10, trains:142, status:"Busy" },
  { name:"Dibrugarh", code:"DBRG", city:"Dibrugarh", platforms:3, trains:18, status:"Operational" },
  { name:"Amritsar Jn", code:"ASR", city:"Amritsar", platforms:6, trains:58, status:"Operational" },
  { name:"Bilaspur Jn", code:"BSP", city:"Bilaspur", platforms:6, trains:54, status:"Operational" }
];

async function run() {
  if (!process.env.MONGO_URI) throw new Error("Set MONGO_URI in .env");
  await mongoose.connect(process.env.MONGO_URI);
  await Train.deleteMany({});
  await PNR.deleteMany({});
  await Station.deleteMany({});
  await Train.insertMany(trains);
  await PNR.create(pnr);
  await Station.insertMany(stations);
  console.log("Seed complete");
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
