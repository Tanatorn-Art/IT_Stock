'use client'

import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Package, MapPin, Scan,
  Clock, ClipboardCheck, AlertCircle, Box,
  Plus, List, Search, Check, X,
  RefreshCw, Download, User, Building2, CheckCircle2, Eye,
  Mouse, Monitor, Network,
  Server, HardDrive, Smartphone, Tablet, Laptop
} from 'lucide-react'

const SettingsDropdown = dynamic(() => import('../components/SettingsDropdown'), { ssr: false })

// ── styles ────────────────────────────────────────────────────────────────────
const layout = { display: 'flex', flexDirection: 'column', minHeight: '100vh' }
const navbar = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', position: 'sticky', top: 0, zIndex: 100, width: '100%', backgroundImage: 'url(/images/bg_navbar.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }
const navbarNav = { display: 'flex', alignItems: 'center', gap: 4 }
const navbarRight = { display: 'flex', alignItems: 'center', gap: 12 }
const navItem = (a) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, fontSize: 13, color: '#ffffff', background: a ? 'var(--accent-glow)' : 'transparent', border: a ? '1px solid rgba(0,212,255,.2)' : '1px solid transparent', fontWeight: a ? 600 : 400, transition: 'all .15s', cursor: 'pointer', textDecoration: 'none' })
const mainArea = { flex: 1, padding: 24, minWidth: 0, overflowX: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'transparent' }

// ── helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  active:   { label: 'ยืมอยู่',      bg: '#EAF3DE', color: '#3B6D11' },
  overdue:  { label: 'เกินกำหนด',   bg: '#FCEBEB', color: '#A32D2D' },
  returned: { label: 'คืนแล้ว',     bg: '#E6F1FB', color: '#185FA5' },
  pending:  { label: 'ใช้อยู่', bg: '#DEFFEB', color: '#04632B' },
  approved: { label: 'อนุมัติแล้ว', bg: '#EAF3DE', color: '#3B6D11' },
  rejected: { label: 'ปฏิเสธ',      bg: '#FCEBEB', color: '#A32D2D' },
  completed: { label: 'รับคืนแล้ว', bg: '#E6F1FB', color: '#185FA5' },
}

const DEPT_COLORS = {
  IT:         { bg: '#E6F1FB', color: '#185FA5' },
  HR:         { bg: '#E1F5EE', color: '#0F6E56' },
  Finance:    { bg: '#FAEEDA', color: '#854F0B' },
  Operations: { bg: '#EEEDFE', color: '#534AB7' },
  Marketing:  { bg: '#FBEAF0', color: '#993556' },
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-'

// ── shared components ─────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
        <Icon size={14} color={color} /> {label}
        <div style={{ fontSize: 16, fontWeight: 600, color: color || 'var(--text)', marginLeft: 'auto' }}>{value}</div>
      </div>
    </div>
  )
}

function Badge({ text, bg, color }) {
  return <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: bg, color, fontWeight: 500 }}>{text}</span>
}

