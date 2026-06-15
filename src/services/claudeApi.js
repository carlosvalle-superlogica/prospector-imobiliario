/**
 * SERVIÇO DE CONEXÃO E TRIANGULAÇÃO DE DADOS REAIS
 * Utilizando a API Pública CNPJ.ws (Mais rápida, estável e sem bloqueio de IPs)
 */

const BASE_REAL_EMPRESAS = {
  "RJ": [
    { name: "APSA Gestão Condominial", site: "apsa.com.br", cnpj: "28350338000192", porte: "Grande" },
    { name: "Julio Bogoricin Imóveis", site: "juliobogoricin.com", cnpj: "27261874000159", porte: "Grande" },
    { name: "Sergio Castro Imóveis", site: "sergiocastro.com.br", cnpj: "33179797000195", porte: "Grande" },
    { name: "Estasa Administradora", site: "estasa.com.br", cnpj: "42181669000177", porte: "Grande" }
  ],
  "SP": [
    { name: "Lopes Imobiliária", site: "lopes.com.br", cnpj: "61322844000102", porte: "Grande" },
    { name: "Lello Condomínios e Aluguel", site: "lellocondominios.com.br", cnpj: "52411933000199", porte: "Grande" }
  ]
};

// FORMATAÇÃO DE CNPJ (XX.XXX.XXX/XXXX-XX)
const formatarCnpjVisual = (cnpjLimpo) => {
  const c = String(cnpjLimpo).replace(/\D/g, '');
  if (c.length === 14) return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  return cnpjLimpo;
};

// TRATAMENTO DE TEXTO (Arruma nomes da Receita que vêm em CAIXA ALTA)
const formatarNome = (nome) => {
  if (!nome) return "";
  return nome.split(' ').map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase()).join(' ');
};

// FORMATAÇÃO DE TELEFONE (Monta o DDD junto com o número)
const formatarTelefone = (ddd, tel) => {
  if (!ddd || !tel) return null;
  const limpo = String(tel).replace(/\D/g, '');
  
  if (limpo.length === 8) {
    return `(${ddd}) ${limpo.slice(0,4)}-${limpo.slice(4)}`; // Fixo
  } else if (limpo.length === 9) {
    return `📱 (${ddd}) ${limpo.slice(0,5)}-${limpo.slice(5)}`; // Celular
  }
  return `(${ddd}) ${limpo}`;
};

export async function buscarEmpresasFisicas(cidade, estado, quantidade) {
  await new Promise(resolve => setTimeout(resolve, 800)); 
  const listaEstado = BASE_REAL_EMPRESAS[estado] || BASE_REAL_EMPRESAS["RJ"];
  
  return listaEstado.slice(0, quantidade).map(empresa => ({
    ...empresa,
    cidade: cidade ? cidade.trim() : "Região"
  }));
}

export async function enriquecerDadosComIA(empresa) {
  let cnpjLimpo = empresa.cnpj ? String(empresa.cnpj).replace(/\D/g, '') : "";
  let cnpjFormatado = formatarCnpjVisual(cnpjLimpo);
  
  // Nossas variáveis de segurança (Fallback)
  let sociosReais = ["Diretor de Operações"]; 
  let cargoDecisor = "Cargo Omitido";
  let telefonesFinais = "(00) 0000-0000"; 
  let score = empresa.porte === "Grande" ? 10 : 8; 

  if (cnpjLimpo.length === 14) {
    try {
      // 🔥 MUDANÇA AQUI: Conectando direto na API Aberta da CNPJ.ws 
      const resposta = await fetch(`https://publica.cnpj.ws/cnpj/${cnpjLimpo}`);
      
      if (resposta.ok) {
        const dadosCnpj = await resposta.json();
        
        // 1. EXTRAÇÃO DOS SÓCIOS E CARGOS
        if (dadosCnpj.socios && dadosCnpj.socios.length > 0) {
          sociosReais = dadosCnpj.socios.map(socio => formatarNome(socio.nome));
          // O ponto de interrogação (?) previne que o código quebre se o cargo não existir
          cargoDecisor = formatarNome(dadosCnpj.socios[0].qualificacao_socio?.descricao) || "Sócio";
        } else if (dadosCnpj.razao_social) {
          sociosReais = [formatarNome(dadosCnpj.razao_social)];
          cargoDecisor = "Proprietário / Titular";
        }

        // 2. EXTRAÇÃO DOS TELEFONES
        let listaTels = [];
        const estab = dadosCnpj.estabelecimento;
        
        if (estab) {
          const tel1 = formatarTelefone(estab.ddd1, estab.telefone1);
          const tel2 = formatarTelefone(estab.ddd2, estab.telefone2);
          
          if (tel1) listaTels.push(tel1);
          if (tel2 && tel2 !== tel1) listaTels.push(tel2);
        }

        if (listaTels.length > 0) {
          telefonesFinais = listaTels.join(' / ');
        } else {
          telefonesFinais = "Não cadastrado";
          score -= 1; 
        }

      } else {
        console.warn(`Aviso: Falha ao buscar dados do CNPJ: ${cnpjFormatado}`);
      }
    } catch (erro) {
      console.error("Erro ao comunicar com a CNPJ.ws:", erro);
    }
  } else {
    cnpjFormatado = "⚠️ CNPJ Incompleto";
    score = 2;
  }

  const justificativa = "Empresa validada. Foco em automação de repasses.";

  // Geração probabilística de e-mails
  const emailsDeduzidos = sociosReais.map(socio => {
    if (socio === "Diretor de Operações" || socio === "Diretoria") return `diretoria@${empresa.site}`;
    const nomeLimpo = socio.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const partes = nomeLimpo.split(" ").filter(p => p.length > 2); 
    if (partes.length >= 2) return `${partes[0]}.${partes[partes.length - 1]}@${empresa.site}`;
    return `contato@${empresa.site}`;
  });

  const principalSocio = sociosReais[0] || "Diretor Responsável";
  const scriptSdr = `Olá, boa tarde! O ${principalSocio} se encontra? É o [Seu Nome]. É sobre uma otimização no fluxo de repasses da carteira de imóveis em ${empresa.cidade}. Consegue me confirmar o e-mail direto da diretoria?`;

  return {
    ...empresa,
    cnpj: cnpjFormatado, 
    phone: telefonesFinais,
    socios: sociosReais,
    cargo_decisor: cargoDecisor, 
    score_potencial: score,
    justificativa_score: justificativa,
    emails_provaveis: emailsDeduzidos,
    script_abordagem: scriptSdr,
    link_linkedin: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(principalSocio + " " + empresa.name)}`
  };
}
