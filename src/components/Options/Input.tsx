import { HTMLInputTypeAttribute } from 'react'

interface InputProps {
  label?: string
  onChange: (value: string) => void
  postfix?: string
  type?: HTMLInputTypeAttribute
  value: string | number
}

export function Input({ label, onChange, postfix, type, value }: InputProps) {
  return (
    <div className="grid grid-cols-2 items-center">
      {label && <p className="col-span-1">{label}</p>}
      <div className="col-span-1 flex flex-row items-center">
        <input
          className="p-1 px-2 min-w-0 w-auto rounded-md focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 outline-0"
          onChange={(e) => onChange(e.target.value)}
          type={type}
          value={value}
        />
        {postfix && <p className="ml-1">{postfix}</p>}
      </div>
    </div>
  )
}
