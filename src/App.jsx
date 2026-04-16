import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const SCREEN_STORAGE_KEY = 'designx-current-screen'
const SPLASH_TRANSITION_MS = 680
const SCANNER_QR_TARGETS = {
  scanner: 'DESIGNX:SCAN:D',
  'scanner-e': 'DESIGNX:SCAN:E',
  'scanner-s': 'DESIGNX:SCAN:S',
  'scanner-i': 'DESIGNX:SCAN:I',
  'scanner-g': 'DESIGNX:SCAN:G',
  'scanner-n': 'DESIGNX:SCAN:N',
  'scanner-x': 'DESIGNX:SCAN:X',
}
const SCANNER_SCREENS = Object.keys(SCANNER_QR_TARGETS)
let jsQrDecoderPromise

const loadJsQrDecoder = () => {
  if (!jsQrDecoderPromise) {
    jsQrDecoderPromise = import('jsqr').then((module) => module.default)
  }
  return jsQrDecoderPromise
}

const ALL_SCREENS = [
  'splash',
  'intro',
  'challenge-1',
  'challenge-2',
  'challenge-3',
  'play',
  'entry-1',
  'scanner',
  'scanner-complete',
  'scanner-e',
  'scanner-e-complete',
  'scanner-s',
  'scanner-s-complete',
  'scanner-i',
  'scanner-i-complete',
  'scanner-g',
  'scanner-g-complete',
  'scanner-n',
  'scanner-n-complete',
  'scanner-x',
  'final',
]

const nextScreenMap = {
  intro: 'challenge-1',
  'challenge-1': 'challenge-2',
  'challenge-2': 'challenge-3',
  'challenge-3': 'play',
  play: 'entry-1',
  'entry-1': 'scanner',
  scanner: 'scanner-complete',
  'scanner-complete': 'scanner-e',
  'scanner-e': 'scanner-e-complete',
  'scanner-e-complete': 'scanner-s',
  'scanner-s': 'scanner-s-complete',
  'scanner-s-complete': 'scanner-i',
  'scanner-i': 'scanner-i-complete',
  'scanner-i-complete': 'scanner-g',
  'scanner-g': 'scanner-g-complete',
  'scanner-g-complete': 'scanner-n',
  'scanner-n': 'scanner-n-complete',
  'scanner-n-complete': 'scanner-x',
  'scanner-x': 'final',
}

const previousScreenMap = {
  intro: 'splash',
  'challenge-1': 'intro',
  'challenge-2': 'challenge-1',
  'challenge-3': 'challenge-2',
  play: 'challenge-3',
  'entry-1': 'play',
  scanner: 'entry-1',
  'scanner-complete': 'scanner',
  'scanner-e': 'scanner-complete',
  'scanner-e-complete': 'scanner-e',
  'scanner-s': 'scanner-e-complete',
  'scanner-s-complete': 'scanner-s',
  'scanner-i': 'scanner-s-complete',
  'scanner-i-complete': 'scanner-i',
  'scanner-g': 'scanner-i-complete',
  'scanner-g-complete': 'scanner-g',
  'scanner-n': 'scanner-g-complete',
  'scanner-n-complete': 'scanner-n',
  'scanner-x': 'scanner-n-complete',
  final: 'scanner-x',
}

