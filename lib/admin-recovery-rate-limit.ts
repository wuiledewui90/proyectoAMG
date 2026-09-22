type RecoveryAttempt = {
  failures: number
  resetAt: number
}

const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 5

const globalForRecovery = globalThis as typeof globalThis & {
  adminRecoveryAttempts?: Map<string, RecoveryAttempt>
}

const attempts =
  globalForRecovery.adminRecoveryAttempts ?? new Map<string, RecoveryAttempt>()

globalForRecovery.adminRecoveryAttempts = attempts

export function canAttemptAdminRecovery(key: string) {
  const attempt = attempts.get(key)
  if (!attempt) return true

  if (Date.now() >= attempt.resetAt) {
    attempts.delete(key)
    return true
  }

  return attempt.failures < MAX_FAILURES
}

export function registerAdminRecoveryFailure(key: string) {
  const now = Date.now()
  const attempt = attempts.get(key)

  if (!attempt || now >= attempt.resetAt) {
    attempts.set(key, { failures: 1, resetAt: now + WINDOW_MS })
    return
  }

  attempt.failures += 1
}

export function clearAdminRecoveryFailures(key: string) {
  attempts.delete(key)
}
