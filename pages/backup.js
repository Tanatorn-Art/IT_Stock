import React, { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Database, Download, RefreshCw, Package, MapPin, Scan, Settings, Calendar, FileText, CheckCircle, AlertTriangle } from 'lucide-react'
import SettingsDropdown from '../components/SettingsDropdown'

export default function BackupPage() {
  const [loading, setLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [backupStatus, setBackupStatus] = useState('')
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadResult, setUploadResult] = useState(null)
  const [backupHistory, setBackupHistory] = useState([])
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchBackupHistory()
  }, [])

  const createBackup = async () => {
    setLoading(true)
    setBackupStatus('กำลังสำรองข้อมูล...')

    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await res.json()

      if (res.ok) {
        setBackupStatus(`สำรองข้อมูลเรียบร้อย! บันทึกเป็นไฟล์: ${data.filename}`)

        const downloadRes = await fetch(`/api/download-backup?file=${data.filename}`)
        const blob = await downloadRes.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.filename
        a.click()
        window.URL.revokeObjectURL(url)

        fetchBackupHistory()
      } else {
        setBackupStatus(`เกิดข้อผิดพลาดในการสำรองข้อมูล: ${data.error}`)
      }
    } catch (error) {
      console.error('Backup error:', error)
      setBackupStatus(`เกิดข้อผิดพลาดในการสำรองข้อมูล: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploadLoading(true)
    setUploadStatus('กำลังอัปโหลดไฟล์...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-backup', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setUploadStatus(`อัปโหลดไฟล์ ${file.name} เรียบร้อย!`)
        setUploadResult({
          success: true,
          message: result.message || 'Database uploaded successfully',
          details: result
        })
        fetchBackupHistory()
      } else {
        setUploadStatus(`เกิดข้อผิดพลาด: ${result.error}`)
        setUploadResult({
          success: false,
          message: result.error || 'Upload failed',
          details: result
        })
      }
    } catch (error) {
      setUploadStatus(`เกิดข้อผิดพลาด: ${error.message}`)
      setUploadResult({
        success: false,
        message: error.message,
        details: null
      })
    } finally {
      setUploadLoading(false)
    }
  }

  const fetchBackupHistory = async () => {
    try {
      const res = await fetch('/api/backup-history')
      const data = await res.json()
      setBackupHistory(data.files || [])
    } catch (error) {
      console.error('Error fetching backup history:', error)
      setBackupHistory([])
    }
  }

  return (
    <>
      <Head>
        <title>Backup Database - IT Stock Management</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🗄</text></svg>" />
      </Head>

      <div style={{...layout, backgroundImage: 'url(/images/bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed'}}>
        {/* Navbar */}
        <nav style={navbar}>
          <div style={{maxWidth:1400,margin:'0 auto',width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={navbarNav}>
              <Link href="/" className="nav-link" style={navItem(false)}><Package size={16} /> Stock รายการ</Link>
              <Link href="/location" className="nav-link" style={navItem(false)}><MapPin size={16} /> จัดการตำแหน่ง</Link>
              <Link href="/scan" className="nav-link" style={navItem(false)}><Scan size={16} /> Scan รับ/นำออก</Link>
            </div>
            <div style={navbarRight}>
              <SettingsDropdown isOpen={settingsDropdownOpen} onToggle={() => setSettingsDropdownOpen(!settingsDropdownOpen)} currentPage="backup" />
              <time style={{marginLeft:12,color:'#ffffff',fontFamily:'Consolas, "Courier New", monospace',fontSize:12}}>{new Date().toLocaleString('th-TH')}</time>
            </div>
          </div>
        </nav>

        {/* Main */}
        <main style={mainArea}>
          <div style={{background:'rgba(255,255,255,0.95)',borderRadius:12,padding:30,marginBottom:20,maxWidth:800,width:'100%',border:'1px solid var(--border)'}}>
            <div style={{textAlign:'center',marginBottom:30}}>
              <Database size={48} style={{marginBottom:16,color:'var(--accent)'}} />
              <h2 style={{color:'var(--text)',marginBottom:8,fontSize:24,fontWeight:600}}>สำรองข้อมูลฐานข้อมูล</h2>
              <p style={{color:'var(--text2)',marginBottom:24,fontSize:14,lineHeight:1.5}}>
                สำรองข้อมูลทั้งหมดจาก SQLite รวมถึง Stock, Locations, Transactions และ Activity Logs
                <br />ไฟล์สำรองจะถูกตั้งชื่อตามรูปแบบ: IT_Stock_BackUp_yyyymmdd
              </p>

              <button
                onClick={createBackup}
                disabled={loading}
                style={{
                  background: loading ? 'var(--text3)' : 'var(--accent)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--sans)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  margin: '0 auto',
                  minWidth: 200
                }}
              >
                {loading ? (
                  <>
                    <div style={{width:16,height:16,border:'2px solid #ffffff',borderRadius:'50%',borderTopColor:'transparent',animation:'spin .8s linear infinite'}} />
                    <span>กำลังสำรอง...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>สำรองข้อมูลทั้งหมด</span>
                  </>
                )}
              </button>

              {backupStatus && (
                <div style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 6,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: backupStatus.includes('เรียบร้อย') ? '#d4edda' : '#f8d7da',
                  color: backupStatus.includes('เรียบร้อย') ? '#155724' : '#721c24'
                }}>
                  {backupStatus.includes('เรียบร้อย') ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  <span>{backupStatus}</span>
                </div>
              )}
            </div>
          </div>

          {/* Backup History */}
          {backupHistory.length > 0 && (
            <div style={{background:'rgba(255,255,255,0.95)',borderRadius:12,padding:20,maxWidth:800,width:'100%',border:'1px solid var(--border)'}}>
              <h3 style={{color:'var(--text)',marginBottom:16,fontSize:18,fontWeight:600,display:'flex',alignItems:'center',gap:8}}>
                <Calendar size={18} />
                ประวัติการสำรองล่าสุด
              </h3>

              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {backupHistory.map((backup, index) => (
                  <div key={index} style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <FileText size={16} style={{color:'#ff6b35'}} />
                      <div>
                        <div style={{color:'var(--text)',fontSize:14,fontWeight:500}}>{backup.name}</div>
                        <div style={{color:'var(--text2)',fontSize:12}}>{backup.size} • {new Date(backup.created).toLocaleString('th-TH')} • SQLite Database</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        fetch(`/api/download-backup?file=${backup.name}`)
                          .then(res => res.blob())
                          .then(blob => {
                            const url = window.URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = backup.name
                            a.click()
                            window.URL.revokeObjectURL(url)
                          })
                          .catch(console.error)
                      }}
                      style={{
                        background: 'var(--accent)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Download size={12} />
                      ดาวน์โหลด
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        button:active{transform:scale(.97)}
        a{text-decoration:none}
        .nav-link:hover{background:rgba(255,255,255,0.15)}
      `}</style>
    </>
  )
}

// ── styles ──
const layout={display:'flex',flexDirection:'column',minHeight:'100vh'}
const navbar={display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 24px',position:'sticky',top:0,zIndex:100,width:'100%',backgroundImage:'url(/images/bg_navbar.jpg)',backgroundSize:'cover',backgroundPosition:'center'}
const navbarNav={display:'flex',alignItems:'center',gap:4}
const navbarRight={display:'flex',alignItems:'center',gap:12}
const navItem=(a)=>({display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:8,fontSize:13,color:'#ffffff',background:a?'var(--accent-glow)':'transparent',border:a?'1px solid rgba(0,212,255,.2)':'1px solid transparent',fontWeight:a?600:400,transition:'all .15s',cursor:'pointer'})
const mainArea={flex:1,padding:24,minWidth:0,overflowX:'hidden',display:'flex',flexDirection:'column',alignItems:'center',background:'transparent'}