import { type Mock, mock } from 'bun:test';

export const mocked = <T extends (...args: unknown[]) => unknown>(value: unknown): Mock<T> => value as Mock<T>;

const IS_PROXY_MOCK = Symbol('is-proxy-mock');
const IS_MOCK_FREE = Symbol('is-mock-free');

// @ts-expect-error
// biome-ignore lint/suspicious/noEmptyInterface: expected
export interface MockInstance<T, Y extends any[], C = any> {}

type ArgsType<T> = T extends (...args: infer R) => any ? R : never;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<PartialFuncReturn<U>>
    : T[P] extends ReadonlyArray<infer U>
      ? ReadonlyArray<PartialFuncReturn<U>>
      : unknown extends T[P]
        ? T[P]
        : PartialFuncReturn<T[P]>;
};

export type PartialFuncReturn<T> = {
  [K in keyof T]?: T[K] extends (...args: infer A) => infer U
    ? (...args: A) => PartialFuncReturn<U> | PartialFuncReturn<Awaited<U>>
    : DeepPartial<T[K]>;
};

export type DeepMocked<T> = {
  [K in keyof T]: Required<T>[K] extends (...args: any[]) => infer U
    ? MockInstance<ReturnType<Required<T>[K]>, ArgsType<T[K]>> & ((...args: ArgsType<T[K]>) => DeepMocked<U>)
    : T[K] extends object
      ? DeepMocked<T[K]>
      : T[K];
} & T;

const isReserved = (prop: string | symbol) => {
  return (
    prop === 'inspect' ||
    prop === 'then' ||
    (typeof prop === 'symbol' && prop.toString() === 'Symbol(util.inspect.custom)')
  );
};

const isProxyMock = (obj: any) => obj[IS_PROXY_MOCK] === true;
const isMockFree = (obj: any) => obj instanceof Map || obj instanceof Set || obj[IS_MOCK_FREE] === true;

/**
 * tags objects that should not be extended with automatically mocked properties and methods
 */
export const mockFree = <T extends object & { [IS_MOCK_FREE]?: boolean }>(value: T): T => {
  if (value) {
    // eslint-disable-next-line no-param-reassign
    value[IS_MOCK_FREE] = true;
  }

  return value;
};

/**
 * creates a mocked function that returns a mock proxy when called
 */
const createRecursiveMockProxy = <T extends object>(name: string): MockInstance<T, any[]> => {
  const cache = new Map<string | number | symbol, any>();

  const proxy = new Proxy({} as T, {
    get: (_obj, prop) => {
      if (prop === IS_PROXY_MOCK) return true;
      if (isReserved(prop)) return undefined;
      if (cache.has(prop)) return cache.get(prop);

      const mockedProp = createUniversalMockProxy(`${name}.${prop.toString()}`);

      cache.set(prop, mockedProp);

      return mockedProp;
    },
  });

  return mock(() => proxy);
};

/**
 * creates a mock proxy that can be treated as either a function or an object
 */
export const createUniversalMockProxy = <T extends object>(name: string): DeepMocked<T> => {
  const cache = new Map<string | number | symbol, any>();

  const proxy = new Proxy(createRecursiveMockProxy(name) as T, {
    set: (target, prop, newValue, receiver) => {
      const didSet = Reflect.set(target, prop, newValue, receiver);

      if (didSet) {
        cache.delete(prop);
      }

      return didSet;
    },
    get: (obj, prop) => {
      if (prop === IS_PROXY_MOCK) return true;
      if (isReserved(prop)) return undefined;
      if (cache.has(prop)) return cache.get(prop);

      let mockedProp: any;

      if (prop in obj) {
        mockedProp = obj[prop as keyof PartialFuncReturn<T>];
      } else {
        mockedProp = createUniversalMockProxy(`${name}.${prop.toString()}`);
      }

      cache.set(prop, mockedProp);
      return mockedProp;
    },
  });

  return proxy as DeepMocked<T>;
};

export interface MockOptions {
  name?: string;
}

export const createMock = <T extends object>(
  partial: PartialFuncReturn<T> = {},
  options: MockOptions = {},
): DeepMocked<T> => {
  const cache = new Map<string | number | symbol, any>();
  const { name = 'mock' } = options;

  const proxy = new Proxy(partial, {
    set: (target, prop, newValue, receiver) => {
      const didSet = Reflect.set(target, prop, newValue, receiver);

      if (didSet) {
        cache.delete(prop);
      }

      return didSet;
    },
    get: (obj, prop) => {
      if (prop === IS_PROXY_MOCK) return true;
      if (isReserved(prop)) return undefined;
      if (cache.has(prop)) return cache.get(prop);

      let mockedProp: any;

      if (prop in obj) {
        const checkProp = obj[prop as keyof PartialFuncReturn<T>];

        if (isProxyMock(checkProp) || isMockFree(checkProp) || mocked(checkProp)._isMockFunction) {
          mockedProp = checkProp;
        } else if (typeof checkProp === 'function') {
          // wrap functions using test framework
          mockedProp = mock(checkProp);
        } else if (!!checkProp && typeof checkProp === 'object' && !Array.isArray(checkProp)) {
          // extend objects by automatically mocking other properties and methods
          mockedProp = createMock(checkProp, { name: `${name}.${prop.toString()}` });
        } else {
          mockedProp = checkProp;
        }
      } else if (prop === 'constructor') {
        mockedProp = () => undefined;
      } else {
        // treats undefined properties as both mock functions and objects with automatically mocked properties
        mockedProp = createUniversalMockProxy(`${name}.${prop.toString()}`);
      }

      cache.set(prop, mockedProp);
      return mockedProp;
    },
  });

  return proxy as DeepMocked<T>;
};
