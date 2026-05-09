# Documentacao Tecnica -- Kumon Container

## 1. Visao Geral

Sistema web completo para controle de eventos presenciais (foco em unidades Kumon), composto por backend REST API (Flask), banco de dados relacional (MySQL 8.0), servidor web (nginx como proxy reverso), interface de administracao (phpMyAdmin) e frontend SPA (HTML/CSS/JS vanilla). Toda a stack e containerizada via Docker Compose.

---

## 2. Arquitetura

```
                 Internet
                    |
                 nginx (80/443)
                 proxy reverso
                /     |      \
           Flask    phpMyAdmin   Estaticos
           :5000     :80         (html/css/js)
             |
          MySQL 8.0
           :3306
```

### Containers

| Servico | Container | Imagem | Portas Expostas |
|---------|-----------|--------|-----------------|
| API | `kumon-api` | `python:3.11-alpine` (build custom) | `127.0.0.1:5000` |
| Banco | `kumon-mysql` | `mysql:8.0` | `127.0.0.1:3307` |
| Admin DB | `kumon-phpmyadmin` | `arm64v8/phpmyadmin:5.2` | `127.0.0.1:8082` |
| Proxy | `kumon-nginx` | `nginx:latest` | `8085:80`, `8443:443` |

### Rede

- **kumon-network**: bridge interna conectando todos os servicos
- Volume persistente: `mysql_data` para dados do MySQL

---

## 3. Stack Tecnologica

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Backend | Python + Flask | 3.11-alpine |
| Banco de Dados | MySQL | 8.0 |
| ORM (definicao) | SQLAlchemy (Flask-SQLAlchemy) | - |
| Conector DB | mysql-connector-python | latest |
| CORS | flask-cors | latest |
| Proxy Reverso | nginx | latest |
| Admin DB | phpMyAdmin | 5.2 (ARM64) |
| Containerizacao | Docker + Docker Compose | 3.8 |
| Frontend | HTML5 + CSS3 + JavaScript (Vanilla) | - |

---

## 4. Estrutura de Diretorios

```
kumon-container/
├── api.py                     # Backend Flask REST API (v14)
├── model.py                  # Modelos SQLAlchemy (Categoria, Premiacao)
├── Dockerfile                 # Build da imagem Flask
├── docker-compose.yml         # Orquestracao dos 4 servicos
├── nginx.conf                 # Configuracao do nginx (proxy reverso)
├── index.html                 # Frontend SPA (shell HTML)
├── script.js                  # Logica frontend (DOM + fetch API)
├── script-com-api.js          # Versao estendida com historico em localStorage
├── script-categorias.js       # Script auxiliar para categorias
├── style.css                  # Estilos CSS
├── favicon.ico                # Favicon
├── kumon_sistema.sql          # Schema + dados iniciais (dump MySQL)
├── backup_fk.sql              # Backup com foreign keys
├── participantes_complemento.csv  # Dados complementares CSV
├── ssl/                       # Certificados SSL (nginx)
├── bkp/                       # Backups historicos
└── www/                       # Arquivos staticos extras
```

---

## 5. Modelo de Dados (Banco MySQL)

### 5.1 Tabela `participantes`

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | INT | PK, AUTO_INCREMENT |
| `numero` | INT | NOT NULL |
| `nome` | VARCHAR(255) | NOT NULL |
| `tipo` | VARCHAR(50) | NOT NULL |
| `status_pago` | VARCHAR(50) | DEFAULT 'NAO_PAGO' |
| `data_criacao` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

**Tipos validos:** ALUNO, AUXILIAR, CONCLUINTE, CONVIDADO, combinacoes como ALUNO/AUXILIAR, AUXILIAR/ALUNA, CONCLUINTE/ALUNA, CONCLUINTE/AUXILIAR

