from flask import Blueprint, request, jsonify, current_app
from app import db
from models.notification import Notification
from utils.decorators import token_required
from sqlalchemy import desc

notification_bp = Blueprint('notification', __name__)

# GET /api/notifications
@notification_bp.route('/notifications', methods=['GET'])
@token_required
def get_user_notifications(current_user):
    fetch_all = request.args.get('all', 'false').lower() == 'true'

    query = Notification.query.filter_by(recipient_id=current_user.id)
    
    if not fetch_all:
        query = query.filter_by(is_read=False)
        
    notifications = query.order_by(desc(Notification.created_at)).all()
    
    return jsonify([notification.to_dict() for notification in notifications]), 200

# POST /api/notifications/<int:notification_id>/mark-read
@notification_bp.route('/notifications/<int:notification_id>/mark-read', methods=['POST'])
@token_required
def mark_notification_as_read(current_user, notification_id):
    notification = Notification.query.get(notification_id)

    if not notification:
        return jsonify({'message': 'Notification not found'}), 404

    if notification.recipient_id != current_user.id:
        return jsonify({'message': 'You are not authorized to mark this notification as read'}), 403

    notification.is_read = True
    db.session.commit()
    
    return jsonify({'message': 'Notification marked as read', 'notification': notification.to_dict()}), 200

# POST /api/notifications/mark-all-read
@notification_bp.route('/notifications/mark-all-read', methods=['POST'])
@token_required
def mark_all_notifications_as_read(current_user):
    unread_notifications = Notification.query.filter_by(recipient_id=current_user.id, is_read=False).all()

    if not unread_notifications:
        return jsonify({'message': 'No unread notifications to mark as read'}), 200

    for notification in unread_notifications:
        notification.is_read = True
    
    db.session.commit()
    
    count = len(unread_notifications)
    return jsonify({'message': f'{count} notifications marked as read'}), 200
