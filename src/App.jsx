import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const [screen, setScreen] = useState('splash')
  const [showSpeech, setShowSpeech] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const scannerVideoRef = useRef(null)
  const scannerEVideoRef = useRef(null)
  const scannerSVideoRef = useRef(null)
  const scannerIVideoRef = useRef(null)
  const scannerGVideoRef = useRef(null)
  const scannerNVideoRef = useRef(null)
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
  }

  useEffect(() => {
    if (screen !== 'intro') return

    const timer = window.setTimeout(() => {
      setShowSpeech(true)
    }, 700)

    return () => window.clearTimeout(timer)
  }, [screen])

  useEffect(() => {
    if (
      screen !== 'scanner'
      && screen !== 'scanner-e'
      && screen !== 'scanner-s'
      && screen !== 'scanner-i'
      && screen !== 'scanner-g'
      && screen !== 'scanner-n'
    ) return

    let isActive = true
    let stream
    const videoElementByScreen = {
      scanner: scannerVideoRef.current,
      'scanner-e': scannerEVideoRef.current,
      'scanner-s': scannerSVideoRef.current,
      'scanner-i': scannerIVideoRef.current,
      'scanner-g': scannerGVideoRef.current,
      'scanner-n': scannerNVideoRef.current,
    }
    const videoElement = videoElementByScreen[screen]

    const stopStream = () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        stream = null
      }
      if (videoElement) {
        videoElement.srcObject = null
      }
    }

    const startScanner = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera is not supported on this device.')
        return
      }

      try {
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

        setCameraError('')
      } catch {
        if (isActive) {
          setCameraError('Camera access denied. Tap scanner to continue for now.')
        }
      }
    }

    void startScanner()

    return () => {
      isActive = false
      stopStream()
    }
  }, [screen])

  const handleSplashClick = () => {
    if (screen !== 'splash') return
    setShowSpeech(false)
    setScreen('intro')
  }

  const handleBack = () => {
    const previous = previousScreenMap[screen]
    if (!previous) return
    setScreen(previous)
  }

  const handleNext = () => {
    const next = nextScreenMap[screen]
    if (!next) return
    setScreen(next)
  }

  return (
    <main className="app-shell">
      <div className="phone-frame">
        <section
          className={`screen splash-screen ${screen === 'splash' ? 'is-active' : 'is-exit'}`}
          onClick={handleSplashClick}
        >
          <div className="grid-overlay" />
          <div className="splash-content">
            <p className="welcome-text">WELCOME TO</p>
            <h1 className="logo-text">DESIGN</h1>
            <img className="pixel-x-large" src="/assets/pixel-x.svg" alt="DesignX logo" />
          </div>
        </section>

        <section
          className={`screen intro-screen ${screen === 'intro' ? 'is-active' : 'is-hidden'}`}
        >
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <h2 className="intro-logo">DESIGN</h2>

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
            <p>
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
        >
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <h2 className="challenge-logo">DESIGN</h2>

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
            <p>
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
        >
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <h2 className="challenge-logo">DESIGN</h2>

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
            <p>
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
        >
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <h2 className="challenge-logo">DESIGN</h2>

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
            <p>
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

        <section className={`screen play-screen ${screen === 'play' ? 'is-active' : 'is-hidden'}`}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <h2 className="challenge-logo">DESIGN</h2>

          <img className="play-pixel-x" src="/assets/pixel-x.svg" alt="" aria-hidden="true" />

          <div className="play-bubble">
            <p>Let&apos;s Play !</p>
          </div>

          <img className="challenge-neero play-neero" src="/assets/copilot-image-62db2b.png" alt="Neero" />

          <button className="play-btn" type="button" aria-label="Play" onClick={handleNext}>
            Play
          </button>
        </section>

        <section className={`screen entry-screen ${screen === 'entry-1' ? 'is-active' : 'is-hidden'}`}>
          <div className="grid-overlay" />
          <p className="entry-watermark" aria-hidden="true">DESIGNX</p>

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
            <p>
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

        <section className={`screen scanner-screen ${screen === 'scanner' ? 'is-active' : 'is-hidden'}`}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-watermark" aria-hidden="true">DESIGNX</p>

          <div className="pixel-dots scanner-dots-left" aria-hidden="true">
            <span /><span /><span /><span />
          </div>

          <div className="pixel-dots scanner-dots-right" aria-hidden="true">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>

          <button className="scanner-tap-target" type="button" aria-label="Mock QR scan success" onClick={handleNext}>
            <div className="scanner-frame">
              <video ref={scannerVideoRef} className="scanner-video" autoPlay muted playsInline />
              <span className="scanner-corner corner-top-left" />
              <span className="scanner-corner corner-top-right" />
              <span className="scanner-corner corner-bottom-left" />
              <span className="scanner-corner corner-bottom-right" />
            </div>
          </button>

          <p className="scanner-label">scan to find D</p>
          {cameraError ? <p className="scanner-error">{cameraError}</p> : null}
        </section>

        <section className={`screen scanner-complete-screen ${screen === 'scanner-complete' ? 'is-active' : 'is-hidden'}`}>
          <div className="grid-overlay" />
          <p className="scanner-complete-word" aria-label="DESIGNX">
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
            <p>
              Gate said Hi, pickup said wait...<br />
              I&apos;m just vibing in between, mate
            </p>
          </div>

          <img className="scanner-complete-character" src="/assets/copilot-image-20cad2.png" alt="Neero" />

          <button className="next-btn scanner-complete-next-btn" type="button" aria-label="Next screen" onClick={handleNext}>
            &#8250;&#8250;
          </button>
        </section>

        <section className={`screen scanner-screen scanner-screen-e ${screen === 'scanner-e' ? 'is-active' : 'is-hidden'}`}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-e-watermark" aria-label="DESIGNX">
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

          <button className="scanner-tap-target" type="button" aria-label="Mock QR scan success" onClick={handleNext}>
            <div className="scanner-frame">
              <video ref={scannerEVideoRef} className="scanner-video" autoPlay muted playsInline />
              <span className="scanner-corner corner-top-left" />
              <span className="scanner-corner corner-top-right" />
              <span className="scanner-corner corner-bottom-left" />
              <span className="scanner-corner corner-bottom-right" />
            </div>
          </button>

          <p className="scanner-label">scan to find E</p>
          {cameraError ? <p className="scanner-error">{cameraError}</p> : null}
        </section>

        <section className={`screen scanner-complete-screen scanner-e-complete-screen ${screen === 'scanner-e-complete' ? 'is-active' : 'is-hidden'}`}>
          <div className="grid-overlay" />
          <p className="scanner-e-complete-word" aria-label="DESIGNX">
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
            <p>
              No lectures here, no entry line,<br />
              Just people waiting, that&apos;s my sign
            </p>
          </div>

          <img className="scanner-complete-character scanner-e-complete-character" src="/assets/copilot-image-6ede49.png" alt="Neero" />

          <button className="next-btn scanner-complete-next-btn" type="button" aria-label="Next screen" onClick={handleNext}>
            &#8250;&#8250;
          </button>
        </section>

        <section className={`screen scanner-screen scanner-screen-s ${screen === 'scanner-s' ? 'is-active' : 'is-hidden'}`}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-s-watermark" aria-label="DESIGNX">
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

          <button className="scanner-tap-target" type="button" aria-label="Mock QR scan success" onClick={handleNext}>
            <div className="scanner-frame">
              <video ref={scannerSVideoRef} className="scanner-video" autoPlay muted playsInline />
              <span className="scanner-corner corner-top-left" />
              <span className="scanner-corner corner-top-right" />
              <span className="scanner-corner corner-bottom-left" />
              <span className="scanner-corner corner-bottom-right" />
            </div>
          </button>

          <p className="scanner-label">scan to find S</p>
          {cameraError ? <p className="scanner-error">{cameraError}</p> : null}
        </section>

        <section className={`screen scanner-complete-screen scanner-s-complete-screen ${screen === 'scanner-s-complete' ? 'is-active' : 'is-hidden'}`}>
          <div className="grid-overlay" />
          <p className="scanner-s-complete-word" aria-label="DESIGNX">
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
            <p>
              I&apos;m not inside where brains attack,<br />
              I&apos;m just chilling outside the block
            </p>
          </div>

          <img className="scanner-complete-character scanner-s-complete-character" src="/assets/copilot-image-298225.png" alt="Neero" />

          <button className="next-btn scanner-complete-next-btn" type="button" aria-label="Next screen" onClick={handleNext}>
            &#8250;&#8250;
          </button>
        </section>

        <section className={`screen scanner-screen scanner-screen-i ${screen === 'scanner-i' ? 'is-active' : 'is-hidden'}`}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-i-watermark" aria-label="DESIGNX">
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

          <button className="scanner-tap-target" type="button" aria-label="Mock QR scan success" onClick={handleNext}>
            <div className="scanner-frame">
              <video ref={scannerIVideoRef} className="scanner-video" autoPlay muted playsInline />
              <span className="scanner-corner corner-top-left" />
              <span className="scanner-corner corner-top-right" />
              <span className="scanner-corner corner-bottom-left" />
              <span className="scanner-corner corner-bottom-right" />
            </div>
          </button>

          <p className="scanner-label">scan to find I</p>
          {cameraError ? <p className="scanner-error">{cameraError}</p> : null}
        </section>

        <section className={`screen scanner-complete-screen scanner-i-complete-screen ${screen === 'scanner-i-complete' ? 'is-active' : 'is-hidden'}`}>
          <div className="grid-overlay" />
          <p className="scanner-i-complete-word" aria-label="DESIGNX">
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
            <p>
              I&apos;m not where crowds go rushing in,<br />
              I&apos;m where journeys quietly begin
            </p>
          </div>

          <img className="scanner-complete-character scanner-i-complete-character" src="/assets/copilot-image-77d40b.png" alt="Neero" />

          <button className="next-btn scanner-complete-next-btn" type="button" aria-label="Next screen" onClick={handleNext}>
            &#8250;&#8250;
          </button>
        </section>

        <section className={`screen scanner-screen scanner-screen-g ${screen === 'scanner-g' ? 'is-active' : 'is-hidden'}`}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-g-watermark" aria-label="DESIGNX">
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

          <button className="scanner-tap-target" type="button" aria-label="Mock QR scan success" onClick={handleNext}>
            <div className="scanner-frame">
              <video ref={scannerGVideoRef} className="scanner-video" autoPlay muted playsInline />
              <span className="scanner-corner corner-top-left" />
              <span className="scanner-corner corner-top-right" />
              <span className="scanner-corner corner-bottom-left" />
              <span className="scanner-corner corner-bottom-right" />
            </div>
          </button>

          <p className="scanner-label">scan to find G</p>
          {cameraError ? <p className="scanner-error">{cameraError}</p> : null}
        </section>

        <section className={`screen scanner-complete-screen scanner-g-complete-screen ${screen === 'scanner-g-complete' ? 'is-active' : 'is-hidden'}`}>
          <div className="grid-overlay" />
          <p className="scanner-g-complete-word" aria-label="DESIGNX">
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
            <p>
              You won&apos;t find me in noisy halls,<br />
              I&apos;m tucked where calm and shadow falls
            </p>
          </div>

          <img className="scanner-complete-character scanner-g-complete-character" src="/assets/copilot-image-239ba5.png" alt="Neero" />

          <button className="next-btn scanner-complete-next-btn" type="button" aria-label="Next screen" onClick={handleNext}>
            &#8250;&#8250;
          </button>
        </section>

        <section className={`screen scanner-screen scanner-screen-n ${screen === 'scanner-n' ? 'is-active' : 'is-hidden'}`}>
          <div className="grid-overlay" />
          <button className="back-btn" type="button" aria-label="Go back" onClick={handleBack}>
            &#8249;
          </button>
          <p className="scanner-n-watermark" aria-label="DESIGNX">
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

          <button className="scanner-tap-target" type="button" aria-label="Mock QR scan success" onClick={handleNext}>
            <div className="scanner-frame">
              <video ref={scannerNVideoRef} className="scanner-video" autoPlay muted playsInline />
              <span className="scanner-corner corner-top-left" />
              <span className="scanner-corner corner-top-right" />
              <span className="scanner-corner corner-bottom-left" />
              <span className="scanner-corner corner-bottom-right" />
            </div>
          </button>

          <p className="scanner-label">scan to find N</p>
          {cameraError ? <p className="scanner-error">{cameraError}</p> : null}
        </section>

        <section className={`screen scanner-complete-screen scanner-n-complete-screen ${screen === 'scanner-n-complete' ? 'is-active' : 'is-hidden'}`}>
          <div className="grid-overlay" />
          <p className="scanner-n-complete-word" aria-label="DESIGNX">
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
            <p>
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
        </section>
      </div>
    </main>
  )
}

export default App
