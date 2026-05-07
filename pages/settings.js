import React, { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { Package, MapPin, Scan, Search, Plus, AlertTriangle, Edit, Trash, X, CheckCircle, Settings, ChevronDown, Laptop, Monitor, Mouse, Network, Server, HardDrive, Smartphone, Tablet, Box, FileText, Save, Loader2, Download, Upload, Database, Clock, FileArchive, Trash2, RefreshCw } from 'lucide-react'
import SettingsDropdown from '../components/SettingsDropdown'

const StockForm = dynamic(() => import('../components/StockForm'), { ssr: false })

const CATS = ['all','Laptop','Desktop','Monitor','Peripheral','Network','Server','Storage','Phone','Tablet','Other']
const ICON = {Laptop:Laptop,Desktop:Monitor,Monitor:Monitor,Peripheral:Mouse,Network:Network,Server:Server,Storage:HardDrive,Phone:Smartphone,Tablet:Tablet,Other:Box,all:Box}

export default function SettingsPage() {
  const router = useRouter()
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('all')
  const [formItem, setFormItem] = useState(undefined)
  const [delItem,  setDelItem]  = useState(null)
  const [toast,    setToast]    = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false)

  // Backup related states
  const [backups, setBackups] = useState([])
  const [backupLoading, setBackupLoading] = useState(false)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [restoreFile, setRestoreFile] = useState(null)

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
      p.set('includeDisabled', 'true') // Include disabled items
      const res = await fetch(`/api/stock?${p}`)
      setItems(await res.json())
    } finally { setLoading(false) }
  }, [search, category])

  useEffect(() => {
    fetchItems()
    fetchBackups()
  }, [fetchItems])

  // Sync selected item with URL
  useEffect(() => {
    if (router.isReady && items.length > 0) {
      const { id } = router.query
      if (id) {
        const item = items.find(i => i.id === id)
        if (item) {
          setSelectedItem(item)
        }
      } else {
        setSelectedItem(null)
      }
    }
  }, [router.isReady, router.query, items])

  const handleSave = (saved) => {
    setFormItem(undefined)
    fetchItems()
    showToast(formItem===null ? `เพิ่ม ${saved.id} สำเร็จ` : `อัปเดต ${saved.id} สำเร็จ`)
  }

  const handleInlineEdit = (saved) => {
    // Update local items immediately to show the new image
    setItems(prevItems =>
      prevItems.map(item => item.id === saved.id ? saved : item)
    )
    // Also update selected item if it's the one being edited
    if (selectedItem && selectedItem.id === saved.id) {
      setSelectedItem(saved)
    }
    // Then fetch items to ensure server sync
    fetchItems()
    showToast(`อัปเดต ${saved.id} สำเร็จ`)
  }

  const handleDelete = async (item) => {
    const isDisabled = item.disabledAt !== null && item.disabledAt !== undefined
    await fetch(`/api/stock/${item.id}`, { method:'DELETE' })
    setDelItem(null)
    setSelectedItem(null)
    router.push({ pathname: '/settings' }, undefined, { shallow: true })
    fetchItems()
    showToast(isDisabled ? `คืนค่า ${item.id} เรียบร้อย` : `ปิดใช้งาน ${item.id} เรียบร้อย`, isDisabled ? 'success' : 'danger')
  }

  const handleRowClick = (item) => {
    setSelectedItem(item)
    router.push({ pathname: '/settings', query: { id: item.id } }, undefined, { shallow: true })
    // Auto-scroll to top to show the detail panel
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Backup functions
  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/backup')
      const data = await res.json()
      setBackups(data.backups || [])
    } catch (error) {
      console.error('Failed to fetch backups:', error)
      showToast('Failed to fetch backups', 'error')
    }
  }

  const createBackup = async (reason = 'manual') => {
    setBackupLoading(true)
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', reason })
      })
      const data = await res.json()
      if (data.success) {
        showToast('Backup created successfully')
        await fetchBackups()
      } else {
        showToast(data.error || 'Failed to create backup', 'error')
      }
    } catch (error) {
      console.error('Failed to create backup:', error)
      showToast('Failed to create backup', 'error')
    } finally {
      setBackupLoading(false)
    }
  }

  const restoreFromBackup = async (fileName) => {
    if (!confirm('Are you sure you want to restore from this backup? This will replace the current database.')) {
      return
    }

    setBackupLoading(true)
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        body: JSON.stringify({ fileName })
      })
      const data = await res.json()
      if (data.success) {
        showToast('Database restored successfully')
        await fetchItems() // Refresh stock data
        await fetchBackups()
      } else {
        showToast(data.error || 'Failed to restore database', 'error')
      }
    } catch (error) {
      console.error('Failed to restore database:', error)
      showToast('Failed to restore database', 'error')
    } finally {
      setBackupLoading(false)
    }
  }

  const deleteBackup = async (fileName) => {
    if (!confirm('Are you sure you want to delete this backup?')) {
      return
    }

    try {
      const res = await fetch(`/api/backup?fileName=${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        showToast('Backup deleted successfully')
        await fetchBackups()
      } else {
        showToast(data.error || 'Failed to delete backup', 'error')
      }
    } catch (error) {
      console.error('Failed to delete backup:', error)
      showToast('Failed to delete backup', 'error')
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.sqlite')) {
      showToast('Please select a .sqlite file', 'error')
      return
    }

    if (!confirm('Are you sure you want to restore from this file? This will replace the current database.')) {
      return
    }

    setBackupLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        showToast('Database restored successfully')
        await fetchItems() // Refresh stock data
        await fetchBackups()
      } else {
        showToast(data.error || 'Failed to restore database', 'error')
      }
    } catch (error) {
      console.error('Failed to restore database:', error)
      showToast('Failed to restore database', 'error')
    } finally {
      setBackupLoading(false)
      event.target.value = '' // Clear file input
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const sorted = [...items].sort((a,b) => {
  // Sort by createdAt in descending order (newest first)
  // If createdAt is missing, treat it as oldest
  const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
  const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
  return dateB.getTime() - dateA.getTime()
})

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
              <Link href="" className="nav-link" style={navItem(false)}><Scan size={16} /> ยืม & เบิก อุปกรณ์ ( Develop )</Link>
              {/* <SettingsDropdown isOpen={settingsDropdownOpen} onToggle={() => setSettingsDropdownOpen(!settingsDropdownOpen)} currentPage="settings" /> */}
            </div>
            <div style={navbarRight}>
              <CategoryDropdown current={category} onSelect={setCategory} isOpen={dropdownOpen} onToggle={() => setDropdownOpen(!dropdownOpen)} />
              <SettingsDropdown isOpen={settingsDropdownOpen} onToggle={() => setSettingsDropdownOpen(!settingsDropdownOpen)} currentPage="settings" />
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
            {/* <SettingsDropdown isOpen={settingsDropdownOpen} onToggle={() => setSettingsDropdownOpen(!settingsDropdownOpen)} currentPage="settings" /> */}
          </div>

          {/* Alert */}
          {/* {stats.low>0 && (
            <div style={alertBar}>
              <AlertTriangle size={16} style={{marginRight: 8}} /> มี <b>{stats.low} รายการ</b> ที่ Stock ใกล้หมด
            </div>
          )} */}

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
              {selectedItem && <DetailPanel item={selectedItem} onClose={()=>{setSelectedItem(null); router.push({ pathname: '/settings' }, undefined, { shallow: true })}} onEdit={handleInlineEdit} onDelete={()=>setDelItem(selectedItem)} />}
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
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(item)
  const [saving, setSaving] = useState(false)
  const [newImageFile, setNewImageFile] = useState(null) // Store new image file until save
  const [originalImage, setOriginalImage] = useState(item?.image || '') // Track original server image
  const [originalImageFilename, setOriginalImageFilename] = useState(item?.image?.split('/').pop() || '') // Track original filename
  const [locations, setLocations] = useState([])
  const Icon = ICON[item.category] || Box
  const low = editForm.quantity <= editForm.minQuantity
  const isDisabled = item.disabledAt !== null && item.disabledAt !== undefined
  const isOutOfStock = item.quantity === 0

  // Fetch locations
  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    const res = await fetch('/api/locations')
    const data = await res.json()
    setLocations(data)
  }

  // Reset editForm when item changes (but not during save operations)
  useEffect(() => {
    if (!saving) {
      // Add cache-busting to image URL to force fresh load on page refresh
      const itemWithCacheBusting = {
        ...item,
        image: item?.image ? `${item.image}?_refresh=${Date.now()}` : ''
      }

      setEditForm(itemWithCacheBusting)
      setIsEditing(false)
      setOriginalImage(itemWithCacheBusting.image || '')
      setOriginalImageFilename(item?.image?.split('/').pop() || '')
    }
  }, [item, saving])

  const handleSave = async () => {
    setSaving(true)
    try {
      let finalImageData = editForm.image

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
              if (originalImageFilename) {
                // Keep the same filename to replace the existing file
                const nameWithoutExt = originalImageFilename.split('.').slice(0, -1).join('.')
                filename = `${nameWithoutExt}.webp`
              } else if (item?.id) {
                // Create new filename using stock item ID
                const cleanName = newImageFile.name.replace(/[^a-zA-Z0-9.-]/g, '').split('.').slice(0, -1).join('.')
                filename = `${item.id}-${cleanName}.webp`
              } else {
                // Create new filename (should not happen in DetailPanel since item always exists)
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
      const requestBody = {
        ...editForm,
        quantity: Number(editForm.quantity),
        minQuantity: Number(editForm.minQuantity)
      }

      // Only include image in the request if a new image file was uploaded
      // This preserves existing images when no new image is selected
      if (newImageFile) {
        requestBody.image = finalImageData
      } else {
        // Remove image field to preserve existing image on server
        delete requestBody.image
      }

      const res = await fetch(`/api/stock/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      setIsEditing(false)
      // Update form state with new image data
      const updatedForm = {
        ...saved,
        image: finalImageData // Ensure we use the uploaded image path
      }
      setEditForm(updatedForm)
      setNewImageFile(null)
      setOriginalImage(finalImageData || '')
      setOriginalImageFilename(finalImageData?.split('/').pop() || '')

      // Force image reload by adding cache-busting parameter
      if (finalImageData) {
        const timestamp = Date.now()
        const cacheBustedImage = `${finalImageData}?t=${timestamp}`

        // Update form with cache-busted image
        setEditForm(prev => ({ ...prev, image: cacheBustedImage }))

        // Update parent component with cache-busted image
        onEdit({ ...updatedForm, image: cacheBustedImage })

        // Update original image tracking
        setOriginalImage(cacheBustedImage)
        setOriginalImageFilename(finalImageData?.split('/').pop() || '')
      } else {
        // Update parent component's item
        onEdit(updatedForm)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Clean up blob URL if it exists
    if (editForm.image && editForm.image.startsWith('blob:')) {
      URL.revokeObjectURL(editForm.image)
    }
    setEditForm(item)
    setIsEditing(false)
    setNewImageFile(null)
    setOriginalImage(item?.image || '')
    setOriginalImageFilename(item?.image?.split('/').pop() || '')
  }

  const setField = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

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
      setField('image', previewUrl)
    }
  }

  const handleRemoveImage = async () => {
    // Clean up blob URL if it exists
    if (editForm.image && editForm.image.startsWith('blob:')) {
      URL.revokeObjectURL(editForm.image)
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
    setField('image', '')
  }

  return (
    <div style={{background:'white',borderRadius:12,boxShadow:'0 4px 20px rgba(0,0,0,0.08)',marginBottom:16,maxWidth:1400,width:'100%',animation:'fadein .2s ease',overflow:'hidden'}}>
      {/* Product Header */}
      <div style={{background:`url('/images/EDIT_BG.png') center/cover`,padding:'10px 14px',color:'white',position:'relative'}}>
        <div style={{position:'absolute',inset:0}}></div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',position:'relative',zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {/* <div style={{background:'rgba(255,255,255,0.2)',padding:'8px',borderRadius:8,backdropFilter:'blur(10px)'}}>
              {React.createElement(Icon, {size: 24, color:'white'})}
            </div> */}
            <div>
              <div style={{fontSize:17,opacity:0.9,fontWeight:500, marginTop: -10}}>รหัสรายการ</div>
              <div style={{fontSize:35,fontWeight:700,letterSpacing:1, marginTop: -10, marginBottom: -15}}>{item.id}</div>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            {isEditing ? (
              <>
                <button onClick={handleCancel} style={{background:'rgba(255,255,255,0.15)',backdropFilter:'blur(10px)',border:'1px solid rgba(255,255,255,0.3)',color:'white',borderRadius:8,padding:'10px 20px',fontSize:14,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6,boxShadow:'0 4px 15px rgba(0,0,0,0.1)'}}>
                  <X size={16} />
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    background:'rgba(25,135,84,0.8)',
                    backdropFilter:'blur(10px)',
                    border:'1px solid rgba(255,255,255,0.3)',
                    color:'white',
                    borderRadius:8,
                    padding:'10px 20px',
                    fontSize:14,
                    fontWeight:600,
                    cursor:'pointer',
                    display:'flex',
                    alignItems:'center',
                    gap:6,
                    boxShadow:'0 4px 15px rgba(25,135,84,0.3)'
                  }}
                >
                  {saving ? <><Loader2 size={16} className="spin" /> กำลังบันทึก...</> : <><Save size={16} /> บันทึก</>}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} style={{background:'rgba(255,255,255,0.15)',backdropFilter:'blur(10px)',border:'1px solid rgba(255,255,255,0.3)',color:'white',borderRadius:8,padding:'10px 20px',fontSize:14,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6,boxShadow:'0 4px 15px rgba(0,0,0,0.1)'}}>
                  <Edit size={16} />
                  แก้ไข
                </button>
                <button onClick={onDelete} style={{background:isDisabled?'rgba(25,135,84,0.8)':'rgba(220,53,69,0.8)',backdropFilter:'blur(10px)',border:'1px solid rgba(255,255,255,0.3)',color:'white',borderRadius:8,padding:'10px 20px',fontSize:14,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6,boxShadow:isDisabled?'0 4px 15px rgba(25,135,84,0.3)':'0 4px 15px rgba(220,53,69,0.3)'}}>
                  {isDisabled ? <RefreshCw size={16} /> : <Trash size={16} />}
                  {isDisabled ? 'คืนค่า' : 'ปิดใช้งาน'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Product Content */}
      <div style={{display:'flex',gap:0}}>
        {/* Left Side - Image Gallery */}
        <div style={{flex:'0 0 500px',background:'#f8f9fa',padding:'18px',borderRight:'1px solid #e9ecef'}}>
          <div style={{position:'relative'}}>
            {/* Main Image */}
            <div style={{aspectRatio:1,background:'white',borderRadius:12,overflow:'hidden',border:'1px solid #e9ecef',position:'relative'}}>
              {isEditing ? (
                <>
                  {editForm.image ? (
                    <img src={editForm.image} alt={editForm.name} style={{width:'100%',height:'100%',objectFit:'cover', filter: (isDisabled || isOutOfStock) ? 'grayscale(100%)' : 'none'}} />
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:(isDisabled || isOutOfStock) ? '#999' : '#6c757d'}}>
                      <Package size={64} />
                      <span style={{marginTop:12,fontSize:14,fontWeight:500}}>ไม่มีรูปภาพ</span>
                      <span style={{marginTop:4,fontSize:12,opacity:0.7}}>คลิกเพื่ออัปโหลด</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{position:'absolute',inset:0,opacity:0,cursor:'pointer'}}
                  />
                </>
              ) : (
                <>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover', filter: (isDisabled || isOutOfStock) ? 'grayscale(100%)' : 'none'}} />
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:(isDisabled || isOutOfStock) ? '#999' : '#6c757d'}}>
                      <Icon size={64} />
                      <span style={{marginTop:12,fontSize:14,fontWeight:500}}>ไม่มีรูปภาพ</span>
                    </div>
                  )}
                </>
              )}
              {isDisabled && !isEditing && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-15deg)',
                  color: '#dc3545',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  textShadow: '2px 2px 4px rgba(255,255,255,0.9)',
                  zIndex: 10
                }}>
                  Not use
                </div>
              )}
              {isOutOfStock && !isEditing && !isDisabled && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  // transform: 'translate(-50%, -50%) rotate(-15deg)',
                  color: '#dc3545',
                  fontSize: '70px',
                  fontWeight: 'bold',
                  // fontStyle: 'italic',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  textShadow: '2px 2px 4px rgba(255,255,255,0.9)',
                  zIndex: 10
                }}>
                  หมด
                </div>
              )}
            </div>

            {/* Image Controls */}
            {isEditing && (
              <div style={{marginTop:16,display:'flex',gap:8}}>
                {editForm.image && (
                  <button onClick={handleRemoveImage} style={{flex:1,background:'#dc3545',color:'white',border:'none',borderRadius:8,padding:'10px',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                    <X size={16} />
                    ลบรูป
                  </button>
                )}
                <div style={{flex:1,background:'#6c757d',color:'white',borderRadius:8,padding:'10px',fontSize:12,fontWeight:600,textAlign:'center'}}>
                  คลิกที่รูปเพื่อเปลี่ยน
                </div>
              </div>
            )}
          </div>

          {/* Quick Info Cards */}
          <div style={{marginTop:24,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div style={{background:'white',padding:'16px',borderRadius:10,border:'1px solid #e9ecef',textAlign:'center'}}>
              <div style={{fontSize:24,fontWeight:700,color:low ? '#dc3545' : '#28a745',fontFamily:'var(--mono)'}}>
                {isEditing ? (
                  <input
                    type="number"
                    style={{background:'transparent',border:'none',fontSize:24,fontWeight:700,color:low ? '#dc3545' : '#28a745',width:'100%',textAlign:'center',outline:'none'}}
                    value={editForm.quantity}
                    onChange={e=>setField('quantity',e.target.value)}
                  />
                ) : (
                  item.quantity
                )}
              </div>
              <div style={{fontSize:12,color:'#6c757d',marginTop:4}}>คงเหลือ</div>
            </div>
            <div style={{background:'white',padding:'16px',borderRadius:10,border:'1px solid #e9ecef',textAlign:'center'}}>
              <div style={{fontSize:24,fontWeight:700,color:'#6f42c1',fontFamily:'var(--mono)'}}>
                {isEditing ? (
                  <input
                    type="number"
                    style={{background:'transparent',border:'none',fontSize:24,fontWeight:700,color:'#6f42c1',width:'100%',textAlign:'center',outline:'none'}}
                    value={editForm.minQuantity}
                    onChange={e=>setField('minQuantity',e.target.value)}
                  />
                ) : (
                  item.minQuantity
                )}
              </div>
              <div style={{fontSize:12,color:'#6c757d',marginTop:4}}>แจ้งเตือน</div>
            </div>
          </div>

          {/* Status Badge */}
          {/* <div style={{marginTop:16,display:'flex',justifyContent:'center'}}>
            <div style={{
              background: low ? '#f8d7da' : '#d4edda',
              color: low ? '#721c24' : '#155724',
              padding:'8px 16px',
              borderRadius:20,
              fontSize:13,
              fontWeight:600,
              display:'flex',
              alignItems:'center',
              gap:6,
              border: `1px solid ${low ? '#f5c6cb' : '#c3e6cb'}`
            }}>
              <AlertTriangle size={16} />
              {low ? 'Stock ใกล้หมด' : 'พร้อมใช้งาน'}
            </div>
          </div> */}
        </div>

        {/* Right Side - Product Details */}
        <div style={{flex:1,padding:'32px'}}>
          {/* Product Title Section */}
          <div style={{marginBottom:32}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
              <div style={{background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',color:'white',padding:'6px 12px',borderRadius:20,fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>
                {item.category}
              </div>
              {low && (
                <div style={{background:'#fff3cd',color:'#856404',padding:'6px 12px',borderRadius:20,fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:4}}>
                  <AlertTriangle size={14} />
                  ต้องเติมสต็อก
                </div>
              )}
            </div>
            <h1 style={{fontSize:28,fontWeight:700,color:'#2c3e50',margin:0,lineHeight:1.2,marginBottom:8}}>
              {isEditing ? (
                <input
                  style={{background:'transparent',border:'none',fontSize:28,fontWeight:700,color:'#2c3e50',width:'100%',outline:'none',padding:0,borderBottom:'2px solid #e9ecef'}}
                  value={editForm.name}
                  onChange={e=>setField('name',e.target.value)}
                  placeholder="ชื่ออุปกรณ์"
                />
              ) : (
                item.name
              )}
            </h1>
            <div style={{fontSize:16,color:'#6c757d',display:'flex',alignItems:'center',gap:8}}>
              <MapPin size={16} />
              {isEditing ? (
                <select
                  style={{background:'transparent',border:'none',fontSize:16,color:'#6c757d',outline:'none',padding:'4px 8px',borderRadius:4,border:'1px solid #e9ecef'}}
                  value={editForm.location}
                  onChange={e=>setField('location',e.target.value)}
                >
                  <option value="">-- เลือกที่เก็บ/ตำแหน่ง --</option>
                  {locations.map(loc => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
                </select>
              ) : (
                item.location || 'ไม่ระบุตำแหน่ง'
              )}
            </div>
          </div>

          {/* Product Specifications */}
          <div style={{background:'#f8f9fa',borderRadius:12,padding:'24px',marginBottom:24}}>
            <h2 style={{fontSize:18,fontWeight:600,color:'#2c3e50',margin:'0 0 20px 0',display:'flex',alignItems:'center',gap:8}}>
              <Package size={20} />
              ข้อมูลจำเพาะ
            </h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:20}}>
              <div>
                <label style={{fontSize:12,color:'#6c757d',fontWeight:600,textTransform:'uppercase',letterSpacing:0.5,display:'block',marginBottom:6}}>ยี่ห้อ</label>
                {isEditing ? (
                  <input
                    style={{background:'white',border:'1px solid #e9ecef',borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',outline:'none',transition:'all 0.2s'}}
                    value={editForm.brand}
                    onChange={e=>setField('brand',e.target.value)}
                    placeholder="กรอกยี่ห้อ"
                  />
                ) : (
                  <div style={{fontSize:16,fontWeight:500,color:'#2c3e50'}}>{item.brand || '-'}</div>
                )}
              </div>
              <div>
                <label style={{fontSize:12,color:'#6c757d',fontWeight:600,textTransform:'uppercase',letterSpacing:0.5,display:'block',marginBottom:6}}>รุ่น</label>
                {isEditing ? (
                  <input
                    style={{background:'white',border:'1px solid #e9ecef',borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',outline:'none',transition:'all 0.2s'}}
                    value={editForm.model}
                    onChange={e=>setField('model',e.target.value)}
                    placeholder="กรอกรุ่น"
                  />
                ) : (
                  <div style={{fontSize:16,fontWeight:500,color:'#2c3e50'}}>{item.model || '-'}</div>
                )}
              </div>
              <div>
                <label style={{fontSize:12,color:'#6c757d',fontWeight:600,textTransform:'uppercase',letterSpacing:0.5,display:'block',marginBottom:6}}>หมายเลขเครื่อง</label>
                {isEditing ? (
                  <input
                    style={{background:'white',border:'1px solid #e9ecef',borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',outline:'none',transition:'all 0.2s'}}
                    value={editForm.serial}
                    onChange={e=>setField('serial',e.target.value)}
                    placeholder="กรอก Serial Number"
                  />
                ) : (
                  <div style={{fontSize:16,fontWeight:500,color:'#2c3e50',fontFamily:'var(--mono)'}}>{item.serial || '-'}</div>
                )}
              </div>
              <div>
                <label style={{fontSize:12,color:'#6c757d',fontWeight:600,textTransform:'uppercase',letterSpacing:0.5,display:'block',marginBottom:6}}>สถานะ</label>
                <div style={{fontSize:16,fontWeight:500,color:isDisabled ? '#dc3545' : (isOutOfStock ? '#dc3545' : '#28a745'), fontStyle: isOutOfStock ? 'italic' : 'normal'}}>
                  {isDisabled ? 'ปิดใช้งาน' : (isOutOfStock ? 'ว่าง' : 'พร้อมใช้งาน')}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{marginBottom:24}}>
            <h2 style={{fontSize:18,fontWeight:600,color:'#2c3e50',margin:'0 0 16px 0',display:'flex',alignItems:'center',gap:8}}>
              <FileText size={20} />
              รายละเอียดเพิ่มเติม
            </h2>
            {isEditing ? (
              <textarea
                style={{background:'white',border:'1px solid #e9ecef',borderRadius:8,padding:'12px',fontSize:14,width:'100%',minHeight:120,resize:'vertical',outline:'none',fontFamily:'inherit',lineHeight:1.6}}
                value={editForm.description}
                onChange={e=>setField('description',e.target.value)}
                placeholder="เพิ่มรายละเอียดเกี่ยวกับอุปกรณ์..."
              />
            ) : (
              <div style={{fontSize:15,color:'#495057',lineHeight:1.6,background:'#f8f9fa',padding:'16px',borderRadius:8}}>
                {item.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{animation:spin 1s linear infinite}
        input:focus, textarea:focus, select:focus{
          border-color: #667eea !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
        }
        button:hover{
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  )
}

function TableView({items, selected, onRowClick, onEdit, onDelete}) {
  return (
    <div style={{overflowX:'auto',animation:'fadein .3s ease',maxWidth:1400,width:'100%'}}>
      <table style={{width:'100%',borderCollapse:'separate',borderSpacing:'0 3px'}}>
        <thead>
          <tr>{['ID','อุปกรณ์','หมวดหมู่','Serial','จำนวน','ขั้นต่ำ','ที่เก็บ'].map(h=>{
            if (h === 'ID') return <th key={h} style={{...thSt,width:'80px',padding:'8px 10px'}}>{h}</th>
            if (h === 'หมวดหมู่') return <th key={h} style={{...thSt,width:'120px',padding:'8px 10px'}}>{h}</th>
            if (h === 'Serial') return <th key={h} style={{...thSt,width:'180px',padding:'8px 10px'}}>{h}</th>
            if (h === 'จำนวน' || h === 'ขั้นต่ำ') return <th key={h} style={{...thSt,width:'60px',textAlign:'center',padding:'8px 10px'}}>{h}</th>
            if (h === 'ที่เก็บ') return <th key={h} style={{...thSt,width:'80px',padding:'8px 10px'}}>{h}</th>
            return <th key={h} style={{...thSt,padding:'8px 10px'}}>{h}</th>
          })}</tr>
        </thead>
        <tbody>
          {items.map(item=>{
            const low = item.quantity<=item.minQuantity
            const isDisabled = item.disabledAt !== null && item.disabledAt !== undefined
            const isOutOfStock = item.quantity === 0

            return (
              <tr key={item.id} className="row-hover" onClick={()=>onRowClick(item)} style={{
                background: isDisabled ? '#f5f5f5' : (selected?.id===item.id?'var(--accent-glow)':'rgba(255,255,255,0.85)'),
                borderRadius:6,
                cursor:'pointer',
                border:selected?.id===item.id?'1px solid var(--accent)':'none',
                opacity: isDisabled ? 0.6 : 1
              }}>
                <td style={{...tdSt,padding:'6px 8px',borderTopLeftRadius:6,borderBottomLeftRadius:6, position: 'relative'}}>
                  <span style={{fontFamily:'var(--mono)',color:isDisabled ? '#999' : 'var(--accent)',fontSize:11,fontWeight:600}}>{item.id}</span>
                </td>
                <td style={{...tdSt,padding:'6px 8px', position: 'relative'}}>
                  <div style={{fontWeight:600,fontSize:12,color:isDisabled ? '#999' : 'var(--text)',lineHeight:1.3}}>{item.name}</div>
                  <div style={{fontSize:10,color:isDisabled ? '#bbb' : 'var(--text3)'}}>{item.brand} {item.model}</div>
                  {isDisabled && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%) rotate(-15deg)',
                      color: '#dc3545',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      textShadow: '1px 1px 2px rgba(255,255,255,0.8)'
                    }}>
                      Not use
                    </div>
                  )}
                  {isOutOfStock && !isDisabled && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%) rotate(-15deg)',
                      color: '#dc3545',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      // fontStyle: 'italic',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      textShadow: '1px 1px 2px rgba(255,255,255,0.9)'
                    }}>
                      Empty
                    </div>
                  )}
                </td>
                <td style={{...tdSt,padding:'6px 8px'}}>
                  <span style={{...catTag, opacity: isDisabled ? 0.5 : 1}}>{item.category}</span>
                </td>
                <td style={{...tdSt,padding:'6px 8px'}}>
                  <span style={{fontFamily:'var(--mono)',fontSize:10,color:item.serial?(isDisabled ? '#999' : 'var(--text3)'):'#94a3b8',fontStyle:item.serial?'normal':'italic'}}>
                    {item.serial || 'ไม่ระบุ'}
                  </span>
                </td>
                <td style={{...tdSt,padding:'6px 8px',textAlign:'center'}}>
                  <span style={{...qtyBadge(low),display:'inline-flex',padding:'2px 8px',alignItems:'center',gap:3,fontSize:11, opacity: isDisabled ? 0.5 : 1}}>
                    {low&&<AlertTriangle size={10} />}<span style={{fontFamily:'var(--mono)',fontWeight:700}}>{item.quantity}</span>
                  </span>
                </td>
                <td style={{...tdSt,padding:'6px 8px',textAlign:'center'}}>
                  <span style={{fontFamily:'var(--mono)',fontSize:11,color:isDisabled ? '#999' : 'var(--text3)'}}>{item.minQuantity}</span>
                </td>
                <td style={{...tdSt,padding:'6px 8px'}}>
                  <span style={{fontSize:11,color:item.location?(isDisabled ? '#999' : 'var(--text3)'):'#94a3b8',fontStyle:item.location?'normal':'italic'}}>
                    {item.location || 'ไม่ระบุ'}
                  </span>
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
  const isDisabled = item.disabledAt !== null && item.disabledAt !== undefined

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(4px)'}}>
      <div style={{background:'var(--surface)',border:`1px solid ${isDisabled ? 'var(--success)' : 'var(--danger)'}`,borderRadius:16,padding:20,maxWidth:380,width:'90%',textAlign:'center'}}>
        <div style={{fontSize:32,marginBottom:10}}>
          {isDisabled ?
            <RefreshCw size={32} style={{color:'var(--success)'}} /> :
            <AlertTriangle size={32} style={{color:'var(--danger)'}} />
          }
        </div>
        <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>
          {isDisabled ? 'ยืนยันการคืนค่า' : 'ยืนยันการปิดใช้งาน'}
        </div>
        <div style={{fontSize:13,color:'var(--text2)',marginBottom:2}}>
          <span style={{color:'var(--accent)',fontFamily:'var(--mono)'}}>{item.id}</span>
        </div>
        <div style={{fontSize:15,fontWeight:600,marginBottom:16}}>{item.name}</div>
        <div style={{fontSize:13,color:'var(--text3)',marginBottom:20,padding:'10px 16px',background:isDisabled ? 'rgba(25,135,84,0.1)' : 'rgba(239,68,68,0.1)',borderRadius:8}}>
          {isDisabled ?
            'การคืนค่ารายการนี้จะทำให้รายการกลับมาพร้อมใช้งานอีกครั้ง' :
            'การปิดใช้งานรายการนี้จะไม่ลบข้อมูล แต่จะแสดงว่าถูกปิดใช้งาน'
          }
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button onClick={onClose} style={{background:'transparent',border:'1px solid var(--border2)',color:'var(--text2)',borderRadius:8,padding:'8px 18px',cursor:'pointer',fontSize:13}}>ยกเลิก</button>
          <button onClick={onConfirm} style={{background:isDisabled ? 'var(--success)' : 'var(--danger)',color:'white',border:'none',borderRadius:8,padding:'8px 18px',cursor:'pointer',fontSize:13,fontWeight:700}}>
            {isDisabled ? 'คืนค่า' : 'ปิดใช้งาน'}
          </button>
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
const addBtn={background:'var(--accent)',color:'#ffffff',border:'none',borderRadius:8,padding:'10px 18px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'var(--sans)',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:6}
const alertBar={background:'rgba(255,184,0,.1)',border:'1px solid rgba(255,184,0,.3)',color:'var(--warning)',borderRadius:9,padding:'10px 16px',fontSize:13,marginBottom:16,maxWidth:1400,width:'100%'}
const centerBox={display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:280,gap:12}
const spinner={width:34,height:34,border:'3px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin .8s linear infinite'}
const catTag={fontSize:10,background:'var(--surface2)',color:'var(--text2)',padding:'3px 10px',borderRadius:20,border:'1px solid var(--border)',fontWeight:500}
const qtyBadge=(low)=>({display:'inline-flex',alignItems:'center',gap:4,background:low?'rgba(239,68,68,0.15)':'rgba(16,185,129,0.15)',color:low?'var(--danger)':'var(--success)',border:`1px solid ${low?'rgba(239,68,68,0.3)':'rgba(16,185,129,0.3)'}`,borderRadius:20})
const thSt={textAlign:'left',fontSize:10,color:'var(--text3)',letterSpacing:1.2,textTransform:'uppercase',padding:'12px 16px',borderBottom:'2px solid var(--border)',fontWeight:600,whiteSpace:'nowrap'}
const tdSt={padding:'14px 16px',fontSize:13,transition:'background .15s'}
const toastSt=(t)=>({position:'fixed',bottom:22,right:22,zIndex:2000,background:t==='success'?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)',border:`1px solid ${t==='success'?'var(--success)':'var(--danger)'}`,color:t==='success'?'var(--success)':'var(--danger)',borderRadius:11,padding:'12px 20px',fontSize:14,fontWeight:500,animation:'toast-in .3s ease',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',gap:8})
