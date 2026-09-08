"""Initial database schema migration for SEQA Provision.

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-09-08 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_id', 'users', ['id'], unique=False)
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 2. Developers table
    op.create_table(
        'developers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('github_username', sa.String(length=100), nullable=True),
        sa.Column('team', sa.String(length=100), nullable=False),
        sa.Column('role_title', sa.String(length=100), nullable=False),
        sa.Column('seniority', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_developers_id', 'developers', ['id'], unique=False)
    op.create_index('ix_developers_email', 'developers', ['email'], unique=True)
    op.create_index('ix_developers_team', 'developers', ['team'], unique=False)
    op.create_index('ix_developers_status', 'developers', ['status'], unique=False)

    # 3. Checklist template items table
    op.create_table(
        'checklist_template_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('team', sa.String(length=100), nullable=True),
        sa.Column('is_required', sa.Boolean(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_checklist_template_items_id', 'checklist_template_items', ['id'], unique=False)

    # 4. Developer checklist statuses table
    op.create_table(
        'developer_checklist_statuses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('developer_id', sa.Integer(), nullable=False),
        sa.Column('template_item_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('is_completed', sa.Boolean(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['developer_id'], ['developers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['template_item_id'], ['checklist_template_items.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_developer_checklist_statuses_id', 'developer_checklist_statuses', ['id'], unique=False)
    op.create_index('ix_developer_checklist_statuses_developer_id', 'developer_checklist_statuses', ['developer_id'], unique=False)

    # 5. Access systems table
    op.create_table(
        'access_systems',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon_key', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_access_systems_id', 'access_systems', ['id'], unique=False)
    op.create_index('ix_access_systems_name', 'access_systems', ['name'], unique=True)

    # 6. Access grants table
    op.create_table(
        'access_grants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('developer_id', sa.Integer(), nullable=False),
        sa.Column('system_id', sa.Integer(), nullable=False),
        sa.Column('granted_by_user_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('access_level', sa.String(length=50), nullable=False),
        sa.Column('granted_at', sa.DateTime(), nullable=True),
        sa.Column('revoked_at', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['developer_id'], ['developers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['granted_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['system_id'], ['access_systems.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_access_grants_id', 'access_grants', ['id'], unique=False)
    op.create_index('ix_access_grants_developer_id', 'access_grants', ['developer_id'], unique=False)
    op.create_index('ix_access_grants_system_id', 'access_grants', ['system_id'], unique=False)

    # 7. Repo requests table
    op.create_table(
        'repo_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('visibility', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('github_url', sa.String(length=255), nullable=True),
        sa.Column('branch_protection_enabled', sa.Boolean(), nullable=False),
        sa.Column('template_repo', sa.String(length=100), nullable=True),
        sa.Column('developer_id', sa.Integer(), nullable=False),
        sa.Column('requested_by_user_id', sa.Integer(), nullable=True),
        sa.Column('provisioned_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['developer_id'], ['developers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requested_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_repo_requests_id', 'repo_requests', ['id'], unique=False)
    op.create_index('ix_repo_requests_name', 'repo_requests', ['name'], unique=False)
    op.create_index('ix_repo_requests_developer_id', 'repo_requests', ['developer_id'], unique=False)

    # 8. Audit logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('actor_id', sa.Integer(), nullable=True),
        sa.Column('actor_email', sa.String(length=255), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('target_type', sa.String(length=100), nullable=False),
        sa.Column('target_id', sa.String(length=100), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_audit_logs_id', 'audit_logs', ['id'], unique=False)
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'], unique=False)
    op.create_index('ix_audit_logs_target_type', 'audit_logs', ['target_type'], unique=False)
    op.create_index('ix_audit_logs_timestamp', 'audit_logs', ['timestamp'], unique=False)


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('repo_requests')
    op.drop_table('access_grants')
    op.drop_table('access_systems')
    op.drop_table('developer_checklist_statuses')
    op.drop_table('checklist_template_items')
    op.drop_table('developers')
    op.drop_table('users')
