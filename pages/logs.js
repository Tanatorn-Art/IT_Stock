import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Search, Filter, AlertTriangle, CheckCircle, Info, Calendar, Download, RefreshCw, Package, MapPin, Scan, Settings, ChevronDown, FileText, X } from 'lucide-react'
import SettingsDropdown from '../components/SettingsDropdown'

export default function LogsPage() {
  const [logs, setLogs] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    level: '',
    category: '',
    startDate: '', // Remove date filter temporarily
    endDate: ''  // Remove date filter temporarily
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false)

  useEffect(() => {
    fetchLogs()
    fetchCategories()
  }, [filters])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.level) params.set('level', filters.level)
      if (filters.category) params.set('category', filters.category)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)

      const res = await fetch(`/api/logs?${params}`)
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/logs?action=categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      log.message.toLowerCase().includes(searchLower) ||
      log.category.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.metadata).toLowerCase().includes(searchLower)
    )
  })

  const getTerminalColor = (level, category, method = null) => {
    // Color coding for HTTP methods
    if (method) {
      switch (method.toUpperCase()) {
        case 'GET': return '#0066cc' // Blue
        case 'POST': return '#009900' // Green
        case 'PUT': return '#ff6600' // Orange
        case 'DELETE': return '#cc0000' // Red
        default: return '#666666' // Gray
      }
    }

    // Color coding for log levels
    switch (level.toLowerCase()) {
      case 'error': return '#cc0000'
      case 'normal': return '#009900'
      case 'warning': return '#ff6600'
      default: return '#0066cc'
    }
  }

  const formatTerminalLog = (log) => {
    const timestamp = new Date(log.timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', '')

    const level = log.level.toUpperCase().padEnd(7)
    const category = log.category.padEnd(12)

    if (log.category === 'http_request' && log.metadata.method) {
      const method = log.metadata.method.padEnd(6)
      const url = log.metadata.url || ''
      const loadTime = log.metadata.loadTime ? `${log.metadata.loadTime}ms` : ''
      const methodColor = getTerminalColor(log.level, log.category, log.metadata.method)
      return {
        timestamp,
        formattedLine: `[${timestamp}] ${level} ${category} ${method} ${url} ${loadTime}`,
        color: methodColor
      }
    }

    if (log.category === 'api_request' && log.metadata.method) {
      const method = log.metadata.method.padEnd(6)
      const url = log.metadata.url || ''
      const statusCode = log.metadata.statusCode || ''
      const loadTime = log.metadata.loadTime ? `${log.metadata.loadTime}ms` : ''
      const methodColor = getTerminalColor(log.level, log.category, log.metadata.method)
      return {
        timestamp,
        formattedLine: `[${timestamp}] ${level} ${category} ${method} ${url} - ${statusCode} - ${loadTime}`,
        color: methodColor
      }
    }

    const defaultColor = getTerminalColor(log.level, log.category)
    return {
      timestamp,
      formattedLine: `[${timestamp}] ${level} ${category} ${log.message}`,
      color: defaultColor
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const exportLogs = () => {
    const csvContent = [
      'Timestamp,Level,Category,Message,Metadata',
      ...filteredLogs.map(log =>
        `"${log.timestamp}","${log.level}","${log.category}","${log.message}","${JSON.stringify(log.metadata)}"`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <>
      <Head>
        <title>System Logs - IT Stock Management</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📋</text></svg>" />
      </Head>

      <div style={{...layout, backgroundImage: 'url(/images/bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed'}}>
        {/* Navbar */}
        <nav style={navbar}>
          <div style={{maxWidth:1400,margin:'0 auto',width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={navbarNav}>
              <Link href="/" className="nav-link" style={navItem(false)}><Package size={16} /> Stock รายการ</Link>
              <Link href="/location" className="nav-link" style={navItem(false)}><MapPin size={16} /> จัดการตำแหน่ง</Link>
              <Link href="/borrow" className="nav-link" style={navItem(false)}><Scan size={16} /> ยืม & เบิก อุปกรณ์ ( Develop )</Link>
            </div>
            <div style={navbarRight}>
              <SettingsDropdown isOpen={settingsDropdownOpen} onToggle={() => setSettingsDropdownOpen(!settingsDropdownOpen)} currentPage="logs" />
              <time style={{marginLeft:12,color:'#ffffff',fontFamily:'Consolas, "Courier New", monospace',fontSize:12}}>{new Date().toLocaleString('th-TH')}</time>
            </div>
          </div>
        </nav>

        {/* Main */}
        <main style={mainArea}>
          {/* Toolbar */}
          <div style={toolbar}>
            <div style={searchWrap}>
              <Search size={16} style={{color:'var(--text3)'}} />
              <input style={searchIn} placeholder="ค้นหา logs..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
              {searchTerm && <button onClick={()=>setSearchTerm('')} style={clearX}><X size={12} /></button>}
            </div>

            <button onClick={exportLogs} style={addBtn}><Download size={14} /> Export CSV</button>
            <button onClick={fetchLogs} style={addBtn}><RefreshCw size={14} /> Refresh</button>
          </div>

          {/* Filters */}
          <div style={{background:'rgba(255,255,255,0.95)',borderRadius:12,padding:10,marginBottom:10,maxWidth:1400,width:'100%',border:'1px solid var(--border)'}}>
            <div style={{display:'flex',gap:15,alignItems:'center',flexWrap:'wrap'}}>
              <div style={{flex:'1',minWidth:200}}>
                <label style={{fontSize:12,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',letterSpacing:0.5,display:'block',marginBottom:6}}>Level</label>
                <select
                  value={filters.level}
                  onChange={(e) => setFilters({...filters, level: e.target.value})}
                  style={{background:'white',border:'1px solid var(--border)',borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',outline:'none',transition:'all 0.2s'}}
                >
                  <option value="">All Levels</option>
                  <option value="error">Error</option>
                  <option value="normal">Normal</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>

              <div style={{flex:'1',minWidth:200}}>
                <label style={{fontSize:12,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',letterSpacing:0.5,display:'block',marginBottom:6}}>Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  style={{background:'white',border:'1px solid var(--border)',borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',outline:'none',transition:'all 0.2s'}}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{flex:'1',minWidth:150}}>
                <label style={{fontSize:12,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',letterSpacing:0.5,display:'block',marginBottom:6}}>Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  style={{background:'white',border:'1px solid var(--border)',borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',outline:'none',transition:'all 0.2s'}}
                />
              </div>

              <div style={{flex:'1',minWidth:150}}>
                <label style={{fontSize:12,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',letterSpacing:0.5,display:'block',marginBottom:6}}>End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  style={{background:'white',border:'1px solid var(--border)',borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',outline:'none',transition:'all 0.2s'}}
                />
              </div>
            </div>
          </div>

          {/* Terminal-style Logs */}
          {loading ? (
            <div style={centerBox}><div style={spinner}/><span style={{color:'var(--text3)',fontFamily:'var(--mono)',fontSize:13}}>Loading logs...</span></div>
          ) : filteredLogs.length===0 ? (
            <div style={centerBox}>
              <FileText size={48} style={{marginBottom:12,color:'var(--text3)'}} />
              <div style={{color:'var(--text2)',fontSize:14}}>ไม่พบ logs</div>
            </div>
          ) : (
            <div style={{
              background: '#f8f9fa',
              borderRadius: 12,
              padding: 20,
              fontFamily: 'Consolas, "Courier New", monospace',
              fontSize: 12,
              color: '#212529',
              overflow: 'auto',
              maxHeight: '600px',
              maxWidth: 1400,
              width: '100%',
              border: '1px solid #dee2e6',
              animation: 'fadein .3s ease'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid #dee2e6'
              }}>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#ff5f56',
                  marginRight: 8
                }} />
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#ffbd2e',
                  marginRight: 8
                }} />
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#27c93f',
                  marginRight: 16
                }} />
                <span style={{color: '#6c757d', fontSize: 11}}>Terminal Logs - IT Stock Management</span>
              </div>

              <div style={{lineHeight: 1.6}}>
                {filteredLogs.map((log, index) => {
                  const terminalLog = formatTerminalLog(log)
                  return (
                    <div key={log.id || index} style={{
                      marginBottom: 2,
                      color: terminalLog.color,
                      fontSize: 11,
                      fontFamily: 'Consolas, "Courier New", monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      backgroundColor: log.level === 'error' ? 'rgba(220, 53, 69, 0.1)' : 'transparent',
                      // padding: log.level === 'error' ? '4px 8px' : '0',
                      borderRadius: log.level === 'error' ? '4px' : '0',
                      borderLeft: log.level === 'error' ? '4px solid #dc3545' : 'none'
                    }}>
                      {terminalLog.formattedLine}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
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
const centerBox={display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:280,gap:12}
const spinner={width:34,height:34,border:'3px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin .8s linear infinite'}
const catTag={fontSize:10,background:'var(--surface2)',color:'var(--text2)',padding:'3px 10px',borderRadius:20,border:'1px solid var(--border)',fontWeight:500}
const thSt={textAlign:'left',fontSize:10,color:'var(--text3)',letterSpacing:1.2,textTransform:'uppercase',padding:'12px 16px',borderBottom:'2px solid var(--border)',fontWeight:600,whiteSpace:'nowrap'}
const tdSt={padding:'14px 16px',fontSize:13,transition:'background .15s'}
