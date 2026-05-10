import styles from './FormPageTemplate.module.css'
import { Toggle } from './Toggle'

interface CheckboxOptionProps {
  checked: boolean
  onChange: (checked: boolean) => void
  title: string
  description?: string
  disabled?: boolean
}

export function CheckboxOption({ checked, onChange, title, description, disabled }: CheckboxOptionProps) {
  return (
    <div className={`${styles.toggleOption} ${disabled ? styles.toggleOptionDisabled : ''}`}>
      <Toggle
        checked={checked}
        onChange={onChange}
        label={title}
        disabled={disabled}
      />
      {description && <span className={styles.toggleOptionDesc}>{description}</span>}
    </div>
  )
}
