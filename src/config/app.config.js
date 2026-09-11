export const APP_CONFIG = {
  name: 'Menu-Pago',
  currency: 'Bs',
  discount: 0.15,             // 15% descuento sobre todos los platos
  minConsumptionBalance: 50,  // Saldo mínimo para que el restaurante esté abierto
  topUpBonus: 0.05,           // 5% bonus sobre recarga
  whatsappNumber: '00000000000', // reemplaza con tu número de WhatsApp

  // QR de pago — reemplaza con los datos y la imagen de tu propia cuenta bancaria
  paymentQR: {
    label: 'Tu Banco — Nombre del titular',
    number: '00000000',
    imageUrl: '/qr-pago.png',
  },

  topUpTiers: [
    { amount: 100, bonus: 5,  label: 'Bs 100 → Bs 105' },
    { amount: 200, bonus: 10, label: 'Bs 200 → Bs 210' },
    { amount: 300, bonus: 15, label: 'Bs 300 → Bs 315' },
    { amount: 400, bonus: 20, label: 'Bs 400 → Bs 420' },
    { amount: 500, bonus: 25, label: 'Bs 500 → Bs 525' },
    { amount: 600, bonus: 30, label: 'Bs 600 → Bs 630' },
  ],
  minTopUpAmount: 100,
}

export const buildWhatsAppLink = (message) => {
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encoded}`
}
