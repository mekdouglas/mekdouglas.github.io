from flask import Blueprint, request, jsonify, current_app
from app import db
from models.task import Task
from models.ticket import Ticket
from models.user import User
from utils.decorators import token_required
from datetime import datetime

task_bp = Blueprint('task', __name__)

# Helper for authorization
def check_task_authorization(task, user, roles_allowed=['creator', 'assignee', 'admin']):
    """
    Checks if a user is authorized to perform an action on a task.
    - 'creator': User who created the task.
    - 'assignee': User assigned to the task.
    - 'ticket_creator': User who created the parent ticket.
    - 'ticket_assignee': User assigned to the parent ticket.
    - 'admin': User with admin privileges (assuming an 'is_admin' attribute).
    """
    if getattr(user, 'is_admin', False) and 'admin' in roles_allowed:
        return True
    if task.created_by_id == user.id and 'creator' in roles_allowed:
        return True
    if task.assigned_to_id == user.id and 'assignee' in roles_allowed:
        return True
    if task.ticket:
        if task.ticket.user_id == user.id and 'ticket_creator' in roles_allowed:
             return True
        if task.ticket.assignee_id == user.id and 'ticket_assignee' in roles_allowed:
            return True
    return False

# POST /api/tickets/<int:ticket_id>/tasks
@task_bp.route('/tickets/<int:ticket_id>/tasks', methods=['POST'])
@token_required
def create_task_for_ticket(current_user, ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    data = request.get_json()

    title = data.get('title')
    description = data.get('description')
    due_date_str = data.get('due_date')
    assigned_to_id = data.get('assigned_to_id')
    status = data.get('status', 'pending')

    if not title:
        return jsonify({'message': 'Title is required for the task'}), 400

    # Authorization: e.g., only ticket creator or assignee can add tasks
    if not (ticket.user_id == current_user.id or \
            (ticket.assignee_id and ticket.assignee_id == current_user.id) or \
            getattr(current_user, 'is_admin', False)): # Assuming an is_admin flag
        return jsonify({'message': 'You are not authorized to add tasks to this ticket.'}), 403

    due_date = None
    if due_date_str:
        try:
            due_date = datetime.fromisoformat(due_date_str)
        except ValueError:
            return jsonify({'message': 'Invalid due_date format. Use ISO format.'}), 400

    assignee = None
    if assigned_to_id:
        assignee = User.query.get(assigned_to_id)
        if not assignee:
            return jsonify({'message': 'Assigned user not found'}), 404
            
    valid_statuses = ['pending', 'in_progress', 'completed']
    if status not in valid_statuses:
        return jsonify({'message': f'Invalid status. Must be one of {valid_statuses}'}), 400

    new_task = Task(
        ticket_id=ticket_id,
        title=title,
        description=description,
        due_date=due_date,
        assigned_to_id=assigned_to_id if assignee else None,
        created_by_id=current_user.id,
        status=status
    )
    db.session.add(new_task)
    db.session.commit()

    # Notification for task assignment
    if new_task.assigned_to_id:
        if new_task.assigned_to_id != current_user.id: # Don't notify if self-assigned
            from utils.notifications import create_notification
            create_notification(
                recipient_id=new_task.assigned_to_id,
                type='task_assigned',
                message=f"You've been assigned a new task: \"{new_task.title}\" in ticket #{new_task.ticket_id}",
                link_to_entity_id=new_task.id,
                entity_type='task'
                # commit=True by default
            )
    return jsonify({'message': 'Task created successfully', 'task': new_task.to_dict()}), 201

# GET /api/tickets/<int:ticket_id>/tasks
@task_bp.route('/tickets/<int:ticket_id>/tasks', methods=['GET'])
@token_required
def get_tasks_for_ticket(current_user, ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    
    # Authorization: e.g., only ticket creator, assignee, or admin can view tasks
    if not (ticket.user_id == current_user.id or \
            (ticket.assignee_id and ticket.assignee_id == current_user.id) or \
            getattr(current_user, 'is_admin', False)):
        return jsonify({'message': 'You are not authorized to view tasks for this ticket.'}), 403

    tasks = Task.query.filter_by(ticket_id=ticket_id).all()
    return jsonify([task.to_dict() for task in tasks]), 200

# PUT /api/tasks/<int:task_id>
@task_bp.route('/tasks/<int:task_id>', methods=['PUT'])
@token_required
def update_task(current_user, task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()

    # Authorization: Only creator, assignee, or admin can update.
    # Ticket creator/assignee could also be allowed.
    if not check_task_authorization(task, current_user, roles_allowed=['creator', 'assignee', 'admin', 'ticket_creator', 'ticket_assignee']):
        return jsonify({'message': 'You are not authorized to update this task.'}), 403

    original_assignee_id = task.assigned_to_id
    
    task.title = data.get('title', task.title)
    task.description = data.get('description', task.description)
    task.status = data.get('status', task.status)
    
    if 'due_date' in data:
        due_date_str = data.get('due_date')
        if due_date_str:
            try:
                task.due_date = datetime.fromisoformat(due_date_str)
            except ValueError:
                return jsonify({'message': 'Invalid due_date format. Use ISO format.'}), 400
        else:
            task.due_date = None # Allow clearing due date

    if 'assigned_to_id' in data:
        new_assignee_id = data.get('assigned_to_id')
        if new_assignee_id:
            assignee = User.query.get(new_assignee_id)
            if not assignee:
                return jsonify({'message': 'Assigned user not found'}), 404
            task.assigned_to_id = new_assignee_id
        else:
            task.assigned_to_id = None # Allow unassigning
    else: # Ensure new_assignee_id is defined for later comparison
        new_assignee_id = task.assigned_to_id


    valid_statuses = ['pending', 'in_progress', 'completed']
    if task.status not in valid_statuses:
        return jsonify({'message': f'Invalid status. Must be one of {valid_statuses}'}), 400

    db.session.commit()

    # Notification for task assignment change
    if 'assigned_to_id' in data and new_assignee_id != original_assignee_id:
        if new_assignee_id and new_assignee_id != current_user.id: # Notify new assignee if not self
            from utils.notifications import create_notification
            create_notification(
                recipient_id=new_assignee_id,
                type='task_assigned',
                message=f"You've been assigned to task: \"{task.title}\" in ticket #{task.ticket_id}",
                link_to_entity_id=task.id,
                entity_type='task'
            )
        # Optionally, notify original_assignee_id if they were unassigned (not implemented here)

    return jsonify({'message': 'Task updated successfully', 'task': task.to_dict()}), 200

# DELETE /api/tasks/<int:task_id>
@task_bp.route('/tasks/<int:task_id>', methods=['DELETE'])
@token_required
def delete_task(current_user, task_id):
    task = Task.query.get_or_404(task_id)

    # Authorization: Only creator, admin, or perhaps ticket creator can delete.
    if not check_task_authorization(task, current_user, roles_allowed=['creator', 'admin', 'ticket_creator']):
        return jsonify({'message': 'You are not authorized to delete this task.'}), 403

    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted successfully'}), 200
