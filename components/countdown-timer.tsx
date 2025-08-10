"use client"

import { useState, useEffect } from "react"
import type { JSX } from "react" // Import JSX to fix the undeclared variable error

interface CountdownTimerProps {
  targetDate: string // ISO string date
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date()
    let timeLeft = {}

    if (difference > 0) {
      timeLeft = {
        dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
        horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutos: Math.floor((difference / 1000 / 60) % 60),
        segundos: Math.floor((difference / 1000) % 60),
      }
    } else {
      timeLeft = { dias: 0, horas: 0, minutos: 0, segundos: 0 }
    }
    return timeLeft
  }

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearTimeout(timer)
  })

  const timerComponents: JSX.Element[] = []

  Object.keys(timeLeft).forEach((interval) => {
    // @ts-ignore
    if (!timeLeft[interval]) {
      return
    }

    timerComponents.push(
      <span key={interval} className="text-lg font-semibold">
        {/* @ts-ignore */}
        {timeLeft[interval]} {interval}{" "}
      </span>,
    )
  })

  return (
    <div className="text-center">
      {timerComponents.length ? (
        timerComponents
      ) : (
        <span className="text-lg font-semibold text-green-500">Período encerrado!</span>
      )}
    </div>
  )
}
