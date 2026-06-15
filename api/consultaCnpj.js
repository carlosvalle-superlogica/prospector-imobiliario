// FUNÇÃO AUXILIAR: Varre o HTML do site em busca de pegadas tecnológicas
async function mapearStackTecnologico(siteUrl) {
  if (!siteUrl || siteUrl === "undefined") return "Sem site cadastrado";
  
  let url = siteUrl.toLowerCase().trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    // Limite de 4 segundos para não atrasar a busca
    const response = await fetch(url, { 
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(4000)
    });

    if (!response.ok) return "Site protegido ou inacessível";
    
    const html = await response.text();
    const stackDetectado = [];

    // Verificando as tecnologias
    if (html.includes('superlogica') || html.includes('vrs.superlogica')) stackDetectado.push('Superlógica 🏠');
    if (html.includes('kenlo') || html.includes('realsites')) stackDetectado.push('Kenlo / Ingaia 🏢');
    if (html.includes('vista.imob') || html.includes('vistacrm')) stackDetectado.push('Vista CRM 📊');
    if (html.includes('rdstation') || html.includes('rd-js')) stackDetectado.push('RD Station 🎯');
    if (html.includes('hubspot')) stackDetectado.push('HubSpot 🚀');
    if (html.includes('wp-content') || html.includes('wp-includes')) stackDetectado.push('WordPress 🌐');
    if (html.includes('connect.facebook.net') || html.includes('fbq(')) stackDetectado.push('Pixel Facebook 📱');
    if (html.includes('googletagmanager.com') || html.includes('gtag(')) stackDetectado.push('Google Analytics 📈');

    return stackDetectado.length > 0 ? stackDetectado.join(', ') : 'Tecnologias Básicas';

  } catch (error) {
    return "Site offline ou protegido";
  }
}

export default async function handler(request, response) {
  const { cnpj, site } = request.query;

  if (!cnpj) {
    return response.status(400).json({ error: "Nenhum CNPJ foi fornecido." });
  }

  try {
    // 1. Consulta os dados na API Pública
    const resGov = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`);
    
    if (!resGov.ok) {
      return response.status(resGov.status).json({ error: "Erro ao consultar CNPJ.ws" });
    }
    
    const dadosCnpj = await resGov.json();
    
    // 2. Varredura do site 
    const stackTecnologico = await mapearStackTecnologico(site);
    
    // 3. Junta tudo na variável certa e envia
    const dadosEnriquecidos = {
      ...dadosCnpj,
      stack_tecnologico: stackTecnologico
    };

    return response.status(200).json(dadosEnriquecidos);
    
  } catch (error) {
    return response.status(500).json({ error: "Erro interno no servidor da Vercel." });
  }
}
