// components/Shelfmap.js
import { useCallback } from 'react'

function locKey(col, row) {
  return `${col}-${row}`
}

function buildMap(locations, nameMatch) {
  const map = {}
  locations.forEach(loc => {
    let col = loc.col
    let row = loc.row
    if (!col || !row) {
      const match = (loc.name || '').match(nameMatch)
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

function ShelfSVG({ shelf, defaults, locationMap, selected, onSelect }) {
  const COLS = shelf.cols
  const ROWS = shelf.rows
  const COL_W = shelf.colW
  const ROW_H = defaults.rowH
  const BEAM_H = defaults.beamH
  const UPRIGHT_W = defaults.uprightW
  const PAD = defaults.pad
  const LABEL_W = 28   // row label column width
  const HEADER_H = 20  // col header row height
  const X0 = LABEL_W
  const Y0 = HEADER_H

  const BEAM_COLOR = defaults.beamColor
  const UPRIGHT_COLOR = defaults.uprightColor
  const FILLED_COLOR = defaults.filledColor
  const EMPTY_COLOR = defaults.emptyColor
  const SELECTED_COLOR = defaults.selectedColor

  const NAME_REPLACE = new RegExp(defaults.nameReplacePattern, defaults.nameReplaceFlags)

  const totalW = X0 + COLS.length * COL_W + UPRIGHT_W + 4
  const totalH = Y0 + ROWS.length * (ROW_H + BEAM_H) + BEAM_H + 8

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      width="100%"
      preserveAspectRatio="xMidYMin meet"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* ── Column headers ── */}
      {COLS.map((col, ci) => {
        const uprightX = X0 + ci * COL_W
        const cellX = uprightX + UPRIGHT_W + PAD
        const cellW = COL_W - UPRIGHT_W - PAD * 2
        return (
          <text
            key={col}
            x={cellX + cellW / 2}
            y={HEADER_H / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fill="var(--text3, #666)"
            fontFamily="var(--mono, monospace)"
          >
            {col}
          </text>
        )
      })}

      {/* ── Rows ── */}
      {ROWS.map((row, ri) => {
        const ry = Y0 + ri * (ROW_H + BEAM_H)
        return (
          <g key={row}>
            {/* Row label */}
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

            {/* Beam */}
            <rect
              x={X0} y={ry}
              width={COLS.length * COL_W + UPRIGHT_W}
              height={BEAM_H}
              rx={2}
              fill={BEAM_COLOR}
            />

            {/* Cells */}
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
                  <rect
                    x={uprightX} y={ry}
                    width={UPRIGHT_W}
                    height={ROW_H + BEAM_H}
                    rx={2}
                    fill={UPRIGHT_COLOR}
                  />
                  {loc ? (
                    <g style={{ cursor: 'pointer' }} onClick={() => onSelect(key, loc)}>
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
                        fill={isSel ? shelf.labelTextFill[0] : shelf.labelTextFill[1]}
                        fontFamily="var(--mono, monospace)"
                      >
                        {col}-{row}
                      </text>
                      <text
                        x={cellX + cellW / 2} y={cellY + cellH / 2 + 9}
                        textAnchor="middle" dominantBaseline="central"
                        fontSize={10}
                        fill={isSel ? shelf.detailTextFill[0] : shelf.detailTextFill[1]}
                      >
                        {(() => {
                          const short = (loc.name || '').replace(NAME_REPLACE, '').trim() || loc.name || ''
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

      {/* Right upright & bottom beam */}
      <rect
        x={X0 + COLS.length * COL_W} y={Y0}
        width={UPRIGHT_W}
        height={ROWS.length * (ROW_H + BEAM_H)}
        rx={2} fill={UPRIGHT_COLOR}
      />
      <rect
        x={X0} y={Y0 + ROWS.length * (ROW_H + BEAM_H)}
        width={COLS.length * COL_W + UPRIGHT_W}
        height={BEAM_H}
        rx={2} fill={BEAM_COLOR}
      />
    </svg>
  )
}

export default function ShelfMap({ shelfId, config, locations = [], selectedLocation, onLocationSelect }) {
  const shelf = config?.shelves?.find(s => s.id === shelfId)
  const defaults = config?.defaults

  if (!shelf || !defaults) {
    return (
      <div style={{ color: 'var(--text3)', fontSize: 12, padding: 20 }}>
        ไม่พบการตั้งค่าชั้น &quot;{shelfId}&quot;
      </div>
    )
  }

  const nameMatch = new RegExp(shelf.nameMatchPattern, shelf.nameMatchFlags)
  const locationMap = buildMap(locations, nameMatch)

  const handleSelect = useCallback((key, loc) => {
    onLocationSelect?.(loc)
  }, [onLocationSelect])

  const filledCount = Object.keys(locationMap).length
  const totalSlots = shelf.cols.length * shelf.rows.length

  const getSelectedKey = () => {
    if (!selectedLocation) return null
    let col = selectedLocation.col
    let row = selectedLocation.row
    if (!col || !row) {
      const match = (selectedLocation.name || '').match(nameMatch)
      if (match) { col = match[1]; row = parseInt(match[2]) }
    }
    return col && row ? locKey(col, row) : null
  }
  const selectedKey = getSelectedKey()

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header: name + legend */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 8,
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {shelf.name || shelf.id}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: defaults.filledColor, display: 'inline-block' }} />
            มี location ({filledCount})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: defaults.emptyColor, opacity: .5, display: 'inline-block' }} />
            ว่าง ({totalSlots - filledCount})
          </span>
        </div>
      </div>

      {/* SVG fills remaining space, scales with container */}
      <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
        <ShelfSVG
          shelf={shelf}
          defaults={defaults}
          locationMap={locationMap}
          selected={selectedKey}
          onSelect={handleSelect}
        />
      </div>
    </div>
  )
}