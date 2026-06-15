import React, { useState } from 'react'

export default function App() {
  // Estados para controlar o formulário e a tela
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('RJ')
  const [quantidade, setQuantidade] = useState(5)
  const [estaProcessando, setEstaProcessando] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* TOPO DO SISTEMA */}
      <header className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              🏢 Prospector Imobiliário
            </h1>
            <p className="text-indigo-100 mt-1">
              Mineração · Triangulação de Dados · Listas Qualificadas para o HubSpot
            </p>
          </div>
          <div className="bg-indigo-600/50 border border-indigo-400/30 px-4 py-2 rounded-lg text-sm mt-4 md:mt-0 font-medium">
            Status: Pronto para Minerar
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL (DASHBOARD) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* AQUI FICARÁ O FORMULÁRIO DE BUSCA */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Configurar Prospecção Comercial</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cidade</label>
              <input 
                type="text" 
                placeholder="Ex: Rio de Janeiro" 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Estado (UF)</label>
              <select 
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="RJ">Rio de Janeiro (RJ)</option>
                <option value="SP">São Paulo (SP)</option>
                <option value="MG">Minas Gerais (MG)</option>
                <option value="DF">Distrito Federal (DF)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Quantidade de Leads</label>
              <select 
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              >
                <option value={3}>3 Empresas</option>
                <option value={5}>5 Empresas</option>
                <option value={10}>10 Empresas</option>
                <option value={20}>20 Empresas</option>
              </select>
            </div>
            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-lg shadow transition duration-200">
              ⚡ Iniciar Triangulação
            </button>
          </div>
        </section>

        {/* AQUI FICARÃO OS CARDS DE ESTATÍSTICAS E A LISTAGEM COM SCORE */}
        <div className="text-center text-gray-400 py-12 border-2 border-dashed border-gray-200 rounded-xl">
          Nenhuma busca iniciada. Digite uma cidade acima para gerar a lista com Scores para o seu HubSpot.
        </div>

      </main>

      {/* RODAPÉ E LEI DE DADOS */}
      <footer className="bg-gray-100 text-center py-4 text-xs text-gray-500 border-t border-gray-200">
        Prospector Imobiliário • Dados em conformidade pública com a Lei Federal nº 8.934/1994 e LGPD.
      </footer>
    </div>
  )
}
