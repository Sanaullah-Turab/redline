'use client'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type Props = {
  value: string
  onChange: (value: string) => void
  autoComplete: string
  invalid?: boolean
  id?: string
}

export function PasswordInput({ value, onChange, autoComplete, invalid, id = 'auth-password' }: Props) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative flex">
      <input
        id={id}
        name="password"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={8}
        maxLength={128}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        aria-describedby={invalid ? 'auth-error' : undefined}
        className="w-full pr-12"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </span>
  )
}
