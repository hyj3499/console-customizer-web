// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import CustomizerStep1 from "./pages/CustomizerStep1";
import CustomizerStep2 from "./pages/CustomizerStep2";
import CustomizerStep3 from "./pages/CustomizerStep3";

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/step/1" element={<CustomizerStep1 />} />
        <Route path="/step/2" element={<CustomizerStep2 />} />
        <Route path="/step/3" element={<CustomizerStep3 />} />
      </Routes>
    </BrowserRouter>
  );
}