// En desarrollo Vite redirige /bill/api al backend (ver vite.config.js).
// En producción se puede definir VITE_API_URL, ej. https://mi-api.com
const API_URL = import.meta.env.VITE_API_URL || ''

// Hace la petición y lanza un Error con el mensaje del backend si algo falla
async function peticion(ruta, opciones) {
  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, opciones)
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new Error('No se pudo conectar con el servidor. ¿Está corriendo el backend?')
  }

  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok || !datos?.ok) {
    throw new Error(datos?.mensaje || `Error del servidor (${respuesta.status}).`)
  }

  return datos
}

export function procesarFactura(archivo, { moneda, tasaDia }) {
  const formData = new FormData()
  formData.append('imagen', archivo)
  formData.append('moneda', moneda)
  if (tasaDia) formData.append('tasa_dia', tasaDia)
  return peticion('/bill/api/facturas/procesar', { method: 'POST', body: formData })
}

export function obtenerFactura(id, signal) {
  return peticion(`/bill/api/facturas/${encodeURIComponent(id)}`, { signal })
}

// URL directa de la imagen guardada (se usa en <img> y enlaces, no con fetch)
export function urlImagenFactura(id) {
  return `${API_URL}/bill/api/facturas/${encodeURIComponent(id)}/imagen`
}

export function buscarProductos(texto, signal) {
  const params = new URLSearchParams({ q: texto })
  return peticion(`/bill/api/productos/buscar?${params}`, { signal })
}

export function listarTasas(signal) {
  return peticion('/bill/api/tasas', { signal })
}

export function guardarTasa(fecha, tasa) {
  return peticion(`/bill/api/tasas/${encodeURIComponent(fecha)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasa }),
  })
}
