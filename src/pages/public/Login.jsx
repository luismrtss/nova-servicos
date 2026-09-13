import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase/config'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(event) {
    event.preventDefault()

    setErro('')

    if (!email.trim()) {
      setErro('Informe seu e-mail.')
      return
    }

    if (!senha) {
      setErro('Informe sua senha.')
      return
    }

    setCarregando(true)

    try {
      const credencial = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        senha
      )

      const usuario = credencial.user

      const perfilRef = doc(
        db,
        'users',
        usuario.uid
      )

      const perfilSnapshot = await getDoc(
        perfilRef
      )

      if (perfilSnapshot.exists()) {
        const perfil = perfilSnapshot.data()

        if (perfil.tipo === 'prestador') {
          navigate('/prestador')
          return
        }

        navigate('/solicitante')
        return
      }

      navigate('/solicitante')
    } catch (error) {
      console.error('Erro ao entrar:', error)

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {
        setErro('E-mail ou senha incorretos.')
      } else if (
        error.code === 'auth/invalid-email'
      ) {
        setErro('Informe um e-mail válido.')
      } else if (
        error.code === 'auth/too-many-requests'
      ) {
        setErro(
          'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
        )
      } else {
        setErro(
          'Não foi possível entrar. Tente novamente.'
        )
      }
    } finally {
      setCarregando(false)
    }
  }

  function recuperarSenha() {
    setErro(
      'A recuperação de senha será adicionada em breve.'
    )
  }

  return (
    <section className="auth-page">

      <div className="auth-container">

        {/* =========================================
            LADO ESQUERDO
        ========================================= */}

        <div className="auth-intro">

          <Link
            to="/"
            className="auth-intro-logo"
          >
            NOVA<span>.</span>
          </Link>

          <div className="auth-intro-content">

            <span className="section-eyebrow">
              SERVIÇOS MAIS SIMPLES
            </span>

            <h1>
              Suas soluções.
              <br />
              Seus serviços.
              <br />
              <strong>Tudo na NOVA.</strong>
            </h1>

            <p>
              Entre na sua conta para acompanhar
              seus serviços, encontrar profissionais
              ou aproveitar novas oportunidades.
            </p>

            <div className="auth-intro-features">

              <div className="auth-intro-feature">

                <span className="auth-intro-feature-icon">
                  ✓
                </span>

                <span>
                  <strong>
                    Acompanhe seus serviços
                  </strong>
                  <br />
                  em um só lugar
                </span>

              </div>

              <div className="auth-intro-feature">

                <span className="auth-intro-feature-icon">
                  ◆
                </span>

                <span>
                  <strong>
                    Compare propostas
                  </strong>
                  <br />
                  e encontre a melhor opção
                </span>

              </div>

              <div className="auth-intro-feature">

                <span className="auth-intro-feature-icon">
                  ★
                </span>

                <span>
                  <strong>
                    Construa sua reputação
                  </strong>
                  <br />
                  com avaliações
                </span>

              </div>

            </div>

          </div>

          <div className="auth-intro-footer">
            Juntos por
            <br />
            mais soluções. 💙
          </div>

        </div>


        {/* =========================================
            LADO DIREITO
        ========================================= */}

        <div className="auth-card">

          <div className="auth-card-header">

            <span className="auth-card-eyebrow">
              ENTRAR
            </span>

            <h2>
              Bem-vindo de volta
            </h2>

            <p>
              Entre com seus dados para acessar
              sua conta na NOVA.
            </p>

          </div>


          <form
            className="auth-form"
            onSubmit={handleLogin}
          >

            {/* E-MAIL */}

            <div className="auth-form-group">

              <label htmlFor="email">
                E-mail
              </label>

              <div className="auth-input-wrapper">

                <span className="auth-input-icon">
                  ✉
                </span>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="seuemail@email.com"
                  autoComplete="email"
                />

              </div>

            </div>


            {/* SENHA */}

            <div className="auth-form-group">

              <label htmlFor="senha">
                Senha
              </label>

              <div className="auth-input-wrapper">

                <span className="auth-input-icon">
                  🔒
                </span>

                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(event) =>
                    setSenha(event.target.value)
                  }
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                />

                <span className="auth-password-icon">
                  ◉
                </span>

              </div>

              <button
                type="button"
                className="auth-forgot-button"
                onClick={recuperarSenha}
              >
                Esqueci minha senha?
              </button>

            </div>


            {/* ERRO */}

            {erro && (
              <div className="auth-error">
                <span className="auth-message-icon">
                  !
                </span>

                <span>
                  {erro}
                </span>
              </div>
            )}


            {/* BOTÃO */}

            <button
              type="submit"
              className="auth-submit"
              disabled={carregando}
            >
              {carregando
                ? 'Entrando...'
                : 'Entrar na minha conta'}

              {!carregando && (
                <span>→</span>
              )}
            </button>

          </form>


          {/* CRIAR CONTA */}

          <div className="auth-switch">

            <span>
              Ainda não possui uma conta?
            </span>

            <Link to="/cadastro">
              Criar minha conta
            </Link>

          </div>

        </div>

      </div>

    </section>
  )
}

export default Login