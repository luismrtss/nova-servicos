import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

function Header() {
  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [menuAberto, setMenuAberto] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          setUsuario(null)
          setPerfil(null)
          return
        }

        setUsuario(user)

        try {
          const perfilRef = doc(
            db,
            'users',
            user.uid
          )

          const perfilSnapshot =
            await getDoc(perfilRef)

          if (perfilSnapshot.exists()) {
            setPerfil(
              perfilSnapshot.data()
            )
          }
        } catch (error) {
          console.error(
            'Erro ao carregar perfil:',
            error
          )
        }
      }
    )

    return () => unsubscribe()
  }, [])

  async function handleLogout() {
    try {
      await signOut(auth)

      setMenuAberto(false)
      navigate('/')
    } catch (error) {
      console.error(
        'Erro ao sair:',
        error
      )
    }
  }

  function fecharMenu() {
    setMenuAberto(false)
  }

  function navegarParaInicio() {
    fecharMenu()

    if (perfil?.tipo === 'prestador') {
      navigate('/prestador')
      return
    }

    if (perfil?.tipo === 'solicitante') {
      navigate('/solicitante')
      return
    }

    navigate('/')
  }

  function navegarParaSecao(secao) {
    fecharMenu()

    /*
      Visitante:
      /#secao

      Solicitante:
      /solicitante#secao

      Prestador:
      /prestador#secao
    */

    let rota = '/'

    if (perfil?.tipo === 'solicitante') {
      rota = '/solicitante'
    }

    if (perfil?.tipo === 'prestador') {
      rota = '/prestador'
    }

    if (window.location.pathname === rota) {
      const elemento =
        document.getElementById(secao)

      if (elemento) {
        elemento.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }

      return
    }

    navigate(`${rota}#${secao}`)

    setTimeout(() => {
      const elemento =
        document.getElementById(secao)

      if (elemento) {
        elemento.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    }, 300)
  }

  const nomeUsuario =
    perfil?.nome ||
    usuario?.email ||
    'Usuário'

  const primeiroNome =
    nomeUsuario.split(' ')[0]

  const tipoUsuario =
    perfil?.tipo === 'prestador'
      ? 'Prestador de serviço'
      : 'Solicitante'

  const rotaPerfil = '/perfil'

  return (
    <header className="header">

      {/* ==================================================
          LOGO
          ================================================== */}

      <button
        type="button"
        className="logo"
        onClick={navegarParaInicio}
      >
        NOVA<span>.</span>
      </button>


      {/* ==================================================
          NAVEGAÇÃO PRINCIPAL
          ================================================== */}

      <nav className="nav">

        <button
          type="button"
          onClick={navegarParaInicio}
        >
          Início
        </button>

        <button
          type="button"
          onClick={() =>
            navegarParaSecao(
              'como-funciona'
            )
          }
        >
          Como funciona
        </button>

        <button
          type="button"
          onClick={() =>
            navegarParaSecao('servicos')
          }
        >
          Serviços
        </button>

        <button
          type="button"
          onClick={() =>
            navegarParaSecao('sobre')
          }
        >
          Sobre
        </button>

      </nav>


      {/* ==================================================
          USUÁRIO NÃO LOGADO
          ================================================== */}

      {!usuario ? (

        <div className="header-actions">

          <Link
            to="/login"
            className="login-button"
          >
            Entrar
          </Link>

          <Link
            to="/cadastro"
            className="header-button"
          >
            Criar conta
          </Link>

        </div>

      ) : (

        /* ==================================================
           USUÁRIO LOGADO
           ================================================== */

        <div className="profile-area">

          <button
            type="button"
            className="profile-button"
            onClick={() =>
              setMenuAberto(
                !menuAberto
              )
            }
          >

            <span className="profile-avatar">
              {primeiroNome
                .charAt(0)
                .toUpperCase()}
            </span>

            <span className="profile-name">
              {primeiroNome}
            </span>

            <span className="profile-arrow">
              {menuAberto
                ? '▲'
                : '▼'}
            </span>

          </button>


          {/* ==================================================
              MENU DO PERFIL
              ================================================== */}

          {menuAberto && (

            <div className="profile-menu">

              {/* IDENTIFICAÇÃO */}

              <div className="profile-menu-header">

                <div className="profile-menu-avatar">
                  {primeiroNome
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>

                  <strong>
                    {nomeUsuario}
                  </strong>

                  <span>
                    {tipoUsuario}
                  </span>

                </div>

              </div>


              <div className="profile-menu-divider"></div>


              {/* ==================================================
                  MINHA ÁREA
                  ================================================== */}

              <button
                type="button"
                onClick={
                  navegarParaInicio
                }
              >
                <span>⌂</span>
                Minha área
              </button>


              {/* ==================================================
                  PERFIL
                  ================================================== */}

              <Link
                to={rotaPerfil}
                onClick={fecharMenu}
              >
                <span>👤</span>
                Meu perfil
              </Link>


              {/* ==================================================
                  MENU DO SOLICITANTE
                  ================================================== */}

              {perfil?.tipo ===
                'solicitante' && (
                <>

                  <Link
                    to="/meus-servicos"
                    onClick={
                      fecharMenu
                    }
                  >
                    <span>▣</span>
                    Meus serviços
                  </Link>

                  <Link
                    to="/propostas-recebidas"
                    onClick={
                      fecharMenu
                    }
                  >
                    <span>📋</span>
                    Propostas recebidas
                  </Link>

                  <Link
                    to="/solicitante/avaliacoes"
                    onClick={
                      fecharMenu
                    }
                  >
                    <span>⭐</span>
                    Avaliações
                  </Link>

                </>
              )}


              {/* ==================================================
                  MENU DO PRESTADOR
                  ================================================== */}

              {perfil?.tipo ===
                'prestador' && (
                <>

                  <Link
                    to="/prestador/servicos"
                    onClick={
                      fecharMenu
                    }
                  >
                    <span>🔎</span>
                    Encontrar serviços
                  </Link>

                  <Link
                    to="/prestador/minhas-propostas"
                    onClick={
                      fecharMenu
                    }
                  >
                    <span>📋</span>
                    Minhas propostas
                  </Link>

                  <Link
                    to="/prestador/meus-servicos"
                    onClick={
                      fecharMenu
                    }
                  >
                    <span>🛠️</span>
                    Meus serviços
                  </Link>

                  <Link
                    to="/prestador/avaliacoes"
                    onClick={
                      fecharMenu
                    }
                  >
                    <span>⭐</span>
                    Avaliações
                  </Link>

                </>
              )}


              {/* ==================================================
                  SAIR
                  ================================================== */}

              <button
                type="button"
                className="profile-menu-logout"
                onClick={
                  handleLogout
                }
              >
                <span>↪</span>
                Sair da conta
              </button>

            </div>

          )}

        </div>

      )}

    </header>
  )
}

export default Header