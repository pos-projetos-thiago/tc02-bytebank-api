# Bytebank API

Backend REST para o **Bytebank**, aplicação de gerenciamento financeiro pessoal desenvolvida no **Tech Challenge — FIAP Pós-Tech**.

A API gerencia usuários, contas bancárias, cartões e transações financeiras, com autenticação JWT e documentação interativa via Swagger.

## Stack Tecnológica

- **Runtime:** Node.js 18+ 
- **Framework:** Express.js
- **Banco de Dados:** MongoDB + Mongoose ODM
- **Autenticação:** JWT (JSON Web Tokens)
- **Documentação:** Swagger/OpenAPI 3.0
- **Testes:** Jest + Supertest
- **Containerização:** Docker

## Funcionalidades

- Cadastro e autenticação de usuários com JWT
- Criação automática de conta débito e cartão no registro
- Consulta de conta com transações e cartões vinculados
- CRUD completo de transações (débito/crédito)
- Geração de extratos por conta
- Atualização de perfil do usuário autenticado
- Documentação interativa Swagger em `/docs`
- Persistência flexível (MongoDB em memória para desenvolvimento, externo para produção)
- Backup automático em JSON durante desenvolvimento

## Pré-requisitos

- Node.js 18 ou superior
- npm ou yarn
- MongoDB (para ambiente de produção)

## Instalação e Execução

### 1. Clonar o repositório
```bash
git clone <url-do-repositorio>
cd bytebank-api
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/bytebank
```

### 4. Executar a aplicação

**Desenvolvimento** (MongoDB em memória + backup automático):
```bash
npm run dev
```
Servidor disponível em: `http://localhost:3000`

**Produção** (requer MongoDB externo):
```bash
npm start
```
Servidor disponível em: `http://localhost:4000` (ou porta definida no `.env`)

## Variáveis de Ambiente

| Variável | Descrição | Valor Padrão |
|----------|-----------|--------------|
| `NODE_ENV` | Ambiente de execução (`development`, `production`, `test`) | `development` |
| `PORT` | Porta do servidor | `3000` |
| `MONGO_URI` | URI de conexão MongoDB (obrigatório em produção) | - |

**Nota:** Em ambiente de desenvolvimento/teste sem `MONGO_URI`, a API utiliza MongoDB em memória com backup automático em `src/data/backup.json`.

## Documentação da API

### Swagger UI
Com o servidor em execução, acesse a documentação interativa:
```
http://localhost:3000/docs
```

### Autenticação
Rotas protegidas requerem header de autorização:
```
Authorization: Bearer <seu-token-jwt>
```

### Endpoints Principais

#### Rotas Públicas

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/user` | Criar novo usuário |
| `GET` | `/user` | Listar todos os usuários |
| `POST` | `/user/auth` | Autenticar usuário e obter token JWT |

#### Rotas Protegidas (requer JWT)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/account` | Obter conta, transações e cartões do usuário autenticado |
| `POST` | `/account/transaction` | Criar nova transação |
| `PUT` | `/account/transaction/:id` | Atualizar transação existente |
| `DELETE` | `/account/transaction/:id` | Remover transação |
| `GET` | `/account/:accountId/statement` | Gerar extrato da conta |
| `PUT` | `/user/profile` | Atualizar perfil do usuário autenticado |

## Testes

Executar suite de testes:
```bash
npm test
```

Os testes incluem:
- Testes de integração end-to-end
- Validação de autenticação JWT
- Testes de CRUD para todas as entidades
- Validação de regras de negócio

## Docker

### Build da imagem
```bash
docker build -t bytebank-api -f DockerFile .
```

### Executar container
```bash
docker run -p 3000:3000 bytebank-api
```

## Estrutura do Projeto

```
src/
├── controller/         # Handlers HTTP (User.js, Account.js)
├── feature/            # Casos de uso e regras de negócio
│   ├── User/          # Operações de usuário
│   ├── Account/       # Operações de conta
│   ├── Transaction/   # CRUD de transações
│   └── Card/          # Operações de cartão
├── infra/             # Infraestrutura e persistência
│   └── mongoose/      # Conexão MongoDB e repositories
├── models/            # DTOs e modelos de domínio
├── data/              # Backup automático (desenvolvimento)
├── routes.js          # Rotas autenticadas
├── publicRoutes.js    # Rotas públicas
├── swagger.js         # Configuração OpenAPI
└── index.js           # Entry point da aplicação

tests/                 # Testes de integração
DockerFile            # Configuração Docker
```

## Arquitetura

O projeto segue uma arquitetura em camadas inspirada em Clean Architecture:

```
HTTP Request
    ↓
Controller (camada de apresentação)
    ↓
Feature (casos de uso e regras de negócio)
    ↓
Repository (acesso a dados)
    ↓
MongoDB (persistência)
```

## Regras de Negócio

- **Cadastro completo:** Ao criar usuário, sistema cria automaticamente conta débito e cartão GOLD
- **Transações:** Valores são automaticamente ajustados conforme tipo (débito/crédito)
- **Autenticação:** Tokens JWT válidos por 12 horas
- **Backup automático:** Em desenvolvimento, dados são salvos automaticamente em JSON a cada 60 segundos

## Integração Frontend

Este backend foi desenvolvido para integrar com o frontend Bytebank. 

Collection Postman disponível em: `tech-challenge-2.postman_collection.json`

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Autor

**Thiago Soares** — RM 373636  
FIAP Pós-Tech • Tech Challenge  

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.