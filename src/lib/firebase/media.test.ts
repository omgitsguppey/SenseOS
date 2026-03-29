import { test, mock } from 'node:test';
import assert from 'node:assert';

test('subscribeToMedia sorts correctly', async () => {
  mock.module('./config', {
    namedExports: {
      auth: { currentUser: { uid: 'test-user' } },
      db: {},
      functions: {}
    }
  });

  const mockDocs = [
    {
      id: 'doc3',
      data: () => ({
        originalUrl: 'http://example.com/image3?token=abc',
        createdAt: { toMillis: () => 3000 }
      })
    },
    {
      id: 'doc1',
      data: () => ({
        originalUrl: 'http://example.com/image1?token=abc',
        createdAt: { toMillis: () => 1000 }
      })
    },
    {
      id: 'doc4',
      data: () => ({
        originalUrl: 'http://example.com/image4?token=abc',
        createdAt: 4000
      })
    },
    {
      id: 'doc2',
      data: () => ({
        originalUrl: 'http://example.com/image2?token=abc',
        createdAt: new Date(2000).toISOString()
      })
    },
    {
      id: 'doc5',
      data: () => ({
        originalUrl: 'http://example.com/image5?token=abc',
        createdAt: 5000
      })
    }
  ];

  mock.module('firebase/firestore', {
    namedExports: {
      onSnapshot: (q: any, callback: any) => {
        callback({
          forEach: (fn: any) => mockDocs.forEach(fn)
        });
        return () => {};
      },
      collection: () => {},
      query: () => {},
      where: () => {}
    }
  });

  mock.module('firebase/functions', {
    namedExports: {
      httpsCallable: () => {}
    }
  });

  mock.module('../../../firebase-applet-config.json', {
    defaultExport: { projectId: 'test' }
  });

  mock.module('uuid', {
    namedExports: {
      v4: () => 'uuid'
    }
  });

  const { subscribeToMedia } = await import('./media.ts');

  let sortedMedia: any[] = [];
  subscribeToMedia('test-user', (media: any[]) => {
    sortedMedia = media;
  });

  assert.strictEqual(sortedMedia.length, 5);

  assert.strictEqual(sortedMedia[0].id, 'doc5');
  assert.strictEqual(sortedMedia[1].id, 'doc4');
  assert.strictEqual(sortedMedia[2].id, 'doc3');
  assert.strictEqual(sortedMedia[3].id, 'doc2');
  assert.strictEqual(sortedMedia[4].id, 'doc1');
});
