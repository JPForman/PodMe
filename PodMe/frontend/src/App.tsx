import { useEffect, useState } from 'react'
import './App.css'

type PingResponse = {
  message: string
}

function App() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/ping')
      .then((res) => res.json() as Promise<PingResponse>)
      .then((data) => {
        setMessage(data.message)
        setStatus('ok')
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <section id="center">
      <h1>PodMe</h1>
      {status === 'loading' && <p>Contacting backend...</p>}
      {status === 'ok' && <p>Backend says: {message}</p>}
      {status === 'error' && (
        <p>Could not reach the Laravel backend at http://127.0.0.1:8000</p>
      )}
    </section>
  )
}

export default App
