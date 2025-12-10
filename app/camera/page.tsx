"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, Loader, ZoomIn, ZoomOut, RotateCcw, Settings, Download, Share2, Clock } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { getRateLimitConfig } from "@/lib/rate-limit"
import { addToHistory } from "@/lib/upload-history"
import { uploadImageToServer } from "@/lib/upload-api"

export default function CameraPage() {
  const { data: session } = useSession()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isCameraReady, setIsCameraReady] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string>("")

  // Camera controls
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [zoom, setZoom] = useState(1)
  const [quality, setQuality] = useState<"high" | "medium" | "low">("high")
  const [showSettings, setShowSettings] = useState(false)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>("")
  const [enableBlur, setEnableBlur] = useState(false)
  const [isProcessingBlur, setIsProcessingBlur] = useState(false)

  // Timer
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const isUserPro = (session?.user as any)?.isUserPro || false
  const isLoggedIn = !!session
  const config = getRateLimitConfig(isUserPro, isLoggedIn)

  // Get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((device) => device.kind === "videoinput")
        setCameras(videoDevices)
        if (videoDevices.length > 0) {
          setSelectedCameraId(videoDevices[0].deviceId)
        }
      } catch (error) {
        console.error("Error getting cameras:", error)
      }
    }
    getCameras()
  }, [])

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          ...(selectedCameraId && { deviceId: { exact: selectedCameraId } }),
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraReady(true)
      }
    } catch (error) {
      console.error("Camera error:", error)
      setIsCameraReady(false)
    }
  }, [facingMode, selectedCameraId])

  useEffect(() => {
    startCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [startCamera])

  // Timer effect
  useEffect(() => {
    if (isTimerActive && timerSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev - 1)
      }, 1000)
    } else if (timerSeconds === 0 && isTimerActive) {
      setIsTimerActive(false)
      if (videoRef.current) {
        capturePhoto()
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [isTimerActive, timerSeconds])

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
  }

  const switchCamera = (deviceId: string) => {
    setSelectedCameraId(deviceId)
  }

  const handleZoom = (direction: "in" | "out") => {
    setZoom((prev) => {
      const newZoom = direction === "in" ? Math.min(prev + 0.5, 5) : Math.max(prev - 0.5, 1)
      if (videoRef.current) {
        videoRef.current.style.transform = `scale(${newZoom})`
      }
      return newZoom
    })
  }

  const applyBackgroundBlur = async (imageData: string): Promise<string> => {
    setIsProcessingBlur(true)
    try {
      // Simple blur effect - in production, use ml5.js or TensorFlow.js for better results
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageData

      return new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext("2d")!

          // Draw original image
          ctx.drawImage(img, 0, 0)

          // Apply subtle blur effect to background
          ctx.globalAlpha = 0.3
          ctx.filter = "blur(15px)"
          ctx.drawImage(img, 0, 0)
          ctx.globalAlpha = 1
          ctx.filter = "none"

          resolve(canvas.toDataURL("image/jpeg", getQualityValue()))
        }
      })
    } catch (error) {
      console.error("Blur error:", error)
      return imageData
    } finally {
      setIsProcessingBlur(false)
    }
  }

  const getQualityValue = (): number => {
    const qualityMap = { high: 0.95, medium: 0.8, low: 0.6 }
    return qualityMap[quality]
  }

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)
        let imageData = canvasRef.current.toDataURL("image/jpeg", getQualityValue())

        if (enableBlur) {
          imageData = await applyBackgroundBlur(imageData)
        }

        setCapturedImage(imageData)
      }
    }
  }

  const retakePhoto = () => {
    setCapturedImage("")
    setUploadedUrl("")
    setTimerSeconds(0)
    setIsTimerActive(false)
  }

  const uploadPhoto = async () => {
    if (!capturedImage) return

    setIsUploading(true)
    try {
      const blob = await fetch(capturedImage).then((r) => r.blob())
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" })
      const formData = new FormData()
      formData.append("file", file)

      const response = await uploadImageToServer(formData)

      if (response.success && response.data) {
        const imageUrl = response.data.url || response.data.display_url
        setUploadedUrl(imageUrl)

        addToHistory({
          id: response.data.id,
          title: response.data.title,
          url: imageUrl,
          size: Number.parseInt(response.data.size),
          timestamp: Date.now(),
          deleteUrl: response.data.delete_url,
        })
      }
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const shareImage = async () => {
    if (!uploadedUrl || !navigator.share) return
    try {
      await navigator.share({
        title: "Check out my photo",
        text: "I just captured this amazing photo!",
        url: uploadedUrl,
      })
    } catch (error) {
      console.error("Share error:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Pro Camera
            </h1>
            <p className="text-secondary">Professional camera with zoom, timer, and quality controls</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Camera View */}
            <div className="lg:col-span-3 space-y-4">
              {!capturedImage ? (
                <motion.div className="relative w-full rounded-lg overflow-hidden bg-surface border border-border aspect-video md:aspect-auto md:h-[500px]">
                  {isCameraReady ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover transition-transform"
                        style={{ transform: `scale(${zoom})` }}
                      />

                      {isTimerActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-6xl font-bold text-white"
                          >
                            {timerSeconds}
                          </motion.div>
                        </div>
                      )}

                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <button
                          onClick={() => setShowSettings(!showSettings)}
                          className="p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors backdrop-blur-sm"
                          title="Settings"
                        >
                          <Settings className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                        <button
                          onClick={() => handleZoom("in")}
                          disabled={zoom >= 5}
                          className="p-3 bg-black/50 hover:bg-black/70 disabled:opacity-50 rounded-full text-white transition-colors backdrop-blur-sm"
                          title={`Zoom: ${zoom.toFixed(1)}x`}
                        >
                          <ZoomIn className="w-5 h-5" />
                        </button>
                        <div className="text-xs text-white bg-black/50 px-2 py-1 rounded text-center backdrop-blur-sm">
                          {zoom.toFixed(1)}x
                        </div>
                        <button
                          onClick={() => handleZoom("out")}
                          disabled={zoom <= 1}
                          className="p-3 bg-black/50 hover:bg-black/70 disabled:opacity-50 rounded-full text-white transition-colors backdrop-blur-sm"
                          title="Zoom out"
                        >
                          <ZoomOut className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                        {cameras.length > 1 && (
                          <button
                            onClick={toggleFacingMode}
                            className="p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors backdrop-blur-sm"
                            title="Switch camera"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setTimerSeconds(3)
                            setIsTimerActive(true)
                          }}
                          className={`p-3 rounded-full transition-colors backdrop-blur-sm ${
                            timerSeconds > 0
                              ? "bg-primary text-primary-foreground"
                              : "bg-black/50 hover:bg-black/70 text-white"
                          }`}
                          title="3s Timer"
                        >
                          <Clock className="w-5 h-5" />
                        </button>
                        <button
                          onClick={capturePhoto}
                          disabled={isTimerActive}
                          className="w-16 h-16 bg-primary hover:brightness-110 disabled:opacity-50 rounded-full flex items-center justify-center shadow-lg transition-all"
                        >
                          <Camera className="w-8 h-8 text-primary-foreground" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                      <Loader className="w-12 h-12 text-primary animate-spin" />
                      <p className="text-secondary">Initializing camera...</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="captured"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative w-full rounded-lg overflow-hidden bg-surface border border-border"
                >
                  <img src={capturedImage || "/placeholder.svg"} alt="Captured" className="w-full h-auto" />
                </motion.div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                {capturedImage && (
                  <>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={retakePhoto}
                      className="flex-1 sm:flex-none px-6 py-3 border border-border rounded-lg hover:bg-surface transition-colors text-sm sm:text-base"
                    >
                      Retake
                    </motion.button>
                    {uploadedUrl && (
                      <>
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => navigator.clipboard.writeText(uploadedUrl)}
                          className="flex-1 sm:flex-none px-6 py-3 border border-border rounded-lg hover:bg-surface transition-colors text-sm sm:text-base"
                        >
                          <Download className="w-4 h-4 inline mr-2" />
                          Copy
                        </motion.button>
                        {navigator.share && (
                          <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={shareImage}
                            className="flex-1 sm:flex-none px-6 py-3 border border-border rounded-lg hover:bg-surface transition-colors text-sm sm:text-base"
                          >
                            <Share2 className="w-4 h-4 inline mr-2" />
                            Share
                          </motion.button>
                        )}
                      </>
                    )}
                  </>
                )}

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={capturedImage ? uploadPhoto : capturePhoto}
                  disabled={isUploading || isProcessingBlur}
                  className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {isProcessingBlur ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : isUploading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : capturedImage ? (
                    "Upload Photo"
                  ) : (
                    "Take Photo"
                  )}
                </motion.button>
              </div>

              {/* Upload Success */}
              {uploadedUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-3"
                >
                  <p className="text-sm text-primary font-semibold">Photo uploaded successfully!</p>
                  <input
                    type="text"
                    value={uploadedUrl}
                    readOnly
                    className="w-full px-3 py-2 bg-surface border border-border rounded text-sm text-secondary"
                  />
                </motion.div>
              )}
            </div>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="lg:col-span-1 space-y-4"
                >
                  <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold text-primary">Camera Settings</h3>

                    {/* Quality Setting */}
                    <div className="space-y-2">
                      <label className="text-sm text-secondary">Quality</label>
                      <div className="flex gap-2">
                        {(["high", "medium", "low"] as const).map((q) => (
                          <button
                            key={q}
                            onClick={() => setQuality(q)}
                            className={`flex-1 py-2 rounded text-sm transition-colors ${
                              quality === q
                                ? "bg-primary text-primary-foreground"
                                : "border border-border hover:bg-surface"
                            }`}
                          >
                            {q.charAt(0).toUpperCase() + q.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Camera Selection */}
                    {cameras.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm text-secondary">Camera</label>
                        <select
                          value={selectedCameraId}
                          onChange={(e) => switchCamera(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                        >
                          {cameras.map((camera) => (
                            <option key={camera.deviceId} value={camera.deviceId}>
                              {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Background Blur */}
                    <div className="space-y-2">
                      <label className="text-sm text-secondary flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={enableBlur}
                          onChange={(e) => setEnableBlur(e.target.checked)}
                          className="w-4 h-4"
                        />
                        Background Blur
                      </label>
                      <p className="text-xs text-secondary">Applies subtle background blur to photos</p>
                    </div>

                    {/* Plan Info */}
                    <div className="pt-2 border-t border-border space-y-2">
                      <p className="text-xs text-secondary">
                        <span className="font-semibold text-primary">{config.maxFileSize / 1024 / 1024}MB</span> per
                        photo
                      </p>
                      {!isUserPro && !isLoggedIn && (
                        <p className="text-xs text-secondary">Sign in to increase your limit to 15MB</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* Hidden Elements */}
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
    </div>
  )
}
