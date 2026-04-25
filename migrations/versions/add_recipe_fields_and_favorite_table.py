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
    # Add new columns to recipe table
    op.add_column('recipe', sa.Column('ingredients', sa.JSON(), nullable=True, server_default='[]'))
    op.add_column('recipe', sa.Column('steps', sa.JSON(), nullable=True, server_default='[]'))
    op.add_column('recipe', sa.Column('user_id', sa.Integer(), nullable=True))
    op.add_column('recipe', sa.Column('created_at', sa.DateTime(), nullable=True))
    
    # Create foreign key constraint for user_id
    op.create_foreign_key(
        'fk_recipe_user',
        'recipe',
        'user',
        ['user_id'],
        ['id']
    )
    
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
    
    # Drop foreign key constraint
    op.drop_constraint('fk_recipe_user', 'recipe', type_='foreignkey')
    
    # Drop columns from recipe table
    op.drop_column('recipe', 'created_at')
    op.drop_column('recipe', 'user_id')
    op.drop_column('recipe', 'steps')
    op.drop_column('recipe', 'ingredients')
