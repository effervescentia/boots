import { describe, expect, test } from 'bun:test';
import { AccountDB, MemoBoostDB, MemoDB, TextContentDB } from '@api/db/db.schema';
import type { MemoWithContent } from '@api/lib';
import { insertOne } from '@bltx/db';
import { MockRequest, type Serialized, serialize } from '@bltx/test';
import { setupIntegrationTest } from '@test/setup.util';
import { eq } from 'drizzle-orm';
import type { CreateTextMemo } from './data/create-text-memo.req';
import type { MemoFeed } from './data/memo-feed.req';
import { MemoVisibility } from './data/memo-visibility.enum';
import type { PatchTextMemo } from './data/patch-text-memo.req';
import { MemoController } from './memo.controller';
import { MemoService } from './memo.service';

describe.skip('MemoController', () => {
  describe('GET /memo', () => {
    const { app, db } = setupIntegrationTest(MemoController);

    const request = (accountID: string): Promise<Serialized<MemoWithContent[]>> =>
      app()
        .handle(new MockRequest('/memo', { method: 'get', headers: { 'test-principal': accountID } }))
        .then((res) => res.json());

    test('find own memos', async () => {
      const account = await insertOne(db(), AccountDB, {});
      const memo = await new MemoService(db()).createText(account.id, {
        geolocation: [0, 0],
        content: 'my first memo',
      });

      const result = await request(account.id);

      expect(result).toEqual(serialize([memo]));
    });
  });

  describe('POST /memo/feed', () => {
    const { app, db } = setupIntegrationTest(MemoController);

    const request = (accountID: string, body: MemoFeed): Promise<Serialized<MemoWithContent[]>> =>
      app()
        .handle(
          new MockRequest('/memo/feed', {
            method: 'post',
            json: body,
            headers: { 'test-principal': accountID },
          }),
        )
        .then((res) => res.json());

    test('get a feed of nearby memos', async () => {
      const authorAccount = await insertOne(db(), AccountDB, {});
      const readerAccount = await insertOne(db(), AccountDB, {});
      const memo = await new MemoService(db()).createText(authorAccount.id, {
        geolocation: [-79.38292, 43.65366],
        content: 'my first memo',
      });

      const result = await request(readerAccount.id, { geolocation: [-79.38295, 43.65362], distance: 10 });

      expect(result).toEqual(serialize([{ ...memo, boosted: false }]));
    });
  });

  describe('POST /memo/text', () => {
    const { app, db } = setupIntegrationTest(MemoController);

    const request = (accountID: string, body: CreateTextMemo): Promise<Serialized<MemoWithContent>> =>
      app()
        .handle(new MockRequest('/memo/text', { method: 'post', json: body, headers: { 'test-principal': accountID } }))
        .then((res) => res.json());

    test('create text memo', async () => {
      const account = await insertOne(db(), AccountDB, {});
      const data: CreateTextMemo = { geolocation: [0, 0], content: 'my first memo' };

      const result = await request(account.id, data);

      expect(result).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          authorID: account.id,
          geolocation: data.geolocation,
          visibility: MemoVisibility.PUBLIC,
          text: expect.objectContaining({ content: data.content }),
        }),
      );

      const { text: _, ...resultWithoutText } = result;
      expect(serialize(await db().query.MemoDB.findFirst({ where: eq(MemoDB.id, result.id) }))).toEqual(
        resultWithoutText,
      );

      expect(
        serialize(await db().query.TextContentDB.findFirst({ where: eq(TextContentDB.memoID, result.id) })),
      ).toEqual({ ...result.text!, memoID: result.id });
    });
  });

  describe('PATCH /memo/text/:memoID', () => {
    const { app, db } = setupIntegrationTest(MemoController);

    const request = (accountID: string, memoID: string, body: PatchTextMemo): Promise<Serialized<MemoWithContent>> =>
      app()
        .handle(
          new MockRequest(`/memo/text/${memoID}`, {
            method: 'patch',
            json: body,
            headers: { 'test-principal': accountID },
          }),
        )
        .then((res) => res.json());

    test('patch text memo', async () => {
      const account = await insertOne(db(), AccountDB, {});
      const memo = await new MemoService(db()).createText(account.id, {
        geolocation: [0, 0],
        content: 'my first memo',
      });
      const data: PatchTextMemo = { content: 'my updated text' };

      const result = await request(account.id, memo.id, data);

      expect(result).toEqual(
        expect.objectContaining({
          text: {
            ...serialize(memo.text),
            content: data.content,
            updatedAt: expect.any(String),
          },
        }),
      );

      expect(new Date(result.updatedAt)).toBeAfter(account.updatedAt);

      expect(serialize(await db().query.TextContentDB.findFirst({ where: eq(TextContentDB.memoID, memo.id) }))).toEqual(
        expect.objectContaining(result.text!),
      );
    });
  });

  describe('GET /memo/:memoID', () => {
    const { app, db } = setupIntegrationTest(MemoController);

    const request = (accountID: string, memoID: string): Promise<Serialized<MemoWithContent>> =>
      app()
        .handle(new MockRequest(`/memo/${memoID}`, { method: 'get', headers: { 'test-principal': accountID } }))
        .then((res) => res.json());

    test('get text memo', async () => {
      const account = await insertOne(db(), AccountDB, {});
      const memo = await new MemoService(db()).createText(account.id, {
        geolocation: [0, 0],
        content: 'my first memo',
      });

      const result = await request(account.id, memo.id);

      expect(result).toEqual(serialize(memo));
    });
  });

  describe('DELETE /memo/:memoID', () => {
    const { app, db } = setupIntegrationTest(MemoController);

    const request = (accountID: string, memoID: string) =>
      app().handle(new MockRequest(`/memo/${memoID}`, { method: 'delete', headers: { 'test-principal': accountID } }));

    test('delete text memo', async () => {
      const account = await insertOne(db(), AccountDB, {});
      const memo = await new MemoService(db()).createText(account.id, {
        geolocation: [0, 0],
        content: 'my first memo',
      });

      await request(account.id, memo.id);

      expect(await db().$count(MemoDB, eq(MemoDB.id, memo.id))).toBe(0);
      expect(await db().$count(TextContentDB, eq(TextContentDB.memoID, memo.id))).toBe(0);
    });
  });

  describe('PUT /memo/:memoID/boost', () => {
    const { app, db } = setupIntegrationTest(MemoController);

    const request = (accountID: string, memoID: string) =>
      app().handle(
        new MockRequest(`/memo/${memoID}/boost`, { method: 'put', headers: { 'test-principal': accountID } }),
      );

    test('boost a memo', async () => {
      const authorAccount = await insertOne(db(), AccountDB, {});
      const readerAccount = await insertOne(db(), AccountDB, {});
      const memo = await new MemoService(db()).createText(authorAccount.id, {
        geolocation: [0, 0],
        content: 'my first memo',
      });

      await request(readerAccount.id, memo.id);

      expect(await db().$count(MemoBoostDB, eq(MemoBoostDB.memoID, memo.id))).toBe(1);
    });
  });

  describe('DELETE /memo/:memoID/boost', () => {
    const { app, db } = setupIntegrationTest(MemoController);

    const request = (accountID: string, memoID: string) =>
      app().handle(
        new MockRequest(`/memo/${memoID}/boost`, { method: 'delete', headers: { 'test-principal': accountID } }),
      );

    test('remove boost from a memo', async () => {
      const authorAccount = await insertOne(db(), AccountDB, {});
      const readerAccount = await insertOne(db(), AccountDB, {});
      const memoService = new MemoService(db());
      const memo = await memoService.createText(authorAccount.id, {
        geolocation: [0, 0],
        content: 'my first memo',
      });
      await memoService.boost(memo.id, readerAccount.id);

      await request(readerAccount.id, memo.id);

      expect(await db().$count(MemoBoostDB, eq(MemoBoostDB.memoID, memo.id))).toBe(0);
    });
  });
});
