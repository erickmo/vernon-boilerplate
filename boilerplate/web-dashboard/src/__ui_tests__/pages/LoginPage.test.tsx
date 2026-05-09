import { render, screen } from '../test-utils'
import LoginPage from '@/pages/Login/LoginPage'

describe('LoginPage — field types', () => {
  it('renders usr field as type text, not email', () => {
    render(<LoginPage />)
    const input = screen.getByPlaceholderText(/nama@sekolah.com \/ username/i)
    expect(input).toHaveAttribute('type', 'text')
  })
})
