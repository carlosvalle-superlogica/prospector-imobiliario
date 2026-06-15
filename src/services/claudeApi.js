/**
 * SERVIÇO DE CONEXÃO E TRIANGULAÇÃO DE DADOS
 * Este arquivo cuida de buscar as imobiliárias e enriquecer os dados.
 */

// 1. Simulador de Raspagem Real do Google Maps e Receita Federal (CNPJ/Sócios)
// Criamos uma base de dados realista e mapeada para o Rio de Janeiro e capitais 
// para validar o comportamento da tabela e do Score sem custo de APIs pagas.
const BASE_MOCK_EMPRESAS = {
  "RJ": [
    { name: "Sergio Castro Imóveis", site: "sergiocastro.com.br", phone: "(21) 2121-7050", cnpj: "28.143.611/0001-09", socios: ["Claudio Castro", "Sergio Castro Filho"], porte: "Grande" },
    { name: "APSA Gestão Condominial", site: "apsa.com.br", phone: "(21) 3233-3000", cnpj: "33.221.988/0001-55", socios: ["Leonardo Mota", "Giovani Oliveira"], porte: "Grande" },
    { name: "Apsa Aluguéis Laranjeiras", site: "apsa.com.br", phone: "(21) 3233-3015", cnpj: "33.221.988/0002-36", socios: ["Leonardo Mota"], porte: "Médio" },
    { name: "Nova Época Imobiliária", site: "novaepoca.com.br", phone: "(21) 2546-5555", cnpj: "04.122.399/0001-88", socios: ["Rodrigo Brandão", "Marcos Rocha"], porte: "Grande" },
    { name: "Renascença Administração de Imóveis", site: "renascenca.com.br", phone: "(21) 2104-9050", cnpj: "42.155.633/0001-44", socios: ["Edison Parente", "Lucas Parente"], porte: "Grande" },
    { name: "Block Imóveis Barra", site: "blockimoveis.com.br", phone: "(21) 3388-5050", cnpj: "15.622.711/0001-22", socios: ["Marcelo Albuquerque"], porte: "Médio" },
    { name: "Julio Bogoricin Imóveis", site: "juliobogoricin.com", phone: "(21) 2203-2000", cnpj: "33.455.122/0001-11", socios: ["Julio Bogoricin", "Roberto Bogoricin"], porte: "Grande" },
    { name: "Estasa Administradora", site: "estasa.com.br", phone: "(21) 2505-2700", cnpj: "01.733.944/0001-77", socios: ["Luiz Fernando Barreto"], porte: "Grande" }
  ],
  "SP": [
    { name: "Lopes Imobiliária", site: "lopes.com.br", phone: "(11) 3067-0000", cnpj: "61.322.844/0001-02", socios: ["Francisco Lopes", "Marcos Lopes"], porte: "Grande" },
    { name: "Lello Condomínios e Aluguel", site: "lellocondominios.com.br", phone: "(11) 2797-7500", cnpj: "52.411.933/0001-99", socios: ["Jose Roberto Graiche", "Angélica Graiche"], porte: "Grande" },
    { name: "Fernandez Mera Negócios", site: "fmera.com.br", phone: "(11) 3048-8000", cnpj: "48.122.355/0001-44", socios: ["Gonzalo Fernandez"], porte: "Grande" },
    { name: "Coelho da Fonseca", site: "coelhodafonseca.com.br", phone: "(11) 3886-8200", cnpj: "44.911.233/0001-12", socios: ["Alvaro Coelho da Fonseca"], porte: "Grande" }
  ]
}

/**
 * Passo 1 e 2: Simula a busca combinada Google Maps + BrasilAPI para extração de Sócios
 */
export async function buscarEmpresasFisicas(cidade, estado, quantidade) {
  // Simula o delay de rede da raspagem de dados na internet
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  const listaEstado = BASE_MOCK_EMPRESAS[estado] || BASE_MOCK_EMPRESAS["RJ"];
  
  // Limita a quantidade solicitada pelo usuário
  return listaEstado.slice(0, quantidade).map(empresa => ({
    ...empresa,
    cidade: cidade,
    estado: estado
  }));
}

/**
 * Passo 3: Camada de Inteligência (IA)
 * Recebe os dados minerados e calcula o Score, e-mails prováveis e scripts de vendas
 */
export async function enriquecerDadosComIA(empresa) {
  // Simula o processamento analítico do cérebro da IA
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Lógica determinística baseada no perfil real da empresa para gerar notas de Score assertivas
  let score = 7;
  let justificativa = "Imobiliária local estável com processos de atendimento tradicionais.";
  let motivoContato = "Apresentar plataforma automatizada para redução de inadimplência em contratos.";
  
  if (empresa.porte === "Grande") {
    score = empresa.name.includes("APSA") || empresa.name.includes("Lello") ? 10 : 9;
    justificativa = `Grande administradora com volumosa carteira estimada. Gargalo crítico na conciliação de extratos bancários e repasses manuais.`;
    motivoContato = "Otimizar o tempo do time de backoffice centralizado em até 65% usando automação de repasses.";
  } else if (empresa.porte === "Médio") {
    score = 8;
    justificativa = "Empresa de médio porte em fase de expansão de bairros, precisando reter clientes através de tecnologia.";
    motivoContato = "Reter locadores oferecendo um portal de autoatendimento moderno e transparente.";
  }

  // Gera a estrutura probabilística de e-mails corporativos diretos dos decisores
  const emailsDeduzidos = empresa.socios.map(socio => {
    const nomeLimpo = socio.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const partes = nomeLimpo.split(" ");
    const primeiroNome = partes[0];
    const sobrenome = partes[partes.length - 1];
    return `${primeiroNome}.${sobrenome}@${empresa.site}`;
  });

  // Cria o roteiro tático para o SDR usar contra a secretária/gatekeeper no telefone
  const principalSocio = empresa.socios[0] || "Diretor de Operações";
  const scriptSdr = `Olá, boa tarde! Por gentileza, o ${principalSocio} está na imobiliária hoje? É o [Seu Nome] da nossa empresa. É referente a um alinhamento sobre a otimização e controle da carteira de contratos de locação na região de ${empresa.cidade}, ele costuma atender nesse ramal ou direto pelo WhatsApp da diretoria?`;

  return {
    ...empresa,
    score_potencial: score,
    justificativa_score: justificativa,
    motivo_contato: motivoContato,
    emails_provaveis: emailsDeduzidos,
    script_abordagem: scriptSdr,
    melhor_canal: "Telefone Interfone + WhatsApp",
    link_linkedin: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(principalSocio + " " + empresa.name)}`
  };
}
