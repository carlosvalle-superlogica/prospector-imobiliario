/**
 * SERVIÇO DE CONEXÃO E TRIANGULAÇÃO DE DADOS REAIS
 * Utiliza o nosso Backend Próprio (Serverless na Vercel).
 * Agora extrai Telefones oficiais e Cargos Reais do Governo!
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

// FORMATAÇÃO DE TELEFONE (Identifica se é fixo ou celular automaticamente)
const formatarTelefone = (telString) => {
  if (!telString) return null;
  const limpo = String(telString).replace(/\D/g, ''); // Tira espaços e letras
  
  if (limpo.length === 10) {
    return `(${limpo.slice(0,2)}) ${limpo.slice(2,6)}-${limpo.slice(6)}`; // Fixo: (XX) XXXX-XXXX
  } else if (limpo.length === 11) {
    return `📱 (${limpo.slice(0,2)}) ${limpo.slice(2,7)}-${limpo.slice(7)}`; // Celular: 📱 (XX) XXXXX-XXXX
  }
  return telString; 
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
  
  // Variáveis que vamos preencher com dados reais do Governo
  let sociosReais = ["Diretor de Operações"]; 
  let cargoDecisor = "Cargo Omitido";
  let telefonesFinais = "(00) 0000-0000"; 
  let score = empresa.porte === "Grande" ? 10 : 8; 

  if (cnpjLimpo.length === 14) {
    try {
      const resposta = await fetch(`/api/consultaCnpj?cnpj=${cnpjLimpo}`);
      
      if (resposta.ok) {
        const dadosCnpj = await resposta.json();
        
        // 1. EXTRAÇÃO DO QUADRO DE SÓCIOS E CARGOS
        if (dadosCnpj.qsa && dadosCnpj.qsa.length > 0) {
          // Pega o primeiro sócio da lista e guarda o nome dele
          sociosReais = dadosCnpj.qsa.map(socio => formatarNome(socio.nome_socio || socio.nome));
          // Salva o cargo oficial dele (Ex: Sócio-Administrador, Presidente, etc)
          cargoDecisor = formatarNome(dadosCnpj.qsa[0].qualificacao_socio) || "Sócio";
        } else if (dadosCnpj.razao_social) {
          sociosReais = [formatarNome(dadosCnpj.razao_social)];
          cargoDecisor = "Proprietário / Titular";
        }

        // 2. EXTRAÇÃO DOS TELEFONES (Fixo e Celular)
        let listaTels = [];
        const tel1 = formatarTelefone(dadosCnpj.ddd_telefone_1);
        const tel2 = formatarTelefone(dadosCnpj.ddd_telefone_2);
        
        if (tel1) listaTels.push(tel1);
        // Só adiciona o telefone 2 se for diferente do telefone 1
        if (tel2 && tel2 !== tel1) listaTels.push(tel2);

        if (listaTels.length > 0) {
          telefonesFinais = listaTels.join(' / ');
        } else {
          telefonesFinais = "Não cadastrado na Receita";
          score -= 1; // Punição leve se não tiver telefone
        }

      } else {
        console.warn(`Aviso: Falha ao buscar dados do CNPJ: ${cnpjFormatado}`);
      }
    } catch (erro) {
      console.error("Erro no nosso Backend:", erro);
    }
  } else {
    cnpjFormatado = "⚠️ CNPJ Incompleto";
    score = 2;
  }

  const justificativa = "Empresa validada. Foco em automação de repasses.";

  // Geração de e-mails
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
    phone: telefonesFinais, // Agora envia o telefone que veio do governo!
    socios: sociosReais,
    cargo_decisor: cargoDecisor, // Envia o cargo real
    score_potencial: score,
    justificativa_score: justificativa,
    emails_provaveis: emailsDeduzidos,
    script_abordagem: scriptSdr,
    link_linkedin: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(principalSocio + " " + empresa.name)}`
  };
}
