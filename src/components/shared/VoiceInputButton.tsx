import { useState } from 'react'
import { Mic } from 'lucide-react'
import { VoiceModal } from '@/components/voice/VoiceModal'
import { cn } from '@/lib/utils'

interface VoiceInputButtonProps {
  defaultTime?: string
  defaultProjetoId?: string
  size?: 'sm' | 'md'
  className?: string
}

export function VoiceInputButton({ defaultTime, defaultProjetoId, size = 'md', className }: VoiceInputButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Comando de voz"
        className={cn(
          'flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700',
          'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
          'transition-colors font-medium',
          size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
          className
        )}
      >
        <Mic size={size === 'sm' ? 13 : 15} />
        <span className="hidden sm:inline">Voz</span>
      </button>
      <VoiceModal open={open} onOpenChange={setOpen} defaultTime={defaultTime} defaultProjetoId={defaultProjetoId} />
    </>
  )
}
