import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock Firebase - only if the file exists
try {
  jest.mock('@/lib/firebase', () => ({
    auth: {
      currentUser: null,
      signInWithEmailAndPassword: jest.fn(),
      signOut: jest.fn(),
    },
    db: {},
  }));
} catch (e) {
  // Firebase mock not needed if file doesn't exist
}

// Mock environment variables
process.env.NODE_ENV = 'test'

// Suppress console errors in tests unless explicitly testing them
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})