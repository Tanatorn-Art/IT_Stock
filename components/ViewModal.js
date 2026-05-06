import React from 'react'
import { useRouter } from 'next/router'
import { Laptop, Monitor, Mouse, Network, Server, HardDrive, Smartphone, Tablet, Box, X, Edit, MapPin, AlertTriangle, Package } from 'lucide-react'

const ICON = {Laptop,Desktop:Monitor,Monitor,Peripheral:Mouse,Network,Server,Storage:HardDrive,Phone:Smartphone,Tablet,Other:Box}

export default function ViewModal({ item, onClose, onEdit }) {
  const router = useRouter()
  if (!item) return null

  const handleLocationClick = () => {
    if (item.location) {
      router.push(`/location?loc=${encodeURIComponent(item.location)}&item=${encodeURIComponent(item.id)}`)
    }
  }

  const low = item.quantity <= item.minQuantity
  const isOutOfStock = item.quantity === 0

  return (
    <div style={OV} onClick={onClose}>
      <div style={MO} onClick={e => e.stopPropagation()}>
        {/* Header */}
        {/* <div style={HDR}>
          <button onClick={onClose} style={XB}><X size={16} /></button>
        </div> */}

        {/* Content - Horizontal Layout */}
        <div style={CONTENT}>
          {/* Product Image - Left */}
          <div style={IMG_WRAP}>
            {item.image ? (
              <div style={{position: 'relative', width: '100%', height: '100%'}}>
                <img src={item.image} alt={item.name} style={{...IMG, filter: isOutOfStock ? 'grayscale(100%)' : 'none'}} />
                {isOutOfStock && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#dc3545',
                    fontSize: '60px',
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
              <div style={{position: 'relative', width: '100%', height: '100%'}}>
                <div style={{...NO_IMG, filter: isOutOfStock ? 'grayscale(100%)' : 'none'}}>
                  <Package size={64} style={{color:'var(--text3)'}} />
                </div>
                {isOutOfStock && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#dc3545',
                    fontSize: '60px',
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
            )}
          </div>

          {/* Product Info - Right */}
          <div style={INFO}>
            {/* Category Badge */}
            <div style={CAT_BADGE}>
              {React.createElement(ICON[item.category] || Box, {size: 14, style:{marginRight:6}})}
              {item.category}
            </div>

            {/* Product Name */}
            <div style={NAME}>{item.name}</div>

            {/* Price-like Quantity Display */}
            <div style={PRICE_WRAP}>
              <span style={PRICE_LABEL}>จำนวน</span>
              <div style={PRICE_VAL}>
                <span style={PRICE_NUM}>{item.quantity}</span>
                <span style={PRICE_UNIT}>ชิ้น</span>
              </div>
            </div>

            {/* Low Stock Alert */}
            {/* {low && (
              <div style={ALERT}>
                <AlertTriangle size={14} style={{marginRight:6}} />
                Stock ใกล้หมด (เหลือน้อยกว่า {item.minQuantity} ชิ้น)
              </div>
            )} */}

            {/* Details Grid */}
            <div style={DETAILS}>
              <div style={DETAIL_ITEM}>
                <span style={DETAIL_LBL}>ยี่ห้อ</span>
                <span style={DETAIL_VAL}>{item.brand}</span>
              </div>
              <div style={DETAIL_ITEM}>
                <span style={DETAIL_LBL}>รุ่น</span>
                <span style={DETAIL_VAL}>{item.model||'-'}</span>
              </div>
              <div style={DETAIL_ITEM}>
                <span style={DETAIL_LBL}>Serial</span>
                <span style={DETAIL_VAL}>{item.serial||'-'}</span>
              </div>
              <div style={DETAIL_ITEM}>
                <span style={DETAIL_LBL}>ตำแหน่ง</span>
                {item.location ? (
                  <span
                    style={LOCATION_LINK}
                    onClick={handleLocationClick}
                  >
                    <MapPin size={12} style={{marginRight:4}} />
                    {item.location}
                  </span>
                ) : (
                  <span style={DETAIL_VAL}>-</span>
                )}
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <div style={DESC}>
                <div style={DESC_LBL}>รายละเอียด</div>
                <div style={DESC_VAL}>{item.description}</div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {/* <div style={ACTIONS}>
          <button onClick={onClose} style={BTN_CLOSE}>ปิด</button>
        </div> */}
      </div>
    </div>
  )
}

const OV={position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20,overflowY:'auto'}
const MO={background:'#ffffff',borderRadius:16,width:'100%',maxWidth:800,boxShadow:'0 4px 24px rgba(0,0,0,0.15)',overflow:'hidden',display:'flex',flexDirection:'column'}
const HDR={display:'flex',justifyContent:'flex-end',padding:12,background:'#ffffff'}
const XB={background:'transparent',border:'none',color:'var(--text2)',width:32,height:32,borderRadius:8,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'background .15s'}
const CONTENT={display:'flex',flexDirection:'row',gap:0, padding: 10}
const IMG_WRAP={width:'400px',height:'auto',minHeight:400,background:'#ffffff',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0,padding:20}
const IMG={width:'100%',height:'100%',objectFit:'contain',borderRadius:6}
const NO_IMG={display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%',color:'var(--text3)'}
const INFO={padding:24,flex:1,display:'flex',flexDirection:'column'}
const CAT_BADGE={display:'inline-flex',alignItems:'center',padding:'6px 12px',background:'var(--accent)',color:'#ffffff',borderRadius:20,fontSize:12,fontWeight:600,marginBottom:12,width:'fit-content'}
const NAME={fontSize:22,fontWeight:700,color:'#1e293b',lineHeight:1.4,marginBottom:16}
const PRICE_WRAP={display:'flex',alignItems:'baseline',gap:8,marginBottom:12}
const PRICE_LABEL={fontSize:13,color:'var(--text3)'}
const PRICE_VAL={display:'flex',alignItems:'baseline',gap:4}
const PRICE_NUM={fontSize:28,fontWeight:700,color:'var(--accent)',fontFamily:'var(--mono)'}
const PRICE_UNIT={fontSize:14,color:'var(--text3)'}
const ALERT={display:'flex',alignItems:'center',padding:10,background:'#fef3c7',border:'1px solid #fcd34d',borderRadius:8,fontSize:13,color:'#92400e',marginBottom:16}
const DETAILS={display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}
const DETAIL_ITEM={display:'flex',flexDirection:'column',gap:4}
const DETAIL_LBL={fontSize:12,color:'var(--text3)',fontWeight:500}
const DETAIL_VAL={fontSize:14,color:'#1e293b',fontWeight:600}
const DESC={marginBottom:20}
const DESC_LBL={fontSize:12,color:'var(--text3)',fontWeight:500,marginBottom:6}
const DESC_VAL={fontSize:14,color:'#475569',lineHeight:1.6}
const ACTIONS={display:'flex',gap:12,padding:20,borderTop:'1px solid var(--border)',background:'#fafafa'}
const BTN_CLOSE={flex:1,padding:'12px 24px',background:'transparent',border:'1px solid var(--border)',borderRadius:8,fontSize:14,fontWeight:600,color:'var(--text2)',cursor:'pointer',transition:'all .15s'}
const BTN_EDIT={flex:1,padding:'12px 24px',background:'var(--accent)',border:'none',borderRadius:8,fontSize:14,fontWeight:700,color:'#ffffff',cursor:'pointer',transition:'all .15s',display:'flex',alignItems:'center',justifyContent:'center'}
const LOCATION_LINK={fontSize:14,color:'#2563eb',fontWeight:600,cursor:'pointer',textDecoration:'underline',display:'inline-flex',alignItems:'center',transition:'color .15s'}
LOCATION_LINK[':hover']={color:'#1d4ed8'}
