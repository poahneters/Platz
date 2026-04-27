import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: 'var(--bg)',
          padding: '40px', fontFamily: 'Inter, sans-serif',
        }}>
          <div style={{ maxWidth: '560px', width: '100%' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>
              Something went wrong
            </div>
            <pre style={{
              fontSize: '12px', color: 'var(--text-mid)', lineHeight: 1.7,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '16px', overflowX: 'auto',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {this.state.error?.message}
              {'\n\n'}
              {this.state.error?.stack?.split('\n').slice(0, 6).join('\n')}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '20px', padding: '10px 24px',
                background: 'var(--gold)', color: '#0f2d1a',
                borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              }}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
