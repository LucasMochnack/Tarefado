import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { entrar, criarConta } from '@/lib/auth'
import { cn } from '@/lib/utils'

export function Login() {
  const autenticado = useStore(s => s.autenticado)
  const navigate = useNavigate()

  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [carregando, setCarregando] = useState(false)

  // Assim que a sessão for estabelecida, entra no app
  useEffect(() => {
    if (autenticado) navigate('/kanban', { replace: true })
  }, [autenticado, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(''); setAviso('')
    if (senha.length < 6) { setErro('A senha precisa ter ao menos 6 caracteres.'); return }
    setCarregando(true)
    try {
      if (modo === 'entrar') {
        await entrar(email, senha)
        // navegação acontece no useEffect quando `autenticado` vira true
      } else {
        const { precisaConfirmar } = await criarConta(email, senha)
        if (precisaConfirmar) {
          setAviso('Conta criada! Confirme pelo link enviado ao seu e-mail para entrar.')
          setModo('entrar')
          setCarregando(false)
        }
        // se não precisa confirmar, o login é automático (useEffect navega)
      }
    } catch (err: any) {
      const msg = String(err?.message || err)
      if (/Invalid login credentials/i.test(msg)) setErro('E-mail ou senha incorretos.')
      else if (/already registered|already exists/i.test(msg)) setErro('Este e-mail já tem conta. Tente entrar.')
      else setErro(msg)
      setCarregando(false)
    }
  }

  const inputCls = (temErro: boolean) => cn(
    'w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm transition-all outline-none',
    'focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400',
    temErro ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-indigo-400/15 dark:bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-clay-300/15 dark:bg-clay-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-600/20 mb-4 ring-1 ring-black/5">
              <Zap size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Tarefado</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {modo === 'entrar' ? 'Entre na sua conta' : 'Crie sua conta'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">E-mail</label>
              <input
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={e => { setEmail(e.target.value); setErro('') }}
                placeholder="seu@email.com"
                className={inputCls(!!erro)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Senha</label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                  value={senha}
                  onChange={e => { setSenha(e.target.value); setErro('') }}
                  placeholder="••••••••"
                  className={cn(inputCls(!!erro), 'pr-11')}
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

            {erro && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5">
                <AlertCircle size={15} className="flex-shrink-0" /> {erro}
              </div>
            )}
            {aviso && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2.5">
                <CheckCircle2 size={15} className="flex-shrink-0" /> {aviso}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando || !email || !senha}
              className={cn(
                'w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all',
                'bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800',
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
                  {modo === 'entrar' ? 'Entrando...' : 'Criando...'}
                </span>
              ) : (modo === 'entrar' ? 'Entrar' : 'Criar conta')}
            </button>
          </form>

          {/* Alternar entre entrar / criar conta */}
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
            {modo === 'entrar' ? (
              <>Primeiro acesso?{' '}
                <button onClick={() => { setModo('criar'); setErro(''); setAviso('') }} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                  Criar conta
                </button>
              </>
            ) : (
              <>Já tem conta?{' '}
                <button onClick={() => { setModo('entrar'); setErro(''); setAviso('') }} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                  Entrar
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-4">
          © 2026 Tarefado · Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