function EmployeeLookupPhoto({ employeeId }) {
  const [showFallback, setShowFallback] = useState(false)
  useEffect(() => {
    setShowFallback(false)
  }, [employeeId])
  if (!employeeId) return null
  const frame = {
    width: 76,
    height: 76,
    borderRadius: 12,
    border: '1px solid var(--border)',
    flexShrink: 0,
    overflow: 'hidden',
    background: 'var(--surface2)',
  }
  if (showFallback) {
    return (
      <div style={{ ...frame, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)',height: 130, width: 90, padding: 4 }} aria-hidden>
        <User size={32} strokeWidth={1.5} />
      </div>
    )
  }
  return (
    <img
      alt=""
      src={`/api/employee-image/${encodeURIComponent(employeeId)}`}
      onError={() => setShowFallback(true)}
      style={{ ...frame, display: 'block', objectFit: 'cover', height: 130, width: 90, padding: 4 }}
    />
  )
}
function EmployeeLookupPhotoModal({ employeeId }) {
  const [showFallback, setShowFallback] = useState(false)
  useEffect(() => {
    setShowFallback(false)
  }, [employeeId])
  if (!employeeId) return null
  const frame = {
    width: 120,
    height: 120,
    borderRadius: 12,
    border: '1px solid var(--border)',
    flexShrink: 0,
    overflow: 'hidden',
    background: 'var(--surface2)',
  }
  if (showFallback) {
    return (
      <div style={{ ...frame, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)',height: 130, width: 90, padding: 4 }} aria-hidden>
        <User size={32} strokeWidth={1.5} />
      </div>
    )
  }
  return (
    <img
      alt=""
      src={`/api/employee-image/${encodeURIComponent(employeeId)}`}
      onError={() => setShowFallback(true)}
      style={{ ...frame, display: 'block', objectFit: 'cover', height: 200, width: 130, padding: 4 }}
    />
  )
}

function StockItemPhoto({ itemName, stockItems }) {
  const stockItem = stockItems.find(i => i.name === itemName)
  const imageUrl = stockItem?.image

  const frame = {
    width: 130,
    height: 130,
    borderRadius: 12,
    border: '1px solid var(--border)',
    flexShrink: 0,
    overflow: 'hidden',
    background: 'var(--surface2)',
  }

  if (!imageUrl) {
    return (
      <div style={{ ...frame, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 42.5, marginTop: 3,
                    color: 'var(--text3)', fontSize: 40, width: 130, height: 130 }}>
        📦
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={itemName}
      style={{ ...frame, display: 'block', objectFit: 'cover', height: 130, width: 130, padding: 4 , marginLeft: 42.5, marginTop: 3 }}
    />
  )
}

function Stat({ label, val, unit, color }) {
  return (
    <div style={{ padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, color: '#ffffff', marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 14, color: color || '#ffffff' }}>
        {val} <span style={{ fontSize: 10, fontWeight: 400, color: '#ffffff' }}>{unit}</span>
      </div>
    </div>
  )
}

// ── SearchFilterBar ───────────────────────────────────────────────────────────
function SearchFilterBar({ search, setSearch, filterStatus, setFilterStatus, statusOptions }) {
  const [localSearch, setLocalSearch] = useState(search || '')

  useEffect(() => { setLocalSearch(search || '') }, [search])

  const handleSearchChange = (e) => {
    const value = e.target.value
    setLocalSearch(value)
    setSearch(value)
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
        <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={localSearch}
          onChange={handleSearchChange}
          placeholder="ค้นหาชื่อ..."
          style={{ width: '100%', paddingLeft: 28, paddingRight: 8, paddingTop: 7, paddingBottom: 7, fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
        />
        {localSearch && (
          <button onClick={() => { setLocalSearch(''); setSearch('') }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text3)', display: 'flex' }}>
            <X size={12} />
          </button>
        )}
      </div>
      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
        style={{ fontSize: 12, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}>
        <option value="">สถานะทั้งหมด</option>
        {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </div>
  )
}

// ── ItemPickerPanel ───────────────────────────────────────────────────────────
function ItemPickerPanel({ stockItems, form, setForm }) {
  const [itemSearch, setItemSearch] = useState('')
  const searchTerm = itemSearch.toLowerCase().trim()
  const filteredItems = stockItems.filter(item =>
    !item.disabled &&
    (item.name.toLowerCase().includes(searchTerm) ||
    (item.brand && item.brand.toLowerCase().includes(searchTerm)) ||
    (item.model && item.model.toLowerCase().includes(searchTerm)) ||
    (item.category && item.category.toLowerCase().includes(searchTerm)))
  ).sort((a, b) => {
    // Sort in-stock items first, out-of-stock items last
    const aOutOfStock = a.quantity <= 0
    const bOutOfStock = b.quantity <= 0

    if (aOutOfStock && !bOutOfStock) return 1  // a is out of stock, put it after b
    if (!aOutOfStock && bOutOfStock) return -1 // b is out of stock, put it after a

    // If both have same stock status, sort by name
    return a.name.localeCompare(b.name, 'th')
  })

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={itemSearch}
            onChange={e => setItemSearch(e.target.value)}
            placeholder="ค้นหาอุปกรณ์..."
            style={{ width: '100%', paddingLeft: 28, paddingRight: 8, paddingTop: 7, paddingBottom: 7, fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {filteredItems.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '32px 0' }}>ไม่พบอุปกรณ์</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, maxHeight: 480, overflowY: 'auto', paddingRight: 4 }}>
        {filteredItems.map(item => {
          const isOutOfStock = item.quantity <= 0
          return (
          <div
            key={item.id}
            onClick={() => !isOutOfStock && setForm(prev => ({ ...prev, item: item.name, qty: 1 }))}
            style={{
              background: form.item === item.name ? 'var(--accent-glow)' : (isOutOfStock ? 'rgba(200,200,200,0.3)' : 'rgba(255,255,255,0.85)'),
              border: form.item === item.name ? '2px solid var(--accent)' : (isOutOfStock ? '1px solid #ccc' : '1px solid var(--border)'),
              borderRadius: 10, padding: 12, cursor: isOutOfStock ? 'not-allowed' : 'pointer', transition: 'all .2s ease',
              display: 'flex', flexDirection: 'column', position: 'relative',
              marginTop: 5, opacity: isOutOfStock ? 0.6 : 1
            }}
            onMouseEnter={e => { if (!isOutOfStock) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' } }}
            onMouseLeave={e => { if (!isOutOfStock) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {item.image ? (
                <img src={item.image} alt={item.name} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
              ) : (
                <div style={{ width: 64, height: 64, background: 'var(--surface2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.brand} {item.model || ''}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{item.category}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: isOutOfStock ? '#999' : (form.item === item.name ? 'var(--accent)' : 'var(--text)'), fontFamily: 'var(--mono)' }}>
                {item.quantity} ชิ้น
              </span>
            </div>
            {!isOutOfStock && item.quantity <= item.minQuantity && (
              <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 10, background: 'var(--warning)', color: '#fff', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>ใกล้หมด</div>
            )}
            {isOutOfStock && (
              <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 10, background: '#999', color: '#fff', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>หมด</div>
            )}
            {form.item === item.name && !isOutOfStock && (
              <div style={{ position: 'absolute', top: 6, left: 6, fontSize: 10, background: 'var(--accent)', color: '#fff', padding: '1px 5px', borderRadius: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Check size={9} /> เลือกแล้ว
              </div>
            )}
          </div>
          )
        })}
      </div>
    </>
  )
}

// ── BorrowListPanel ───────────────────────────────────────────────────────────
function BorrowListPanel({ filteredBorrows, bSearch, setBSearch, bFilterStatus, setBFilterStatus, handleReturn, calculateOverdueDays, onOpenDetail }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={15} color="var(--accent)" />
          รายการยืม ({filteredBorrows.length})
        </h3>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, fontSize: 12, color: 'var(--text2)', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer' }}>
          <Download size={12} /> Export
        </button>
      </div>
      <SearchFilterBar
        search={bSearch} setSearch={setBSearch}
        filterStatus={bFilterStatus} setFilterStatus={setBFilterStatus}
        statusOptions={[
          { value: 'active',   label: 'ยืมอยู่' },
          { value: 'overdue',  label: 'เกินกำหนด' },
          { value: 'returned', label: 'คืนแล้ว' },
        ]}
      />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['รหัส', 'รหัสพนักงาน', 'ผู้ยืม', 'แผนก', 'อุปกรณ์', 'วันยืม', 'วันคืน', 'สถานะ', ''].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredBorrows.length === 0 ? (
              <tr><td colSpan={10} style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>ไม่พบรายการที่ตรงกัน</td></tr>
            ) : filteredBorrows.map(b => {
              const st = STATUS_CONFIG[b.status] || {}
              const dc = DEPT_COLORS[b.dept] || { bg: '#eee', color: '#333' }
              return (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .1s' }}>
                  <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text3)' }}>{b.id}</td>
                  <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text2)' }}>{b.employee_code || '—'}</td>
                  <td style={{ padding: '9px 10px', fontWeight: 500, whiteSpace: 'nowrap' }}>{b.borrower}</td>
                  <td style={{ padding: '9px 10px' }}><Badge text={b.dept} bg={dc.bg} color={dc.color} /></td>
                  <td style={{ padding: '9px 10px', color: 'var(--text2)' }}>{b.item} × {b.qty}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fmtDate(b.borrow_date)}</td>
                  <td style={{ padding: '9px 10px', whiteSpace: 'nowrap', color: b.status === 'overdue' ? '#e24b4a' : 'var(--text2)', fontWeight: b.status === 'overdue' ? 500 : 400 }}>
                    {fmtDate(b.due_date)}
                    {b.status === 'active' && calculateOverdueDays(b.due_date) > 0 && (
                      <span style={{ marginLeft: 6, fontSize: 11, color: '#e24b4a', fontWeight: 600 }}>
                        (เกิน {calculateOverdueDays(b.due_date)} วัน)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '9px 10px' }}><Badge text={st.label} bg={st.bg} color={st.color} /></td>
                  <td style={{ padding: '9px 10px' }}>
                    {b.status !== 'returned' && (
                      <button onClick={() => handleReturn(b.id, b.qty)}
                        style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        บันทึกคืน
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '9px 10px' }}>
                    <button
                      onClick={() => onOpenDetail?.('borrow', b)}
                      title="ดูรายละเอียด"
                      style={{
                        width: 28,
                        height: 28,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text2)',
                        cursor: 'pointer',
                      }}
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── RequisitionListPanel ──────────────────────────────────────────────────────
function RequisitionListPanel({ filteredReqs, rSearch, setRSearch, rFilterStatus, setRFilterStatus, handleOpenReceiveReturnModal, onOpenDetail }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardCheck size={15} color="var(--accent)" />
          รายการเบิก ({filteredReqs.length})
        </h3>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, fontSize: 12, color: 'var(--text2)', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer' }}>
          <Download size={12} /> Export
        </button>
      </div>
      <SearchFilterBar
        search={rSearch} setSearch={setRSearch}
        filterStatus={rFilterStatus} setFilterStatus={setRFilterStatus}
        statusOptions={[
          { value: 'pending',  label: 'รอดำเนินการ' },
          { value: 'completed', label: 'รับคืนแล้ว' },
        ]}
      />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['รหัส', 'รหัสพนักงาน', 'ผู้เบิก', 'แผนก', 'อุปกรณ์', 'วันที่ขอ','วันที่รับคืน', 'สถานะ', ''].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredReqs.length === 0 ? (
              <tr><td colSpan={11} style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>ไม่พบรายการที่ตรงกัน</td></tr>
            ) : filteredReqs.map(r => {
              const st = STATUS_CONFIG[r.status] || {}
              const dc = DEPT_COLORS[r.dept] || { bg: '#eee', color: '#333' }
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .1s' }}>
                  <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text3)' }}>{r.id}</td>
                  <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text2)' }}>{r.employee_code || '—'}</td>
                  <td style={{ padding: '9px 10px', fontWeight: 500, whiteSpace: 'nowrap' }}>{r.requester}</td>
                  <td style={{ padding: '9px 10px' }}><Badge text={r.dept} bg={dc.bg} color={dc.color} /></td>
                  <td style={{ padding: '9px 10px', color: 'var(--text2)' }}>{r.item} × {r.qty}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fmtDate(r.request_date)}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{r.status === 'pending' ? '-' : (r.updatedAt ? fmtDate(r.updatedAt) : '-')}</td>
                  {/* <td style={{ padding: '9px 10px', color: 'var(--text2)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.note || '-'}</td> */}
                  <td style={{ padding: '9px 10px' }}><Badge text={st.label} bg={st.bg} color={st.color} /></td>
                  <td style={{ padding: '9px 10px' }}>
                    {r.status === 'pending' && (
                      <button onClick={() => handleOpenReceiveReturnModal(r.id, r.item, r.qty, r.requester)}
                        style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid #5DCAA5', background: 'transparent', color: '#1d9e75', cursor: 'pointer' }}>
                        รับคืน
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '9px 10px' }}>
                    <button
                      onClick={() => onOpenDetail?.('requisition', r)}
                      title="ดูรายละเอียด"
                      style={{
                        width: 28,
                        height: 28,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text2)',
                        cursor: 'pointer',
                      }}
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function BorrowPage() {
  // 'borrow' | 'requisition' | 'borrow-list' | 'requisition-list'
  const [tab, setTab] = useState('borrow')

  const [borrows, setBorrows] = useState([])
  const [requisitions, setRequisitions] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const [form, setForm] = useState({ person: '', dept: '', item: '', qty: 1, dueDate: '', note: '' })
  const [employeeId, setEmployeeId] = useState('')
  const [employeeData, setEmployeeData] = useState(null)
  const [lookedUpEmployeeId, setLookedUpEmployeeId] = useState('')
  const [employeeLoading, setEmployeeLoading] = useState(false)
  const [stockItems, setStockItems] = useState([])

  const [bSearch, setBSearch] = useState('')
  const [bFilterStatus, setBFilterStatus] = useState('')
  const [rSearch, setRSearch] = useState('')
  const [rFilterStatus, setRFilterStatus] = useState('')

  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false)

  // Return modal state
  const [returnModal, setReturnModal] = useState({ open: false, borrowId: null, maxQty: 0, returnQty: 0 })

  // ✅ เพิ่ม state สำหรับ modal รับคืน
  const [receiveReturnModal, setReceiveReturnModal] = useState({ open: false, requisitionId: null, item: '', qty: 0, requester: '' })

  // Detail modal (borrow / requisition)
  const [detailModal, setDetailModal] = useState({ open: false, type: 'borrow', data: null })
  const [detailEmployeeData, setDetailEmployeeData] = useState(null)
  const [detailEmployeeLoading, setDetailEmployeeLoading] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchEmployeeData = async (empId) => {
    if (!empId.trim()) {
      setEmployeeData(null)
      setLookedUpEmployeeId('')
      setForm(prev => ({ ...prev, person: '', dept: '' }))
      return
    }
    setEmployeeLoading(true)
    try {
      const response = await fetch(`/api/employee-lookup?employeeId=${encodeURIComponent(empId)}`)
      if (response.ok) {
        const responseJson = await response.json()
        if (responseJson.success && responseJson.data && responseJson.data.length > 0) {
          const employee = responseJson.data[0]
          const fullName = employee.nameEng && employee.lastNameEng
            ? `${employee.nameEng.trim()} ${employee.lastNameEng.trim()}`.trim()
            : employee.fullName || ''
          const idKey = empId.trim()
          setEmployeeData(employee)
          setLookedUpEmployeeId(idKey)
          setForm(prev => ({ ...prev, person: fullName, dept: employee.departmentGroup || '' }))
          showToast('พบข้อมูลพนักงาน', 'success')
        } else {
          setEmployeeData(null)
          setLookedUpEmployeeId('')
          showToast('ไม่พบข้อมูลพนักงาน', 'error')
        }
      } else {
        setEmployeeData(null)
        setLookedUpEmployeeId('')
        showToast('ไม่สามารถเชื่อมต่อ API พนักงาน', 'error')
      }
    } catch (error) {
      console.error('Employee lookup error:', error)
      setEmployeeData(null)
      setLookedUpEmployeeId('')
      showToast('เกิดข้อผิดพลาดในการค้นหาข้อมูล', 'error')
    } finally {
      setEmployeeLoading(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [bRes, rRes, sRes] = await Promise.all([
        fetch('/api/borrows'),
        fetch('/api/requisitions'),
        fetch('/api/stock'),
      ])
      if (bRes.ok) { const d = await bRes.json(); setBorrows(Array.isArray(d) ? d : []) }
      if (rRes.ok) { const d = await rRes.json(); setRequisitions(Array.isArray(d) ? d : []) }
      if (sRes.ok) { const d = await sRes.json(); setStockItems(Array.isArray(d) ? d : []) }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Calculate overdue days
  const calculateOverdueDays = (dueDate) => {
    if (!dueDate) return 0
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = today - due
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const filteredBorrows = useMemo(() => borrows.filter(b => {
    const q = bSearch.toLowerCase()
    const matchSearch = !q || b.borrower.toLowerCase().includes(q) || b.item.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || String(b.employee_code || '').toLowerCase().includes(q)
    const matchStatus = !bFilterStatus || b.status === bFilterStatus
    return matchSearch && matchStatus
  }), [borrows, bSearch, bFilterStatus])

  const filteredReqs = useMemo(() => requisitions.filter(r => {
    const q = rSearch.toLowerCase()
    const matchSearch = !q || r.requester.toLowerCase().includes(q) || r.item.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || String(r.employee_code || '').toLowerCase().includes(q)
    const matchStatus = !rFilterStatus || r.status === rFilterStatus
    return matchSearch && matchStatus
  }), [requisitions, rSearch, rFilterStatus])

  const stats = {
    total:    borrows.length + requisitions.length,
    totalQty: borrows.reduce((s, b) => s + b.qty, 0) + requisitions.reduce((s, r) => s + r.qty, 0),
    active:   borrows.filter(b => b.status === 'active').length,
    overdue:  borrows.filter(b => b.status === 'overdue').length,
    returned: borrows.filter(b => b.status === 'returned').length,
    reqMonth: requisitions.length,
  }

  const resetForm = () => {
    setForm({ person: '', dept: '', item: '', qty: 1, dueDate: '', note: '' })
    setEmployeeData(null)
    setLookedUpEmployeeId('')
    setEmployeeId('')
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
      const emp = employeeId.trim()
      const body = tab === 'borrow'
        ? { borrower: form.person, employeeCode: emp, dept: form.dept, item: form.item, qty: form.qty, dueDate: form.dueDate, note: form.note, borrowDate: new Date().toISOString().slice(0, 10), status: 'active' }
        : { requester: form.person, employeeCode: emp, dept: form.dept, item: form.item, qty: form.qty, note: form.note, requestDate: new Date().toISOString().slice(0, 10), status: 'pending' }
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        const newItem = await res.json()
        if (tab === 'borrow') setBorrows(prev => [newItem, ...prev])
        else setRequisitions(prev => [newItem, ...prev])

        // Update stock quantity via API
        try {
          const stockItem = stockItems.find(item => item.name === form.item)
          if (stockItem) {
            await fetch(`/api/stock/${stockItem.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: stockItem.name,
                brand: stockItem.brand,
                quantity: stockItem.quantity - form.qty,
                location: stockItem.location
              })
            })
          }
        } catch (error) {
          console.error('Error updating stock:', error)
        }

        // Fetch updated stock data after saving
        await fetchData()
        showToast(tab === 'borrow' ? 'บันทึกรายการยืมเรียบร้อย!' : 'ส่งคำขอเบิกเรียบร้อย!')
        resetForm()
      } else {
        throw new Error('API error')
      }
    } catch {
      const newId = tab === 'borrow'
        ? `B${String(borrows.length + 1).padStart(3, '0')}`
        : `R${String(requisitions.length + 1).padStart(3, '0')}`
      if (tab === 'borrow') {
        setBorrows(prev => [{ id: newId, borrower: form.person, employee_code: employeeId.trim(), dept: form.dept, item: form.item, qty: form.qty, borrow_date: new Date().toISOString().slice(0, 10), due_date: form.dueDate, status: 'active', note: form.note }, ...prev])
      } else {
        setRequisitions(prev => [{ id: newId, requester: form.person, employee_code: employeeId.trim(), dept: form.dept, item: form.item, qty: form.qty, request_date: new Date().toISOString().slice(0, 10), status: 'pending', note: form.note }, ...prev])
      }

      // Update stock quantity via API (even in offline mode)
      try {
        const stockItem = stockItems.find(item => item.name === form.item)
        if (stockItem) {
          await fetch(`/api/stock/${stockItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: stockItem.name,
              brand: stockItem.brand,
              quantity: stockItem.quantity - form.qty,
              location: stockItem.location
            })
          })
        }
      } catch (error) {
        console.error('Error updating stock:', error)
      }

      // Fetch updated stock data after saving (offline mode)
      try {
        await fetchData()
      } catch (error) {
        console.error('Error fetching data in offline mode:', error)
      }
      showToast(tab === 'borrow' ? 'บันทึกรายการยืมเรียบร้อย! (offline)' : 'ส่งคำขอเบิกเรียบร้อย! (offline)')
      resetForm()
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleReturn = (id, currentQty) => {
    setReturnModal({
      open: true,
      borrowId: id,
      maxQty: currentQty,
      returnQty: currentQty
    })
  }

  // ✅ เพิ่ม cancelReturn
  const cancelReturn = () => {
    setReturnModal({ open: false, borrowId: null, maxQty: 0, returnQty: 0 })
  }

  // ✅ แก้ confirmReturn (ลบ } ที่เกินออก)
  const confirmReturn = async () => {
    const { borrowId, returnQty } = returnModal
    try {
      await fetch(`/api/borrows/${borrowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnQty })
      })
    } catch (error) {
      console.error('Error confirming return:', error)
    }

    // Find the borrow item to get its details
    const borrowItem = borrows.find(b => b.id === borrowId)

    // Update stock quantity via API when items are returned
    if (borrowItem) {
      try {
        const stockItem = stockItems.find(item => item.name === borrowItem.item)
        if (stockItem) {
          await fetch(`/api/stock/${stockItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: stockItem.name,
              brand: stockItem.brand,
              quantity: stockItem.quantity + returnQty,
              location: stockItem.location
            })
          })
        }
      } catch (error) {
        console.error('Error updating stock on return:', error)
      }
    }

    setBorrows(prev => prev.map(b => {
      if (b.id === borrowId) {
        const newQty = b.qty - returnQty
        return {
          ...b,
          qty: newQty,
          status: newQty <= 0 ? 'returned' : 'active',
        }
      }
      return b
    }))

    if (returnQty >= returnModal.maxQty) {
      showToast('บันทึกการคืนเรียบร้อย!')
    } else {
      showToast(`บันทึกการคืน ${returnQty} ชิ้นเรียบร้อย!`)
    }

    setReturnModal({ open: false, borrowId: null, maxQty: 0, returnQty: 0 })

    // Refresh data to ensure UI is updated
    await fetchData()
  }

  const handleOpenReceiveReturnModal = (id, item, qty, requester) => {
    setReceiveReturnModal({
      open: true,
      requisitionId: id,
      item: item,
      qty: qty,
      requester: requester
    })
  }

  const handleCloseReceiveReturnModal = () => {
    setReceiveReturnModal({ open: false, requisitionId: null, item: '', qty: 0, requester: '' })
  }

  const handleConfirmReceiveReturn = async () => {
    const { requisitionId } = receiveReturnModal
    try {
      // Call requisitions API to update status
      const response = await fetch(`/api/requisitions/${requisitionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const updatedRequisition = await response.json()

        // Update local state
        setRequisitions(prev => prev.map(r => r.id === requisitionId ? updatedRequisition : r))

        // Update stock quantity (increase when receiving return)
        const stockItem = stockItems.find(item => item.name === updatedRequisition.item)
        if (stockItem) {
          await fetch(`/api/stock/${stockItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: stockItem.name,
              brand: stockItem.brand,
              quantity: stockItem.quantity + updatedRequisition.qty,
              location: stockItem.location
            })
          })
        }

        showToast('รับคืนรายการเรียบร้อย!')
        handleCloseReceiveReturnModal()

        // Refresh data to ensure UI is updated
        await fetchData()
      } else {
        throw new Error('API error')
      }
    } catch (error) {
      console.error('Error receiving return:', error)
      showToast('เกิดข้อผิดพลาดในการรับคืน', 'error')
    }
  }

  const handleOpenDetail = async (type, row) => {
    setDetailModal({ open: true, type, data: row })
    setDetailEmployeeData(null)

    const empCode = row?.employee_code
    if (!empCode) return

    setDetailEmployeeLoading(true)
    try {
      const res = await fetch(`/api/employee-lookup?employeeId=${encodeURIComponent(empCode)}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data?.length > 0) {
          setDetailEmployeeData(json.data[0])
        }
      }
    } catch (e) {
      console.error('Employee lookup error:', e)
    } finally {
      setDetailEmployeeLoading(false)
    }
  }

  const handleCloseDetail = () => {
    setDetailModal({ open: false, type: 'borrow', data: null })
    setDetailEmployeeData(null)
  }

  const handleReceiveReturn = async (id) => {
    try {
      // Call requisitions API to update status
      const response = await fetch(`/api/requisitions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const updatedRequisition = await response.json()

        // Update local state
        setRequisitions(prev => prev.map(r => r.id === id ? updatedRequisition : r))

        // Update stock quantity (increase when receiving return)
        const stockItem = stockItems.find(item => item.name === updatedRequisition.item)
        if (stockItem) {
          await fetch(`/api/stock/${stockItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: stockItem.name,
              brand: stockItem.brand,
              quantity: stockItem.quantity + updatedRequisition.qty,
              location: stockItem.location
            })
          })
        }

        showToast('รับคืนรายการเรียบร้อย!')

        // Refresh data to ensure UI is updated
        await fetchData()
      } else {
        throw new Error('API error')
      }
    } catch (error) {
      console.error('Error receiving return:', error)
      showToast('เกิดข้อผิดพลาดในการรับคืน', 'error')
    }
  }

  const isFormTab = tab === 'borrow' || tab === 'requisition'

  // tab button style
  const tabBtn = (key) => ({
    padding: '9px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    border: tab === key ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
    background: tab === key ? 'var(--accent-glow)' : 'transparent',
    color: tab === key ? 'var(--accent)' : 'var(--text2)',
    display: 'flex', alignItems: 'flex-start', gap: 6, transition: 'all .15s', whiteSpace: 'nowrap',
  })

  return (
    <>
      <Head>
        <title>ยืม/เบิกอุปกรณ์ - IT Stock Management</title>
      </Head>

      <div style={{ ...layout, backgroundImage: 'url(/images/bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, background: toast.type === 'error' ? 'var(--danger)' : 'var(--success)', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn .2s ease', boxShadow: '0 4px 12px rgba(0,0,0,.15)' }}>
            {toast.type === 'error' ? <AlertCircle size={15} /> : <Check size={15} />} {toast.msg}
          </div>
        )}

        {/* Navbar */}
        <nav style={navbar}>
          <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={navbarNav}>
              <Link href="/" className="nav-link" style={navItem(false)}><Package size={16} /> Stock รายการ</Link>
              <Link href="/location" className="nav-link" style={navItem(false)}><MapPin size={16} /> จัดการตำแหน่ง</Link>
              <Link href="/borrow" className="nav-link" style={navItem(true)}><Scan size={16} /> ยืม & เบิก อุปกรณ์ ( Develop )</Link>
            </div>
            <div style={navbarRight}>
              <SettingsDropdown isOpen={settingsDropdownOpen} onToggle={() => setSettingsDropdownOpen(!settingsDropdownOpen)} currentPage="index" />
              <Stat label="รายการ" val={stats.total} unit="รายการ" />
              <Stat label="รวม" val={stats.totalQty} unit="ชิ้น" />
              <Stat label="เกินกำหนด" val={stats.overdue} unit="รายการ" color={stats.overdue > 0 ? 'var(--warning)' : 'var(--success)'} />
            </div>
          </div>
        </nav>

        {/* Main */}
        <main style={mainArea}>
          <div style={{ maxWidth: 1400, width: '100%', margin: '0 auto' }}>

            {/* ── Tab bar ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap', marginTop: -25 }}>

              {/* กลุ่ม 1: ยืม/เบิก */}
              <div style={{ alignItems: 'start', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>ยืม/เบิกอุปกรณ์</span>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.85)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
                  <button style={tabBtn('borrow')} onClick={() => setTab('borrow')}><Clock size={14} /> ยืมอุปกรณ์</button>
                  <button style={tabBtn('requisition')} onClick={() => setTab('requisition')}><ClipboardCheck size={14} /> เบิกอุปกรณ์</button>
                </div>
              </div>

              {/* divider */}
              <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.2)' }} />

              {/* กลุ่ม 2: รายการ */}
              <div style={{ alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>รายการ</span>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.85)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
                  <button style={tabBtn('borrow-list')} onClick={() => setTab('borrow-list')}>
                    <List size={14} /> รายการยืม
                    {borrows.filter(b => b.status === 'active' || b.status === 'overdue').length > 0 && (
                      <span style={{ fontSize: 10, background: 'var(--accent)', color: '#fff', borderRadius: 99, padding: '1px 5px', marginLeft: 2 }}>
                        {borrows.filter(b => b.status === 'active' || b.status === 'overdue').length}
                      </span>
                    )}
                  </button>
                  <button style={tabBtn('requisition-list')} onClick={() => setTab('requisition-list')}>
                    <List size={14} /> รายการเบิก
                    {requisitions.filter(r => r.status === 'pending').length > 0 && (
                      <span style={{ fontSize: 10, background: 'var(--warning)', color: '#fff', borderRadius: 99, padding: '1px 5px', marginLeft: 2 }}>
                        {requisitions.filter(r => r.status === 'pending').length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
              <StatCard icon={Clock}          label="กำลังยืมอยู่" value={stats.active}   color="var(--accent)" />
              <StatCard icon={AlertCircle}    label="เกินกำหนด"   value={stats.overdue}  color="var(--danger)" />
              <StatCard icon={ClipboardCheck} label="เบิกทั้งหมด" value={stats.reqMonth} color="var(--success)" />
              <StatCard icon={Box}            label="คืนแล้ว"      value={stats.returned} color="var(--warning)" />
            </div>

            {/* ── Form view (ยืม / เบิก) ── */}
            {isFormTab && (
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>

                {/* Form */}
                <div style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, backdropFilter: 'blur(10px)' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Plus size={15} color="var(--accent)" />
                    {tab === 'borrow' ? 'สร้างรายการยืมใหม่' : 'สร้างรายการเบิกใหม่'}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* Employee ID */}
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>รหัสพนักงาน</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          type="text"
                          value={employeeId}
                          onChange={e => setEmployeeId(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && fetchEmployeeData(employeeId)}
                          placeholder="กรอกรหัสพนักงาน"
                          style={{ flex: 1, fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                        />
                        <button
                          onClick={() => fetchEmployeeData(employeeId)}
                          disabled={employeeLoading}
                          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--accent)', background: employeeLoading ? 'var(--surface2)' : 'var(--accent)', color: '#ffffff', fontSize: 12, fontWeight: 600, cursor: employeeLoading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {employeeLoading ? 'ค้นหา...' : 'ค้นหา'}
                        </button>
                      </div>
                      {employeeData && (
                        <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          {lookedUpEmployeeId && employeeId.trim() === lookedUpEmployeeId && (
                            <EmployeeLookupPhoto employeeId={lookedUpEmployeeId} />
                          )}
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                              <span style={{ fontSize: 12, color: 'var(--text2)', flexShrink: 0 }}>
                                {tab === 'borrow' ? 'ผู้ยืม:' : 'ผู้เบิก:'}
                              </span>
                              <span
                                title={form.person}
                                style={{
                                  fontSize: 13, fontWeight: 600, color: 'var(--text)',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  minWidth: 0, flex: 1, cursor: 'default'
                                }}
                              >
                                {form.person}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 12, color: 'var(--text2)' }}>แผนก:</span>
                              {/* <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{employeeData.departmentGroup || ''}</span> */}
                              <span
                                title={employeeData.departmentGroup}
                                style={{
                                  fontSize: 13, fontWeight: 600, color: 'var(--text)',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  minWidth: 0, flex: 1, cursor: 'default'
                                }}
                              >
                                {employeeData.departmentGroup || ''}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 12, color: 'var(--text2)' }}>หน่วยงาน:</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{employeeData.department || ''}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 12, color: 'var(--text2)' }}>WD:</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{employeeData.workDateNumber || ''}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 12, color: 'var(--text2)' }}>Level:</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{employeeData.levelCard || ''}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* อุปกรณ์ที่เลือก */}
                    {form.item ? (
                      <div style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>อุปกรณ์ที่เลือก</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{form.item}</span>
                          <button onClick={() => setForm(p => ({ ...p, item: '', qty: 1 }))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', padding: 2 }}>
                            <X size={13} />
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, color: 'var(--text2)' }}>จำนวน</span>
                          <input
                            type="number" min={1}
                            max={stockItems.find(i => i.name === form.item)?.quantity || 99}
                            value={form.qty}
                            onChange={e => {
                              const maxQty = stockItems.find(i => i.name === form.item)?.quantity || 99
                              setForm(p => ({ ...p, qty: Math.min(+e.target.value, maxQty) }))
                            }}
                            style={{ width: 56, fontSize: 13, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', textAlign: 'center' }}
                          />
                          <span style={{ fontSize: 12, color: 'var(--text3)' }}>ชิ้น</span>
                          <span style={{ fontSize: 11, color: 'var(--text3)' }}>(คงเหลือ: {stockItems.find(i => i.name === form.item)?.quantity || 0})</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
                         เลือกอุปกรณ์จากรายการทางขวา →
                      </div>
                    )}

                    {/* วันกำหนดคืน */}
                    {tab === 'borrow' && (
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>วันกำหนดคืน</label>
                        <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                          style={{ width: '100%', fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                      </div>
                    )}

                    {/* หมายเหตุ */}
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>หมายเหตุ</label>
                      <textarea rows={2} value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="เหตุผล / รายละเอียดเพิ่มเติม"
                        style={{ width: '100%', fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', resize: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <button onClick={handleSubmit} disabled={submitLoading}
                      style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: submitLoading ? '#6b7280' : 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: submitLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {submitLoading ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}
                      {submitLoading ? 'กำลังบันทึก...' : (tab === 'borrow' ? 'บันทึกรายการยืม' : 'ส่งคำขอเบิก')}
                    </button>
                  </div>
                </div>

                {/* Item picker */}
                <div style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, backdropFilter: 'blur(10px)' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Box size={15} color="var(--accent)" />
                      เลือกอุปกรณ์
                      {form.item && (
                        <span style={{ fontSize: 11, background: 'var(--accent)', color: '#fff', padding: '2px 8px', borderRadius: 99, marginLeft: 4 }}>
                          เลือกแล้ว: {form.item}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={fetchData}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 12,
                        color: 'var(--text2)',
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--surface)'
                        e.currentTarget.style.color = 'var(--accent)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--text2)'
                      }}
                    >
                      <RefreshCw size={14} />
                      รีเฟรช
                    </button>
                  </h3>
                  <ItemPickerPanel stockItems={stockItems} form={form} setForm={setForm} />
                </div>
              </div>
            )}

            {/* ── List views ── */}
            {tab === 'borrow-list' && (
              <div style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, backdropFilter: 'blur(10px)' }}>
                <BorrowListPanel
                  filteredBorrows={filteredBorrows}
                  bSearch={bSearch} setBSearch={setBSearch}
                  bFilterStatus={bFilterStatus} setBFilterStatus={setBFilterStatus}
                  handleReturn={handleReturn}
                  calculateOverdueDays={calculateOverdueDays}
                  onOpenDetail={handleOpenDetail}
                />
              </div>
            )}

            {tab === 'requisition-list' && (
              <div style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, backdropFilter: 'blur(10px)' }}>
                <RequisitionListPanel
                  filteredReqs={filteredReqs}
                  rSearch={rSearch} setRSearch={setRSearch}
                  rFilterStatus={rFilterStatus} setRFilterStatus={setRFilterStatus}
                  handleOpenReceiveReturnModal={handleOpenReceiveReturnModal}
                  onOpenDetail={handleOpenDetail}
                />
              </div>
            )}

            {/* ── Detail Modal ── */}
            {detailModal.open && detailModal.data && (
              <div
                onClick={handleCloseDetail}
                style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.45)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: 'min(750px, 96vw)',
                    background: 'rgba(255,255,255,0.92)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-glow)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Eye size={18} color="var(--accent)" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {detailModal.type === 'borrow' ? 'รายละเอียดรายการยืม' : 'รายละเอียดรายการเบิก'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                          {detailModal.data.id}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleCloseDetail}
                      style={{ border: '1px solid var(--border)', background: 'transparent', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <X size={14} /> ปิด
                    </button>
                  </div>

                  <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '200px 1fr', gap: 14 }}>

                  {/* Left panel – photos */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', padding: 14 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 , marginLeft: 50 , marginTop: -5}}>รูปผู้ทำรายการ</div>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' ,
                       marginLeft: 20 ,
                        }}>
                      {/* Photo */}
                      <EmployeeLookupPhotoModal employeeId={detailModal.data.employee_code || ''} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 ,
                       marginLeft: 45 ,
                       marginTop: 20
                       }}>รูปรายการอุปกรณ์</div>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' ,
                       marginLeft: -23
                       }}>
                      {/* Photo รายการ stock ที่ยืม/เบิก*/}
                      <StockItemPhoto itemName={detailModal.data.item} stockItems={stockItems} />
                    </div>
                  </div>

                  {/* Item */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', padding: 14 }}>
                    {/* Info */}
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 5 }}>ผู้ทำรายการ</div>
                    <div style={{ flex: 1, minWidth: 0 }}>

                      {/* ชื่อ */}
                      {/* <div
                        title={detailModal.type === 'borrow' ? detailModal.data.borrower : detailModal.data.requester}
                        style={{
                          fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 10,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',  // ✅ มีอยู่แล้ว
                          minWidth: 0  // ✅ เพิ่ม
                        }}
                      >
                        {detailModal.type === 'borrow' ? detailModal.data.borrower : detailModal.data.requester}
                      </div> */}
                      {detailEmployeeLoading ? (
                        <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <RefreshCw size={12} className="spin" /> กำลังโหลดข้อมูลพนักงาน...
                        </div>
                      ) : (
                        [
                          { label: 'ชื่อ', value: detailModal.data.borrower || detailModal.data.requester || '—', mono: true },
                          { label: 'รหัสพนักงาน', value: detailModal.data.employee_code || '—', mono: true },
                          { label: 'WD',          value: detailEmployeeData?.workDateNumber || detailModal.data.workDateNumber || '—', mono: true },
                          { label: 'แผนก',        value: detailEmployeeData?.departmentGroup || detailModal.data.dept || '—', mono: true },
                          { label: 'หน่วยงาน',    value: detailEmployeeData?.department || detailModal.data.department || '—' ,mono: true },
                          { label: 'Level',       value: detailEmployeeData?.levelCard || detailModal.data.levelCard || '—',mono: true  },
                        ].map(({ label, value, mono, badge }) => (
                          <div key={label} style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '5px 0', borderBottom: '1px solid var(--border)',
                              overflow: 'hidden'  // ✅
                            }}>
                              <span style={{ fontSize: 12, color: 'var(--text2)', minWidth: 100, flexShrink: 0 }}>{label}</span>
                              {badge
                                ? <Badge
                                    text={value}
                                    bg={(DEPT_COLORS[value] || { bg: '#E6F1FB' }).bg}
                                    color={(DEPT_COLORS[value] || { color: '#185FA5' }).color}
                                  />
                                : <span
                                    title={value}
                                    style={{
                                      fontSize: mono ? 12 : 13,
                                      fontWeight: 500,
                                      color: 'var(--text)',
                                      fontFamily: mono ? 'monospace' : 'inherit',
                                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                      minWidth: 0, flex: 1  // ✅
                                    }}
                                  >{value}</span>
                              }
                            </div>
                          ))
                        )}
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 5 , marginTop: 15 }}>รายการอุปกรณ์</div>
                      {[
                        { label: 'Stock ID',  value: (() => { const s = stockItems.find(i => i.name === detailModal.data.item); return s ? s.id : '—' })(), mono: true },
                        { label: 'อุปกรณ์',   value: detailModal.data.item },
                        { label: 'จำนวน',     value: `${detailModal.data.qty} ชิ้น` },
                        {
                          label: detailModal.type === 'borrow' ? 'วันยืม' : 'วันที่ขอ',
                          value: fmtDate(detailModal.type === 'borrow' ? detailModal.data.borrow_date : detailModal.data.request_date),
                          nowrap: true   // ← เพิ่ม
                        },
                        {
                          label: detailModal.type === 'borrow' ? 'วันกำหนดคืน' : 'วันที่รับคืน',
                          value: detailModal.type === 'borrow'
                            ? fmtDate(detailModal.data.due_date)
                            : (detailModal.data.status === 'pending' ? '-' : (detailModal.data.updatedAt ? fmtDate(detailModal.data.updatedAt) : '-')),
                          nowrap: true   // ← เพิ่ม
                        },
                        { label: 'สถานะ', value: detailModal.data.status, status: true },
                        { label: 'หมายเหตุ', value: detailModal.data.note || '-', wrap: true },
                      ].map(({ label, value, status, wrap , mono, nowrap}) => (
                        <div key={label} style={{
                          display: 'flex',
                          alignItems: wrap ? 'flex-start' : 'center',  // ✅
                          gap: 6,
                          padding: '5px 0', borderBottom: '1px solid var(--border)',
                          overflow: 'hidden'
                        }}>
                          <span style={{ fontSize: 12, color: 'var(--text2)', minWidth: 100, flexShrink: 0 }}>{label}</span>
                          {status ? (() => {
                            const st = STATUS_CONFIG[value] || { label: value, bg: '#eee', color: '#333' }
                            return <Badge text={st.label} bg={st.bg} color={st.color} />
                          })() : (
                            <span
                              title={value}
                              style={{
                                fontSize: mono ? 12 : 13,
                                overflow: 'hidden', textOverflow: 'ellipsis',
                                whiteSpace: wrap ? 'normal' : 'nowrap',
                                wordBreak: wrap ? 'break-word' : 'normal',
                                minWidth: 0, flex: 1
                              }}
                            >{value}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Return Modal ── */}
            {returnModal.open && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{
                  background: 'white', borderRadius: 12, padding: 24,
                  width: '90%', maxWidth: 400,
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>
                    บันทึกการคืนอุปกรณ์
                  </h3>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
                      จำนวนที่ต้องการคืน (สูงสุด: {returnModal.maxQty} ชิ้น)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={returnModal.maxQty}
                      value={returnModal.returnQty}
                      onChange={e => setReturnModal(prev => ({ ...prev, returnQty: Math.min(+e.target.value, returnModal.maxQty) }))}
                      style={{
                        width: '100%', fontSize: 14, padding: '8px 12px',
                        borderRadius: 8, border: '1px solid var(--border)',
                        background: 'var(--surface)', color: 'var(--text)'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      onClick={cancelReturn}
                      style={{
                        padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                        background: 'transparent', color: 'var(--text2)', fontSize: 13,
                        cursor: 'pointer'
                      }}
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={confirmReturn}
                      style={{
                        padding: '8px 16px', borderRadius: 8, border: 'none',
                        background: 'var(--accent)', color: '#fff', fontSize: 13,
                        cursor: 'pointer'
                      }}
                    >
                      ยืนยันการคืน
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Receive Return Modal ── */}
            {receiveReturnModal.open && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{
                  background: 'white', borderRadius: 12, padding: '24px 28px',
                  width: '90%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Check size={18} color="var(--success)" />
                    ยืนยันการรับคืน
                  </h3>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.5 }}>
                    คุณต้องการรับคืนรายการนี้หรือไม่?
                    <div style={{ marginTop: 8, padding: 12, background: 'var(--surface)', borderRadius: 8, fontSize: 12 }}>
                      <div><strong>อุปกรณ์:</strong> {receiveReturnModal.item}</div>
                      <div><strong>จำนวน:</strong> {receiveReturnModal.qty} ชิ้น</div>
                      <div><strong>ผู้เบิก:</strong> {receiveReturnModal.requester}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      onClick={handleCloseReceiveReturnModal}
                      style={{
                        padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                        background: 'transparent', color: 'var(--text2)', fontSize: 13,
                        cursor: 'pointer'
                      }}
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleConfirmReceiveReturn}
                      style={{
                        padding: '8px 16px', borderRadius: 8, border: 'none',
                        background: 'var(--success)', color: '#fff', fontSize: 13,
                        cursor: 'pointer'
                      }}
                    >
                      ยืนยันการรับคืน
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}