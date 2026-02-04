import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useMutation, Unauthenticated } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'

import { api } from '@convex/_generated/api'
import Header from '../components/Header'

export const Route = createFileRoute('/')({ component: BucketHome })

function BucketHome() {
  const { data } = useQuery(convexQuery(api.tiles.listMine, {}))
  const tiles = data ?? []
  const { signIn } = useAuthActions()
  const createTile = useMutation(api.tiles.createImageTile)
  const generateUploadUrl = useMutation(api.tiles.generateUploadUrl)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const file = Array.from(fileList).find((item) =>
        item.type.startsWith('image/'),
      )
      if (!file) {
        setError('Drop an image to add a tile.')
        return
      }

      setIsUploading(true)
      setError(null)
      try {
        const ratio = await getImageRatio(file)
        const size = chooseTileSize(ratio, tiles.length)
        const position = findNextPosition(tiles, size)
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
          position,
          size,
          title: file.name.replace(/\.[^/.]+$/, ''),
        })
      } catch (error) {
        console.error(error)
        setError('Upload failed. Please try again.')
      } finally {
        setIsUploading(false)
      }
    },
    [createTile, generateUploadUrl, tiles],
  )

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleAnonymousSignIn = useCallback(() => signIn('anonymous'), [signIn])

  return (
    <div className="min-h-screen pb-20">
      <Header title="My bucket" onAddClick={openFilePicker} isUploading={isUploading} />
      <Unauthenticated>
        <AutoSignIn onSignIn={handleAnonymousSignIn} />
      </Unauthenticated>
      <section className="mx-auto mt-10 w-full max-w-5xl px-6">
        <div
          className={`relative rounded-[36px] bg-white/90 p-6 shadow-sm ring-1 ring-slate-200 sm:p-10 bucket-shadow ${
            isDragging ? 'ring-2 ring-slate-300' : ''
          }`}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) {
              setIsDragging(false)
            }
          }}
          onDrop={(event) => {
            event.preventDefault()
            setIsDragging(false)
            if (event.dataTransfer.files?.length) {
              void handleFiles(event.dataTransfer.files)
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              if (event.target.files?.length) {
                void handleFiles(event.target.files)
              }
              event.target.value = ''
            }}
          />
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <p className="font-medium">Drop images anywhere to add a tile.</p>
            {isUploading && <span className="text-slate-400">Uploading…</span>}
            {error && <span className="text-rose-400">{error}</span>}
          </div>
          <div className="grid grid-cols-3 auto-rows-[120px] gap-4 sm:auto-rows-[160px] sm:gap-6">
            {tiles.map((tile) => {
              const placement = toGridPlacement(tile)
              return (
                <article
                  key={tile._id}
                  className="group relative overflow-hidden rounded-[26px] bg-slate-100 shadow-md shadow-slate-900/10 transition hover:-translate-y-0.5"
                  style={placement}
                >
                  {tile.imageUrl ? (
                    <img
                      src={tile.imageUrl}
                      alt={tile.title ?? 'Bucket tile'}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                      Upload an image
                    </div>
                  )}
                </article>
              )
            })}
            {tiles.length === 0 && (
              <div className="col-span-3 rounded-[24px] border border-dashed border-slate-200 py-16 text-center text-sm text-slate-400">
                Drop your first image to start filling your bucket.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function AutoSignIn({ onSignIn }: { onSignIn: () => void }) {
  useEffect(() => {
    void onSignIn()
  }, [onSignIn])

  return (
    <div className="mx-auto mt-6 w-full max-w-5xl px-6 text-sm text-slate-400">
      Signing you in anonymously…
    </div>
  )
}

function chooseTileSize(ratio: number, existingCount: number) {
  if (existingCount === 0) {
    return { w: 3, h: 2 }
  }
  if (ratio >= 1.45) {
    return { w: 2, h: 1 }
  }
  if (ratio <= 0.8) {
    return { w: 1, h: 2 }
  }
  return { w: 1, h: 1 }
}

function toGridPlacement(tile: {
  position: { x: number; y: number }
  size: { w: number; h: number }
}) {
  const x = Math.max(1, Math.round(tile.position.x))
  const y = Math.max(1, Math.round(tile.position.y))
  const w = Math.max(1, Math.round(tile.size.w))
  const h = Math.max(1, Math.round(tile.size.h))

  return {
    gridColumn: `${x} / span ${w}`,
    gridRow: `${y} / span ${h}`,
  } as const
}

function findNextPosition(
  tiles: Array<{
    position: { x: number; y: number }
    size: { w: number; h: number }
  }>,
  size: { w: number; h: number },
) {
  const gridWidth = 3
  const occupied = new Set<string>()
  let maxRow = 1

  tiles.forEach((tile) => {
    const x = Math.max(1, Math.round(tile.position.x))
    const y = Math.max(1, Math.round(tile.position.y))
    const w = Math.max(1, Math.round(tile.size.w))
    const h = Math.max(1, Math.round(tile.size.h))
    maxRow = Math.max(maxRow, y + h)

    for (let dy = 0; dy < h; dy += 1) {
      for (let dx = 0; dx < w; dx += 1) {
        occupied.add(`${x + dx}:${y + dy}`)
      }
    }
  })

  const fits = (x: number, y: number) => {
    if (x + size.w - 1 > gridWidth) return false
    for (let dy = 0; dy < size.h; dy += 1) {
      for (let dx = 0; dx < size.w; dx += 1) {
        if (occupied.has(`${x + dx}:${y + dy}`)) return false
      }
    }
    return true
  }

  for (let y = 1; y <= maxRow + 6; y += 1) {
    for (let x = 1; x <= gridWidth; x += 1) {
      if (fits(x, y)) {
        return { x, y }
      }
    }
  }

  return { x: 1, y: maxRow + 1 }
}

function getImageRatio(file: File) {
  return new Promise<number>((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const ratio = img.width && img.height ? img.width / img.height : 1
      URL.revokeObjectURL(url)
      resolve(ratio)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(1)
    }
    img.src = url
  })
}
