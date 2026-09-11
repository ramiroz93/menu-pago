// Comprime una imagen en el navegador antes de subirla.
// Una foto de celular de 4MB queda en ~100-200KB.
export async function compressImage(file, maxPx = 800, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(resolve, 'image/jpeg', quality)
    }
    img.src = URL.createObjectURL(file)
  })
}

// Extrae el nombre de archivo de una URL de Supabase Storage
function filenameFromUrl(url) {
  if (!url) return null
  const parts = url.split('/menu-images/')
  return parts[1] || null
}

export async function uploadRestaurantImage(file, supabase, type = 'logo', oldUrl = null) {
  const blob = await compressImage(file, type === 'cover' ? 1200 : 800, 0.85)
  const filename = `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  const { error } = await supabase.storage
    .from('menu-images')
    .upload(filename, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('menu-images').getPublicUrl(filename)
  if (oldUrl) deleteMenuImage(oldUrl, supabase)
  return publicUrl
}

// Elimina una imagen del bucket si vino de nuestro Storage
export async function deleteMenuImage(url, supabase) {
  const filename = filenameFromUrl(url)
  if (!filename) return
  await supabase.storage.from('menu-images').remove([filename])
}

export async function uploadMenuImage(file, supabase, oldUrl = null) {
  const blob = await compressImage(file)
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  const { error } = await supabase.storage
    .from('menu-images')
    .upload(filename, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage
    .from('menu-images')
    .getPublicUrl(filename)
  // Borra la imagen anterior si existía
  if (oldUrl) deleteMenuImage(oldUrl, supabase)
  return publicUrl
}
