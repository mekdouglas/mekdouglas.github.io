from flask import Blueprint, request, jsonify, current_app
from app import db
from models.ticket import Ticket
from models.message import Message
from utils.decorators import token_required
from sqlalchemy import desc

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/tickets/<int:ticket_id>/messages', methods=['GET'])
@token_required
def get_ticket_messages(current_user, ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)

    # Authorization: Ensure the current user is allowed to view messages for this ticket
    # For example, if the user is the ticket creator, assignee, or an admin.
    # This example assumes any authenticated user who can access the ticket can view messages.
    # You might want to add more specific checks:
    # if not (ticket.user_id == current_user.id or \
    #         (ticket.assignee_id and ticket.assignee_id == current_user.id) or \
    #         current_user.is_admin): # Assuming an is_admin flag on User model
    #     return jsonify({'message': 'You are not authorized to view messages for this ticket.'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    messages = Message.query.filter_by(ticket_id=ticket_id)\
                            .order_by(desc(Message.created_at))\
                            .paginate(page=page, per_page=per_page, error_out=False)
    
    messages_data = [message.to_dict() for message in messages.items]

    return jsonify({
        'messages': messages_data,
        'total_messages': messages.total,
        'current_page': messages.page,
        'total_pages': messages.pages
    }), 200
