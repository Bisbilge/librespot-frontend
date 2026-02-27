import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CategoryDetailPage from './pages/CategoryDetailPage'
import CategoryMapPage from './pages/CategoryMapPage'
import CategoryFieldsPage from './pages/CategoryFieldsPage'
import VenuePage from './pages/VenuePage'
import EditVenuePage from './pages/EditVenuePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ContributePage from './pages/ContributePage'
import CreateCategoryPage from './pages/CreateCategoryPage'
import ModerationPage from './pages/ModerationPage'
import ModeratorsPage from './pages/ModeratorsPage'
import ProfilePage from './pages/ProfilePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/category/:slug" element={<CategoryDetailPage />} />
      <Route path="/category/:slug/map" element={<CategoryMapPage />} />
      <Route path="/category/:slug/fields" element={<CategoryFieldsPage />} />
      <Route path="/venue/:categorySlug/:venueSlug" element={<VenuePage />} />
      <Route path="/venue/:categorySlug/:venueSlug/edit" element={<EditVenuePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/contribute" element={<ContributePage />} />
      <Route path="/create-category" element={<CreateCategoryPage />} />
      <Route path="/moderation" element={<ModerationPage />} />
      <Route path="/moderation/:categorySlug" element={<ModerationPage />} />
      <Route path="/moderation/:categorySlug/moderators" element={<ModeratorsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  )
}

export default App