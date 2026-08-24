import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import LiveStatus from "./pages/LiveStatus";
import TrainDetails from "./pages/TrainDetails";
import PNR from "./pages/PNR";
import Stations from "./pages/Stations";
import Trips from "./pages/Trips";
import Feedback from "./pages/Feedback";

export default function App() {
  return <Layout>
    <Routes>
      <Route path="/" element={<Dashboard/>}/>
      <Route path="/search" element={<Search/>}/>
      <Route path="/live" element={<LiveStatus/>}/>
      <Route path="/live/:number" element={<TrainDetails/>}/>
      <Route path="/pnr" element={<PNR/>}/>
      <Route path="/stations" element={<Stations/>}/>
      <Route path="/trips" element={<Trips/>}/>
      <Route path="/feedback" element={<Feedback/>}/>
      <Route path="*" element={<Dashboard/>}/>
    </Routes>
  </Layout>;
}