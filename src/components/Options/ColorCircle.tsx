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
  cssKey: string
  label: string
}

export const ColorCircle = ({ color, cssKey, label }: ColorCircleProps) => {
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
    const rgb = `${Math.round(color.rgb.r)} ${Math.round(
      color.rgb.g
    )} ${Math.round(color.rgb.b)}`
    logger.log(`Setting color for ${cssKey} to`, rgb)
    document.documentElement.style.setProperty(cssKey, rgb)
  }

  return (
    <div>
      <div className="inline-flex flex-col items-center">
        <div
          ref={refs.setReference}
          onClick={() => setIsOpen(!isOpen)}
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
            <button className="-mt-4 mb-1 px-2 p-1 rounded-md justify-center bg-blue-600 text-white">
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
