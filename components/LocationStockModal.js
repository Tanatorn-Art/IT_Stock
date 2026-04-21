const ICON = {Laptop:'💻',Desktop:'🖥️',Monitor:'🖥',Peripheral:'🖱️',Network:'🌐',Server:'🗄️',Storage:'💾',Phone:'📱',Tablet:'📲',Other:'📦'}

export default function LocationStockModal({ location, stockItems, onClose, onItemClick }) {
  if (!location) return null

  const filteredStock = stockItems.filter(item => item.location === location.name)

  return (
    <div style={OV} onClick={onClose}>
      <div style={MO} onClick={e => e.stopPropagation()}>
        <div style={HDR}>
          <div>
            <div style={SUB}>สินค้าในตำแหน่ง</div>
            <div style={TTL}>{location.name}</div>
          </div>
          <button onClick={onClose} style={XB}>✕</button>
        </div>

        <div style={DESC}>{location.description || '-'}</div>

        {filteredStock.length === 0 ? (
          <div style={EMPTY}>
            <div style={{fontSize:40,marginBottom:8}}>📦</div>
            <div style={{fontSize:13,color:'var(--text3)'}}>ไม่มีสินค้าในตำแหน่งนี้</div>
          </div>
        ) : (
          <div style={GRID}>
            {filteredStock.map(item => (
              <div
                key={item.id}
                style={CARD}
                onClick={() => onItemClick && onItemClick(item)}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    style={CARD_IMG}
                  />
                ) : (
                  <div style={CARD_NO_IMG}>{ICON[item.category]||'📦'}</div>
                )}
                <div style={CARD_BODY}>
                  <div style={CARD_ID}>{item.id}</div>
                  <div style={CARD_NAME}>{item.name}</div>
                  <div style={CARD_BRAND}>{item.brand} {item.model||''}</div>
                  <div style={CARD_QTY}>
                    <span style={CARD_QTY_NUM}>{item.quantity}</span>
                    <span style={CARD_QTY_LABEL}>ชิ้น</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:12}}>
          <button onClick={onClose} style={CB}>ปิด</button>
        </div> */}
      </div>
    </div>
  )
}

const OV = {
  position:'fixed',
  inset:0,
  background:'rgba(0,0,0,0.8)',
  display:'flex',
  alignItems:'center',
  justifyContent:'center',
  zIndex:1000,
  backdropFilter:'blur(4px)',
  padding:20,
  overflowY:'auto'
}

const MO = {
  background:'var(--surface)',
  border:'1px solid var(--border2)',
  borderRadius:16,
  padding:16,
  width:'100%',
  maxWidth:900,
  maxHeight:'80vh',
  overflowY:'auto',
  boxShadow:'0 24px 60px rgba(0,0,0,0.6)'
}

const HDR = {
  display:'flex',
  justifyContent:'space-between',
  alignItems:'flex-start',
  marginBottom:12
}

const SUB = {
  fontSize:10,
  color:'var(--text3)',
  letterSpacing:2,
  textTransform:'uppercase',
  fontFamily:'var(--mono)'
}

const TTL = {
  fontSize:17,
  fontWeight:700,
  color:'var(--accent)',
  marginTop:2,
  fontFamily:'var(--mono)'
}

const XB = {
  background:'var(--surface2)',
  border:'1px solid var(--border)',
  color:'var(--text2)',
  width:30,
  height:30,
  borderRadius:7,
  cursor:'pointer',
  fontSize:13
}

const DESC = {
  fontSize:13,
  color:'var(--text2)',
  marginBottom:16,
  paddingBottom:12,
  borderBottom:'1px solid var(--border)'
}

const EMPTY = {
  padding:'40px 20px',
  textAlign:'center',
  background:'var(--surface2)',
  borderRadius:12
}

const GRID = {
  display:'grid',
  gridTemplateColumns:'repeat(3,1fr)',
  gap:12,
  maxHeight:500,
  overflowY:'auto'
}

const CARD = {
  background:'var(--surface2)',
  border:'1px solid var(--border)',
  borderRadius:10,
  overflow:'hidden',
  cursor:'pointer',
  transition:'all .15s',
  ':hover': {
    background:'var(--surface3)',
    borderColor:'var(--border2)',
    transform:'translateY(-2px)'
  }
}

const CARD_IMG = {
  width:'100%',
  height:140,
  objectFit:'cover',
  display:'block'
}

const CARD_NO_IMG = {
  width:'100%',
  height:140,
  background:'var(--surface3)',
  display:'flex',
  alignItems:'center',
  justifyContent:'center',
  fontSize:40
}

const CARD_BODY = {
  padding:10
}

const CARD_ID = {
  fontSize:10,
  color:'var(--accent)',
  fontFamily:'var(--mono)',
  marginBottom:4
}

const CARD_NAME = {
  fontSize:12,
  fontWeight:600,
  color:'var(--text)',
  marginBottom:4,
  lineHeight:1.3
}

const CARD_BRAND = {
  fontSize:10,
  color:'var(--text3)',
  marginBottom:6
}

const CARD_QTY = {
  display:'flex',
  justifyContent:'space-between',
  alignItems:'center'
}

const CARD_QTY_NUM = {
  fontSize:14,
  fontWeight:700,
  color:'var(--success)',
  fontFamily:'var(--mono)'
}

const CARD_QTY_LABEL = {
  fontSize:10,
  color:'var(--text3)'
}

const CB = {
  background:'transparent',
  border:'1px solid var(--border2)',
  color:'var(--text2)',
  borderRadius:8,
  padding:'7px 16px',
  fontSize:13,
  cursor:'pointer'
}
