class Categoria(db.Model):
    __tablename__ = 'categorias'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(255), nullable=False, unique=True)
    descricao = db.Column(db.Text, nullable=True)
    tipo_premio = db.Column(db.String(50), nullable=True)
    quantidade_vencedores = db.Column(db.Integer, nullable=True)
    ordem = db.Column(db.Integer, default=1)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento
    premiacoes = db.relationship('Premiacao', back_populates='categoria')
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'descricao': self.descricao,
            'tipo_premio': self.tipo_premio,
            'quantidade_vencedores': self.quantidade_vencedores,
            'ordem': self.ordem
        }


class Premiacao(db.Model):
    __tablename__ = 'premiacoes'
    
    id = db.Column(db.Integer, primary_key=True)
    participante_id = db.Column(db.Integer, db.ForeignKey('participantes.id'), nullable=False)
    categoria_id = db.Column(db.Integer, db.ForeignKey('categorias.id'), nullable=False)
    status = db.Column(db.String(50), default='PENDENTE', nullable=True)
    data_entrega = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    participante = db.relationship('Participante', back_populates='premiacoes')
    categoria = db.relationship('Categoria', back_populates='premiacoes')
    
    def to_dict(self):
        return {
            'id': self.id,
            'participante_id': self.participante_id,
            'categoria_id': self.categoria_id,
            'status': self.status,
            'data_entrega': self.data_entrega.isoformat() if self.data_entrega else None
        }
