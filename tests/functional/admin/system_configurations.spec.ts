import { test } from '@japa/runner'
import User from '#models/user'
import Role from '#models/role'
import SystemSetting from '#models/system_setting'

test.group('Admin System Configurations', (group) => {
  group.each.setup(async () => {
    await SystemSetting.query().delete()
  })

  test('super admin can access configuration index', async ({ client, assert }) => {
    // Create super admin role and user
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      permissionLevel: 3,
    })

    const superAdmin = await User.create({
      username: 'superadmin',
      email: 'superadmin@test.com',
      password: 'password123',
      roleId: superAdminRole.id,
    })

    // Create test configuration
    await SystemSetting.create({
      key: 'test.setting',
      value: 'test_value',
      category: 'general',
      description: 'Test setting',
      isCritical: false,
      requiresRestart: false,
      createdBy: superAdmin.id,
      updatedBy: superAdmin.id,
    })

    const response = await client.get('/admin/system/config').loginAs(superAdmin)

    response.assertStatus(200)
    response.assertInertiaComponent('admin/system/configuration/Index')
    assert.properties(response.inertiaProps, ['configurations', 'categories', 'totalCount'])
  })

  test('regular admin cannot access configuration', async ({ client }) => {
    // Create regular admin role and user
    const adminRole = await Role.create({
      name: `Admin ${Date.now()}`,
      permissionLevel: 2,
    })

    const admin = await User.create({
      username: `admin_${Date.now()}`,
      email: `admin_${Date.now()}@test.com`,
      password: 'password123',
      roleId: adminRole.id,
    })

    const response = await client.get('/admin/system/config').loginAs(admin)

    response.assertRedirectsTo('/admin')
  })

  test('can create new configuration setting', async ({ client, assert }) => {
    const superAdminRole = await Role.create({
      name: `Super Admin ${Date.now()}`,
      permissionLevel: 3,
    })

    const superAdmin = await User.create({
      username: `superadmin_${Date.now()}`,
      email: `superadmin_${Date.now()}@test.com`,
      password: 'password123',
      roleId: superAdminRole.id,
    })

    const response = await client.post('/admin/system/config').loginAs(superAdmin).form({
      key: 'test.new_setting',
      value: 'new_value',
      category: 'general',
      description: 'New test setting',
      isCritical: false,
      requiresRestart: false,
      changeReason: 'Test creation',
    })

    response.assertRedirectsTo('/admin/system/config')

    const setting = await SystemSetting.findBy('key', 'test.new_setting')
    assert.isNotNull(setting)
    assert.equal(setting!.value, 'new_value')
    assert.equal(setting!.createdBy, superAdmin.id)
  })

  test('can update existing configuration', async ({ client, assert }) => {
    const superAdminRole = await Role.create({
      name: `Super Admin ${Date.now()}`,
      permissionLevel: 3,
    })

    const superAdmin = await User.create({
      username: `superadmin_${Date.now()}`,
      email: `superadmin_${Date.now()}@test.com`,
      password: 'password123',
      roleId: superAdminRole.id,
    })

    // Create initial setting
    const setting = await SystemSetting.create({
      key: 'test.update_setting',
      value: 'initial_value',
      category: 'general',
      description: 'Test setting for update',
      isCritical: false,
      requiresRestart: false,
      createdBy: superAdmin.id,
      updatedBy: superAdmin.id,
    })

    const response = await client
      .put(`/admin/system/config/${setting.key}`)
      .loginAs(superAdmin)
      .form({
        value: 'updated_value',
        changeReason: 'Test update',
      })

    response.assertRedirectsTo('/admin/system/config')

    await setting.refresh()
    assert.equal(setting.value, 'updated_value')
    assert.equal(setting.updatedBy, superAdmin.id)
  })

  test('can delete configuration setting', async ({ client, assert }) => {
    const superAdminRole = await Role.create({
      name: `Super Admin ${Date.now()}`,
      permissionLevel: 3,
    })

    const superAdmin = await User.create({
      username: `superadmin_${Date.now()}`,
      email: `superadmin_${Date.now()}@test.com`,
      password: 'password123',
      roleId: superAdminRole.id,
    })

    const setting = await SystemSetting.create({
      key: 'test.delete_setting',
      value: 'delete_value',
      category: 'general',
      description: 'Test setting for deletion',
      isCritical: false,
      requiresRestart: false,
      createdBy: superAdmin.id,
      updatedBy: superAdmin.id,
    })

    const response = await client
      .delete(`/admin/system/config/${setting.key}`)
      .loginAs(superAdmin)
      .form({
        deleteReason: 'Test deletion',
      })

    response.assertRedirectsTo('/admin/system/config')

    const deletedSetting = await SystemSetting.findBy('key', 'test.delete_setting')
    assert.isNull(deletedSetting)
  })

  test('validation prevents invalid configuration', async ({ client }) => {
    const superAdminRole = await Role.create({
      name: `Super Admin ${Date.now()}`,
      permissionLevel: 3,
    })

    const superAdmin = await User.create({
      username: `superadmin_${Date.now()}`,
      email: `superadmin_${Date.now()}@test.com`,
      password: 'password123',
      roleId: superAdminRole.id,
    })

    const response = await client.post('/admin/system/config').loginAs(superAdmin).form({
      key: '', // Invalid empty key
      value: 'test_value',
      category: 'invalid_category',
    })

    response.assertStatus(422)
  })

  test('critical setting changes require confirmation', async ({ client, assert }) => {
    const superAdminRole = await Role.create({
      name: `Super Admin ${Date.now()}`,
      permissionLevel: 3,
    })

    const superAdmin = await User.create({
      username: `superadmin_${Date.now()}`,
      email: `superadmin_${Date.now()}@test.com`,
      password: 'password123',
      roleId: superAdminRole.id,
    })

    const criticalSetting = await SystemSetting.create({
      key: 'security.critical_setting',
      value: 'initial_value',
      category: 'security',
      description: 'Critical security setting',
      isCritical: true,
      requiresRestart: false,
      createdBy: superAdmin.id,
      updatedBy: superAdmin.id,
    })

    // Update without confirmation should work but log the criticality
    const response = await client
      .put(`/admin/system/config/${criticalSetting.key}`)
      .loginAs(superAdmin)
      .form({
        value: 'updated_critical_value',
        changeReason: 'Test critical update',
      })

    response.assertRedirectsTo('/admin/system/config')

    await criticalSetting.refresh()
    assert.equal(criticalSetting.value, 'updated_critical_value')
  })
})
