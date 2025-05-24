from app import db
from datetime import datetime
from models.user import User  # To link created_by_id and assigned_to_id
from models.ticket import Ticket  # To link ticket_id

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('ticket.id'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), default='pending', nullable=False)  # e.g., pending, in_progress, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    due_date = db.Column(db.DateTime, nullable=True)
    
    assigned_to_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # Relationships
    ticket = db.relationship('Ticket', backref=db.backref('tasks', lazy='dynamic', cascade="all, delete-orphan"))
    assigned_to = db.relationship('User', foreign_keys=[assigned_to_id], backref=db.backref('assigned_tasks', lazy='dynamic'))
    created_by = db.relationship('User', foreign_keys=[created_by_id], backref=db.backref('created_tasks', lazy='dynamic'))

    def __repr__(self):
        return f'<Task {self.id} - {self.title}>'

    def to_dict(self):
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'assigned_to_id': self.assigned_to_id,
            'assigned_to_username': self.assigned_to.username if self.assigned_to else None,
            'created_by_id': self.created_by_id,
            'created_by_username': self.created_by.username if self.created_by else None,
        }
