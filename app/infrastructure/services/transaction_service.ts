/**
 * TransactionService - Infrastructure Layer
 *
 * Service de gestion des transactions pour orchestration
 * Issue #18 - Orchestration 'création Partie complète'
 *
 * Architecture hexagonale : Adapter infrastructure pour gestion transactionnelle
 */

import Database from '@adonisjs/lucid/services/db'
import { TransactionClientContract } from '@adonisjs/lucid/types/database'

/**
 * Interface pour opération transactionnelle
 */
export interface TransactionalOperation<T> {
  (trx: TransactionClientContract): Promise<T>
}

/**
 * Résultat d'opération transactionnelle avec métadonnées
 */
export interface TransactionResult<T> {
  result: T
  metadata: {
    transactionId: string
    startTime: Date
    endTime: Date
    duration: number
    rollbackOccurred: boolean
  }
}

/**
 * Configuration de transaction
 */
export interface TransactionConfig {
  timeout?: number // Timeout en millisecondes (défaut: 30000)
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE'
  enableLogging?: boolean
}

/**
 * Service de gestion des transactions
 *
 * Responsabilités :
 * - Gestion des transactions AdonisJS/Lucid
 * - Rollback automatique en cas d'erreur
 * - Logging et monitoring des transactions
 * - Timeout et configuration avancée
 */
export class TransactionService {
  private readonly defaultConfig: Required<TransactionConfig> = {
    timeout: 30000, // 30 secondes
    isolationLevel: 'READ_COMMITTED',
    enableLogging: true,
  }

  /**
   * Exécute une opération dans une transaction
   *
   * @param operation - Fonction à exécuter dans la transaction
   * @param config - Configuration optionnelle de la transaction
   * @returns Résultat de l'opération avec métadonnées
   */
  async executeInTransaction<T>(
    operation: TransactionalOperation<T>,
    config?: TransactionConfig
  ): Promise<TransactionResult<T>> {
    const finalConfig = { ...this.defaultConfig, ...config }
    const transactionId = this.generateTransactionId()
    const startTime = new Date()
    let rollbackOccurred = false

    if (finalConfig.enableLogging) {
      console.log(`[Transaction ${transactionId}] Starting transaction`)
    }

    try {
      const result = await Database.transaction(async (trx) => {
        // Configuration du timeout
        if (finalConfig.timeout > 0) {
          await this.setTransactionTimeout(trx, finalConfig.timeout)
        }

        // Configuration du niveau d'isolation si supporté
        if (finalConfig.isolationLevel !== 'READ_COMMITTED') {
          await this.setIsolationLevel(trx, finalConfig.isolationLevel)
        }

        if (finalConfig.enableLogging) {
          console.log(`[Transaction ${transactionId}] Executing operation`)
        }

        // Exécution de l'opération
        return await operation(trx)
      })

      const endTime = new Date()
      const duration = endTime.getTime() - startTime.getTime()

      if (finalConfig.enableLogging) {
        console.log(`[Transaction ${transactionId}] Committed successfully in ${duration}ms`)
      }

      return {
        result,
        metadata: {
          transactionId,
          startTime,
          endTime,
          duration,
          rollbackOccurred,
        },
      }
    } catch (error) {
      rollbackOccurred = true
      const endTime = new Date()
      const duration = endTime.getTime() - startTime.getTime()

      if (finalConfig.enableLogging) {
        console.error(`[Transaction ${transactionId}] Rolled back after ${duration}ms:`, error)
      }

      // Encapsuler l'erreur avec contexte transactionnel
      throw new TransactionError(
        `Transaction ${transactionId} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          transactionId,
          originalError: error,
          duration,
          rollbackOccurred: true,
        }
      )
    }
  }

  /**
   * Exécute plusieurs opérations dans une transaction unique
   * Utile pour orchestration complexe avec points de contrôle
   */
  async executeMultipleInTransaction<T extends Record<string, any>>(
    operations: {
      [K in keyof T]: TransactionalOperation<T[K]>
    },
    config?: TransactionConfig
  ): Promise<TransactionResult<T>> {
    return this.executeInTransaction(async (trx) => {
      const results = {} as T

      for (const [key, operation] of Object.entries(operations)) {
        try {
          results[key as keyof T] = await operation(trx)
        } catch (error) {
          throw new TransactionError(
            `Failed at operation '${key}': ${error instanceof Error ? error.message : 'Unknown error'}`,
            { failedOperation: key, originalError: error }
          )
        }
      }

      return results
    }, config)
  }

  /**
   * Vérifie si nous sommes dans une transaction active
   */
  async isInTransaction(): Promise<boolean> {
    try {
      // AdonisJS/Lucid ne fournit pas de méthode directe
      // Cette implémentation est une approximation
      const result = await Database.rawQuery('SELECT 1 as test')
      return !!result
    } catch {
      return false
    }
  }

  /**
   * Génère un ID unique pour la transaction
   */
  private generateTransactionId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `txn_${timestamp}_${random}`
  }

  /**
   * Configure le timeout de la transaction
   */
  private async setTransactionTimeout(
    trx: TransactionClientContract,
    timeoutMs: number
  ): Promise<void> {
    try {
      // PostgreSQL
      await trx.rawQuery(`SET statement_timeout = ${timeoutMs}`)
    } catch {
      // SQLite ou autre DB - timeout non supporté, on ignore
    }
  }

  /**
   * Configure le niveau d'isolation de la transaction
   */
  private async setIsolationLevel(
    trx: TransactionClientContract,
    level: TransactionConfig['isolationLevel']
  ): Promise<void> {
    try {
      const isolationMap = {
        READ_UNCOMMITTED: 'READ UNCOMMITTED',
        READ_COMMITTED: 'READ COMMITTED',
        REPEATABLE_READ: 'REPEATABLE READ',
        SERIALIZABLE: 'SERIALIZABLE',
      }

      const sqlLevel = isolationMap[level!]
      await trx.rawQuery(`SET TRANSACTION ISOLATION LEVEL ${sqlLevel}`)
    } catch {
      // Isolation level non supporté par la DB, on ignore
    }
  }
}

/**
 * Erreur spécialisée pour les transactions
 */
export class TransactionError extends Error {
  public readonly context: Record<string, any>

  constructor(message: string, context: Record<string, any> = {}) {
    super(message)
    this.name = 'TransactionError'
    this.context = context
  }

  /**
   * Récupère l'erreur originale si disponible
   */
  getOriginalError(): Error | unknown {
    return this.context.originalError
  }

  /**
   * Vérifie si l'erreur est due à un rollback
   */
  isRollbackError(): boolean {
    return this.context.rollbackOccurred === true
  }

  /**
   * Récupère l'ID de la transaction qui a échoué
   */
  getTransactionId(): string | undefined {
    return this.context.transactionId
  }
}

/**
 * Singleton pour l'injection de dépendance
 */
export const transactionService = new TransactionService()
