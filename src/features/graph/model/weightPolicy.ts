import type { WeightPolicy } from './types'

export function isWeightAllowed(value: number, policy: WeightPolicy): boolean {
  if (!Number.isFinite(value)) {
    return false
  }

  if (policy === 'positive') {
    return value > 0
  }

  if (policy === 'nonNegative') {
    return value >= 0
  }

  return true
}

export function weightPolicyHint(policy: WeightPolicy): string {
  if (policy === 'positive') {
    return 'Weight must be > 0'
  }

  if (policy === 'nonNegative') {
    return 'Weight must be >= 0'
  }

  return 'Any numeric weight is accepted'
}

export function parseWeightInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    return null
  }

  const value = Number(trimmed)
  if (!Number.isFinite(value)) {
    return null
  }

  return value
}

