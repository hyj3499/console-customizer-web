// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';

import Customizer from "./pages/Customizer";

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* ⭐ 이제 주소창이 /customizer 로 바뀌면 이 페이지를 보여줍니다 */}
        <Route path="/customizer" element={<Customizer />} />
      </Routes>
    </BrowserRouter>
  );
}