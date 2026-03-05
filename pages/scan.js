import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function ScanPage() {
  const [mode, setMode] = useState('IN') // IN | OUT
  const [input, setInput] = useState('')
  const [found, setFound] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const [by, setBy] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // last transaction result
  const [recentTxns, setRecentTxns] = useState([])
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    fetchRecent()
  }, [])

  const fetchRecent = async () => {
    const res = await fetch('/api/transactions?limit=8')
    const data = await res.json()
    setRecentTxns(data)
  }

  const handleSearch = async (val) => {
    const v = (val || input).trim().toUpperCase()
    if (!v) return
    setLoading(true)
    setNotFound(false)
    setFound(null)
    setResult(null)
    try {
      const res = await fetch(`/api/stock/${v}`)
      if (!res.ok) { setNotFound(true); return }
      const data = await res.json()
      setFound(data)
      setQty(1)
    } finally { setLoading(false) }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleSubmit = async () => {
    if (!found) return
    setLoading(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: found.id, type: mode, qty, note, by }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.message || 'เกิดข้อผิดพลาด')
        return
      }
      setResult({ ...data, mode })
      setFound(data.item)
      setInput('')
      setNote('')
      setQty(1)
      fetchRecent()
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch { alert('เกิดข้อผิดพลาด') }
    finally { setLoading(false) }
  }

  const reset = () => {
    setFound(null); setNotFound(false); setResult(null); setInput('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <>
      <Head><title>Scan Stock · IT Stock</title></Head>
      <div style={wrap}>
        {/* Header */}
        <div style={topbar}>
          <Link href="/" style={backBtn}>← กลับ</Link>
          <div style={pageTitle}>📷 Scan รับ/นำออก</div>
          <div style={{ width: 80 }} />
        </div>

        <div style={layout}>
          {/* Left: scan panel */}
          <div style={leftPanel}>
            {/* Mode toggle */}
            <div style={modeRow}>
              {['IN', 'OUT'].map(m => (
                <button key={m} onClick={() => { setMode(m); reset() }} style={modeBtn(mode === m, m)}>
                  {m === 'IN' ? '📥 รับเข้า' : '📤 นำออก'}
                </button>
              ))}
            </div>

            {/* Scan input */}
            <div style={scanBox(mode)}>
              <div style={scanLabel}>สแกน หรือพิมพ์ Barcode ID</div>
              <div style={inputRow}>
                <input
                  ref={inputRef}
                  style={scanInput(mode)}
                  value={input}
                  onChange={e => { setInput(e.target.value.toUpperCase()); setNotFound(false); setFound(null) }}
                  onKeyDown={handleKeyDown}
                  placeholder="เช่น IT-001"
                  autoComplete="off"
                />
                <button onClick={() => handleSearch()} style={searchBtn(mode)} disabled={loading}>
                  {loading ? '⏳' : '🔍'}
                </button>
              </div>
              {notFound && (
                <div style={errMsg}>❌ ไม่พบรหัส "{input}" ในระบบ</div>
              )}
            </div>

            {/* Result */}
            {result && (
              <div style={resultCard(result.mode)}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{result.mode === 'IN' ? '✅' : '✅'}</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {result.mode === 'IN' ? 'รับเข้าสำเร็จ' : 'นำออกสำเร็จ'}
                </div>
                <div style={{ fontSize: 13, marginTop: 4, opacity: .85 }}>
                  {result.txn?.itemName} · {result.mode === 'IN' ? '+' : '-'}{result.txn?.qty} ชิ้น
                </div>
                <div style={{ fontSize: 12, marginTop: 2, opacity: .7 }}>
                  Stock: {result.txn?.qtyBefore} → <b>{result.txn?.qtyAfter}</b>
                </div>
              </div>
            )}

            {/* Item detail */}
            {found && (
              <div style={itemCard}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--accent)' }}>{found.id}</div>
                    <div style={{ fontSize:15, fontWeight:700, marginTop:2 }}>{found.name}</div>
                    <div style={{ fontSize:12, color:'var(--text3)', marginTop:1 }}>{found.brand} {found.model}</div>
                  </div>
                  <div style={stockBadge(found.quantity <= found.minQuantity)}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:700 }}>{found.quantity}</span>
                    <span style={{ fontSize:10 }}> ชิ้น</span>
                  </div>
                </div>

                {found.location && <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12 }}>📍 {found.location}</div>}

                {/* Qty selector */}
                <div style={qtyRow}>
                  <div style={qtyLabel}>จำนวน</div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <button onClick={() => setQty(q => Math.max(1,q-1))} style={qBtn}>−</button>
                    <span style={{ fontFamily:'var(--mono)', fontSize:22, fontWeight:700, color:'var(--accent)', minWidth:36, textAlign:'center' }}>{qty}</span>
                    <button onClick={() => setQty(q => mode === 'OUT' ? Math.min(found.quantity,q+1) : q+1)} style={qBtn}>+</button>
                  </div>
                  {mode === 'OUT' && <div style={{ fontSize:11, color:'var(--text3)' }}>max: {found.quantity}</div>}
                </div>

                <input style={noteInput} value={note} onChange={e=>setNote(e.target.value)} placeholder="หมายเหตุ (ไม่บังคับ)" />
                <input style={noteInput} value={by} onChange={e=>setBy(e.target.value)} placeholder="ผู้ดำเนินการ (ไม่บังคับ)" />

                <button onClick={handleSubmit} disabled={loading || (mode==='OUT' && qty > found.quantity)} style={submitBtn(mode)}>
                  {loading ? '⏳ กำลังบันทึก...' : (mode === 'IN' ? `📥 รับเข้า ${qty} ชิ้น` : `📤 นำออก ${qty} ชิ้น`)}
                </button>

                <button onClick={reset} style={cancelBtn}>ยกเลิก / สแกนใหม่</button>
              </div>
            )}
          </div>

          {/* Right: recent transactions */}
          <div style={rightPanel}>
            <div style={panelTitle}>📋 ประวัติล่าสุด</div>
            {recentTxns.length === 0 ? (
              <div style={{ color:'var(--text3)', fontSize:13, padding:20, textAlign:'center' }}>ยังไม่มีประวัติ</div>
            ) : (
              recentTxns.map(t => (
                <div key={t.txnId} style={txnRow}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={txnBadge(t.type)}>{t.type === 'IN' ? '📥 IN' : '📤 OUT'}</span>
                    <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text3)' }}>{t.txnId}</span>
                  </div>
                  <div style={{ fontSize:12, fontWeight:500, marginTop:3, color:'var(--text)' }}>{t.itemName}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:2 }}>
                    <span style={{ fontSize:11, color:'var(--text3)' }}>{t.itemId}</span>
                    <span style={{ fontFamily:'var(--mono)', fontSize:12, color: t.type==='IN'?'var(--success)':'var(--warning)', fontWeight:600 }}>
                      {t.type==='IN'?'+':'-'}{t.qty} → <b>{t.qtyAfter}</b>
                    </span>
                  </div>
                  {t.note && <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>💬 {t.note}</div>}
                  <div style={{ fontSize:9, color:'var(--text3)', marginTop:2 }}>{new Date(t.createdAt).toLocaleString('th-TH')}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        input:focus{outline:none;border-color:var(--accent)!important;box-shadow:0 0 0 3px var(--accent-glow)}
        @keyframes slide-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        button:active{transform:scale(.97)}
      `}</style>
    </>
  )
}

const wrap={minHeight:'100vh',background:'var(--bg)',fontFamily:'var(--sans)'}
const topbar={display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 24px',borderBottom:'1px solid var(--border)',background:'var(--surface)'}
const backBtn={color:'var(--accent)',textDecoration:'none',fontSize:14,fontWeight:500}
const pageTitle={fontSize:17,fontWeight:700,color:'var(--text)'}
const layout={display:'grid',gridTemplateColumns:'1fr 320px',gap:24,padding:24,maxWidth:960,margin:'0 auto'}
const leftPanel={display:'flex',flexDirection:'column',gap:14}
const modeRow={display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}
const modeBtn=(a,m)=>({padding:'14px',borderRadius:10,border:`2px solid ${a?(m==='IN'?'var(--success)':'var(--warning)'):'var(--border)'}`,background:a?(m==='IN'?'rgba(0,229,160,.1)':'rgba(255,184,0,.1)'):'var(--surface)',color:a?(m==='IN'?'var(--success)':'var(--warning)'):'var(--text2)',fontSize:16,fontWeight:700,cursor:'pointer',transition:'all .15s',fontFamily:'var(--sans)'})
const scanBox=(m)=>({background:'var(--surface)',border:`1px solid ${m==='IN'?'rgba(0,229,160,.3)':'rgba(255,184,0,.3)'}`,borderRadius:12,padding:18})
const scanLabel={fontSize:11,color:'var(--text3)',letterSpacing:1.5,textTransform:'uppercase',marginBottom:10}
const inputRow={display:'flex',gap:8}
const scanInput=(m)=>({flex:1,background:'var(--surface2)',border:`2px solid ${m==='IN'?'rgba(0,229,160,.4)':'rgba(255,184,0,.4)'}`,color:'var(--text)',borderRadius:8,padding:'11px 14px',fontSize:18,fontFamily:'var(--mono)',fontWeight:600,letterSpacing:1,outline:'none'})
const searchBtn=(m)=>({background:m==='IN'?'var(--success)':'var(--warning)',border:'none',borderRadius:8,padding:'0 16px',fontSize:18,cursor:'pointer',color:'#000',fontWeight:700})
const errMsg={color:'var(--danger)',fontSize:13,marginTop:8,animation:'slide-in .2s ease'}
const resultCard=(m)=>({background:m==='IN'?'rgba(0,229,160,.1)':'rgba(255,184,0,.1)',border:`1px solid ${m==='IN'?'var(--success)':'var(--warning)'}`,borderRadius:10,padding:'14px 18px',textAlign:'center',animation:'slide-in .3s ease',color:m==='IN'?'var(--success)':'var(--warning)'})
const itemCard={background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:12,padding:18,animation:'slide-in .25s ease'}
const stockBadge=(low)=>({display:'inline-flex',alignItems:'baseline',gap:2,background:low?'rgba(255,77,106,.12)':'rgba(0,229,160,.08)',color:low?'var(--danger)':'var(--success)',border:`1px solid ${low?'rgba(255,77,106,.3)':'rgba(0,229,160,.2)'}`,borderRadius:8,padding:'4px 10px'})
const qtyRow={display:'flex',alignItems:'center',gap:14,marginBottom:12,background:'var(--surface2)',borderRadius:8,padding:'10px 14px',border:'1px solid var(--border)'}
const qtyLabel={fontSize:12,color:'var(--text3)',minWidth:40}
const qBtn={background:'var(--surface)',border:'1px solid var(--border2)',color:'var(--text)',width:34,height:34,borderRadius:8,cursor:'pointer',fontSize:20,lineHeight:1}
const noteInput={width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:8,padding:'9px 12px',fontSize:13,fontFamily:'var(--sans)',marginBottom:8,display:'block',outline:'none'}
const submitBtn=(m)=>({width:'100%',background:m==='IN'?'var(--success)':'var(--warning)',color:'#000',border:'none',borderRadius:10,padding:'13px',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'var(--sans)',marginTop:4,marginBottom:8})
const cancelBtn={width:'100%',background:'transparent',border:'1px solid var(--border)',color:'var(--text3)',borderRadius:10,padding:'9px',fontSize:13,cursor:'pointer'}
const rightPanel={background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:16,height:'fit-content',maxHeight:'calc(100vh - 120px)',overflowY:'auto',position:'sticky',top:20}
const panelTitle={fontSize:12,color:'var(--text3)',letterSpacing:1.5,textTransform:'uppercase',marginBottom:12,borderBottom:'1px solid var(--border)',paddingBottom:10}
const txnRow={borderBottom:'1px solid var(--border)',paddingBottom:10,marginBottom:10,animation:'slide-in .3s ease'}
const txnBadge=(t)=>({fontSize:11,fontWeight:700,color:t==='IN'?'var(--success)':'var(--warning)',background:t==='IN'?'rgba(0,229,160,.1)':'rgba(255,184,0,.1)',padding:'2px 8px',borderRadius:6,border:`1px solid ${t==='IN'?'rgba(0,229,160,.2)':'rgba(255,184,0,.2)'}`})
