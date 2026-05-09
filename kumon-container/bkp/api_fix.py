# Coloca no lugar da linha que tenta UPDATE na VIEW
# Troca esto:
#     UPDATE lista_de_premios
# Por isto:
#     UPDATE premiacoes

@app.route('/api/premios/<int:premio_id>', methods=['PUT'])
def atualizar_premio(premio_id):
    try:
        data = request.get_json() or {}
        status_entrega = data.get('status_entrega', 'NAO')
        
        c = get_conn()
        if not c:
            return jsonify({'sucesso': False, 'erro': 'sem conexão'}), 500
        
        cur = c.cursor(dictionary=True)
        
        # Atualiza na tabela real
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
        print(f"Erro ao atualizar prêmio: {e}")
        return jsonify({'sucesso': False, 'erro': str(e)}), 500
