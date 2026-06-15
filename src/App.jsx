import React, { useState } from 'react'
import { useProspector } from './hooks/useProspector'

export default function App() {
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('RJ')
  const [quantidade, setQuantidade] = useState(5)

  const {
    leads,
    loading,
    logs,
    progresso,
    iniciarProspecction,
    exportarParaCsvHubspot
  } = useProspector()

  const leadsQualificados = leads.filter(l => l.score_potencial >= 9).length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* TOPO / HEADER */}
      <header className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              🏢 Prospector Imobiliário
            </h1>
            <p className="text-indigo-100 mt-1 text-sm md:text-base">
              Mineração Comercial · Triangulação de Dados (Maps + CNPJ) · Listas de Score para o HubSpot
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all duration-300 ${
            loading ? 'bg-amber-500 text-white animate-pulse' : 'bg-emerald-600 text-white'
          }`}>
            {loading ? '⚙️ Triangulando Dados...' : '🟢 Pronto para Minerar'}
          </div>
        </div>
      </header>

      {/* DASHBOARD PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* FORMULÁRIO DE CONFIGURAÇÃO */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            ⚙️ Configurar Filtros de Prospecção
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1 tracking-wider">Cidade</label>
              <input 
                type="text" 
                disabled={loading}
                placeholder="Ex: Rio de Janeiro" 
                className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-gray-100 font-medium"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1 tracking-wider">Estado (UF)</label>
              <select 
                disabled={loading}
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 font-medium"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="RJ">Rio de Janeiro (RJ)</option>
                <option value="SP">São Paulo (SP)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1 tracking-wider">Volume de Leads</label>
              <select 
                disabled={loading}
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 font-medium"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
              >
                <option value={3}>3 Empresas</option>
                <option value={5}>5 Empresas</option>
                <option value={10}>10 Empresas</option>
              </select>
            </div>
            <button 
              disabled={loading}
              onClick={() => iniciarProspecction(cidade, estado, quantidade)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold p-3 rounded-lg shadow-sm transition duration-150 uppercase tracking-wide text-sm"
            >
              {loading ? 'Processando...' : '⚡ Iniciar Triangulação'}
            </button>
          </div>
        </section>

        {/* MONITOR DE PROGRESSO ATIVO */}
        {loading && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 space-y-3 shadow-inner">
            <div className="flex justify-between text-sm font-bold text-indigo-900">
              <span>{progresso.mensagem}</span>
              <span>{progresso.atual} / {progresso.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-indigo-600 h-3 rounded-full transition-all duration-500 ease-out animate-pulse"
                style={{ width: `${(progresso.atual / progresso.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* CARDS DE INDICADORES / MÉTRICAS */}
        {leads.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Minerado</span>
              <span className="text-3xl font-black text-gray-800 mt-2">{leads.length} <span className="text-sm font-normal text-gray-500">empresas</span></span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Foco SDR (Score 9-10)</span>
              <span className="text-3xl font-black text-emerald-600 mt-2">{leadsQualificados} <span className="text-sm font-normal text-emerald-500">peixes grandes</span></span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Ação Comercial</span>
                <p className="text-gray-500 text-xs mt-1">Gere o arquivo e faça o upload no seu CRM</p>
              </div>
              <button 
                onClick={exportarParaCsvHubspot}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-sm shadow transition"
              >
                📥 Exportar CSV
              </button>
            </div>
          </div>
        )}

        {/* MÓDULO DUPLO: LOGS + RESULTADOS */}
        {leads.length === 0 ? (
          <div className="text-center text-gray-400 py-16 border-2 border-dashed border-gray-200 rounded-xl bg-white">
            <p className="text-lg font-medium text-gray-500">Nenhuma listagem ativa no momento.</p>
            <p className="text-sm text-gray-400 mt-1">Configure uma cidade acima e clique no botão para iniciar a esteira inteligente.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* TERMINAL ESCURO DE LOGS EM TEMPO REAL */}
            <section className="bg-gray-900 rounded-xl p-4 shadow-lg border border-gray-800">
              <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-2 text-xs font-mono text-gray-400">
                <span>📟 MONITOR DE REQUISIÇÕES EM TEMPO REAL</span>
                <span className="text-indigo-400">STATUS: CONECTADO</span>
              </div>
              <div className="max-h-32 overflow-y-auto font-mono text-xs text-green-400 space-y-1 scrollbar-thin">
                {logs.map((log, index) => (
                  <div key={index} className="leading-relaxed">{log}</div>
                ))}
              </div>
            </section>

            {/* TABELA DE LEADS COM FILTRO DE SCORE */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">📋 Listagem Estruturada de Prospecção</h3>
                <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
                  Cruzamento: Google Maps + Receita Federal
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100/70 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="p-4">Empresa / CNPJ</th>
                      <th className="p-4">Contato Oficial</th>
                      <th className="p-4">Decisor (Sócio)</th>
                      <th className="p-4">Stack Tecnológico</th>
                      <th className="p-4">E-mail Provável</th>
                      <th className="p-4 text-center">Score</th>
                      <th className="p-4">Ação SDR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {leads.map((lead, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition duration-150">
                        <td className="p-4">
                          <div className="font-bold text-gray-900">{lead.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">CNPJ: {lead.cnpj}</div>
                          <div className="text-xs text-indigo-600 font-medium underline mt-0.5">
                            <a href={`https://${lead.site}`} target="_blank" rel="noreferrer">{lead.site}</a>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-gray-600">
                          {lead.phone}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-gray-800">{(lead.socios && lead.socios[0]) || 'Diretoria'}</div>
                          <div className="text-xs text-gray-400 font-medium">Cargo: {lead.cargo_decisor || 'Não informado'}</div>
                        </td>
                        {/* NOVA COLUNA: Exibe os sistemas encontrados pelo robô de varredura */}
                        <td className="p-4">
                          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50/60 px-2 py-1 rounded border border-indigo-100/50 block w-fit max-w-[200px] truncate" title={lead.stack_tecnologico}>
                            {lead.stack_tecnologico || 'Analisando...'}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-xs text-gray-500 bg-gray-50/50">
                          {(lead.emails_provaveis && lead.emails_provaveis[0]) || 'Não gerado'}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block font-black text-xs px-3 py-1.5 rounded-full shadow-xs ${
                            lead.score_potencial >= 9 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            ⭐ {lead.score_potencial}/10
                          </span>
                        </td>
                        <td className="p-4">
                          <a 
                            href={lead.link_linkedin} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-1.5 px-3 rounded shadow-xs transition"
                          >
                            🔍 Caçar LinkedIn
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

      </main>

      {/* RODAPÉ LEGAL */}
      <footer className="bg-gray-100 text-center py-4 text-xs text-gray-500 border-t border-gray-200 mt-12">
        Prospector Imobiliário • Dados coletados em estrita conformidade com a Lei Federal nº 8.934/1994 (Informações Fiscais Públicas) e diretrizes da LGPD B2B.
      </footer>
    </div>
  )
}
