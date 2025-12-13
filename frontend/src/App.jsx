import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SearchResultsPage from './pages/SearchResultsPage'
import VariantDetailsPage from './pages/VariantDetailsPage'
import MyTripsPage from './pages/MyTripsPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/search/:id/variant/:num" element={<VariantDetailsPage />} />
        <Route path="/my-trips" element={<MyTripsPage />} />
      </Routes>
    </Layout>
  )
}

export default App
