import { useEffect, useRef } from 'react'

export default function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    function onDown(e) {
      if (!ref.current?.contains(e.target)) onClose()
    }
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    document.addEventListener('scroll', onClose, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('scroll', onClose, true)
    }
  }, [onClose])

  const menuW = 160
  const estH = items.length * 34 + 8
  const left = Math.min(x, window.innerWidth - menuW - 8)
  const top = Math.min(y, window.innerHeight - estH - 8)

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 9999,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
        padding: '4px',
        minWidth: `${menuW}px`,
      }}
    >
      {items.map((item, i) =>
        item === 'separator' ? (
          <div key={i} style={{ height: '1px', background: 'var(--border)', margin: '3px 4px' }} />
        ) : (
          <button
            key={i}
            onClick={() => { item.onClick(); onClose() }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '7px 12px',
              fontSize: '13px',
              color: item.danger ? '#c47a7a' : 'var(--text)',
              borderRadius: '5px',
              background: 'transparent',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  )
}
