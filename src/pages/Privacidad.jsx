import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'

export default function Privacidad() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 px-6 pt-12 pb-8">
        <button onClick={() => navigate(-1)} className="text-white/80 flex items-center gap-1 text-sm mb-4">
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">PolÃ­tica de Privacidad</h1>
            <p className="text-primary-100 text-xs mt-0.5">Ãšltima actualizaciÃ³n: 15 de junio de 2026</p>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 px-6 py-6 space-y-6 max-w-2xl mx-auto w-full">

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">1. InformaciÃ³n general</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Menu-Pago es una aplicaciÃ³n de fidelizaciÃ³n y pedidos de comida operada en Bolivia. Esta polÃ­tica explica quÃ© datos recopilamos, cÃ³mo los usamos y cÃ³mo los protegemos.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            Al registrarte y usar Menu-Pago, aceptas los tÃ©rminos descritos en esta polÃ­tica.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">2. Datos que recopilamos</h2>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Al registrarte</p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Nombre completo</li>
            <li>Correo electrÃ³nico</li>
            <li>NÃºmero de telÃ©fono / WhatsApp</li>
            <li>Ciudad de residencia</li>
            <li>ContraseÃ±a (almacenada de forma encriptada, nunca en texto plano)</li>
          </ul>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 mt-4">Al usar la app</p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Historial de pedidos realizados</li>
            <li>Saldo de wallet y movimientos</li>
            <li>Ubicaciones de entrega guardadas</li>
            <li>Calificaciones a restaurantes</li>
            <li>Restaurantes marcados como favoritos</li>
          </ul>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 mt-4">AutomÃ¡ticamente</p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Fecha y hora de inicio de sesiÃ³n</li>
            <li>Dispositivo y navegador utilizado</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-3">3. CÃ³mo usamos tus datos</h2>
          <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100">
            {[
              ['Nombre y telÃ©fono', 'Identificarte y que el delivery pueda contactarte'],
              ['Correo', 'Inicio de sesiÃ³n y comunicaciones importantes'],
              ['Ciudad', 'Mostrarte restaurantes disponibles en tu zona'],
              ['Historial de pedidos', 'Mostrarte tus pedidos anteriores y estadÃ­sticas'],
              ['Ubicaciones guardadas', 'Facilitar la entrega de tus pedidos'],
              ['Saldo y movimientos', 'Gestionar tu wallet dentro de la app'],
            ].map(([dato, uso]) => (
              <div key={dato} className="px-4 py-3">
                <p className="text-xs font-semibold text-gray-700">{dato}</p>
                <p className="text-xs text-gray-500 mt-0.5">{uso}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-3 leading-relaxed font-medium">
            No usamos tus datos para publicidad de terceros. No vendemos ni compartimos tu informaciÃ³n con empresas externas.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">4. Con quiÃ©n compartimos tus datos</h2>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-700">Restaurantes</p>
              <p className="text-xs text-gray-500 mt-0.5">Cuando haces un pedido, el restaurante recibe tu nombre, telÃ©fono y direcciÃ³n de entrega para poder procesarlo y contactarte.</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-700">Administrador de Menu-Pago</p>
              <p className="text-xs text-gray-500 mt-0.5">Accede a los datos para gestionar recargas de saldo, soporte y operaciÃ³n de la plataforma.</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-700">Proveedor de infraestructura</p>
              <p className="text-xs text-gray-500 mt-0.5">La informaciÃ³n se almacena en servidores en la nube que cumplen con estÃ¡ndares internacionales de seguridad.</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-3">NingÃºn otro tercero tiene acceso a tus datos.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">5. Seguridad de tus datos</h2>
          <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside leading-relaxed">
            <li>Las contraseÃ±as se almacenan de forma encriptada y nunca son accesibles ni siquiera para el equipo de Menu-Pago</li>
            <li>Tu saldo de wallet solo puede modificarse a travÃ©s de operaciones autorizadas dentro de la app</li>
            <li>Contamos con medidas tÃ©cnicas y organizativas para proteger tu informaciÃ³n contra accesos no autorizados</li>
            <li>La informaciÃ³n se almacena en servidores en la nube con estÃ¡ndares internacionales de seguridad</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">6. Tus derechos</h2>
          <p className="text-sm text-gray-600 mb-2">Tienes derecho a:</p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside leading-relaxed">
            <li><strong>Acceder</strong> a los datos que tenemos sobre ti</li>
            <li><strong>Corregir</strong> datos incorrectos desde tu perfil en la app</li>
            <li><strong>Eliminar</strong> tu cuenta y todos tus datos â€” escrÃ­benos al WhatsApp +591 00000000</li>
            <li><strong>Consultar</strong> cualquier duda sobre el uso de tu informaciÃ³n</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">7. RetenciÃ³n de datos</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Conservamos tus datos mientras tu cuenta estÃ© activa. Si solicitas eliminar tu cuenta, borramos todos tus datos personales en un plazo mÃ¡ximo de 7 dÃ­as hÃ¡biles, excepto los registros de transacciones que debamos conservar por razones legales.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">8. Menores de edad</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Menu-Pago no estÃ¡ dirigido a menores de 14 aÃ±os. Si eres menor, necesitas autorizaciÃ³n de un adulto para usar la app.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">9. Cambios a esta polÃ­tica</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Si realizamos cambios importantes a esta polÃ­tica, lo notificaremos dentro de la app. El uso continuado de Menu-Pago tras los cambios implica la aceptaciÃ³n de la nueva polÃ­tica.
          </p>
        </section>

        <section className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
          <h2 className="text-base font-bold text-gray-800 mb-2">10. Contacto</h2>
          <p className="text-sm text-gray-600 mb-2">Si tienes dudas, comentarios o solicitudes sobre tus datos personales, contÃ¡ctanos:</p>
          <p className="text-sm text-gray-700 font-medium">WhatsApp: <span className="text-primary-600">+591 00000000</span></p>
          <p className="text-sm text-gray-700 font-medium mt-1">App: <span className="text-primary-600">menu-pago.vercel.app</span></p>
        </section>

        <div className="pb-8" />
      </div>
    </div>
  )
}

