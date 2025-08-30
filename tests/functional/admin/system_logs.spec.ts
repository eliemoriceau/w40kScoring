import { test } from '@japa/runner'
import User from '#models/user'
import Role from '#models/role'
import SystemLog from '#models/system_log'

test.group('Admin System Logs', (group) => {
  group.each.setup(async () => {
    await SystemLog.query().delete()
  })

  test('super admin can access logs index', async ({ client, assert }) => {
    const superAdminRole = await Role.create({
      name: `Super Admin ${Date.now()}`,
      permissionLevel: 3,
    })

    const superAdmin = await User.create({
      username: `superadmin_${Date.now()}`,
      email: `superadmin_${Date.now()}@test.com`,
      password: 'password123',
      roleId: superAdminRole.id,
      termsAcceptedAt: new Date(),
    })

    // Create test log
    await SystemLog.create({
      level: 'info',
      category: 'system',
      eventType: 'configuration',
      message: 'Test log message',
      userId: superAdmin.id,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      context: { test: true },
    })

    const response = await client.get('/admin/system/logs').loginAs(superAdmin)

    response.assertStatus(200)
    response.assertInertiaComponent('admin/system/logs/Index')
    assert.properties(response.inertiaProps, ['logs', 'stats', 'filters'])
  })

  test('regular admin cannot access logs', async ({ client }) => {
    const adminRole = await Role.create({
      name: `Admin ${Date.now()}`,
      permissionLevel: 2,
    })

    const admin = await User.create({
      username: `admin_${Date.now()}`,
      email: `admin_${Date.now()}@test.com`,
      password: 'password123',
      roleId: adminRole.id,
      termsAcceptedAt: new Date(),
    })

    const response = await client.get('/admin/system/logs').loginAs(admin)

    response.assertRedirectsTo('/admin')
  })

  test('can filter logs by level', async ({ client, assert }) => {
    const superAdminRole = await Role.create({
      name: `Super Admin ${Date.now()}`,
      permissionLevel: 3,
    })

    const superAdmin = await User.create({
      username: `superadmin_${Date.now()}`,
      email: `superadmin_${Date.now()}@test.com`,
      password: 'password123',
      roleId: superAdminRole.id,
      termsAcceptedAt: new Date(),
    })

    // Create logs with different levels
    await SystemLog.create({
      level: 'error',
      category: 'system',
      eventType: 'error',
      message: 'Error log',
      userId: superAdmin.id,
      ipAddress: '127.0.0.1',
    })

    await SystemLog.create({
      level: 'info',
      category: 'system',
      eventType: 'info',
      message: 'Info log',
      userId: superAdmin.id,
      ipAddress: '127.0.0.1',
    })

    const response = await client
      .get('/admin/system/logs/api/logs')
      .loginAs(superAdmin)
      .qs({ level: 'error' })

    response.assertStatus(200)
    const logs = response.body().data
    assert.lengthOf(logs, 1)
    assert.equal(logs[0].level, 'error')
  })

  test('can export logs to CSV', async ({ client, assert }) => {
    const superAdminRole = await Role.create({
      name: `Super Admin ${Date.now()}`,
      permissionLevel: 3,
    })

    const superAdmin = await User.create({
      username: `superadmin_${Date.now()}`,
      email: `superadmin_${Date.now()}@test.com`,
      password: 'password123',
      roleId: superAdminRole.id,
      termsAcceptedAt: new Date(),
    })

    await SystemLog.create({
      level: 'info',
      category: 'system',
      eventType: 'export_test',
      message: 'Test export log',
      userId: superAdmin.id,
      ipAddress: '127.0.0.1',
    })

    const response = await client.get('/admin/system/logs/export').loginAs(superAdmin)

    response.assertStatus(200)
    response.assertHeader('content-type', 'text/csv; charset=utf-8')
    assert.include(response.text(), 'Test export log')
  })

  test('can clean up old logs', async ({ client, assert }) => {
    const superAdminRole = await Role.create({
      name: `Super Admin ${Date.now()}`,
      permissionLevel: 3,
    })

    const superAdmin = await User.create({
      username: `superadmin_${Date.now()}`,
      email: `superadmin_${Date.now()}@test.com`,
      password: 'password123',
      roleId: superAdminRole.id,
      termsAcceptedAt: new Date(),
    })

    // Create old log (simulate by setting old timestamp)
    const oldLog = await SystemLog.create({
      level: 'info',
      category: 'system',
      eventType: 'old_log',
      message: 'Old log to be cleaned',
      userId: superAdmin.id,
      ipAddress: '127.0.0.1',
    })

    // Manually update timestamp to be older than 30 days
    const thirtyOneDaysAgo = new Date()
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31)
    await oldLog.merge({ createdAt: thirtyOneDaysAgo }).save()

    const response = await client.post('/admin/system/logs/cleanup').loginAs(superAdmin).form({
      days: 30,
    })

    response.assertStatus(200)

    const deletedLog = await SystemLog.find(oldLog.id)
    assert.isNull(deletedLog)
  })

  test('gets log statistics correctly', async ({ client, assert }) => {
    const superAdminRole = await Role.create({
      name: `Super Admin ${Date.now()}`,
      permissionLevel: 3,
    })

    const superAdmin = await User.create({
      username: `superadmin_${Date.now()}`,
      email: `superadmin_${Date.now()}@test.com`,
      password: 'password123',
      roleId: superAdminRole.id,
      termsAcceptedAt: new Date(),
    })

    // Create test logs
    await SystemLog.create({
      level: 'error',
      category: 'system',
      eventType: 'error',
      message: 'Error log 1',
      userId: superAdmin.id,
      ipAddress: '127.0.0.1',
    })

    await SystemLog.create({
      level: 'info',
      category: 'system',
      eventType: 'info',
      message: 'Info log 1',
      userId: superAdmin.id,
      ipAddress: '127.0.0.1',
    })

    const response = await client.get('/admin/system/logs/api/stats').loginAs(superAdmin)

    response.assertStatus(200)
    const stats = response.body()

    assert.properties(stats, ['totalLogs', 'logsByLevel', 'logsByCategory', 'recentActivity'])
    assert.equal(stats.totalLogs, 2)
    assert.equal(stats.logsByLevel.error, 1)
    assert.equal(stats.logsByLevel.info, 1)
  })
})
