import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  nome: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}

const SIZE = {
  xs: { wrap: 'w-5 h-5', text: 'text-[9px]', nameText: 'text-xs' },
  sm: { wrap: 'w-6 h-6', text: 'text-[10px]', nameText: 'text-xs' },
  md: { wrap: 'w-8 h-8', text: 'text-sm', nameText: 'text-sm' },
  lg: { wrap: 'w-10 h-10', text: 'text-base', nameText: 'text-sm' },
}

export function UserAvatar({ nome, size = 'sm', showName = false, className }: UserAvatarProps) {
  const usuarios = useStore(s => s.usuarios)
  const usuario = usuarios.find(u => u.nome.toLowerCase() === nome.toLowerCase())

  const cor = usuario?.cor ?? '#6366f1'
  const foto = usuario?.foto
  const inicial = nome.charAt(0).toUpperCase()
  const s = SIZE[size]

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div
        className={cn('rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold', s.wrap)}
        style={{ backgroundColor: foto ? undefined : cor }}
        title={nome}
      >
        {foto ? (
          <img src={foto} alt={nome} className="w-full h-full object-cover" />
        ) : (
          <span className={cn('text-white leading-none', s.text)}>{inicial}</span>
        )}
      </div>
      {showName && (
        <span className={cn('text-slate-600 dark:text-slate-400 truncate', s.nameText)}>
          {nome.split(' ')[0]}
        </span>
      )}
    </div>
  )
}
