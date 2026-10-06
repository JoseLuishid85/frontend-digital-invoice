// Sequelize devuelve los DECIMAL de MySQL como texto; los convertimos antes de formatear
const formatoMoneda = new Intl.NumberFormat('es', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const moneda = (valor) => formatoMoneda.format(Number(valor) || 0)

const formatoTasa = new Intl.NumberFormat('es', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

// Campos opcionales (tasa del día, precio en $): muestran '—' si no hay valor
export const tasa = (valor) => (valor == null ? '—' : formatoTasa.format(Number(valor) || 0))

export const dolares = (valor) => (valor == null ? '—' : `$ ${moneda(valor)}`)

export const cantidad = (valor) => {
  const n = Number(valor) || 0
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

export const fecha = (valor) => {
  if (!valor) return '—'
  // valor viene como YYYY-MM-DD; lo armamos en hora local para no correr el día
  const [anio, mes, dia] = valor.split('-').map(Number)
  return new Date(anio, mes - 1, dia).toLocaleDateString('es', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// Fecha local de hoy en formato YYYY-MM-DD (la de toISOString es UTC y puede ser otro día)
export const hoy = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const nombreMoneda = (codigo) => (codigo === 'USD' ? 'Dólares ($)' : 'Bolívares (Bs)')
