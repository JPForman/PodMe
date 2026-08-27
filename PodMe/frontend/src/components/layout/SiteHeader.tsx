import { useEffect, useState } from 'react'
import { LogOut, Menu, Moon, PawPrint, Sun, X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/pets', label: 'Pets' },
  { to: '/appointments', label: 'Appointments' },
]

type Theme = 'light' | 'dark'

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    // Only follow live OS theme changes until the user makes an explicit choice.
    if (localStorage.getItem('theme')) return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setTheme(query.matches ? 'dark' : 'light')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', next)
    setTheme(next)
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return { theme, toggleTheme }
}

export function SiteHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  async function handleLogout() {
    setNavOpen(false)
    await logout()
    navigate('/login')
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <NavLink to="/" className="site-logo">
          <PawPrint size={24} />
          PodMe Veterinary Care
        </NavLink>

        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button
          type="button"
          className="nav-toggle"
          onClick={() => setNavOpen((open) => !open)}
          aria-label={navOpen ? 'Close menu' : 'Open menu'}
        >
          {navOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className={`site-nav ${navOpen ? 'open' : ''}`}>
          {user ? (
            <>
              {NAV_LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} onClick={() => setNavOpen(false)}>
                  {link.label}
                </NavLink>
              ))}
              {user.role === 'admin' && (
                <NavLink to="/admin/users" onClick={() => setNavOpen(false)}>
                  Admin
                </NavLink>
              )}
              <button type="button" className="btn-secondary btn" onClick={handleLogout}>
                <LogOut size={16} />
                Log out
              </button>
            </>
          ) : (
            <div className="nav-cta">
              <NavLink to="/login" className="btn-secondary btn" onClick={() => setNavOpen(false)}>
                Log in
              </NavLink>
              <NavLink to="/register" className="btn" onClick={() => setNavOpen(false)}>
                Register
              </NavLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
