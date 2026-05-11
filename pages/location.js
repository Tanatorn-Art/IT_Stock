import React, { useState, useEffect, useCallback, useRef, memo, useReducer } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import ShelfMap from '../components/Shelfmap'
import ShelfConfigEditor from '../components/ShelfConfigEditor'
import SettingsDropdown from '../components/SettingsDropdown.js'
import { Package, MapPin, Scan, Settings, Loader2, Save, Plus, Sliders } from 'lucide-react'

export default function LocationPage() {
  const router = useRouter()
  const [locations, setLocations] = useState([])
  const [stockItems, setStockItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [formItem, setFormItem] = useState(undefined)
  const [delItem, setDelItem] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [toast, setToast] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [selectedShelfId, setSelectedShelfId] = useState(null)
  const [pageLoaded, setPageLoaded] = useState(false)
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false)
  const [shelfConfig, setShelfConfig] = useState(null)
  const [showConfigEditor, setShowConfigEditor] = useState(false)
  const toastTimer = useRef(null)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])

  const fetchLocations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/locations')
      setLocations(await res.json())
    } finally { setLoading(false) }
  }, [])

  const fetchStock = useCallback(async () => {
    try {
      const res = await fetch('/api/stock')
      setStockItems(await res.json())
    } catch (err) {
      console.error('Failed to fetch stock:', err)
    }
  }, [])

  const fetchShelfConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/shelf-config')
      setShelfConfig(await res.json())
    } catch (err) {
      console.error('Failed to fetch shelf config:', err)
    }
  }, [])

  useEffect(() => { fetchLocations() }, [fetchLocations])
  useEffect(() => { fetchStock() }, [fetchStock])
  useEffect(() => { fetchShelfConfig() }, [fetchShelfConfig])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // Trigger slide up animation after initial load
  useEffect(() => {
    if (!loading && locations.length > 0) {
      const timer = setTimeout(() => setPageLoaded(true), 100)
      return () => clearTimeout(timer)
    }
  }, [loading, locations.length])

  // Handle query param to pre-select location
  useEffect(() => {
    if (!loading && locations.length > 0 && shelfConfig && router.query.loc) {
      const locName = decodeURIComponent(router.query.loc)
      const foundLoc = locations.find(l => l.name === locName)
      if (foundLoc) {
        // Use location.shelfId if available, otherwise match by regex
        let shelfId = foundLoc.shelfId
        if (!shelfId) {
          const matchedShelf = shelfConfig.shelves.find(s => {
            try { return new RegExp(s.nameMatchPattern, s.nameMatchFlags).test(locName) } catch { return false }
          })
          shelfId = matchedShelf?.id || shelfConfig.shelves[0]?.id || null
        }
        setSelectedLocation(foundLoc)
        setSelectedShelfId(shelfId)
      }
    }
  }, [loading, locations, shelfConfig, router.query.loc])

  // Get highlighted item ID from query
  const highlightedItemId = router.query.item ? decodeURIComponent(router.query.item) : null

  const handleSave = useCallback(async (saved) => {
    setFormItem(undefined)
    fetchLocations()
    showToast(formItem === null ? `เพิ่ม ${saved.id} สำเร็จ` : `อัปเดต ${saved.id} สำเร็จ`)
  }, [formItem, fetchLocations, showToast])

  const handleDelete = useCallback(async (item) => {
    await fetch(`/api/locations/${item.id}`, { method: 'DELETE' })
    setDelItem(null)
    fetchLocations()
    showToast(`ลบ ${item.id} เรียบร้อย`, 'danger')
  }, [fetchLocations, showToast])

  const handleShelfSelect = useCallback((shelfId, loc) => {
    setSelectedLocation(prev => {
      const isSame = prev?.id === loc?.id
      if (isSame) {
        setSelectedShelfId(null)
        return null
      }
      setSelectedShelfId(shelfId)
      return loc
    })
  }, [])

  const handleSaveConfig = useCallback(async (newConfig) => {
    try {
      const res = await fetch('/api/shelf-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      setShelfConfig(saved)
      setShowConfigEditor(false)
      showToast('บันทึกตั้งค่าชั้นสำเร็จ')
    } catch {
      showToast('เกิดข้อผิดพลาดในการบันทึก', 'danger')
    }
  }, [showToast])

  const handleGenerateLocations = useCallback(async () => {
    try {
      const res = await fetch('/api/locations/generate', { method: 'POST' })
      const result = await res.json()
      if (!res.ok) throw new Error()
      fetchLocations()
      showToast(`สร้างตำแหน่ง ${result.added} ตำแหน่งใหม่แล้ว`)
    } catch { alert('เกิดข้อผิดพลาดในการสร้างตำแหน่ง') }
  }, [fetchLocations, showToast])

  // Get stock items for selected location
  const locationStockItems = selectedLocation
    ? stockItems.filter(item => item.location === selectedLocation.name)
    : []

  return (
    <>
      <Head>
        <title>จัดการตำแหน่ง · IT Stock</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📍</text></svg>" />
      </Head>

      <div style={layout}>
        {/* Navbar */}
        <nav style={navbar}>
          <div style={{maxWidth:1400,margin:'0 auto',width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={navbarNav}>
              <Link href="/" className="nav-link" style={navItem(false)}><Package size={16} /> Stock รายการ</Link>
              <Link href="/location" className="nav-link" style={navItem(true)}><MapPin size={16} /> จัดการตำแหน่ง</Link>
              <Link href="/borrow" className="nav-link" style={navItem(false)}><Scan size={16} /> ยืม & เบิก อุปกรณ์ ( Develop )</Link>
              {/* <SettingsDropdown isOpen={settingsDropdownOpen} onToggle={() => setSettingsDropdownOpen(!settingsDropdownOpen)} currentPage="location" /> */}
            </div>
            <div style={navbarRight}>
              <SettingsDropdown isOpen={settingsDropdownOpen} onToggle={() => setSettingsDropdownOpen(!settingsDropdownOpen)} currentPage="location" />
              <Stat label="ตำแหน่ง" val={locations.length} unit="รายการ" />
            </div>
          </div>
        </nav>

        {/* Main */}
        <main style={mainArea}>
          {loading ? (
            <div style={centerBox}>
              <div style={spinner} />
              <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 13 }}>Loading...</span>
            </div>
          ) : locations.length === 0 ? (
            <div style={centerBox}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📍</div>
              <div style={{ color: 'var(--text2)', fontSize: 14 }}>ไม่พบตำแหน่ง</div>
              <button onClick={() => setFormItem(null)} style={{ ...addBtn, marginTop: 14 }}>+ เพิ่มตำแหน่งแรก</button>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              gap: '20px',
              padding: '10px',
              marginTop: '-20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>จัดการตำแหน่งเก็บของ</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={handleGenerateLocations}
                    title="สร้างตำแหน่งที่ขาดหาย"
                    style={{
                      background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text2)',
                      borderRadius: 6, width: 30, height: 30, cursor: 'pointer', fontSize: 13,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Plus size={15} />
                  </button>
                  <button
                    onClick={() => setShowConfigEditor(true)}
                    title="ตั้งค่าชั้นวาง"
                    style={{
                      background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text2)',
                      borderRadius: 6, width: 30, height: 30, cursor: 'pointer', fontSize: 13,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Sliders size={15} />
                  </button>
                </div>
              </div>
              <div className={`panels-wrapper ${pageLoaded ? 'slide-up' : ''}`}>
                {/* Dynamic shelf panels */}
                {shelfConfig?.shelves?.map((shelf, idx) => {
                  const isSelected = selectedShelfId === shelf.id
                  const isHidden = selectedShelfId && selectedShelfId !== shelf.id
                  return (
                    <div
                      key={shelf.id}
                      className={`shelf-panel ${isSelected ? 'shelf-selected' : isHidden ? 'shelf-hidden' : 'shelf-default'}`}
                      style={{ order: idx + 1 }}
                    >
                      <div className="shelf-content">
                        <div style={{ flex: 1 }}>
                          <ShelfMap
                            shelfId={shelf.id}
                            config={shelfConfig}
                            locations={locations}
                            selectedLocation={selectedLocation}
                            onLocationSelect={(loc) => handleShelfSelect(shelf.id, loc)}
                          />
                        </div>
                        {isSelected && selectedLocation && (
                          <div style={{ flex: 1, maxWidth: '400px' }}>
                            <LocationStockCards
                              location={selectedLocation}
                              stockItems={locationStockItems}
                              onClose={() => handleShelfSelect(selectedShelfId, selectedLocation)}
                              highlightedItemId={highlightedItemId}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals — rendered via portal-like pattern, only when needed */}
      {formItem !== undefined && (
        <LocationForm location={formItem} shelfConfig={shelfConfig} onSave={handleSave} onClose={() => setFormItem(undefined)} />
      )}
      {delItem && (
        <DelModal item={delItem} onConfirm={() => handleDelete(delItem)} onClose={() => setDelItem(null)} />
      )}
      {viewItem && (
        <ViewModal location={viewItem} onClose={() => setViewItem(null)} />
      )}
      {showConfigEditor && shelfConfig && (
        <ShelfConfigEditor
          config={shelfConfig}
          onSave={handleSaveConfig}
          onClose={() => setShowConfigEditor(false)}
        />
      )}
      {toast && (
        <div style={toastSt(toast.type)}>{toast.type === 'success' ? '✅' : '🗑️'} {toast.msg}</div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{animation:spin 1s linear infinite}
        @keyframes toast-in{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modal-in{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        /* Initial page load animation - must be first */
        .panels-wrapper{display:flex;flex-wrap:wrap;justify-content:center;width:100%;gap:20px;position:relative;opacity:0;transform:translateY(20px)}
        .panels-wrapper.slide-up{opacity:1;transform:translateY(0);transition:opacity .5s ease,transform .5s cubic-bezier(0.4,0,0.2,1)}
        /* Panel transitions */
        .shelf-panel,.panel-right{transition:all .4s cubic-bezier(0.4,0,0.2,1);min-width:0}
        /* Ensure consistent shelf sizing */
        .shelf-panel{display:flex;flex-direction:column;min-height:200px;flex:1 1 calc(33.333% - 20px);max-width:calc(33.333% - 20px);}
        .shelf-panel.shelf-selected{flex:1 1 60%;max-width:60%;max-height:350px}
        .shelf-panel.shelf-selected .shelf-content{display:flex;gap:20px}
        /* Default shelf state */
        .shelf-default{opacity:1;transform:translateX(0)}
        /* Selected shelf expands, others hide */
        .shelf-selected{opacity:1;transform:translateX(0) scale(1);)}
        .shelf-hidden{flex:0 0 0;width:0;opacity:0;overflow:hidden;padding:0;margin:0;transform:translateX(-20px) scale(0.95);pointer-events:none}
        /* Stock cards in split layout */
        .shelf-content{width:100%}
        .shelf-content div:first-child{min-width:300px}
        .shelf-content div:last-child{border-left:1px solid var(--border);padding-left:20px}
        input:focus,select:focus,textarea:focus{outline:none;border-color:var(--accent)!important;box-shadow:0 0 0 3px var(--accent-glow)}
        button:active{transform:scale(.97)}
        .card:hover{border-color:var(--border2)!important;background:var(--surface2)!important;transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.3)}
        a{text-decoration:none}
        .nav-link:hover{background:rgba(255,255,255,0.15)}
      `}</style>
    </>
  )
}

/* ── LocationStockCards: displays stock items for selected location ── */
function LocationStockCards({ location, stockItems, onClose, highlightedItemId }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--mono)', marginBottom: 4 }}>
            รายการ Stock ในตำแหน่ง
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{location.name}</div>
        </div>
        {/* <button
          onClick={() => onClose(null)}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text2)',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          ✕ ปิด
        </button> */}
      </div>

      {stockItems.length === 0 ? (
        <div style={{
          padding: 40,
          textAlign: 'center',
          color: 'var(--text3)',
          background: 'var(--surface)',
          borderRadius: 12,
          border: '1px dashed var(--border)'
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
          <div style={{ fontSize: 14 }}>ไม่มีรายการ stock ในตำแหน่งนี้</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
          maxHeight: 480,
          overflowY: 'auto',
          paddingRight: 4
        }}>
          {stockItems.map(item => (
            <MinimalStockCard
              key={item.id}
              item={item}
              highlighted={highlightedItemId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── MinimalStockCard: compact card for location view ── */
const MinimalStockCard = memo(function MinimalStockCard({ item, highlighted }) {
  const low = item.quantity <= item.minQuantity
  return (
    <div style={{
      background: highlighted ? '#dbeafe' : 'var(--surface)',
      border: highlighted ? '2px solid #2563eb' : `1px solid ${low ? 'var(--warning)' : 'var(--border)'}`,
      borderRadius: 10,
      padding: 10,
      transition: 'all .2s ease',
      cursor: 'default',
      boxShadow: highlighted ? '0 0 0 4px rgba(37, 99, 235, 0.2)' : 'none'
    }}>
      {item.image ? (
        <img
          src={item.image}
          alt={item.name}
          style={{
            width: '100%',
            height: 100,
            objectFit: 'cover',
            borderRadius: 6,
            marginBottom: 8
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: 100,
          background: 'var(--surface2)',
          borderRadius: 6,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24
        }}>
          📦
        </div>
      )}
      <div style={{
        fontSize: 10,
        color: 'var(--accent)',
        fontFamily: 'var(--mono)',
        marginBottom: 2
      }}>
        {item.id}
      </div>
      <div style={{
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text)',
        marginBottom: 4,
        lineHeight: 1.3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {item.name}
      </div>
      <div style={{
        fontSize: 11,
        color: 'var(--text3)',
        marginBottom: 6
      }}>
        {item.brand}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{
          fontSize: 10,
          color: 'var(--text3)'
        }}>
          {item.category}
        </span>
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          color: low ? 'var(--warning)' : 'var(--success)',
          fontFamily: 'var(--mono)'
        }}>
          {item.quantity} ชิ้น
        </span>
      </div>
      {low && (
        <div style={{
          marginTop: 6,
          padding: '4px 8px',
          background: '#fef3c7',
          borderRadius: 4,
          fontSize: 10,
          color: '#92400e',
          textAlign: 'center'
        }}>
          ⚠️ ใกล้หมด
        </div>
      )}
    </div>
  )
})

/* ── memo: prevent re-render when parent state changes ── */
const LocationCard = memo(function LocationCard({ location, onEdit, onDelete, onView }) {
  return (
    <div className="card" style={cardSt} onClick={onView}>
      <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)', marginBottom: 4, lineHeight: 1.4 }}>{location.name}</div>
      {location.description && (
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>{location.description}</div>
      )}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8 }}>
        <IBtn title="แก้ไข" color="var(--success)" onClick={e => { e.stopPropagation(); onEdit() }}>✏️</IBtn>
        <IBtn title="ลบ" color="var(--danger)" onClick={e => { e.stopPropagation(); onDelete() }}>🗑️</IBtn>
      </div>
    </div>
  )
})

// ── Upload queue item shape:
// { id, file, name, status: 'pending'|'reading'|'uploading'|'done'|'error', preview, path, progress }

function queueReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [...state, ...action.items]
    case 'UPDATE':
      return state.map(item => item.id === action.id ? { ...item, ...action.patch } : item)
    case 'REMOVE':
      return state.filter(item => item.id !== action.id)
    case 'CLEAR':
      return []
    default:
      return state
  }
}

function useUploadQueue() {
  const [queue, dispatch] = useReducer(queueReducer, [])
  const processingRef = useRef(false)
  const queueRef = useRef(queue)
  queueRef.current = queue

  const processNext = useCallback(async () => {
    if (processingRef.current) return
    const next = queueRef.current.find(i => i.status === 'pending')
    if (!next) return

    processingRef.current = true

    try {
      // Step 1: Read file
      dispatch({ type: 'UPDATE', id: next.id, patch: { status: 'reading', progress: 0 } })
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            dispatch({ type: 'UPDATE', id: next.id, patch: { progress: Math.round((e.loaded / e.total) * 40) } })
          }
        }
        reader.readAsDataURL(next.file)
      })

      // Step 2: Upload
      dispatch({ type: 'UPDATE', id: next.id, patch: { status: 'uploading', progress: 50 } })
      const filename = `${Date.now()}-${next.file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, filename }),
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      dispatch({ type: 'UPDATE', id: next.id, patch: { status: 'done', progress: 100, path: data.path } })

    } catch {
      dispatch({ type: 'UPDATE', id: next.id, patch: { status: 'error', progress: 0 } })
    } finally {
      processingRef.current = false
      // Schedule next tick so queueRef has time to update
      setTimeout(() => processNext(), 0)
    }
  }, [])

  const addFiles = useCallback((files) => {
    const items = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      name: file.name,
      status: 'pending',
      preview: URL.createObjectURL(file),
      path: null,
      progress: 0,
    }))
    dispatch({ type: 'ADD', items })
    // Kick off processing after state settles
    setTimeout(() => processNext(), 0)
    return items
  }, [processNext])

  const remove = useCallback((id) => {
    dispatch({ type: 'REMOVE', id })
  }, [])

  const retry = useCallback((id) => {
    dispatch({ type: 'UPDATE', id, patch: { status: 'pending', progress: 0 } })
    setTimeout(() => processNext(), 0)
  }, [processNext])

  const isProcessing = queue.some(i => i.status === 'reading' || i.status === 'uploading')
  const hasPending = queue.some(i => i.status === 'pending')

  return { queue, addFiles, remove, retry, isProcessing, hasPending }
}

function UploadQueue({ queue, onRemove, onRetry }) {
  if (queue.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
      {queue.map(item => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', borderRadius: 8, padding: '6px 8px', border: '1px solid var(--border)' }}>
          {/* Thumbnail */}
          <img src={item.preview} alt={item.name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />

          {/* Info + bar */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
            <div style={{ fontSize: 10, color: statusColor(item.status), marginBottom: 3 }}>{statusLabel(item.status)}</div>
            {(item.status === 'reading' || item.status === 'uploading') && (
              <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.progress}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width .2s ease' }} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {item.status === 'error' && (
              <button onClick={() => onRetry(item.id)} title="ลองใหม่" style={{ background: 'transparent', border: '1px solid var(--border2)', color: 'var(--text2)', borderRadius: 5, width: 24, height: 24, cursor: 'pointer', fontSize: 11 }}>↺</button>
            )}
            {(item.status === 'done' || item.status === 'error' || item.status === 'pending') && (
              <button onClick={() => onRemove(item.id)} title="ลบออก" style={{ background: 'transparent', border: '1px solid var(--border2)', color: 'var(--danger)', borderRadius: 5, width: 24, height: 24, cursor: 'pointer', fontSize: 11 }}>✕</button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function statusLabel(s) {
  return { pending: 'รอคิว...', reading: 'กำลังอ่านไฟล์...', uploading: 'กำลังอัปโหลด...', done: '✓ สำเร็จ', error: '✗ ล้มเหลว' }[s] ?? s
}
function statusColor(s) {
  return { done: 'var(--success)', error: 'var(--danger)', reading: 'var(--accent)', uploading: 'var(--accent)', pending: 'var(--text3)' }[s] ?? 'var(--text3)'
}

function LocationForm({ location, shelfConfig, onSave, onClose }) {
  const isEdit = !!location
  const [name, setName] = useState(location?.name || '')
  const [description, setDescription] = useState(location?.description || '')
  const [shelfId, setShelfId] = useState(location?.shelfId || null)
  const [saving, setSaving] = useState(false)
  const [nameErr, setNameErr] = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) { setNameErr('กรุณากรอกชื่อตำแหน่ง'); return }
    setNameErr('')
    setSaving(true)
    try {
      const url = isEdit ? `/api/locations/${location.id}` : '/api/locations'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, shelfId }),
      })
      if (!res.ok) throw new Error()
      onSave(await res.json())
    } catch { alert('เกิดข้อผิดพลาด') }
    finally { setSaving(false) }
  }

  return (
    <div style={OV} onClick={onClose}>
      <div style={MO} onClick={e => e.stopPropagation()}>
        <div style={HDR}>
          <div>
            <div style={SUB}>{isEdit ? 'แก้ไขข้อมูล' : 'เพิ่มตำแหน่งใหม่'}</div>
            <div style={TTL}>{isEdit ? location.id : 'New Location'}</div>
          </div>
          <button onClick={onClose} style={XB}>✕</button>
        </div>

        <div style={GR}>
          <div style={{ gridColumn: '1/-1' }}>
            <F label="ชื่อตำแหน่ง *" err={nameErr}>
              <input style={I(nameErr)} value={name} onChange={e => { setName(e.target.value); if (nameErr) setNameErr('') }} placeholder="เช่น ชั้น A-1" />
            </F>
          </div>

          <div style={{ gridColumn: '1/-1' }}>
            <F label="ชั้นวาง (Shelf)">
              <select
                style={I()}
                value={shelfId || ''}
                onChange={e => setShelfId(e.target.value || null)}
              >
                <option value="">-- อัตโนมัติจากชื่อ --</option>
                {shelfConfig?.shelves?.map(shelf => (
                  <option key={shelf.id} value={shelf.id}>
                    {shelf.name || shelf.id} ({shelf.cols.join(', ')} × {shelf.rows.length})
                  </option>
                ))}
              </select>
            </F>
          </div>

          <div style={{ gridColumn: '1/-1' }}>
            <F label="รายละเอียด">
              <textarea style={{ ...I(), resize: 'vertical', minHeight: 60 }} value={description} onChange={e => setDescription(e.target.value)} placeholder="รายละเอียดเพิ่มเติม..." />
            </F>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={CB}>ยกเลิก</button>
          <button onClick={handleSubmit} disabled={saving} style={{ ...SB, opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 size={16} className="spin" /> กำลังบันทึก...</> : isEdit ? <><Save size={16} /> บันทึก</> : <><Plus size={16} /> เพิ่มตำแหน่ง</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function DelModal({ item, onConfirm, onClose }) {
  return (
    <div style={OV} onClick={onClose}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--danger)', borderRadius: 16, padding: 28, maxWidth: 360, width: '90%', textAlign: 'center', animation: 'modal-in .18s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>ยืนยันการลบ</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
          <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{item.id}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>📍 {item.name}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border2)', color: 'var(--text2)', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontSize: 13 }}>ยกเลิก</button>
          <button onClick={onConfirm} style={{ background: 'var(--danger)', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>ลบออก</button>
        </div>
      </div>
    </div>
  )
}

/* ── ViewModal: fetch stock lazily, not on every render ── */
function ViewModal({ location, onClose }) {
  const [stockItems, setStockItems] = useState(null) // null = not loaded yet

  useEffect(() => {
    let cancelled = false
    fetch('/api/stock')
      .then(r => r.json())
      .then(all => {
        if (!cancelled) setStockItems(all.filter(i => i.location === location.name))
      })
      .catch(() => { if (!cancelled) setStockItems([]) })
    return () => { cancelled = true }
  }, [location.name]) // only re-fetch if location name changes

  return (
    <div style={OV} onClick={onClose}>
      <div
        style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 16, maxWidth: 900, width: '95%', maxHeight: '90vh', overflowY: 'auto', animation: 'modal-in .18s ease' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 0 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--mono)', marginBottom: 2 }}>LOCATION DETAIL</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 5, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{location.name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>✕</button>
        </div>

        {location.description && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>รายละเอียด</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{location.description}</div>
          </div>
        )}
        {location.createdAt && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>สร้างเมื่อ</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{new Date(location.createdAt).toLocaleString('th-TH')}</div>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
            รายการ Stock ในตำแหน่งนี้ {stockItems !== null ? `(${stockItems.length})` : ''}
          </div>
          {stockItems === null ? (
            <div style={{ color: 'var(--text3)', fontSize: 11 }}>กำลังโหลด...</div>
          ) : stockItems.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: 11 }}>ไม่มีรายการ stock ในตำแหน่งนี้</div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: 420, paddingRight: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {stockItems.map(item => (
                  <StockMiniCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={onClose} style={{ width: '100%', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)' }}>ปิด</button>
      </div>
    </div>
  )
}

/* ── extracted + memoised to avoid re-rendering the whole list ── */
const StockMiniCard = memo(function StockMiniCard({ item }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
      {item.image ? (
        <img src={item.image} alt={item.name} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 4, marginBottom: 6 }} loading="lazy" />
      ) : (
        <div style={{ width: '100%', height: 180, background: 'var(--surface2)', borderRadius: 4, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
      )}
      <div style={{ fontSize: 9, color: 'var(--accent)', fontFamily: 'var(--mono)', marginBottom: 2 }}>{item.id}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4, lineHeight: 1.3 }}>{item.name}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 6 }}>{item.brand} {item.model}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>{item.category}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{item.quantity} ชิ้น</span>
      </div>
    </div>
  )
})

function IBtn({ children, onClick, color, title }) {
  return (
    <button title={title} onClick={onClick} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color, width: 29, height: 29, borderRadius: 7, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </button>
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

function F({ label, children, err }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <label style={{ display: 'block', fontSize: 10, color: err ? 'var(--danger)' : 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .8 }}>{label}</label>
      {children}
      {err && <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 2 }}>{err}</div>}
    </div>
  )
}

// ── styles ──
const layout = { display: 'flex', flexDirection: 'column', minHeight: '100vh' }
const navbar = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', position: 'sticky', top: 0, zIndex: 100, width: '100%', backgroundImage: 'url(/images/bg_navbar.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }
const navbarLeft = { display: 'flex', alignItems: 'center', gap: 10 }
const navbarNav = { display: 'flex', alignItems: 'center', gap: 4 }
const navbarRight = { display: 'flex', alignItems: 'center', gap: 12 }
const logoBox = { width: 34, height: 34, background: 'var(--accent)', color: '#000', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12, letterSpacing: 1 }
const navItem = (a) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, fontSize: 13, color: '#ffffff', background: a ? 'var(--accent-glow)' : 'transparent', border: a ? '1px solid rgba(0,212,255,.2)' : '1px solid transparent', fontWeight: a ? 600 : 400, transition: 'all .15s', cursor: 'pointer' })
const mainArea = { flex: 1, padding: 24, minWidth: 0, overflowX: 'hidden'}
const toolbar = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-5px' }
const addBtn = { background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8, padding: '9px 15px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' }
const centerBox = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 12 }
const spinner = { width: 34, height: 34, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin .8s linear infinite' }
const grid = { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }
const cardSt = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 11, padding: 14, transition: 'all .2s ease', animation: 'fadein .3s ease', cursor: 'default' }
// ── overlay: removed backdropFilter blur (biggest perf culprit) ──
const OV = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, overflowY: 'auto' }
const MO = { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 16, padding: 26, width: '100%', maxWidth: 560, boxShadow: '0 24px 60px rgba(0,0,0,0.6)', animation: 'modal-in .18s ease' }
const HDR = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }
const SUB = { fontSize: 10, color: 'var(--text3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--mono)' }
const TTL = { fontSize: 17, fontWeight: 700, color: 'var(--accent)', marginTop: 2, fontFamily: 'var(--mono)' }
const XB = { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', width: 30, height: 30, borderRadius: 7, cursor: 'pointer', fontSize: 13 }
const GR = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }
const I = (err) => ({ width: '100%', background: 'var(--surface2)', border: `1px solid ${err ? 'var(--danger)' : 'var(--border2)'}`, color: 'var(--text)', borderRadius: 8, padding: '8px 11px', fontSize: 13, fontFamily: 'var(--sans)', outline: 'none' })
const CB = { background: 'transparent', border: '1px solid var(--border2)', color: 'var(--text2)', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer' }
const SB = { background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)' }
const toastSt = (t) => ({ position: 'fixed', bottom: 22, right: 22, zIndex: 2000, background: t === 'success' ? 'rgba(0,229,160,.15)' : 'rgba(255,77,106,.15)', border: `1px solid ${t === 'success' ? 'var(--success)' : 'var(--danger)'}`, color: t === 'success' ? 'var(--success)' : 'var(--danger)', borderRadius: 11, padding: '11px 18px', fontSize: 14, fontWeight: 500, animation: 'toast-in .3s ease' })