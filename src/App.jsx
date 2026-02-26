import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CategoryMapPage from './pages/CategoryMapPage'
import VenuePage from './pages/VenuePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ContributePage from './pages/ContributePage'
import ModerationPage from './pages/ModerationPage'
import ModeratorsPage from './pages/ModeratorsPage'
import ProfilePage from './pages/ProfilePage'
import EditVenuePage from './pages/EditVenuePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/category/:slug" element={<CategoryMapPage />} />
      <Route path="/venue/:id" element={<VenuePage />} />
      <Route path="/venue/:id/edit" element={<EditVenuePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/contribute" element={<ContributePage />} />
      <Route path="/moderation" element={<ModerationPage />} />
      <Route path="/moderation/:categorySlug" element={<ModerationPage />} />
      <Route path="/moderation/:categorySlug/moderators" element={<ModeratorsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  )
}

export default App