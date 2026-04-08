import { useState, useRef, useEffect } from 'react'
import { Check, UserPlus } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { UserAvatar } from './UserAvatar'
import { cn } from '@/lib/utils'
import { createPortal } from 'react-dom'

interface UserAvatarPickerProps {
  tarefaId: string
  responsavel: string
  size?: 'xs' | 'sm' | 'md'
}

// Tamanho do círculo "sem usuário"
const EMPTY_SIZE: Record<string, string> = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
}
const ICON_SIZE: Record<string, number> = { xs: 9, sm: 12, md: 15 }

export function UserAvatarPicker({ tarefaId, responsavel, size = 'sm' }: UserAvatarPickerProps) {
  const { usuarios, updateTarefa } = useStore()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      setOpen(false)
    }
    // pequeno delay para não fechar imediatamente ao abrir
    const t = setTimeout(() => document.addEventListener('mousedown', close), 50)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', close)
    }
  }, [open])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    // Posiciona abaixo e alinhado à esquerda do avatar
    setPos({
      top: rect.bottom + 6,
      left: Math.min(rect.left, window.innerWidth - 220),
    })
    setOpen(v => !v)
  }

  const assign = (e: React.MouseEvent, nome: string) => {
    e.stopPropagation()
    updateTarefa(tarefaId, { responsavel: nome })
    setOpen(false)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        /* Impede dnd-kit (pointerdown) e drag HTML5 de capturar o evento */
        onPointerDown={e => e.stopPropagation()}
        onDragStart={e => e.stopPropagation()}
        onClick={handleClick}
        title={responsavel || 'Sem responsável — clique para atribuir'}
        className={cn(
          'inline-flex items-center justify-center rounded-full flex-shrink-0',
          'transition-transform hover:scale-110 hover:opacity-90 cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 dark:focus:ring-offset-slate-900'
        )}
      >
        {responsavel ? (
          /* Usuário atribuído — mostra avatar com anel colorido */
          <div className="ring-2 ring-indigo-400/60 dark:ring-indigo-500/50 rounded-full">
            <UserAvatar nome={responsavel} size={size} />
          </div>
        ) : (
          /* Sem usuário — círculo pontilhado com ícone + */
          <div className={cn(
            'rounded-full border-2 border-dashed border-slate-300 dark:border-slate-500',
            'bg-slate-100 dark:bg-slate-700/60',
            'flex items-center justify-center text-slate-400 dark:text-slate-400',
            EMPTY_SIZE[size]
          )}>
            <UserPlus size={ICON_SIZE[size]} />
          </div>
        )}
      </button>

      {/* Dropdown via portal — aparece sobre tudo */}
      {open && createPortal(
        <div
          className="fixed z-[9999] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 w-52"
          style={{ top: pos.top, left: pos.left }}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide px-2 mb-2">
            Atribuir responsável
          </p>
          <div className="space-y-0.5">
            {/* Remover responsável */}
            <button
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors',
                !responsavel
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60'
              )}
              onClick={e => assign(e, '')}
            >
              <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-500 flex items-center justify-center flex-shrink-0">
                <UserPlus size={10} className="text-slate-400" />
              </div>
              <span className="flex-1 text-left">Sem responsável</span>
              {!responsavel && <Check size={12} className="text-indigo-500 flex-shrink-0" />}
            </button>

            {/* Lista de usuários */}
            {usuarios.map(u => (
              <button
                key={u.id}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors',
                  responsavel === u.nome
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                )}
                onClick={e => assign(e, u.nome)}
              >
                <UserAvatar nome={u.nome} size="sm" />
                <span className="flex-1 text-left truncate">{u.nome}</span>
                {responsavel === u.nome && <Check size={12} className="text-indigo-500 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
