# WAGNER2 - Documentacao Funcional -- Sistema de Controle de Eventos Kumon

## 1. Proposito do Sistema

Sistema WAGNER-web para gerenciamento de eventos presenciais em unidades Kumon. Permite registrar presenca de participantes, controlar entrega de premios por categoria e realizar sorteios ao vivo durante o evento.

---

## 2. Modulos e Funcionalidades

### 2.1 Dashboard (Pagina Inicial)

Exibe um resumo em tempo real do evento:

- **Participantes Registrados:** Total de pessoas cadastradas no sistema
- **Presentes:** Quantos ja tiveram presenca confirmada
- **Premios Entregues:** Total de premios ja distribuidos
- **Sorteios Realizados:** Quantidade de sorteios executados
- **Barra de Progresso:** Percentual visual de presenca (presentes / total)

Atualizacao automatica a cada 2 minutos.

---

### 2.2 Recepcao -- Controle de Presenca

**Objetivo:** Registrar a chegada dos participantes no evento.

**Funcionalidades:**

| Acao               | Descricao                                                     |
| ------------------ | ------------------------------------------------------------- |
| Buscar             | Campo de texto para filtrar por matricula (numero) ou nome    |
| Filtrar por Status | Dropdown: Todos / Presentes / Ausentes                        |
| Marcar Presente    | Botao "Presente" -- registra presenca do participante         |
| Marcar Ausente     | Botao "Ausente" -- reverte presenca para ausencia             |
| Marcar Pago        | Botao "Pago" -- registra que o participante efetuou pagamento |
| Marcar Nao Pago    | Botao "Nao Pago" -- reverte status de pagamento               |

**Regra de negocio:**

- Cada participante aparece com status PRESENTE (verde) ou AUSENTE (vermelho)
- O status de pagamento e independente da presenca (PAGO / NAO_PAGO)
- Participantes com tipo CONVIDADO tambem sao exibidos na lista

---

### 2.3 Premiacao -- Entrega de Premios

**Objetivo:** Controlar a entrega de premios por categoria, garantindo que apenas participantes presentes e elegiveis recebam.

**Funcionalidades:**

| Acao                 | Descricao                                            |
| -------------------- | ---------------------------------------------------- |
| Selecionar Categoria | Dropdown com todas as categorias cadastradas         |
| Visualizar Elegiveis | Tabela com participantes presentes daquela categoria |
| Marcar Entregue      | Botao "Entregar" -- registra a entrega do premio     |
| Reverter Entrega     | Botao "Pendente" -- volta o status para nao entregue |

**Regra de negocio:**

- So aparecem na lista participantes com presenca confirmada (`status_presente = 'SIM'`)
- So aparecem participantes do tipo ALUNO e suas variantes (ALUNO/AUXILIAR, AUXILIAR, CONCLUINTE/ALUNA, CONCLUINTE/AUXILIAR, CONCLUINTE)
- Colunas exibidas: Categoria, Nome (com matricula), Status Presente, Status Entrega
- Status de entrega: ENTREGUE (verde) ou PENDENTE (padrao)

---

### 2.4 Sorteio -- Sorteio ao Vivo

**Objetivo:** Realizar sorteios aleatorios durante o evento entre os participantes presentes.

**Funcionalidades:**

| Acao               | Descricao                                                                     |
| ------------------ | ----------------------------------------------------------------------------- |
| Realizar Sorteio   | Sorteia aleatoriamente um participante entre os presentes ainda nao sorteados |
| Limpar Sorteios    | Remove todo o historico de sorteios (com confirmacao)                         |
| Popup de Resultado | Animacao com o numero do sorteado + efeito visual                             |
| Historico          | Lista ordenada com todos os sorteados                                         |

**Regra de negocio:**

- Apenas participantes com status PRESENTE participam do sorteio
- Um participante ja sorteado nao pode ser sorteado novamente (na mesma sessao)
- O historico de sorteios e persistido no `localStorage` do navegador (versao `script-com-api.js`)
- A cada sorteio, o sistema remove o sorteado da lista de disponiveis
- O sorteio usa `Math.random()` no frontend (versao `script-com-api.js`) ou `ORDER BY RAND()` no banco (versao `script.js` com API)

