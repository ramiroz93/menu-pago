export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center mb-4 animate-pulse">
        <span className="text-white text-2xl font-bold">M</span>
      </div>
      <p className="text-gray-400 text-sm">Cargando...</p>
    </div>
  )
}
