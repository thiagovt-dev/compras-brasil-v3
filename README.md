# Compras Brasil v3

Um sistema completo de gestão de compras públicas e fornecedores desenvolvido com Next.js, TypeScript e Supabase.

## 📋 Sobre o Projeto

O Compras Brasil v3 é uma plataforma web que facilita a gestão de processos de compras públicas, conectando fornecedores e compradores através de uma interface moderna e intuitiva. O sistema permite o cadastro de fornecedores, gestão de produtos/serviços e acompanhamento de processos licitatórios.

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js 14 com TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Autenticação**: Supabase Auth
- **Estilização**: Tailwind CSS
- **Componentes UI**: Shadcn/ui
- **Deployment**: Vercel

## ✅ Funcionalidades Implementadas

### 🔐 Sistema de Autenticação
- Login e registro de usuários
- Proteção de rotas via middleware
- Redirecionamento automático baseado no status de autenticação
- Gerenciamento de sessões com Supabase Auth

### 👥 Gestão de Fornecedores
- Cadastro completo de fornecedores
- Perfil detalhado com informações empresariais
- Dashboard personalizado para fornecedores
- Gestão de dados cadastrais

### 📦 Catálogo de Produtos/Serviços
- Cadastro de produtos e serviços
- Categorização e organização
- Interface para visualização e edição

### 🏢 Sistema de Órgãos Públicos
- Cadastro de órgãos compradores
- Gestão de informações institucionais
- Relacionamento com processos de compra

### 📄 Processos Licitatórios
- Criação e gestão de processos de compra
- Acompanhamento de status
- Relacionamento entre órgãos e fornecedores

### 🎨 Interface do Usuário
- Design responsivo e moderno
- Componentes reutilizáveis
- Experiência de usuário otimizada
- Dashboard intuitivo

### 💬 Sala de Disputa (Sessão Pública)
- **Acesso Diferenciado**: Pregoeiros/Administradores são redirecionados para a sala de gestão no dashboard, enquanto Fornecedores e Cidadãos acessam uma visualização pública.
- **Controle de Abertura de Propostas**: Pregoeiros podem "Abrir Propostas" para iniciar a fase de análise, tornando-as visíveis para todos os participantes.
- **Classificação e Desclassificação**: Pregoeiros podem classificar e desclassificar propostas por lote/item, com justificativa obrigatória para desclassificação.
- **Anonimização de Fornecedores**: Nomes de fornecedores são anonimizados (ex: FOR001) durante a fase de propostas e disputa para garantir o sigilo.
- **Chat da Sessão**: Chat em tempo real com controle de habilitação/desabilitação pelo pregoeiro.
- **Visualização de Propostas**: Fornecedores e Cidadãos podem visualizar as propostas (anonimizadas) após a abertura pelo pregoeiro.

## 🔧 Configuração e Instalação

\`\`\`bash
# Clone o repositório
git clone [url-do-repositorio]

# Entre no diretório
cd compras-brasil-v3

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Execute o projeto em modo de desenvolvimento
npm run dev
\`\`\`

### Variáveis de Ambiente Necessárias

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
\`\`\`

## 📚 Estrutura do Projeto

\`\`\`
compras-brasil-v3/
├── app/                    # Páginas e layouts (App Router)
│   ├── dashboard/         # Área protegida do sistema
│   ├── login/            # Página de login
│   └── register/         # Página de registro
├── components/           # Componentes reutilizáveis
├── lib/                 # Utilitários e configurações
├── middleware.ts        # Middleware de autenticação
└── ...
\`\`\`

## 🔄 Melhorias Necessárias

### 🔨 Funcionalidades Pendentes

1.  **Sistema de Notificações**
    - Alertas em tempo real
    - Notificações por email
    - Dashboard de notificações

2.  **Gestão de Documentos**
    - Upload de arquivos
    - Validação de documentos
    - Histórico de versões

3.  **Sistema de Propostas**
    - Envio de propostas pelos fornecedores
    - Comparativo de propostas
    - Ranking automático

4.  **Relatórios e Analytics**
    - Relatórios gerenciais
    - Dashboards analíticos
    - Exportação de dados

5.  **Sistema de Mensagens**
    - Chat entre fornecedores e órgãos
    - Histórico de comunicações
    - Anexos em mensagens

### 🛠️ Melhorias Técnicas

1.  **Testes**
    - Implementar testes unitários
    - Testes de integração
    - Testes E2E com Cypress/Playwright

2.  **Performance**
    - Otimização de queries do banco
    - Cache de dados
    - Lazy loading de componentes

3.  **Segurança**
    - Validação de dados no backend
    - Rate limiting
    - Auditoria de ações

4.  **Monitoramento**
    - Logs estruturados
    - Monitoramento de erros
    - Métricas de performance

5.  **Configuração do Matcher**
    - O middleware atual tem `matcher: []` vazio
    - Implementar configuração adequada das rotas

### 🎨 Melhorias de UX/UI

1.  **Responsividade**
    - Otimização para dispositivos móveis
    - Progressive Web App (PWA)

2.  **Acessibilidade**
    - Compliance com WCAG
    - Navegação por teclado
    - Screen reader support

3.  **Feedback Visual**
    - Loading states
    - Estados de erro mais informativos
    - Animações e transições



## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
