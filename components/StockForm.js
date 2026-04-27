import React, { useState, useEffect, useRef } from 'react'
import { Loader2, Save, Plus, Edit, X, Package, MapPin, AlertTriangle, Laptop, Monitor, Mouse, Network, Server, HardDrive, Smartphone, Tablet, Box, Minus, Upload, Trash2 } from 'lucide-react'

const CATS = ['Laptop','Desktop','Monitor','Peripheral','Network','Server','Storage','Phone','Tablet','Other']
const ICON = {Laptop,Desktop:Monitor,Monitor,Peripheral:Mouse,Network,Server,Storage:HardDrive,Phone:Smartphone,Tablet,Other:Box}

export default function StockForm({ item, onSave, onClose }) {
  const isEdit = !!item
  const fileInputRef = useRef(null)
  const [isViewMode, setIsViewMode] = useState(isEdit) // Start in view mode if editing existing item
  const [form, setForm] = useState({
    name:'', category:'Laptop', brand:'', model:'',
    serial:'', quantity:1, minQuantity:2, location:'', description:'', image:'',
    ...(item || {})
  })
  const [newImageFile, setNewImageFile] = useState(null) // Store new image file until save
  const [originalImage, setOriginalImage] = useState(item?.image || '') // Track original server image
  const [originalImageFilename, setOriginalImageFilename] = useState(item?.image?.split('/').pop() || '') // Track original filename
  const [locations, setLocations] = useState([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)

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
      let finalImageData = form.image

      // Upload new image if there is one
      if (newImageFile) {
        // Delete original image if it exists and is a server path (not blob URL)
        if (originalImage && originalImage && !originalImage.startsWith('blob:')) {
          try {
            await fetch('/api/delete-image', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imagePath: originalImage }),
            })
            console.log('Deleted original image:', originalImage)
          } catch (error) {
            console.warn('Failed to delete old image:', error)
          }
        }

        // Convert and upload new image
        const webpBlob = await convertToWebP(newImageFile)
        const reader = new FileReader()

        await new Promise((resolve, reject) => {
          reader.onloadend = async () => {
            try {
              const base64 = reader.result
              // Reuse existing filename if available, otherwise create new one
              let filename
              if (isEdit && originalImageFilename) {
                // Keep the same filename to replace the existing file
                const nameWithoutExt = originalImageFilename.split('.').slice(0, -1).join('.')
                filename = `${nameWithoutExt}.webp`
              } else if (isEdit) {
                // Create new filename using stock item ID (for items without existing image)
                const stockId = item?.id || 'new-item'
                const cleanName = newImageFile.name.replace(/[^a-zA-Z0-9.-]/g, '').split('.').slice(0, -1).join('.')
                filename = `${stockId}-${cleanName}.webp`
              } else {
                // Create new filename for new items (will be updated after save)
                filename = `temp-${Date.now()}-${newImageFile.name.replace(/[^a-zA-Z0-9.-]/g, '').split('.').slice(0, -1).join('.')}.webp`
              }

              const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64, filename }),
              })
              const data = await res.json()
              if (data.path) {
                finalImageData = data.path
                resolve()
              } else {
                reject(new Error('Upload failed'))
              }
            } catch (error) {
              reject(error)
            }
          }
          reader.readAsDataURL(webpBlob)
        })
      }

      // Submit form with final image data
      const url = isEdit ? `/api/stock/${item.id}` : '/api/stock'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          image: finalImageData,
          quantity: Number(form.quantity),
          minQuantity: Number(form.minQuantity)
        }),
      })
      if (!res.ok) throw new Error()
      onSave(await res.json())
    } catch (error) {
      console.error('Save error:', error)
      alert('เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  const convertToWebP = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Set canvas dimensions
        canvas.width = img.width
        canvas.height = img.height

        // Draw image to canvas
        ctx.drawImage(img, 0, 0)

        // Convert to WebP with 80% quality (good balance between quality and size)
        canvas.toBlob((blob) => {
          resolve(blob)
        }, 'image/webp', 0.8)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Store the file for later upload on save
      setNewImageFile(file)
      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(file)
      set('image', previewUrl)
    }
  }

  const handleRemoveImage = async () => {
    // Clean up blob URL if it exists
    if (form.image && form.image.startsWith('blob:')) {
      URL.revokeObjectURL(form.image)
    }

    // Delete original image from server if it exists and is not a blob URL
    if (originalImage && originalImage && !originalImage.startsWith('blob:')) {
      try {
        await fetch('/api/delete-image', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagePath: originalImage }),
        })
        console.log('Deleted original image:', originalImage)
      } catch (error) {
        console.warn('Failed to delete image:', error)
        // Continue with form update even if deletion fails
      }
    }

    // Clear the new image file, form image, and original image tracking
    setNewImageFile(null)
    setOriginalImage('')
    setOriginalImageFilename('')
    set('image', '')
  }

  const handleEdit = () => {
    setIsViewMode(false)
  }

  const hasUnsavedChanges = () => {
    if (isViewMode) return false

    // Check if any form field has been modified from initial values
    const initialValues = item || { name: '', category: 'Laptop', brand: '', model: '', serial: '', quantity: 1, minQuantity: 2, location: '', description: '', image: '' }

    return (
      form.name !== initialValues.name ||
      form.category !== initialValues.category ||
      form.brand !== initialValues.brand ||
      form.model !== initialValues.model ||
      form.serial !== initialValues.serial ||
      form.quantity !== initialValues.quantity ||
      form.minQuantity !== initialValues.minQuantity ||
      form.location !== initialValues.location ||
      form.description !== initialValues.description ||
      form.image !== initialValues.image ||
      newImageFile !== null
    )
  }

  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      setShowCancelModal(true)
    } else {
      if (isEdit) {
        setIsViewMode(true)
      } else {
        onClose()
      }
    }
  }

  const handleClose = () => {
    if (!isViewMode && hasUnsavedChanges()) {
      setShowCloseModal(true)
    } else {
      onClose()
    }
  }

  const confirmCancel = () => {
    setShowCancelModal(false)
    if (isEdit) {
      setIsViewMode(true)
    } else {
      onClose()
    }
  }

  const confirmClose = () => {
    setShowCloseModal(false)
    onClose()
  }

  const low = form.quantity <= form.minQuantity

  return (
    <div style={OV} onClick={handleClose}>
      <div style={MO} onClick={e => e.stopPropagation()}>
        <div style={HDR}>
          <div>
            <div style={SUB}>{isEdit ? 'รายละเอียดอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}</div>
            <div style={TTL}>{isEdit ? item.id : 'New Item'}</div>
          </div>
          <button onClick={handleClose} style={XB}><X size={16} /></button>
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{display:'none'}}
            />
            {form.image ? (
              <>
                <img src={form.image} alt={form.name} style={IMG} />
                {!isViewMode && (
                  <button
                    onClick={handleRemoveImage}
                    style={IMG_BTN_REMOVE}
                    className="btn-secondary"
                  >
                    <X size={14} />
                  </button>
                )}
              </>
            ) : (
              <div
                style={NO_IMG}
                onClick={!isViewMode ? () => fileInputRef.current?.click() : undefined}
                className={!isViewMode ? 'cursor-pointer' : ''}
              >
                <Package size={64} style={{color:'var(--text3)'}} />
                {!isViewMode && <div style={{fontSize:11,color:'var(--text2)',marginTop:8}}>คลิกเพื่ออัปโหลดรูป</div>}
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
                {low && (
                  <div style={{display:'flex',alignItems:'center',gap:4,marginLeft:12,padding:'4px 8px',background:'#fef3c7',border:'1px solid #fcd34d',borderRadius:6,fontSize:11,color:'#92400e'}}>
                    <AlertTriangle size={12} />
                    <span>ใกล้หมด</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{marginBottom:12}}>
                <div style={{display:'flex',gap:12}}>
                  <div style={{flex:1}}>
                    <label style={{display:'block',fontSize:10,color:errors.quantity?'var(--danger)':'var(--text3)',marginBottom:4,textTransform:'uppercase',letterSpacing:.8}}>จำนวน Stock *</label>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <button onClick={() => set('quantity', Math.max(0, Number(form.quantity) - 1))} style={QTY_BTN} className="qty-btn"><Minus size={14} /></button>
                      <input type="number" min="0" style={{...I(),textAlign:'center',flex:1}} value={form.quantity} onChange={e=>set('quantity',e.target.value)} />
                      <button onClick={() => set('quantity', Number(form.quantity) + 1)} style={QTY_BTN} className="qty-btn"><Plus size={14} /></button>
                    </div>
                    {errors.quantity && <div style={{fontSize:10,color:'var(--danger)',marginTop:2}}>{errors.quantity}</div>}
                  </div>

                  {/* Min Quantity */}
                  <div style={{flex:1}}>
                    <label style={{display:'block',fontSize:10,color:'var(--text3)',marginBottom:4,textTransform:'uppercase',letterSpacing:.8}}>แจ้งเตือนเมื่อเหลือน้อยกว่า</label>
                    {isViewMode ? (
                      <span style={DETAIL_VAL}>{form.minQuantity} ชิ้น</span>
                    ) : (
                      <input type="number" min="0" style={INLINE_INPUT} value={form.minQuantity} onChange={e=>set('minQuantity',e.target.value)} />
                    )}
                  </div>
                </div>
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
              <button onClick={handleCancel} style={CB} className="btn-secondary">ยกเลิก</button>
              <button onClick={handleSubmit} disabled={saving} style={SB} className="btn-primary">
                {saving ? <><Loader2 size={16} className="spin" /> กำลังเพิ่ม...</> : <><Save size={16} /> เพิ่ม</>}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div style={MODAL_OVERLAY} onClick={() => setShowCancelModal(false)}>
          <div style={MODAL_CONTENT} onClick={e => e.stopPropagation()}>
            <div style={MODAL_HEADER}>
              <h3 style={MODAL_TITLE}>ยืนยันการยกเลิก</h3>
            </div>
            <div style={MODAL_BODY}>
              <p style={MODAL_TEXT}>คุณต้องการยกเลิกการแก้ไขหรือไม่? การเปลี่ยนแปลงทั้งหมดจะไม่ถูกบันทึก</p>
            </div>
            <div style={MODAL_ACTIONS}>
              <button onClick={() => setShowCancelModal(false)} style={MODAL_BTN_CANCEL}>กลับ</button>
              <button onClick={confirmCancel} style={MODAL_BTN_CONFIRM}>ยืนยัน</button>
            </div>
          </div>
        </div>
      )}

      {/* Close Confirmation Modal */}
      {showCloseModal && (
        <div style={MODAL_OVERLAY} onClick={() => setShowCloseModal(false)}>
          <div style={MODAL_CONTENT} onClick={e => e.stopPropagation()}>
            <div style={MODAL_HEADER}>
              <h3 style={MODAL_TITLE}>ยืนยันการปิด</h3>
            </div>
            <div style={MODAL_BODY}>
              <p style={MODAL_TEXT}>คุณต้องการปิดหน้าต่างนี้หรือไม่? การเปลี่ยนแปลงทั้งหมดจะไม่ถูกบันทึก</p>
            </div>
            <div style={MODAL_ACTIONS}>
              <button onClick={() => setShowCloseModal(false)} style={MODAL_BTN_CANCEL}>กลับ</button>
              <button onClick={confirmClose} style={MODAL_BTN_CONFIRM}>ยืนยัน</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function F({label,children,err}) {
  return (
    <div style={{marginBottom:12}}>
      <label style={{display:'block',fontSize:11,color:err?'#ef4444':'#6b7280',marginBottom:4,textTransform:'uppercase',letterSpacing:0.5,fontWeight:500}}>{label}</label>
      {children}
      {err && <div style={{fontSize:11,color:'#ef4444',marginTop:2,fontWeight:500}}>{err}</div>}
    </div>
  )
}

const OV={position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(4px)',padding:20,overflowY:'auto'}
const MO={background:'#ffffff',border:'1px solid #e5e7eb',borderRadius:12,padding:10,width:'100%',maxWidth:1000,boxShadow:'0 20px 50px rgba(0,0,0,0.15)'}
const HDR={display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6,paddingBottom:6,borderBottom:'1px solid #f3f4f6'}
const SUB={fontSize:9,color:'#6b7280',letterSpacing:1,textTransform:'uppercase',fontFamily:'var(--mono)',fontWeight:500}
const TTL={fontSize:15,fontWeight:700,color:'#1f2937',marginTop:2,fontFamily:'var(--mono)'}
const XB={background:'#f9fafb',border:'1px solid #e5e7eb',color:'#6b7280',width:26,height:26,borderRadius:6,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}
const GR={display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}
const I=(err)=>({width:'100%',background:'#ffffff',border:`1px solid ${err?'#ef4444':'#d1d5db'}`,color:'#1f2937',borderRadius:6,padding:'6px 8px',fontSize:12,fontFamily:'var(--sans)',outline:'none',transition:'all .2s',boxShadow:err?'0 0 0 3px rgba(239,68,68,0.1)':'none'})
const CB={background:'#f9fafb',border:'1px solid #d1d5db',color:'#6b7280',borderRadius:6,padding:'6px 14px',fontSize:12,cursor:'pointer',transition:'all .2s',fontWeight:500}
const SB={background:'#3b82f6',color:'#ffffff',border:'none',borderRadius:6,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--sans)',transition:'all .2s',boxShadow:'0 2px 4px rgba(59,130,246,0.2)'}
const CONTENT={display:'flex',flexDirection:'row',gap:0}
const IMG_WRAP={width:'350px',height:'auto',minHeight:120,background:'#f9fafb',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0,padding:10,borderRadius:8,border:'1px solid #e5e7eb',position:'relative'}
const IMG={width:'100%',height:'100%',objectFit:'contain',borderRadius:6}
const NO_IMG={display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',width:'100%',height:'100%',color:'#9ca3af',gap:4,cursor:'pointer',transition:'all .2s'}
const INFO={padding:10,flex:1,display:'flex',flexDirection:'column'}
const CAT_BADGE={display:'inline-flex',alignItems:'center',padding:'3px 8px',background:'#3b82f6',color:'#ffffff',borderRadius:12,fontSize:10,fontWeight:600,marginBottom:6,width:'fit-content'}
const NAME={fontSize:16,fontWeight:700,color:'#1f2937',lineHeight:1.3,marginBottom:6}
const PRICE_WRAP={display:'flex',alignItems:'baseline',gap:4,marginBottom:6}
const PRICE_LABEL={fontSize:11,color:'#6b7280',fontWeight:500}
const PRICE_VAL={display:'flex',alignItems:'baseline',gap:2}
const PRICE_NUM={fontSize:20,fontWeight:700,color:'#1f2937',fontFamily:'var(--mono)'}
const PRICE_UNIT={fontSize:12,color:'#6b7280',fontWeight:500}
const ALERT={display:'flex',alignItems:'center',padding:6,background:'#fef3c7',border:'1px solid #fcd34d',borderRadius:6,fontSize:11,color:'#92400e',marginBottom:6}
const DETAILS={display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:6}
const DETAIL_ITEM={display:'flex',flexDirection:'column',gap:1}
const DETAIL_LBL={fontSize:10,color:'#6b7280',fontWeight:500}
const DETAIL_VAL={fontSize:12,color:'#1f2937',fontWeight:600}
const DESC={marginBottom:8}
const DESC_LBL={fontSize:10,color:'#6b7280',fontWeight:500,marginBottom:2}
const DESC_VAL={fontSize:12,color:'#4b5563',lineHeight:1.4}
const ACTIONS={display:'flex',gap:6,padding:10,justifyContent:'flex-end',marginTop:-20}
const BTN_CLOSE={padding:'8px 16px',background:'#ffffff',border:'1px solid #d1d5db',borderRadius:6,fontSize:12,fontWeight:500,color:'#6b7280',cursor:'pointer',transition:'all .2s'}
const BTN_EDIT={flex:1,padding:'8px 16px',background:'#3b82f6',border:'none',borderRadius:6,fontSize:12,fontWeight:600,color:'#ffffff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}
const LOCATION_LINK={fontSize:12,color:'#3b82f6',fontWeight:500,display:'inline-flex',alignItems:'center'}
const INLINE_INPUT={width:'100%',background:'#ffffff',border:'1px solid #d1d5db',color:'#1f2937',borderRadius:6,padding:'5px 7px',fontSize:12,fontFamily:'var(--sans)',outline:'none',transition:'all .2s'}
const QTY_BTN={width:24,height:24,background:'#3b82f6',border:'none',borderRadius:6,color:'#ffffff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}
const IMG_BTN={flex:1,padding:'6px 10px',background:'#3b82f6',color:'#ffffff',border:'none',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s',boxShadow:'0 2px 4px rgba(59,130,246,0.2)'}
const IMG_BTN_REMOVE={position:'absolute',top:10,right:10,width:24,height:24,background:'rgba(239,68,68,0.9)',backdropFilter:'blur(4px)',color:'#ffffff',border:'none',borderRadius:6,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s',boxShadow:'0 2px 4px rgba(239,68,68,0.3)'}
const MODAL_OVERLAY={position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,backdropFilter:'blur(4px)',padding:20}
const MODAL_CONTENT={background:'#ffffff',border:'1px solid #e5e7eb',borderRadius:12,padding:20,width:'100%',maxWidth:400,boxShadow:'0 20px 50px rgba(0,0,0,0.15)'}
const MODAL_HEADER={marginBottom:16}
const MODAL_TITLE={fontSize:16,fontWeight:700,color:'#1f2937',margin:0}
const MODAL_BODY={marginBottom:20}
const MODAL_TEXT={fontSize:14,color:'#4b5563',lineHeight:1.5,margin:0}
const MODAL_ACTIONS={display:'flex',gap:8,justifyContent:'flex-end'}
const MODAL_BTN_CANCEL={padding:'8px 16px',background:'#ffffff',border:'1px solid #d1d5db',borderRadius:6,fontSize:12,fontWeight:500,color:'#6b7280',cursor:'pointer',transition:'all .2s'}
const MODAL_BTN_CONFIRM={padding:'8px 16px',background:'#ef4444',border:'none',borderRadius:6,fontSize:12,fontWeight:600,color:'#ffffff',cursor:'pointer',transition:'all .2s',boxShadow:'0 2px 4px rgba(239,68,68,0.2)'}
