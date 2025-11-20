import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  getUserRoles,
  hasRole,
  canAccessBilling,
  canCreateInvoices,
  canProcessPayments,
} from '@/lib/permissions';
import Cookies from 'js-cookie';

// Mock js-cookie
jest.mock('js-cookie');
const mockedCookies = Cookies as jest.Mocked<typeof Cookies>;

describe('Permission Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasPermission', () => {
    it('should return true when user has the permission', () => {
      const permissions = [
        { resource: 'billing', action: 'read' },
        { resource: 'billing', action: 'write' }
      ];
      mockedCookies.get.mockReturnValue(JSON.stringify(permissions));

      expect(hasPermission('billing', 'read')).toBe(true);
      expect(hasPermission('billing', 'write')).toBe(true);
    });

    it('should return false when user does not have the permission', () => {
      const permissions = [
        { resource: 'billing', action: 'read' }
      ];
      mockedCookies.get.mockReturnValue(JSON.stringify(permissions));

      expect(hasPermission('billing', 'admin')).toBe(false);
    });

    it('should return false when permissions cookie is missing', () => {
      mockedCookies.get.mockReturnValue(undefined);

      expect(hasPermission('billing', 'read')).toBe(false);
    });

    it('should return false when permissions cookie is invalid JSON', () => {
      mockedCookies.get.mockReturnValue('invalid-json');

      expect(hasPermission('billing', 'read')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one permission', () => {
      const permissions = [
        { resource: 'billing', action: 'read' }
      ];
      mockedCookies.get.mockReturnValue(JSON.stringify(permissions));

      expect(hasAnyPermission([
        ['billing', 'read'],
        ['billing', 'write']
      ])).toBe(true);
    });

    it('should return false when user has none of the permissions', () => {
      const permissions = [
        { resource: 'billing', action: 'read' }
      ];
      mockedCookies.get.mockReturnValue(JSON.stringify(permissions));

      expect(hasAnyPermission([
        ['billing', 'write'],
        ['billing', 'admin']
      ])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', () => {
      const permissions = [
        { resource: 'billing', action: 'read' },
        { resource: 'billing', action: 'write' }
      ];
      mockedCookies.get.mockReturnValue(JSON.stringify(permissions));

      expect(hasAllPermissions([
        ['billing', 'read'],
        ['billing', 'write']
      ])).toBe(true);
    });

    it('should return false when user is missing any permission', () => {
      const permissions = [
        { resource: 'billing', action: 'read' }
      ];
      mockedCookies.get.mockReturnValue(JSON.stringify(permissions));

      expect(hasAllPermissions([
        ['billing', 'read'],
        ['billing', 'write']
      ])).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', () => {
      const permissions = [
        { resource: 'billing', action: 'read' },
        { resource: 'billing', action: 'write' }
      ];
      mockedCookies.get.mockReturnValue(JSON.stringify(permissions));

      expect(getUserPermissions()).toEqual(permissions);
    });

    it('should return empty array when no permissions', () => {
      mockedCookies.get.mockReturnValue(undefined);

      expect(getUserPermissions()).toEqual([]);
    });
  });

  describe('getUserRoles', () => {
    it('should return user roles', () => {
      const roles = [
        { id: 1, name: 'Admin', description: 'Administrator' }
      ];
      mockedCookies.get.mockReturnValue(JSON.stringify(roles));

      expect(getUserRoles()).toEqual(roles);
    });

    it('should return empty array when no roles', () => {
      mockedCookies.get.mockReturnValue(undefined);

      expect(getUserRoles()).toEqual([]);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the role', () => {
      const roles = [
        { id: 1, name: 'Admin', description: 'Administrator' },
        { id: 2, name: 'Doctor', description: 'Medical Doctor' }
      ];
      mockedCookies.get.mockReturnValue(JSON.stringify(roles));

      expect(hasRole('Admin')).toBe(true);
      expect(hasRole('Doctor')).toBe(true);
    });

    it('should return false when user does not have the role', () => {
      const roles = [
        { id: 1, name: 'Admin', description: 'Administrator' }
      ];
      mockedCookies.get.mockReturnValue(JSON.stringify(roles));

      expect(hasRole('Doctor')).toBe(false);
    });
  });

  describe('Billing-specific helpers', () => {
    it('canAccessBilling should check billing:read permission', () => {
      const permissions = [
        { resource: 'billing', action: 'read' }
      ];
      mockedCookies.get.mockReturnValue(JSON.stringify(permissions));

      expect(canAccessBilling()).toBe(true);
    });

    it('canCreateInvoices should check billing:write permission', () => {
      const permissions = [
        { resource: 'billing', action: 'write' }
      ];
      mockedCookies.get.mockReturnValue(JSON.stringify(permissions));

      expect(canCreateInvoices()).toBe(true);
    });

    it('canProcessPayments should check billing:admin permission', () => {
      const permissions = [
        { resource: 'billing', action: 'admin' }
      ];
      mockedCookies.get.mockReturnValue(JSON.stringify(permissions));

      expect(canProcessPayments()).toBe(true);
    });

    it('should return false when permissions are missing', () => {
      mockedCookies.get.mockReturnValue(undefined);

      expect(canAccessBilling()).toBe(false);
      expect(canCreateInvoices()).toBe(false);
      expect(canProcessPayments()).toBe(false);
    });
  });
});
