'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, UserRound } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export function SignOutButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const signOut = async () => {
    await authClient.signOut()
    router.push('/')
    router.refresh()
  }
  return (
    <div className="user-menu">
      <Link href={`/profile/${id}`} className="nav-link" title="Your profile">
        <span className="avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
        <span className="nav-label max-w-28 truncate">{name}</span>
        <UserRound className="sr-only" />
      </Link>
      <button className="nav-link" onClick={signOut} title="Sign out" aria-label="Sign out">
        <LogOut aria-hidden="true" />
      </button>
    </div>
  )
}
