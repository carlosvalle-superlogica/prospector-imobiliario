// FUNÇÃO AUXILIAR: Varre o HTML do site em busca de pegadas tecnológicas
async function mapearStackTecnologico(siteUrl) {
  if (!siteUrl || siteUrl === "undefined" || siteUrl.trim() === "") {
    return "Sem site cadastrado";
  }
  
  let url = siteUrl.toLowerCase().trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    // Limite rigoroso de 4 segundos para a varredura não atrasar a resposta do servidor
    const response = await fetch(url, { 
      method: 'GET',
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
      },
      signal: AbortSignal.timeout(4000)
    });

    if (!response.ok) return "Site protegido ou inacessível";
    
    const html = await response.text();
    const stackDetectado = [];

    // 1. Identificação de Plataformas Imobiliárias / CRMs de Mercado
    if (html.includes('superlogica') || html.includes('vrs.superlogica')) stackDetectado.push('Superlógica 🏠');
    if (html.includes('kenlo') || html.includes('realsites') || html.includes('ingaia')) stackDetectado.push('Kenlo / Ingaia 🏢');
    if (html.includes('vista.imob') || html.includes('vistacrm')) stackDetectado.push('Vista CRM 📊');

    // 2. Identificação de Ferramentas de Automação de Marketing e Vendas
    if (html.includes('rdstation') || html.includes('rd-js') || html.includes('rdstation-popup')) stackDetectado.push('RD Station 🎯');
    if (html.includes('hubspot') || html.includes('hs-script')) stackDetectado.push('HubSpot 🚀');

    // 3. Infraestrutura, CMS e Rastreamento de Tráfego
    if (html.includes('wp-content') || html.includes('wp-includes')) stackDetectado.push('WordPress 🌐');
    if (html.includes('connect.facebook.net') || html.includes('fbq(')) stackDetectado.push('Pixel Facebook 📱');
    if (html.includes('googletagmanager.com') || html.includes('gtag(')) stackDetectado.push('Google Analytics 📈');

    return stackDetectado.length > 0 ? stackDetectado.join(', ') : 'Tecnologias Básicas';

  } catch (error) {
    return "Site offline ou com bloqueio";
  }
}

export default async function handler(request, response) {
  const { cnpj, site } = request.query;

  if (!cnpj) {
    return response.status(400).json({ error: "O parâmetro CNPJ é obrigatório." });
  }

  try {
    // 1. Consulta estável e oficial à API Pública
    const resGov = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`);
    
    if (!resGov.ok) {
      return response.status(resGov.status).json({ error: "Erro ao obter dados da base pública do CNPJ." });
    }
    
    const dadosCnpj = await resGov.json();
    
    // 2. Executa a varredura tecnológica do site em segundo plano
    const stackTecnologico = await mapearStackTecnologico(site);
    
    // 3. Consolidação e enriquecimento de dados estruturados
    const dadosEnriquecidos = {
      ...dadosCnpj,
      stack_tecnologico: stackTecnologico
    };

    return response.status(200).json(dadosEnriquecidos);
    
  } catch (error) {
    console.error("Erro interno no servidor Serverless:", error);
    return response.status(500).json({ error: "Erro interno no servidor Serverless da Vercel." });
  }
}
