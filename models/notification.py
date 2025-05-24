from app import db
from datetime import datetime
from models.user import User # For recipient_id FK

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    recipient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # e.g., 'mention', 'task_assigned', 'new_ticket_message'
    message = db.Column(db.String(255), nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    link_to_entity_id = db.Column(db.Integer, nullable=True) # e.g., ticket_id, task_id
    entity_type = db.Column(db.String(50), nullable=True) # e.g., 'ticket', 'task'

    # Relationship to the recipient User
    recipient = db.relationship('User', backref=db.backref('notifications', lazy='dynamic', order_by="desc(Notification.created_at)"))

    def __repr__(self):
        return f'<Notification {self.id} for User {self.recipient_id} - Type: {self.type}>'

    def to_dict(self):
        return {
            'id': self.id,
            'recipient_id': self.recipient_id,
            'type': self.type,
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat(),
            'link_to_entity_id': self.link_to_entity_id,
            'entity_type': self.entity_type,
        }
