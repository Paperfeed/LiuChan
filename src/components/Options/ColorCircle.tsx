import 'react-color-palette/css'

import {
  flip,
  offset,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
} from '@floating-ui/react'
import { useState } from 'react'
import { ColorPicker, IColor, useColor } from 'react-color-palette'

interface ColorCircleProps {
  color: string
  label: string
  onChange: (color: IColor) => void
  onReset: () => void
}

export const ColorCircle = ({
  color,
  label,
  onChange,
  onReset,
}: ColorCircleProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const { context, floatingStyles, refs } = useFloating({
    middleware: [offset(-5), flip(), shift()],
    onOpenChange: setIsOpen,
    open: isOpen,
  })

  const hover = useHover(context, {
    delay: { open: 200 },
    handleClose: safePolygon({ blockPointerEvents: true }),
  })
  const focus = useFocus(context)
  const dismiss = useDismiss(context)
  const { getFloatingProps, getReferenceProps } = useInteractions([
    hover,
    focus,
    dismiss,
  ])
  const [newColor, setColor] = useColor(`rgb(${color})`)

  const handleColorChange = (color: IColor) => {
    setColor(color)
    onChange(color)
  }

  return (
    <div>
      <div className="inline-flex flex-col items-center">
        <div
          ref={refs.setReference}
          onClick={() => setIsOpen(true)}
          {...getReferenceProps()}
          className="w-12 h-12 rounded-full"
          style={{
            backgroundColor: newColor.hex,
          }}
        />
        <p className="text-sm">{label}</p>
      </div>
      {isOpen && (
        <div
          ref={refs.setFloating}
          className="bg-black rounded-md"
          {...getFloatingProps()}
          style={floatingStyles}
        >
          <ColorPicker color={newColor} onChange={handleColorChange} />
          <div className="flex justify-center">
            <button
              className="-mt-4 mb-1 px-2 p-1 rounded-md justify-center bg-blue-600 text-white"
              onClick={onReset}
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
