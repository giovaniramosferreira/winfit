import { useState } from 'react'
import { useStore } from '../lib/store'
import { getRelayUrl, getShortcutEndpoints, setCustomRelayUrl, type SyncState } from '../lib/watchSync'

export default function WatchModal({
  onClose,
  syncState = 'idle',
}: {
  onClose: () => void
  syncState?: SyncState
}) {
  const watchToken = useStore((s) => s.watchToken)
  const setWatchToken = useStore((s) => s.setWatchToken)

  const [copied, setCopied] = useState<string | null>(null)
  const [editingToken, setEditingToken] = useState(false)
  const [tempToken, setTempToken] = useState(watchToken)
  const [customServer, setCustomServer] = useState(false)
  const [tempRelay, setTempRelay] = useState(getRelayUrl())

  const endpoints = getShortcutEndpoints(watchToken)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(null), 2500)
    })
  }

  const handleSaveToken = () => {
    if (tempToken.trim()) {
      setWatchToken(tempToken)
    }
    setEditingToken(false)
  }

  const handleSaveRelay = () => {
    setCustomRelayUrl(tempRelay)
    setCustomServer(false)
  }

  const statusLabel: Record<SyncState, { text: string; color: string }> = {
    idle: { text: '⚪ Aguardando início do treino', color: 'var(--text-dim)' },
    connecting: { text: '🟡 Conectando ao relay...', color: 'var(--gold)' },
    connected: { text: '🟢 Conectado em tempo real', color: 'var(--green)' },
    error: { text: '🔴 Reconectando ao relay...', color: 'var(--red)' },
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
      >
        <div className="between">
          <h2>⌚ Apple Watch & Atalhos</h2>
          <button className="btn-quiet" onClick={onClose} style={{ minHeight: 32, fontSize: 18 }}>
            ✕
          </button>
        </div>

        <p className="small muted" style={{ marginTop: 4 }}>
          Controle seu treino e receba a vibração do timer direto no pulso.
        </p>

        {/* Status de Conexão */}
        <div
          className="card"
          style={{
            marginTop: 14,
            padding: '10px 14px',
            borderColor: syncState === 'connected' ? 'rgba(62,207,142,0.4)' : 'var(--line)',
          }}
        >
          <div className="between">
            <span className="tiny muted">Status do Sync</span>
            <span className="tiny num font-bold" style={{ color: statusLabel[syncState].color }}>
              {statusLabel[syncState].text}
            </span>
          </div>
        </div>

        {/* Token de Pareamento */}
        <div className="card" style={{ marginTop: 12, padding: '12px 14px' }}>
          <div className="between">
            <span className="small muted">Seu Token de Pareamento</span>
            <button className="tiny accent-text" onClick={() => setEditingToken(!editingToken)}>
              {editingToken ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {!editingToken ? (
            <div className="between" style={{ marginTop: 8 }}>
              <span className="num" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.05em' }}>
                {watchToken}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: '6px 12px', minHeight: 34 }}
                onClick={() => copyToClipboard(watchToken, 'token')}
              >
                {copied === 'token' ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 8 }}>
              <input
                type="text"
                className="code-box"
                value={tempToken}
                onChange={(e) => setTempToken(e.target.value.toUpperCase())}
                style={{ width: '100%', fontSize: 16, padding: 8 }}
                placeholder="WF-XXXX"
              />
              <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={handleSaveToken}>
                Salvar Token
              </button>
            </div>
          )}
        </div>

        {/* Como Configurar os Atalhos */}
        <h3 style={{ marginTop: 18, fontSize: 15 }}>Como configurar no Apple Watch (2 min)</h3>
        <p className="tiny faint" style={{ marginTop: 2 }}>
          Crie um atalho no app <b>Atalhos</b> do seu iPhone. Ele aparece automaticamente no seu relógio!
        </p>

        {/* Atalho 1: Bater Série */}
        <div className="card" style={{ marginTop: 10, padding: '12px 14px' }}>
          <div className="between">
            <div>
              <h4 style={{ fontSize: 14 }}>⚡ 1. Atalho "Bater Série"</h4>
              <p className="tiny muted">Bate a série na hora e inicia o timer de descanso no relógio.</p>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <span className="tiny faint">Ação no app Atalhos:</span>
            <ol className="tiny muted" style={{ paddingLeft: 16, marginTop: 4, lineHeight: 1.5 }}>
              <li>Adicionar ação: <b>Obter Conteúdo do URL</b></li>
              <li>Colar o URL abaixo (Método GET):</li>
            </ol>
            <div className="code-box" style={{ marginTop: 6 }}>
              {endpoints.quickLog}
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 6, width: '100%', minHeight: 34, fontSize: 13 }}
              onClick={() => copyToClipboard(endpoints.quickLog, 'quickLog')}
            >
              {copied === 'quickLog' ? '✓ URL Copiado!' : 'Copiar URL do Atalho'}
            </button>
            <li className="tiny muted" style={{ marginLeft: 16, marginTop: 6 }}>
              (Opcional) Adicionar ação: <b>Iniciar Timer de 90 segundos</b> → para o relógio vibrar quando o descanso acabar!
            </li>
          </div>
        </div>

        {/* Atalho 2: +30s Descanso */}
        <div className="card" style={{ marginTop: 10, padding: '12px 14px' }}>
          <div>
            <h4 style={{ fontSize: 14 }}>⏳ 2. Atalho "+30s Descanso"</h4>
            <p className="tiny muted">Adiciona 30 segundos ao timer do app sem tocar no celular.</p>
          </div>
          <div className="code-box" style={{ marginTop: 6 }}>
            {endpoints.addRest}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 6, width: '100%', minHeight: 34, fontSize: 13 }}
            onClick={() => copyToClipboard(endpoints.addRest, 'addRest')}
          >
            {copied === 'addRest' ? '✓ URL Copiado!' : 'Copiar URL +30s'}
          </button>
        </div>

        {/* Atalho 3: Consultar Treino */}
        <div className="card" style={{ marginTop: 10, padding: '12px 14px' }}>
          <div>
            <h4 style={{ fontSize: 14 }}>📊 3. Atalho "Status do Treino"</h4>
            <p className="tiny muted">A Siri fala no seu fone ou o relógio mostra qual o próximo exercício e peso.</p>
          </div>
          <div className="code-box" style={{ marginTop: 6 }}>
            {endpoints.statusText}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 6, width: '100%', minHeight: 34, fontSize: 13 }}
            onClick={() => copyToClipboard(endpoints.statusText, 'statusText')}
          >
            {copied === 'statusText' ? '✓ URL Copiado!' : 'Copiar URL de Status'}
          </button>
        </div>

        {/* Configurações Avançadas */}
        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <button className="tiny faint" onClick={() => setCustomServer(!customServer)}>
            {customServer ? 'Ocultar configurações do servidor' : '⚙️ Servidor Relay Personalizado'}
          </button>
          {customServer && (
            <div className="card" style={{ marginTop: 8, textAlign: 'left' }}>
              <label className="tiny faint">URL do Relay Cloudflare Worker:</label>
              <input
                type="text"
                className="code-box"
                value={tempRelay}
                onChange={(e) => setTempRelay(e.target.value)}
                style={{ width: '100%', marginTop: 4, padding: 6 }}
              />
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 8 }}
                onClick={handleSaveRelay}
              >
                Salvar Servidor
              </button>
            </div>
          )}
        </div>

        <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  )
}
