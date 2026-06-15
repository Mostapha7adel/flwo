import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

export function Dropdown({ trigger, children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({ to, onClick, children, danger }) {
  const classes = cn(
    'flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors',
    danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
  )

  if (to) return <Link to={to} className={classes} onClick={onClick}>{children}</Link>
  return <button className={classes} onClick={onClick}>{children}</button>
}
