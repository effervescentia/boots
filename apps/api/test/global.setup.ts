import { type ExpectExtendMatchers, expect } from 'bun:test';
import { matchers } from 'jest-date/matchers';

expect.extend({
  toBeBefore: matchers.toBeBefore,
  toBeAfter: matchers.toBeAfter,
} as ExpectExtendMatchers<unknown>);
