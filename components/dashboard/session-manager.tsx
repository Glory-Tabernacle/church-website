'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionWarningModal } from './session-warning-modal'

interface SessionManagerProps {
  timeout?: number // Timeout in milliseconds
  warningTime?: number // Show warning before timeout (in milliseconds)
}

export function SessionManager({ 
  timeout = 60000, // 1 minute default
  warningTime = 10000 // 10 seconds warning
}: SessionManagerProps) {
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const [showWarning, setShowWarning] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Clear all timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)

      // Hide warning modal
      setShowWarning(false)

      // Call logout API
      await fetch('/api/auth/logout', { method: 'POST' })

      // Redirect to login
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect even if API fails
      router.push('/login')
      router.refresh()
    }
  }, [router])

  // Continue session (dismiss warning)
  const continueSession = useCallback(() => {
    console.log('✅ User chose to continue session')
    setShowWarning(false)
    // Reset timer after dismissing warning
    const now = Date.now()
    lastActivityRef.current = now
    console.log('⏱️ Timer reset at', new Date(now).toLocaleTimeString())

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
    }

    // Set warning timer
    const warningDelay = timeout - warningTime
    console.log(`⚠️ Warning will show in ${warningDelay / 1000} seconds`)
    warningTimeoutRef.current = setTimeout(() => {
      console.log('⚠️ Showing session warning modal')
      setShowWarning(true)
      setRemainingSeconds(Math.floor(warningTime / 1000))
    }, warningDelay)

    // Set logout timer
    console.log(`🔴 Auto-logout will occur in ${timeout / 1000} seconds`)
    timeoutRef.current = setTimeout(() => {
      console.log('🔴 Session expired - logging out')
      logout()
    }, timeout)
  }, [timeout, warningTime, logout])

  // Reset inactivity timer
  const resetTimer = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now
    console.log('⏱️ Timer reset at', new Date(now).toLocaleTimeString())

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      console.log('Cleared existing logout timer')
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
      console.log('Cleared existing warning timer')
    }

    // Hide warning if showing
    setShowWarning(false)

    // Set warning timer
    const warningDelay = timeout - warningTime
    console.log(`⚠️ Warning will show in ${warningDelay / 1000} seconds`)
    warningTimeoutRef.current = setTimeout(() => {
      console.log('⚠️ Showing session warning modal')
      setShowWarning(true)
      setRemainingSeconds(Math.floor(warningTime / 1000))
    }, warningDelay)

    // Set logout timer
    console.log(`🔴 Auto-logout will occur in ${timeout / 1000} seconds`)
    timeoutRef.current = setTimeout(() => {
      console.log('🔴 Session expired - logging out')
      logout()
    }, timeout)
  }, [timeout, warningTime, logout])

  // Activity event handler
  const handleActivity = useCallback(() => {
    // If warning is showing, any activity dismisses it
    if (showWarning) {
      console.log('👆 Activity detected while warning showing - continuing session')
      continueSession()
    } else {
      console.log('👆 Activity detected - resetting timer')
      resetTimer()
    }
  }, [resetTimer, showWarning, continueSession])

  // Initialize on mount
  useEffect(() => {
    console.log('🚀 SessionManager initialized')
    
    // List of events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'wheel',
    ]

    // Throttle activity detection to avoid excessive resets
    let throttleTimeout: NodeJS.Timeout | null = null
    const throttledHandleActivity = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          handleActivity()
          throttleTimeout = null
        }, 1000) // Throttle to once per second
      }
    }

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, throttledHandleActivity, { passive: true })
    })
    console.log('✅ Event listeners attached for:', events.join(', '))

    // Initialize timer
    resetTimer()

    // Cleanup
    return () => {
      console.log('🧹 SessionManager cleanup')
      events.forEach((event) => {
        window.removeEventListener(event, throttledHandleActivity)
      })
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
      if (throttleTimeout) clearTimeout(throttleTimeout)
    }
  }, [handleActivity, resetTimer])

  // Visibility change handler (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('👁️ Tab hidden - timer continues')
      } else {
        console.log('👁️ Tab visible again')
        const timeSinceLastActivity = Date.now() - lastActivityRef.current
        const secondsSinceActivity = Math.floor(timeSinceLastActivity / 1000)
        console.log(`Time since last activity: ${secondsSinceActivity} seconds`)
        
        if (timeSinceLastActivity >= timeout) {
          console.log('🔴 Session expired while tab was hidden')
          logout()
        } else if (timeSinceLastActivity >= timeout - warningTime) {
          console.log('⚠️ Close to expiry - showing warning')
          setShowWarning(true)
          const remaining = Math.floor((timeout - timeSinceLastActivity) / 1000)
          setRemainingSeconds(remaining)
        } else {
          console.log('✅ Session still valid - resetting timer')
          resetTimer()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [timeout, warningTime, logout, resetTimer])

  return (
    <SessionWarningModal
      isOpen={showWarning}
      remainingSeconds={remainingSeconds}
      onContinue={continueSession}
      onLogout={logout}
    />
  )
}
