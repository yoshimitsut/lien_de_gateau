import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 

import NewsletterManagement from './pages/NewsletterManagement';
import Newsletter from './pages/Newsletter';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/newsletter" element={
        // <ProtectedRoute>
          <NewsletterManagement />
        // </ProtectedRoute>
      } />
  
      <Route path="/newsletter" element={
          <Newsletter />
      } />
      </Routes>
    </Router>
  )
}

export default App
