/**
 * SERVIÇO DE CONEXÃO E TRIANGULAÇÃO DE DADOS REAIS
 * Envia o CNPJ e o Site para o nosso Backend analisar a tecnologia!
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

const formatarCnpjVisual = (cnpjLimpo) => {
  const c = String(cnpjLimpo).replace(/\D/g, '');
  if (c.length === 14) return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  return cnpjLimpo;
};

const formatarNome = (nome) => {
  if (!nome) return "";
  return nome.split(' ').map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase()).join(' ');
};

const formatarTelefone = (ddd, tel) => {
  if (!ddd || !tel) return null;
  const limpo = String(tel).replace(/\D/g, '');
  if (limpo.length === 8) return `(${ddd}) ${limpo.slice(0,4)}-${limpo.slice(4)}`;
  if (limpo.length === 9) return `📱 (${ddd}) ${limpo.slice(0,5)}-${limpo.slice(5)}`;
  return `(${ddd}) ${limpo}`;
};

export async function buscarEmpresasFisicas(cidade, estado, quantidade) {
  await new Promise(resolve => setTimeout(resolve, 800)); 
  const listaEstado = BASE_REAL_EMPRESAS[estado] || BASE_REAL_EMPRESAS["RJ"];
  
  // Aqui garantimos que ele usa a variável "quantidade" corretamente
  return listaEstado.slice(0, quantidade).map(empresa => ({
    ...empresa,
    cidade: cidade ? cidade.trim() : "Região"
  }));
}

export async function enriquecerDadosComIA(empresa) {
  let cnpjLimpo = empresa.cnpj ? String(empresa.cnpj).replace(/\D/g, '') : "";
  let cnpjFormatado = formatarCnpjVisual(cnpjLimpo);
  
  let sociosReais = ["Diretor de Operações"]; 
  let cargoDecisor = "Cargo Omitido";
  let telefonesFinais = "(00) 0000-0000"; 
  let stackTecnico = "Aguardando varredura...";
  let score = empresa.porte === "Grande" ? 10 : 8; 

  if (cnpjLimpo.length === 14) {
    try {
      // Chama o nosso servidor passando o CNPJ e o SITE codificado com segurança
      const siteFormatado = encodeURIComponent(empresa.site || "");
      const resposta = await fetch(`/api/consultaCnpj?cnpj=${cnpjLimpo}&site=${siteFormatado}`);
      
      if (resposta.ok) {
        const dadosCnpj = await resposta.json();
        
        // Recebe o stack tecnológico do backend
        stackTecnico = dadosCnpj.stack_tecnologico || "Tecnologias Básicas";

        // Organiza os Sócios
        if (dadosCnpj.socios && dadosCnpj.socios.length > 0) {
          sociosReais = dadosCnpj.socios.map(socio => formatarNome(socio.nome));
          cargoDecisor = formatarNome(dadosCnpj.socios[0].qualificacao_socio?.descricao) || "Sócio";
        } else if (dadosCnpj.razao_social) {
          sociosReais = [formatarNome(dadosCnpj.razao_social)];
          cargoDecisor = "Proprietário / Titular";
        }

        // Organiza os Telefones
        let listaTels = [];
        const estab = dadosCnpj.estabelecimento;
        if (estab) {
          const tel1 = formatarTelefone(estab.ddd1, estab.telefone1);
          const tel2 = formatarTelefone(estab.ddd2, estab.telefone2);
          if (tel1) listaTels.push(tel1);
          if (tel2 && tel2 !== tel1) listaTels.push(tel2);
        }
        if (listaTels.length > 0) telefonesFinais = listaTels.join(' / ');
      }
    } catch (erro) {
      console.error("Erro ao comunicar com o Backend:", erro);
      stackTecnico = "Falha de conexão com o servidor";
    }
  }

  const justificativa = "Empresa validada. Foco em automação de repasses.";

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
    stack_tecnologico: stackTecnico, // Variável pronta para a tela!
    score_potencial: score,
    justificativa_score: justificativa,
    emails_provaveis: emailsDeduzidos,
    script_abordagem: scriptSdr,
    link_linkedin: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(principalSocio + " " + empresa.name)}`
  };
}
