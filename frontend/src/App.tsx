import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import ProtectedRoute from './components/ProtectedRoute'

import NewsletterManagement from './pages/NewsletterManagement';
import Newsletter from './pages/Newsletter';
import StoreLogin from './pages/StoreLogin'
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/newsletter" element={
        <ProtectedRoute>
          <NewsletterManagement />
        </ProtectedRoute>
      } />
  
      <Route path="/newsletter" element={
          <Newsletter />
      } />

      <Route path="/store-login" element={<StoreLogin />} />

      </Routes>
    </Router>
  )
}

export default App
