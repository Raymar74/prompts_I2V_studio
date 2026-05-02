import { useState } from 'react'

interface CopyButtonProps {
  text: string
  className?: string
  label?: string
}

export function CopyButton({ text, className = '', label = 'Copiar' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={`btn-ghost text-xs py-1 px-2 ${className}`}
    >
      {copied ? (
        <>
          <span>✓</span> Copiado
        </>
      ) : (
        <>
          <span>⎘</span> {label}
        </>
      )}
    </button>
  )
}
