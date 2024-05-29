import { FC, PropsWithChildren } from 'react'

interface CheckboxProps extends PropsWithChildren {
  onChange?: (value: boolean) => void
}

export const Checkbox: FC<CheckboxProps> = ({
  children,
  onChange = () => null,
}) => (
  <div>
    <input
      className=""
      onChange={({ target: { checked } }) => onChange(checked)}
      type="checkbox"
    />
    <label>{children}</label>
  </div>
)
