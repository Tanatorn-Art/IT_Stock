'use client'

import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Package, MapPin, Scan, ArrowLeftRight, Settings,
  Clock, ClipboardCheck, AlertCircle, Box,
  Plus, List, Filter, Search, Check, X,
  ChevronDown, RefreshCw, Download, Laptop,
  Mouse, Keyboard, Monitor, Usb, Printer, Network,
  Server, HardDrive, Smartphone, Tablet
} from 'lucide-react'

const SettingsDropdown = dynamic(() => import('../components/SettingsDropdown'), { ssr: false })

// ── styles (matching index.js) ─────────────────────────────────────────────────────
const layout={display:'flex',flexDirection:'column',minHeight:'100vh'}
const navbar={display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 24px',position:'sticky',top:0,zIndex:100,width:'100%',backgroundImage:'url(/images/bg_navbar.jpg)',backgroundSize:'cover',backgroundPosition:'center'}
const navbarNav={display:'flex',alignItems:'center',gap:4}
const navbarRight={display:'flex',alignItems:'center',gap:12}
const navItem=(a)=>({display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:8,fontSize:13,color:'#ffffff',background:a?'var(--accent-glow)':'transparent',border:a?'1px solid rgba(0,212,255,.2)':'1px solid transparent',fontWeight:a?600:400,transition:'all .15s',cursor:'pointer',textDecoration:'none'})
const mainArea={flex:1,padding:24,minWidth:0,overflowX:'hidden',display:'flex',flexDirection:'column',alignItems:'center',background:'transparent'}
const addBtn={background:'var(--accent)',color:'#000',border:'none',borderRadius:8,padding:'9px 15px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'var(--sans)',whiteSpace:'nowrap'}

// ── helpers ──────────────────────────────────────────────────────────────────
const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Operations', 'Marketing']
const CATS = ['all','Laptop','Desktop','Monitor','Peripheral','Network','Server','Storage','Phone','Tablet','Other']
const ICON = {Laptop:Laptop,Desktop:Monitor,Monitor:Monitor,Peripheral:Mouse,Network:Network,Server:Server,Storage:HardDrive,Phone:Smartphone,Tablet:Tablet,Other:Box,all:Box}

const STATUS_CONFIG = {
  active:    { label: 'ยืมอยู่',        bg: '#EAF3DE', color: '#3B6D11' },
  overdue:   { label: 'เกินกำหนด',     bg: '#FCEBEB', color: '#A32D2D' },
  returned:  { label: 'คืนแล้ว',       bg: '#E6F1FB', color: '#185FA5' },
  pending:   { label: 'รอดำเนินการ',   bg: '#FAEEDA', color: '#854F0B' },
  approved:  { label: 'อนุมัติแล้ว',   bg: '#EAF3DE', color: '#3B6D11' },
  rejected:  { label: 'ปฏิเสธ',        bg: '#FCEBEB', color: '#A32D2D' },
}

const DEPT_COLORS = {
  IT:         { bg: '#E6F1FB', color: '#185FA5' },
  HR:         { bg: '#E1F5EE', color: '#0F6E56' },
  Finance:    { bg: '#FAEEDA', color: '#854F0B' },
  Operations: { bg: '#EEEDFE', color: '#534AB7' },
  Marketing:  { bg: '#FBEAF0', color: '#993556' },
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
        <Icon size={14} color={color} /> {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, color: color || 'var(--text)' }}>{value}</div>
    </div>
  )
}

function Badge({ text, bg, color }) {
  return <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: bg, color, fontWeight: 500 }}>{text}</span>
}

function Stat({label, val, unit, color}) {
  return (
    <div style={{padding:'7px 0',borderBottom:'1px solid var(--border)'}}>
      <div style={{fontSize:10,color:'#ffffff',marginBottom:2}}>{label}</div>
      <div style={{fontFamily:'var(--mono)',fontWeight:600,fontSize:14,color:color||'#ffffff'}}>
        {val} <span style={{fontSize:10,fontWeight:400,color:'#ffffff'}}>{unit}</span>
      </div>
    </div>
  )
}

