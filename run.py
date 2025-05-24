from app import create_app, db, socketio # Import socketio

app = create_app()

if __name__ == '__main__':
    # db.create_all() should ideally be handled by migrations (flask db upgrade)
    # For development, you might keep it, but ensure it's within app_context
    # with app.app_context():
    #     db.create_all()
    socketio.run(app, debug=True) # Use socketio.run
