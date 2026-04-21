import { useEffect, useRef, useState } from 'react'

export default function BarcodeModal({ item, onClose }) {
  const previewRef = useRef(null)
  const [qty, setQty] = useState(item?.quantity || 1)

  useEffect(() => {
    if (typeof window === 'undefined' || !item || !previewRef.current) return
    import('jsbarcode').then(({ default: JsBarcode }) => {
      try {
        JsBarcode(previewRef.current, item.id, {
          format: 'CODE128',
          width: 1.8,
          height: 38,
          displayValue: true,
          fontSize: 11,
          margin: 6,
          background: '#ffffff',
          lineColor: '#000000',
        })
      } catch (e) { console.error(e) }
    })
  }, [item])

  if (!item) return null

  const handlePrint = () => {
    const canvas = previewRef.current
    const barcodeDataUrl = canvas ? canvas.toDataURL() : ''

    const labels = Array.from({ length: qty }, (_, i) => `
      <div class="label">
        <div class="row-top">
          <span class="cat">${item.category}</span>
          <span class="id">${item.id}</span>
        </div>
        <div class="name">${item.name}</div>
        <img src="${barcodeDataUrl}" class="bc" />
        <div class="row-bot">
          <span>${item.brand}${item.model ? ' · ' + item.model : ''}</span>
          ${item.location ? `<span>📍${item.location}</span>` : ''}
        </div>
      </div>
    `).join('')

    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head><title>Barcode ${item.id}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Courier New',monospace;background:#f5f5f5;padding:10px}
      .page{display:flex;flex-wrap:wrap;gap:6px}
      .label{background:#fff;border:1px solid #999;border-radius:4px;padding:6px 8px;width:210px;page-break-inside:avoid}
      .row-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:2px}
      .cat{font-size:9px;background:#eee;padding:1px 5px;border-radius:3px;color:#444}
      .id{font-size:11px;font-weight:700;color:#0055aa;letter-spacing:.5px}
      .name{font-size:10px;font-weight:600;color:#111;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .bc{width:100%;display:block;margin:2px 0}
      .row-bot{display:flex;justify-content:space-between;font-size:8px;color:#666;margin-top:2px}
      @media print{body{background:#fff;padding:5px}.page{gap:4px}}
    </style></head><body>
    <div class="page">${labels}</div>
    <script>window.onload=()=>window.print()<\/script>
    </body></html>`)
    w.document.close()
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={hdr}>
          <div>
            <div style={subttl}>Print Barcode</div>
            <div style={ttl}>{item.id} · {item.name}</div>
          </div>
          <button onClick={onClose} style={xBtn}>✕</button>
        </div>

        {/* Preview label */}
        <div style={previewWrap}>
          <div style={labelCard}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
              <span style={{ fontSize:9, background:'#eee', padding:'1px 6px', borderRadius:3, color:'#555' }}>{item.category}</span>
              <span style={{ fontSize:11, fontWeight:700, color:'#0055aa', fontFamily:'monospace' }}>{item.id}</span>
            </div>
            <div style={{ fontSize:11, fontWeight:600, color:'#111', marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.name}</div>
            <canvas ref={previewRef} style={{ width:'100%', display:'block' }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'#666', marginTop:3 }}>
              <span>{item.brand}{item.model ? ' · ' + item.model : ''}</span>
              {item.location && <span>📍{item.location}</span>}
            </div>
          </div>
        </div>

        <div style={ctrlRow}>
          <div style={ctrlBox}>
            <div style={ctrlLbl}>จำนวนที่พิมพ์</div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <button onClick={() => setQty(q => Math.max(1,q-1))} style={stepBtn}>−</button>
              <span style={{ fontFamily:'var(--mono)', fontSize:22, fontWeight:700, color:'var(--accent)', minWidth:32, textAlign:'center' }}>{qty}</span>
              <button onClick={() => setQty(q => Math.min(item.quantity, q+1))} style={stepBtn}>+</button>
            </div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>Stock คงเหลือ: <b style={{color:'var(--success)'}}>{item.quantity}</b> ชิ้น</div>
          </div>
          <div style={ctrlBox}>
            <div style={ctrlLbl}>ขนาด Label</div>
            <div style={{ fontSize:12, color:'var(--text2)', marginTop:6 }}>210 × 60 px<br/>แนวนอน · CODE128</div>
            <button onClick={() => setQty(item.quantity)} style={allBtn}>พิมพ์ทั้งหมด ({item.quantity})</button>
          </div>
        </div>

        <button onClick={handlePrint} style={printBtn}>
          🖨️ &nbsp;พิมพ์ Barcode {qty} ใบ
        </button>
      </div>
    </div>
  )
}

const overlay = { position:'fixed',inset:0,background:'rgba(0,0,0,0.78)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(4px)',padding:20 }
const modal = { background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:16,padding:14,width:'100%',maxWidth:420,boxShadow:'0 24px 60px rgba(0,0,0,0.6)' }
const hdr = { display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10 }
const subttl = { fontSize:10,color:'var(--text3)',letterSpacing:2,textTransform:'uppercase',fontFamily:'var(--mono)' }
const ttl = { fontSize:15,fontWeight:700,color:'var(--accent)',marginTop:2 }
const xBtn = { background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text2)',width:30,height:30,borderRadius:7,cursor:'pointer',fontSize:13 }
const previewWrap = { background:'#e8e8e8',borderRadius:10,padding:10,marginBottom:10,display:'flex',justifyContent:'center',border:'1px dashed #ccc' }
const labelCard = { background:'#fff',border:'1.5px solid #aaa',borderRadius:4,padding:'7px 10px',width:210,boxShadow:'0 3px 10px rgba(0,0,0,0.25)' }
const ctrlRow = { display:'flex',gap:8,marginBottom:10 }
const ctrlBox = { flex:1,background:'var(--surface2)',borderRadius:10,padding:8,border:'1px solid var(--border)' }
const ctrlLbl = { fontSize:10,color:'var(--text3)',letterSpacing:1,textTransform:'uppercase',marginBottom:4 }
const stepBtn = { background:'var(--surface)',border:'1px solid var(--border2)',color:'var(--text)',width:32,height:32,borderRadius:8,cursor:'pointer',fontSize:18 }
const allBtn = { marginTop:4,width:'100%',background:'transparent',border:'1px solid var(--border2)',color:'var(--text2)',borderRadius:7,padding:'5px 0',fontSize:11,cursor:'pointer' }
const printBtn = { width:'100%',background:'var(--accent)',color:'#000',border:'none',borderRadius:10,padding:'9px',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'var(--sans)',letterSpacing:.3 }
