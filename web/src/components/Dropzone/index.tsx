import { ChangeEvent, DragEvent, useEffect, useState } from "react"
import { FiUpload } from "react-icons/fi"

import "./styles.css"

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]

interface DropzoneProps {
  onFileSelected: (file: File) => void
}

const Dropzone = ({ onFileSelected }: DropzoneProps) => {
  const [previewUrl, setPreviewUrl] = useState("")

  useEffect(() => {
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  function selectFile(file?: File) {
    if (!file || !ACCEPTED_TYPES.includes(file.type)) {
      return
    }
    setPreviewUrl(URL.createObjectURL(file))
    onFileSelected(file)
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0])
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    selectFile(event.dataTransfer.files[0])
  }

  return (
    <label
      className="dropzone"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleChange}
      />
      {previewUrl ? (
        <img src={previewUrl} alt="Imagem do ponto de coleta" />
      ) : (
        <p>
          <FiUpload />
          Imagem do estabelecimento (JPG, PNG ou WebP, até 5 MB)
        </p>
      )}
    </label>
  )
}

export default Dropzone
