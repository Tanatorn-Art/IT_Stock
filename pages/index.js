import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Package, MapPin, Scan, Search, Plus, AlertTriangle, ChevronDown, Laptop, Monitor, Mouse, Network, Server, HardDrive, Smartphone, Tablet, Box, Edit, Trash, X, CheckCircle, XCircle, Barcode, Settings } from 'lucide-react'

const BarcodeModal = dynamic(() => import('../components/BarcodeModal'), { ssr: false })
const StockForm    = dynamic(() => import('../components/StockForm'),    { ssr: false })
const ViewModal    = dynamic(() => import('../components/ViewModal'),    { ssr: false })
const SettingsDropdown = dynamic(() => import('../components/SettingsDropdown'), { ssr: false })

const CATS = ['all','Laptop','Desktop','Monitor','Peripheral','Network','Server','Storage','Phone','Tablet','Other']
const ICON = {Laptop:Laptop,Desktop:Monitor,Monitor:Monitor,Peripheral:Mouse,Network:Network,Server:Server,Storage:HardDrive,Phone:Smartphone,Tablet:Tablet,Other:Box,all:Box}

export default function Home() {
  const [allItems, setAllItems] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('all')
  const [barItem,  setBarItem]  = useState(null)
  const [formItem, setFormItem] = useState(undefined)
  const [delItem,  setDelItem]  = useState(null)
  const [viewItem, setViewItem]  = useState(null)
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy,   setSortBy]   = useState('id')
  const [toast,    setToast]    = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false)

  const sentinelRef = useRef(null)
  const LIMIT = 24

  const showToast = (msg, type='success') => {
    setToast({msg,type})
    setTimeout(()=>setToast(null), 3000)
  }

  const handleSearchChange = (val) => {
    setSearch(val)
    setPage(1)
  }

  const handleCategorySelect = (cat) => {
    setCategory(cat)
    setPage(1)
  }

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stock')
      setAllItems(await res.json())
    } catch (error) {
      console.error('Error fetching stock:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Data fetching effect
  useEffect(() => {
    fetchItems()
  }, [refreshKey, fetchItems])

  // Filter items in memory
  const filtered = useMemo(() => {
    let result = [...allItems]
    
    // Sort by createdAt descending (newest first)
    result.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })

    if (search) {
      const s = search.toLowerCase()
      result = result.filter(i =>
        i.name?.toLowerCase().includes(s) ||
        i.id?.toLowerCase().includes(s) ||
        i.brand?.toLowerCase().includes(s) ||
        i.serial?.toLowerCase().includes(s) ||
        i.model?.toLowerCase().includes(s)
      )
    }

    if (category && category !== 'all') {
      result = result.filter(i => i.category === category)
    }

    return result
  }, [allItems, search, category])

  // Paginated/visible items to render
  const visibleItems = useMemo(() => {
    return filtered.slice(0, page * LIMIT)
  }, [filtered, page])

  const hasMore = visibleItems.length < filtered.length

  // Intersection Observer for scroll loading
  useEffect(() => {
    if (!hasMore || loading) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage(prev => prev + 1)
      }
    }, {
      rootMargin: '150px',
    })

    const currentSentinel = sentinelRef.current
    if (currentSentinel) {
      observer.observe(currentSentinel)
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel)
      }
    }
  }, [hasMore, loading])

  const handleSave = (saved) => {
    setFormItem(undefined)
    setPage(1)
    setRefreshKey(prev => prev + 1)
    showToast(formItem===null ? `เพิ่ม ${saved.id} สำเร็จ` : `อัปเดต ${saved.id} สำเร็จ`)
  }

  const handleDelete = async (item) => {
    await fetch(`/api/stock/${item.id}`, { method:'DELETE' })
    setDelItem(null)
    setPage(1)
    setRefreshKey(prev => prev + 1)
    showToast(`ลบ ${item.id} เรียบร้อย`, 'danger')
  }

  const sorted = visibleItems

  const stats = {
    total:    allItems.length,
    low:      allItems.filter(i => i.quantity <= i.minQuantity).length,
    totalQty: allItems.reduce((s,i) => s+i.quantity, 0),
  }

  return (
    <>
      <Head>
        <title>IT Stock Management</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🖥️</text></svg>" />
      </Head>

      <div style={{...layout, backgroundImage: 'url(/images/bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed'}}>
        {/* Navbar */}
        <nav style={navbar}>
          <div style={{maxWidth:1400,margin:'0 auto',width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            {/* <div style={navbarLeft}>
              <div style={logoBox}>IT</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Stock Manager</div>
            </div> */}
            <div style={navbarNav}>
              <Link href="/" className="nav-link" style={navItem(true)}><Package size={16} /> Stock รายการ</Link>
              <Link href="/location" className="nav-link" style={navItem(false)}><MapPin size={16} /> จัดการตำแหน่ง</Link>
              <Link href="/borrow" className="nav-link" style={navItem(false)}><Scan size={16} /> ยืม & เบิก อุปกรณ์ ( Develop )</Link>
              {/* <SettingsDropdown isOpen={settingsDropdownOpen} onToggle={() => setSettingsDropdownOpen(!settingsDropdownOpen)} currentPage="index" /> */}
            </div>
            <div style={navbarRight}>
              <CategoryDropdown current={category} onSelect={handleCategorySelect} isOpen={dropdownOpen} onToggle={() => setDropdownOpen(!dropdownOpen)} />
              <SettingsDropdown isOpen={settingsDropdownOpen} onToggle={() => setSettingsDropdownOpen(!settingsDropdownOpen)} currentPage="index" />
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
              <input style={searchIn} placeholder="ค้นหา ID, ชื่อ, ยี่ห้อ, Serial..." value={search} onChange={e=>handleSearchChange(e.target.value)} />
              {search && <button onClick={()=>handleSearchChange('')} style={clearX}><X size={12} /></button>}
            </div>

            {/* <button onClick={()=>setFormItem(null)} style={addBtn}><Plus size={14} /> เพิ่มอุปกรณ์</button> */}
          </div>

          {/* Alert */}
          {/* {stats.low>0 && (
            <div style={alertBar}>
              <AlertTriangle size={16} style={{marginRight: 8}} /> มี <b>{stats.low} รายการ</b> ที่ Stock ใกล้หมด
            </div>
          )} */}

          {/* Content */}
          {loading && page === 1 ? (
            <div style={centerBox}><div style={spinner}/><span style={{color:'var(--text3)',fontFamily:'var(--mono)',fontSize:13}}>Loading...</span></div>
          ) : sorted.length===0 ? (
            <div style={centerBox}>
              <Package size={48} style={{marginBottom:12,color:'var(--text3)'}} />
              <div style={{color:'var(--text2)',fontSize:14}}>ไม่พบรายการ</div>
              {/* <button onClick={()=>setFormItem(null)} style={{...addBtn,marginTop:14}}><Plus size={14} /> เพิ่มรายการแรก</button> */}
            </div>
          ) : viewMode==='grid' ? (
            <div style={grid}>
              {sorted.map(item=>(
                <Card key={item.id} item={item}
                  onEdit={()=>setFormItem(item)}
                  onDelete={()=>setDelItem(item)}
                  onBarcode={()=>setBarItem(item)}
                  onClick={()=>setViewItem(item)}
                />
              ))}
            </div>
          ) : (
            <TableView items={sorted} onEdit={setFormItem} onDelete={setDelItem} onBarcode={setBarItem} />
          )}

          {/* Infinite Scroll Sentinel */}
          {hasMore && (
            <div ref={sentinelRef} style={{ display: 'flex', justifyContent: 'center', padding: '20px 0', width: '100%', minHeight: '50px' }}>
              <span style={{ color: 'var(--text3)', fontSize: 12, opacity: 0.5 }}>เลื่อนลงเพื่อดูเพิ่มเติม</span>
            </div>
          )}
        </main>
      </div>

      {formItem!==undefined && <StockForm item={formItem} onSave={handleSave} onClose={()=>setFormItem(undefined)} />}
      {barItem && <BarcodeModal item={barItem} onClose={()=>setBarItem(null)} />}
      {delItem && <DelModal item={delItem} onConfirm={()=>handleDelete(delItem)} onClose={()=>setDelItem(null)} />}
      {viewItem && <ViewModal item={viewItem} onClose={()=>setViewItem(null)} />}
      {toast && <div style={toastSt(toast.type)}>{toast.type==='success'?<CheckCircle size={16} />:<Trash size={16} />} {toast.msg}</div>}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes toast-in{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        input:focus,select:focus{outline:none;border-color:var(--accent)!important;box-shadow:0 0 0 3px var(--accent-glow)}
        button:active{transform:scale(.97)}
        .card:hover{border-color:var(--border2)!important;background:var(--surface2)!important;transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.3)}
        a{text-decoration:none}
        .nav-link:hover{background:rgba(255,255,255,0.15)}
      `}</style>
    </>
  )
}

function Card({item, onEdit, onDelete, onBarcode, onClick}) {
  const low = item.quantity <= item.minQuantity
  const isOutOfStock = item.quantity === 0
  return (
    <div className="card" style={cardSt} onClick={onClick}>
      {item.image ? (
        <div style={{...cardImgWrap, position: 'relative'}}>
          <img src={item.image} alt={item.name} loading="lazy" decoding="async" style={{...cardImg, filter: isOutOfStock ? 'grayscale(100%)' : 'none'}} />
          {isOutOfStock && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#dc3545',
              fontSize: '50px',
              fontWeight: 'bold',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              textShadow: '2px 2px 4px rgba(255,255,255,0.8)',
              zIndex: 10
            }}>
              หมด
            </div>
          )}
        </div>
      ) : (
        <div style={{...cardNoImg, position: 'relative', filter: isOutOfStock ? 'grayscale(100%)' : 'none'}}>
          {React.createElement(ICON[item.category] || Box, {size: 64})}
          {isOutOfStock && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#dc3545',
              fontSize: '50px',
              fontWeight: 'bold',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              textShadow: '2px 2px 4px rgba(255,255,255,0.9)',
              zIndex: 10
            }}>
              หมด
            </div>
          )}
        </div>
      )}
      <div style={cardBody}>
        <div style={cardName}>{item.name}</div>
        <div style={cardMeta}>{item.brand} {item.model||''}</div>
        <div style={cardBottom}>
          <div style={cardQty}>
            <span style={{fontSize:16,fontWeight:700,color:'var(--accent)',fontFamily:'var(--mono)'}}>{item.quantity}</span>
            <span style={{fontSize:11,color:'var(--text3)'}}>ชิ้น</span>
          </div>
          {item.location && <div style={cardLoc}><MapPin size={12} style={{marginRight:4}} /> {item.location}</div>}
        </div>
      </div>
    </div>
  )
}

function TableView({items, onEdit, onDelete, onBarcode}) {
  return (
    <div style={{overflowX:'auto',animation:'fadein .3s ease'}}>
      <table style={{width:'100%',borderCollapse:'separate',borderSpacing:'0 3px'}}>
        <thead>
          <tr>{['ID','อุปกรณ์','หมวดหมู่','Serial','จำนวน','ที่เก็บ'].map(h=>(
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
                <td style={tdSt}><span style={{...qtyBadge(low),display:'inline-flex',padding:'3px 10px',alignItems:'center',gap:4}}>
                  {low&&<AlertTriangle size={12} />}<span style={{fontFamily:'var(--mono)',fontWeight:700}}>{item.quantity}</span>
                </span></td>
                <td style={tdSt}><span style={{fontSize:12,color:'var(--text3)'}}>{item.location||'-'}</span></td>
                <td style={tdSt}>
                  <div style={{display:'flex',gap:5}}>
                    <IBtn title="Barcode" color="var(--accent)"  onClick={()=>onBarcode(item)}><Barcode size={14} /></IBtn>
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
      <div style={{background:'var(--surface)',border:'1px solid var(--danger)',borderRadius:16,padding:14,maxWidth:360,width:'90%',textAlign:'center'}}>
        <div style={{fontSize:28,marginBottom:6}}><AlertTriangle size={28} style={{color:'var(--danger)'}} /></div>
        <div style={{fontSize:15,fontWeight:700,marginBottom:2}}>ยืนยันการลบ</div>
        <div style={{fontSize:13,color:'var(--text2)',marginBottom:1}}>
          <span style={{color:'var(--accent)',fontFamily:'var(--mono)'}}>{item.id}</span>
        </div>
        <div style={{fontSize:14,fontWeight:600,marginBottom:10}}>{item.name}</div>
        <div style={{display:'flex',gap:6,justifyContent:'center'}}>
          <button onClick={onClose} style={{background:'transparent',border:'1px solid var(--border2)',color:'var(--text2)',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontSize:13}}>ยกเลิก</button>
          <button onClick={onConfirm} style={{background:'var(--danger)',color:'white',border:'none',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontSize:13,fontWeight:700}}>ลบออก</button>
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
const navbarLeft={display:'flex',alignItems:'center',gap:10}
const navbarNav={display:'flex',alignItems:'center',gap:4}
const navbarRight={display:'flex',alignItems:'center',gap:12}
const logoBox={width:34,height:34,background:'var(--accent)',color:'#000',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--mono)',fontWeight:700,fontSize:12,letterSpacing:1}
const navItem=(a)=>({display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:8,fontSize:13,color:'#ffffff',background:a?'var(--accent-glow)':'transparent',border:a?'1px solid rgba(0,212,255,.2)':'1px solid transparent',fontWeight:a?600:400,transition:'all .15s',cursor:'pointer'})
const categoryBar={display:'flex',gap:6,padding:'12px 24px',background:'rgba(255,255,255,0.3)',borderBottom:'1px solid var(--border)',overflowX:'auto',width:'100%',backdropFilter:'blur(10px)'}
const catBtn=(a)=>({display:'flex',alignItems:'center',gap:6,background:a?'var(--accent-glow)':'transparent',border:a?'1px solid rgba(0,212,255,.2)':'1px solid transparent',color:a?'var(--accent)':'var(--text2)',borderRadius:7,padding:'7px 12px',cursor:'pointer',fontSize:12,whiteSpace:'nowrap',transition:'all .15s'})
const mainArea={flex:1,padding:24,minWidth:0,overflowX:'hidden',display:'flex',flexDirection:'column',alignItems:'center',background:'transparent'}
const cardImgWrap={width:'100%',height:280,overflow:'hidden',borderRadius:8,marginBottom:12,background:'var(--surface2)'}
const cardImg={width:'100%',height:'100%',objectFit:'cover'}
const cardNoImg={width:'100%',height:280,background:'var(--surface2)',borderRadius:8,marginBottom:12,display:'flex',alignItems:'center',justifyContent:'center'}
const cardBody={padding:12}
const cardName={fontSize:14,fontWeight:600,color:'var(--text)',marginBottom:4,lineHeight:1.4,height:40,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}
const cardMeta={fontSize:11,color:'var(--text3)',marginBottom:8}
const cardBottom={display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}
const cardQty={display:'flex',alignItems:'baseline',gap:2}
const cardLoc={fontSize:11,color:'var(--text3)'}
const cardActions={display:'flex',gap:8}
const cardActionBtn={flex:1,padding:'6px',fontSize:11,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:6,color:'var(--text)',cursor:'pointer',transition:'all .15s'}
const toolbar={display:'flex',alignItems:'center',gap:10,marginBottom:16,flexWrap:'wrap',maxWidth:1400,width:'100%',background:'transparent'}
const searchWrap={display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.95)',border:'1px solid var(--border2)',borderRadius:9,padding:'0 12px',flex:'1 1 220px',minWidth:200}
const searchIn={background:'none',border:'none',color:'var(--text)',fontSize:13,padding:'9px 0',outline:'none',flex:1,fontFamily:'var(--sans)'}
const clearX={background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:12}
const sortSel={background:'var(--surface)',border:'1px solid var(--border2)',color:'var(--text)',borderRadius:8,padding:'8px 10px',fontSize:12}
const viewToggle={display:'flex',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,overflow:'hidden'}
const viewBtn=(a)=>({background:a?'var(--accent-glow)':'transparent',border:'none',color:a?'var(--accent)':'var(--text3)',padding:'8px 11px',cursor:'pointer',fontSize:16})
const addBtn={background:'var(--accent)',color:'#000',border:'none',borderRadius:8,padding:'9px 15px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'var(--sans)',whiteSpace:'nowrap'}
const alertBar={background:'rgba(255,184,0,.1)',border:'1px solid rgba(255,184,0,.3)',color:'var(--warning)',borderRadius:9,padding:'9px 15px',fontSize:13,marginBottom:16,maxWidth:1400,width:'100%'}
const centerBox={display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:280,gap:12}
const spinner={width:34,height:34,border:'3px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin .8s linear infinite'}
const grid={display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,auto))',gap:16,justifyContent:'center',maxWidth:1400,width:'100%'}
const cardSt={background:'rgba(255,255,255,0.85)',border:'1px solid var(--border)',borderRadius:12,padding:0,transition:'all .2s ease',animation:'fadein .3s ease',cursor:'pointer',overflow:'hidden',contentVisibility:'auto',containIntrinsicSize:'0 430px'}
const catTag={fontSize:10,background:'var(--surface2)',color:'var(--text2)',padding:'2px 7px',borderRadius:9,border:'1px solid var(--border)'}
const idTag={fontFamily:'var(--mono)',fontSize:11,color:'var(--accent)',background:'var(--accent-glow)',padding:'3px 7px',borderRadius:6}
const serialTag={fontFamily:'var(--mono)',fontSize:10,color:'var(--text3)',background:'rgba(255,255,255,.03)',padding:'2px 6px',borderRadius:4,marginBottom:4,letterSpacing:.4}
const qtyBadge=(low)=>({display:'inline-flex',alignItems:'center',gap:2,background:low?'rgba(255,77,106,.12)':'rgba(0,229,160,.08)',color:low?'var(--danger)':'var(--success)',border:`1px solid ${low?'rgba(255,77,106,.25)':'rgba(0,229,160,.2)'}`,borderRadius:7,padding:'4px 9px'})
const thSt={textAlign:'left',fontSize:10,color:'var(--text3)',letterSpacing:1.5,textTransform:'uppercase',padding:'0 12px 10px',borderBottom:'1px solid var(--border)'}
const tdSt={padding:'9px 12px',background:'var(--surface)',borderBottom:'1px solid var(--border)',fontSize:13}
const toastSt=(t)=>({position:'fixed',bottom:22,right:22,zIndex:2000,background:t==='success'?'rgba(0,229,160,.15)':'rgba(255,77,106,.15)',border:`1px solid ${t==='success'?'var(--success)':'var(--danger)'}`,color:t==='success'?'var(--success)':'var(--danger)',borderRadius:11,padding:'11px 18px',fontSize:14,fontWeight:500,animation:'toast-in .3s ease',backdropFilter:'blur(8px)'})
