from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from datetime import datetime, timedelta
from models.user import User
from models.listing import Listing
from models.notification import Notification
from models.transaction import Transaction
from database import db

dashboard = Blueprint('dashboard', __name__)

@dashboard.route('/api/dashboard/stats', methods=['GET'])
@login_required
def get_dashboard_stats():
    """Get user's dashboard statistics."""
    try:
        # Get total sales
        total_sales = Transaction.query.filter_by(seller_id=current_user.id).count()
        
        # Get active listings
        active_listings = Listing.query.filter_by(
            user_id=current_user.id,
            status='active'
        ).count()
        
        # Get pending offers
        pending_offers = Transaction.query.filter_by(
            seller_id=current_user.id,
            status='pending'
        ).count()
        
        # Calculate user rating
        transactions = Transaction.query.filter_by(seller_id=current_user.id).all()
        ratings = [t.rating for t in transactions if t.rating is not None]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        
        return jsonify({
            'success': True,
            'data': {
                'totalSales': total_sales,
                'activeListings': active_listings,
                'pendingOffers': pending_offers,
                'rating': round(avg_rating, 1)
            }
        })
    except Exception as e:
        current_app.logger.error(f"Error getting dashboard stats: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch dashboard statistics'
        }), 500

@dashboard.route('/api/dashboard/notifications', methods=['GET'])
@login_required
def get_notifications():
    """Get user's notifications."""
    try:
        # Get last 30 days of notifications
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        notifications = Notification.query.filter(
            Notification.user_id == current_user.id,
            Notification.created_at >= thirty_days_ago
        ).order_by(Notification.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [{
                'id': n.id,
                'type': n.type,
                'title': n.title,
                'message': n.message,
                'time': n.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'read': n.read
            } for n in notifications]
        })
    except Exception as e:
        current_app.logger.error(f"Error getting notifications: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch notifications'
        }), 500

@dashboard.route('/api/dashboard/notifications/read', methods=['POST'])
@login_required
def mark_notifications_read():
    """Mark notifications as read."""
    try:
        notification_ids = request.json.get('notification_ids', [])
        
        if not notification_ids:  # If no IDs provided, mark all as read
            notifications = Notification.query.filter_by(
                user_id=current_user.id,
                read=False
            ).all()
        else:
            notifications = Notification.query.filter(
                Notification.id.in_(notification_ids),
                Notification.user_id == current_user.id
            ).all()
        
        for notification in notifications:
            notification.read = True
            notification.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notifications marked as read'
        })
    except Exception as e:
        current_app.logger.error(f"Error marking notifications read: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to mark notifications as read'
        }), 500

@dashboard.route('/api/dashboard/recent-activity', methods=['GET'])
@login_required
def get_recent_activity():
    """Get user's recent activity."""
    try:
        # Get recent transactions (both as buyer and seller)
        transactions = Transaction.query.filter(
            (Transaction.buyer_id == current_user.id) | 
            (Transaction.seller_id == current_user.id)
        ).order_by(Transaction.created_at.desc()).limit(5).all()
        
        # Get recent listings
        listings = Listing.query.filter_by(
            user_id=current_user.id
        ).order_by(Listing.created_at.desc()).limit(5).all()
        
        activity = []
        
        # Add transactions to activity
        for t in transactions:
            activity.append({
                'type': 'transaction',
                'action': 'bought' if t.buyer_id == current_user.id else 'sold',
                'item': t.listing.title,
                'amount': float(t.amount),
                'date': t.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'status': t.status
            })
        
        # Add listings to activity
        for l in listings:
            activity.append({
                'type': 'listing',
                'action': 'created',
                'item': l.title,
                'price': float(l.price),
                'date': l.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'status': l.status
            })
        
        # Sort combined activity by date
        activity.sort(key=lambda x: datetime.strptime(x['date'], '%Y-%m-%d %H:%M:%S'), reverse=True)
        
        return jsonify({
            'success': True,
            'data': activity[:10]  # Return top 10 most recent activities
        })
    except Exception as e:
        current_app.logger.error(f"Error getting recent activity: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch recent activity'
        }), 500
