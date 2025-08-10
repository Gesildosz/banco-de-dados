"use client"

export function Footer() {
  return (
    <footer className="w-full bg-gray-800 text-white py-4 px-6 text-center text-sm mt-auto">
      <div className="container mx-auto">
        <p>&copy; {new Date().getFullYear()} Gerenciamento de Banco de Horas. Todos os direitos reservados.</p>
        <p className="mt-1">Desenvolvido por Gesildo Silva. (71) 98523-2835 / SSA -Bahia.</p>
      </div>
    </footer>
  )
}
