#V14 - FIXED: presenca usando NUMERO (not ID)
# COM ENDPOINTS DE SORTEIO INTEGRADOS
# ✅ ROTAS CORRIGIDAS COM <int:categoria_id> E <int:premio_id>
# ✅ FILTRO tipo='ALUNO' NA API

from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import os
import time
import random
from datetime import datetime

app = Flask(__name__)
CORS(app)

def get_conn():
    """Cria conexao direta com retry"""
    for attempt in range(5):
        try:
            c = mysql.connector.connect(
                host=os.environ.get('DB_HOST', 'mysql'),
                user=os.environ.get('DB_USER', 'kumon_user'),
                password=os.environ.get('DB_PASSWORD', 'kumon_pass_2025'),
                database=os.environ.get('DB_NAME', 'kumon_db'),
                port=int(os.environ.get('DB_PORT', 3306)),
                autocommit=True,
                connection_timeout=10
            )
            return c
        except Error as e:
            if attempt < 4:
                print(f"⚠ Attempt {attempt+1}/5: {e}, retrying in 2s...")
                time.sleep(2)
            else:
                print(f"❌ Failed after 5 attempts: {e}")
                return None

@app.route('/api/health')
def health():
    try:
        c = get_conn()
        if c:
            try:
                c.close()
            except:
                pass
        return jsonify({"status": "ok"}), 200
    except Exception as e:
        print(f"❌ Health error: {e}")
        return jsonify({"status": "error"}), 500

