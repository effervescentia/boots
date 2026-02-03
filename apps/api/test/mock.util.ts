import { type Mock, mock } from 'bun:test';
import { createMockFactory } from '@voiceflow/universal-mock';

export type { DeepMocked } from '@voiceflow/universal-mock/vitest';

export const mocked = <T extends (...args: unknown[]) => unknown>(value: unknown): Mock<T> => value as Mock<T>;

export const createMock = createMockFactory({
  fn: mock,
  isMockFunction: (value) => mocked(value)._isMockFunction,
});
