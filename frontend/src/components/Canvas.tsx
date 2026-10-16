import { Stage, Layer, Image as KonvaImage } from 'react-konva'
import { useEffect, useRef, useState } from 'react'
import useImage from 'use-image'

interface CanvasProps {
  file: File
}

export default function Canvas({ file }: CanvasProps) {
  const [imageUrl, setImageUrl] = useState<string>('')

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 w-full h-full max-w-5xl max-h-[800px]">
      <CanvasInner imageUrl={imageUrl} />
    </div>
  )
}

function CanvasInner({ imageUrl }: { imageUrl: string }) {
  const [image] = useImage(imageUrl)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current
      setDimensions({ width: clientWidth, height: clientHeight })
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full">
      <Stage width={dimensions.width} height={dimensions.height}>
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              x={0}
              y={0}
              width={dimensions.width}
              height={dimensions.height}
            />
          )}
        </Layer>
      </Stage>
    </div>
  )
}
