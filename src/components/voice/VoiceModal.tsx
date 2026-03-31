import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Mic, MicOff, X, Loader2, CheckCircle } from 'lucide-react'
import { useVoice } from '@/hooks/useVoice'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { PROJETOS_INICIAIS } from '@/data/mockData'
import { addDaysISO, todayISO } from '@/utils/dates'
import toast from 'react-hot-toast'

interface VoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTime?: string
  defaultProjetoId?: string
}

export function VoiceModal({ open, onOpenChange, defaultTime, defaultProjetoId }: VoiceModalProps) {
  const addTarefa = useStore(s => s.addTarefa)
  const projetos = useStore(s => s.projetos)
  const [editText, setEditText] = useState('')
  const [done, setDone] = useState(false)

  const { isListening, transcript, command, error, supported, startListening, stopListening, reset } = useVoice()

  useEffect(() => {
    if (transcript) setEditText(transcript)
  }, [transcript])

  useEffect(() => {
    if (!open) {
      reset()
      setEditText('')
      setDone(false)
    }
  }, [open, reset])

  const handleConfirm = () => {
    if (!editText.trim()) return

    if (command?.tipo === 'criar-tarefa' || !command || command.tipo === 'desconhecido') {
      const titulo = command?.titulo || editText.trim()
      const projetoMatch = projetos.find(p =>
        command?.projetoNome && p.nome.toLowerCase().includes(command.projetoNome.toLowerCase())
      )
      const projetoId = projetoMatch?.id || defaultProjetoId || projetos[0]?.id || 'proj-1'
      const time = (command?.time || defaultTime || 'geral') as any

      addTarefa({
        titulo,
        descricao: '',
        status: 'a-fazer',
        prioridade: command?.prioridade || 'media',
        prazo: command?.prazo || addDaysISO(7),
        responsavel: '',
        projetoId,
        time,
        tags: [],
        checklist: [],
        comentarios: [],
        bloqueadaPor: undefined,
      })
      toast.success(`Tarefa "${titulo}" criada por voz!`)
      setDone(true)
      setTimeout(() => onOpenChange(false), 1200)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Dialog.Title className="font-bold text-slate-900 dark:text-white text-lg">Comando de Voz</Dialog.Title>
              <Dialog.Description className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Fale um comando para criar tarefas ou comentários
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </Dialog.Close>
          </div>

          {!supported && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-700 dark:text-amber-400 mb-4">
              Reconhecimento de voz não suportado. Use o Chrome ou Edge. Você pode digitar o comando abaixo.
            </div>
          )}

          {/* Mic button */}
          <div className="flex flex-col items-center gap-4 my-6">
            <button
              onClick={isListening ? stopListening : startListening}
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg',
                isListening
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse-slow scale-110'
                  : done
                  ? 'bg-emerald-500'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              )}
            >
              {done ? (
                <CheckCircle size={36} className="text-white" />
              ) : isListening ? (
                <MicOff size={36} className="text-white" />
              ) : (
                <Mic size={36} className="text-white" />
              )}
            </button>
            <p className={cn('text-sm font-medium', isListening ? 'text-red-500' : 'text-slate-500 dark:text-slate-400')}>
              {done ? 'Tarefa criada!' : isListening ? '🔴 Ouvindo... Clique para parar' : 'Clique para falar'}
            </p>
          </div>

          {/* Exemplos */}
          {!transcript && !isListening && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Exemplos de comandos:</p>
              <ul className="space-y-1">
                {[
                  '"Criar tarefa ligar para fornecedor amanhã"',
                  '"Nova tarefa no time B2C: retomar cliente premium"',
                  '"Criar tarefa revisar campanha com prioridade alta"',
                ].map(ex => (
                  <li key={ex} className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-800 rounded px-2 py-1 border border-slate-200 dark:border-slate-700">
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Transcript / Edit */}
          {(transcript || !supported) && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                {transcript ? 'Transcrição (edite se necessário):' : 'Digite seu comando:'}
              </label>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: Criar tarefa ligar para cliente amanhã..."
              />
              {command && command.tipo !== 'desconhecido' && (
                <div className="mt-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 p-3">
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-1">Interpretado como:</p>
                  <div className="text-xs text-indigo-600 dark:text-indigo-300 space-y-0.5">
                    <div><strong>Ação:</strong> {command.tipo === 'criar-tarefa' ? 'Criar tarefa' : command.tipo}</div>
                    {command.titulo && <div><strong>Título:</strong> {command.titulo}</div>}
                    {command.time && <div><strong>Time:</strong> {command.time}</div>}
                    {command.prioridade && <div><strong>Prioridade:</strong> {command.prioridade}</div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {(editText || !supported) && (
            <div className="flex gap-3">
              <Dialog.Close asChild>
                <button className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                onClick={handleConfirm}
                disabled={!editText.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirmar
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
