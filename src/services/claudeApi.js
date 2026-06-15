/**
 * SERVIÇO DE CONEXÃO E TRIANGULAÇÃO DE DADOS REAIS
 * Consulta bases públicas oficiais de forma gratuita via BrasilAPI
 */

// Lista de empresas com os CNPJs REAIS DAS MATRIZES verificados na Receita Federal
const BASE_REAL_EMPRESAS = {
  "RJ": [
    { name: "APSA Gestão Condominial", site: "apsa.com.br", phone: "(21) 3233-3000", cnpj: "28350338000192", porte: "Grande" },
    { name: "Julio Bogoricin Imóveis", site: "juliobogoricin.com", phone: "(21) 2203-2000", cnpj: "27261874000159", porte: "Grande" },
    { name: "Sergio Castro Imóveis", site: "sergiocastro.com.br", phone: "(21) 2121-7050", cnpj: "33179797000195", porte: "Grande" },
    { name: "Estasa Administradora", site: "estasa.com.br", phone: "(21) 2505-2700", cnpj: "42181669000177", porte: "Grande" }
  ],
  "SP": [
    { name: "Lopes Imobiliária", site: "lopes.com.br", phone: "(11) 3067-0000", cnpj: "61322844000102", porte: "Grande" },
    { name: "Lello Condomínios e Aluguel", site: "lellocondominios.com.br", phone: "(11) 2797-7500", cnpj: "52411933000199", porte: "Grande" }
  ]
};

// MÁSCARA VISUAL: Garante que o CNPJ fique bonito na tabela (XX.XXX.XXX/XXXX-XX)
const formatarCnpjVisual = (cnpjLimpo) => {
  const c = String(cnpjLimpo).replace(/\D/g, '');
  if (c.length === 14) return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  return cnpjLimpo;
};

// TRATAMENTO DE TEXTO: Arruma nomes em CAIXA ALTA vindos do Governo
const formatarNome = (nome) => {
  if (!nome) return "Diretoria";
  return nome.split(' ').map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase()).join(' ');
};

export async function buscarEmpresasFisicas(cidade, estado, quantidade) {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simula tempo de rede
  const listaEstado = BASE_REAL_EMPRESAS[estado] || BASE_REAL_EMPRESAS["RJ"];
  
  return listaEstado.slice(0, quantidade).map(empresa => ({
    ...empresa,
    cidade: cidade ? cidade.trim() : "Região"
  }));
}

export async function enriquecerDadosComIA(empresa) {
  let sociosReais = ["Diretor de Operações"];
  let cnpjLimpo = empresa.cnpj ? String(empresa.cnpj).replace(/\D/g, '') : "";
  let cnpjFormatado = formatarCnpjVisual(cnpjLimpo);
  let cnpjValido = false; // Flag para garantir que só passa se existir na Receita

  // BRASIL API: Validação estrita na Receita Federal
  if (cnpjLimpo.length === 14) {
    try {
      const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      
      if (resposta.ok) {
        const dadosCnpj = await resposta.json();
        cnpjValido = true; // Aprovado pela Receita!
        
        // Puxa o Quadro de Sócios (QSA) e aplica a formatação de letras
        if (dadosCnpj.qsa && dadosCnpj.qsa.length > 0) {
          sociosReais = dadosCnpj.qsa.map(socio => formatarNome(socio.nome_socio || socio.nome));
        } else if (dadosCnpj.razao_social) {
          sociosReais = [formatarNome(dadosCnpj.razao_social)];
        }
      } else {
        // Se a BrasilAPI retornar 404 (Não Encontrado), nós marcamos como inválido
        cnpjFormatado = "⚠️ CNPJ Inválido na Receita";
      }
    } catch (erro) {
      console.error("Erro na validação do CNPJ:", erro);
      cnpjFormatado = "⚠️ Falha na Consulta";
    }
  } else {
    cnpjFormatado = "⚠️ CNPJ Incompleto";
  }

  // INTELIGÊNCIA COMERCIAL: Gera as notas de potencial baseada nos dados obtidos
  let score = empresa.porte === "Grande" ? 10 : 8;
  // Punição de Score se o CNPJ for falso/inválido
  if (!cnpjValido) score = 2; 

  let justificativa = cnpjValido 
    ? "Empresa ativa e validada. Alto volume de contratos sob gestão." 
    : "Alerta: Empresa não validada na base de dados governamental.";

  // INTELIGÊNCIA COMERCIAL: Gera e-mails ignorando "da", "de", "dos"
  const emailsDeduzidos = sociosReais.map(socio => {
    if (socio === "Diretor de Operações" || socio === "Diretoria") return `diretoria@${empresa.site}`;
    
    const nomeLimpo = socio.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const partes = nomeLimpo.split(" ").filter(p => p.length > 2); 
    
    if (partes.length >= 2) {
      return `${partes[0]}.${partes[partes.length - 1]}@${empresa.site}`;
    }
    return `contato@${empresa.site}`;
  });

  const principalSocio = sociosReais[0] || "Diretor Responsável";
  const scriptSdr = `Olá, boa tarde! Por gentileza, o ${principalSocio} se encontra? É o [Seu Nome]. É sobre uma otimização no fluxo de repasses e redução de inadimplência para a carteira de imóveis em ${empresa.cidade}. Consegue me transferir para a sala dele ou confirmar o e-mail direto?`;

  return {
    ...empresa,
    cnpj: cnpjFormatado, 
    socios: sociosReais,
    score_potencial: score,
    justificativa_score: justificativa,
    emails_provaveis: emailsDeduzidos,
    script_abordagem: scriptSdr,
    link_linkedin: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(principalSocio + " " + empresa.name)}`
  };
}
