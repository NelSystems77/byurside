import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ─── Firebase mocks ────────────────────────────────────────────────────────────
vi.mock('../firebase/config', () => ({
  db: {},
  auth: {},
  messaging: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'mock-collection-ref'),
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  getDocs: vi.fn(() => Promise.resolve({ docs: [], empty: true })),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  doc: vi.fn(() => 'mock-doc-ref'),
  query: vi.fn((ref) => ref),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAt: vi.fn(),
  endAt: vi.fn(),
  onSnapshot: vi.fn((_, cb) => { cb({ docs: [] }); return vi.fn(); }),
  serverTimestamp: vi.fn(() => new Date()),
  Timestamp: { fromDate: vi.fn((d) => d) },
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn((_, cb) => { cb(null); return vi.fn(); }),
}));

// ─── AI provider mocks ─────────────────────────────────────────────────────────
vi.mock('@google/generative-ai', () => {
  const mockSendMessage = vi.fn(() => Promise.resolve({ response: { text: () => 'respuesta-gemini' } }));
  const mockStartChat = vi.fn(() => ({ sendMessage: mockSendMessage }));
  const mockGetModel = vi.fn(() => ({ startChat: mockStartChat }));
  function MockGoogleGenerativeAI() { return { getGenerativeModel: mockGetModel }; }
  return { GoogleGenerativeAI: vi.fn(MockGoogleGenerativeAI) };
});

vi.mock('openai', () => {
  const mockCreate = vi.fn(() => Promise.resolve({ choices: [{ message: { content: 'respuesta-openai' } }] }));
  function MockOpenAI() { return { chat: { completions: { create: mockCreate } } }; }
  return { default: vi.fn(MockOpenAI) };
});

// ─── Web Speech API mocks ──────────────────────────────────────────────────────
const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => [
    { name: 'Dalia', lang: 'es-MX', voiceURI: 'Dalia', localService: true, default: false },
    { name: 'Paulina', lang: 'es-MX', voiceURI: 'Paulina', localService: true, default: false },
  ]),
  onvoiceschanged: null as any,
  speaking: false,
  pending: false,
  paused: false,
};

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis,
});

class MockSpeechSynthesisUtterance {
  text: string;
  lang = 'es-MX';
  pitch = 1;
  rate = 1;
  voice = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  constructor(text: string) { this.text = text; }
}

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  writable: true,
  value: MockSpeechSynthesisUtterance,
});

class MockSpeechRecognition {
  lang = '';
  continuous = false;
  interimResults = false;
  onstart: (() => void) | null = null;
  onresult: ((e: any) => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
}

Object.defineProperty(window, 'SpeechRecognition', { writable: true, value: MockSpeechRecognition });
Object.defineProperty(window, 'webkitSpeechRecognition', { writable: true, value: MockSpeechRecognition });

// ─── Geolocation mock ─────────────────────────────────────────────────────────
Object.defineProperty(navigator, 'geolocation', {
  writable: true,
  value: {
    watchPosition: vi.fn((success) => {
      success({ coords: { latitude: 9.93, longitude: -84.08, accuracy: 10 } });
      return 1;
    }),
    clearWatch: vi.fn(),
    getCurrentPosition: vi.fn(),
  },
});

// ─── navigator.onLine ─────────────────────────────────────────────────────────
Object.defineProperty(navigator, 'onLine', { writable: true, value: true });

// ─── import.meta.env ─────────────────────────────────────────────────────────
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_GEMINI_API_KEY: 'test-gemini-key',
    VITE_OPENAI_API_KEY: 'test-openai-key',
    VITE_GROQ_API_KEY: 'test-groq-key',
    VITE_OPENROUTER_API_KEY: '',
    DEV: true,
    PROD: false,
    MODE: 'test',
  },
});

// ─── localStorage ─────────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ─── seedDev mock ─────────────────────────────────────────────────────────────
vi.mock('../firebase/seedDev', () => ({
  seedDevData: vi.fn(() => Promise.resolve()),
}));
