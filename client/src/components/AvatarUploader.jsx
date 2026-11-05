
import { useState, useRef, useEffect } from "react";
import apiClient from "../services/apiClient.js";

const MAX_SIZE = 5 * 1024 * 1024;

const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export default function AvatarUploader() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState("");

  const inputRef = useRef(null);

  // Task 2: Validate file type and size
  function handleFile(selectedFile) {
    if (!selectedFile) return;

    setError("");
    setProgress(0);
    setUploadedUrl("");

    if (!ALLOWED.includes(selectedFile.type)) {
      setFile(null);
      setPreview(null);
      setError(
        "Only image files are allowed (JPEG, PNG, WebP, GIF)"
      );
      return;
    }

    if (selectedFile.size > MAX_SIZE) {
      setFile(null);
      setPreview(null);
      setError("File is too large (maximum size is 5MB)");
      return;
    }

    setFile(selectedFile);

    // Task 3: Generate local image preview
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
  }

  // Task 1: Drag-and-drop handlers
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];

    handleFile(droppedFile);
  }

  // Task 3: Clean up old preview URLs
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Task 4: Upload using Axios and FormData
  async function upload() {
    if (!file) return;

    setError("");
    setProgress(0);
    setUploadedUrl("");

    const formData = new FormData();

    // Must match upload.single("avatar") on the server
    formData.append("avatar", file);

    try {
      const response = await apiClient.post(
        "/api/upload",
        formData,
        {
          onUploadProgress: (event) => {
            if (event.total) {
              const percent = Math.round(
                (event.loaded * 100) / event.total
              );

              setProgress(percent);
            }
          },
        }
      );

      setUploadedUrl(response.data.url);
      setProgress(100);

      console.log("Upload successful:", response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Upload failed. Please try again."
      );

      console.error("Upload error:", err);
    }
  }

  return (
    <div>
      {/* Drag-and-drop zone */}
      <div
        className={
          isDragging
            ? "drop-zone dragging"
            : "drop-zone"
        }
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p>
          {isDragging
            ? "Drop to upload"
            : "Drag an image here, or click to choose"}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(e) => {
            handleFile(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>

      {/* Validation error */}
      {error && (
        <p className="error">{error}</p>
      )}

      {/* Local image preview */}
      {preview && (
        <div>
          <img
            src={preview}
            alt="Avatar preview"
            className="preview"
          />
          <p>{file?.name}</p>
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={upload}
        disabled={!file}
      >
        Upload
      </button>

      {/* Upload progress */}
      {progress > 0 && (
        <div>
          <p>Uploading: {progress}%</p>

          <div className="bar">
            <div
              className="fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Successful upload */}
      {uploadedUrl && (
        <p>
          Upload successful!
          <br />
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View uploaded image
          </a>
        </p>
      )}
    </div>
  );
}
