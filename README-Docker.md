# 🐳 DSport CMS - Configuração Docker

Este guia explica como executar a aplicação DSport CMS usando Docker.

## 📋 Pré-requisitos

- Docker instalado
- Docker Compose instalado
- Arquivo `.env` configurado (será criado automaticamente se não existir)

## 🚀 Início Rápido

### Usando o script automatizado (Recomendado)

```bash
# Tornar o script executável (apenas na primeira vez)
chmod +x docker-run.sh

# Executar em produção
./docker-run.sh prod

# Executar em desenvolvimento
./docker-run.sh dev
```

### Usando Docker Compose diretamente

```bash
# Produção
docker-compose up -d app

# Desenvolvimento
docker-compose --profile dev up -d app-dev
```

## 🛠️ Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `./docker-run.sh prod` | Executa em modo produção (porta 3998) |
| `./docker-run.sh dev` | Executa em modo desenvolvimento com hot reload (porta 3001) |
| `./docker-run.sh build` | Faz build das imagens Docker |
| `./docker-run.sh stop` | Para todos os containers |
| `./docker-run.sh clean` | Remove containers e imagens |
| `./docker-run.sh logs` | Mostra logs da aplicação |
| `./docker-run.sh help` | Mostra ajuda |

## 🔧 Configuração

### Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure as seguintes variáveis:

```env
# API Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:8080

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Portas

- **Produção**: http://localhost:3998
- **Desenvolvimento**: http://localhost:3001

## 📁 Estrutura de Arquivos Docker

```
├── Dockerfile              # Imagem de produção otimizada
├── Dockerfile.dev          # Imagem de desenvolvimento
├── docker-compose.yml      # Orquestração dos containers
├── .dockerignore           # Arquivos ignorados no build
├── docker-run.sh           # Script de automação
└── .env.example            # Exemplo de variáveis de ambiente
```

## 🏗️ Detalhes Técnicos

### Dockerfile de Produção
- Multi-stage build para otimização
- Imagem final baseada em Node.js Alpine
- Output standalone do Next.js
- Usuário não-root para segurança
- Imagem final ~100MB

### Dockerfile de Desenvolvimento
- Hot reload ativado
- Volume mounting para desenvolvimento
- Todas as dependências incluídas
- Turbopack habilitado

## 🔍 Troubleshooting

### Container não inicia
```bash
# Verificar logs
./docker-run.sh logs

# Reconstruir imagens
./docker-run.sh clean
./docker-run.sh build
```

### Problemas de permissão
```bash
# Dar permissão ao script
chmod +x docker-run.sh
```

### Porta já em uso
```bash
# Verificar processos na porta
lsof -i :3998
lsof -i :3001

# Parar containers
./docker-run.sh stop
```

## 📊 Monitoramento

### Ver logs em tempo real
```bash
./docker-run.sh logs
```

### Status dos containers
```bash
docker-compose ps
```

### Uso de recursos
```bash
docker stats
```

## 🚀 Deploy em Produção

Para deploy em produção, certifique-se de:

1. Configurar as variáveis de ambiente corretas
2. Usar HTTPS para APIs externas
3. Configurar reverse proxy (nginx/traefik)
4. Implementar health checks
5. Configurar logs centralizados

## 🤝 Contribuição

Para contribuir com melhorias na configuração Docker:

1. Teste suas mudanças localmente
2. Documente alterações neste README
3. Mantenha compatibilidade com ambos os modos (dev/prod)