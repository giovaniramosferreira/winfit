import assert from 'node:assert/strict'
import { createElement as h } from 'react'
import { renderToStaticMarkup as render } from 'react-dom/server'
const { Alert, Badge, Button, Card, Field } = await import('../src/components/ui')

// Button: variantes, tamanho, ícone, tipo padrão seguro e estados.
assert.match(render(h(Button, null, 'Salvar')), /^<button type="button" class="btn btn-primary">Salvar<\/button>$/)
assert.match(render(h(Button, { variant: 'secondary', small: true }, 'Ok')), /class="btn btn-ghost btn-sm"/)
assert.match(render(h(Button, { variant: 'danger' }, 'Excluir')), /btn-danger/)
assert.match(render(h(Button, { type: 'submit' }, 'Enviar')), /type="submit"/)
assert.match(render(h(Button, { disabled: true }, 'X')), /disabled/)
assert.match(render(h(Button, { icon: 'plus' }, 'Novo')), /<svg[^>]*icon-plus/)

// Badge: sempre com texto; tons mapeados.
assert.match(render(h(Badge, { tone: 'success' }, 'Concluído')), /class="pill success">Concluído</)
assert.match(render(h(Badge, null, 'Neutro')), /class="pill">Neutro</)

// Alert: erro anunciado como alert, demais como status.
assert.match(render(h(Alert, { tone: 'danger' }, 'Falhou')), /role="alert"/)
assert.match(render(h(Alert, null, 'Aviso')), /role="status"/)

// Card: tag configurável e classes extras.
assert.match(render(h(Card, { as: 'section', className: 'extra' }, 'x')), /^<section class="card extra">x<\/section>$/)

// Field: rótulo ligado ao campo, dica e erro por aria.
const hint = render(h(Field, { label: 'Nome', hint: 'Opcional' }))
const id = hint.match(/for="([^"]+)"/)![1]
assert.ok(hint.includes(`id="${id}"`) && hint.includes(`aria-describedby="${id}-hint"`))
const err = render(h(Field, { label: 'Peso', error: 'Inválido' }))
assert.match(err, /aria-invalid="true"/)
assert.match(err, /role="alert"[^>]*>Inválido</)
console.log('UI components: Button, Badge, Alert, Card e Field OK')
