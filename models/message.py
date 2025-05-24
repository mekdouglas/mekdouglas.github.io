from app import db
from datetime import datetime
from models.user import User  # Import User
from models.ticket import Ticket # Import Ticket

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('ticket.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=True) # Can be null if it's an image or audio message
    image_url = db.Column(db.String(255), nullable=True) # URL for the uploaded image
    audio_url = db.Column(db.String(255), nullable=True) # URL for the uploaded audio
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    # The user who sent the message
    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('sent_messages', lazy='dynamic'))
    # The ticket this message belongs to
    ticket = db.relationship('Ticket', foreign_keys=[ticket_id], backref=db.backref('messages', lazy='dynamic'))

    def __repr__(self):
        return f'<Message {self.id} to Ticket {self.ticket_id} by User {self.user_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'user_id': self.user_id,
            'content': self.content,
            'image_url': self.image_url,
            'audio_url': self.audio_url,
            'created_at': self.created_at.isoformat(),
            'user_username': self.user.username if self.user else None,
        }
