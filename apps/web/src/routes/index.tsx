import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useMutation, Authenticated, Unauthenticated } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'

import { api } from '@convex/_generated/api'

export const Route = createFileRoute('/')({ component: BucketHome })

function BucketHome() {
  return (
    <div className="hero">
      <section className="hero-copy">
        <p className="eyebrow">Public profiles for everything you care about</p>
        <h1>Build a bucket that feels alive.</h1>
        <p className="subtitle">
          Add image tiles, arrange them on your grid, and share a single link with
          the world.
        </p>
        <div className="hero-actions">
          <Authenticated>
            <UploadTile />
          </Authenticated>
          <Unauthenticated>
            <SignInCard />
          </Unauthenticated>
        </div>
      </section>
      <section className="hero-panel">
        <TilePreview />
      </section>
    </div>
  )
}

function TilePreview() {
  const { data } = useQuery(convexQuery(api.tiles.listMine, {}))

  return (
    <div className="tile-grid">
      {(data ?? []).map((tile) => (
        <article key={tile._id} className="tile-card">
          <div className="tile-image">
            {tile.imageUrl ? (
              <img src={tile.imageUrl} alt={tile.title ?? 'Bucket tile'} />
            ) : (
              <div className="tile-placeholder">Upload an image</div>
            )}
          </div>
          <div className="tile-meta">
            <span>{tile.title ?? 'Untitled tile'}</span>
            <span className="tile-meta-tag">
              {Math.round(tile.size.w)}×{Math.round(tile.size.h)}
            </span>
          </div>
        </article>
      ))}
      {data?.length === 0 && (
        <div className="empty-state">
          <p>No tiles yet. Upload your first image to start your bucket.</p>
        </div>
      )}
    </div>
  )
}

function SignInCard() {
  const { signIn } = useAuthActions()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signIn')

  return (
    <div className="signin-card">
      <h2>Sign in to start</h2>
      <p>Use email + password, Google, or jump in anonymously.</p>
      <form
        className="signin-form"
        onSubmit={(event) => {
          event.preventDefault()
          void signIn('password', { email, password, flow })
        }}
      >
        <input
          className="field"
          type="email"
          placeholder="you@bucket.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="field"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button className="primary-button" type="submit">
          {flow === 'signIn' ? 'Sign in with email' : 'Create account'}
        </button>
        <button
          className="ghost-button"
          type="button"
          onClick={() =>
            setFlow((current) => (current === 'signIn' ? 'signUp' : 'signIn'))
          }
        >
          {flow === 'signIn' ? 'New here? Sign up' : 'Have an account? Sign in'}
        </button>
      </form>
      <div className="signin-actions">
        <button
          className="ghost-button"
          type="button"
          onClick={() => signIn('google')}
        >
          Continue with Google
        </button>
        <button
          className="ghost-button"
          type="button"
          onClick={() => signIn('anonymous')}
        >
          Continue anonymously
        </button>
      </div>
    </div>
  )
}

function UploadTile() {
  const createTile = useMutation(api.tiles.createImageTile)
  const generateUploadUrl = useMutation(api.tiles.generateUploadUrl)
  const [isUploading, setIsUploading] = useState(false)

  const defaultPosition = useMemo(() => ({ x: 1, y: 1 }), [])
  const defaultSize = useMemo(() => ({ w: 3, h: 3 }), [])

  return (
    <div className="upload-card">
      <h2>Upload a tile</h2>
      <p>Drop in an image to start shaping your grid.</p>
      <label className="file-input">
        <input
          type="file"
          accept="image/*"
          disabled={isUploading}
          onChange={async (event) => {
            const file = event.target.files?.[0]
            if (!file) return

            setIsUploading(true)
            try {
              const uploadUrl = await generateUploadUrl()
              const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'Content-Type': file.type },
                body: file,
              })
              const { storageId } = (await response.json()) as {
                storageId: string
              }
              await createTile({
                storageId,
                position: defaultPosition,
                size: defaultSize,
              })
            } finally {
              setIsUploading(false)
              event.target.value = ''
            }
          }}
        />
        <span>{isUploading ? 'Uploading…' : 'Choose image'}</span>
      </label>
    </div>
  )
}
