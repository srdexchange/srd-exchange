import { useState, useEffect } from 'react'

export function useUserActivity(timeoutMs: number = 5000) {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleActivity = () => {
      setIsActive(true)
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setIsActive(false)
      }, timeoutMs)
    }

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Set initial timeout
    timeoutId = setTimeout(() => {
      setIsActive(false)
    }, timeoutMs)

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      clearTimeout(timeoutId)
    }
  }, [timeoutMs])

  return isActive
}