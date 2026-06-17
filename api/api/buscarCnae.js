import fs from 'fs';
import path from 'path';

// Função auxiliar para limpar agressivamente qualquer texto (remover acentos, espaços nas pontas e deixar em maiúsculo)
function normalizarTexto(texto) {
  if (!texto) return '';
  return texto
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/"/g, "")               // Remove aspas que possam vir no texto
    .trim();
}

export default async function handler(request, response) {
  const { cidade, estado, quantidade } = request.query;

  if (!cidade) {
    return response.status(400).json({ error: "Cidade é obrigatória." });
  }

  const limite = parseInt(quantidade) || 5;
  
  // Normaliza o termo de busca enviado pelo usuário (ex: "Brasília" vira "BRASILIA")
  const cidadePesquisada = normalizarTexto(cidade);
  const ufDestino = estado ? estado.toUpperCase().trim() : "DF";

  try {
    const caminhoCsv = path.join(process.cwd(), 'data', `${ufDestino}.csv`);
    
    if (!fs.existsSync(caminhoCsv)) {
      return response.status(404).json({ error: `Base de dados para ${ufDestino} não encontrada.` });
    }

    const conteudoBruto = fs.readFileSync(caminhoCsv, 'utf-8');
    
    // Divide por quebra de linha de forma segura (Windows e Linux)
    const linhas = conteudoBruto.split(/\r?\n/);
    if (linhas.length < 2) return response.status(200).json([]);

    // Normaliza TODO o cabeçalho para ignorar maiúsculas/minúsculas e acentos nas colunas
    const cabecalhoNormalizado = linhas[0].split(',').map(h => normalizarTexto(h));

    // Procura os índices usando termos totalmente limpos e aceitando variações comuns
    const idxNome = cabecalhoNormalizado.findIndex(h => h.includes('RAZAO SOCIAL') || h.includes('NOME FANTASIA') || h.includes('EMPRESA'));
    const idxCnpj = cabecalhoNormalizado.findIndex(h => h.includes('CNPJ'));
    const idxMunicipio = cabecalhoNormalizado.findIndex(h => h.includes('MUNICIPIO') || h.includes('CIDADE'));
    const idxSocios = cabecalhoNormalizado.findIndex(h => h.includes('QUADRO SOCIETARIO') || h.includes('SOCIOS') || h.includes('SOCIO'));
    const idxEmail = cabecalhoNormalizado.findIndex(h => h.includes('EMAIL') || h.includes('E-MAIL'));
    const idxTelefone = cabecalhoNormalizado.findIndex(h => h.includes('TELEFONE') || h.includes('FONE') || h.includes('CELULAR'));

    const resultados = [];

    // Expressão regular para quebrar colunas respeitando aspas duplas (ideal para arquivos CSV)
    const regexValores = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

    for (let i = 1; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      if (!linha) continue;

      // Quebra a linha e limpa as aspas/espaços de cada coluna individualmente
      const colunas = linha.split(regexValores).map(c => c.replace(/^"|"$/g, '').trim());
      
      // Captura e limpa agressivamente o município desta linha do CSV
      const municipioItem = colunas[idxMunicipio] ? normalizarTexto(colunas[idxMunicipio]) : '';

      // Comparação flexível: se for exatamente igual ou se conter o termo pesquisado
      if (municipioItem === cidadePesquisada || municipioItem.includes(cidadePesquisada)) {
        
        let socioPrincipal = "Diretoria";
        if (colunas[idxSocios]) {
          // Extrai o nome do sócio antes de delimitadores como hífen ou ponto e vírgula
          socioPrincipal = colunas[idxSocios].split('-')[0].split(';')[0].replace(/"/g, '').trim();
        }

        // Gera um endereço de site limpo baseado no nome da empresa
        const razaoSocialRaw = colunas[idxNome] || '';
        const nomeLimpoParaSite = razaoSocialRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
        const siteGerado = nomeLimpoParaSite ? `${nomeLimpoParaSite}.com.br` : 'consultar.com.br';

        resultados.push({
          name: colunas[idxNome] || "Empresa Encontrada",
          cnpj: colunas[idxCnpj] || "N/A",
          phone: colunas[idxTelefone] || "Não disponível",
          socios: [socioPrincipal],
          email_receita: colunas[idxEmail] || "Não disponível",
          site: siteGerado,
          stack_tecnologico: "WordPress · Google Analytics",
          maturidade_empresa: "Empresa Consolidada",
          score_potencial: 10,
          link_linkedin: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(socioPrincipal)}`
        });

        if (resultados.length >= limite) break;
      }
    }

    return response.status(200).json(resultados);

  } catch (error) {
    return response.status(500).json({ error: `Erro no processamento interno: ${error.message}` });
  }
}
