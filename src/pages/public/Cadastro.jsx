import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../../firebase/config'

function Cadastro() {
  const location = useLocation()
  const navigate = useNavigate()

  const parametros = new URLSearchParams(location.search)

  const tipoInicial =
    parametros.get('tipo') === 'prestador'
      ? 'prestador'
      : 'solicitante'

  const categoriaInicial =
    parametros.get('categoria') || ''

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [tipo, setTipo] = useState(tipoInicial)

  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleCadastro(event) {
    event.preventDefault()

    setErro('')

    if (!nome.trim()) {
      setErro('Informe seu nome.')
      return
    }

    if (!email.trim()) {
      setErro('Informe seu e-mail.')
      return
    }

    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    setCarregando(true)

    try {
      const credencial =
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          senha
        )

      const usuario = credencial.user

      await setDoc(
        doc(db, 'users', usuario.uid),
        {
          nome: nome.trim(),
          email: email.trim(),
          tipo,
          criadoEm: serverTimestamp(),
        }
      )

      if (
        tipo === 'solicitante' &&
        categoriaInicial
      ) {
        navigate(
          `/solicitar?categoria=${categoriaInicial}`
        )
        return
      }

      if (tipo === 'prestador') {
        navigate('/prestador')
        return
      }

      navigate('/solicitante')
    } catch (error) {
      console.error(
        'Erro ao criar conta:',
        error
      )

      if (
        error.code ===
        'auth/email-already-in-use'
      ) {
        setErro(
          'Este e-mail já está cadastrado. Tente entrar na sua conta.'
        )
      } else if (
        error.code ===
        'auth/invalid-email'
      ) {
        setErro(
          'Informe um e-mail válido.'
        )
      } else if (
        error.code ===
        'auth/weak-password'
      ) {
        setErro(
          'Escolha uma senha mais forte.'
        )
      } else {
        setErro(
          'Não foi possível criar sua conta. Tente novamente.'
        )
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <section className="auth-page">

      <div className="auth-container">

        {/* LADO ESQUERDO */}
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
              Resolva
              <br />
              mais.
              <br />
              <strong>Com a NOVA.</strong>
            </h1>

            <p>
              Crie sua conta e tenha acesso a uma
              forma mais simples de encontrar ou
              oferecer serviços, com praticidade
              e segurança.
            </p>

            <div className="auth-intro-features">

              <div className="auth-intro-feature">
                <span className="auth-intro-feature-icon">
                  👤
                </span>

                <span>
                  Encontre profissionais
                  <br />
                  para o que você precisa
                </span>
              </div>

              <div className="auth-intro-feature">
                <span className="auth-intro-feature-icon">
                  ◆
                </span>

                <span>
                  Divulgue seus serviços
                  <br />
                  e conquiste novos clientes
                </span>
              </div>

              <div className="auth-intro-feature">
                <span className="auth-intro-feature-icon">
                  ✓
                </span>

                <span>
                  Tudo em um só lugar
                  <br />
                  com mais segurança
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


        {/* FORMULÁRIO */}
        <div className="auth-card">

          <div className="auth-card-header">

            <span className="auth-card-eyebrow">
              CRIAR CONTA
            </span>

            <h2>
              Comece agora
            </h2>

            <p>
              Preencha seus dados para criar
              sua conta na NOVA.
            </p>

          </div>


          <form
            className="auth-form"
            onSubmit={handleCadastro}
          >

            {/* NOME */}
            <div className="auth-form-group">

              <label htmlFor="nome">
                Nome completo
              </label>

              <div className="auth-input-wrapper">

                <span className="auth-input-icon">
                  👤
                </span>

                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(event) =>
                    setNome(event.target.value)
                  }
                  placeholder="Seu nome completo"
                  autoComplete="name"
                />

              </div>

            </div>


            {/* EMAIL */}
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
                  placeholder="Mínimo de 6 caracteres"
                  autoComplete="new-password"
                />

                <span className="auth-password-icon">
                  ◉
                </span>

              </div>

            </div>


            {/* TIPO */}
            <div className="auth-form-group">

              <label>
                Como você pretende usar a NOVA?
              </label>

              <div className="auth-type-options">

                {/* SOLICITANTE */}
                <label className="auth-type-option">

                  <input
                    type="radio"
                    name="tipo"
                    value="solicitante"
                    checked={
                      tipo === 'solicitante'
                    }
                    onChange={() =>
                      setTipo('solicitante')
                    }
                  />

                  <span className="auth-type-content">

                    <span className="auth-type-top">
                      <span className="auth-radio"></span>

                      <span className="auth-type-icon">
                        👤
                      </span>
                    </span>

                    <strong>
                      Preciso de um serviço
                    </strong>

                    <span>
                      Quero encontrar profissionais
                      para resolver o que eu preciso.
                    </span>

                  </span>

                </label>


                {/* PRESTADOR */}
                <label className="auth-type-option">

                  <input
                    type="radio"
                    name="tipo"
                    value="prestador"
                    checked={
                      tipo === 'prestador'
                    }
                    onChange={() =>
                      setTipo('prestador')
                    }
                  />

                  <span className="auth-type-content">

                    <span className="auth-type-top">
                      <span className="auth-radio"></span>

                      <span className="auth-type-icon">
                        💼
                      </span>
                    </span>

                    <strong>
                      Quero prestar serviços
                    </strong>

                    <span>
                      Quero divulgar meus serviços
                      e encontrar oportunidades.
                    </span>

                  </span>

                </label>

              </div>

            </div>


            {erro && (
              <div className="auth-error">
                {erro}
              </div>
            )}


            <button
              type="submit"
              className="auth-submit"
              disabled={carregando}
            >
              {carregando
                ? 'Criando sua conta...'
                : 'Criar minha conta'}

              {!carregando && (
                <span>→</span>
              )}
            </button>

          </form>


          <div className="auth-switch">

            Já possui uma conta?

            <Link to="/login">
              Entrar
            </Link>

          </div>

        </div>

      </div>

    </section>
  )
}

export default Cadastro