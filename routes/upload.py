import os
import uuid
from flask import Blueprint, request, jsonify, current_app, url_for
from werkzeug.utils import secure_filename
from utils.decorators import token_required

upload_bp = Blueprint('upload', __name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

@upload_bp.route('/upload/image', methods=['POST'])
@token_required
def upload_image(current_user):
    if 'image' not in request.files:
        return jsonify({'message': 'No image file part in the request'}), 400
    
    file = request.files['image']

    if file.filename == '':
        return jsonify({'message': 'No image file selected'}), 400

    if file and allowed_file(file.filename):
        # Generate a secure, unique filename
        filename_prefix = secure_filename(file.filename.rsplit('.', 1)[0].lower())
        extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{filename_prefix}_{uuid.uuid4().hex[:8]}.{extension}"
        
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER_IMAGES'], unique_filename)
        
        try:
            file.save(filepath)
            # Construct the URL to access the file
            # This assumes UPLOAD_FOLDER is within 'static' directory and accessible via /static/...
            # e.g., static/uploads/images -> /static/uploads/images/filename.jpg
            # We need to make sure the 'static_url_path' for the app is correctly configured
            # or generate the path relative to the static folder.
            # Flask's default static folder is 'static'. url_for('static', filename='...') is the standard way.
            
            # Path relative to the 'static' folder
            # current_app.static_folder is absolute path to /app/static
            # current_app.config['UPLOAD_FOLDER_IMAGES'] is /app/static/uploads/images
            relative_upload_path = os.path.relpath(filepath, current_app.static_folder)
            image_url = url_for('static', filename=relative_upload_path, _external=False) # _external=True for absolute URL
            
            return jsonify({'message': 'Image uploaded successfully', 'image_url': image_url}), 201
        except Exception as e:
            # Log the exception e
            return jsonify({'message': f'Failed to save image: {str(e)}'}), 500
    else:
        return jsonify({'message': 'File type not allowed for image'}), 400

@upload_bp.route('/upload/audio', methods=['POST'])
@token_required
def upload_audio(current_user):
    if 'audio' not in request.files:
        return jsonify({'message': 'No audio file part in the request'}), 400
    
    file = request.files['audio']

    if file.filename == '':
        return jsonify({'message': 'No audio file selected'}), 400

    if file and allowed_file(file.filename): # Reuses the same allowed_file logic for now
        filename_prefix = secure_filename(file.filename.rsplit('.', 1)[0].lower())
        extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{filename_prefix}_{uuid.uuid4().hex[:8]}.{extension}"
        
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER_AUDIO'], unique_filename)
        
        try:
            file.save(filepath)
            # Path relative to the 'static' folder
            relative_upload_path = os.path.relpath(filepath, current_app.static_folder)
            audio_url = url_for('static', filename=relative_upload_path, _external=False)
            
            return jsonify({'message': 'Audio uploaded successfully', 'audio_url': audio_url}), 201
        except Exception as e:
            # Log the exception e
            return jsonify({'message': f'Failed to save audio: {str(e)}'}), 500
    else:
        return jsonify({'message': 'File type not allowed for audio'}), 400
