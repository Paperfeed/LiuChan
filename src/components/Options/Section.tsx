import { FC, PropsWithChildren } from 'react'

interface SectionProps extends PropsWithChildren {
  title?: string
}

export const Section: FC<SectionProps> = ({ children, title }) => (
  <div className="p-5 bg-blue-100 rounded-2xl text-blue-950 flex flex-col gap-2">
    {title && (
      <>
        <h2 className="text-2xl font-bold text-blue-900">{title}</h2>
        <hr className="my-2 border-t border-blue-200 border-2" />
      </>
    )}
    {children}
  </div>
)