### 5.2 Tabela `categorias`

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | INT | PK, AUTO_INCREMENT |
| `nome` | VARCHAR(255) | NOT NULL, UNIQUE |
| `descricao` | TEXT | NULL |
| `tipo_premio` | VARCHAR(100) | NULL |
| `quantidade_vencedores` | INT | NULL |
| `ordem` | INT | DEFAULT 1 |
| `data_criacao` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### 5.3 Tabela `presenca`

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | INT | PK, AUTO_INCREMENT |
| `participante_id` | INT | NOT NULL, UNIQUE, FK → participantes.id |
| `status` | VARCHAR(50) | DEFAULT 'PRESENTE' |
| `hora_chegada` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

- Relacionamento: `presenca.participante_id` → `participantes.id` (ON DELETE CASCADE, ON UPDATE CASCADE)
- **Observacao na API:** A API converte o ID do participante para o NUMERO antes de salvar na tabela `presenca`. O campo `participante_id` da tabela `presenca` armazena o `numero` do participante, nao o `id`.

### 5.4 Tabela `premiacoes`

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | INT | PK, AUTO_INCREMENT |
| `participante_id` | INT | NOT NULL, FK → participantes.id |
| `categoria_id` | INT | NOT NULL, FK → categorias.id |
| `status` | VARCHAR(50) | DEFAULT 'PENDENTE' |
| `status_entrega` | VARCHAR(50) | - |
| `data_entrega` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

- UNIQUE KEY: (`participante_id`, `categoria_id`)

### 5.5 Tabela `sorteados`

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `categoria_id` | INT | NOT NULL |
| `participante_numero` | INT | NOT NULL |
| `participante_nome` | VARCHAR(255) | NOT NULL |
| `data_hora` | DATETIME | - |

### 5.6 View/Tabela `lista_de_premios`

A view/tabela `lista_de_premios` e utilizada na API para listar participantes elegiveis para premios por categoria. Estruturada como tabela com colunas: `id`, `participante_id`, `categoria_id`, `nome`, `numero`, `tipo`, `categoria_nome`, `status_presente`, `status_entrega`.

---

## 6. API REST -- Endpoints

Base URL: `/api`

### 6.1 Health & Stats

| Metodo | Rota | Descricao | Retorno |
|--------|------|-----------|---------|
| GET | `/api/health` | Health check (testa conexao DB) | `{"status": "ok"}` 200 |
| GET | `/api/stats` | Estatisticas gerais | `total_participantes, total_presentes, total_premios, total_sorteios` |

### 6.2 Categorias

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/categorias` | Lista todas categorias ordenadas por nome |

### 6.3 Participantes

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/participantes` | Lista todos participantes |

### 6.4 Presenca

| Metodo | Rota | Descricao | Body |
|--------|------|-----------|------|
| GET | `/api/presenca/lista` | Lista todos com status de presenca (LEFT JOIN) | - |
| POST | `/api/presenca` | Marcar presenca | `{"participante_id": int, "status": "PRESENTE"}` |
| POST | `/api/presenca/ausente` | Marcar ausente | `{"participante_id": int}` |
| POST | `/api/presenca/update-pago` | Atualizar status de pagamento | `{"participante_id": int, "status_pago": "PAGO"/"NAO_PAGO"}` |

### 6.5 Premios

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/premios/categoria/<categoria_id>` | Lista premios de uma categoria (filtra presentes + tipo ALUNO e variantes) |
| PUT | `/api/premios/<premio_id>` | Atualiza status_entrega do premio | `{"status_entrega": "ENTREGUE"/"NAO"}` |

### 6.6 Sorteio

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/sorteio/categoria/<categoria_id>` | Realiza sorteio aleatorio entre presentes nao sorteados |
| GET | `/api/sorteio/historico/<categoria_id>` | Historico de sorteados da categoria |
| GET | `/api/sorteio/total-disponiveis/<categoria_id>` | Contagem de participantes disponiveis para sorteio |
| POST | `/api/sorteio/limpar/<categoria_id>` | Limpa historico de sorteios da categoria |

---

## 7. Infraestrutura e Deploy

### Dockerfile (Flask API)

