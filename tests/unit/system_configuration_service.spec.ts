import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import User from '#models/user'
import Role from '#models/role'
import SystemSetting from '#models/system_setting'
import ConfigurationHistory from '#models/configuration_history'
import SystemConfigurationService from '#application/services/system_configuration_service'

test.group('SystemConfigurationService', (group) => {
  let service: SystemConfigurationService
  let superAdmin: any

  group.setup(async () => {
    service = new SystemConfigurationService()

    const superAdminRole = await Role.create({
      name: `Super Admin Unit ${Date.now()}`,
      permissionLevel: 3,
    })

    superAdmin = await User.create({
      username: `superadmin_unit_${Date.now()}`,
      email: `superadmin_unit_${Date.now()}@test.com`,
      password: 'password123',
      roleId: superAdminRole.id,
      termsAcceptedAt: DateTime.now(),
    })
  })

  group.each.setup(async () => {
    await SystemSetting.query().delete()
    await ConfigurationHistory.query().delete()
  })

  test('can get configuration by key', async ({ assert }) => {
    await SystemSetting.create({
      key: 'test.get_setting',
      value: 'test_value',
      category: 'general',
      description: 'Test get setting',
      isCritical: false,
      requiresRestart: false,
      createdBy: superAdmin.id,
      updatedBy: superAdmin.id,
    })

    const config = await service.getConfiguration('test.get_setting')

    assert.isNotNull(config)
    assert.equal(config!.key, 'test.get_setting')
    assert.equal(config!.value, 'test_value')
  })

  test('can set new configuration', async ({ assert }) => {
    const config = await service.setConfiguration('test.new_config', 'new_value', superAdmin.id, {
      category: 'general',
      description: 'New test configuration',
      isCritical: false,
      requiresRestart: false,
      changeReason: 'Unit test creation',
    })

    assert.equal(config.key, 'test.new_config')
    assert.equal(config.value, 'new_value')
    assert.equal(config.createdBy, superAdmin.id)

    // Check that history was created
    const history = await ConfigurationHistory.query()
      .where('settingKey', 'test.new_config')
      .where('action', 'CREATE')
      .first()

    assert.isNotNull(history)
    assert.equal(history!.changeReason, 'Unit test creation')
  })

  test('can update existing configuration', async ({ assert }) => {
    const initialConfig = await SystemSetting.create({
      key: 'test.update_config',
      value: 'initial_value',
      category: 'general',
      description: 'Test update configuration',
      isCritical: false,
      requiresRestart: false,
      createdBy: superAdmin.id,
      updatedBy: superAdmin.id,
    })

    const updatedConfig = await service.setConfiguration(
      'test.update_config',
      'updated_value',
      superAdmin.id,
      {
        changeReason: 'Unit test update',
      }
    )

    assert.equal(updatedConfig.value, 'updated_value')
    assert.equal(updatedConfig.updatedBy, superAdmin.id)

    // Check that history was created
    const history = await ConfigurationHistory.query()
      .where('settingKey', 'test.update_config')
      .where('action', 'UPDATE')
      .first()

    assert.isNotNull(history)
    assert.equal(history!.oldValue, 'initial_value')
    assert.equal(history!.newValue, 'updated_value')
  })

  test('can delete configuration', async ({ assert }) => {
    const config = await SystemSetting.create({
      key: 'test.delete_config',
      value: 'delete_value',
      category: 'general',
      description: 'Test delete configuration',
      isCritical: false,
      requiresRestart: false,
      createdBy: superAdmin.id,
      updatedBy: superAdmin.id,
    })

    await service.deleteConfiguration('test.delete_config', superAdmin.id, {
      changeReason: 'Unit test deletion',
    })

    const deletedConfig = await SystemSetting.findBy('key', 'test.delete_config')
    assert.isNull(deletedConfig)

    // Check that history was created
    const history = await ConfigurationHistory.query()
      .where('settingKey', 'test.delete_config')
      .where('action', 'DELETE')
      .first()

    assert.isNotNull(history)
    assert.equal(history!.changeReason, 'Unit test deletion')
  })

  test('can get configuration history', async ({ assert }) => {
    // Create configuration using service to log CREATE action
    await service.setConfiguration('test.history_config', 'initial_value', superAdmin.id, {
      category: 'general',
      description: 'Test history configuration',
      changeReason: 'Initial creation',
    })

    // Update the configuration to create UPDATE history
    await service.setConfiguration('test.history_config', 'updated_value', superAdmin.id, {
      changeReason: 'Test update',
    })

    const history = await service.getConfigurationHistory('test.history_config')

    assert.lengthOf(history, 2) // created + updated
    assert.equal(history[0].action, 'UPDATE')
    assert.equal(history[1].action, 'CREATE')
  })

  test('can rollback configuration', async ({ assert }) => {
    // Create configuration using service to enable proper rollback
    const config = await service.setConfiguration('test.rollback_config', 'initial_value', superAdmin.id, {
      category: 'general',
      description: 'Test rollback configuration',
      changeReason: 'Initial creation',
    })

    // Update the configuration
    await service.setConfiguration('test.rollback_config', 'updated_value', superAdmin.id, {
      changeReason: 'Test update for rollback',
    })

    // Get the update history entry
    const updateHistory = await ConfigurationHistory.query()
      .where('settingKey', 'test.rollback_config')
      .where('action', 'UPDATE')
      .first()

    assert.isNotNull(updateHistory)

    // Rollback the configuration
    await service.rollbackConfiguration(updateHistory!.id, superAdmin.id, {
      rollbackReason: 'Unit test rollback',
    })

    await config.refresh()
    assert.equal(config.value, 'initial_value')

    // Check rollback history was created
    const rollbackHistory = await ConfigurationHistory.query()
      .where('settingKey', 'test.rollback_config')
      .where('action', 'ROLLBACK')
      .first()

    assert.isNotNull(rollbackHistory)
    assert.equal(rollbackHistory!.rollbackFromHistoryId, updateHistory!.id)
  })

  test('handles JSON values correctly', async ({ assert }) => {
    const jsonValue = { feature: 'enabled', options: ['a', 'b', 'c'] }

    const config = await service.setConfiguration('test.json_config', jsonValue, superAdmin.id, {
      category: 'general',
      description: 'Test JSON configuration',
      changeReason: 'Test JSON handling',
    })

    assert.deepEqual(config.value, jsonValue)

    // Retrieve and verify JSON handling
    const retrieved = await service.getConfiguration('test.json_config')
    assert.deepEqual(retrieved!.value, jsonValue)
  })
})
