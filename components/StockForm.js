import { useState, useEffect } from 'react'

const CATS = ['Laptop','Desktop','Monitor','Peripheral','Network','Server','Storage','Phone','Tablet','Other']

export default function StockForm({ item, onSave, onClose }) {
  const isEdit = !!item
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

  return (
    <div style={OV} onClick={onClose}>
      <div style={MO} onClick={e => e.stopPropagation()}>
        <div style={HDR}>
          <div>
            <div style={SUB}>{isEdit ? 'แก้ไขข้อมูล' : 'เพิ่มอุปกรณ์ใหม่'}</div>
            <div style={TTL}>{isEdit ? item.id : 'New Item'}</div>
          </div>
          <button onClick={onClose} style={XB}>✕</button>
        </div>

        <div style={GR}>
          <div style={{gridColumn:'1/-1'}}>
            <F label="ชื่ออุปกรณ์ *" err={errors.name}>
              <input style={I(errors.name)} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="เช่น MacBook Pro 14 M3" />
            </F>
          </div>
          <F label="หมวดหมู่">
            <select style={I()} value={form.category} onChange={e=>set('category',e.target.value)}>
              {CATS.map(c=><option key={c}>{c}</option>)}
            </select>
          </F>
          <F label="ยี่ห้อ *" err={errors.brand}>
            <input style={I(errors.brand)} value={form.brand} onChange={e=>set('brand',e.target.value)} placeholder="Apple, Dell, Logitech..." />
          </F>
          <F label="รุ่น (Model)">
            <input style={I()} value={form.model} onChange={e=>set('model',e.target.value)} placeholder="เช่น MPHF3TH/A" />
          </F>
          <F label="Serial Number">
            <input style={I()} value={form.serial} onChange={e=>set('serial',e.target.value)} placeholder="เช่น C02ZW1ABMD6T" />
          </F>
          <F label="จำนวน Stock *" err={errors.quantity}>
            <input type="number" min="0" style={I(errors.quantity)} value={form.quantity} onChange={e=>set('quantity',e.target.value)} />
          </F>
          <F label="แจ้งเตือนเมื่อเหลือน้อยกว่า">
            <input type="number" min="0" style={I()} value={form.minQuantity} onChange={e=>set('minQuantity',e.target.value)} />
          </F>
          <F label="ที่เก็บ / ตำแหน่ง *" err={errors.location}>
            <select style={I(errors.location)} value={form.location} onChange={e=>set('location',e.target.value)}>
              <option value="">-- เลือกที่เก็บ/ตำแหน่ง --</option>
              {locations.map(loc => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
            </select>
          </F>
          <div style={{gridColumn:'1/-1'}}>
            <F label="รูปภาพ">
              {form.image ? (
                <div style={{position:'relative'}}>
                  <img src={form.image} alt="Preview" style={{width:'100%',maxHeight:200,objectFit:'cover',borderRadius:8,marginBottom:0}} />
                  <button onClick={handleRemoveImage} style={{position:'absolute',top:8,right:8,background:'rgba(0,0,0,0.7)',color:'white',border:'none',borderRadius:6,padding:'6px 10px',cursor:'pointer',fontSize:12}}>ลบรูป</button>
                </div>
              ) : (
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--text)',borderRadius:8,padding:'8px 11px',fontSize:13,fontFamily:'var(--sans)',outline:'none'}} />
              )}
            </F>
          </div>
          <div style={{gridColumn:'1/-1'}}>
            <F label="รายละเอียด">
              <textarea style={{...I(),resize:'vertical',minHeight:60}} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="รายละเอียดเพิ่มเติม..." />
            </F>
          </div>
        </div>

        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={CB}>ยกเลิก</button>
          <button onClick={handleSubmit} disabled={saving} style={SB}>
            {saving ? '⏳ กำลังบันทึก...' : (isEdit ? '💾 บันทึก' : '➕ เพิ่มอุปกรณ์')}
          </button>
        </div>
      </div>
    </div>
  )
}

function F({label,children,err}) {
  return (
    <div style={{marginBottom:1}}>
      <label style={{display:'block',fontSize:10,color:err?'var(--danger)':'var(--text3)',marginBottom:1,textTransform:'uppercase',letterSpacing:.8}}>{label}</label>
      {children}
      {err && <div style={{fontSize:10,color:'var(--danger)',marginTop:1}}>{err}</div>}
    </div>
  )
}

const OV={position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(4px)',padding:20,overflowY:'auto'}
const MO={background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:16,padding:14,width:'100%',maxWidth:560,boxShadow:'0 24px 60px rgba(0,0,0,0.6)'}
const HDR={display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}
const SUB={fontSize:10,color:'var(--text3)',letterSpacing:2,textTransform:'uppercase',fontFamily:'var(--mono)'}
const TTL={fontSize:17,fontWeight:700,color:'var(--accent)',marginTop:2,fontFamily:'var(--mono)'}
const XB={background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text2)',width:30,height:30,borderRadius:7,cursor:'pointer',fontSize:13}
const GR={display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}
const I=(err)=>({width:'100%',background:'var(--surface2)',border:`1px solid ${err?'var(--danger)':'var(--border2)'}`,color:'var(--text)',borderRadius:8,padding:'6px 10px',fontSize:13,fontFamily:'var(--sans)',outline:'none'})
const CB={background:'transparent',border:'1px solid var(--border2)',color:'var(--text2)',borderRadius:8,padding:'7px 16px',fontSize:13,cursor:'pointer'}
const SB={background:'var(--accent)',color:'#000',border:'none',borderRadius:8,padding:'7px 18px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'var(--sans)'}
