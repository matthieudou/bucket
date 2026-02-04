import { Link } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'

import './Header.css'

export default function Header() {
  const { signOut } = useAuthActions()

  return (
    <header className="header">
      <div className="brand">
        <Link to="/" className="brand-link">
          bucket
        </Link>
        <span className="brand-tag">Share what matters.</span>
      </div>
      <div className="header-actions">
        <Authenticated>
          <button className="ghost-button" type="button" onClick={() => signOut()}>
            Sign out
          </button>
        </Authenticated>
        <Unauthenticated>
          <span className="header-note">Sign in to build your bucket.</span>
        </Unauthenticated>
      </div>
    </header>
  )
}
