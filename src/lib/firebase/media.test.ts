import { test, mock } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'node:events';

// Create a mock auth object
const mockAuth = {
  currentUser: { uid: 'user123' }
};

const mockFunctions = {};

// Mock config module completely to avoid initializing Firebase
mock.module('./config', {
  namedExports: {
    auth: mockAuth,
    db: {},
    functions: mockFunctions,
    storage: {}
  }
});

mock.module('firebase/firestore', {
  namedExports: {
    collection: mock.fn(),
    query: mock.fn(),
    where: mock.fn(),
    onSnapshot: mock.fn(),
    doc: mock.fn(),
    deleteDoc: mock.fn(),
    updateDoc: mock.fn(),
    addDoc: mock.fn(),
  }
});

let _mockUploadMediaFunction = mock.fn(() => Promise.resolve({ data: { id: 'mocked-id' } }));
mock.module('firebase/functions', {
  namedExports: {
    httpsCallable: mock.fn(() => _mockUploadMediaFunction)
  }
});

mock.module('firebase/storage', {
    namedExports: {
        ref: mock.fn(),
        uploadBytesResumable: mock.fn(),
        getDownloadURL: mock.fn(),
    }
});

mock.module('../../../firebase-applet-config.json', {
    defaultExport: { projectId: 'test' }
});

// Setup globals for File and FileReader
global.File = class File {
  name: string;
  type: string;
  constructor(bits: any[], name: string, options?: any) {
    this.name = name;
    this.type = options?.type || '';
  }
} as any;

global.FileReader = class FileReader {
  onload: any;
  onerror: any;
  result: any;
  readAsDataURL(file: any) {
    this.result = 'data:image/png;base64,mocked';
    setTimeout(() => {
        if(this.onload) this.onload();
    }, 0);
  }
} as any;


test('uploadMedia happy path', async () => {
    // reset for this test
    _mockUploadMediaFunction = mock.fn(() => Promise.resolve({ data: { id: 'mocked-id' } }));

    const { uploadMedia } = await import('./media.ts');

    const file = new File([''], 'test.png', { type: 'image/png' });
    const progressUpdates: number[] = [];

    const id = await uploadMedia('user123', file, (progress) => {
        progressUpdates.push(progress);
    }, {});

    assert.strictEqual(id, 'mocked-id');
    assert.deepStrictEqual(progressUpdates, [10, 30, 50, 100]);
});

test('uploadMedia throws error when user is not authenticated', async () => {
    // Temporarily unset currentUser
    const originalUser = mockAuth.currentUser;
    mockAuth.currentUser = null as any;

    const { uploadMedia } = await import('./media.ts');
    const file = new File([''], 'test.png', { type: 'image/png' });

    await assert.rejects(
        async () => await uploadMedia('user123', file, () => {}, {}),
        (err: Error) => err.message === 'User is not authenticated'
    );

    // Restore
    mockAuth.currentUser = originalUser;
});

test('uploadMedia throws error when cloud function fails', async () => {
    const { uploadMedia } = await import('./media.ts');

    // Override the mock implementation for this test
    _mockUploadMediaFunction = mock.fn(() => Promise.reject(new Error('Cloud function failed')));

    const file = new File([''], 'test.png', { type: 'image/png' });

    await assert.rejects(
        async () => await uploadMedia('user123', file, () => {}, {}),
        (err: Error) => err.message === 'Cloud function failed'
    );
});

test('subscribeToMedia sorts correctly', async () => {
  const firestore = await import('firebase/firestore');

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

  // We already mocked firestore module at the top, let's just override the mock fn for this test
  (firestore.onSnapshot as any).mock.mockImplementation((q: any, callback: any) => {
    callback({
      forEach: (fn: any) => mockDocs.forEach(fn)
    });
    return () => {};
  });

  const { subscribeToMedia } = await import('./media.ts');

  let sortedMedia: any[] = [];
  subscribeToMedia('user123', (media: any[]) => {
    sortedMedia = media;
  });

  assert.strictEqual(sortedMedia.length, 5);

  assert.strictEqual(sortedMedia[0].id, 'doc5');
  assert.strictEqual(sortedMedia[1].id, 'doc4');
  assert.strictEqual(sortedMedia[2].id, 'doc3');
  assert.strictEqual(sortedMedia[3].id, 'doc2');
  assert.strictEqual(sortedMedia[4].id, 'doc1');
});
