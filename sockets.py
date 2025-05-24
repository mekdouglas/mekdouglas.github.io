from flask import request, current_app
from flask_socketio import emit, join_room, leave_room
# Delay import of socketio and db to avoid circular dependency if sockets is imported by app/__init__ at top level
# from app import socketio, db
from models.message import Message
from models.ticket import Ticket
# from models.user import User # User is imported within handle_send_message
# from utils.decorators import token_required_socket # This decorator was not fully implemented/used
import jwt # For decoding token if passed for authentication in connect/join

# Need a way to authenticate socket connections, e.g., via token passed in connection query or initial event
# For simplicity, 'send_message' will be the primary authenticated event using a passed token for now.
# A global variable to hold the socketio instance, to be initialized by app
_socketio = None

def init_socketio_handlers(sio):
    global _socketio
    _socketio = sio
    # All event handlers are now defined inside this function, using the passed sio instance.

    @_socketio.on('connect')
    def handle_connect():
        print('Client connected:', request.sid)
        # Add authentication logic if needed on connect

    @_socketio.on('disconnect')
    def handle_disconnect():
        print('Client disconnected:', request.sid)

    @_socketio.on('join_room')
    def on_join(data):
        # TODO: Add authentication/authorization for joining room
        ticket_id = data.get('ticket_id')
        if not ticket_id:
            emit('error', {'message': 'ticket_id is required to join room'}, room=request.sid)
            return
        room_name = f"ticket_{ticket_id}"
        join_room(room_name)
        emit('status', {'message': f'Successfully joined room {room_name}.'}, room=request.sid)

    @_socketio.on('leave_room')
    def on_leave(data):
        # TODO: Add authentication/authorization for leaving room
        ticket_id = data.get('ticket_id')
        if not ticket_id:
            emit('error', {'message': 'ticket_id is required to leave room'}, room=request.sid)
            return
        room_name = f"ticket_{ticket_id}"
        leave_room(room_name)
        emit('status', {'message': f'Successfully left room {room_name}.'}, room=request.sid)

    @_socketio.on('send_message')
    def handle_send_message(json_data):
        from app import db # Import db here to ensure app context is available
        from models.user import User # Import User model
        from models.mention import MessageMention # For querying mentions
        from models.ticket import Ticket as TicketModel # Alias to avoid confusion
        from utils.mentions import parse_mentions, get_mentioned_users
        from utils.notifications import create_notification # Import notification utility
        from flask import url_for # For image URL validation

        token = json_data.get('token')
        ticket_id = json_data.get('ticket_id')
        content = json_data.get('content') 
        image_url = json_data.get('image_url')
        audio_url = json_data.get('audio_url') # New: audio_url from client

        if not token:
            emit('error', {'message': 'Authentication token is missing.'}, room=request.sid)
            return
        
        if not ticket_id:
            emit('error', {'message': 'Ticket ID is required.'}, room=request.sid)
            return

        if not content and not image_url and not audio_url:
            emit('error', {'message': 'Message content (text, image, or audio) is required.'}, room=request.sid)
            return
        
        # Optional: Validate image_url format
        if image_url and not image_url.startswith('/static/uploads/images/'):
            emit('error', {'message': 'Invalid image_url format.'}, room=request.sid)
            return

        # Optional: Validate audio_url format
        if audio_url and not audio_url.startswith('/static/uploads/audio/'):
            emit('error', {'message': 'Invalid audio_url format.'}, room=request.sid)
            return

        try:
            # Use current_app for config, accessible if app context is pushed by SocketIO
            decoded_token = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
            user_id = decoded_token['user_id']
            current_user = User.query.get(user_id)
            if not current_user:
                emit('error', {'message': 'Invalid user.'}, room=request.sid)
                return
        except jwt.ExpiredSignatureError:
            emit('error', {'message': 'Token has expired.'}, room=request.sid)
            return
        except jwt.InvalidTokenError:
            emit('error', {'message': 'Invalid token.'}, room=request.sid)
            return
        except Exception as e: # Catch any other JWT errors or app context issues
            emit('error', {'message': f'Error processing token: {str(e)}'}, room=request.sid)
            return
            
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            emit('error', {'message': 'Ticket not found.'}, room=request.sid)
            return

        # Authorization: Check if user can post to this ticket
        # (e.g., user is ticket creator, assignee, or an admin)
        # For this example, we'll allow if the user is either the creator or assignee.
        # More complex logic (like admin override) can be added.
        if not (ticket.user_id == current_user.id or \
                (ticket.assignee_id and ticket.assignee_id == current_user.id) or \
                getattr(current_user, 'is_admin', False)): # Example: Check for an 'is_admin' attribute
             emit('error', {'message': 'You are not authorized to post messages to this ticket.'}, room=request.sid)
             return

        new_message = Message(
            ticket_id=ticket_id,
            user_id=current_user.id,
            content=content,
            image_url=image_url,
            audio_url=audio_url # Save the audio URL
        )
        db.session.add(new_message)
        db.session.commit() # Commit to get new_message.id for mentions

        # Mention processing
        mentioned_user_details = []
        if new_message.content: # Only parse if there's text content
            potential_usernames = parse_mentions(new_message.content)
            if potential_usernames:
                mentioned_users = get_mentioned_users(potential_usernames)
                for user_to_mention in mentioned_users:
                    # Avoid self-mentioning from creating a notification/record if desired
                    # if user_to_mention.id == current_user.id:
                    #     continue
                    
                    mention_record = MessageMention.query.filter_by(
                        message_id=new_message.id, 
                        user_id=user_to_mention.id
                    ).first()

                    if not mention_record: # Ensure not to create duplicate mentions if logic runs twice or similar
                        new_mention = MessageMention(message_id=new_message.id, user_id=user_to_mention.id)
                        db.session.add(new_mention)
                        mentioned_user_details.append({'id': user_to_mention.id, 'username': user_to_mention.username})
                        
                        # Create notification for the mentioned user
                        if user_to_mention.id != current_user.id: # Avoid notifying user for self-mention
                            # Fetch the ticket to include its ID or title in the notification
                            ticket_for_notification = TicketModel.query.get(new_message.ticket_id)
                            if ticket_for_notification: # Ensure ticket exists
                                notification_message = f"@{current_user.username} mentioned you in ticket #{ticket_for_notification.id}"
                                if new_message.content:
                                    notification_message += f": \"{new_message.content[:50]}...\""
                                elif new_message.image_url:
                                    notification_message += " (shared an image)"
                                elif new_message.audio_url:
                                    notification_message += " (shared an audio message)"

                                create_notification(
                                    recipient_id=user_to_mention.id,
                                    type='mention',
                                    message=notification_message,
                                    link_to_entity_id=ticket_for_notification.id,
                                    entity_type='ticket',
                                    commit=False # Will commit with other mention creations or at the end
                                )
                if mentioned_user_details: # If any mentions or notifications were made
                    db.session.commit() 
        
        message_data = new_message.to_dict()
        message_data['mentions'] = mentioned_user_details # Add mention details to broadcast

        room_name = f"ticket_{ticket_id}"
        _socketio.emit('new_message', message_data, room=room_name)
        # print(f"Message sent by {current_user.username} to room {room_name}: {content}, mentions: {mentioned_user_details}")

# Global socketio instance will be replaced by the one from app
# This is a common pattern if you want to define handlers in a separate file.
# Alternatively, pass socketio instance to each handler or use a class-based approach.
