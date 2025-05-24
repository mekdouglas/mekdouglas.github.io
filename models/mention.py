from app import db
from models.user import User # For user_id FK
from models.message import Message # For message_id FK

class MessageMention(db.Model):
    __tablename__ = 'message_mention' # Explicit table name

    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.Integer, db.ForeignKey('message.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # Relationships
    # The message that contains the mention
    message = db.relationship('Message', backref=db.backref('mentions', lazy='dynamic', cascade="all, delete-orphan"))
    # The user who was mentioned
    mentioned_user = db.relationship('User', backref=db.backref('mentions_received', lazy='dynamic'))

    # Unique constraint: a user can only be mentioned once per message
    __table_args__ = (db.UniqueConstraint('message_id', 'user_id', name='uq_message_user_mention'),)

    def __repr__(self):
        return f'<MessageMention {self.id} - Message {self.message_id} mentioned User {self.user_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'message_id': self.message_id,
            'user_id': self.user_id,
            'mentioned_username': self.mentioned_user.username if self.mentioned_user else None
        }
