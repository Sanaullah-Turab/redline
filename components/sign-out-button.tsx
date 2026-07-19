'use client'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function SignOutButton({ name }: { name: string }) {
  const router = useRouter()
  return <button className="nav-link hidden sm:flex" onClick={async () => { await authClient.signOut(); router.push('/'); router.refresh() }} title="Sign out">{name}</button>
}
