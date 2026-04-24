import React, { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Package, MapPin, Scan, Search, Plus, AlertTriangle, Edit, Trash, X, CheckCircle, Settings, ChevronDown, Laptop, Monitor, Mouse, Network, Server, HardDrive, Smartphone, Tablet, Box } from 'lucide-react'

const StockForm = dynamic(() => import('../components/StockForm'), { ssr: false })

const CATS = ['all','Laptop','Desktop','Monitor','Peripheral','Network','Server','Storage','Phone','Tablet','Other']
const ICON = {Laptop:Laptop,Desktop:Monitor,Monitor:Monitor,Peripheral:Mouse,Network:Network,Server:Server,Storage:HardDrive,Phone:Smartphone,Tablet:Tablet,Other:Box,all:Box}

export default function SettingsPage() {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('all')
  const [formItem, setFormItem] = useState(undefined)
  const [delItem,  setDelItem]  = useState(null)
  const [toast,    setToast]    = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

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
    setSelectedItem(null)
    fetchItems()
    showToast(`ลบ ${item.id} เรียบร้อย`, 'danger')
  }

  const handleRowClick = (item) => {
    setSelectedItem(item)
  }

  const sorted = [...items].sort((a,b) => a.id.localeCompare(b.id))

  const filtered = sorted.filter(item => {
    if (search) {
      const s = search.toLowerCase()
      return item.id.toLowerCase().includes(s) ||
             item.name.toLowerCase().includes(s) ||
             (item.brand && item.brand.toLowerCase().includes(s)) ||
             (item.serial && item.serial.toLowerCase().includes(s))
    }
    return true
  })

  const stats = {
    total:    items.length,
    low:      items.filter(i => i.quantity <= i.minQuantity).length,
    totalQty: items.reduce((s,i) => s+i.quantity, 0),
  }

  return (
    <>
      <Head>
        <title>IT Stock Management - Settings</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🖥️</text></svg>" />
      </Head>

      <div style={{...layout, backgroundImage: 'url(/images/bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed'}}>
        {/* Navbar */}
        <nav style={navbar}>
          <div style={{maxWidth:1400,margin:'0 auto',width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={navbarNav}>
              <Link href="/" className="nav-link" style={navItem(false)}><Package size={16} /> Stock รายการ</Link>
              <Link href="/location" className="nav-link" style={navItem(false)}><MapPin size={16} /> จัดการตำแหน่ง</Link>
              <Link href="/scan" className="nav-link" style={navItem(false)}><Scan size={16} /> Scan รับ/นำออก</Link>
              <Link href="/settings" className="nav-link" style={navItem(true)}><Settings size={16} /> ตั้งค่า</Link>
            </div>
            <div style={navbarRight}>
              <CategoryDropdown current={category} onSelect={setCategory} isOpen={dropdownOpen} onToggle={() => setDropdownOpen(!dropdownOpen)} />
              <Stat label="รายการ" val={stats.total} unit="รายการ" />
              <Stat label="รวม" val={stats.totalQty} unit="ชิ้น" />
              <Stat label="ใกล้หมด" val={stats.low} unit="รายการ" color={stats.low>0?'var(--warning)':'var(--success)'} />
            </div>
          </div>
        </nav>

        {/* Main */}
        <main style={mainArea}>
          {/* Toolbar */}
          <div style={toolbar}>
            <div style={searchWrap}>
              <Search size={16} style={{color:'var(--text3)'}} />
              <input style={searchIn} placeholder="ค้นหา ID, ชื่อ, ยี่ห้อ, Serial..." value={search} onChange={e=>setSearch(e.target.value)} />
              {search && <button onClick={()=>setSearch('')} style={clearX}><X size={12} /></button>}
            </div>

            <button onClick={()=>setFormItem(null)} style={addBtn}><Plus size={14} /> เพิ่มอุปกรณ์</button>
          </div>

          {/* Alert */}
          {stats.low>0 && (
            <div style={alertBar}>
              <AlertTriangle size={16} style={{marginRight: 8}} /> มี <b>{stats.low} รายการ</b> ที่ Stock ใกล้หมด
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div style={centerBox}><div style={spinner}/><span style={{color:'var(--text3)',fontFamily:'var(--mono)',fontSize:13}}>Loading...</span></div>
          ) : filtered.length===0 ? (
            <div style={centerBox}>
              <Package size={48} style={{marginBottom:12,color:'var(--text3)'}} />
              <div style={{color:'var(--text2)',fontSize:14}}>ไม่พบรายการ</div>
              <button onClick={()=>setFormItem(null)} style={{...addBtn,marginTop:14}}><Plus size={14} /> เพิ่มรายการแรก</button>
            </div>
          ) : (
            <>
              {selectedItem && <DetailPanel item={selectedItem} onClose={()=>setSelectedItem(null)} onEdit={()=>{setSelectedItem(null);setFormItem(selectedItem)}} onDelete={()=>setDelItem(selectedItem)} />}
              <TableView items={filtered} selected={selectedItem} onRowClick={handleRowClick} onEdit={setFormItem} onDelete={setDelItem} />
            </>
          )}
        </main>
      </div>

      {formItem!==undefined && <StockForm item={formItem} onSave={handleSave} onClose={()=>setFormItem(undefined)} />}
      {delItem && <DelModal item={delItem} onConfirm={()=>handleDelete(delItem)} onClose={()=>setDelItem(null)} />}
      {toast && <div style={toastSt(toast.type)}>{toast.type==='success'?<CheckCircle size={16} />:<Trash size={16} />} {toast.msg}</div>}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes toast-in{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        input:focus,select:focus{outline:none;border-color:var(--accent)!important;box-shadow:0 0 0 3px var(--accent-glow)}
        button:active{transform:scale(.97)}
        a{text-decoration:none}
        .nav-link:hover{background:rgba(255,255,255,0.15)}
        .row-hover:hover{background:var(--surface2)!important;transition:background .15s}
      `}</style>
    </>
  )
}

function DetailPanel({ item, onClose, onEdit, onDelete }) {
  const Icon = ICON[item.category] || Box
  const low = item.quantity <= item.minQuantity
  return (
    <div style={{background:'rgba(255,255,255,0.95)',border:'1px solid var(--accent)',borderRadius:12,padding:'16px',marginBottom:16,maxWidth:1400,width:'100%',animation:'fadein .2s ease'}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:16}}>
        <div style={{width:56,height:56,borderRadius:10,background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <Icon size={32} style={{color:'var(--accent)'}} />
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <span style={{fontFamily:'var(--mono)',color:'var(--accent)',fontSize:13,fontWeight:700}}>{item.id}</span>
            <span style={catTag}>{item.category}</span>
            {low && <span style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(239,68,68,0.15)',color:'var(--danger)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:6,padding:'2px 8px',fontSize:11}}><AlertTriangle size={12} /> Stock ใกล้หมด</span>}
          </div>
          <div style={{fontSize:18,fontWeight:700,color:'var(--text)',marginBottom:6}}>{item.name}</div>
          <div style={{fontSize:13,color:'var(--text2)',marginBottom:12}}>{item.brand} {item.model}</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12}}>
            <div><div style={{fontSize:10,color:'var(--text3)',marginBottom:2}}>Serial Number</div><div style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text)'}}>{item.serial || '-'}</div></div>
            <div><div style={{fontSize:10,color:'var(--text3)',marginBottom:2}}>จำนวน</div><div style={{fontFamily:'var(--mono)',fontSize:13,fontWeight:600,color:low?'var(--danger)':'var(--success)'}}>{item.quantity} ชิ้น</div></div>
            <div><div style={{fontSize:10,color:'var(--text3)',marginBottom:2}}>ขั้นต่ำ</div><div style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text)'}}>{item.minQuantity} ชิ้น</div></div>
            <div><div style={{fontSize:10,color:'var(--text3)',marginBottom:2}}>ที่เก็บ</div><div style={{fontSize:12,color:'var(--text)'}}>{item.location || '-'}</div></div>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8,flexShrink:0}}>
          <button onClick={onEdit} style={{background:'var(--accent)',color:'#000',border:'none',borderRadius:8,padding:'8px 16px',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}><Edit size={14} /> แก้ไข</button>
          <button onClick={onDelete} style={{background:'transparent',border:'1px solid var(--danger)',color:'var(--danger)',borderRadius:8,padding:'8px 16px',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}><Trash size={14} /> ลบ</button>
          <button onClick={onClose} style={{background:'transparent',border:'1px solid var(--border2)',color:'var(--text2)',borderRadius:8,padding:'8px 16px',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}><X size={14} /> ปิด</button>
        </div>
      </div>
    </div>
  )
}

function TableView({items, selected, onRowClick, onEdit, onDelete}) {
  return (
    <div style={{overflowX:'auto',animation:'fadein .3s ease',maxWidth:1400,width:'100%'}}>
      <table style={{width:'100%',borderCollapse:'separate',borderSpacing:'0 3px'}}>
        <thead>
          <tr>{['ID','อุปกรณ์','หมวดหมู่','Serial','จำนวน','ขั้นต่ำ','ที่เก็บ','Actions'].map(h=>{
            if (h === 'ID') return <th key={h} style={{...thSt,width:'80px',padding:'8px 10px'}}>{h}</th>
            if (h === 'หมวดหมู่') return <th key={h} style={{...thSt,width:'120px',padding:'8px 10px'}}>{h}</th>
            if (h === 'Serial') return <th key={h} style={{...thSt,width:'180px',padding:'8px 10px'}}>{h}</th>
            if (h === 'จำนวน' || h === 'ขั้นต่ำ') return <th key={h} style={{...thSt,width:'60px',textAlign:'center',padding:'8px 10px'}}>{h}</th>
            if (h === 'ที่เก็บ') return <th key={h} style={{...thSt,width:'80px',padding:'8px 10px'}}>{h}</th>
            if (h === 'Actions') return <th key={h} style={{...thSt,width:'70px',textAlign:'center',padding:'8px 10px'}}>{h}</th>
            return <th key={h} style={{...thSt,padding:'8px 10px'}}>{h}</th>
          })}</tr>
        </thead>
        <tbody>
          {items.map(item=>{
            const low = item.quantity<=item.minQuantity
            return (
              <tr key={item.id} className="row-hover" onClick={()=>onRowClick(item)} style={{background:selected?.id===item.id?'var(--accent-glow)':'rgba(255,255,255,0.85)',borderRadius:6,cursor:'pointer',border:selected?.id===item.id?'1px solid var(--accent)':'none'}}>
                <td style={{...tdSt,padding:'6px 8px',borderTopLeftRadius:6,borderBottomLeftRadius:6}}>
                  <span style={{fontFamily:'var(--mono)',color:'var(--accent)',fontSize:11,fontWeight:600}}>{item.id}</span>
                </td>
                <td style={{...tdSt,padding:'6px 8px'}}>
                  <div style={{fontWeight:600,fontSize:12,color:'var(--text)',lineHeight:1.3}}>{item.name}</div>
                  <div style={{fontSize:10,color:'var(--text3)'}}>{item.brand} {item.model}</div>
                </td>
                <td style={{...tdSt,padding:'6px 8px'}}><span style={catTag}>{item.category}</span></td>
                <td style={{...tdSt,padding:'6px 8px'}}>
                  <span style={{fontFamily:'var(--mono)',fontSize:10,color:item.serial?'var(--text3)':'#94a3b8',fontStyle:item.serial?'normal':'italic'}}>
                    {item.serial || 'ไม่ระบุ'}
                  </span>
                </td>
                <td style={{...tdSt,padding:'6px 8px',textAlign:'center'}}>
                  <span style={{...qtyBadge(low),display:'inline-flex',padding:'2px 8px',alignItems:'center',gap:3,fontSize:11}}>
                    {low&&<AlertTriangle size={10} />}<span style={{fontFamily:'var(--mono)',fontWeight:700}}>{item.quantity}</span>
                  </span>
                </td>
                <td style={{...tdSt,padding:'6px 8px',textAlign:'center'}}>
                  <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text3)'}}>{item.minQuantity}</span>
                </td>
                <td style={{...tdSt,padding:'6px 8px'}}>
                  <span style={{fontSize:11,color:item.location?'var(--text3)':'#94a3b8',fontStyle:item.location?'normal':'italic'}}>
                    {item.location || 'ไม่ระบุ'}
                  </span>
                </td>
                <td style={{...tdSt,padding:'6px 8px',borderTopRightRadius:6,borderBottomRightRadius:6,textAlign:'center'}} onClick={e=>e.stopPropagation()}>
                  <div style={{display:'flex',gap:4,justifyContent:'center'}}>
                    <IBtn title="แก้ไข" color="var(--accent)" onClick={()=>onEdit(item)}><Edit size={12} /></IBtn>
                    <IBtn title="ลบ" color="var(--danger)" onClick={()=>onDelete(item)}><Trash size={12} /></IBtn>
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
      <div style={{background:'var(--surface)',border:'1px solid var(--danger)',borderRadius:16,padding:20,maxWidth:380,width:'90%',textAlign:'center'}}>
        <div style={{fontSize:32,marginBottom:10}}><AlertTriangle size={32} style={{color:'var(--danger)'}} /></div>
        <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>ยืนยันการลบ</div>
        <div style={{fontSize:13,color:'var(--text2)',marginBottom:2}}>
          <span style={{color:'var(--accent)',fontFamily:'var(--mono)'}}>{item.id}</span>
        </div>
        <div style={{fontSize:15,fontWeight:600,marginBottom:16}}>{item.name}</div>
        <div style={{fontSize:13,color:'var(--text3)',marginBottom:20,padding:'10px 16px',background:'rgba(239,68,68,0.1)',borderRadius:8}}>
          การลบรายการนี้จะลบข้อมูลออกจากระบบทั้งหมด
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button onClick={onClose} style={{background:'transparent',border:'1px solid var(--border2)',color:'var(--text2)',borderRadius:8,padding:'8px 18px',cursor:'pointer',fontSize:13}}>ยกเลิก</button>
          <button onClick={onConfirm} style={{background:'var(--danger)',color:'white',border:'none',borderRadius:8,padding:'8px 18px',cursor:'pointer',fontSize:13,fontWeight:700}}>ลบออก</button>
        </div>
      </div>
    </div>
  )
}

function IBtn({children, onClick, color, title}) {
  return <button title={title} onClick={onClick} style={{background:'var(--surface2)',border:'1px solid var(--border)',color,width:32,height:32,borderRadius:8,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}>{children}</button>
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

// ── styles ──
const layout={display:'flex',flexDirection:'column',minHeight:'100vh'}
const navbar={display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 24px',position:'sticky',top:0,zIndex:100,width:'100%',backgroundImage:'url(/images/bg_navbar.jpg)',backgroundSize:'cover',backgroundPosition:'center'}
const navbarNav={display:'flex',alignItems:'center',gap:4}
const navbarRight={display:'flex',alignItems:'center',gap:12}
const navItem=(a)=>({display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:8,fontSize:13,color:'#ffffff',background:a?'var(--accent-glow)':'transparent',border:a?'1px solid rgba(0,212,255,.2)':'1px solid transparent',fontWeight:a?600:400,transition:'all .15s',cursor:'pointer'})
const mainArea={flex:1,padding:24,minWidth:0,overflowX:'hidden',display:'flex',flexDirection:'column',alignItems:'center',background:'transparent'}
const toolbar={display:'flex',alignItems:'center',gap:10,marginBottom:16,flexWrap:'wrap',maxWidth:1400,width:'100%',background:'transparent'}
const searchWrap={display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.95)',border:'1px solid var(--border2)',borderRadius:9,padding:'0 12px',flex:'1 1 220px',minWidth:200}
const searchIn={background:'none',border:'none',color:'var(--text)',fontSize:13,padding:'10px 0',outline:'none',flex:1,fontFamily:'var(--sans)'}
const clearX={background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:12}
const addBtn={background:'var(--accent)',color:'#000',border:'none',borderRadius:8,padding:'10px 18px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'var(--sans)',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:6}
const alertBar={background:'rgba(255,184,0,.1)',border:'1px solid rgba(255,184,0,.3)',color:'var(--warning)',borderRadius:9,padding:'10px 16px',fontSize:13,marginBottom:16,maxWidth:1400,width:'100%'}
const centerBox={display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:280,gap:12}
const spinner={width:34,height:34,border:'3px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin .8s linear infinite'}
const catTag={fontSize:10,background:'var(--surface2)',color:'var(--text2)',padding:'3px 10px',borderRadius:20,border:'1px solid var(--border)',fontWeight:500}
const qtyBadge=(low)=>({display:'inline-flex',alignItems:'center',gap:4,background:low?'rgba(239,68,68,0.15)':'rgba(16,185,129,0.15)',color:low?'var(--danger)':'var(--success)',border:`1px solid ${low?'rgba(239,68,68,0.3)':'rgba(16,185,129,0.3)'}`,borderRadius:20})
const thSt={textAlign:'left',fontSize:10,color:'var(--text3)',letterSpacing:1.2,textTransform:'uppercase',padding:'12px 16px',borderBottom:'2px solid var(--border)',fontWeight:600,whiteSpace:'nowrap'}
const tdSt={padding:'14px 16px',fontSize:13,transition:'background .15s'}
const toastSt=(t)=>({position:'fixed',bottom:22,right:22,zIndex:2000,background:t==='success'?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)',border:`1px solid ${t==='success'?'var(--success)':'var(--danger)'}`,color:t==='success'?'var(--success)':'var(--danger)',borderRadius:11,padding:'12px 20px',fontSize:14,fontWeight:500,animation:'toast-in .3s ease',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',gap:8})
