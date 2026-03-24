import sys
import os
import requests
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))
import database
from models import Interaction, User, Post

db = database.SessionLocal()
user = db.query(User).first()
post = db.query(Post).first()

if user and post:
    print(f"Testing with user={user.id} and post={post.id}")
    import auth
    token = auth.create_access_token({"sub": str(user.id)})
    
    # 1. Check DB Interaction
    interaction = db.query(Interaction).filter(Interaction.user_id==user.id, Interaction.post_id==post.id).first()
    if not interaction:
        print("No interaction found, creating one...")
        interaction = Interaction(user_id=user.id, post_id=post.id, interaction_type="wow")
        db.add(interaction)
        db.commit()
    else:
        print(f"Existing interaction: {interaction.interaction_type}")

    # 2. Call API
    response = requests.get(f"http://127.0.0.1:8000/api/posts/{post.id}", headers={"Authorization": f"Bearer {token}"})
    if response.status_code == 200:
        data = response.json()
        print(f"API returned user_reaction: {data.get('user_reaction')}")
        print(f"API returned top_reactions: {data.get('top_reactions')}")
    else:
        print(f"API Error {response.status_code}: {response.text}")
else:
    print("No user or post found in DB")
