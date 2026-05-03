import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home      from './pages/Home'
import Login     from './pages/Login'
import Signup    from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Studio    from './pages/Studio'
import Pricing   from './pages/Pricing'
import { Features, About, Contact } from './pages/Pages'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"          element={<Home />}      />
          <Route path="/login"     element={<Login />}     />
          <Route path="/signup"    element={<Signup />}    />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/studio"    element={<Studio />}    />
          <Route path="/pricing"   element={<Pricing />}   />
          <Route path="/features"  element={<Features />}  />
          <Route path="/about"     element={<About />}     />
          <Route path="/contact"   element={<Contact />}   />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
