// Circle Permissions Service - Role-based Access Control
import type { CircleRole, CirclePermissions } from '@/types/phase8';

export class CirclePermissionsService {
  /**
   * Get permissions for a circle role
   */
  static getPermissions(role: CircleRole): CirclePermissions {
    switch (role) {
      case 'owner':
        return {
          canEdit: true,
          canComplete: true,
          canAssign: true,
          canInvite: true,
          canDelete: true,
          canViewSensitive: true,
        };
      case 'editor':
        return {
          canEdit: true,
          canComplete: true,
          canAssign: false,
          canInvite: false,
          canDelete: false,
          canViewSensitive: true,
        };
      case 'viewer':
        return {
          canEdit: false,
          canComplete: false,
          canAssign: false,
          canInvite: false,
          canDelete: false,
          canViewSensitive: false,
        };
      default:
        return {
          canEdit: false,
          canComplete: false,
          canAssign: false,
          canInvite: false,
          canDelete: false,
          canViewSensitive: false,
        };
    }
  }

  /**
   * Check if user can perform action
   */
  static canPerformAction(
    role: CircleRole,
    action: keyof CirclePermissions
  ): boolean {
    const permissions = this.getPermissions(role);
    return permissions[action];
  }

  /**
   * Get role display name
   */
  static getRoleDisplayName(role: CircleRole): string {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'editor':
        return 'Editor';
      case 'viewer':
        return 'Viewer';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get role description
   */
  static getRoleDescription(role: CircleRole): string {
    switch (role) {
      case 'owner':
        return 'Full control over circle and all tasks';
      case 'editor':
        return 'Can add, edit, and complete tasks';
      case 'viewer':
        return 'Read-only access to tasks';
      default:
        return '';
    }
  }

  /**
   * Get available roles for assignment (owner can assign any role, editors cannot)
   */
  static getAssignableRoles(currentUserRole: CircleRole): CircleRole[] {
    if (currentUserRole === 'owner') {
      return ['owner', 'editor', 'viewer'];
    }
    return [];
  }
}