function CategoryDropdown({ current, onSelect, isOpen, onToggle }) {
  const Icon = ICON[current] || Box
  return (
    <div style={{position: 'relative'}}>
      <button onClick={onToggle} style={{background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '8px 12px', color: '#ffffff', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6}}>
        <Icon size={16} />
        <span>{current==='all'?'ทั้งหมด':current}</span>
        <ChevronDown size={14} />
      </button>
      {isOpen && (
        <div style={{position: 'absolute', right: 0, top: '100%', marginTop: 8, background: 'rgba(255,255,255,0.95)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, minWidth: 160, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 1000}}>
          {CATS.map(cat => {
            const CatIcon = ICON[cat] || Box
            return (
              <button key={cat} onClick={() => { onSelect(cat); onToggle(); }} style={{width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', borderRadius: 6, color: cat===current?'var(--accent)':'var(--text)', cursor: 'pointer', fontSize: 12, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s'}}>
                <CatIcon size={16} />
                <span>{cat==='all'?'ทั้งหมด':cat}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SearchFilterBar({ search, setSearch, filterStatus, setFilterStatus, filterDept, setFilterDept, statusOptions }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
        <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ / อุปกรณ์..."
          style={{ width: '100%', paddingLeft: 28, paddingRight: 8, paddingTop: 7, paddingBottom: 7, fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text3)', display: 'flex' }}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* Status filter */}
      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
        style={{ fontSize: 12, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}>
        <option value="">สถานะทั้งหมด</option>
        {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      {/* Dept filter */}
      <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
        style={{ fontSize: 12, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}>
        <option value="">แผนกทั้งหมด</option>
        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function BorrowPage() {
  const [tab, setTab] = useState('borrow')
  const [borrows, setBorrows] = useState([])
  const [requisitions, setRequisitions] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [toast, setToast] = useState(null)

  // form state
  const [form, setForm] = useState({ person: '', dept: '', item: '', qty: 1, dueDate: '', note: '' })
  const [stockItems, setStockItems] = useState([])

  // filter/search state — borrow
  const [bSearch, setBSearch] = useState('')
  const [bFilterStatus, setBFilterStatus] = useState('')
  const [bFilterDept, setBFilterDept] = useState('')

  // filter/search state — requisition
  const [rSearch, setRSearch] = useState('')
  const [rFilterStatus, setRFilterStatus] = useState('')
  const [rFilterDept, setRFilterDept] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false)
  const [category, setCategory] = useState('all')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // fetch from API
  const fetchData = async () => {
    setLoading(true)
    try {
      const [bRes, rRes, sRes] = await Promise.all([
        fetch('/api/borrows'),
        fetch('/api/requisitions'),
        fetch('/api/stock'),
      ])
      if (bRes.ok) {
        const bData = await bRes.json()
        setBorrows(Array.isArray(bData) ? bData : [])
      }
      if (rRes.ok) {
        const rData = await rRes.json()
        setRequisitions(Array.isArray(rData) ? rData : [])
      }
      if (sRes.ok) {
        const sData = await sRes.json()
        setStockItems(Array.isArray(sData) ? sData : [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // filtered lists
  const filteredBorrows = useMemo(() => borrows.filter(b => {
    const q = bSearch.toLowerCase()
    const matchSearch = !q || b.borrower.includes(q) || b.item.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)
    const matchStatus = !bFilterStatus || b.status === bFilterStatus
    const matchDept   = !bFilterDept   || b.dept === bFilterDept
    return matchSearch && matchStatus && matchDept
  }), [borrows, bSearch, bFilterStatus, bFilterDept])

  const filteredReqs = useMemo(() => requisitions.filter(r => {
    const q = rSearch.toLowerCase()
    const matchSearch = !q || r.requester.includes(q) || r.item.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
    const matchStatus = !rFilterStatus || r.status === rFilterStatus
    const matchDept   = !rFilterDept   || r.dept === rFilterDept
    return matchSearch && matchStatus && matchDept
  }), [requisitions, rSearch, rFilterStatus, rFilterDept])

  // stats
  const stats = {
    total:    borrows.length + requisitions.length,
    low:      borrows.filter(b => b.status === 'overdue').length,
    totalQty: borrows.reduce((s,b) => s + b.qty, 0) + requisitions.reduce((s,r) => s + r.qty, 0),
  }

  const handleSubmit = async () => {
    if (!form.person || !form.dept || !form.item) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error'); return
    }
    if (tab === 'borrow' && !form.dueDate) {
      showToast('กรุณาระบุวันกำหนดคืน', 'error'); return
    }

    setSubmitLoading(true)
    try {
      const endpoint = tab === 'borrow' ? '/api/borrows' : '/api/requisitions'
      const body = tab === 'borrow'
        ? { borrower: form.person, dept: form.dept, item: form.item, qty: form.qty, dueDate: form.dueDate, note: form.note, borrowDate: new Date().toISOString().slice(0, 10), status: 'active' }
        : { requester: form.person, dept: form.dept, item: form.item, qty: form.qty, note: form.note, requestDate: new Date().toISOString().slice(0, 10), status: 'pending' }

      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      if (res.ok) {
        const newItem = await res.json()
        if (tab === 'borrow') setBorrows(prev => [newItem, ...prev])
        else setRequisitions(prev => [newItem, ...prev])
        showToast(tab === 'borrow' ? 'บันทึกรายการยืมเรียบร้อย!' : 'ส่งคำขอเบิกเรียบร้อย!')
        setForm({ person: '', dept: '', item: '', qty: 1, dueDate: '', note: '' })
      } else {
        throw new Error('API error')
      }
    } catch {
      // fallback: add locally with mock id
      const newId = tab === 'borrow' ? `B${String(borrows.length + 1).padStart(3, '0')}` : `R${String(requisitions.length + 1).padStart(3, '0')}`
      if (tab === 'borrow') {
        setBorrows(prev => [{ id: newId, borrower: form.person, dept: form.dept, item: form.item, qty: form.qty, borrowDate: new Date().toISOString().slice(0, 10), dueDate: form.dueDate, status: 'active', note: form.note }, ...prev])
      } else {
        setRequisitions(prev => [{ id: newId, requester: form.person, dept: form.dept, item: form.item, qty: form.qty, requestDate: new Date().toISOString().slice(0, 10), status: 'pending', note: form.note }, ...prev])
      }
      showToast(tab === 'borrow' ? 'บันทึกรายการยืมเรียบร้อย! (offline)' : 'ส่งคำขอเบิกเรียบร้อย! (offline)')
      setForm({ person: '', dept: '', item: '', qty: 1, dueDate: '', note: '' })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleReturn = async (id) => {
    try {
      await fetch(`/api/borrows/${id}/return`, { method: 'PATCH' })
    } catch {}
    setBorrows(prev => prev.map(b => b.id === id ? { ...b, status: 'returned' } : b))
    showToast('บันทึกการคืนเรียบร้อย!')
  }

  const handleApprove = async (id) => {
    try {
      await fetch(`/api/requisitions/${id}/approve`, { method: 'PATCH' })
    } catch {}
    setRequisitions(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r))
    showToast('อนุมัติรายการเรียบร้อย!')
  }

  const handleReject = async (id) => {
    try {
      await fetch(`/api/requisitions/${id}/reject`, { method: 'PATCH' })
    } catch {}
    setRequisitions(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r))
    showToast('ปฏิเสธรายการแล้ว', 'error')
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-'

  return (
    <>
      <Head>
        <title>ยืม/เบิกอุปกรณ์ - IT Stock Management</title>
      </Head>

      <div style={{...layout, backgroundImage: 'url(/images/bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed'}}>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, background: toast.type === 'error' ? 'var(--danger)' : 'var(--success)', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn .2s ease', boxShadow: '0 4px 12px rgba(0,0,0,.15)' }}>
            {toast.type === 'error' ? <AlertCircle size={15} /> : <Check size={15} />} {toast.msg}
          </div>
        )}

        {/* Navbar */}
        <nav style={navbar}>
          <div style={{maxWidth:1400,margin:'0 auto',width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            {/* <div style={navbarLeft}>
              <div style={logoBox}>IT</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Stock Manager</div>
            </div> */}
            <div style={navbarNav}>
              <Link href="/" className="nav-link" style={navItem(false)}><Package size={16} /> Stock รายการ</Link>
              <Link href="/location" className="nav-link" style={navItem(false)}><MapPin size={16} /> จัดการตำแหน่ง</Link>
              <Link href="/borrow" className="nav-link" style={navItem(true)}><Scan size={16} /> ยืม & เบิก อุปกรณ์ ( Develop )</Link>
              {/* <SettingsDropdown isOpen={settingsDropdownOpen} onToggle={() => setSettingsDropdownOpen(!settingsDropdownOpen)} currentPage="index" /> */}
            </div>
            <div style={navbarRight}>
              <CategoryDropdown current={category} onSelect={setCategory} isOpen={dropdownOpen} onToggle={() => setDropdownOpen(!dropdownOpen)} />
              <SettingsDropdown isOpen={settingsDropdownOpen} onToggle={() => setSettingsDropdownOpen(!settingsDropdownOpen)} currentPage="index" />
              <Stat label="รายการ" val={stats.total} unit="รายการ" />
              <Stat label="รวม" val={stats.totalQty} unit="ชิ้น" />
              <Stat label="ใกล้หมด" val={stats.low} unit="รายการ" color={stats.low>0?'var(--warning)':'var(--success)'} />
            </div>
          </div>
        </nav>

        {/* Main */}
        <main style={mainArea}>
          <div style={{maxWidth:1400,width:'100%',margin:'0 auto'}}>

          {/* Tab */}
          <div style={{display:'flex',gap:0,background:'rgba(255,255,255,0.85)',border:'1px solid var(--border)',borderRadius:8,overflow:'hidden',width:'fit-content',marginBottom:20,backdropFilter:'blur(10px)'}}>
            {[
              { key: 'borrow',      icon: Clock,          label: 'ยืมอุปกรณ์' },
              { key: 'requisition', icon: ClipboardCheck, label: 'เบิกอุปกรณ์' },
            ].map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setTab(key)} style={{padding:'9px 20px',fontSize:13,fontWeight:500,cursor:'pointer',border:'none',background:tab === key ? 'var(--accent-glow)' : 'transparent',color:tab === key ? 'var(--accent)' : 'var(--text2)',display:'flex',alignItems:'center',gap:6,transition:'all .15s',border: tab === key ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent'}}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
            <StatCard icon={Clock}          label="กำลังยืมอยู่"  value={stats.active}   color="var(--accent)" />
            <StatCard icon={AlertCircle}    label="เกินกำหนด"    value={stats.overdue}  color="var(--danger)" />
            <StatCard icon={ClipboardCheck} label="เบิกทั้งหมด"  value={stats.reqMonth} color="var(--success)" />
            <StatCard icon={Box}            label="คืนแล้ว"       value={stats.returned} color="var(--warning)" />
          </div>

          {/* Content grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, alignItems: 'start' }}>

            {/* ── Form ── */}
            <div style={{background:'rgba(255,255,255,0.85)',border:'1px solid var(--border)',borderRadius:12,padding:20,backdropFilter:'blur(10px)'}}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={15} color="var(--accent)" />
                {tab === 'borrow' ? 'สร้างรายการยืมใหม่' : 'สร้างรายการเบิกใหม่'}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: tab === 'borrow' ? 'ชื่อผู้ยืม' : 'ชื่อผู้เบิก', key: 'person', type: 'text', placeholder: 'ชื่อ-นามสกุล' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>{label}</label>
                    <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
                      style={{ width: '100%', fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                  </div>
                ))}

                <div>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>แผนก</label>
                  <select value={form.dept} onChange={e => setForm(p => ({ ...p, dept: e.target.value }))}
                    style={{ width: '100%', fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}>
                    <option value="">-- เลือกแผนก --</option>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>อุปกรณ์</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select value={form.item} onChange={e => setForm(p => ({ ...p, item: e.target.value }))}
                      style={{ flex: 1, fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}>
                      <option value="">-- เลือกอุปกรณ์ --</option>
                      {stockItems.filter(item => !item.disabled).map(item => (
                        <option key={item.id} value={item.name}>
                          {item.name} (คงเหลือ: {item.qty})
                        </option>
                      ))}
                    </select>
                    <input type="number" min={1} max={99} value={form.qty} onChange={e => setForm(p => ({ ...p, qty: +e.target.value }))}
                      style={{ width: 56, fontSize: 13, padding: '7px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', textAlign: 'center' }} />
                  </div>
                </div>

                {tab === 'borrow' && (
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>วันกำหนดคืน</label>
                    <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                      style={{ width: '100%', fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>หมายเหตุ</label>
                  <textarea rows={2} value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="เหตุผล / รายละเอียดเพิ่มเติม"
                    style={{ width: '100%', fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', resize: 'none' }} />
                </div>

                <button onClick={handleSubmit} disabled={submitLoading}
                  style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: submitLoading ? '#6b7280' : 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: submitLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {submitLoading ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}
                  {submitLoading ? 'กำลังบันทึก...' : (tab === 'borrow' ? 'บันทึกรายการยืม' : 'ส่งคำขอเบิก')}
                </button>
              </div>
            </div>

            {/* ── Table panel ── */}
            <div style={{background:'rgba(255,255,255,0.85)',border:'1px solid var(--border)',borderRadius:12,padding:20,backdropFilter:'blur(10px)'}}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <List size={15} color="var(--accent)" />
                  {tab === 'borrow' ? `รายการยืม (${filteredBorrows.length})` : `รายการเบิก (${filteredReqs.length})`}
                </h3>
                <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, fontSize: 12, color: 'var(--text2)', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer' }}>
                  <Download size={12} /> Export
                </button>
              </div>

              {/* Search & filter */}
              {tab === 'borrow' ? (
                <SearchFilterBar
                  search={bSearch} setSearch={setBSearch}
                  filterStatus={bFilterStatus} setFilterStatus={setBFilterStatus}
                  filterDept={bFilterDept} setFilterDept={setBFilterDept}
                  statusOptions={[
                    { value: 'active',   label: 'ยืมอยู่' },
                    { value: 'overdue',  label: 'เกินกำหนด' },
                    { value: 'returned', label: 'คืนแล้ว' },
                  ]}
                />
              ) : (
                <SearchFilterBar
                  search={rSearch} setSearch={setRSearch}
                  filterStatus={rFilterStatus} setFilterStatus={setRFilterStatus}
                  filterDept={rFilterDept} setFilterDept={setRFilterDept}
                  statusOptions={[
                    { value: 'pending',  label: 'รอดำเนินการ' },
                    { value: 'approved', label: 'อนุมัติแล้ว' },
                    { value: 'rejected', label: 'ปฏิเสธ' },
                  ]}
                />
              )}

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                {tab === 'borrow' ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['รหัส', 'ผู้ยืม', 'แผนก', 'อุปกรณ์', 'วันยืม', 'วันคืน', 'สถานะ', ''].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBorrows.length === 0 ? (
                        <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>ไม่พบรายการที่ตรงกัน</td></tr>
                      ) : filteredBorrows.map(b => {
                        const st = STATUS_CONFIG[b.status] || {}
                        const dc = DEPT_COLORS[b.dept] || { bg: '#eee', color: '#333' }
                        return (
                          <tr key={b.id} className="row-hover" style={{ borderBottom: '1px solid var(--border)', background: 'transparent', transition: 'background .1s' }}>
                            <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text3)' }}>{b.id}</td>
                            <td style={{ padding: '9px 10px', fontWeight: 500, whiteSpace: 'nowrap' }}>{b.borrower}</td>
                            <td style={{ padding: '9px 10px' }}><Badge text={b.dept} bg={dc.bg} color={dc.color} /></td>
                            <td style={{ padding: '9px 10px', color: 'var(--text2)' }}>{b.item} × {b.qty}</td>
                            <td style={{ padding: '9px 10px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fmtDate(b.borrowDate)}</td>
                            <td style={{ padding: '9px 10px', whiteSpace: 'nowrap', color: b.status === 'overdue' ? '#e24b4a' : 'var(--text2)', fontWeight: b.status === 'overdue' ? 500 : 400 }}>{fmtDate(b.dueDate)}</td>
                            <td style={{ padding: '9px 10px' }}><Badge text={st.label} bg={st.bg} color={st.color} /></td>
                            <td style={{ padding: '9px 10px' }}>
                              {b.status !== 'returned' && (
                                <button onClick={() => handleReturn(b.id)}
                                  style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                  บันทึกคืน
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['รหัส', 'ผู้เบิก', 'แผนก', 'อุปกรณ์', 'วันที่ขอ', 'หมายเหตุ', 'สถานะ', ''].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReqs.length === 0 ? (
                        <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>ไม่พบรายการที่ตรงกัน</td></tr>
                      ) : filteredReqs.map(r => {
                        const st = STATUS_CONFIG[r.status] || {}
                        const dc = DEPT_COLORS[r.dept] || { bg: '#eee', color: '#333' }
                        return (
                          <tr key={r.id} className="row-hover" style={{ borderBottom: '1px solid var(--border)', background: 'transparent', transition: 'background .1s' }}>
                            <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text3)' }}>{r.id}</td>
                            <td style={{ padding: '9px 10px', fontWeight: 500, whiteSpace: 'nowrap' }}>{r.requester}</td>
                            <td style={{ padding: '9px 10px' }}><Badge text={r.dept} bg={dc.bg} color={dc.color} /></td>
                            <td style={{ padding: '9px 10px', color: 'var(--text2)' }}>{r.item} × {r.qty}</td>
                            <td style={{ padding: '9px 10px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fmtDate(r.requestDate)}</td>
                            <td style={{ padding: '9px 10px', color: 'var(--text2)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.note || '-'}</td>
                            <td style={{ padding: '9px 10px' }}><Badge text={st.label} bg={st.bg} color={st.color} /></td>
                            <td style={{ padding: '9px 10px' }}>
                              {r.status === 'pending' && (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button onClick={() => handleApprove(r.id)}
                                    style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid #5DCAA5', background: 'transparent', color: '#1d9e75', cursor: 'pointer' }}>
                                    อนุมัติ
                                  </button>
                                  <button onClick={() => handleReject(r.id)}
                                    style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid #f09595', background: 'transparent', color: '#A32D2D', cursor: 'pointer' }}>
                                    ปฏิเสธ
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
          </div>
        </main>
      </div>
    </>
  )
}
