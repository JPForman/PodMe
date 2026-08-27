import { Clock, Mail, MapPin, PawPrint, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

const HOURS = [
  ['Mon - Fri', '8:00am - 6:00pm'],
  ['Saturday', '9:00am - 2:00pm'],
  ['Sunday', 'Closed'],
]

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-col">
          <h3>
            <PawPrint size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />
            PodMe Veterinary Care
          </h3>
          <p>Compassionate, full-service veterinary care for every member of your family.</p>
        </div>

        <div className="footer-col">
          <h3>Contact us</h3>
          <a href="tel:+15550123456">
            <Phone size={14} />
            (555) 012-3456
          </a>
          <a href="mailto:hello@podmevet.test">
            <Mail size={14} />
            hello@podmevet.test
          </a>
          <p>
            <MapPin size={14} />
            123 Maple Street, Springfield
          </p>
        </div>

        <div className="footer-col">
          <h3>
            <Clock size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Hours
          </h3>
          {HOURS.map(([day, time]) => (
            <div className="footer-hours" key={day}>
              <span>{day}</span>
              <span>{time}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="footer-bottom">
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          &copy; {new Date().getFullYear()} PodMe Veterinary Care
        </Link>
      </div>
    </footer>
  )
}
