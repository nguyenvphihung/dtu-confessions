from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, UniqueConstraint, func, Float, Index
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(20), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=True)
    email = Column(String(100), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False)
    is_banned = Column(Boolean, default=False, nullable=False)
    avatar_url = Column(String(500), nullable=True)
    cover_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    posts = relationship("Post", back_populates="author")
    comments = relationship("Comment", back_populates="user")
    interactions = relationship("Interaction", back_populates="user")
    comment_interactions = relationship("CommentInteraction", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=False)
    is_private = Column(Boolean, default=False)
    shared_post_id = Column(Integer, ForeignKey("posts.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(20), default="pending", nullable=False, index=True)
    confession_number = Column(Integer, unique=True, nullable=True)
    rejected_reason = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    author = relationship("User", back_populates="posts")
    shared_post = relationship("Post", remote_side=[id], backref="shares")
    comments = relationship("Comment", back_populates="post", order_by="Comment.created_at", cascade="all, delete-orphan")
    media = relationship("PostMedia", back_populates="post", cascade="all, delete-orphan")
    interactions = relationship("Interaction", back_populates="post", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_posts_status_created_at", "status", created_at.desc()),
    )


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")
    parent = relationship("Comment", remote_side="Comment.id", backref="replies")
    comment_interactions = relationship("CommentInteraction", back_populates="comment")
    


class PostMedia(Base):
    __tablename__ = "post_media"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False, index=True)
    file_url = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    media_type = Column(String(20), nullable=False)
    mime_type = Column(String(100), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    post = relationship("Post", back_populates="media")
    reel_views = relationship("ReelView", back_populates="media", cascade="all, delete-orphan")
    reel_interactions = relationship("ReelInteraction", back_populates="media", cascade="all, delete-orphan")


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False, index=True)
    interaction_type = Column(String(50), default="like")
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "post_id", "interaction_type", name="uq_user_post_interaction"),
    )

    user = relationship("User", back_populates="interactions")
    post = relationship("Post", back_populates="interactions")


class CommentInteraction(Base):
    __tablename__ = "comment_interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=False, index=True)
    interaction_type = Column(String(50), default="like")
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "comment_id", "interaction_type", name="uq_user_comment_interaction"),
    )

    user = relationship("User", back_populates="comment_interactions")
    comment = relationship("Comment", back_populates="comment_interactions")


class ReelView(Base):
    __tablename__ = "reel_views"

    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(Integer, ForeignKey("post_media.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    watch_time = Column(Float, default=0)
    created_at = Column(DateTime, server_default=func.now())
    media = relationship("PostMedia", back_populates="reel_views")


class ReelInteraction(Base):
    __tablename__ = "reel_interactions"

    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(Integer, ForeignKey("post_media.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    interaction_type = Column(String(30), nullable=False, index=True)
    watch_time = Column(Float, default=0)
    created_at = Column(DateTime, server_default=func.now())
    media = relationship("PostMedia", back_populates="reel_interactions")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    target_type = Column(String(20), nullable=False)  # "post" | "comment"
    target_id = Column(Integer, nullable=False)
    reason = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="pending", nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    resolved_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("reporter_id", "target_type", "target_id", name="uq_user_report_target"),
    )

    reporter = relationship("User", foreign_keys=[reporter_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(30), nullable=False)
    message = Column(String(500), nullable=False)
    ref_type = Column(String(20), nullable=True)
    ref_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="notifications")


class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), nullable=False, index=True)
    otp_code = Column(String(6), nullable=False)
    purpose = Column(String(50), nullable=False)  # forgot_password, change_email, change_password
    expires_at = Column(DateTime, nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

