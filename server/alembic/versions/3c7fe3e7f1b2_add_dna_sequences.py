"""add dna sequences

Revision ID: 3c7fe3e7f1b2
Revises: ceb6f7e870e2
Create Date: 2026-03-31 00:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "3c7fe3e7f1b2"
down_revision: Union[str, Sequence[str], None] = "ceb6f7e870e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "dna_sequences",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=True),
        sa.Column("sequence", sa.Text(), nullable=False),
        sa.Column("source", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_dna_sequences_id"), "dna_sequences", ["id"], unique=False)
    op.create_index(
        op.f("ix_dna_sequences_user_id"),
        "dna_sequences",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_dna_sequences_user_id"), table_name="dna_sequences")
    op.drop_index(op.f("ix_dna_sequences_id"), table_name="dna_sequences")
    op.drop_table("dna_sequences")
