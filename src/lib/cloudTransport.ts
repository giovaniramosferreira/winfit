interface Identity { access_token: string; user?: { id: string } }
export interface CloudRecord { data: Record<string, unknown>; updatedAt: string }
export function cloudTransport(url: string, publicKey: string, request: typeof fetch = fetch) {
  const headers = (session: Identity) => {
    if (!session.user?.id || !session.access_token) throw Error('Entre novamente para sincronizar.')
    return { apikey: publicKey, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
  }
  return {
    async remove(session: Identity, expected: string): Promise<void> {
      const response = await request(`${url}/rest/v1/user_state?id=eq.${encodeURIComponent(session.user!.id)}&updated_at=eq.${encodeURIComponent(expected)}`, {
        method: 'DELETE', headers: { ...headers(session), Prefer: 'return=representation' },
      })
      if (!response.ok) throw Error('Não foi possível excluir o backup remoto.')
      const rows: unknown = await response.json()
      if (!Array.isArray(rows) || rows.length !== 1) throw Error('O backup mudou em outro aparelho. Revise antes de excluir.')
    },
    async load(session: Identity): Promise<CloudRecord | null> {
      const h = headers(session)
      const response = await request(`${url}/rest/v1/user_state?select=data,updated_at&id=eq.${encodeURIComponent(session.user!.id)}`, { headers: h })
      if (!response.ok) throw Error('Não foi possível buscar o backup da conta. Seus dados locais foram preservados.')
      const rows: unknown = await response.json()
      if (!Array.isArray(rows)) throw Error('Resposta de backup inválida.')
      if (rows.length === 0) return null
      const row = rows[0]
      if (!row?.data || typeof row.data !== 'object' || typeof row.updated_at !== 'string' || !Number.isFinite(Date.parse(row.updated_at))) throw Error('Backup remoto inválido.')
      return { data: row.data, updatedAt: row.updated_at }
    },
    async save(session: Identity, data: Record<string, unknown>, expected: string | null): Promise<void> {
      const h = headers(session)
      const updatedAt = new Date(Math.max(Date.now(), expected ? Date.parse(expected) + 1 : 0)).toISOString()
      const path = expected ? `?id=eq.${encodeURIComponent(session.user!.id)}&updated_at=eq.${encodeURIComponent(expected)}` : ''
      const response = await request(`${url}/rest/v1/user_state${path}`, {
        method: expected ? 'PATCH' : 'POST', headers: { ...h, Prefer: 'return=representation' },
        body: JSON.stringify(expected ? { data, updated_at: updatedAt } : { id: session.user!.id, data, updated_at: updatedAt }),
      })
      if (response.status === 409) throw Error('O backup mudou em outro aparelho. Revise novamente antes de enviar.')
      if (!response.ok) throw Error('Falha ao enviar backup. Seus dados continuam neste aparelho.')
      const rows: unknown = await response.json()
      if (!Array.isArray(rows) || rows.length !== 1) throw Error('O backup mudou em outro aparelho. Revise novamente antes de enviar.')
    },
  }
}
