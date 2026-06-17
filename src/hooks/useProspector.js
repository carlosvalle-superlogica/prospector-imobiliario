import { useState } from 'react'
import { enriquecerDadosComIA } from '../services/claudeApi'

export function useProspector() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState([])
  const [progresso, setProgresso] = useState({ atual: 0, total: 0, message: '' })

  const adicionarLog = (mensagem) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${timestamp}] ${mensagem}`])
  }

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
    const termoProcurado = cidade.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    adicionarLog(`🚀 Iniciando Rastreio de colunas para public/${uf}.csv`)

    try {
      const respostaCsv = await fetch(`./${uf}.csv`);
      if (!respostaCsv.ok) throw new Error(`Arquivo não encontrado.`);

      const textoBruto = await respostaCsv.text();
      const linhas = textoBruto.split(/\r?\n/);
      
      // DIAGNÓSTICO DO CABEÇALHO
      const primeiraLinha = linhas[0];
      
      // Testa qual separador realmente divide a linha em pedaços
      let separador = ',';
      if (primeiraLinha.includes(';')) separador = ';';
      else if (primeiraLinha.includes('\t')) separador = '\t';

      adicionarLog(`🔍 Separador detectado: [ ${separador === '\t' ? 'TAB' : separador} ]`);

      // Divide o cabeçalho
      const cabecalho = primeiraLinha.split(separador).map(c => c.replace(/^"|"$/g, '').trim());
      
      // Imprime o cabeçalho mapeado para você ver nos logs da tela
      adicionarLog(`📋 Colunas lidas: ${cabecalho.slice(0, 6).join(' | ')}...`);

      // Localiza os índices de forma flexível (independente de maiúscula/minúscula)
      const buscarIndice = (nomesPossiveis) => {
        return cabecalho.findIndex(col => 
          nomesPossiveis.some(nome => col.toLowerCase().includes(nome.toLowerCase()))
        );
      };

      const campoNome     = buscarIndice(['razão social', 'razao', 'nome']);
      const campoCnpj     = buscarIndice(['cnpj']);
      const campoCidade   = buscarIndice(['município', 'municipio', 'cidade']);
      const campoSocios   = buscarIndice(['quadro', 'sócio', 'socio']);
      const campoEmail    = buscarIndice(['e-mail', 'email']);
      const campoTelefone = buscarIndice(['telefone ok', 'telefone', 'tel']);

      adicionarLog(`🎯 Índices das Colunas -> Nome: ${campoNome} | CNPJ: ${campoCnpj} | Cidade: ${campoCidade} | Sócio: ${campoSocios} | Telefone: ${campoTelefone}`);

      const empresasEncontradas = [];

      // Loop pelas linhas
      for (let i = 1; i < linhas.length; i++) {
        if (!linhas[i].trim()) continue;

        // Tenta quebrar a linha limpando possíveis aspas duplas do Excel
        const colunas = linhas[i].split(separador).map(c => c.replace(/^"|"$/g, '').trim());
        const cidadeLinha = colunas[campoCidade] ? colunas[campoCidade].toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : '';

        if (cidadeLinha.includes(termoProcurado)) {
          
          // Captura de forma segura se o índice foi achado (maior que -1)
          const nomeEmpresa = campoNome > -1 ? colunas[campoNome] : "Empresa Omitida";
          const cnpjEmpresa = campoCnpj > -1 ? colunas[campoCnpj] : "N/A";
          const telEmpresa  = campoTelefone > -1 && colunas[campoTelefone] ? colunas[campoTelefone] : "Não informado";
          const emailEmpresa = campoEmail > -1 && colunas[campoEmail] ? colunas[campoEmail] : "";
          
          let socioEmpresa = "Diretor Omitido";
          if (campoSocios > -1 && colunas[campoSocios]) {
            socioEmpresa = colunas[campoSocios].split('-')[0].split(';')[0].replace(/[^a-zA-Z\s]/g, '').trim();
          }

          if (!socioEmpresa || socioEmpresa.trim() === "") socioEmpresa = "Diretoria";

          const nomeLimpoParaSite = nomeEmpresa.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');

          // Mostra no log do terminal a primeira linha capturada real para checagem
          if (empresasEncontradas.length === 0) {
            adicionarLog(`👀 Amostra capturada do CSV -> Nome: ${nomeEmpresa} | Tel: ${telEmpresa} | Sócio: ${socioEmpresa}`);
          }

          empresasEncontradas.push({
            name: nomeEmpresa,
            cnpj: cnpjEmpresa,
            phone: telEmpresa,
            socios: [socioEmpresa],
            email_receita: emailEmpresa || "Não disponível",
            emails_provaveis: [emailEmpresa],
            site: nomeLimpoParaSite ? `${nomeLimpoParaSite}.com.br` : "consultar.com.br",
            script_abordagem: "Carregando análise estratégica...",
            score_potencial: 10
          });

          if (empresasEncontradas.length >= limite) break;
        }
      }

      const listaEnriquecida = [];
      for (let i = 0; i < empresasEncontradas.length; i++) {
        const empresaAtual = empresasEncontradas[i];
        
        let empresaCompleta = empresaAtual;
        try {
          if (typeof enriquecerDadosComIA === 'function') {
            empresaCompleta = await enriquecerDadosComIA(empresaAtual);
          }
        } catch (e) {
          // Mantém original se falhar
        }

        const empresaComCrm = {
          ...empresaAtual,
          ...empresaCompleta,
          status_crm: "Novo Lead",
          id_hubspot: null
        };

        listaEnriquecida.push(empresaComCrm);
        setLeads([...listaEnriquecida]);
      }

      adicionarLog(`🎉 Rastreio finalizado com ${listaEnriquecida.length} leads.`);

    } catch (error) {
      adicionarLog(`❌ Erro: ${error.message}`);
    } finally {
      setLoading(false)
    }
  }

  const exportarParaCsvHubspot = () => {
    if (leads.length === 0) return
    const colunas = ['Nome da Empresa', 'Razao Social', 'CNPJ', 'Website', 'Telefone', 'Nome do Decisor (Socio)', 'Email do Decisor', 'Score de Potencial', 'Status no CRM']
    const linhas = leads.map(l => [`"${l.name}"`, `"${l.name} Ltda"`, `"${l.cnpj}"`, `"${l.site}"`, `"${l.phone}"`, `"${l.socios[0]}"`, `"${l.emails_provaveis[0]}"`, `"${l.score_potencial}"`, `"${l.status_crm}"`].join(','))
    const conteudoCsv = [colunas.join(','), ...linhas].join('\n')
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), conteudoCsv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `leads_prospector.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return { leads, loading, logs, progresso, iniciarProspecction, exportarParaCsvHubspot }
}
