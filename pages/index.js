import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const BarcodeModal = dynamic(() => import('../components/BarcodeModal'), { ssr: false })
const StockForm    = dynamic(() => import('../components/StockForm'),    { ssr: false })

const CATS = ['all','Laptop','Desktop','Monitor','Peripheral','Network','Server','Storage','Phone','Tablet','Other']
const ICON = {Laptop:'💻',Desktop:'🖥️',Monitor:'🖥',Peripheral:'🖱️',Network:'🌐',Server:'🗄️',Storage:'💾',Phone:'📱',Tablet:'📲',Other:'📦',all:'🗂️'}

export default function Home() {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('all')
  const [barItem,  setBarItem]  = useState(null)
  const [formItem, setFormItem] = useState(undefined)
  const [delItem,  setDelItem]  = useState(null)
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy,   setSortBy]   = useState('id')
  const [toast,    setToast]    = useState(null)

  const showToast = (msg, type='success') => {
    setToast({msg,type})
    setTimeout(()=>setToast(null), 3000)
  }

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (search) p.set('search', search)
      if (category !== 'all') p.set('category', category)
      const res = await fetch(`/api/stock?${p}`)
      setItems(await res.json())
    } finally { setLoading(false) }
  }, [search, category])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleSave = (saved) => {
    setFormItem(undefined)
    fetchItems()
    showToast(formItem===null ? `เพิ่ม ${saved.id} สำเร็จ` : `อัปเดต ${saved.id} สำเร็จ`)
  }

  const handleDelete = async (item) => {
    await fetch(`/api/stock/${item.id}`, { method:'DELETE' })
    setDelItem(null)
    fetchItems()
    showToast(`ลบ ${item.id} เรียบร้อย`, 'danger')
  }

  const sorted = [...items].sort((a,b) => {
    if (sortBy==='name')    return a.name.localeCompare(b.name)
    if (sortBy==='qty')     return b.quantity - a.quantity
    if (sortBy==='qty_asc') return a.quantity - b.quantity
    return a.id.localeCompare(b.id)
  })

  const stats = {
    total:    items.length,
    low:      items.filter(i => i.quantity <= i.minQuantity).length,
    totalQty: items.reduce((s,i) => s+i.quantity, 0),
  }

  return (
    <>
      <Head>
        <title>IT Stock Management</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🖥️</text></svg>" />
      </Head>

      <div style={layout}>
        {/* Sidebar */}
        <aside style={sidebar}>
          <div style={logoArea}>
            <div style={logoBox}>IT</div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>Stock Manager</div>
              <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)'}}>IT Dept.</div>
            </div>
          </div>

          {/* Nav */}
          <div style={navSection}>
            <div style={navLabel}>เมนูหลัก</div>
            <Link href="/" style={navItem(true)}>📦 Stock รายการ</Link>
            <Link href="/scan" style={navItem(false)}>📷 Scan รับ/นำออก</Link>
          </div>

          {/* Categories */}
          <div style={navSection}>
            <div style={navLabel}>หมวดหมู่</div>
            {CATS.map(cat => (
              <button key={cat} onClick={()=>setCategory(cat)} style={catBtn(category===cat)}>
                <span>{ICON[cat]||'📦'}</span>
                <span style={{flex:1,textAlign:'left'}}>{cat==='all'?'ทั้งหมด':cat}</span>
                {cat!=='all' && <span style={countPill}>{items.filter(i=>i.category===cat).length}</span>}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div style={statsBox}>
            <Stat label="รายการทั้งหมด" val={stats.total} unit="รายการ" />
            <Stat label="จำนวนรวม"       val={stats.totalQty} unit="ชิ้น" />
            <Stat label="Stock ใกล้หมด"  val={stats.low} unit="รายการ" color={stats.low>0?'var(--warning)':'var(--success)'} />
          </div>
        </aside>

        {/* Main */}
        <main style={mainArea}>
          {/* Toolbar */}
          <div style={toolbar}>
            <div style={searchWrap}>
              <span style={{color:'var(--text3)',fontSize:14}}>🔍</span>
              <input style={searchIn} placeholder="ค้นหา ID, ชื่อ, ยี่ห้อ, Serial..." value={search} onChange={e=>setSearch(e.target.value)} />
              {search && <button onClick={()=>setSearch('')} style={clearX}>✕</button>}
            </div>

            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={sortSel}>
              <option value="id">ID</option>
              <option value="name">ชื่อ</option>
              <option value="qty">จำนวน ↓</option>
              <option value="qty_asc">จำนวน ↑</option>
            </select>

            <div style={viewToggle}>
              {['grid','table'].map(v=>(
                <button key={v} onClick={()=>setViewMode(v)} style={viewBtn(viewMode===v)}>
                  {v==='grid'?'⊞':'☰'}
                </button>
              ))}
            </div>

            <button onClick={()=>setFormItem(null)} style={addBtn}>+ เพิ่มอุปกรณ์</button>
          </div>

          {/* Alert */}
          {stats.low>0 && (
            <div style={alertBar}>
              ⚠️ มี <b>{stats.low} รายการ</b> ที่ Stock ใกล้หมด
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div style={centerBox}><div style={spinner}/><span style={{color:'var(--text3)',fontFamily:'var(--mono)',fontSize:13}}>Loading...</span></div>
          ) : sorted.length===0 ? (
            <div style={centerBox}>
              <div style={{fontSize:48,marginBottom:12}}>📭</div>
              <div style={{color:'var(--text2)',fontSize:14}}>ไม่พบรายการ</div>
              <button onClick={()=>setFormItem(null)} style={{...addBtn,marginTop:14}}>+ เพิ่มรายการแรก</button>
            </div>
          ) : viewMode==='grid' ? (
            <div style={grid}>
              {sorted.map(item=>(
                <Card key={item.id} item={item}
                  onEdit={()=>setFormItem(item)}
                  onDelete={()=>setDelItem(item)}
                  onBarcode={()=>setBarItem(item)}
                />
              ))}
            </div>
          ) : (
            <TableView items={sorted} onEdit={setFormItem} onDelete={setDelItem} onBarcode={setBarItem} />
          )}
        </main>
      </div>

      {formItem!==undefined && <StockForm item={formItem} onSave={handleSave} onClose={()=>setFormItem(undefined)} />}
      {barItem && <BarcodeModal item={barItem} onClose={()=>setBarItem(null)} />}
      {delItem && <DelModal item={delItem} onConfirm={()=>handleDelete(delItem)} onClose={()=>setDelItem(null)} />}
      {toast && <div style={toastSt(toast.type)}>{toast.type==='success'?'✅':'🗑️'} {toast.msg}</div>}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes toast-in{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        input:focus,select:focus{outline:none;border-color:var(--accent)!important;box-shadow:0 0 0 3px var(--accent-glow)}
        button:active{transform:scale(.97)}
        .card:hover{border-color:var(--border2)!important;background:var(--surface2)!important;transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.3)}
        a{text-decoration:none}
      `}</style>
    </>
  )
}

function Card({item, onEdit, onDelete, onBarcode}) {
  const low = item.quantity <= item.minQuantity
  return (
    <div className="card" style={cardSt}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          <span style={{fontSize:20}}>{ICON[item.category]||'📦'}</span>
          <span style={catTag}>{item.category}</span>
        </div>
        <span style={idTag}>{item.id}</span>
      </div>
      <div style={{fontWeight:600,fontSize:14,color:'var(--text)',marginBottom:2,lineHeight:1.4}}>{item.name}</div>
      <div style={{fontSize:11,color:'var(--text3)',marginBottom:8}}>{item.brand} {item.model}</div>
      {item.serial && <div style={serialTag}>S/N: {item.serial}</div>}

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8,marginBottom:10}}>
        <div style={qtyBadge(low)}>
          {low&&<span>⚠️ </span>}
          <span style={{fontFamily:'var(--mono)',fontWeight:700,fontSize:18}}>{item.quantity}</span>
          <span style={{fontSize:10,opacity:.7}}> ชิ้น</span>
        </div>
        {item.location && <span style={{fontSize:11,color:'var(--text3)'}}>📍 {item.location}</span>}
      </div>

      <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
        <IBtn title="พิมพ์ Barcode" color="var(--accent)"   onClick={onBarcode}>🏷️</IBtn>
        <IBtn title="แก้ไข"         color="var(--success)"  onClick={onEdit}>✏️</IBtn>
        <IBtn title="ลบ"            color="var(--danger)"   onClick={onDelete}>🗑️</IBtn>
      </div>
    </div>
  )
}

function TableView({items, onEdit, onDelete, onBarcode}) {
  return (
    <div style={{overflowX:'auto',animation:'fadein .3s ease'}}>
      <table style={{width:'100%',borderCollapse:'separate',borderSpacing:'0 3px'}}>
        <thead>
          <tr>{['ID','อุปกรณ์','หมวดหมู่','Serial','จำนวน','ที่เก็บ','Actions'].map(h=>(
            <th key={h} style={thSt}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {items.map(item=>{
            const low = item.quantity<=item.minQuantity
            return (
              <tr key={item.id}>
                <td style={tdSt}><span style={{fontFamily:'var(--mono)',color:'var(--accent)',fontSize:12}}>{item.id}</span></td>
                <td style={tdSt}>
                  <div style={{fontWeight:500,fontSize:13}}>{item.name}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>{item.brand} {item.model}</div>
                </td>
                <td style={tdSt}><span style={catTag}>{item.category}</span></td>
                <td style={tdSt}><span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text3)'}}>{item.serial||'-'}</span></td>
                <td style={tdSt}><span style={{...qtyBadge(low),display:'inline-flex',padding:'3px 10px'}}>
                  {low&&'⚠️ '}<span style={{fontFamily:'var(--mono)',fontWeight:700}}>{item.quantity}</span>
                </span></td>
                <td style={tdSt}><span style={{fontSize:12,color:'var(--text3)'}}>{item.location||'-'}</span></td>
                <td style={tdSt}>
                  <div style={{display:'flex',gap:5}}>
                    <IBtn title="Barcode" color="var(--accent)"  onClick={()=>onBarcode(item)}>🏷️</IBtn>
                    <IBtn title="แก้ไข"   color="var(--success)" onClick={()=>onEdit(item)}>✏️</IBtn>
                    <IBtn title="ลบ"      color="var(--danger)"  onClick={()=>onDelete(item)}>🗑️</IBtn>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function DelModal({item, onConfirm, onClose}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(4px)'}}>
      <div style={{background:'var(--surface)',border:'1px solid var(--danger)',borderRadius:16,padding:28,maxWidth:360,width:'90%',textAlign:'center'}}>
        <div style={{fontSize:36,marginBottom:10}}>⚠️</div>
        <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>ยืนยันการลบ</div>
        <div style={{fontSize:13,color:'var(--text2)',marginBottom:4}}>
          <span style={{color:'var(--accent)',fontFamily:'var(--mono)'}}>{item.id}</span>
        </div>
        <div style={{fontSize:14,fontWeight:600,marginBottom:20}}>{item.name}</div>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button onClick={onClose} style={{background:'transparent',border:'1px solid var(--border2)',color:'var(--text2)',borderRadius:8,padding:'9px 20px',cursor:'pointer',fontSize:13}}>ยกเลิก</button>
          <button onClick={onConfirm} style={{background:'var(--danger)',color:'white',border:'none',borderRadius:8,padding:'9px 20px',cursor:'pointer',fontSize:13,fontWeight:700}}>ลบออก</button>
        </div>
      </div>
    </div>
  )
}

function IBtn({children, onClick, color, title}) {
  return <button title={title} onClick={onClick} style={{background:'var(--surface2)',border:'1px solid var(--border)',color,width:29,height:29,borderRadius:7,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center'}}>{children}</button>
}

function Stat({label, val, unit, color}) {
  return (
    <div style={{padding:'7px 0',borderBottom:'1px solid var(--border)'}}>
      <div style={{fontSize:10,color:'var(--text3)',marginBottom:2}}>{label}</div>
      <div style={{fontFamily:'var(--mono)',fontWeight:600,fontSize:14,color:color||'var(--text)'}}>
        {val} <span style={{fontSize:10,fontWeight:400,color:'var(--text3)'}}>{unit}</span>
      </div>
    </div>
  )
}

// ── styles ──
const layout={display:'flex',minHeight:'100vh'}
const sidebar={width:220,background:'var(--surface)',borderRight:'1px solid var(--border)',padding:'18px 0',display:'flex',flexDirection:'column',gap:0,position:'sticky',top:0,height:'100vh',overflowY:'auto'}
const logoArea={display:'flex',alignItems:'center',gap:10,padding:'0 18px 18px',borderBottom:'1px solid var(--border)',marginBottom:6}
const logoBox={width:34,height:34,background:'var(--accent)',color:'#000',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--mono)',fontWeight:700,fontSize:12,letterSpacing:1}
const navSection={padding:'10px 12px'}
const navLabel={fontSize:10,color:'var(--text3)',letterSpacing:1.5,textTransform:'uppercase',padding:'0 6px',marginBottom:5}
const navItem=(a)=>({display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:8,fontSize:13,color:a?'var(--accent)':'var(--text2)',background:a?'var(--accent-glow)':'transparent',border:a?'1px solid rgba(0,212,255,.2)':'1px solid transparent',marginBottom:3,fontWeight:a?600:400,transition:'all .15s'})
const catBtn=(a)=>({display:'flex',alignItems:'center',gap:7,width:'100%',background:a?'var(--accent-glow)':'transparent',border:a?'1px solid rgba(0,212,255,.2)':'1px solid transparent',color:a?'var(--accent)':'var(--text2)',borderRadius:7,padding:'7px 10px',cursor:'pointer',fontSize:12,marginBottom:2,transition:'all .15s'})
const countPill={fontSize:10,background:'var(--surface2)',color:'var(--text3)',padding:'1px 5px',borderRadius:8,fontFamily:'var(--mono)'}
const statsBox={padding:'10px 12px',marginTop:'auto',borderTop:'1px solid var(--border)'}
const mainArea={flex:1,padding:22,minWidth:0,overflowX:'hidden'}
const toolbar={display:'flex',alignItems:'center',gap:10,marginBottom:16,flexWrap:'wrap'}
const searchWrap={display:'flex',alignItems:'center',gap:8,background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:9,padding:'0 12px',flex:'1 1 220px',minWidth:200}
const searchIn={background:'none',border:'none',color:'var(--text)',fontSize:13,padding:'9px 0',outline:'none',flex:1,fontFamily:'var(--sans)'}
const clearX={background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:12}
const sortSel={background:'var(--surface)',border:'1px solid var(--border2)',color:'var(--text)',borderRadius:8,padding:'8px 10px',fontSize:12}
const viewToggle={display:'flex',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,overflow:'hidden'}
const viewBtn=(a)=>({background:a?'var(--accent-glow)':'transparent',border:'none',color:a?'var(--accent)':'var(--text3)',padding:'8px 11px',cursor:'pointer',fontSize:16})
const addBtn={background:'var(--accent)',color:'#000',border:'none',borderRadius:8,padding:'9px 15px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'var(--sans)',whiteSpace:'nowrap'}
const alertBar={background:'rgba(255,184,0,.1)',border:'1px solid rgba(255,184,0,.3)',color:'var(--warning)',borderRadius:9,padding:'9px 15px',fontSize:13,marginBottom:16}
const centerBox={display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:280,gap:12}
const spinner={width:34,height:34,border:'3px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin .8s linear infinite'}
const grid={display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:12}
const cardSt={background:'var(--surface)',border:'1px solid var(--border)',borderRadius:11,padding:14,transition:'all .2s ease',animation:'fadein .3s ease',cursor:'default'}
const catTag={fontSize:10,background:'var(--surface2)',color:'var(--text2)',padding:'2px 7px',borderRadius:9,border:'1px solid var(--border)'}
const idTag={fontFamily:'var(--mono)',fontSize:11,color:'var(--accent)',background:'var(--accent-glow)',padding:'3px 7px',borderRadius:6}
const serialTag={fontFamily:'var(--mono)',fontSize:10,color:'var(--text3)',background:'rgba(255,255,255,.03)',padding:'2px 6px',borderRadius:4,marginBottom:4,letterSpacing:.4}
const qtyBadge=(low)=>({display:'inline-flex',alignItems:'center',gap:2,background:low?'rgba(255,77,106,.12)':'rgba(0,229,160,.08)',color:low?'var(--danger)':'var(--success)',border:`1px solid ${low?'rgba(255,77,106,.25)':'rgba(0,229,160,.2)'}`,borderRadius:7,padding:'4px 9px'})
const thSt={textAlign:'left',fontSize:10,color:'var(--text3)',letterSpacing:1.5,textTransform:'uppercase',padding:'0 12px 10px',borderBottom:'1px solid var(--border)'}
const tdSt={padding:'9px 12px',background:'var(--surface)',borderBottom:'1px solid var(--border)',fontSize:13}
const toastSt=(t)=>({position:'fixed',bottom:22,right:22,zIndex:2000,background:t==='success'?'rgba(0,229,160,.15)':'rgba(255,77,106,.15)',border:`1px solid ${t==='success'?'var(--success)':'var(--danger)'}`,color:t==='success'?'var(--success)':'var(--danger)',borderRadius:11,padding:'11px 18px',fontSize:14,fontWeight:500,animation:'toast-in .3s ease',backdropFilter:'blur(8px)'})
