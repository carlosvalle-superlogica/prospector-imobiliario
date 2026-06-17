import { useState } from 'react'
import { enriquecerDadosComIA } from '../services/claudeApi'

export function useProspector() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState([])
  const [progresso, setProgresso] = useState({ atual: 0, total: 0, mensagem: '' })

  const adicionarLog = (mensagem) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${timestamp}] ${mensagem}`])
  }

  // Pipeline principal que lê o CSV diretamente da pasta public através do navegador
  const iniciarProspecction = async (cidade, estado, quantidade) => {
    if (!cidade) {
      alert('Por favor, digite uma cidade para iniciar.')
      return
    }

    setLoading(true)
    setLeads([])
    setLogs([])
    
    const limite = parseInt(quantidade) || 5;
    const uf = estado ? estado.toUpperCase().trim() : "DF";
    
    // Transforma "Brasília" em "BRASILIA" limpando acentos e espaços nas pontas
    const termoProcurado = cidade.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    setProgresso({ atual: 0, total: limite, mensagem: 'Iniciando motores...' })
    adicionarLog(`🚀 Procurando leads reais no arquivo da pasta public/${uf}.csv (Meta: ${limite} leads)`)

    try {
      setProgresso(p => ({ ...p, mensagem: `A carregar base de dados de ${uf}...` }))
      adicionarLog(`🌐 Abrindo base de dados local... Varrendo imobiliárias em ${cidade}...`)

      // Procura o arquivo na raiz da pasta public através do navegador
      const respostaCsv = await fetch(`./${uf}.csv`);
      
      if (!respostaCsv.ok) {
        throw new Error(`O arquivo ${uf}.csv não foi encontrado na pasta public do seu projeto.`);
      }

      const textoBruto = await respostaCsv.text();
      const linhas = textoBruto.split(/\r?\n/);
      
      if (linhas.length < 2) {
        throw new Error("O arquivo CSV está vazio ou mal formatado.");
      }

      // Mapeia o cabeçalho removendo espaços e aspas nas pontas das palavras
      const cabecalho = linhas[0].split(',').map(c => c.replace(/^"|"$/g, '').trim());
      
      const campoNome     = cabecalho.indexOf('Razão Social');
      const campoCnpj     = cabecalho.indexOf('CNPJ');
      const campoCidade   = cabecalho.indexOf('Município');
      const campoSocios   = cabecalho.indexOf('Quadro Societário');
      const campoEmail    = cabecalho.indexOf('E-MAIL');
      const campoTelefone = cabecalho.indexOf('Telefone');

      const empresasEncontradas = [];
      // Expressão regular para quebrar colunas por vírgula mas ignorar vírgulas dentro de aspas
      const regexValores = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

      // Percorre o CSV procurando as linhas correspondentes à cidade digitada
      for (let i = 1; i < linhas.length; i++) {
        if (!linhas[i].trim()) continue;

        const colunas = linhas[i].split(regexValores).map(c => c.replace(/^"|"$/g, '').trim());
        const cidadeLinha = colunas[campoCidade] ? colunas[campoCidade].toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : '';

        if (cidadeLinha.includes(termoProcurado)) {
          let socioPrincipal = "Diretoria";
          if (colunas[campoSocios]) {
            socioPrincipal = colunas[campoSocios].split('-')[0].split(';')[0].trim();
          }

          const nomeEmpresa = colunas[campoNome] || "Empresa Encontrada";
          const nomeLimpoParaSite = nomeEmpresa.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');

          empresasEncontradas.push({
            name: nomeEmpresa,
            cnpj: colunas[campoCnpj] || "N/A",
            phone: colunas[campoTelefone] || "Não disponível",
            socios: [socioPrincipal],
            email_receita: colunas[campoEmail] || "Não disponível",
            emails_provaveis: [colunas[campoEmail] || ""], // Garante a compatibilidade com a exportação
            site: nomeLimpoParaSite ? `${nomeLimpoParaSite}.com.br` : "consultar.com.br",
            script_abordagem: "Carregando análise estratégica...",
            score_potencial: 10
          });

          if (empresasEncontradas.length >= limite) break;
        }
      }

      adicionarLog(`✅ Sucesso: ${empresasEncontradas.length} imobiliárias reais localizadas no arquivo CSV.`);

      const listaEnriquecida = [];

      // Processa a lista final enviando ou simulando a IA
      for (let i = 0; i < empresasEncontradas.length; i++) {
        const empresaAtual = empresasEncontradas[i];
        const numeroAtual = i + 1;
        
        setProgresso({
          atual: numeroAtual,
          total: empresasEncontradas.length,
          mensagem: `Enriquecendo dados: Empresa ${numeroAtual} de ${empresasEncontradas.length}...`
        });
        
        adicionarLog(`🧠 Analisando dados de: "${empresaAtual.name}"...`);
        
        let empresaCompleta = empresaAtual;
        try {
          if (typeof enriquecerDadosComIA === 'function') {
            empresaCompleta = await enriquecerDadosComIA(empresaAtual);
          }
        } catch (e) {
          adicionarLog(`⚠️ Aviso: Mantendo dados originais do CSV para esta linha.`);
        }

        const empresaComCrm = {
          ...empresaAtual,
          ...empresaCompleta,
          status_crm: "Novo Lead",
          id_hubspot: null
        };

        listaEnriquecida.push(empresaComCrm);
        setLeads([...listaEnriquecida]);
        adicionarLog(`⭐ Lead Concluído! "${empresaComCrm.name}" pronto na tabela.`);
      }

      setProgresso(p => ({ ...p, mensagem: 'Concluído com sucesso!' }));
      adicionarLog(`🎉 Feito! Lista de prospecção gerada a partir do seu CSV e pronta para o HubSpot.`);

    } catch (error) {
      adicionarLog(`❌ Erro no Pipeline: ${error.message}`);
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false)
    }
  }

  // Função para exportar os dados capturados da tabela de volta para o formato HubSpot
  const exportarParaCsvHubspot = () => {
    if (leads.length === 0) return

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

    const linhas = leads.map(l => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.name.replace(/"/g, '""')} Ltda"`,
      `"${l.cnpj}"`,
      `"${l.site}"`,
      `"${l.phone}"`,
      `"${(l.socios && l.socios[0]) || 'Diretor'}"`,
      `"${(l.emails_provaveis && l.emails_provaveis[0]) || ''}"`,
      `"${l.score_potencial}"`,
      `"${(l.script_abordagem || '').replace(/"/g, '""')}"`,
      `"${l.status_crm}"`
    ].join(','))

    const conteudoCsv = [colunas.join(','), ...linhas].join('\n')
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
