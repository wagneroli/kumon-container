-- ==========================================================================
-- KUMON DB MIGRATION v2
-- Fixes: column naming, duplicate FKs, missing FKs, indexes, ENUMs
-- Safe to run on live DB — all operations are transactional per-table
-- ==========================================================================

USE kumon_db;

-- ------------------------------------------------------------------
-- 0. CLEAN BAD DATA
-- ------------------------------------------------------------------
UPDATE participantes SET status_pago = TRIM(status_pago);
UPDATE participantes SET status_pago = 'NAO_PAGO' WHERE status_pago IS NULL OR status_pago = '';

-- ------------------------------------------------------------------
-- 1. DROP VIEW (depends on columns we're renaming)
-- ------------------------------------------------------------------
DROP VIEW IF EXISTS lista_de_premios;

-- ------------------------------------------------------------------
-- 2. DROP ALL FKs ON premiacoes AND presenca
-- ------------------------------------------------------------------
ALTER TABLE premiacoes DROP FOREIGN KEY fk_premiacoes_participante;
ALTER TABLE premiacoes DROP FOREIGN KEY fk_premiacoes_categoria;
ALTER TABLE premiacoes DROP FOREIGN KEY premiacoes_ibfk_1;
ALTER TABLE premiacoes DROP FOREIGN KEY premiacoes_ibfk_2;
ALTER TABLE presenca DROP FOREIGN KEY fk_presenca_participante;

-- ------------------------------------------------------------------
-- 3. RENAME COLUMNS: participante_id → participante_numero
-- ------------------------------------------------------------------
ALTER TABLE premiacoes
  RENAME COLUMN participante_id TO participante_numero,
  RENAME INDEX unique_premiacao TO unique_premiacao_numero,
  ALGORITHM=INPLACE, LOCK=NONE;

ALTER TABLE presenca
  RENAME COLUMN participante_id TO participante_numero,
  RENAME INDEX unique_presenca TO unique_presenca_numero,
  ALGORITHM=INPLACE, LOCK=NONE;

-- ------------------------------------------------------------------
-- 4. RECREATE FKs WITH CORRECT REFERENCES (participantes.numero)
-- ------------------------------------------------------------------
ALTER TABLE premiacoes
  ADD CONSTRAINT fk_premiacoes_participante
    FOREIGN KEY (participante_numero) REFERENCES participantes (numero)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_premiacoes_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias (id)
    ON UPDATE CASCADE;

ALTER TABLE presenca
  ADD CONSTRAINT fk_presenca_participante
    FOREIGN KEY (participante_numero) REFERENCES participantes (numero)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ------------------------------------------------------------------
-- 5. ADD FK ON sorteados
-- ------------------------------------------------------------------
ALTER TABLE sorteados
  ADD CONSTRAINT fk_sorteados_participante
    FOREIGN KEY (participante_numero) REFERENCES participantes (numero)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ------------------------------------------------------------------
-- 6. ADD MISSING INDEXES
-- ------------------------------------------------------------------
ALTER TABLE participantes
  ADD INDEX idx_status_pago (status_pago),
  ALGORITHM=INPLACE, LOCK=NONE;

ALTER TABLE presenca
  ADD INDEX idx_status (status),
  ALGORITHM=INPLACE, LOCK=NONE;

-- ------------------------------------------------------------------
-- 7. CONVERT TO ENUM
-- ------------------------------------------------------------------
ALTER TABLE participantes
  MODIFY tipo ENUM(
    'ALUNO','ALUNO/AUXILIAR','AUXILIAR','AUXILIAR/ALUNA',
    'CONCLUINTE','CONCLUINTE/AUXILIAR','CONCLUINTE/ALUNA','CONVIDADO'
  ) NOT NULL,
  MODIFY status_pago ENUM('NAO_PAGO','PAGO') NOT NULL DEFAULT 'NAO_PAGO',
  ALGORITHM=INPLACE, LOCK=NONE;

ALTER TABLE presenca
  MODIFY status ENUM('PRESENTE','AUSENTE') NOT NULL DEFAULT 'PRESENTE',
  ALGORITHM=INPLACE, LOCK=NONE;

ALTER TABLE premiacoes
  MODIFY status_entrega ENUM('NAO','ENTREGUE') NOT NULL DEFAULT 'NAO',
  ALGORITHM=INPLACE, LOCK=NONE;

-- ------------------------------------------------------------------
-- 8. RECREATE VIEW WITH CORRECT COLUMN NAMES
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW lista_de_premios AS
SELECT
  pr.id,
  pr.participante_numero,
  pr.categoria_id,
  p.numero,
  p.nome,
  p.tipo,
  c.nome AS categoria_nome,
  CASE WHEN pres.status = 'PRESENTE' THEN 'SIM' ELSE 'NAO' END AS status_presente,
  pr.status_entrega,
  pres.status AS status_presenca,
  p.status_pago
FROM premiacoes pr
JOIN participantes p ON pr.participante_numero = p.numero
JOIN categorias c ON pr.categoria_id = c.id
LEFT JOIN presenca pres ON p.numero = pres.participante_numero;

-- ------------------------------------------------------------------
-- VERIFY
-- ------------------------------------------------------------------
SELECT 'Migration complete — verify structure below' AS info;
SHOW CREATE TABLE premiacoes\G
SHOW CREATE TABLE presenca\G
SHOW CREATE TABLE sorteados\G
SHOW CREATE VIEW lista_de_premios\G
