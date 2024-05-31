interface DropdownProps<T> {
  label?: string
  onChange: (value: T) => void
  options: { label: string; value: T }[]
  value: T
}

export function Dropdown<T>({
  label,
  onChange,
  options,
  value,
}: DropdownProps<T>) {
  return (
    <div className="grid grid-cols-2 items-center">
      {label && <p className="col-span-1">{label}</p>}
      <select
        className="col-span-1 p-2 bg-white rounded-md focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 outline-0"
        onChange={(e) => onChange(JSON.parse(e.target.value))}
        value={JSON.stringify(value)}
      >
        {options.map(({ label, value }, i) => (
          <option key={`option-${i}`} value={JSON.stringify(value)}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
