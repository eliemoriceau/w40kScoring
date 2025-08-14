/**
 * Partie Complete Errors - Domain Layer
 *
 * Erreurs spécialisées pour l'orchestration de création partie complète
 * Issue #18 - Orchestration 'création Partie complète'
 *
 * Architecture hexagonale : Erreurs domain pour orchestration
 */

/**
 * Erreur de base pour l'orchestration partie complète
 */
export abstract class PartieCompleteError extends Error {
  public readonly errorCode: string
  public readonly context: Record<string, any>

  constructor(message: string, errorCode: string, context: Record<string, any> = {}) {
    super(message)
    this.name = this.constructor.name
    this.errorCode = errorCode
    this.context = context
  }

  /**
   * Retourne une représentation JSON de l'erreur
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      errorCode: this.errorCode,
      context: this.context,
    }
  }
}

/**
 * Erreur de validation pour l'orchestration
 */
export class PartieCompleteValidationError extends PartieCompleteError {
  constructor(message: string, context: Record<string, any> = {}) {
    super(message, 'PARTIE_COMPLETE_VALIDATION_ERROR', context)
  }
}

/**
 * Erreur transactionnelle pour l'orchestration
 */
export class PartieCompleteTransactionError extends PartieCompleteError {
  public readonly failedStep: string
  public readonly rollbackCompleted: boolean

  constructor(
    message: string,
    failedStep: string,
    rollbackCompleted: boolean = true,
    context: Record<string, any> = {}
  ) {
    super(message, 'PARTIE_COMPLETE_TRANSACTION_ERROR', {
      ...context,
      failedStep,
      rollbackCompleted,
    })
    this.failedStep = failedStep
    this.rollbackCompleted = rollbackCompleted
  }

  /**
   * Vérifie si le rollback a été complété avec succès
   */
  isRollbackCompleted(): boolean {
    return this.rollbackCompleted
  }

  /**
   * Récupère l'étape qui a échoué
   */
  getFailedStep(): string {
    return this.failedStep
  }
}

/**
 * Erreur de rollback pour l'orchestration
 */
export class PartieCompleteRollbackError extends PartieCompleteError {
  public readonly originalError: Error
  public readonly partiallyCreatedEntities: Record<string, any[]>

  constructor(
    message: string,
    originalError: Error,
    partiallyCreatedEntities: Record<string, any[]> = {},
    context: Record<string, any> = {}
  ) {
    super(message, 'PARTIE_COMPLETE_ROLLBACK_ERROR', {
      ...context,
      originalErrorMessage: originalError.message,
      partiallyCreatedEntities,
    })
    this.originalError = originalError
    this.partiallyCreatedEntities = partiallyCreatedEntities
  }

  /**
   * Récupère l'erreur originale qui a causé le rollback
   */
  getOriginalError(): Error {
    return this.originalError
  }

  /**
   * Récupère les entités partiellement créées avant l'échec
   */
  getPartiallyCreatedEntities(): Record<string, any[]> {
    return this.partiallyCreatedEntities
  }
}

/**
 * Erreur d'autorisation pour l'orchestration
 */
export class PartieCompleteAuthorizationError extends PartieCompleteError {
  public readonly requestingUserId: number
  public readonly requiredPermission: string

  constructor(
    message: string,
    requestingUserId: number,
    requiredPermission: string,
    context: Record<string, any> = {}
  ) {
    super(message, 'PARTIE_COMPLETE_AUTHORIZATION_ERROR', {
      ...context,
      requestingUserId,
      requiredPermission,
    })
    this.requestingUserId = requestingUserId
    this.requiredPermission = requiredPermission
  }
}

/**
 * Erreur de contrainte métier pour l'orchestration
 */
export class PartieCompleteBusinessRuleError extends PartieCompleteError {
  public readonly violatedRule: string
  public readonly entityType: string

  constructor(
    message: string,
    violatedRule: string,
    entityType: string,
    context: Record<string, any> = {}
  ) {
    super(message, 'PARTIE_COMPLETE_BUSINESS_RULE_ERROR', {
      ...context,
      violatedRule,
      entityType,
    })
    this.violatedRule = violatedRule
    this.entityType = entityType
  }
}

/**
 * Erreur de coordination entre services
 */
export class PartieCompleteCoordinationError extends PartieCompleteError {
  public readonly sourceService: string
  public readonly targetService: string
  public readonly coordinationStep: string

  constructor(
    message: string,
    sourceService: string,
    targetService: string,
    coordinationStep: string,
    context: Record<string, any> = {}
  ) {
    super(message, 'PARTIE_COMPLETE_COORDINATION_ERROR', {
      ...context,
      sourceService,
      targetService,
      coordinationStep,
    })
    this.sourceService = sourceService
    this.targetService = targetService
    this.coordinationStep = coordinationStep
  }
}

/**
 * Erreur de timeout pour l'orchestration
 */
export class PartieCompleteTimeoutError extends PartieCompleteError {
  public readonly timeoutMs: number
  public readonly operation: string

