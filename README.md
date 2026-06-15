# 📋 Prospector Imobiliário — Inteligência de Vendas Outbound B2B

O **Prospector Imobiliário** é uma ferramenta de automação e enriquecimento de dados projetada especificamente para o setor imobiliário (administradoras de aluguel, condomínios e gestão de imóveis). Ela ajuda equipes comerciais e SDRs a minerar leads altamente qualificados de forma 100% gratuita, sem necessidade de assinaturas de bases de dados caras, respeitando as conformidades regulatórias e maximizando a conversão de agendamentos.

---

## 🎯 Arquitetura de Triangulação de Dados (Como Funciona)

A ferramenta contorna os problemas clássicos da prospecção B2B (como telefones que caem em escritórios de contabilidade ou secretárias bloqueando o contato) cruzando dados públicos em tempo real diretamente do navegador através de três camadas:

1. **Camada de Prospecção Inicial (Google Maps API):** Minera empresas em funcionamento na cidade selecionada, capturando o Nome Fantasia, Site Oficial e Telefone Geral de Atendimento Comercial.
2. **Camada de Validação Fiscal (BrasilAPI - Receita Federal):** Cruza as informações da marca para isolar o CNPJ e extrair o Quadro de Sócios e Administradores (QSA), trazendo os nomes reais dos proprietários e tomadores de decisão.
3. **Camada de Inteligência de Vendas (IA):** Analisa o perfil da empresa, deduz os padrões de e-mails corporativos diretos dos sócios, calcula um Score de Potencial (1-10) e gera uma proposta de valor contextualizada com scripts cirúrgicos de quebra de barreira para o SDR utilizar no telefone geral.

---

## 📊 Fluxo de Trabalho Integrado com o HubSpot

A ferramenta atua como uma fábrica de listas prontas para o seu CRM. O fluxo operacional funciona em três passos simples:

* **Filtro Anti-Lixo:** O sistema faz a leitura de uma base em formato CSV (`clientes_hubspot.csv`) que você exporta do seu próprio HubSpot e deixa na pasta do projeto. Se a empresa já constar na lista, ela recebe o marcador do status real do CRM, impedindo que você duplique leads ou suba clientes ativos novamente.
* **Exportação Direta:** Ao final do processamento, o painel gera um arquivo CSV perfeitamente compatível com as propriedades nativas do HubSpot (Nome da Empresa, Razão Social, CNPJ, Website, Telefone Geral, Nome do Decisor, E-mail Provável do Decisor, Score de Potencial e Script Comercial).
* **Foco do SDR:** No HubSpot, a liderança comercial distribui a lista ordenando pelo **Score**. O SDR já abre a tarefa de ligação sabendo o nome do dono e o que falar para passar pelo filtro do atendimento.

---

## 📦 Estrutura do Projeto Tecnológico

```text
prospector-imobiliario/
├── index.html                  ← Entrada principal da aplicação
├── package.json                ← Dependências (React 18, Vite, Tailwind CSS, Lucide Icons)
├── vite.config.js              ← Configuração de compilação rápida do Vite
├── tailwind.config.js          ← Configurações de layout utilitário do Tailwind
├── postcss.config.js           ← Processador de styles css
├── public/
│   └── clientes_hubspot.csv   ← Base de dados exportada do seu CRM para cross-check
└── src/
    ├── main.jsx                ← Inicialização do React
    ├── index.css               ← Estilos globais e diretivas do Tailwind
    ├── App.jsx                 ← Componente raiz e montagem das telas do Dashboard
    ├── services/
    │   └── claudeApi.js        ← Engine de comunicação, prompts estruturados e fallback de IA
    ├── hooks/
    │   └── useProspector.js    ← Orquestrador do Pipeline (Maps ➔ CNPJ ➔ CrossCheck CSV ➔ IA)
    └── components/
        ├── ui.jsx              ← Elementos reativos (Badges de Score, Spinners, Alertas)
        ├── SearchForm.jsx      ← Filtros de localização e volumetria de leads
        ├── ProgressBar.jsx     ← Monitor de processamento síncrono das etapas
        ├── LeadCard.jsx        ← Card expansível de análise de inteligência do Lead
        ├── LogPanel.jsx        ← Terminal escuro com logs das requisições em tempo real
        └── LgpdBanner.jsx      ← Aviso de conformidade legal de dados de CNPJ públicos
