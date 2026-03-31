import { useState, useRef, useCallback } from 'react'
import { parseVoiceCommand, ParsedCommand } from '@/utils/voice-parser'

interface UseVoiceReturn {
  isListening: boolean
  transcript: string
  command: ParsedCommand | null
  error: string | null
  supported: boolean
  startListening: () => void
  stopListening: () => void
  reset: () => void
}

export function useVoice(onCommand?: (cmd: ParsedCommand, text: string) => void): UseVoiceReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [command, setCommand] = useState<ParsedCommand | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const startListening = useCallback(() => {
    if (!supported) {
      setError('Reconhecimento de voz não suportado neste navegador. Use o Chrome.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'pt-BR'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
      setTranscript('')
      setCommand(null)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript
      setTranscript(text)
      const parsed = parseVoiceCommand(text)
      setCommand(parsed)
      onCommand?.(parsed, text)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const msgs: Record<string, string> = {
        'not-allowed': 'Permissão de microfone negada.',
        'no-speech': 'Nenhuma fala detectada. Tente novamente.',
        'network': 'Erro de rede. Verifique sua conexão.',
      }
      setError(msgs[event.error] || `Erro: ${event.error}`)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [supported, onCommand])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const reset = useCallback(() => {
    setTranscript('')
    setCommand(null)
    setError(null)
  }, [])

  return { isListening, transcript, command, error, supported, startListening, stopListening, reset }
}
