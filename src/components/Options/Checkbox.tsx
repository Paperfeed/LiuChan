import { FC, PropsWithChildren } from 'react'

interface CheckboxProps extends PropsWithChildren {
  checked: boolean
  onChange?: (value: boolean) => void
}

export const Checkbox: FC<CheckboxProps> = ({
  checked,
  children,
  onChange = () => null,
}) => (
  <div className="flex gap-3">
    <input
      checked={checked}
      className=""
      onChange={({ target: { checked } }) => onChange(checked)}
      type="checkbox"
    />
    <label>{children}</label>
  </div>
)
