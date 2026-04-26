"""add recipe fields and favorite table

Revision ID: add_recipe_fields_and_favorite_table
Revises: add_rating_table
Create Date: 2026-04-25

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_recipe_fields_and_favorite_table'
down_revision = 'add_rating_table'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to recipe table with batch mode for SQLite compatibility
    with op.batch_alter_table('recipe', schema=None) as batch_op:
        batch_op.add_column(sa.Column('ingredients', sa.JSON(), nullable=True, server_default='[]'))
        batch_op.add_column(sa.Column('steps', sa.JSON(), nullable=True, server_default='[]'))
        batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=True))
        batch_op.create_foreign_key('fk_recipe_user', 'user', ['user_id'], ['id'])
    
    # Create favorite table
    op.create_table('favorite',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('recipe_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['recipe_id'], ['recipe.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'recipe_id', name='unique_favorite_per_user_per_recipe')
    )


def downgrade():
    # Drop favorite table
    op.drop_table('favorite')
    
    # Drop foreign key and columns from recipe table with batch mode for SQLite compatibility
    with op.batch_alter_table('recipe', schema=None) as batch_op:
        batch_op.drop_constraint('fk_recipe_user', type_='foreignkey')
        batch_op.drop_column('created_at')
        batch_op.drop_column('user_id')
        batch_op.drop_column('steps')
        batch_op.drop_column('ingredients')
