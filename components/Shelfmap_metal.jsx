import { useState, useEffect, useCallback } from 'react'
import LocationStockModal from './LocationStockModal'

const COLS = ['E']
const ROWS = [6, 5, 4, 3, 2, 1]

const BEAM_COLOR = '#F59E0B'
const UPRIGHT_COLOR = '#3B82F6'
const FILLED_COLOR = '#10B981'
const EMPTY_COLOR = '#E2E8F0'
const SELECTED_COLOR = '#1E40AF'

function locKey(col, row) {
  return `${col}-${row}`
}

function buildMap(locations) {
  const map = {}
  locations.forEach(loc => {
    let col = loc.col
    let row = loc.row

    if (!col || !row) {
      const match = (loc.name || '').match(/([E])[^0-9]*([1-6])/)
      if (match) {
        col = match[1]
        row = parseInt(match[2])
      }
    }

    if (col && row) {
      map[locKey(col, parseInt(row))] = loc
    }
  })
  return map
}

function ShelfSVG({ locationMap, selected, onSelect }) {
  const COL_W = 553
  const ROW_H = 65
  const BEAM_H = 6
  const UPRIGHT_W = 6
  const PAD = 4
  const X0 = 35
  const Y0 = 10

  const totalW = X0 + COLS.length * COL_W + UPRIGHT_W + 4
  const totalH = Y0 + ROWS.length * (ROW_H + BEAM_H) + BEAM_H + 8

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      width="100%"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {ROWS.map((row, ri) => {
        const ry = Y0 + ri * (ROW_H + BEAM_H)
        return (
          <g key={row}>
            <text
              x={X0 - 6}
              y={ry + BEAM_H + ROW_H / 2}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={10}
              fill="var(--text3, #666)"
              fontFamily="var(--mono, monospace)"
            >
              {row}
            </text>

            <rect x={X0} y={ry} width={COLS.length * COL_W + UPRIGHT_W} height={BEAM_H} rx={2} fill={BEAM_COLOR} />

            {COLS.map((col, ci) => {
              const uprightX = X0 + ci * COL_W
              const cellX = uprightX + UPRIGHT_W + PAD
              const cellY = ry + BEAM_H + PAD
              const cellW = COL_W - UPRIGHT_W - PAD * 2
              const cellH = ROW_H - PAD * 2

              const key = locKey(col, row)
              const loc = locationMap[key]
              const isSel = selected === key

              return (
                <g key={col}>
                  <rect x={uprightX} y={ry} width={UPRIGHT_W} height={ROW_H + BEAM_H} rx={2} fill={UPRIGHT_COLOR} />

                  {loc ? (
                    <g
                      style={{ cursor: 'pointer' }}
                      onClick={() => onSelect(key, loc)}
                    >
                      <rect
                        x={cellX} y={cellY} width={cellW} height={cellH} rx={5}
                        fill={isSel ? SELECTED_COLOR : FILLED_COLOR}
                        stroke={isSel ? '#0C447C' : 'none'}
                        strokeWidth={isSel ? 2.5 : 0}
                        style={{ transition: 'fill .15s, opacity .15s' }}
                      />
                      <text
                        x={cellX + cellW / 2} y={cellY + cellH / 2 - 9}
                        textAnchor="middle" dominantBaseline="central"
                        fontSize={12} fontWeight={600}
                        fill={isSel ? '#DBEAFE' : '#D1FAE5'}
                        fontFamily="var(--mono, monospace)"
                      >
                        {col}-{row}
                      </text>
                      <text
                        x={cellX + cellW / 2} y={cellY + cellH / 2 + 9}
                        textAnchor="middle" dominantBaseline="central"
                        fontSize={10}
                        fill={isSel ? '#FFFFFF' : '#FFFFFF'}
                      >
                        {(() => {
                          const short = (loc.name || '').replace(/ชั้น\s+[A-D]-\d+\s*/i, '').trim() || loc.name || ''
                          return short.length > 11 ? short.slice(0, 10) + '…' : short
                        })()}
                      </text>
                    </g>
                  ) : (
                    <g>
                      <rect
                        x={cellX} y={cellY} width={cellW} height={cellH} rx={5}
                        fill={EMPTY_COLOR} opacity={0.4}
                      />
                      <text
                        x={cellX + cellW / 2} y={cellY + cellH / 2}
                        textAnchor="middle" dominantBaseline="central"
                        fontSize={11} fill="#94A3B8"
                      >
                        ว่าง
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </g>
        )
      })}

      <rect
        x={X0 + COLS.length * COL_W}
        y={Y0}
        width={UPRIGHT_W}
        height={ROWS.length * (ROW_H + BEAM_H)}
        rx={2}
        fill={UPRIGHT_COLOR}
      />
      <rect
        x={X0}
        y={Y0 + ROWS.length * (ROW_H + BEAM_H)}
        width={COLS.length * COL_W + UPRIGHT_W}
        height={BEAM_H}
        rx={2}
        fill={BEAM_COLOR}
      />
    </svg>
  )
}

function DetailPanel({ loc, onClose }) {
  if (!loc) return null
  return (
    <div style={{
      marginTop: 14,
      background: 'var(--surface, #f8fafc)',
      border: '1px solid var(--border, #cbd5e1)',
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      animation: 'fadein .2s ease',
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 8, flexShrink: 0,
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>
        📍
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--text3, #666)', fontFamily: 'var(--mono)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 }}>
          {loc.id}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          {loc.name}
        </div>
        {loc.description
          ? <div style={{ fontSize: 13, color: 'var(--text2, #475569)' }}>{loc.description}</div>
          : <div style={{ fontSize: 13, color: 'var(--text3, #666)', fontStyle: 'italic' }}>ไม่มีรายละเอียด</div>
        }
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'transparent', border: '1px solid var(--border2, #94a3b8)',
          color: 'var(--text2, #475569)', borderRadius: 6, width: 26, height: 26,
          cursor: 'pointer', fontSize: 11, flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  )
}

export default function ShelfMap({ locations = [], selectedLocation, onLocationSelect }) {
  const locationMap = buildMap(locations)

  const handleSelect = useCallback((key, loc) => {
    onLocationSelect?.(loc)
  }, [onLocationSelect])

  const filledCount = Object.keys(locationMap).length
  const totalSlots = COLS.length * ROWS.length

  const getSelectedKey = () => {
    if (!selectedLocation) return null
    let col = selectedLocation.col
    let row = selectedLocation.row
    if (!col || !row) {
      const match = (selectedLocation.name || '').match(/([E])[^0-9]*([1-6])/)
      if (match) {
        col = match[1]
        row = parseInt(match[2])
      }
    }
    return col && row ? locKey(col, row) : null
  }
  const selectedKey = getSelectedKey()

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}></div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: FILLED_COLOR, display: 'inline-block' }} />
            มี location ({filledCount})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: EMPTY_COLOR, opacity: .5, display: 'inline-block' }} />
            ว่าง ({totalSlots - filledCount})
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(1, 1fr)', gap: 0, marginBottom: 4 }}>
        <div />
        {COLS.map(c => (
          <div key={c} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
            {c}
          </div>
        ))}
      </div>

      <ShelfSVG
        locationMap={locationMap}
        selected={selectedKey}
        onSelect={handleSelect}
      />
    </div>
  )
}