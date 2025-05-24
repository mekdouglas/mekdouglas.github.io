from app import db # For db.session
from models.notification import Notification

def create_notification(recipient_id: int, 
                        type: str, 
                        message: str, 
                        link_to_entity_id: int = None, 
                        entity_type: str = None,
                        commit: bool = True) -> Notification:
    """
    Creates and saves a new notification.
    
    :param recipient_id: ID of the user who should receive the notification.
    :param type: Type of notification (e.g., 'mention', 'task_assigned').
    :param message: The content of the notification.
    :param link_to_entity_id: (Optional) ID of the related entity (e.g., ticket_id, task_id).
    :param entity_type: (Optional) Type of the related entity (e.g., 'ticket', 'task').
    :param commit: (Optional) Whether to commit the session immediately.
    :return: The created Notification object.
    """
    if not recipient_id or not type or not message:
        # Consider raising an error or logging instead of returning None,
        # depending on how strict error handling should be.
        # For now, let's assume valid inputs are mostly guaranteed by callers
        # or that callers will handle None.
        print(f"Error: Missing required fields for notification: recipient_id={recipient_id}, type={type}, message={message}")
        return None

    notification = Notification(
        recipient_id=recipient_id,
        type=type,
        message=message,
        link_to_entity_id=link_to_entity_id,
        entity_type=entity_type
    )
    db.session.add(notification)
    
    if commit:
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Error committing notification: {e}") # Or use proper logging
            # Potentially re-raise or handle error as appropriate
            return None # Indicate failure
            
    return notification
