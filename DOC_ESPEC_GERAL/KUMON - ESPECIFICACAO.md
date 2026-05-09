# KUMON - ESPECIFICACAO  
  
#KUMON  
  
```
# Especificação Funcional e Técnica
## Sistema de Controle de Presença e Premiação para Eventos

---

## 1. Sumário Executivo

Este documento apresenta a especificação funcional e técnica para o desenvolvimento de um **Sistema de Controle de Presença e Premiação em Eventos** (SCPPE). O sistema será utilizado em eventos educacionais para gerenciar entrada de alunos, convidados, controle de presença e processo de premiação com sorteios.

**Tecnologia Recomendada:** Python com PyQt6 ou PySimpleGUI para interface gráfica, combinado com banco de dados SQLite ou MySQL.

---

## 2. Visão Geral do Projeto

### 2.1 Objetivo Principal
Desenvolver uma aplicação desktop com interface amigável que permita:
- Registrar entrada de alunos e convidados
- Controlar presença em evento
- Gerenciar premiações por performance
- Executar sorteios entre presentes

### 2.2 Escopo
- ✅ Módulo de Recepção (Check-in)
- ✅ Módulo de Premiação por Performance
- ✅ Módulo de Sorteio Aleatório
- ✅ Relatórios de Presença
- ✅ Gerenciamento de Dados (CRUD)

### 2.3 Usuários do Sistema
- **Recepcionistas**: Registram chegada de alunos e convidados
- **Gerenciador de Eventos**: Configura categorias de premiação
- **Apresentador**: Anuncia vencedores e aciona sorteios
- **Administrador**: Gerencia base de dados e configurações

---

## 3. Requisitos Funcionais

### 3.1 RF-01: Cadastro de Participantes

**Descrição:** Sistema deve permitir cadastro e importação de alunos e convidados

**Dados Obrigatórios:**
- Número de Matrícula/Convite (sequencial único)
- Nome completo
- Tipo (Aluno/Convidado)

**Funcionalidades:**
- Importar de arquivo Excel/CSV
- Validar unicidade de matrícula
- Buscar participante por número
- Buscar participante por nome (busca parcial)

---

### 3.2 RF-02: Registro de Presença (Recepção)

**Descrição:** Registrar chegada de aluno ou convidado no evento

**Fluxo:**
1. Recepcionista identifica participante (por número ou nome)
2. Sistema valida se participante existe
3. Registra horário de chegada
4. Marca participante como PRESENTE
5. Imprime confirmação (opcional)

**Restrições:**
- Não permitir múltiplos registros da mesma pessoa
- Avisar se tentativa de duplicação

---

### 3.3 RF-03: Gerenciamento de Categorias de Premiação

**Descrição:** Cadastrar categorias de prêmios que serão distribuídos

**Dados:**
- ID Categoria
- Nome da Categoria
- Descrição
- Quantidade de Vencedores
- Tipo de Prêmio (Certificado/Troféu/Outro)

**Funcionalidades:**
- Criar nova categoria
- Editar categoria
- Listar categorias
- Excluir categoria (se sem vencedores)

---

### 3.4 RF-04: Registro de Premiação por Performance

**Descrição:** Registrar entrega de prêmios/certificados por desempenho

**Fluxo:**
1. Apresentador seleciona categoria
2. Sistema lista vencedores da categoria
3. Sistema valida se aluno está PRESENTE
4. Registra recebimento do prêmio
5. Marca como "Prêmio Entregue"

**Validações:**
- ⚠️ Aluno DEVE estar marcado como presente
- ⚠️ Não permitir registrar prêmio já entregue
- ⚠️ Exibir status de entrega em tempo real

---

### 3.5 RF-05: Sorteio Aleatório

**Descrição:** Sortear prêmios entre participantes presentes

**Fluxo:**
1. Sistema filtra APENAS participantes presentes
2. Gera número aleatório de convite/matrícula
3. Identifica vencedor
4. Exibe resultado em tela grande
5. Oferece opção para registrar entrega

**Funcionalidade de Sorteio:**
- Opção de sortear COM reposição (mesmo pessoa pode ganhar 2x)
- Opção de sortear SEM reposição (exclui já sorteados)
- Exibir últimos 5 sorteados
- Histórico de sorteios

**Algoritmo Python Proposto:**
import random

class SorteioPremios:
    def __init__(self, lista_presentes):
        self.lista_presentes = lista_presentes
        self.sorteados = []
    
    def sortear_com_reposicao(self, quantidade=1):
        """Sorteia permitindo repetição"""
        return random.choices(self.lista_presentes, k=quantidade)
    
    def sortear_sem_reposicao(self, quantidade=1):
        """Sorteia sem permitir repetição"""
        if quantidade > len(self.lista_presentes):
            return None
        return random.sample(self.lista_presentes, k=quantidade)
    
    def registrar_sorteio(self, vencedores, categoria_id):
        """Registra sorteio no banco de dados"""
        self.sorteados.append({
            'vencedores': vencedores,
            'categoria_id': categoria_id,
            'timestamp': datetime.now()
        })

---

### 3.6 RF-06: Relatórios e Consultas

**Descrição:** Gerar relatórios diversos

**Relatórios:**
1. **Presença**: Lista de presentes/ausentes por hora
2. **Premiação**: Quem recebeu qual prêmio
3. **Sorteios**: Histórico de sorteios realizados
4. **Resumo**: Estatísticas do evento

**Formatos:** PDF, Excel

---

## 4. Requisitos Não-Funcionais

### 4.1 RNF-01: Performance
- Interface responsiva (< 200ms para ações)
- Suportar até 500 participantes
- Sorteio em tempo real (< 1 segundo)

### 4.2 RNF-02: Usabilidade
- Interface intuitiva em português
- Atalhos de teclado para ações comuns
- Modo escuro opcional
- Fonte grande para leitura em projetor

### 4.3 RNF-03: Confiabilidade
- Backup automático de dados
- Recuperação de falhas
- Validação de integridade de dados

### 4.4 RNF-04: Segurança
- Autenticação de usuários
- Diferentes níveis de permissão
- Log de todas operações

---

## 5. Modelo de Dados

### 5.1 Diagrama Entidade-Relacionamento

┌─────────────────────┐
│      ALUNO          │
├─────────────────────┤
│ PK matricula        │
│ nome_aluno          │
│ email (opcional)    │
│ data_criacao        │
└─────────────────────┘
         │
         │ 1:N
         │
┌─────────────────────────┐
│      PRESENCA           │
├─────────────────────────┤
│ PK id_presenca          │
│ FK matricula (aluno)    │
│ FK id_convite (convidado)
│ tipo (aluno/convidado)  │
│ hora_chegada            │
│ status (presente/ausente)
└─────────────────────────┘
         │
         │ 1:N
         │
┌──────────────────────────────┐
│     PREMIACAO_PERFORMANCE    │
├──────────────────────────────┤
│ PK id_premiacao              │
│ FK matricula (aluno)         │
│ FK id_categoria              │
│ data_entrega                 │
│ status (pendente/entregue)   │
└──────────────────────────────┘

┌─────────────────────┐
│     CONVIDADO       │
├─────────────────────┤
│ PK id_convite       │
│ nome_convidado      │
│ relacao_aluno (pai) │
│ data_criacao        │
└─────────────────────┘

┌─────────────────────────┐
│      CATEGORIA          │
├─────────────────────────┤
│ PK id_categoria         │
│ nome_categoria          │
│ descricao               │
│ quantidade_vencedores   │
│ tipo_premio             │
└─────────────────────────┘

┌──────────────────────────────┐
│  HISTORICO_SORTEIO           │
├──────────────────────────────┤
│ PK id_sorteio                │
│ FK id_categoria              │
│ numero_sorteado              │
│ tipo_participante            │
│ data_sorteio                 │
│ status_entrega               │
│ com_reposicao (S/N)          │
└──────────────────────────────┘

### 5.2 Schema SQL

CREATE TABLE ALUNO (
    matricula INT PRIMARY KEY,
    nome_aluno VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE CONVIDADO (
    id_convite INT PRIMARY KEY,
    nome_convidado VARCHAR(100) NOT NULL,
    relacao_aluno INT,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (relacao_aluno) REFERENCES ALUNO(matricula)
);

CREATE TABLE PRESENCA (
    id_presenca INT AUTO_INCREMENT PRIMARY KEY,
    matricula_aluno INT,
    id_convite_convidado INT,
    tipo VARCHAR(20),
    hora_chegada DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'PRESENTE',
    FOREIGN KEY (matricula_aluno) REFERENCES ALUNO(matricula),
    FOREIGN KEY (id_convite_convidado) REFERENCES CONVIDADO(id_convite),
    UNIQUE KEY unique_presenca (matricula_aluno, id_convite_convidado, hora_chegada)
);

CREATE TABLE CATEGORIA (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nome_categoria VARCHAR(100) NOT NULL,
    descricao TEXT,
    quantidade_vencedores INT,
    tipo_premio VARCHAR(50),
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE PREMIACAO_PERFORMANCE (
    id_premiacao INT AUTO_INCREMENT PRIMARY KEY,
    matricula_aluno INT NOT NULL,
    id_categoria INT NOT NULL,
    data_entrega DATETIME,
    status VARCHAR(20) DEFAULT 'PENDENTE',
    FOREIGN KEY (matricula_aluno) REFERENCES ALUNO(matricula),
    FOREIGN KEY (id_categoria) REFERENCES CATEGORIA(id_categoria),
    UNIQUE KEY unique_premiacao (matricula_aluno, id_categoria)
);

CREATE TABLE HISTORICO_SORTEIO (
    id_sorteio INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT,
    numero_sorteado INT NOT NULL,
    tipo_participante VARCHAR(20),
    data_sorteio DATETIME DEFAULT CURRENT_TIMESTAMP,
    status_entrega VARCHAR(20) DEFAULT 'PENDENTE',
    com_reposicao BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_categoria) REFERENCES CATEGORIA(id_categoria)
);

CREATE TABLE USUARIO (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome_usuario VARCHAR(100) NOT NULL,
    email_usuario VARCHAR(100) UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

---

## 6. Fluxos de Processo

### 6.1 Fluxo de Recepção

┌─────────────────┐
│ Participante    │
│ chega ao evento │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│ Recepcionista busca na   │
│ base (número ou nome)    │
└────────┬─────────────────┘
         │
         ▼
    ┌────────────┐
    │ Encontrado?│
    └────┬───┬───┘
    NÃO  │   │ SIM
         │   │
         ▼   ▼
    ❌  ✅ Valida presença
    Rejeita   anterior
         │   │
         │   ├─ Duplicada?
         │   │  ├─ SIM: Avisa
         │   │  └─ NÃO: Continua
         │   │
         │   ▼
         │  Registra horário
         │  de chegada
         │   │
         │   ▼
         │  Status = PRESENTE
         │   │
         │   ▼
         └──▶ Imprime ticket
             (opcional)
             │
             ▼
         ┌─────────────────┐
         │ Fim - Entra no  │
         │ evento          │
         └─────────────────┘

### 6.2 Fluxo de Premiação por Performance

┌──────────────────────┐
│ Apresentador anuncia │
│ vencedor por       │
│ performance        │
└─────────┬───────────┘
          │
          ▼
    ┌──────────────────┐
    │ Seleciona       │
    │ categoria de    │
    │ premiação       │
    └─────────┬────────┘
              │
              ▼
    ┌──────────────────────┐
    │ Sistema lista      │
    │ vencedores dessa   │
    │ categoria          │
    └─────────┬───────────┘
              │
              ▼
    ┌──────────────────────┐
    │ Verifica se aluno  │
    │ está PRESENTE      │
    └────┬───────┬────────┘
    NÃO  │       │ SIM
         │       │
         ▼       ▼
      ❌         Registra entrega
      Nega    do certificado
         │       │
         │       ▼
         │    Status = ENTREGUE
         │       │
         │       ▼
         └──▶ Atualiza banco
             de dados
             │
             ▼
         ┌─────────────┐
         │ Fim         │
         └─────────────┘

### 6.3 Fluxo de Sorteio

┌─────────────────────┐
│ Apresentador clica  │
│ "Realizar Sorteio"  │
└────────┬────────────┘
         │
         ▼
┌──────────────────────────┐
│ Sistema filtra APENAS   │
│ participantes PRESENTES │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Gera número aleatório   │
│ (COM ou SEM reposição)  │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Identifica vencedor     │
│ (Aluno ou Convidado)    │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Exibe em tela grande    │
│ (animação opcional)     │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Registra no histórico   │
│ de sorteios             │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Oferece registrar       │
│ entrega de prêmio       │
└──────────┬──────────────┘
           │
           ▼
       ┌───────────┐
       │   Fim     │
       └───────────┘

---

## 7. Arquitetura Técnica

### 7.1 Stack Recomendado

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| **Frontend** | PyQt6 ou PySimpleGUI | Interface amigável, cross-platform |
| **Backend** | Python 3.10+ | Lógica de sorteio, validações |
| **Banco de Dados** | SQLite (local) ou MySQL (rede) | Portabilidade e simplicidade |
| **ORM** | SQLAlchemy | Consultas tipo seguro |
| **Relatórios** | ReportLab + openpyxl | PDF e Excel |

### 7.2 Estrutura de Diretórios

sistema_evento/
│
├── main.py                 # Ponto de entrada
├── requirements.txt        # Dependências
├── config.py              # Configurações
│
├── src/
│   ├── __init__.py
│   ├── database/
│   │   ├── models.py      # ORM Models
│   │   └── connection.py  # Conexão DB
│   │
│   ├── services/
│   │   ├── presenca.py    # Lógica presença
│   │   ├── premiacao.py   # Lógica prêmios
│   │   ├── sorteio.py     # Lógica sorteio
│   │   └── relatorio.py   # Geração relatórios
│   │
│   ├── ui/
│   │   ├── main_window.py
│   │   ├── recepcao.py
│   │   ├── premiacao.py
│   │   ├── sorteio.py
│   │   └── dialogs.py
│   │
│   └── utils/
│       ├── validators.py
│       ├── exporters.py
│       └── helpers.py
│
├── data/
│   ├── database.db        # SQLite
│   └── imports/           # CSV/Excel importados
│
└── tests/
    ├── test_sorteio.py
    ├── test_presenca.py
    └── test_premiacao.py

### 7.3 Dependências Python

PyQt6==6.6.0
SQLAlchemy==2.0.20
mysql-connector-python==8.1.0
openpyxl==3.11.0
pandas==2.0.3
reportlab==4.0.7
python-dotenv==1.0.0

---

## 8. Fluxo de Dados

┌──────────────────┐
│   Arquivo Excel  │
│   (Alunos/Conv)  │
└────────┬─────────┘
         │ Importar
         ▼
┌──────────────────┐
│   Validar Dados  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│  Banco de Dados      │
│  (ALUNO, CONVIDADO)  │
└────────┬─────────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌─────────────────┐          ┌──────────────────────┐
│ Recepção (UI)   │          │ Premiação (UI)       │
└────────┬────────┘          └──────────┬───────────┘
         │ Check-in                     │ Registra entrega
         ▼                              ▼
┌─────────────────┐          ┌──────────────────────┐
│ PRESENCA        │          │ PREMIACAO_PERFORMANCE│
│ (Registra)      │          │ (Registra)           │
└────────┬────────┘          └──────────┬───────────┘
         │                              │
         └──────────────┬───────────────┘
                        │
                        ▼
        ┌─────────────────────────────┐
        │ Sorteio (UI)                │
        │ Filtra PRESENTES            │
        │ Gera Aleatório              │
        └────────┬────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ HISTORICO_SORTEIO           │
        │ (Registra resultado)        │
        └────────┬────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ Relatórios (PDF/Excel)      │
        │ Gera outputs                │
        └─────────────────────────────┘

---

## 9. Interfaces de Usuário (Wireframes)

### 9.1 Tela Principal - Menu

╔════════════════════════════════════════════════════════════╗
║   SISTEMA DE CONTROLE DE EVENTOS - Menu Principal         ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  [RECEPÇÃO]           [PREMIAÇÃO]          [SORTEIO]      ║
║   Check-in de         Gerenciar             Sortear       ║
║   Participantes       Prêmios               Prêmios       ║
║                                                            ║
║  ─────────────────────────────────────────────────────    ║
║                                                            ║
║  [RELATÓRIOS]        [GERENCIAR]           [SAIR]        ║
║   Ver Presença       Dados Base             Encerrar     ║
║   Sorteios           Categorias                           ║
║                                                            ║
║  Status: 234/500 Presentes                               ║
║  Hora: 14:30:15                                          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

### 9.2 Tela de Recepção

╔════════════════════════════════════════════════════════════╗
║   RECEPÇÃO - Check-in de Participantes                    ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Buscar por:  ◯ Número  ◯ Nome                            ║
║                                                            ║
║  ┌────────────────────────────────────┐                   ║
║  │ [Digite número ou nome...       ]  │ [Buscar]          ║
║  └────────────────────────────────────┘                   ║
║                                                            ║
║  ┌────────────────────────────────────────────────────┐  ║
║  │ Resultado:                                         │  ║
║  │ ────────────────────────────────────────────────   │  ║
║  │ Matrícula: 001                                    │  ║
║  │ Nome: João Silva                                  │  ║
║  │ Tipo: Aluno                                       │  ║
║  │ Status: [Não Marcado]                            │  ║
║  │                                                   │  ║
║  │ [REGISTRAR PRESENÇA]    [CANCELAR]               │  ║
║  └────────────────────────────────────────────────────┘  ║
║                                                            ║
║  Histórico: João Silva (14:25)                            ║
║            Maria Oliveira (14:23)                          ║
║            Pedro Costa (14:20)                             ║
║                                                            ║
║  Total Presentes: 234  │  Total Esperados: 500           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

### 9.3 Tela de Sorteio

╔════════════════════════════════════════════════════════════╗
║   SORTEIO - Prêmios Aleatórios                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Categoria: [Dropdown Categorias▼]                        ║
║                                                            ║
║  Opções de Sorteio:                                       ║
║  ◯ Com Reposição    ◯ Sem Reposição                       ║
║                                                            ║
║  ┌────────────────────────────────────┐                   ║
║  │                                    │                   ║
║  │         [REALIZAR SORTEIO]        │                   ║
║  │                                    │                   ║
║  └────────────────────────────────────┘                   ║
║                                                            ║
║  ╔════════════════════════════════════╗                   ║
║  ║                                    ║                   ║
║  ║    NÚMERO SORTEADO: 042            ║                   ║
║  ║                                    ║                   ║
║  ║    VENCEDOR: Ana Costa             ║                   ║
║  ║    (Aluna)                         ║                   ║
║  ║                                    ║                   ║
║  ║    [REGISTRAR ENTREGA] [NOVO]      ║                   ║
║  ║                                    ║                   ║
║  ╚════════════════════════════════════╝                   ║
║                                                            ║
║  Últimos Sorteados:                                       ║
║  • Nº 042 - Ana Costa                                     ║
║  • Nº 108 - Bruno Lima                                    ║
║  • Nº 235 - Carla Mendes                                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

---

## 10. Sugestões de Melhorias e Funcionalidades Adicionais

### 10.1 Curto Prazo (MVP)
- [x] Requisitos essenciais listados
- [ ] Sistema de login com permissões
- [ ] Backup automático diário
- [ ] Exportação de relatórios em PDF

### 10.2 Médio Prazo (Versão 1.5)
- [ ] **QR Code**: Escanear código do participante (reduz tempo)
- [ ] **Modo Offline**: Funcionar sem internet
- [ ] **Impressoras Térmicas**: Tickets com QR code
- [ ] **Dashboard em Tempo Real**: Display com estatísticas

### 10.3 Longo Prazo (Versão 2.0)
- [ ] **App Mobile**: Registro de presença via smartphone
- [ ] **Reconhecimento Facial**: Check-in automático
- [ ] **Integração com Câmeras**: Foto do vencedor
- [ ] **Sistema de Pontos**: Pontuação acumulada
- [ ] **API REST**: Para integração com outros sistemas
- [ ] **Analytics Avançado**: Gráficos de presença, tendências

### 10.4 Sugestões Operacionais
1. **Teste de Sorteio**: Validar aleatoriedade antes do evento
2. **Backup em Nuvem**: Redundância de dados
3. **Modo de Demonstração**: Para testes sem dados reais
4. **Auditoria**: Log completo de todas operações
5. **Recuperação de Dados**: Desfazer últimas ações

---

## 11. Exemplos de Código

### 11.1 Classe Sorteio (Python)

import random
from datetime import datetime
from typing import List, Dict, Tuple

class SorteioPremios:
    """
    Gerencia sorteios de prêmios entre participantes presentes
    """
    
    def __init__(self):
        self.historico = []
        self.sorteados_atuais = []
    
    def obter_presentes(self, lista_presenca: List[Dict]) -> List[int]:
        """
        Filtra apenas participantes com status PRESENTE
        
        Args:
            lista_presenca: Lista com dicts contendo 'id' e 'status'
            
        Returns:
            Lista com IDs dos presentes
        """
        return [p['id'] for p in lista_presenca if p['status'] == 'PRESENTE']
    
    def sortear_com_reposicao(self, lista_presentes: List[int], 
                             quantidade: int = 1) -> List[int]:
        """
        Sorteia permitindo que mesma pessoa possa ganhar múltiplas vezes
        
        Args:
            lista_presentes: IDs dos participantes presentes
            quantidade: Quantidade de sorteios
            
        Returns:
            Lista de IDs sorteados
        """
        if not lista_presentes:
            return []
        
        sorteados = random.choices(lista_presentes, k=quantidade)
        return sorteados
    
    def sortear_sem_reposicao(self, lista_presentes: List[int], 
                             quantidade: int = 1) -> List[int]:
        """
        Sorteia sem permitir repetição (exclui já sorteados)
        
        Args:
            lista_presentes: IDs dos participantes presentes
            quantidade: Quantidade de sorteios
            
        Returns:
            Lista de IDs sorteados ou None se insuficiente
        """
        if quantidade > len(lista_presentes):
            return None
        
        sorteados = random.sample(lista_presentes, k=quantidade)
        self.sorteados_atuais.extend(sorteados)
        return sorteados
    
    def registrar_sorteio(self, vencedor_id: int, categoria_id: int,
                         com_reposicao: bool) -> Dict:
        """
        Registra sorteio no histórico
        """
        registro = {
            'vencedor_id': vencedor_id,
            'categoria_id': categoria_id,
            'data_hora': datetime.now(),
            'com_reposicao': com_reposicao,
            'status': 'PENDENTE'
        }
        self.historico.append(registro)
        return registro
    
    def resetar_sorteio(self):
        """Limpa sorteados para novo sorteio sem reposição"""
        self.sorteados_atuais = []

### 11.2 Validador de Presença

class ValidadorPresenca:
    """Valida lógica de presença"""
    
    @staticmethod
    def validar_participante_presente(db, matricula_aluno: int) -> Tuple[bool, str]:
        """
        Valida se aluno está marcado como presente
        
        Returns:
            (bool presente, str mensagem)
        """
        presenca = db.query(Presenca).filter(
            Presenca.matricula_aluno == matricula_aluno,
            Presenca.status == 'PRESENTE'
        ).first()
        
        if not presenca:
            return False, "Aluno não está presente no evento"
        
        return True, "Aluno presente e validado"
    
    @staticmethod
    def verificar_duplicacao(db, matricula_aluno: int, evento_id: int) -> bool:
        """
        Verifica se aluno já foi marcado presente
        """
        presenca = db.query(Presenca).filter(
            Presenca.matricula_aluno == matricula_aluno,
            Presenca.id_evento == evento_id
        ).first()
        
        return presenca is not None

---

## 12. Plano de Testes

| Teste | Entrada | Resultado Esperado | Prioridade |
|-------|---------|-------------------|------------|
| Sorteio com 0 presentes | Lista vazia | Mensagem erro | ALTA |
| Sorteio duplicado | 2x aluno na lista | Resultado único | ALTA |
| Registo presença dupla | Check-in 2x | Rejeita 2º | ALTA |
| Prêmio sem presente | Aluno ausente | Bloqueia entrega | ALTA |
| Performance 500 pessoas | Base grande | Resposta < 200ms | MÉDIA |
| Integridade dados | Falha mid-sorteio | Recupera estado | MÉDIA |

---

## 13. Cronograma de Desenvolvimento

| Fase | Atividade | Duração | Entrega |
|------|-----------|---------|---------|
| 1 | Configuração projeto + DB | 2 dias | Schema SQL |
| 2 | Camada de dados (ORM) | 3 dias | Models e testes |
| 3 | Lógica de negócio | 4 dias | Sorteio, Validações |
| 4 | Interface Recepção | 3 dias | UI funcional |
| 5 | Interface Premiação | 3 dias | UI funcional |
| 6 | Interface Sorteio | 3 dias | UI + animação |
| 7 | Relatórios | 2 dias | PDF/Excel |
| 8 | Testes integrados | 3 dias | Testes aprovados |
| 9 | Deploy + documentação | 2 dias | Sistema pronto |
| **Total** | | **25 dias** | |

---

## 14. Documentação para Agentes de IA

Este documento foi preparado especificamente para que agentes IA (como os do Perplexity) possam:

1. **Gerar código completo** com base na especificação de arquitetura
2. **Criar interfaces** seguindo os wireframes
3. **Implementar lógica** conforme os requisitos funcionais
4. **Estruturar banco de dados** usando o schema SQL fornecido
5. **Escrever testes** baseados no plano de testes

### Passos Recomendados para IA:

1. Criar estrutura de diretórios (conforme seção 7.2)
2. Implementar models SQLAlchemy (usando schema seção 5.2)
3. Codificar serviços de lógica (sorteio, presença, premiação)
4. Construir interfaces PyQt6 (conforme wireframes seção 9)
5. Gerar testes unitários
6. Integrar tudo e fazer testes E2E

---

## 15. Conclusão

Este documento fornece uma **especificação completa** e **tecnicamente detalhada** para o desenvolvimento do Sistema de Controle de Presença e Premiação para Eventos.

A arquitetura proposta é **escalável**, **mantível** e **adequada** para processamento de eventos educacionais com até 500 participantes.

Recomenda-se iniciar pelo **MVP** (funcionalidades essenciais) e evoluir para as funcionalidades adicionais conforme feedback dos usuários.

---

## Anexos

### A. Glossário de Termos

- **Aluno**: Participante principal do evento (tem matrícula)
- **Convidado**: Acompanhante (normalmente pais, com número de convite)
- **Check-in**: Processo de registrar presença
- **Sorteio**: Seleção aleatória de vencedor entre presentes
- **Reposição**: Permite mesma pessoa ser sorteada múltiplas vezes
- **Status**: Situação atual (Presente, Ausente, Prêmio Entregue, etc)
- **CRUD**: Create, Read, Update, Delete (operações básicas)

### B. Referências Técnicas

1. PyQt6 Official Docs: https://www.riverbankcomputing.com/pyqt/pyqt6/
2. SQLAlchemy: https://docs.sqlalchemy.org/
3. Python Random: https://docs.python.org/3/library/random.html
4. Database Design: https://en.wikipedia.org/wiki/Database_design

---

**Versão:** 1.0
**Data:** 2025-01-11
**Autor:** Especificação Técnica - Sistema de Eventos
**Status:** ✅ Pronto para Desenvolvimento



sudo docker run -d -p 8085:8085 --name kumon-container kumon-app:latest

sudo docker run -d \
  --name kumon-container \
  --restart always \
  -p 8085:80 \
  -p 443:443 \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  kumon-app:latest

sudo certbot certonly --standalone -d kumon.tuaregbr.com.br -d www.tuaregbr.com.br

sudo nano /etc/nginx/sites-available/kumon-app




server {
    if ($host = kumon.tuaregbr.com.br) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


   # listen 80;
    server_name kumon.tuaregbr.com.br;
    return 301 https://$host$request_uri;


}

server {
    listen 443 ssl http2;
    server_name kumon.tuaregbr.com.br;
    ssl_certificate /etc/letsencrypt/live/kumon.tuaregbr.com.br/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/kumon.tuaregbr.com.br/privkey.pem; # managed by Certbot
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /home/rdpuser/kumon-app/index.html;
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
    }

}

curl https://kumon.tuaregbr.com.br

```
  
