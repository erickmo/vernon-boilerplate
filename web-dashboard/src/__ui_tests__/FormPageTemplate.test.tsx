import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { render } from '@/__ui_tests__/test-utils'
import { CheckboxOption } from '@/widgets/FormPageTemplate/CheckboxOption'

describe('FormPageTemplate boolean controls', () => {
  it('renders checkbox options as toggle controls', () => {
    render(
      <CheckboxOption
        checked
        onChange={() => {}}
        title="Auto approve"
        description="Turn this on for the demo state."
      />,
    )

    expect(screen.getByRole('switch', { name: /auto approve/i })).toBeInTheDocument()
    expect(screen.getByText(/turn this on for the demo state/i)).toBeInTheDocument()
  })
})