  constructor(
    message: string,
    timeoutMs: number,
    operation: string,
    context: Record<string, any> = {}
  ) {
    super(message, 'PARTIE_COMPLETE_TIMEOUT_ERROR', {
      ...context,
      timeoutMs,
      operation,
    })
    this.timeoutMs = timeoutMs
    this.operation = operation
  }
}

/**
 * Erreur de ressource non trouvée pendant l'orchestration
 */
export class PartieCompleteResourceNotFoundError extends PartieCompleteError {
  public readonly resourceType: string
  public readonly resourceId: string | number

  constructor(
    message: string,
    resourceType: string,
    resourceId: string | number,
    context: Record<string, any> = {}
  ) {
    super(message, 'PARTIE_COMPLETE_RESOURCE_NOT_FOUND_ERROR', {
      ...context,
      resourceType,
      resourceId,
    })
    this.resourceType = resourceType
    this.resourceId = resourceId
  }
}

/**
 * Agrégateur d'erreurs pour orchestration complexe
 */
export class PartieCompleteAggregateError extends PartieCompleteError {
  public readonly errors: PartieCompleteError[]
  public readonly successfulSteps: string[]

  constructor(
    message: string,
    errors: PartieCompleteError[],
    successfulSteps: string[] = [],
    context: Record<string, any> = {}
  ) {
    super(message, 'PARTIE_COMPLETE_AGGREGATE_ERROR', {
      ...context,
      errorCount: errors.length,
      successfulStepsCount: successfulSteps.length,
    })
    this.errors = errors
    this.successfulSteps = successfulSteps
  }

  /**
   * Récupère toutes les erreurs par type
   */
  getErrorsByType<T extends PartieCompleteError>(errorClass: new (...args: any[]) => T): T[] {
    return this.errors.filter((error): error is T => error instanceof errorClass)
  }

  /**
   * Vérifie si des erreurs critiques sont présentes
   */
  hasCriticalErrors(): boolean {
    return this.errors.some(
      (error) =>
        error instanceof PartieCompleteTransactionError ||
        error instanceof PartieCompleteRollbackError ||
        error instanceof PartieCompleteTimeoutError
    )
  }

  /**
   * Retourne un résumé des erreurs
   */
  getErrorSummary(): Record<string, number> {
    const summary: Record<string, number> = {}

    for (const error of this.errors) {
      const errorType = error.constructor.name
      summary[errorType] = (summary[errorType] || 0) + 1
    }

    return summary
  }
}

/**
 * Factory pour créer des erreurs contextualisées
 */
export class PartieCompleteErrorFactory {
  /**
   * Crée une erreur de validation avec contexte
   */
  static createValidationError(
    field: string,
    value: any,
    expectedFormat: string,
    additionalContext: Record<string, any> = {}
  ): PartieCompleteValidationError {
    return new PartieCompleteValidationError(
      `Validation failed for field '${field}': expected ${expectedFormat}, got ${typeof value}`,
      {
        field,
        value,
        expectedFormat,
        ...additionalContext,
      }
    )
  }

  /**
   * Crée une erreur de transaction avec contexte
   */
  static createTransactionError(
    step: string,
    originalError: Error,
    rollbackCompleted: boolean = true,
    additionalContext: Record<string, any> = {}
  ): PartieCompleteTransactionError {
    return new PartieCompleteTransactionError(
      `Transaction failed at step '${step}': ${originalError.message}`,
      step,
      rollbackCompleted,
      {
        originalError: originalError.message,
        ...additionalContext,
      }
    )
  }

  /**
   * Crée une erreur de coordination entre services
   */
  static createCoordinationError(
    sourceService: string,
    targetService: string,
    step: string,
    reason: string,
    additionalContext: Record<string, any> = {}
  ): PartieCompleteCoordinationError {
    return new PartieCompleteCoordinationError(
      `Service coordination failed: ${sourceService} → ${targetService} at step '${step}': ${reason}`,
      sourceService,
      targetService,
      step,
      {
        reason,
        ...additionalContext,
      }
    )
  }

  /**
   * Convertit une erreur générique en erreur d'orchestration
   */
  static fromGenericError(error: Error, context: Record<string, any> = {}): PartieCompleteError {
    if (error instanceof PartieCompleteError) {
      return error
    }

    // Détection du type d'erreur basée sur le message ou le type
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return new PartieCompleteValidationError(error.message, context)
    }

    if (error.message.includes('transaction') || error.message.includes('rollback')) {
      return new PartieCompleteTransactionError(
        error.message,
        context.step || 'unknown',
        true,
        context
      )
    }

    if (error.message.includes('timeout')) {
      return new PartieCompleteTimeoutError(
        error.message,
        context.timeoutMs || 30000,
        context.operation || 'unknown',
        context
      )
    }

    if (error.message.includes('not found')) {
      return new PartieCompleteResourceNotFoundError(
        error.message,
        context.resourceType || 'unknown',
        context.resourceId || 'unknown',
        context
      )
    }

    // Erreur générique d'orchestration
    return new PartieCompleteBusinessRuleError(error.message, 'generic_error', 'unknown', {
      ...context,
      originalError: error.message,
    })
  }
}
