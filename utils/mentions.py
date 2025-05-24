import re
from models.user import User # To query for existing users

MENTION_REGEX = r'@(\w+)' # Simple regex for @username

def parse_mentions(content: str) -> list[str]:
    """
    Parses message content and extracts potential usernames (strings after '@').
    Returns a list of unique potential usernames without the '@' prefix.
    """
    if not content:
        return []
    
    potential_usernames = re.findall(MENTION_REGEX, content)
    return list(set(potential_usernames)) # Return unique names

def get_mentioned_users(potential_usernames: list[str]) -> list[User]:
    """
    Takes a list of potential usernames (without '@') and returns a list of existing User objects.
    """
    if not potential_usernames:
        return []
    
    # Query the database for users whose usernames are in the list
    # Ensure case-insensitivity if usernames are stored that way, or adjust query.
    # For simplicity, assuming usernames are case-sensitive as per current User model.
    mentioned_users = User.query.filter(User.username.in_(potential_usernames)).all()
    return mentioned_users