```dockerfile
FROM python:3.11-alpine
WORKDIR /app
COPY api.py .
RUN pip install flask flask-cors mysql-connector-python
CMD ["python", "api.py"]
```

- Imagem base: Alpine Linux para minimizar tamanho
- Porta: 5000 (interna)
- Nao utiliza WSGI (Flask dev server diretamente)

### nginx.conf -- Roteamento

| Path | Destino | Descricao |
|------|---------|-----------|
| `/phpmyadmin` | phpMyAdmin container | Com rewrite de path |
| `/pma` | phpMyAdmin container | Atalho |
| `/api/*` | Flask container | API REST |
| Arquivos estaticos | nginx `html/` | Cache 30d, immutable |
| `/` | SPA fallback → index.html | Single Page App |

**Timeout configurado:** proxy_connect/send/read = 600s, client_max_body_size = 100M

### docker-compose.yml -- Health Check

Flask container possui healthcheck HTTP:
```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:5000/api/health || exit 1"]
  interval: 30s
  timeout: 15s
  retries: 3
  start_period: 30s
```

### Inicializacao da API

- Conexao MySQL com retry (5 tentativas, intervalo de 2s)
- `autocommit=True` no conector MySQL
- Host do banco: `mysql` (nome do servico no Docker Compose)
- Variaveis de ambiente: `PYTHONUNBUFFERED=1`

---

## 8. Frontend

### Arquivos Principais

| Arquivo | Funcao |
|---------|--------|
| [index.html](index.html) | Shell SPA com 6 paginas (Dashboard, Recepcao, Premiacao, Sorteio, Relatorios, Gerenciar) |
| [script.js](script.js) | Versao base com API de sorteio integrada ao backend |
| [script-com-api.js](script-com-api.js) | Versao estendida com localStorage para persistencia local de historico |
| [style.css](style.css) | CSS completo (32KB) |

### Paginas (SPA)

1. **Dashboard:** Stats cards + barra de progresso de presenca, atualizacao a cada 2 minutos
2. **Recepcao:** Busca/filtro + lista de presenca com botoes de acao (Presente/Ausente, Pago/Nao Pago)
3. **Premiacao:** Select de categoria + tabela de premios com acao Entregar/Pendente
4. **Sorteio:** Botao realizar sorteio + botao limpar + historico, popup animado
5. **Relatorios:** Resumo do evento com tabelas de presenca, premiacao e sorteios
6. **Gerenciar:** Lista tabular de todos participantes

### Fluxo SPA

- Navegacao por botoes na sidebar com dataset `data-page`
- Cada pagina carrega dados sob demanda via fetch(`/api/...`)
- `script-com-api.js` persiste historico de sorteios em `localStorage`

---

## 9. Observacoes Tecnicas

### Particularidades

1. **ID vs NUMERO na presenca:** A API recebe `participante_id` (ID da tabela `participantes`), mas internamente busca o `numero` do participante e salva esse `numero` na tabela `presenca`. Isso e uma decisao de design para manter compatibilidade com a numeracao visivel (matricula).

2. **Filtro de tipo na lista de premios:** O endpoint `/api/premios/categoria/<id>` filtra apenas registros com `status_presente = 'SIM'` e `tipo IN ('ALUNO', 'ALUNO/AUXILIAR', 'AUXILIAR', ...)`, garantindo que apenas participantes elegiveis aparecam na lista de premiacao.

3. **Sorteio com `ORDER BY RAND()`:** O sorteio usa `ORDER BY RAND() LIMIT 1` diretamente no SQL, sem logica de aplicacao adicional. Nao utiliza seed fixa.

4. **Autenticacao/CORS:** CORS habilitado globalmente (`CORS(app)`). Nao ha autenticacao implementada -- o sistema e projetado para uso em rede local/confiavel.

5. **Versao ARM64 do phpMyAdmin:** Imagem `arm64v8/phpmyadmin:5.2` -- indica deploy em maquinas Apple Silicon (M1/M2/M3).
