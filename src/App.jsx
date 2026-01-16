import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SplitProvider } from './context/SplitContext';
import HomePage from './pages/HomePage';
import SetupPage from './pages/SetupPage';
import ScanPage from './pages/ScanPage';
import AssignPage from './pages/AssignPage';
import SummaryPage from './pages/SummaryPage';
import SharePage from './pages/SharePage';
import TrackingPage from './pages/TrackingPage';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <SplitProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/assign" element={<AssignPage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/share" element={<SharePage />} />
          <Route path="/tracking" element={<TrackingPage />} />
        </Routes>
      </SplitProvider>
    </BrowserRouter>
  );
}
