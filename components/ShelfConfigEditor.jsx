import { useState, useEffect, useCallback } from 'react'
import { Plus, Save, Trash2, X, ChevronDown, ChevronUp, Edit3 } from 'lucide-react'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function generateDefaultShelf(existingIds) {
  let idx = 1
  let id = `shelf-${idx}`
  while (existingIds.includes(id)) {
    idx++
    id = `shelf-${idx}`
  }
  return {
    id,
    name: '',
    cols: ['A'],
    rows: [3, 2, 1],
    colW: 90,
    nameMatchPattern: '([A])[^0-9]*([1-3])',
    nameMatchFlags: '',
    labelTextFill: ['#FFFFFF', '#FFFFFF'],
    detailTextFill: ['#DBEAFE', '#D1FAE5'],
  }
}

function ShelfEditor({ shelf, onChange, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  const update = (key, val) => {
    onChange({ ...shelf, [key]: val })
  }

  const toggleCol = (letter) => {
    const cols = shelf.cols.includes(letter)
      ? shelf.cols.filter(c => c !== letter)
      : [...shelf.cols, letter].sort((a, b) => a.localeCompare(b))

    // Auto-update nameMatchPattern
    let nameMatchPattern = shelf.nameMatchPattern
    if (cols.length > 0) {
      // Build character class from all selected columns (handles non-contiguous)
      const colClass = cols.length > 1 ? `[${cols.join('')}]` : cols[0]
      const maxRow = Math.max(...shelf.rows)
      const rowRange = maxRow > 1 ? `[1-${maxRow}]` : '[1]'
      nameMatchPattern = `(${colClass})[^0-9]*(${rowRange})`
    }

    // Update both cols and nameMatchPattern in a single call
    onChange({ ...shelf, cols, nameMatchPattern })
  }

  const setRowCount = (count) => {
    const rows = []
    for (let i = count; i >= 1; i--) rows.push(i)

    // Auto-update nameMatchPattern
    const maxRow = count
    const rowRange = maxRow > 1 ? `[1-${maxRow}]` : '[1]'
    // Build character class from all selected columns (handles non-contiguous)
    const colClass = shelf.cols.length > 1 ? `[${shelf.cols.join('')}]` : (shelf.cols[0] || 'A')
    const nameMatchPattern = `(${colClass})[^0-9]*(${rowRange})`

    // Update both rows and nameMatchPattern in a single call
    onChange({ ...shelf, rows, nameMatchPattern })
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      overflow: 'hidden',
      transition: 'all .2s ease',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            background: 'var(--accent-glow)',
            color: 'var(--accent)',
            borderRadius: 5,
            padding: '2px 8px',
            fontSize: 11,
            fontFamily: 'var(--mono)',
            fontWeight: 600,
          }}>
            {shelf.id}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            {shelf.name || shelf.id}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            {shelf.cols.length} cols × {shelf.rows.length} rows
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {expanded ? <ChevronUp size={16} color="var(--text3)" /> : <ChevronDown size={16} color="var(--text3)" />}
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
          {/* ID & Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>ID</label>
              <input
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 6, padding: '6px 10px', fontSize: 12, fontFamily: 'var(--mono)', outline: 'none' }}
                value={shelf.id}
                onChange={e => update('id', e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>ชื่อแสดง</label>
              <input
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 6, padding: '6px 10px', fontSize: 12, outline: 'none' }}
                value={shelf.name}
                onChange={e => update('name', e.target.value)}
                placeholder="เช่น ชั้น A-D"
              />
            </div>
          </div>

          {/* Columns */}
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 10, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>คอลัมน์ (Columns)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {LETTERS.map(letter => (
                <button
                  key={letter}
                  onClick={() => toggleCol(letter)}
                  style={{
                    width: 30,
                    height: 28,
                    borderRadius: 5,
                    border: shelf.cols.includes(letter) ? '1px solid var(--accent)' : '1px solid var(--border2)',
                    background: shelf.cols.includes(letter) ? 'var(--accent-glow)' : 'var(--surface2)',
                    color: shelf.cols.includes(letter) ? 'var(--accent)' : 'var(--text3)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: shelf.cols.includes(letter) ? 700 : 400,
                    fontFamily: 'var(--mono)',
                    transition: 'all .1s',
                  }}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 10, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>จำนวนแถว (Rows)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="range"
                min={1}
                max={10}
                value={shelf.rows.length}
                onChange={e => setRowCount(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent)' }}
              />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--accent)', minWidth: 20, textAlign: 'center' }}>
                {shelf.rows.length}
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
              แถว: {shelf.rows.join(', ')}
            </div>
          </div>

          {/* Col Width */}
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 10, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>ความกว้างคอลัมน์ (colW)</label>
            <input
              type="number"
              min={50}
              max={800}
              value={shelf.colW}
              onChange={e => update('colW', parseInt(e.target.value) || 90)}
              style={{ width: 100, background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 6, padding: '6px 10px', fontSize: 12, fontFamily: 'var(--mono)', outline: 'none' }}
            />
          </div>

          {/* Regex */}
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 10, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>Name Match Pattern (regex)</label>
            <input
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontFamily: 'var(--mono)', outline: 'none' }}
              value={shelf.nameMatchPattern}
              onChange={e => update('nameMatchPattern', e.target.value)}
            />
          </div>

          {/* Delete */}
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(shelf.id) }}
              style={{
                background: 'transparent',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Trash2 size={13} /> ลบชั้นนี้
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ShelfConfigEditor({ config, onSave, onClose }) {
  const [localConfig, setLocalConfig] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (config) setLocalConfig(JSON.parse(JSON.stringify(config)))
  }, [config])

  if (!localConfig) return null

  const addShelf = () => {
    const existingIds = localConfig.shelves.map(s => s.id)
    const newShelf = generateDefaultShelf(existingIds)
    setLocalConfig({ ...localConfig, shelves: [...localConfig.shelves, newShelf] })
  }

  const updateShelf = (id, updated) => {
    setLocalConfig({
      ...localConfig,
      shelves: localConfig.shelves.map(s => s.id === id ? updated : s),
    })
  }

  const deleteShelf = (id) => {
    if (!confirm(`ยืนยันลบชั้น "${id}"?`)) return
    setLocalConfig({
      ...localConfig,
      shelves: localConfig.shelves.filter(s => s.id !== id),
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(localConfig)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, overflowY: 'auto' }} onClick={onClose}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', animation: 'modal-in .18s ease' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>ตั้งค่าชั้นวาง</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>Shelf Configuration</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>✕</button>
        </div>

        {/* Shelf list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {localConfig.shelves.map(shelf => (
            <ShelfEditor
              key={shelf.id}
              shelf={shelf}
              onChange={updated => updateShelf(shelf.id, updated)}
              onDelete={deleteShelf}
            />
          ))}
        </div>

        {/* Add button */}
        <button
          onClick={addShelf}
          style={{
            width: '100%',
            background: 'var(--surface2)',
            border: '1px dashed var(--border2)',
            color: 'var(--text2)',
            borderRadius: 8,
            padding: '10px',
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 16,
          }}
        >
          <Plus size={15} /> เพิ่มชั้นใหม่
        </button>

        {/* Save */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border2)', color: 'var(--text2)', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer' }}>ยกเลิก</button>
          <button onClick={handleSave} disabled={saving} style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'กำลังบันทึก...' : <><Save size={15} style={{ display: 'inline', verticalAlign: -2 }} /> บันทึก</>}
          </button>
        </div>
      </div>
    </div>
  )
}
