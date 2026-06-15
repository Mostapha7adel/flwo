import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Mail, Phone, MapPin } from 'lucide-react'
import { api } from '../../lib/axios'

export function Footer() {
  const { data: content } = useQuery({
    queryKey: ['landing-content-footer'],
    queryFn: () => api.get('/landing/content').then(r => r.data),
    staleTime: 300000,
  })

  const footer = content?.footer || {}
  const email = footer.email || 'support@designflow.com'
  const phone = footer.phone || '+1 (555) 123-4567'
  const address = footer.address || ''
  const socialLinks = footer.socialLinks || []

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">DF</span>
              </div>
              <span className="font-bold text-xl text-white">DesignFlow</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              منصة تصميم احترافية تقدم قوالب جاهزة للتخصيص. حول فكرتك إلى موقع إلكتروني في دقائق.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">روابط سريعة</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/templates" className="hover:text-brand-400 transition">القوالب</Link></li>
              <li><Link to="/about" className="hover:text-brand-400 transition">عن DesignFlow</Link></li>
              <li><Link to="/contact" className="hover:text-brand-400 transition">تواصل معنا</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">تواصل معنا</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <span dir="ltr">{email}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                <span dir="ltr">{phone}</span>
              </li>
              {address && (
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
                  <span>{address}</span>
                </li>
              )}
            </ul>
            {socialLinks.length > 0 && (
              <div className="flex gap-3 mt-4">
                {socialLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-brand-500 transition text-xs font-bold"
                  >
                    {link.platform?.charAt(0) || 'S'}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} DesignFlow. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  )
}
