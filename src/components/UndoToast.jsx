export default function UndoToast({ toast }) {
  if (!toast) return null
  return (
    <div style={{
      position: 'fixed',
      bottom: '90px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      fontSize: '13px',
      color: 'var(--text-mid)',
      zIndex: 500,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      whiteSpace: 'nowrap',
      animation: 'fadeSlideIn 0.3s ease',
    }}>
      <span>{toast.label}</span>
      <button
        onClick={toast.onUndo}
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--gold)',
          letterSpacing: '0.02em',
        }}
      >
        Undo
      </button>
    </div>
  )
}
