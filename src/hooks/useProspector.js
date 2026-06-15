import { useState } from 'react'
import { buscarEmpresasFisicas, enriquecerDadosComIA } from '../services/claudeApi'

export function useProspector() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState([])
  const [progresso, setProgresso] = useState({ atual: 0, total: 0, mensagem: '' })

  // Função para adicionar uma linha no nosso terminal escuro de logs
  const adicionarLog = (mensagem) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${timestamp}] ${mensagem}`])
  }

  // O Pipeline principal que executa os passos em sequência
  const iniciarProspecction = async (cidade, estado, quantidade) => {
    if (!cidade) {
      alert('Por favor, digite uma cidade para iniciar.')
      return
    }

    setLoading(true)
    setLeads([])
    setLogs([])
    setProgresso({ atual: 0, total: quantidade, mensagem: 'Iniciando motores...' })
    
    adicionarLog(`🚀 Iniciando prospecção para ${cidade} - ${estado} (Meta: ${quantidade} leads)`)

    try {
      // ETAPA 1 e 2: Buscar empresas e puxar os sócios no CNPJ
      setProgresso(p => ({ ...p, mensagem: 'Raspando Google Maps e consultando quadro de sócios no CNPJ...' }))
      adicionarLog(`🌐 Conectando à malha digital... Varrendo imobiliárias em ${cidade}...`)
      
      const empresasEncontradas = await buscarEmpresasFisicas(cidade, estado, quantidade)
      adicionarLog(`✅ Sucesso: ${empresasEncontradas.length} imobiliárias reais localizadas com CNPJ e Sócios.`)

      const listaEnriquecida = []

      // ETAPA 3: Passar empresa por empresa na IA para calcular o Score (Um por vez!)
      for (let i = 0; i < empresasEncontradas.length; i++) {
        const empresaAtual = empresasEncontradas[i]
        const numeroAtual = i + 1
        
        setProgresso({
          atual: numeroAtual,
          total: empresasEncontradas.length,
          mensagem: `Enriquecendo dados com IA: Empresa ${numeroAtual} de ${empresasEncontradas.length}...`
        })
        
        adicionarLog(`🧠 IA Analisando: "${empresaAtual.name}" -> Calculando potencial de mercado...`)
        
        // Chama a IA para deduzir e-mails, gerar script e dar a nota de Score
        const empresaCompleta = await enriquecerDadosComIA(empresaAtual)
        
        // Simulação do Cross-Check com o seu CSV do HubSpot (por CNPJ)
        // Como o arquivo ainda não foi enviado, ele marca todos como "Novo Lead" por padrão
        const empresaComCrm = {
          ...empresaCompleta,
          status_crm: "Novo Lead",
          id_hubspot: null
        }

        listaEnriquecida.push(empresaComCrm)
        
        // Atualiza a tabela na tela em tempo real para o usuário ver o lead aparecendo
        setLeads([...listaEnriquecida])
        adicionarLog(`⭐ Lead Concluído! "${empresaComCrm.name}" recebeu Score ${empresaComCrm.score_potencial}/10`)
      }

      setProgresso(p => ({ ...p, mensagem: 'Concluído com sucesso!' }))
      adicionarLog(`🎉 Feito! Lista de prospecção gerada e pronta para exportação para o HubSpot.`)

    } catch (error) {
      adicionarLog(`❌ Erro no Pipeline: ${error.message}`)
      alert('Ocorreu um erro durante a prospecção. Verifique os logs.')
    } finally {
      setLoading(false)
    }
  }

  // Função para transformar a nossa tabela da tela em um arquivo CSV limpo para o HubSpot
  const exportarParaCsvHubspot = () => {
    if (leads.length === 0) return

    // Cabeçalhos que o HubSpot reconhece nativamente na importação
    const colunas = [
      'Nome da Empresa',
      'Razao Social',
      'CNPJ',
      'Website',
      'Telefone',
      'Nome do Decisor (Socio)',
      'Email do Decisor',
      'Score de Potencial',
      'Script de Abordagem Outbound',
      'Status no CRM'
    ]

    // Transforma as linhas de dados em texto separado por vírgula
    const linhas = leads.map(l => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.name.replace(/"/g, '""')} Ltda"`, // Razão social simulada baseada na marca
      `"${l.cnpj}"`,
      `"${l.site}"`,
      `"${l.phone}"`,
      `"${(l.socios && l.socios[0]) || 'Diretor'}"`,
      `"${(l.emails_provaveis && l.emails_provaveis[0]) || ''}"`,
      `"${l.score_potencial}"`,
      `"${l.script_abordagem.replace(/"/g, '""')}"`,
      `"${l.status_crm}"`
    ].join(','))

    const conteudoCsv = [colunas.join(','), ...linhas].join('\n')
    
    // Cria o arquivo invisível no navegador e força o download automático
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), conteudoCsv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `leads_prospector_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return {
    leads,
    loading,
    logs,
    progresso,
    iniciarProspecction,
    exportarParaCsvHubspot
  }
}
