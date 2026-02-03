import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import VideoPage from './pages/VideoPage';
import SearchPage from './pages/SearchPage';
import ThemesPage from './pages/ThemesPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/video/:videoId" element={<VideoPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/themes" element={<ThemesPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
