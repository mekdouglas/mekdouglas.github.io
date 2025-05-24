from app import db
from datetime import datetime
from models.user import User # Ensure User is importable

class Ticket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='open', nullable=False) # e.g., open, in_progress, closed
    priority = db.Column(db.String(20), default='medium', nullable=False) # e.g., low, medium, high
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    assignee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    # Relationships
    # The user who created the ticket
    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('created_tickets', lazy='dynamic'))
    # The user assigned to the ticket
    assignee = db.relationship('User', foreign_keys=[assignee_id], backref=db.backref('assigned_tickets', lazy='dynamic'))

    def __repr__(self):
        return f'<Ticket {self.id} - {self.title}>'

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'user_id': self.user_id,
            'assignee_id': self.assignee_id,
            'user_username': self.user.username if self.user else None,
            'assignee_username': self.assignee.username if self.assignee else None,
        }
