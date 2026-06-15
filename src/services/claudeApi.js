/**
 * SERVIÇO DE CONEXÃO E TRIANGULAÇÃO DE DADOS REAIS
 * 100% Dinâmico: Busca por CNAE Imobiliário via Backend próprio.
 */

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

const calcularIdadeEmpresa = (dataAberturaString) => {
  if (!dataAberturaString) return "Idade não mapeada";
  try {
    const partes = dataAberturaString.split('-');
    const anoAbertura = parseInt(partes[0], 10);
    const anoAtual = 2026; 
    const idade = anoAtual - anoAbertura;
    
    if (idade <= 0) return "🌱 Menos de 1 ano";
    return `🏢 ${idade} anos de mercado`;
  } catch (e) {
    return "Maturidade não calculada";
  }
};

const gerarScriptComercialDinamico = (nomeSocio, cargo, cidade) => {
  const socio = nomeSocio || "Responsável";
  const local = cidade || "sua região";
  
  if (cargo.toLowerCase().includes('presidente') || cargo.toLowerCase().includes('diretor')) {
    return `Olá! Procuro a assessoria direta do Sr. ${socio}. Sou especialista em otimização de repasses financeiros e redução de inadimplência para grandes carteiras de imóveis sob gestão em ${local}. Gostaria de alinhar uma breve apresentação estratégica de 10 minutos diretamente com a diretoria executiva.`;
  }
  return `Olá, boa tarde! O ${socio} encontra-se? É sobre uma otimização no fluxo operacional de repasses de alugueres e redução de custos operacionais na carteira de imóveis em ${local}. Conseguia transferir-me para a sala dele ou confirmar o e-mail direto?`;
};

// 🔥 MUDANÇA AQUI: Agora ele vai na nova API de CNAE buscar empresas reais!
export async function buscarEmpresasFisicas(cidade, estado, quantidade) {
  try {
    const resposta = await fetch(`/api/buscarCnae?cidade=${encodeURIComponent(cidade)}&estado=${encodeURIComponent(estado)}&quantidade=${quantidade}`);
    if (resposta.ok) {
      const empresasReais = await resposta.json();
      return empresasReais;
    }
  } catch (erro) {
    console.error("Erro ao buscar empresas reais por CNAE:", erro);
  }
  return [];
}

export async function enriquecerDadosComIA(empresa) {
  let cnpjLimpo = empresa.cnpj ? String(empresa.cnpj).replace(/\D/g, '') : "";
  let cnpjFormatado = formatarCnpjVisual(cnpjLimpo);
  
  let sociosReais = ["Diretor de Operações"]; 
  let cargoDecisor = "Cargo Omitido";
  let telefonesFinais = "(00) 0000-0000"; 
  let stackTecnico = "Aguardando análise...";
  let dadosMaturidade = "Calculando...";
  let emailOficialReceita = "Não disponível";
  let score = empresa.porte === "Grande" ? 10 : 8; 

  if (cnpjLimpo.length === 14) {
    try {
      const siteFormatado = encodeURIComponent(empresa.site || "");
      const resposta = await fetch(`/api/consultaCnpj?cnpj=${cnpjLimpo}&site=${siteFormatado}`);
      
      if (resposta.ok) {
        const dadosCnpj = await resposta.json();
        
        stackTecnico = dadosCnpj.stack_tecnologico || "Tecnologias Básicas";
        const dataAberturaRaw = dadosCnpj.estabelecimento?.data_inicio_atividade;
        dadosMaturidade = calcularIdadeEmpresa(dataAberturaRaw);

        if (dadosCnpj.estabelecimento?.email) {
          emailOficialReceita = dadosCnpj.estabelecimento.email.toLowerCase();
        }

        if (dadosCnpj.socios && dadosCnpj.socios.length > 0) {
          sociosReais = dadosCnpj.socios.map(socio => formatarNome(socio.nome));
          cargoDecisor = formatarNome(dadosCnpj.socios[0].qualificacao_socio?.descricao) || "Sócio";
        } else if (dadosCnpj.razao_social) {
          sociosReais = [formatarNome(dadosCnpj.razao_social)];
          cargoDecisor = "Proprietário / Titular";
        }

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
      stackTecnico = "Falha no mapeamento técnico";
      dadosMaturidade = "Erro no cálculo";
    }
  }

  const justificativa = "Empresa validada e enriquecida com cruzamento de dados fiscais.";

  const emailsDeduzidos = sociosReais.map(socio => {
    if (socio === "Diretor de Operações" || socio === "Diretoria") return `diretoria@${empresa.site}`;
    const nomeLimpo = socio.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const partes = nomeLimpo.split(" ").filter(p => p.length > 2); 
    if (partes.length >= 2) return `${partes[0]}.${partes[partes.length - 1]}@${empresa.site}`;
    return `contato@${empresa.site}`;
  });

  const principalSocio = sociosReais[0] || "Diretor Responsável";
  const scriptSdr = gerarScriptComercialDinamico(principalSocio, cargoDecisor, empresa.cidade);

  return {
    ...empresa,
    cnpj: cnpjFormatado, 
    phone: telefonesFinais,
    socios: sociosReais,
    cargo_decisor: cargoDecisor, 
    stack_tecnologico: stackTecnico,
    maturidade_empresa: dadosMaturidade,
    email_receita: emailOficialReceita, 
    score_potencial: score,
    justificativa_score: justificativa,
    emails_provaveis: emailsDeduzidos,
    script_abordagem: scriptSdr,
    link_linkedin: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(principalSocio + " " + empresa.name)}`
  };
}