function App() {
  const [screen, setScreen] = useState(() => {
    if (typeof window === 'undefined') return 'splash'
    const savedScreen = window.localStorage.getItem(SCREEN_STORAGE_KEY)
    return savedScreen && ALL_SCREENS.includes(savedScreen) ? savedScreen : 'splash'
  })
  const [showSpeech, setShowSpeech] = useState(false)
  const [isSplashTransitioning, setIsSplashTransitioning] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [isScanFallbackEnabled, setIsScanFallbackEnabled] = useState(false)
  const splashTransitionTimerRef = useRef(null)
  const scannerVideoRef = useRef(null)
  const scannerEVideoRef = useRef(null)
  const scannerSVideoRef = useRef(null)
  const scannerIVideoRef = useRef(null)
  const scannerGVideoRef = useRef(null)
  const scannerNVideoRef = useRef(null)
  const scannerXVideoRef = useRef(null)

  // JS-driven scaling — fill the phone screen edge to edge
  useEffect(() => {
    const updateScale = () => {
      const vp = window.visualViewport
      const w = vp ? vp.width : window.innerWidth
      const h = vp ? vp.height : window.innerHeight
      // Scale to FILL the screen (no gaps/edges), shell clips overflow
      const scale = Math.max(w / 393, h / 852)
      document.documentElement.style.setProperty('--frame-scale', scale.toFixed(4))
    }
    updateScale()
    const vp = window.visualViewport
    if (vp) {
      vp.addEventListener('resize', updateScale)
      vp.addEventListener('scroll', updateScale)
    }
    window.addEventListener('resize', updateScale)
    window.addEventListener('orientationchange', updateScale)
    return () => {
      if (vp) {
        vp.removeEventListener('resize', updateScale)
        vp.removeEventListener('scroll', updateScale)
      }
      window.removeEventListener('resize', updateScale)
      window.removeEventListener('orientationchange', updateScale)
    }
  }, [])

  useEffect(() => {
    if (screen !== 'intro') return

    const timer = window.setTimeout(() => {
      setShowSpeech(true)
    }, 700)

    return () => window.clearTimeout(timer)
  }, [screen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SCREEN_STORAGE_KEY, screen)
  }, [screen])

  useEffect(() => () => {
    if (!splashTransitionTimerRef.current) return
    window.clearTimeout(splashTransitionTimerRef.current)
  }, [])

  useEffect(() => {
    if (!SCANNER_SCREENS.includes(screen)) return

    let isActive = true
    let stream
    let scanTimer
    let barcodeDetector = null
    let isDecoding = false
    const videoElementByScreen = {
      scanner: scannerVideoRef.current,
      'scanner-e': scannerEVideoRef.current,
      'scanner-s': scannerSVideoRef.current,
      'scanner-i': scannerIVideoRef.current,
      'scanner-g': scannerGVideoRef.current,
      'scanner-n': scannerNVideoRef.current,
      'scanner-x': scannerXVideoRef.current,
    }
    const videoElement = videoElementByScreen[screen]
    const expectedPayload = SCANNER_QR_TARGETS[screen]
    const expectedLetter = expectedPayload.at(-1)
    const frameCanvas = document.createElement('canvas')
    const frameContext = frameCanvas.getContext('2d', { willReadFrequently: true })

    const stopStream = () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        stream = null
      }
      if (videoElement) {
        videoElement.srcObject = null
      }
    }

    const stopScanTimer = () => {
      if (!scanTimer) return
      window.clearInterval(scanTimer)
      scanTimer = null
    }

    const decodeWithJsQr = async () => {
      if (!videoElement || !frameContext) return ''
      const width = videoElement.videoWidth
      const height = videoElement.videoHeight
      if (!width || !height) return ''

      if (frameCanvas.width !== width || frameCanvas.height !== height) {
        frameCanvas.width = width
        frameCanvas.height = height
      }

      frameContext.drawImage(videoElement, 0, 0, width, height)
      const frame = frameContext.getImageData(0, 0, width, height)
      const jsQr = await loadJsQrDecoder()
      const code = jsQr(frame.data, width, height, { inversionAttempts: 'attemptBoth' })
      return code?.data?.trim()?.toUpperCase() ?? ''
    }

    const detectQrPayload = async () => {
      if (!videoElement || videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return ''

      if (barcodeDetector) {
        const results = await barcodeDetector.detect(videoElement)
        const match = results.find((item) => typeof item.rawValue === 'string')
        return match?.rawValue?.trim()?.toUpperCase() ?? ''
      }

      return decodeWithJsQr()
    }

    const startScanner = async () => {
      setCameraError('')
      setIsScanFallbackEnabled(false)

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera is not supported on this device.')
        setIsScanFallbackEnabled(true)
        return
      }

      try {
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          const supportedFormats = await window.BarcodeDetector.getSupportedFormats?.()
          if (!supportedFormats || supportedFormats.includes('qr_code')) {
            barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] })
          }
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })

        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        if (videoElement) {
          videoElement.srcObject = stream
          const playPromise = videoElement.play()
          if (playPromise) {
            await playPromise.catch(() => {})
          }
        }

        const scanFrame = async () => {
          if (!isActive || isDecoding) return
          isDecoding = true
          try {
            const detectedPayload = await detectQrPayload()
            if (!detectedPayload) return

            if (detectedPayload === expectedPayload) {
              const next = nextScreenMap[screen]
              stopScanTimer()
              stopStream()
              setCameraError('')
              setIsScanFallbackEnabled(false)
              if (next) setScreen(next)
              return
            }

            setCameraError(`Wrong QR code. Scan the ${expectedLetter} code.`)
          } catch {
            setCameraError('Unable to read QR right now. Hold the code steady and try again.')
          } finally {
            isDecoding = false
          }
        }

        scanTimer = window.setInterval(() => {
          void scanFrame()
        }, 300)

        setCameraError(`Scanning for ${expectedLetter}...`)
      } catch {
        if (isActive) {
          setCameraError('Camera access denied.')
          setIsScanFallbackEnabled(true)
        }
      }
    }

    void startScanner()

    return () => {
      isActive = false
      stopScanTimer()
      stopStream()
    }
  }, [screen])

  const handleSplashClick = () => {
    if (screen !== 'splash' || isSplashTransitioning) return
    setShowSpeech(false)
    setIsSplashTransitioning(true)
    splashTransitionTimerRef.current = window.setTimeout(() => {
      setScreen('intro')
      setIsSplashTransitioning(false)
      splashTransitionTimerRef.current = null
    }, SPLASH_TRANSITION_MS)
  }

  const handleBack = (e) => {
    if (e) e.stopPropagation()
    const previous = previousScreenMap[screen]
    if (!previous) return
    setScreen(previous)
  }

  const handleNext = () => {
    const next = nextScreenMap[screen]
    if (!next) return
    setScreen(next)
  }

  // Tap anywhere on a screen to advance
  const handleScreenTap = useCallback((e) => {
    if (e.target.closest('button, a, video')) return
    const next = nextScreenMap[screen]
    if (next) setScreen(next)
  }, [screen])

  return (
    <main className="app-shell">
      <div className="phone-frame-shell">
        <div className="phone-frame">
        <section
          className={`screen splash-screen ${screen === 'splash' ? 'is-active' : 'is-exit'} ${isSplashTransitioning ? 'is-transitioning' : ''}`}
          onClick={handleSplashClick}
        >
          <div className="grid-overlay" />
          <div className="splash-content">
            <p className="welcome-text typing-text">WELCOME TO</p>
            <h1 className="logo-text animated-title">DESIGN</h1>
            <img className="pixel-x-large" src="/assets/pixel-x.svg" alt="DesignX logo" />
            <p className="splash-tap-hint">tap to continue</p>
          </div>
        </section>

        <section
          className={`screen intro-screen ${screen === 'intro' ? 'is-active' : 'is-hidden'}`}
          onClick={handleScreenTap}
        >
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <h2 className="intro-logo animated-title">DESIGN</h2>

          <div className="pixel-dots dots-left" aria-hidden="true">
            <span /><span /><span />
            <span /><span /><span />
            <span /><span /><span />
            <span /><span /><span />
          </div>
          <div className="pixel-dots dots-right" aria-hidden="true">
            <span /><span />
            <span /><span />
          </div>

          <div className={`speech-bubble ${showSpeech ? 'is-visible' : ''}`}>
            <p className="typing-text">
              Hey!!<br />
              I am your<br />
              buddy <strong>Neero</strong>
            </p>
          </div>

          <img className="intro-pixel-x" src="/assets/pixel-x.svg" alt="" aria-hidden="true" />
          <img className="neero-character" src="/assets/neero.svg" alt="Neero" />

          <button className="next-btn" type="button" aria-label="Next screen" onClick={handleNext}>
            &#8250;&#8250;
          </button>
        </section>

        <section
          className={`screen challenge-screen ${screen === 'challenge-1' ? 'is-active' : 'is-hidden'}`}
          onClick={handleScreenTap}
        >
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <h2 className="challenge-logo animated-title">DESIGN</h2>

          <div className="pixel-dots challenge-dots-left" aria-hidden="true">
            <span /><span /><span />
            <span /><span /><span />
            <span /><span /><span />
            <span /><span /><span />
          </div>

          <div className="pixel-dots challenge-dots-right" aria-hidden="true">
            <span /><span />
          </div>

          <div className="challenge-bubble">
            <p className="typing-text">
              I have a<br />
              challenge<br />
              for you to find<br />
              the <strong>‘X’</strong> !!!
            </p>
          </div>

          <img className="challenge-pixel-x" src="/assets/pixel-x.svg" alt="" aria-hidden="true" />
          <img className="challenge-neero" src="/assets/copilot-image-8732b3.png" alt="Neero pointing" />

          <button className="next-btn challenge-next-btn" type="button" aria-label="Next screen" onClick={handleNext}>
            &#8250;&#8250;
          </button>
        </section>

        <section
          className={`screen challenge-screen challenge-screen-two ${screen === 'challenge-2' ? 'is-active' : 'is-hidden'}`}
          onClick={handleScreenTap}
        >
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <h2 className="challenge-logo animated-title">DESIGN</h2>

          <div className="pixel-dots challenge-dots-left" aria-hidden="true">
            <span /><span /><span />
            <span /><span /><span />
            <span /><span /><span />
            <span /><span /><span />
          </div>

          <div className="pixel-dots challenge-two-dots-right" aria-hidden="true">
            <span /><span />
            <span /><span />
          </div>

          <div className="challenge-bubble challenge-bubble-two">
            <p className="typing-text">
              well not that<br />
              <strong>ex</strong> though !!
            </p>
          </div>

          <img className="challenge-pixel-x" src="/assets/pixel-x.svg" alt="" aria-hidden="true" />
          <img className="challenge-neero challenge-neero-two" src="/assets/copilot-image-f2b11c.png" alt="Neero" />

          <button className="next-btn challenge-next-btn" type="button" aria-label="Next screen" onClick={handleNext}>
            &#8250;&#8250;
          </button>
        </section>

        <section
          className={`screen challenge-screen challenge-screen-three ${screen === 'challenge-3' ? 'is-active' : 'is-hidden'}`}
          onClick={handleScreenTap}
        >
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <h2 className="challenge-logo animated-title">DESIGN</h2>

          <div className="pixel-dots challenge-dots-left" aria-hidden="true">
            <span /><span /><span />
            <span /><span /><span />
            <span /><span /><span />
            <span /><span /><span />
          </div>

          <div className="pixel-dots challenge-two-dots-right" aria-hidden="true">
            <span /><span />
            <span /><span />
          </div>

          <div className="challenge-bubble challenge-bubble-three">
            <p className="typing-text">
              not that <strong>“x”</strong><br />
              either!!
            </p>
          </div>

          <img className="challenge-pixel-x" src="/assets/pixel-x.svg" alt="" aria-hidden="true" />
          <img className="challenge-neero challenge-neero-three" src="/assets/copilot-image-f9c398.png" alt="Neero" />

          <button className="next-btn challenge-next-btn" type="button" aria-label="Next screen" onClick={handleNext}>
            &#8250;&#8250;
          </button>
        </section>

        <section className={`screen play-screen ${screen === 'play' ? 'is-active' : 'is-hidden'}`} onClick={handleScreenTap}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <h2 className="challenge-logo animated-title">DESIGN</h2>

          <img className="play-pixel-x" src="/assets/pixel-x.svg" alt="" aria-hidden="true" />

          <div className="play-bubble">
            <p className="typing-text">Let&apos;s Play !</p>
          </div>

          <img className="challenge-neero play-neero" src="/assets/copilot-image-62db2b.png" alt="Neero" />

          <button className="play-btn" type="button" aria-label="Play" onClick={handleNext}>
            Play
          </button>
        </section>

        <section className={`screen entry-screen ${screen === 'entry-1' ? 'is-active' : 'is-hidden'}`} onClick={handleScreenTap}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="entry-watermark animated-title" aria-hidden="true">DESIGNX</p>

          <div className="pixel-dots entry-dots-left" aria-hidden="true">
            <span /><span /><span /><span />
          </div>
          <div className="pixel-dots entry-dots-right" aria-hidden="true">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>

          <div className="entry-bubble">
            <p className="typing-text">
              Before the real beginning, one<br />
              stands still...<br />
              But the true entrance waits further,<br />
              if you will.
            </p>
          </div>

          <img className="challenge-neero entry-neero" src="/assets/copilot-image-c686ee.png" alt="Neero" />

          <button className="next-btn entry-next-btn" type="button" aria-label="Next screen" onClick={handleNext}>
            &#8250;&#8250;
          </button>
        </section>

        <section className={`screen scanner-screen ${screen === 'scanner' ? 'is-active' : 'is-hidden'}`} onClick={handleScreenTap}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-watermark animated-title" aria-hidden="true">DESIGNX</p>

          <div className="pixel-dots scanner-dots-left" aria-hidden="true">
            <span /><span /><span /><span />
          </div>

          <div className="pixel-dots scanner-dots-right" aria-hidden="true">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>

          <div className="scanner-tap-target">
            <div className="scanner-frame">
              <video ref={scannerVideoRef} className="scanner-video" autoPlay muted playsInline />
              <span className="scanner-corner corner-top-left" />
              <span className="scanner-corner corner-top-right" />
              <span className="scanner-corner corner-bottom-left" />
              <span className="scanner-corner corner-bottom-right" />
            </div>
          </div>

          <p className="scanner-label typing-text">scan to find D</p>
          {cameraError ? <p className="scanner-error">{cameraError}</p> : null}
          {isScanFallbackEnabled ? (
            <button className="scanner-fallback-btn" type="button" onClick={handleNext}>
              Continue without camera
            </button>
          ) : null}
        </section>

        <section className={`screen scanner-complete-screen ${screen === 'scanner-complete' ? 'is-active' : 'is-hidden'}`} onClick={handleScreenTap}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-complete-word animated-title" aria-label="DESIGNX">
            <span className="scanner-complete-d">D</span>
            <span className="scanner-complete-rest">ESIGNX</span>
          </p>

          <div className="pixel-dots scanner-complete-dots-left" aria-hidden="true">
            <span /><span /><span /><span />
          </div>
          <div className="pixel-dots scanner-complete-dots-right" aria-hidden="true">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>

          <div className="scanner-complete-bubble">
            <p className="typing-text">
              Gate said Hi, pickup said wait...<br />
              I&apos;m just vibing in between, mate
            </p>
          </div>

          <img className="scanner-complete-character" src="/assets/copilot-image-20cad2.png" alt="Neero" />

          <button className="next-btn scanner-complete-next-btn" type="button" aria-label="Next screen" onClick={handleNext}>
            &#8250;&#8250;
          </button>
        </section>

        <section className={`screen scanner-screen scanner-screen-e ${screen === 'scanner-e' ? 'is-active' : 'is-hidden'}`} onClick={handleScreenTap}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-e-watermark animated-title" aria-label="DESIGNX">
            <span className="scanner-e-found">D</span>
            <span className="scanner-e-rest">ESIGNX</span>
          </p>

          <div className="pixel-dots scanner-dots-left" aria-hidden="true">
            <span /><span /><span /><span />
          </div>

          <div className="pixel-dots scanner-dots-right" aria-hidden="true">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>

          <div className="scanner-tap-target">
            <div className="scanner-frame">
              <video ref={scannerEVideoRef} className="scanner-video" autoPlay muted playsInline />
              <span className="scanner-corner corner-top-left" />
              <span className="scanner-corner corner-top-right" />
              <span className="scanner-corner corner-bottom-left" />
              <span className="scanner-corner corner-bottom-right" />
            </div>
          </div>

          <p className="scanner-label typing-text">scan to find E</p>
          {cameraError ? <p className="scanner-error">{cameraError}</p> : null}
          {isScanFallbackEnabled ? (
            <button className="scanner-fallback-btn" type="button" onClick={handleNext}>
              Continue without camera
            </button>
          ) : null}
        </section>

        <section className={`screen scanner-complete-screen scanner-e-complete-screen ${screen === 'scanner-e-complete' ? 'is-active' : 'is-hidden'}`} onClick={handleScreenTap}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-e-complete-word animated-title" aria-label="DESIGNX">
            <span className="scanner-e-complete-d">D</span>
            <span className="scanner-e-complete-e">E</span>
            <span className="scanner-e-complete-rest">SIGNX</span>
          </p>

          <div className="pixel-dots scanner-complete-dots-left" aria-hidden="true">
            <span /><span /><span /><span />
          </div>
          <div className="pixel-dots scanner-complete-dots-right" aria-hidden="true">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>

          <div className="scanner-complete-bubble scanner-e-complete-bubble">
            <p className="typing-text">
              No lectures here, no entry line,<br />
              Just people waiting, that&apos;s my sign
            </p>
          </div>

          <img className="scanner-complete-character scanner-e-complete-character" src="/assets/copilot-image-6ede49.png" alt="Neero" />

          <button className="next-btn scanner-complete-next-btn" type="button" aria-label="Next screen" onClick={handleNext}>
            &#8250;&#8250;
          </button>
        </section>

        <section className={`screen scanner-screen scanner-screen-s ${screen === 'scanner-s' ? 'is-active' : 'is-hidden'}`} onClick={handleScreenTap}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-s-watermark animated-title" aria-label="DESIGNX">
            <span className="scanner-s-found">DE</span>
            <span className="scanner-s-rest">SIGNX</span>
          </p>

          <div className="pixel-dots scanner-dots-left" aria-hidden="true">
            <span /><span /><span /><span />
          </div>

          <div className="pixel-dots scanner-dots-right" aria-hidden="true">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>

          <div className="scanner-tap-target">
            <div className="scanner-frame">
              <video ref={scannerSVideoRef} className="scanner-video" autoPlay muted playsInline />
              <span className="scanner-corner corner-top-left" />
              <span className="scanner-corner corner-top-right" />
              <span className="scanner-corner corner-bottom-left" />
              <span className="scanner-corner corner-bottom-right" />
            </div>
          </div>

          <p className="scanner-label typing-text">scan to find S</p>
          {cameraError ? <p className="scanner-error">{cameraError}</p> : null}
          {isScanFallbackEnabled ? (
            <button className="scanner-fallback-btn" type="button" onClick={handleNext}>
              Continue without camera
            </button>
          ) : null}
        </section>

        <section className={`screen scanner-complete-screen scanner-s-complete-screen ${screen === 'scanner-s-complete' ? 'is-active' : 'is-hidden'}`} onClick={handleScreenTap}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-s-complete-word animated-title" aria-label="DESIGNX">
            <span className="scanner-s-complete-de">DE</span>
            <span className="scanner-s-complete-s">S</span>
            <span className="scanner-s-complete-rest">IGNX</span>
          </p>

          <div className="pixel-dots scanner-complete-dots-left" aria-hidden="true">
            <span /><span /><span /><span />
          </div>
          <div className="pixel-dots scanner-complete-dots-right" aria-hidden="true">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>

          <div className="scanner-complete-bubble scanner-s-complete-bubble">
            <p className="typing-text">
              I&apos;m not inside where brains attack,<br />
              I&apos;m just chilling outside the block
            </p>
          </div>

          <img className="scanner-complete-character scanner-s-complete-character" src="/assets/copilot-image-298225.png" alt="Neero" />

          <button className="next-btn scanner-complete-next-btn" type="button" aria-label="Next screen" onClick={handleNext}>
            &#8250;&#8250;
          </button>
        </section>

        <section className={`screen scanner-screen scanner-screen-i ${screen === 'scanner-i' ? 'is-active' : 'is-hidden'}`} onClick={handleScreenTap}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-i-watermark animated-title" aria-label="DESIGNX">
            <span className="scanner-i-found">DES</span>
            <span className="scanner-i-rest">IGNX</span>
          </p>

          <div className="pixel-dots scanner-dots-left" aria-hidden="true">
            <span /><span /><span /><span />
          </div>

          <div className="pixel-dots scanner-dots-right" aria-hidden="true">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>

          <div className="scanner-tap-target">
            <div className="scanner-frame">
              <video ref={scannerIVideoRef} className="scanner-video" autoPlay muted playsInline />
              <span className="scanner-corner corner-top-left" />
              <span className="scanner-corner corner-top-right" />
              <span className="scanner-corner corner-bottom-left" />
              <span className="scanner-corner corner-bottom-right" />
            </div>
          </div>

          <p className="scanner-label typing-text">scan to find I</p>
          {cameraError ? <p className="scanner-error">{cameraError}</p> : null}
          {isScanFallbackEnabled ? (
            <button className="scanner-fallback-btn" type="button" onClick={handleNext}>
              Continue without camera
            </button>
          ) : null}
        </section>

        <section className={`screen scanner-complete-screen scanner-i-complete-screen ${screen === 'scanner-i-complete' ? 'is-active' : 'is-hidden'}`} onClick={handleScreenTap}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-i-complete-word animated-title" aria-label="DESIGNX">
            <span className="scanner-i-complete-des">DES</span>
            <span className="scanner-i-complete-i">I</span>
            <span className="scanner-i-complete-rest">GNX</span>
          </p>

          <div className="pixel-dots scanner-complete-dots-left" aria-hidden="true">
            <span /><span /><span /><span />
          </div>
          <div className="pixel-dots scanner-complete-dots-right" aria-hidden="true">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>

          <div className="scanner-complete-bubble scanner-i-complete-bubble">
            <p className="typing-text">
              I&apos;m not where crowds go rushing in,<br />
              I&apos;m where journeys quietly begin
            </p>
          </div>

          <img className="scanner-complete-character scanner-i-complete-character" src="/assets/copilot-image-77d40b.png" alt="Neero" />

          <button className="next-btn scanner-complete-next-btn" type="button" aria-label="Next screen" onClick={handleNext}>
            &#8250;&#8250;
          </button>
        </section>

        <section className={`screen scanner-screen scanner-screen-g ${screen === 'scanner-g' ? 'is-active' : 'is-hidden'}`} onClick={handleScreenTap}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-g-watermark animated-title" aria-label="DESIGNX">
            <span className="scanner-g-found">DESI</span>
            <span className="scanner-g-rest">GNX</span>
          </p>

          <div className="pixel-dots scanner-dots-left" aria-hidden="true">
            <span /><span /><span /><span />
          </div>

          <div className="pixel-dots scanner-dots-right" aria-hidden="true">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>

          <div className="scanner-tap-target">
            <div className="scanner-frame">
              <video ref={scannerGVideoRef} className="scanner-video" autoPlay muted playsInline />
              <span className="scanner-corner corner-top-left" />
              <span className="scanner-corner corner-top-right" />
              <span className="scanner-corner corner-bottom-left" />
              <span className="scanner-corner corner-bottom-right" />
            </div>
          </div>

          <p className="scanner-label typing-text">scan to find G</p>
          {cameraError ? <p className="scanner-error">{cameraError}</p> : null}
          {isScanFallbackEnabled ? (
            <button className="scanner-fallback-btn" type="button" onClick={handleNext}>
              Continue without camera
            </button>
          ) : null}
        </section>

        <section className={`screen scanner-complete-screen scanner-g-complete-screen ${screen === 'scanner-g-complete' ? 'is-active' : 'is-hidden'}`} onClick={handleScreenTap}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-g-complete-word animated-title" aria-label="DESIGNX">
            <span className="scanner-g-complete-desi">DESI</span>
            <span className="scanner-g-complete-g">G</span>
            <span className="scanner-g-complete-rest">NX</span>
          </p>

          <div className="pixel-dots scanner-complete-dots-left" aria-hidden="true">
            <span /><span /><span /><span />
          </div>
          <div className="pixel-dots scanner-complete-dots-right" aria-hidden="true">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>

          <div className="scanner-complete-bubble scanner-g-complete-bubble">
            <p className="typing-text">
              You won&apos;t find me in noisy halls,<br />
              I&apos;m tucked where calm and shadow falls
            </p>
          </div>

          <img className="scanner-complete-character scanner-g-complete-character" src="/assets/copilot-image-239ba5.png" alt="Neero" />

          <button className="next-btn scanner-complete-next-btn" type="button" aria-label="Next screen" onClick={handleNext}>
            &#8250;&#8250;
          </button>
        </section>

        <section className={`screen scanner-screen scanner-screen-n ${screen === 'scanner-n' ? 'is-active' : 'is-hidden'}`} onClick={handleScreenTap}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-n-watermark animated-title" aria-label="DESIGNX">
            <span className="scanner-n-found">DESIG</span>
            <span className="scanner-n-rest">NX</span>
          </p>

          <div className="pixel-dots scanner-dots-left" aria-hidden="true">
            <span /><span /><span /><span />
          </div>

          <div className="pixel-dots scanner-dots-right" aria-hidden="true">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>

          <div className="scanner-tap-target">
            <div className="scanner-frame">
              <video ref={scannerNVideoRef} className="scanner-video" autoPlay muted playsInline />
              <span className="scanner-corner corner-top-left" />
              <span className="scanner-corner corner-top-right" />
              <span className="scanner-corner corner-bottom-left" />
              <span className="scanner-corner corner-bottom-right" />
            </div>
          </div>

          <p className="scanner-label typing-text">scan to find N</p>
          {cameraError ? <p className="scanner-error">{cameraError}</p> : null}
          {isScanFallbackEnabled ? (
            <button className="scanner-fallback-btn" type="button" onClick={handleNext}>
              Continue without camera
            </button>
          ) : null}
        </section>

        <section className={`screen scanner-complete-screen scanner-n-complete-screen ${screen === 'scanner-n-complete' ? 'is-active' : 'is-hidden'}`} onClick={handleScreenTap}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-n-complete-word animated-title" aria-label="DESIGNX">
            <span className="scanner-n-complete-design">DESIG</span>
            <span className="scanner-n-complete-n">N</span>
            <span className="scanner-n-complete-rest">X</span>
          </p>

          <div className="pixel-dots scanner-complete-dots-left" aria-hidden="true">
            <span /><span /><span /><span />
          </div>
          <div className="pixel-dots scanner-complete-dots-right" aria-hidden="true">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>

          <div className="scanner-complete-bubble scanner-n-complete-bubble">
            <p className="typing-text">
              Last clue lands where pathways bend,<br />
              One more step and reach the end
            </p>
          </div>

          <img
            className="scanner-complete-character scanner-n-complete-character"
            src="/assets/copilot-image-5f6116.png"
            alt="Neero"
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = '/assets/copilot-image-239ba5.png'
            }}
          />

          <button className="next-btn scanner-complete-next-btn" type="button" aria-label="Next screen" onClick={handleNext}>
            &#8250;&#8250;
          </button>
        </section>

        <section className={`screen scanner-screen scanner-screen-x ${screen === 'scanner-x' ? 'is-active' : 'is-hidden'}`} onClick={handleScreenTap}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-n-watermark animated-title" aria-label="DESIGNX">
            <span className="scanner-n-found">DESIGN</span>
            <span className="scanner-n-rest">X</span>
          </p>

          <div className="pixel-dots scanner-dots-left" aria-hidden="true">
            <span /><span /><span /><span />
          </div>

          <div className="pixel-dots scanner-dots-right" aria-hidden="true">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>

          <div className="scanner-tap-target">
            <div className="scanner-frame">
              <video ref={scannerXVideoRef} className="scanner-video" autoPlay muted playsInline />
              <span className="scanner-corner corner-top-left" />
              <span className="scanner-corner corner-top-right" />
              <span className="scanner-corner corner-bottom-left" />
              <span className="scanner-corner corner-bottom-right" />
            </div>
          </div>

          <p className="scanner-label typing-text">scan to find X</p>
          {cameraError ? <p className="scanner-error">{cameraError}</p> : null}
          {isScanFallbackEnabled ? (
            <button className="scanner-fallback-btn" type="button" onClick={handleNext}>
              Continue without camera
            </button>
          ) : null}
        </section>

        <section className={`screen final-screen ${screen === 'final' ? 'is-active' : 'is-hidden'}`} onClick={handleScreenTap}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <div className="final-graffiti-burst" aria-hidden="true">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>

          <h2 className="final-logo animated-title" aria-label="DESIGNX">
            <span className="final-logo-text">DESIGN</span>
            <img className="final-logo-x" src="/assets/pixel-x.svg" alt="" aria-hidden="true" />
          </h2>

          <div className="pixel-dots final-dots-left" aria-hidden="true">
            <span /><span />
            <span /><span />
            <span /><span />
          </div>

          <div className="pixel-dots final-dots-right" aria-hidden="true">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>

          <img className="final-main-x" src="/assets/pixel-x.svg" alt="" aria-hidden="true" />
          <img className="final-character" src="/assets/copilot-image-6a235e.png" alt="Neero celebrating" />
          <p className="final-message typing-text">CONGRATULATIONS!</p>
        </section>
        </div>
      </div>
    </main>
  )
}

export default App
