import { useState } from 'react'
import { useStore } from '../lib/store'
import { privacy, usePrivacy } from '../lib/privacy'
import {
  getRelayUrl,
  getShortcutEndpoints,
  setCustomRelayUrl,
  OFFICIAL_ICLOUD_SHORTCUT_URL,
  type SyncState,
} from '../lib/watchSync'

export default function WatchModal({
  onClose,
  syncState = 'idle',
}: {
  onClose: () => void
  syncState?: SyncState
}) {
  const watchToken = useStore((s) => s.watchToken)
  const preference = usePrivacy()
  const destination = getRelayUrl().replace(/\/+$/, '')
  const enabled = preference.watchDestination === destination
  const setWatchToken = useStore((s) => s.setWatchToken)

  const [copied, setCopied] = useState<string | null>(null)
  const [installing, setInstalling] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [editingToken, setEditingToken] = useState(false)
  const [tempToken, setTempToken] = useState(watchToken)
  const [tempRelay, setTempRelay] = useState(getRelayUrl())
  const [relayError, setRelayError] = useState('')

  const endpoints = getShortcutEndpoints(watchToken)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(null), 2500)
    })
  }

  const handleInstallShortcut = () => {
    navigator.clipboard?.writeText(watchToken)
    setInstalling(true)
    setTimeout(() => setInstalling(false), 3000)
    window.open(OFFICIAL_ICLOUD_SHORTCUT_URL, '_blank')
  }

  const handleSaveToken = () => {
    if (tempToken.trim()) {
      setWatchToken(tempToken.trim().toUpperCase())
    }
    setEditingToken(false)
  }

  const handleSaveRelay = () => {
    try {
      const parsed = new URL(tempRelay)
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw Error('Use HTTPS sem credenciais no endereço.')
      privacy.setWatchDestination(null)
      setCustomRelayUrl(tempRelay); setRelayError('Destino salvo. Ative novamente para autorizar este endereço.')
    } catch { setRelayError('Endereço inválido. Use uma URL HTTPS completa.') }
  }

  const statusLabel: Record<SyncState, { text: string; color: string }> = {
    idle: { text: 'Aguardando início do treino', color: 'var(--text-dim)' },
    connecting: { text: 'Conectando ao relay…', color: 'var(--warn)' },
    connected: { text: 'Conectado em tempo real', color: 'var(--green)' },
    error: { text: 'Reconectando ao relay…', color: 'var(--red)' },
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="between">
          <h2>Apple Watch</h2>
          <button className="btn-quiet" onClick={onClose} style={{ minHeight: 32, fontSize: 18 }}>
            ✕
          </button>
        </div>

        <p className="small muted" style={{ marginTop: 4 }}>
          Bata séries e receba a vibração do timer direto no pulso.
        </p>
        {relayError && <p role="status" className="small">{relayError}</p>}
        <section className="card" style={{ marginTop: 12 }}>
          <h3>{enabled ? 'Envio ao Watch ativado' : 'Envio ao Watch desativado'}</h3>
          <p className="small muted" style={{ marginTop: 8 }}>Ao ativar, exercício atual, carga/repetições, séries e descanso são enviados para <b>{new URL(destination).hostname}</b>, usando seu código de pareamento. O relay permite consultar esse estado e enviar comandos a quem tiver o código. Não compartilhe o código.</p>
          <p className="tiny muted" style={{ marginTop: 8 }}>Desligar interrompe novos envios e comandos neste aparelho. Não confirma exclusão do estado já recebido pelo relay; não há garantia de prazo de retenção configurada no aplicativo.</p>
          <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => privacy.setWatchDestination(enabled ? null : destination)}>
            {enabled ? 'Desativar envio ao Watch' : 'Ativar envio ao Watch'}
          </button>
          {preference.error && <p role="alert" className="small">{preference.error}</p>}
        </section>

        {/* Status de Conexão */}
        <div
          className="card"
          style={{
            marginTop: 14,
            padding: '10px 14px',
            borderColor: syncState === 'connected' ? 'var(--green)' : 'var(--line)',
          }}
        >
          <div className="between">
            <span className="tiny muted">Status da Sincronização</span>
            <span className="tiny num font-bold" style={{ color: statusLabel[syncState].color }}>
              {statusLabel[syncState].text}
            </span>
          </div>
        </div>

        {/* Card Principal: 1-Click Install */}
        <div
          className="card"
          style={{
            marginTop: 12,
            padding: '16px',
            background: 'var(--bg-elev)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
          }}
        >
          <button
            className="btn btn-primary"
            style={{
              width: '100%',
              fontSize: 16,
              fontWeight: 700,
              padding: '14px 16px',
            }}
            onClick={handleInstallShortcut}
          >
            <span>{installing ? '✓ Abrindo o app Atalhos...' : 'Adicionar ao Apple Watch (1 Toque)'}</span>
          </button>

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
              <span className="step-n">1</span>
              <p className="tiny muted" style={{ margin: 0, lineHeight: 1.4 }}>
                Ao tocar no botão acima, seu iPhone abrirá a janela nativa da Apple.
              </p>
            </div>
            <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
              <span className="step-n">2</span>
              <p className="tiny muted" style={{ margin: 0, lineHeight: 1.4 }}>
                Toque no botão azul <b>"Adicionar Atalho"</b>.
              </p>
            </div>
            <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
              <span className="step-n">3</span>
              <p className="tiny muted" style={{ margin: 0, lineHeight: 1.4 }}>
                Pronto! O atalho <b>WinFit</b> já aparecerá no seu relógio e na lista de Complicações.
              </p>
            </div>
          </div>
        </div>

        {/* Token do Usuário */}
        <div className="card" style={{ marginTop: 12, padding: '12px 14px' }}>
          <div className="between">
            <span className="tiny muted">Seu Token de Pareamento</span>
            <button className="tiny accent-text" onClick={() => setEditingToken(!editingToken)}>
              {editingToken ? 'Cancelar' : 'Alterar'}
            </button>
          </div>

          {!editingToken ? (
            <div className="between" style={{ marginTop: 6 }}>
              <span className="num font-bold" style={{ fontSize: 18, letterSpacing: '0.05em' }}>
                {watchToken}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 10px', minHeight: 30, fontSize: 12 }}
                onClick={() => copyToClipboard(watchToken, 'token')}
              >
                {copied === 'token' ? '✓ Copiado' : 'Copiar Token'}
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 8 }}>
              <input
                type="text"
                className="code-box"
                value={tempToken}
                onChange={(e) => setTempToken(e.target.value.toUpperCase())}
                style={{ width: '100%', fontSize: 14, padding: 8 }}
                placeholder="WF-XXXX"
              />
              <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={handleSaveToken}>
                Salvar Token
              </button>
            </div>
          )}
        </div>

        {/* Menu Avançado / Manual (Colapsado por padrão) */}
        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <button
            className="tiny faint"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ textDecoration: 'underline' }}
          >
            {showAdvanced ? 'Ocultar opções avançadas' : 'Opções manuais e URLs'}
          </button>
        </div>

        {showAdvanced && (
          <div className="stack" style={{ marginTop: 12 }}>
            <div className="card" style={{ padding: '10px 12px' }}>
              <span className="tiny muted font-bold">URL Bater Série:</span>
              <div className="code-box" style={{ marginTop: 4 }}>
                {endpoints.quickLog}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 6, width: '100%', minHeight: 28, fontSize: 11 }}
                onClick={() => copyToClipboard(endpoints.quickLog, 'quickLog')}
              >
                {copied === 'quickLog' ? '✓ Copiado' : 'Copiar URL'}
              </button>
            </div>

            <div className="card" style={{ padding: '10px 12px' }}>
              <span className="tiny muted font-bold">URL +30s Descanso:</span>
              <div className="code-box" style={{ marginTop: 4 }}>
                {endpoints.addRest}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 6, width: '100%', minHeight: 28, fontSize: 11 }}
                onClick={() => copyToClipboard(endpoints.addRest, 'addRest')}
              >
                {copied === 'addRest' ? '✓ Copiado' : 'Copiar URL'}
              </button>
            </div>

            <div className="card" style={{ padding: '10px 12px' }}>
              <label className="tiny muted font-bold">Relay Cloudflare Worker:</label>
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
          </div>
        )}

        <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  )
}
