import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from './LoginPage'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockLogin = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false, login: mockLogin, logout: vi.fn() }),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('アプリ名「ときトレ」が表示される', () => {
    render(<LoginPage />)
    expect(screen.getByText('ときトレ')).toBeInTheDocument()
  })

  it('Google ログインボタンが表示される', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /Google/ })).toBeInTheDocument()
  })

  it('Google ログインボタンをクリックすると login が呼ばれる', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.click(screen.getByRole('button', { name: /Google/ }))
    expect(mockLogin).toHaveBeenCalledTimes(1)
  })
})
