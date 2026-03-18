"""add ON DELETE CASCADE for reel media FKs and unique constraint

Revision ID: 20260318_0002
Revises: 20260317_0001
Create Date: 2026-03-18 00:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = "20260318_0002"
down_revision = "20260317_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop existing foreign key constraints (names follow Postgres default pattern)
    op.execute("ALTER TABLE reel_interactions DROP CONSTRAINT IF EXISTS reel_interactions_media_id_fkey")
    op.execute("ALTER TABLE reel_views DROP CONSTRAINT IF EXISTS reel_views_media_id_fkey")

    # Recreate FKs with ON DELETE CASCADE
    op.create_foreign_key(
        "reel_interactions_media_id_fkey",
        "reel_interactions",
        "post_media",
        ["media_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.create_foreign_key(
        "reel_views_media_id_fkey",
        "reel_views",
        "post_media",
        ["media_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Add unique constraint to prevent duplicate interactions per user/media/type
    op.create_unique_constraint(
        "uix_user_media_interaction",
        "reel_interactions",
        ["user_id", "media_id", "interaction_type"],
    )


def downgrade() -> None:
    # Remove the unique constraint
    op.drop_constraint("uix_user_media_interaction", "reel_interactions", type_="unique")

    # Drop the cascade FKs
    op.drop_constraint("reel_interactions_media_id_fkey", "reel_interactions", type_="foreignkey")
    op.drop_constraint("reel_views_media_id_fkey", "reel_views", type_="foreignkey")

    # Recreate original FKs without cascade
    op.create_foreign_key(
        "reel_interactions_media_id_fkey",
        "reel_interactions",
        "post_media",
        ["media_id"],
        ["id"],
    )

    op.create_foreign_key(
        "reel_views_media_id_fkey",
        "reel_views",
        "post_media",
        ["media_id"],
        ["id"],
    )