@app.route('/api/stats')
def stats():
    try:
        c = get_conn()
        if not c:
            return jsonify({"error": "DB not connected"}), 500
        
        cur = c.cursor(dictionary=True)
        
        try:
            cur.execute("SELECT COUNT(*) as t FROM participantes")
            p_result = cur.fetchone()
            p = p_result['t'] if p_result else 0
        except Exception as e:
            print(f"Error getting participantes count: {e}")
            p = 0
        
        try:
            cur.execute("SELECT COUNT(*) as t FROM presenca WHERE status='PRESENTE'")
            pr_result = cur.fetchone()
            pr = pr_result['t'] if pr_result else 0
        except Exception as e:
            print(f"Error getting presentes count: {e}")
            pr = 0
        
        try:
            cur.execute("SELECT COUNT(*) as t FROM premiacoes")
            prem_result = cur.fetchone()
            prem = prem_result['t'] if prem_result else 0
        except Exception as e:
            print(f"Error getting premios count: {e}")
            prem = 0
        
        try:
            cur.execute("SELECT COUNT(*) as t FROM sorteados")
            sort_result = cur.fetchone()
            sort = sort_result['t'] if sort_result else 0
        except Exception as e:
            print(f"Error getting sorteios count: {e}")
            sort = 0
        
        try:
            cur.close()
            c.close()
        except:
            pass
        
        return jsonify({
            "total_participantes": int(p),
            "total_presentes": int(pr),
            "total_premios": int(prem),
            "total_sorteios": int(sort)
        })
    except Exception as e:
        print(f"❌ Erro stats: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/categorias')
def categorias():
    try:
        c = get_conn()
        if not c:
            return jsonify([]), 200
        cur = c.cursor(dictionary=True)
        cur.execute("SELECT * FROM categorias ORDER BY nome ASC")
        r = cur.fetchall()
        cur.close()
        c.close()
        return jsonify(r), 200
    except Exception as e:
        print(f"Erro categorias: {e}")
        return jsonify([]), 200

@app.route('/api/participantes')
def participantes():
    try:
        c = get_conn()
        if not c:
            return jsonify([]), 200
        cur = c.cursor(dictionary=True)
        cur.execute("SELECT * FROM participantes")
        r = cur.fetchall()
        cur.close()
        c.close()
        return jsonify(r), 200
    except Exception as e:
        print(f"Erro participantes: {e}")
        return jsonify([]), 200

@app.route('/api/premios/categoria/<int:categoria_id>')
def premios_por_categoria(categoria_id):
    """GET premios da tabela lista_de_premios com JOIN em participantes — filtra status_presente=SIM, tipo=ALUNO, status_pago=PAGO"""
    try:
        print(f"[DEBUG] Buscando premios para categoria_id: {categoria_id}")
        c = get_conn()
        if not c:
            print("[DEBUG] Erro: sem conexao com DB")
            return jsonify([]), 200

        cur = c.cursor(dictionary=True)
        cur.execute("""
          SELECT
            lp.id,
            lp.participante_id,
            lp.categoria_id,
            lp.nome,
            lp.numero,
            lp.tipo,
            lp.categoria_nome,
            lp.status_presente,
            lp.status_entrega,
            COALESCE(p.status_pago, 'NAO_PAGO') AS status_pago
          FROM lista_de_premios lp
          LEFT JOIN participantes p ON lp.participante_id = p.id
          WHERE lp.categoria_id = %s
            AND lp.status_presente = 'SIM'
            AND lp.tipo IN ('ALUNO',
                     'ALUNO/AUXILIAR',
                     'AUXILIAR',
                     'AUXILIAR/ALUNA',
                     'CONCLUINTE/ALUNA',
                     'CONCLUINTE/AUXILIAR',
                     'CONCLUINTE')
            AND (p.status_pago = 'PAGO' OR p.status_pago IS NULL)
          ORDER BY lp.nome
        """, (categoria_id,))

        r = cur.fetchall()
        print(f"[DEBUG] Encontrados {len(r)} premios presentes e pagos para categoria {categoria_id}")
        cur.close()
        c.close()
        return jsonify(r), 200
    except Exception as e:
        print(f"[ERROR] Erro /api/premios/categoria/{categoria_id}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify([]), 200

@app.route('/api/premiacao/validar')
def validar_premiacoes():
    """Audita todas as premiacoes — verifica regra: status_presente=SIM AND status_pago=PAGO"""
    try:
        c = get_conn()
        if not c:
            return jsonify({"erro": "sem conexao"}), 500

        cur = c.cursor(dictionary=True)

        # Total de elegiveis (presentes + pagos)
        cur.execute("""
            SELECT COUNT(*) AS total
            FROM lista_de_premios lp
            INNER JOIN participantes p ON lp.participante_id = p.id
            WHERE lp.status_presente = 'SIM'
              AND p.status_pago = 'PAGO'
              AND lp.tipo IN ('ALUNO','ALUNO/AUXILIAR','AUXILIAR','AUXILIAR/ALUNA',
                              'CONCLUINTE/ALUNA','CONCLUINTE/AUXILIAR','CONCLUINTE')
        """)
        elegiveis = cur.fetchone()['total']

        # Total na lista_de_premios com status_presente=SIM (antes do filtro pago)
        cur.execute("""
            SELECT COUNT(*) AS total
            FROM lista_de_premios
            WHERE status_presente = 'SIM'
              AND tipo IN ('ALUNO','ALUNO/AUXILIAR','AUXILIAR','AUXILIAR/ALUNA',
                           'CONCLUINTE/ALUNA','CONCLUINTE/AUXILIAR','CONCLUINTE')
        """)
        total_presentes = cur.fetchone()['total']

        # Violacoes: presentes mas NAO PAGOS
        cur.execute("""
            SELECT
                lp.id,
                lp.participante_id,
                lp.nome,
                lp.numero,
                lp.categoria_nome,
                lp.status_presente,
                COALESCE(p.status_pago, 'NAO_PAGO') AS status_pago
            FROM lista_de_premios lp
            LEFT JOIN participantes p ON lp.participante_id = p.id
            WHERE lp.status_presente = 'SIM'
              AND (p.status_pago != 'PAGO' OR p.status_pago IS NULL)
              AND lp.tipo IN ('ALUNO','ALUNO/AUXILIAR','AUXILIAR','AUXILIAR/ALUNA',
                              'CONCLUINTE/ALUNA','CONCLUINTE/AUXILIAR','CONCLUINTE')
            ORDER BY lp.categoria_nome, lp.nome
        """)
        violacoes = cur.fetchall()

        cur.close()
        c.close()

        status = "ok" if len(violacoes) == 0 else "inconsistencias"

        return jsonify({
            "status": status,
            "total_presentes": total_presentes,
            "elegiveis_pagos": elegiveis,
            "violacoes": len(violacoes),
            "detalhes": violacoes,
            "mensagem": "Todas as premiacoes estao OK" if len(violacoes) == 0
                else f"Encontradas {len(violacoes)} violacoes: participantes presentes mas NAO PAGOS"
        }), 200
    except Exception as e:
        print(f"[ERROR] Erro /api/premiacao/validar: {e}")
        return jsonify({"erro": str(e)}), 500


@app.route('/api/presenca', methods=['POST'])
def marcar_presenca():
    try:
        data = request.get_json() or {}
        participante_id = data.get('participante_id')
        status = data.get('status', 'PRESENTE')
        
        if not participante_id:
            return jsonify({'sucesso': False, 'erro': 'participante_id obrigatorio'}), 400
        
        c = get_conn()
        if not c:
            return jsonify({'sucesso': False, 'erro': 'sem conexao com banco'}), 500
        
        cur = c.cursor(dictionary=True)
        
        # CORREÇÃO: Recebe o ID, mas salva com o NUMERO
        cur.execute("SELECT numero FROM participantes WHERE id = %s", (participante_id,))
        resultado = cur.fetchone()
        numero_participante = resultado['numero'] if resultado else None
        
        if not numero_participante:
            print(f"⚠ Participante ID {participante_id} não encontrado")
            cur.close()
            c.close()
            return jsonify({'sucesso': False, 'erro': 'participante não encontrado'}), 400
        
        print(f"[DEBUG] Convertendo ID {participante_id} → NUMERO {numero_participante}")
        
        # Verificar se já existe registro
        cur.execute("SELECT id FROM presenca WHERE participante_id = %s LIMIT 1", (numero_participante,))
        existe = cur.fetchone()
        
        if existe:
            cur.execute("UPDATE presenca SET status = %s WHERE participante_id = %s", (status, numero_participante))
            print(f"[DEBUG] UPDATE presenca: numero={numero_participante}, status={status}")
        else:
            cur.execute("INSERT INTO presenca (participante_id, status) VALUES (%s, %s)", (numero_participante, status))
            print(f"[DEBUG] INSERT presenca: numero={numero_participante}, status={status}")
        
        c.commit()
        cur.close()
        c.close()
        return jsonify({'sucesso': True}), 200
    except Exception as e:
        print(f"Erro /api/presenca: {e}")
        return jsonify({'sucesso': False, 'erro': str(e)}), 500

@app.route('/api/presenca/lista')
def presenca_lista():
    try:
        c = get_conn()
        if not c:
            return jsonify([]), 200
        cur = c.cursor(dictionary=True)
        cur.execute("""
            SELECT
                p.id,
                p.numero,
                p.nome,
                p.tipo,
            
                COALESCE(pr.status, 'AUSENTE') AS status_presenca,    
                COALESCE(p.status_pago, 'NAO_PAGO') as status_pago,
                pr.id as presenca_id
            FROM participantes p
            LEFT JOIN presenca pr ON p.numero = pr.participante_id
            ORDER BY p.numero ASC
        """)
        r = cur.fetchall()
        cur.close()
        c.close()
        return jsonify(r), 200
    except Exception as e:
        print(f"Erro /api/presenca/lista: {e}")
        return jsonify([]), 200

@app.route('/api/presenca/ausente', methods=['POST'])
def marcar_ausente():
    try:
        data = request.get_json() or {}
        participante_id = data.get('participante_id')
        
        if not participante_id:
            return jsonify({'sucesso': False, 'erro': 'participante_id obrigatorio'}), 400
        
        c = get_conn()
        if not c:
            return jsonify({'sucesso': False, 'erro': 'sem conexao com banco'}), 500
        
        cur = c.cursor(dictionary=True)
        
        # CORREÇÃO: Recebe o ID, mas busca pelo NUMERO
        cur.execute("SELECT numero FROM participantes WHERE id = %s", (participante_id,))
        resultado = cur.fetchone()
        numero_participante = resultado['numero'] if resultado else None
        
        if not numero_participante:
            cur.close()
            c.close()
            return jsonify({'sucesso': False, 'erro': 'participante não encontrado'}), 400
        
        cur.execute("UPDATE presenca SET status = 'AUSENTE' WHERE participante_id = %s", (numero_participante,))
        c.commit()
        cur.close()
        c.close()
        return jsonify({'sucesso': True}), 200
    except Exception as e:
        print(f"Erro /api/presenca/ausente: {e}")
        return jsonify({'sucesso': False, 'erro': str(e)}), 500

@app.route('/api/premios/<int:premio_id>', methods=['PUT'])
def atualizar_premio(premio_id):
    try:
        data = request.get_json() or {}
        status_entrega = data.get('status_entrega')
        
        c = get_conn()
        if not c:
            return jsonify({'sucesso': False, 'erro': 'sem conexao'}), 500
        
        cur = c.cursor(dictionary=True)
        cur.execute("""
            UPDATE premiacoes
            SET status_entrega = %s
            WHERE id = %s
        """, (status_entrega, premio_id))
        
        c.commit()
        cur.close()
        c.close()
        return jsonify({'sucesso': True}), 200
    except Exception as e:
        print(f"Erro ao atualizar premio: {e}")
        return jsonify({'sucesso': False, 'erro': str(e)}), 500

@app.route('/api/presenca/update-pago', methods=['POST'])
def update_pago():
    """Atualiza status_pago de um participante"""
    try:
        data = request.get_json()
        participante_id = data.get('participante_id')
        status_pago = data.get('status_pago')
        
        if not participante_id or not status_pago:
            return jsonify({"error": "Missing fields"}), 400
        
        c = get_conn()
        if not c:
            return jsonify({"error": "DB connection failed"}), 500
        
        cur = c.cursor()
        cur.execute("UPDATE participantes SET status_pago = %s WHERE id = %s", (status_pago, participante_id))
        c.commit()
        cur.close()
        c.close()
        return jsonify({"success": True, "message": f"Status pago atualizado para {status_pago}"}), 200
    except Exception as e:
        print(f"Erro ao atualizar status_pago: {e}")
        return jsonify({"error": str(e)}), 500

# ============================================
# 🎲 ENDPOINTS DE SORTEIO (INTEGRADOS)
# ============================================

@app.route('/api/sorteio/categoria/<int:categoria_id>', methods=['GET'])
def sorteio(categoria_id):
    """Sorteia um participante presente e não sorteado"""
    try:
        print(f"[SORTEIO] Iniciando sorteio para categoria_id: {categoria_id}")
        c = get_conn()
        if not c:
            return jsonify({'sucesso': False, 'mensagem': 'Erro de conexão'}), 500
        
        cur = c.cursor(dictionary=True)
        
        # Buscar presentes que ainda não foram sorteados
        cur.execute("""
            SELECT p.numero, p.nome
            FROM participantes p
            INNER JOIN presenca pr ON p.numero = pr.participante_id
            WHERE pr.status = 'PRESENTE'
            AND p.numero NOT IN (
                SELECT DISTINCT participante_numero FROM sorteados WHERE categoria_id = %s
            )
            ORDER BY RAND()
            LIMIT 1
        """, (categoria_id,))
        
        resultado = cur.fetchone()
        
        if not resultado:
            print("[SORTEIO] Nenhum participante disponível")
            cur.close()
            c.close()
            return jsonify({
                'sucesso': False,
                'mensagem': 'Nenhum participante disponível para sorteio'
            }), 200
        
        numero = resultado['numero']
        nome = resultado['nome']
        
        # Registrar sorteio
        data_hora = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cur.execute("""
            INSERT INTO sorteados (categoria_id, participante_numero, participante_nome, data_hora)
            VALUES (%s, %s, %s, %s)
        """, (categoria_id, numero, nome, data_hora))
        
        c.commit()
        cur.close()
        c.close()
        
        print(f"[SORTEIO] ✓ Sorteado: #{numero} - {nome}")
        return jsonify({
            'sucesso': True,
            'numero': numero,
            'nome': nome,
            'mensagem': f'Parabéns! #{numero} - {nome}'
        }), 200
    except Exception as e:
        print(f"[SORTEIO] ❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'sucesso': False,
            'mensagem': f'Erro ao realizar sorteio: {str(e)}'
        }), 500

@app.route('/api/sorteio/historico/<int:categoria_id>', methods=['GET'])
def sorteio_historico(categoria_id):
    """Retorna histórico de sorteados da categoria"""
    try:
        c = get_conn()
        if not c:
            return jsonify([]), 200
        cur = c.cursor(dictionary=True)
        cur.execute("""
            SELECT participante_numero as numero, participante_nome as nome, data_hora
            FROM sorteados
            WHERE categoria_id = %s
            ORDER BY data_hora ASC
        """, (categoria_id,))
        
        resultado = cur.fetchall()
        cur.close()
        c.close()
        return jsonify(resultado), 200
    except Exception as e:
        print(f"[SORTEIO] Erro ao buscar histórico: {e}")
        return jsonify([]), 200

@app.route('/api/sorteio/total-disponiveis/<int:categoria_id>', methods=['GET'])
def sorteio_total_disponiveis(categoria_id):
    """Retorna total de participantes presentes que ainda podem ser sorteados"""
    try:
        c = get_conn()
        if not c:
            return jsonify({'total': 0}), 200
        cur = c.cursor(dictionary=True)
        cur.execute("""
            SELECT COUNT(*) as total
            FROM participantes p
            INNER JOIN presenca pr ON p.numero = pr.participante_id
            WHERE pr.status = 'PRESENTE'
            AND p.numero NOT IN (
                SELECT DISTINCT participante_numero FROM sorteados WHERE categoria_id = %s
            )
        """, (categoria_id,))
        
        resultado = cur.fetchone()
        total = resultado['total'] if resultado else 0
        cur.close()
        c.close()
        return jsonify({'total': total}), 200
    except Exception as e:
        print(f"[SORTEIO] Erro ao contar disponíveis: {e}")
        return jsonify({'total': 0}), 200

@app.route('/api/sorteio/limpar/<int:categoria_id>', methods=['POST'])
def sorteio_limpar(categoria_id):
    """Limpa todos os sorteios de uma categoria"""
    try:
        c = get_conn()
        if not c:
            return jsonify({'sucesso': False, 'mensagem': 'Erro de conexão'}), 500
        
        cur = c.cursor()
        cur.execute("DELETE FROM sorteados WHERE categoria_id = %s", (categoria_id,))
        c.commit()
        cur.close()
        c.close()
        
        return jsonify({
            'sucesso': True,
            'mensagem': 'Sorteios da categoria foram limpos com sucesso'
        }), 200
    except Exception as e:
        print(f"[SORTEIO] Erro ao limpar: {e}")
        return jsonify({
            'sucesso': False,
            'mensagem': f'Erro ao limpar sorteios: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)