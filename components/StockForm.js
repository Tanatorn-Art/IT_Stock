import { useState } from 'react'

const CATS = ['Laptop','Desktop','Monitor','Peripheral','Network','Server','Storage','Phone','Tablet','Other']

export default function StockForm({ item, onSave, onClose }) {
  const isEdit = !!item
  const [form, setForm] = useState({
    name:'', category:'Laptop', brand:'', model:'',
    serial:'', quantity:1, minQuantity:2, location:'', description:'',
    ...(item || {})
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'กรุณากรอกชื่อ'
    if (!form.brand.trim()) e.brand = 'กรุณากรอกยี่ห้อ'
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
          <F label="ที่เก็บ / ตำแหน่ง">
            <input style={I()} value={form.location} onChange={e=>set('location',e.target.value)} placeholder="เช่น ชั้น A-1, ตู้ B" />
          </F>
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
    <div style={{marginBottom:4}}>
      <label style={{display:'block',fontSize:10,color:err?'var(--danger)':'var(--text3)',marginBottom:4,textTransform:'uppercase',letterSpacing:.8}}>{label}</label>
      {children}
      {err && <div style={{fontSize:10,color:'var(--danger)',marginTop:2}}>{err}</div>}
    </div>
  )
}

const OV={position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(4px)',padding:20,overflowY:'auto'}
const MO={background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:16,padding:26,width:'100%',maxWidth:560,boxShadow:'0 24px 60px rgba(0,0,0,0.6)'}
const HDR={display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22}
const SUB={fontSize:10,color:'var(--text3)',letterSpacing:2,textTransform:'uppercase',fontFamily:'var(--mono)'}
const TTL={fontSize:17,fontWeight:700,color:'var(--accent)',marginTop:2,fontFamily:'var(--mono)'}
const XB={background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text2)',width:30,height:30,borderRadius:7,cursor:'pointer',fontSize:13}
const GR={display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:22}
const I=(err)=>({width:'100%',background:'var(--surface2)',border:`1px solid ${err?'var(--danger)':'var(--border2)'}`,color:'var(--text)',borderRadius:8,padding:'8px 11px',fontSize:13,fontFamily:'var(--sans)',outline:'none'})
const CB={background:'transparent',border:'1px solid var(--border2)',color:'var(--text2)',borderRadius:8,padding:'9px 18px',fontSize:13,cursor:'pointer'}
const SB={background:'var(--accent)',color:'#000',border:'none',borderRadius:8,padding:'9px 22px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'var(--sans)'}
