import Link from 'next/link'
import { Settings, ChevronDown, Database, Upload, FileText } from 'lucide-react'

export default function SettingsDropdown({ isOpen, onToggle, currentPage }) {
  return (
    <div style={{position: 'relative'}}>
      <button onClick={onToggle} style={navItem(currentPage === 'settings')}>
        <Settings size={16} />
        <span>ตั้งค่า</span>
        <ChevronDown size={14} />
      </button>
      {isOpen && (
        <div style={{position: 'absolute', right: 0, top: '100%', marginTop: 8, background: 'rgba(255,255,255,0.95)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, minWidth: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 1000}}>
          <Link href="/settings" onClick={onToggle} style={{width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', borderRadius: 6, color: 'var(--text)', cursor: 'pointer', fontSize: 12, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s', textDecoration: 'none'}}>
            <Database size={16} />
            <span>ตั้งค่ารายการ Stock</span>
          </Link>
          <Link href="/backup" onClick={onToggle} style={{width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', borderRadius: 6, color: 'var(--text)', cursor: 'pointer', fontSize: 12, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s', textDecoration: 'none'}}>
            <Upload size={16} />
            <span>Upload & Backup</span>
          </Link>
          <Link href="/logs" onClick={onToggle} style={{width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', borderRadius: 6, color: 'var(--text)', cursor: 'pointer', fontSize: 12, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s', textDecoration: 'none'}}>
            <FileText size={16} />
            <span>ดู Log</span>
          </Link>
        </div>
      )}
    </div>
  )
}

// Styles for the navigation item
const navItem = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 14px',
  borderRadius: 8,
  fontSize: 13,
  color: '#ffffff',
  background: active ? 'var(--accent-glow)' : 'transparent',
  border: active ? '1px solid rgba(0,212,255,.2)' : '1px solid transparent',
  fontWeight: active ? 600 : 400,
  transition: 'all .15s',
  cursor: 'pointer'
})
