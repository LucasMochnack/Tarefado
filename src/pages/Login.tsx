import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, AlertCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

export function Login() {
  const { login } = useStore()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    await new Promise(r => setTimeout(r, 600))

    const ok = login(email.trim().toLowerCase(), senha)
    if (ok) {
      navigate('/dashboard', { replace: true })
    } else {
      setErro('E-mail ou senha incorretos.')
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      {/* Fundo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-emerald-400/10 dark:bg-emerald-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-400/10 dark:bg-indigo-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg mb-4">
              <Zap size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Tarefado</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestão de tarefas e times</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-mail */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                E-mail
              </label>
              <input
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={e => { setEmail(e.target.value); setErro('') }}
                placeholder="seu@email.com"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm transition-all outline-none',
                  'focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400',
                  erro
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                )}
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={senha}
                  onChange={e => { setSenha(e.target.value); setErro('') }}
                  placeholder="••••••••"
                  className={cn(
                    'w-full px-4 py-2.5 pr-11 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm transition-all outline-none',
                    'focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400',
                    erro
                      ? 'border-red-400 dark:border-red-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5">
                <AlertCircle size={15} className="flex-shrink-0" />
                {erro}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={carregando || !email || !senha}
              className={cn(
                'w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all',
                'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700',
                'shadow-md hover:shadow-lg active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
              )}
            >
              {carregando ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Entrando...
                </span>
              ) : 'Entrar'}
            </button>
          </form>

        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-4">
          © 2026 Tarefado · Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
