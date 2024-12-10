from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
import os
import uuid
from PIL import Image
from io import BytesIO

from models.user import User
from models.notification import Notification
from extensions import db

profile_bp = Blueprint('profile', __name__)

def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

@profile_bp.route('/api/profile', methods=['GET'])
@login_required
def get_profile():
    """Get user profile data"""
    try:
        user_data = {
            'fullname': current_user.fullname,
            'email': current_user.email,
            'phone': current_user.phone,
            'university': current_user.university,
            'profile_picture': current_user.profile_picture_url,
            'notifications': {
                'email': current_user.email_notifications,
                'sales': current_user.sale_notifications,
                'offers': current_user.offer_notifications,
                'messages': current_user.message_notifications
            }
        }
        return jsonify({'success': True, 'data': user_data})
    except Exception as e:
        current_app.logger.error(f'Error fetching profile data: {str(e)}')
        return jsonify({'success': False, 'error': 'Failed to fetch profile data'}), 500

@profile_bp.route('/api/profile/update', methods=['POST'])
@login_required
def update_profile():
    """Update user profile information"""
    try:
        data = request.get_json()
        
        # Update user information
        current_user.fullname = data.get('fullname', current_user.fullname)
        current_user.phone = data.get('phone', current_user.phone)
        
        db.session.commit()
        return jsonify({'success': True, 'message': 'Profile updated successfully'})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error updating profile: {str(e)}')
        return jsonify({'success': False, 'error': 'Failed to update profile'}), 500

@profile_bp.route('/api/profile/password', methods=['POST'])
@login_required
def update_password():
    """Update user password"""
    try:
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        # Verify current password
        if not check_password_hash(current_user.password_hash, current_password):
            return jsonify({'success': False, 'error': 'Current password is incorrect'}), 400
        
        # Validate new password
        if len(new_password) < 8:
            return jsonify({'success': False, 'error': 'Password must be at least 8 characters long'}), 400
        
        # Update password
        current_user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Password updated successfully'})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error updating password: {str(e)}')
        return jsonify({'success': False, 'error': 'Failed to update password'}), 500

@profile_bp.route('/api/profile/notifications', methods=['POST'])
@login_required
def update_notifications():
    """Update notification preferences"""
    try:
        data = request.get_json()
        
        current_user.email_notifications = data.get('email', current_user.email_notifications)
        current_user.sale_notifications = data.get('sales', current_user.sale_notifications)
        current_user.offer_notifications = data.get('offers', current_user.offer_notifications)
        current_user.message_notifications = data.get('messages', current_user.message_notifications)
        
        db.session.commit()
        return jsonify({'success': True, 'message': 'Notification preferences updated'})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error updating notifications: {str(e)}')
        return jsonify({'success': False, 'error': 'Failed to update notification preferences'}), 500

@profile_bp.route('/api/profile/picture', methods=['POST'])
@login_required
def upload_picture():
    """Upload and process profile picture"""
    try:
        if 'picture' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
            
        file = request.files['picture']
        if not file or not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Invalid file type'}), 400
            
        # Check file size
        file_content = file.read()
        if len(file_content) > current_app.config['MAX_IMAGE_SIZE']:
            return jsonify({'success': False, 'error': 'File size exceeds 2MB limit'}), 400
            
        # Process image
        try:
            image = Image.open(BytesIO(file_content))
            
            # Generate unique filename
            filename = f"{uuid.uuid4()}.jpg"
            upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'profile_pictures', filename)
            
            # Ensure upload directory exists
            os.makedirs(os.path.dirname(upload_path), exist_ok=True)
            
            # Save processed image
            image.save(upload_path, 'JPEG', quality=85)
            
            # Update user profile picture URL
            current_user.profile_picture_url = f"/uploads/profile_pictures/{filename}"
            db.session.commit()
            
            return jsonify({
                'success': True,
                'url': current_user.profile_picture_url,
                'message': 'Profile picture updated successfully'
            })
        except Exception as e:
            current_app.logger.error(f'Error processing image: {str(e)}')
            return jsonify({'success': False, 'error': 'Failed to process image'}), 500
            
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error uploading profile picture: {str(e)}')
        return jsonify({'success': False, 'error': 'Failed to upload profile picture'}), 500

@profile_bp.route('/api/profile/picture', methods=['DELETE'])
@login_required
def remove_picture():
    """Remove user profile picture"""
    try:
        if current_user.profile_picture_url:
            # Delete the file if it exists
            file_path = os.path.join(
                current_app.config['UPLOAD_FOLDER'],
                current_user.profile_picture_url.lstrip('/uploads/')
            )
            if os.path.exists(file_path):
                os.remove(file_path)
            
            # Reset profile picture URL
            current_user.profile_picture_url = None
            db.session.commit()
            
        return jsonify({'success': True, 'message': 'Profile picture removed'})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error removing profile picture: {str(e)}')
        return jsonify({'success': False, 'error': 'Failed to remove profile picture'}), 500
