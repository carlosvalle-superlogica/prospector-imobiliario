export default async function handler(request, response) {
  // Pega o CNPJ que o nosso sistema enviou pela URL
  const { cnpj } = request.query;

  if (!cnpj) {
    return response.status(400).json({ error: "Nenhum CNPJ foi fornecido." });
  }

  try {
    // O Servidor da Vercel vai até a BrasilAPI consultar (Sem bloqueio de navegador!)
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    const data = await res.json();
    
    // Devolve os dados limpos para a nossa tela
    return response.status(200).json(data);
    
  } catch (error) {
    return response.status(500).json({ error: "Erro interno ao consultar o Governo." });
  }
}
