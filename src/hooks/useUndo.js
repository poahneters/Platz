import { useState, useRef } from 'react'

export function useUndo() {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  function showUndo(label, onUndo) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setToast(null)
      timerRef.current = null
    }, 5000)
    setToast({
      label,
      onUndo: () => {
        clearTimeout(timerRef.current)
        timerRef.current = null
        setToast(null)
        onUndo()
      },
    })
  }

  return { undoToast: toast, showUndo }
}
