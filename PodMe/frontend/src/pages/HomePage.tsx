import { ArrowRight, Clock, Heart, Scissors, ShieldCheck, Sparkles, Star, Stethoscope, Syringe } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const SERVICES = [
  {
    icon: Stethoscope,
    title: 'Wellness Exams',
    body: 'Routine checkups to keep your pet happy and healthy year-round.',
  },
  {
    icon: Syringe,
    title: 'Vaccinations',
    body: 'Core and lifestyle vaccines to protect against preventable illness.',
  },
  {
    icon: Scissors,
    title: 'Dental & Surgery',
    body: 'Modern dental care and surgical procedures in a calm, safe setting.',
  },
  {
    icon: Sparkles,
    title: 'Grooming',
    body: 'Baths, brush-outs, and nail trims to keep your pet comfortable.',
  },
  {
    icon: Clock,
    title: 'Emergency Care',
    body: 'Urgent visits fit in fast when your pet needs help right away.',
  },
]

const TRUST_BADGES = [
  { icon: Heart, stat: '500+', label: 'Happy Pets Cared For' },
  { icon: ShieldCheck, stat: 'Certified', label: 'Veterinarians On Staff' },
  { icon: Clock, stat: '7 Days', label: 'A Week Availability' },
  { icon: Star, stat: '5-Star', label: 'Rated Care' },
]

export function HomePage() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="page">
      <section className="hero-banner">
        <div className="hero-content">
          <h1>Compassionate care for every paw</h1>
          <p>
            From wellness exams to emergency visits, PodMe Veterinary Care treats your pets like
            family - book an appointment and manage visit notes all in one place.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn">
              Get started
              <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Log in
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&q=70&auto=format&fit=crop"
            alt="A happy golden retriever puppy running outdoors at sunset"
            loading="lazy"
          />
        </div>
      </section>

      <section className="services-section">
        <h2>Our services</h2>
        <div className="services-grid">
          {SERVICES.map(({ icon: Icon, title, body }) => (
            <div className="service-card" key={title}>
              <div className="service-icon">
                <Icon size={20} />
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="trust-badges">
        {TRUST_BADGES.map(({ icon: Icon, stat, label }) => (
          <div className="trust-badge" key={label}>
            <Icon size={28} />
            <div>
              <strong>{stat}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
