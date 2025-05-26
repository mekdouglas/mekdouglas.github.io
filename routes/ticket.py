from flask import Blueprint, request, jsonify, current_app
from app import db
from models.ticket import Ticket
from models.user import User
from utils.decorators import token_required
from datetime import datetime

ticket_bp = Blueprint('ticket', __name__)

@ticket_bp.route('/tickets', methods=['POST'])
@token_required
def create_ticket(current_user):
    data = request.get_json()

    title = data.get('title')
    description = data.get('description')
    priority = data.get('priority', 'medium') # Default priority
    assignee_id = data.get('assignee_id')

    if not title or not description:
        return jsonify({'message': 'Title and description are required'}), 400

    # Optional: Validate priority value if you have a predefined set
    valid_priorities = ['low', 'medium', 'high']
    if priority not in valid_priorities:
        return jsonify({'message': f'Invalid priority. Must be one of {valid_priorities}'}), 400

    # Optional: Validate assignee_id if provided
    assignee = None
    if assignee_id:
        assignee = User.query.get(assignee_id)
        if not assignee:
            return jsonify({'message': 'Assignee user not found'}), 404
    
    new_ticket = Ticket(
        title=title,
        description=description,
        priority=priority,
        user_id=current_user.id,
        assignee_id=assignee_id if assignee else None
    )

    db.session.add(new_ticket)
    db.session.commit()

    return jsonify({'message': 'Ticket created successfully', 'ticket': new_ticket.to_dict()}), 201

@ticket_bp.route('/tickets', methods=['GET'])
@token_required
def get_all_tickets(current_user):
    # TODO: Add pagination for scalability
    tickets = Ticket.query.order_by(Ticket.created_at.desc()).all()
    return jsonify([ticket.to_dict() for ticket in tickets]), 200

@ticket_bp.route('/tickets/<int:ticket_id>', methods=['GET'])
@token_required
def get_ticket_by_id(current_user, ticket_id):
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({'message': 'Ticket not found'}), 404
    
    # Optional: Add authorization check if only certain users can view certain tickets
    # e.g., if current_user.id != ticket.user_id and (not ticket.assignee_id or current_user.id != ticket.assignee_id):
    #     if not getattr(current_user, 'is_admin', False): # Assuming an admin role
    #         return jsonify({'message': 'You are not authorized to view this ticket'}), 403
            
    return jsonify(ticket.to_dict()), 200
