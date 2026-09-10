import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import './dom-mocks'

afterEach(cleanup)
export { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
