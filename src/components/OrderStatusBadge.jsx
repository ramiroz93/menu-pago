const STATUS = {
  pending:          { label: 'Pendiente',           bg: 'bg-yellow-100', text: 'text-yellow-700' },
  confirmed:        { label: 'Confirmado',           bg: 'bg-blue-100',   text: 'text-blue-700' },
  preparing:        { label: 'Preparando',           bg: 'bg-orange-100', text: 'text-orange-700' },
  waiting_delivery: { label: 'Esperando delivery',  bg: 'bg-purple-100', text: 'text-purple-700' },
  on_the_way:       { label: 'Delivery en camino',  bg: 'bg-indigo-100', text: 'text-indigo-700' },
  completed:        { label: 'Completado',           bg: 'bg-green-100',  text: 'text-green-700' },
  rejected:         { label: 'Rechazado',            bg: 'bg-red-100',    text: 'text-red-700' },
}

export default function OrderStatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}
