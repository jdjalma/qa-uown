/**
 * Randomness primitives for the realistic-data factory.
 *
 * Uses `node:crypto.randomInt` (NOT `Math.random`) for consistency with the
 * rest of the data layer (`application.body.ts`, `tire-agent.data.ts`) and to
 * keep entropy strong. All helpers are pure given the RNG.
 */
import { randomInt } from 'node:crypto';

/** Inclusive integer in [min, max]. */
export function int(min: number, max: number): number {
  if (max < min) [min, max] = [max, min];
  return min + randomInt(max - min + 1);
}

/** Pick one element. Throws on empty array (programmer error). */
export function pick<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('pick(): empty array');
  return arr[randomInt(arr.length)] as T;
}

/** Pick `n` DISTINCT elements (or the whole array shuffled if n >= length). */
export function pickMany<T>(arr: readonly T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  const take = Math.min(n, pool.length);
  for (let i = 0; i < take; i++) {
    out.push(pool.splice(randomInt(pool.length), 1)[0] as T);
  }
  return out;
}

/** True with probability `p` (0..1). */
export function chance(p: number): boolean {
  return randomInt(10_000) < Math.round(p * 10_000);
}

/** A numeric string of exactly `n` digits (first digit 1-9 so length is stable). */
export function digits(n: number): string {
  if (n <= 0) return '';
  let s = String(int(1, 9));
  for (let i = 1; i < n; i++) s += String(randomInt(10));
  return s;
}

/** Money value in [min, max] rounded to `step` (default $1), as a number. */
export function money(min: number, max: number, step = 1): number {
  const raw = int(Math.ceil(min / step), Math.floor(max / step)) * step;
  return +raw.toFixed(2);
}

/**
 * Split `total` into `parts` positive amounts that sum EXACTLY to `total`
 * (last part absorbs the rounding remainder). Each part is >= `min`.
 * Used to spread an order total across multiple cart lines.
 */
export function splitAmount(total: number, parts: number, min = 1): number[] {
  if (parts <= 1) return [+total.toFixed(2)];
  const cents = Math.round(total * 100);
  const minCents = Math.round(min * 100);
  if (cents < minCents * parts) {
    // Not enough to honor `min` everywhere — distribute evenly.
    const base = Math.floor(cents / parts);
    const out = Array.from({ length: parts }, () => base);
    out[parts - 1] += cents - base * parts;
    return out.map((c) => +(c / 100).toFixed(2));
  }
  const out: number[] = [];
  let remaining = cents - minCents * parts;
  for (let i = 0; i < parts - 1; i++) {
    const extra = randomInt(remaining + 1);
    out.push(minCents + extra);
    remaining -= extra;
  }
  out.push(minCents + remaining);
  return out.map((c) => +(c / 100).toFixed(2));
}
