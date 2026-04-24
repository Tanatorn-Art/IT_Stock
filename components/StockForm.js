import React, { useState, useEffect } from 'react'
import { Loader2, Save, Plus, Edit, X, Package, MapPin, AlertTriangle, Laptop, Monitor, Mouse, Network, Server, HardDrive, Smartphone, Tablet, Box, Minus } from 'lucide-react'

const CATS = ['Laptop','Desktop','Monitor','Peripheral','Network','Server','Storage','Phone','Tablet','Other']
const ICON = {Laptop,Desktop:Monitor,Monitor,Peripheral:Mouse,Network,Server,Storage:HardDrive,Phone:Smartphone,Tablet,Other:Box}

export default function StockForm({ item, onSave, onClose }) {
  const isEdit = !!item
  const [isViewMode, setIsViewMode] = useState(isEdit) // Start in view mode if editing existing item
  const [form, setForm] = useState({
    name:'', category:'Laptop', brand:'', model:'',
    serial:'', quantity:1, minQuantity:2, location:'', description:'', image:'',
    ...(item || {})
  })
  const [locations, setLocations] = useState([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    const res = await fetch('/api/locations')
    const data = await res.json()
    setLocations(data)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'กรุณากรอกชื่อ'
    if (!form.brand.trim()) e.brand = 'กรุณากรอกยี่ห้อ'
    if (!form.location.trim()) e.location = 'กรุณาเลือกที่เก็บ'
    if (Number(form.quantity) < 0) e.quantity = 'ต้องไม่ติดลบ'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const url = isEdit ? `/api/stock/${item.id}` : '/api/stock'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity), minQuantity: Number(form.minQuantity) }),
      })
      if (!res.ok) throw new Error()
      onSave(await res.json())
    } catch { alert('เกิดข้อผิดพลาด') } finally { setSaving(false) }
  }

  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result
        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`

        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64, filename }),
          })
          const data = await res.json()
          if (data.path) {
            set('image', data.path)
          }
        } catch (error) {
          console.error('Upload failed:', error)
          alert('อัปโหลดรูปไม่สำเร็จ')
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    set('image', '')
  }

  const handleEdit = () => {
    setIsViewMode(false)
  }

  const low = form.quantity <= form.minQuantity

  return (
    <div style={OV} onClick={onClose}>
      <div style={MO} onClick={e => e.stopPropagation()}>
        <div style={HDR}>
          <div>
            <div style={SUB}>{isEdit ? 'รายละเอียดอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}</div>
            <div style={TTL}>{isEdit ? item.id : 'New Item'}</div>
          </div>
          <button onClick={onClose} style={XB}><X size={16} /></button>
        </div>
        <style>{`
          @keyframes spin{to{transform:rotate(360deg)}}
          .spin{animation:spin 1s linear infinite}
          button:hover{transform:translateY(-1px)}
          .btn-primary:hover{background:var(--accent-hover);box-shadow:0 4px 12px rgba(99, 102, 241, 0.3)}
          .btn-secondary:hover{background:var(--surface3);border-color:var(--border-hover)}
          .qty-btn:hover{background:var(--accent-hover);transform:scale(1.05);box-shadow:0 2px 8px rgba(99, 102, 241, 0.4)}
        `}</style>

        <div style={CONTENT}>
          {/* Product Image - Left */}
          <div style={IMG_WRAP}>
            {form.image ? (
              <img src={form.image} alt={form.name} style={IMG} />
            ) : (
              <div style={NO_IMG}>
                <Package size={64} style={{color:'var(--text3)'}} />
              </div>
            )}
          </div>

          {/* Product Info - Right */}
          <div style={INFO}>
            {/* Category Badge */}
            {isViewMode ? (
              <div style={CAT_BADGE}>
                {React.createElement(ICON[form.category] || Box, {size: 14, style:{marginRight:6}})}
                {form.category}
              </div>
            ) : (
              <div style={{marginBottom:12}}>
                <label style={{display:'block',fontSize:10,color:'var(--text3)',marginBottom:4,textTransform:'uppercase',letterSpacing:.8}}>หมวดหมู่</label>
                <select style={I()} value={form.category} onChange={e=>set('category',e.target.value)}>
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            )}

            {/* Product Name */}
            {isViewMode ? (
              <div style={NAME}>{form.name}</div>
            ) : (
              <div style={{marginBottom:16}}>
                <label style={{display:'block',fontSize:10,color:errors.name?'var(--danger)':'var(--text3)',marginBottom:4,textTransform:'uppercase',letterSpacing:.8}}>ชื่ออุปกรณ์ *</label>
                <input style={I(errors.name)} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="เช่น MacBook Pro 14 M3" />
                {errors.name && <div style={{fontSize:10,color:'var(--danger)',marginTop:2}}>{errors.name}</div>}
              </div>
            )}

            {/* Quantity Display or Input with +/- buttons */}
            {isViewMode ? (
              <div style={PRICE_WRAP}>
                <span style={PRICE_LABEL}>จำนวน</span>
                <div style={PRICE_VAL}>
                  <span style={PRICE_NUM}>{form.quantity}</span>
                  <span style={PRICE_UNIT}>ชิ้น</span>
                </div>
              </div>
            ) : (
              <div style={{marginBottom:12}}>
                <label style={{display:'block',fontSize:10,color:errors.quantity?'var(--danger)':'var(--text3)',marginBottom:4,textTransform:'uppercase',letterSpacing:.8}}>จำนวน Stock *</label>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <button onClick={() => set('quantity', Math.max(0, Number(form.quantity) - 1))} style={QTY_BTN} className="qty-btn"><Minus size={14} /></button>
                  <input type="number" min="0" style={{...I(),textAlign:'center',flex:1}} value={form.quantity} onChange={e=>set('quantity',e.target.value)} />
                  <button onClick={() => set('quantity', Number(form.quantity) + 1)} style={QTY_BTN} className="qty-btn"><Plus size={14} /></button>
                </div>
                {errors.quantity && <div style={{fontSize:10,color:'var(--danger)',marginTop:2}}>{errors.quantity}</div>}
              </div>
            )}

            {/* Low Stock Alert */}
            {low && (
              <div style={ALERT}>
                <AlertTriangle size={14} style={{marginRight:6}} />
                Stock ใกล้หมด (เหลือน้อยกว่า {form.minQuantity} ชิ้น)
              </div>
            )}

            {/* Details Grid */}
            <div style={DETAILS}>
              <div style={DETAIL_ITEM}>
                <span style={DETAIL_LBL}>ยี่ห้อ</span>
                {isViewMode ? (
                  <span style={DETAIL_VAL}>{form.brand}</span>
                ) : (
                  <input style={INLINE_INPUT} value={form.brand} onChange={e=>set('brand',e.target.value)} placeholder="ยี่ห้อ" />
                )}
              </div>
              <div style={DETAIL_ITEM}>
                <span style={DETAIL_LBL}>รุ่น</span>
                {isViewMode ? (
                  <span style={DETAIL_VAL}>{form.model||'-'}</span>
                ) : (
                  <input style={INLINE_INPUT} value={form.model} onChange={e=>set('model',e.target.value)} placeholder="รุ่น" />
                )}
              </div>
              <div style={DETAIL_ITEM}>
                <span style={DETAIL_LBL}>Serial</span>
                {isViewMode ? (
                  <span style={DETAIL_VAL}>{form.serial||'-'}</span>
                ) : (
                  <input style={INLINE_INPUT} value={form.serial} onChange={e=>set('serial',e.target.value)} placeholder="Serial" />
                )}
              </div>
              <div style={DETAIL_ITEM}>
                <span style={DETAIL_LBL}>ตำแหน่ง</span>
                {isViewMode ? (
                  form.location ? (
                    <span style={LOCATION_LINK}>
                      <MapPin size={12} style={{marginRight:4}} />
                      {form.location}
                    </span>
                  ) : (
                    <span style={DETAIL_VAL}>-</span>
                  )
                ) : (
                  <select style={INLINE_INPUT} value={form.location} onChange={e=>set('location',e.target.value)}>
                    <option value="">-- เลือกที่เก็บ/ตำแหน่ง --</option>
                    {locations.map(loc => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
                  </select>
                )}
              </div>
            </div>

            {/* Min Quantity */}
            <div style={{marginBottom:16}}>
              <span style={DETAIL_LBL}>แจ้งเตือนเมื่อเหลือน้อยกว่า</span>
              {isViewMode ? (
                <span style={DETAIL_VAL}>{form.minQuantity} ชิ้น</span>
              ) : (
                <input type="number" min="0" style={INLINE_INPUT} value={form.minQuantity} onChange={e=>set('minQuantity',e.target.value)} />
              )}
            </div>

            {/* Description */}
            <div style={DESC}>
              <span style={DESC_LBL}>รายละเอียด</span>
              {isViewMode ? (
                <div style={DESC_VAL}>{form.description||'-'}</div>
              ) : (
                <textarea style={{...I(),resize:'vertical',minHeight:80,marginTop:4}} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="รายละเอียดเพิ่มเติม..." />
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={ACTIONS}>
          {isViewMode ? (
            <>
              <button onClick={onClose} style={BTN_CLOSE} className="btn-secondary">ปิด</button>
              {isEdit && <button onClick={handleEdit} style={BTN_EDIT} className="btn-primary"><Edit size={14} style={{marginRight:6}} /> แก้ไข</button>}
            </>
          ) : (
            <>
              <button onClick={() => setIsViewMode(true)} style={CB} className="btn-secondary">ยกเลิก</button>
              <button onClick={handleSubmit} disabled={saving} style={SB} className="btn-primary">
                {saving ? <><Loader2 size={16} className="spin" /> กำลังบันทึก...</> : <><Save size={16} /> บันทึก</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function F({label,children,err}) {
  return (
    <div style={{marginBottom:10}}>
      <label style={{display:'block',fontSize:10,color:err?'var(--danger)':'var(--text3)',marginBottom:1,textTransform:'uppercase',letterSpacing:.8}}>{label}</label>
      {children}
      {err && <div style={{fontSize:10,color:'var(--danger)',marginTop:1}}>{err}</div>}
    </div>
  )
}

const OV={position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(4px)',padding:20,overflowY:'auto'}
const MO={background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:16,padding:14,width:'100%',maxWidth:800,boxShadow:'0 24px 60px rgba(0,0,0,0.6)'}
const HDR={display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}
const SUB={fontSize:10,color:'var(--text3)',letterSpacing:2,textTransform:'uppercase',fontFamily:'var(--mono)'}
const TTL={fontSize:17,fontWeight:700,color:'var(--accent)',marginTop:2,fontFamily:'var(--mono)'}
const XB={background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text2)',width:30,height:30,borderRadius:7,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}
const GR={display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}
const I=(err)=>({width:'100%',background:'var(--surface2)',border:`1px solid ${err?'var(--danger)':'var(--border2)'}`,color:'var(--text)',borderRadius:8,padding:'6px 10px',fontSize:13,fontFamily:'var(--sans)',outline:'none'})
const CB={background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text2)',borderRadius:8,padding:'7px 16px',fontSize:13,cursor:'pointer',transition:'all .15s'}
const SB={background:'var(--accent)',color:'var(--accent-text)',border:'none',borderRadius:8,padding:'7px 18px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'var(--sans)',transition:'all .15s',boxShadow:'0 2px 4px rgba(0,0,0,0.1)'}
const CONTENT={display:'flex',flexDirection:'row',gap:0}
const IMG_WRAP={width:'400px',height:'auto',minHeight:400,background:'var(--surface)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0,padding:20}
const IMG={width:'100%',height:'100%',objectFit:'contain',borderRadius:6}
const NO_IMG={display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%',color:'var(--text3)'}
const INFO={padding:24,flex:1,display:'flex',flexDirection:'column'}
const CAT_BADGE={display:'inline-flex',alignItems:'center',padding:'6px 12px',background:'var(--accent)',color:'#ffffff',borderRadius:20,fontSize:12,fontWeight:600,marginBottom:12,width:'fit-content'}
const NAME={fontSize:22,fontWeight:700,color:'var(--text)',lineHeight:1.4,marginBottom:16}
const PRICE_WRAP={display:'flex',alignItems:'baseline',gap:8,marginBottom:12}
const PRICE_LABEL={fontSize:13,color:'var(--text3)'}
const PRICE_VAL={display:'flex',alignItems:'baseline',gap:4}
const PRICE_NUM={fontSize:28,fontWeight:700,color:'var(--accent)',fontFamily:'var(--mono)'}
const PRICE_UNIT={fontSize:14,color:'var(--text3)'}
const ALERT={display:'flex',alignItems:'center',padding:10,background:'#fef3c7',border:'1px solid #fcd34d',borderRadius:8,fontSize:13,color:'#92400e',marginBottom:16}
const DETAILS={display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}
const DETAIL_ITEM={display:'flex',flexDirection:'column',gap:4}
const DETAIL_LBL={fontSize:12,color:'var(--text3)',fontWeight:500}
const DETAIL_VAL={fontSize:14,color:'var(--text)',fontWeight:600}
const DESC={marginBottom:20}
const DESC_LBL={fontSize:12,color:'var(--text3)',fontWeight:500,marginBottom:6}
const DESC_VAL={fontSize:14,color:'var(--text2)',lineHeight:1.6}
const ACTIONS={display:'flex',gap:12,padding:20,borderTop:'1px solid var(--border)',background:'var(--surface2)'}
const BTN_CLOSE={flex:1,padding:'12px 24px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,fontSize:14,fontWeight:600,color:'var(--text2)',cursor:'pointer',transition:'all .15s',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}
const BTN_EDIT={flex:1,padding:'12px 24px',background:'var(--accent)',border:'none',borderRadius:8,fontSize:14,fontWeight:700,color:'var(--accent-text)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s',boxShadow:'0 2px 4px rgba(99, 102, 241, 0.2)'}
const LOCATION_LINK={fontSize:14,color:'#2563eb',fontWeight:600,display:'inline-flex',alignItems:'center'}
const INLINE_INPUT={width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',borderRadius:6,padding:'6px 10px',fontSize:13,fontFamily:'var(--sans)',outline:'none',transition:'all .15s'}
const QTY_BTN={width:32,height:32,background:'var(--accent)',border:'none',borderRadius:6,color:'var(--accent-text)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s',boxShadow:'0 1px 3px rgba(99, 102, 241, 0.2)'}