---

### 2.5 Relatorios

**Objetivo:** Visao consolidada dos dados do evento.

Exibe tres secoes:

1. **Resumo:** Cards com totais (participantes, presentes, premios, sorteios)
2. **Presenca:** Lista detalhada de presenca
3. **Premiacao:** Lista de premios entregues
4. **Sorteios:** Lista de sorteios realizados

---

### 2.6 Gerenciar Participantes

**Objetivo:** Visualizacao completa do cadastro de participantes.

Exibe tabela com:

- Matricula (numero)
- Nome completo
- Tipo (ALUNO, AUXILIAR, CONCLUINTE, CONVIDADO, etc.)
- Status de Pagamento

---

## 3. Tipos de Participantes

| Tipo                | Descricao                                          |
| ------------------- | -------------------------------------------------- |
| ALUNO               | Aluno regular da unidade                           |
| AUXILIAR            | Auxiliar/colaborador da unidade                    |
| CONCLUINTE          | Aluno que concluiu o metodo                        |
| CONVIDADO           | Participante convidado (nao elegivel para premios) |
| ALUNO/AUXILIAR      | Dupla funcao                                       |
| AUXILIAR/ALUNA      | Dupla funcao                                       |
| CONCLUINTE/ALUNA    | Dupla funcao                                       |
| CONCLUINTE/AUXILIAR | Dupla funcao                                       |

**Regra de elegibilidade para premios:** Apenas participantes com tipo contendo ALUNO, AUXILIAR ou CONCLUINTE sao exibidos na lista de premiacao. CONVIDADOS nao aparecem.

---

## 4. Fluxos de Uso

### 4.1 Fluxo de Check-in (Recepcao)

```
1. Participante chega ao evento
2. Operador busca pelo nome ou matricula
3. Operador clica em "Presente"
4. Sistema registra presenca
5. Se necessario, operador marca "Pago"
```

### 4.2 Fluxo de Entrega de Premio

```
1. Operador acessa a aba "Premiacao"
2. Seleciona a categoria desejada
3. Sistema exibe apenas participantes presentes e elegiveis
4. Operador localiza o participante
5. Operador clica em "Entregar"
6. Sistema registra a entrega
```

### 4.3 Fluxo de Sorteio

```
1. Operador acessa a aba "Sorteio"
2. Sistema exibe quantos participantes estao disponiveis
3. Operador clica em "Realizar Sorteio"
4. Sistema sorteia e exibe popup com o numero sorteado
5. Sorteado e removido da lista de disponiveis
6. Historico e atualizado
```

---

## 5. Perfis de Usuario

| Perfil                  | Acessos                                         |
| ----------------------- | ----------------------------------------------- |
| Recepcionista           | Abas: Dashboard, Recepcao (check-in)            |
| Responsavel por Premios | Abas: Dashboard, Premiacao                      |
| Mestre de Cerimonias    | Abas: Dashboard, Sorteio                        |
| Administrador           | Todas as abas, incluindo Gerenciar e Relatorios |

---

## 6. Acessos Administrativos

### phpMyAdmin

- URL: `http://<host>:8082` ou `http://<host>/phpmyadmin` (via nginx)
- Usuario: `root` / Senha: `root_kumon_2025`
- Banco: `kumon_db`

### phpMyAdmin (atalho)

- URL: `http://<host>/pma`

---

## 7. Regras de Negocio Importantes

1. **Presenca por matricula (numero):** O sistema usa o numero de matricula (campo `numero`) como identificador na tabela de presenca, nao o ID interno. Isso mantem compatibilidade caso os IDs mudem entre ambientes.

2. **Um premio por participante por categoria:** A tabela `premiacoes` tem constraint UNIQUE (`participante_id`, `categoria_id`), impedindo duplicacao.

3. **Sorteio sem repeticoes:** Participantes ja sorteados sao excluidos dos sorteios seguintes na mesma sessao.

4. **Elegibilidade para premios:** Alem da presenca confirmada, o tipo do participante deve ser compativel (exclui CONVIDADO).

5. **Independencia Presenca vs Pagamento:** O status de pagamento e controlado separadamente e nao afeta a presenca nem a elegibilidade para sorteio.
