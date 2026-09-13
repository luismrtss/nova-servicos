import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { auth, db } from '../../firebase/config'

const categorias = [
  {
    valor: 'eletrica',
    nome: 'Elétrica',
    descricao: 'Instalações e reparos',
    icone: '⚡',
  },
  {
    valor: 'hidraulica',
    nome: 'Hidráulica',
    descricao: 'Encanamento e vazamentos',
    icone: '🔧',
  },
  {
    valor: 'limpeza',
    nome: 'Limpeza',
    descricao: 'Residencial e comercial',
    icone: '✦',
  },
  {
    valor: 'pintura',
    nome: 'Pintura',
    descricao: 'Ambientes internos e externos',
    icone: '◈',
  },
  {
    valor: 'manutencao',
    nome: 'Manutenção',
    descricao: 'Reparos e pequenos serviços',
    icone: '🛠',
  },
  {
    valor: 'climatizacao',
    nome: 'Climatização',
    descricao: 'Ar-condicionado e ventilação',
    icone: '❄',
  },
]

function Dashboard() {
  const navigate = useNavigate()

  const [nome, setNome] = useState('')
  const [servicos, setServicos] = useState([])
  const [propostas, setPropostas] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let unsubscribeRequests = null
    let unsubscribeProposals = null

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          setCarregando(false)
          navigate('/login')
          return
        }

        try {
          const perfilSnapshot = await getDoc(
            doc(db, 'users', user.uid)
          )

          if (perfilSnapshot.exists()) {
            const perfil = perfilSnapshot.data()

            setNome(perfil.nome || '')

            if (perfil.tipo === 'prestador') {
              navigate('/prestador')
              return
            }
          }
        } catch (error) {
          console.error(
            'Erro ao carregar perfil:',
            error
          )
        }

        const requestsQuery = query(
          collection(db, 'requests'),
          where('usuarioId', '==', user.uid)
        )

        unsubscribeRequests = onSnapshot(
          requestsQuery,
          (snapshot) => {
            const lista = snapshot.docs.map(
              (item) => ({
                id: item.id,
                ...item.data(),
              })
            )

            lista.sort(
              (a, b) =>
                (b.criadoEm?.toMillis?.() || 0) -
                (a.criadoEm?.toMillis?.() || 0)
            )

            setServicos(lista)
            setCarregando(false)
          },
          (error) => {
            console.error(
              'Erro ao carregar solicitações:',
              error
            )

            setCarregando(false)
          }
        )

        const proposalsQuery = query(
          collection(db, 'proposals'),
          where('solicitanteId', '==', user.uid)
        )

        unsubscribeProposals = onSnapshot(
          proposalsQuery,
          (snapshot) => {
            const lista = snapshot.docs.map(
              (item) => ({
                id: item.id,
                ...item.data(),
              })
            )

            setPropostas(lista)
          },
          (error) => {
            console.error(
              'Erro ao carregar propostas:',
              error
            )
          }
        )
      }
    )

    return () => {
      unsubscribeAuth()

      unsubscribeRequests?.()
      unsubscribeProposals?.()
    }
  }, [navigate])

  const nomeExibicao =
    nome
      ? nome.split(' ')[0]
      : 'você'

  const servicosAtivos =
    servicos.filter((item) =>
      [
        'contratada',
        'em_andamento',
      ].includes(item.status)
    ).length

  const propostasPendentes =
    propostas.filter(
      (item) => item.status === 'enviada'
    ).length

  function solicitar(categoria = '') {
    if (categoria) {
      navigate(
        `/solicitar?categoria=${categoria}`
      )

      return
    }

    navigate('/solicitar')
  }

  function nomeCategoria(valor) {
    const categoria = categorias.find(
      (item) => item.valor === valor
    )

    return categoria?.nome || 'Serviço'
  }

  function iconeCategoria(valor) {
    const categoria = categorias.find(
      (item) => item.valor === valor
    )

    return categoria?.icone || '＋'
  }

  function statusTexto(status) {
    if (status === 'em_andamento') {
      return 'Em andamento'
    }

    if (status === 'contratada') {
      return 'Contratado'
    }

    if (status === 'concluida') {
      return 'Concluído'
    }

    if (status === 'cancelada') {
      return 'Cancelado'
    }

    return 'Aberto'
  }

  if (carregando) {
    return (
      <section className="dashboard-loading">
        <div className="dashboard-loading-spinner"></div>

        <p>
          Carregando sua área...
        </p>
      </section>
    )
  }

  return (
    <section className="dashboard">

      {/* =================================================
          TOPO
          ================================================= */}

      <div className="dashboard-header">

        <div>

          <span className="dashboard-tag">
            ÁREA DO SOLICITANTE
          </span>

          <h1>
            Olá, {nomeExibicao}.
            <br />

            <strong>
              O que vamos resolver?
            </strong>
          </h1>

          <p>
            Encontre profissionais qualificados para
            realizar seus serviços com praticidade,
            transparência e segurança.
          </p>

        </div>

        <button
          type="button"
          className="dashboard-button"
          onClick={() => solicitar()}
        >
          + Solicitar serviço
        </button>

      </div>


      {/* =================================================
          RESUMO
          ================================================= */}

      <div className="dashboard-overview">

        <div className="dashboard-overview-item">

          <span>
            SEUS SERVIÇOS
          </span>

          <strong>
            {servicos.length}
          </strong>

          <small>
            solicitações criadas
          </small>

        </div>


        <div className="dashboard-overview-item">

          <span>
            EM ANDAMENTO
          </span>

          <strong>
            {servicosAtivos}
          </strong>

          <small>
            serviços contratados
          </small>

        </div>


        <div className="dashboard-overview-item">

          <span>
            PROPOSTAS
          </span>

          <strong>
            {propostasPendentes}
          </strong>

          <small>
            aguardando sua análise
          </small>

        </div>

      </div>


      {/* =================================================
          CATEGORIAS
          ================================================= */}

      <div
        className="dashboard-section"
        id="servicos"
      >

        <div className="dashboard-section-heading">

          <div>

            <span>
              ENCONTRE UM PROFISSIONAL
            </span>

            <h2>
              O que você precisa{' '}
              <strong>
                resolver?
              </strong>
            </h2>

          </div>

          <p>
            Escolha uma categoria e comece sua
            solicitação em poucos passos.
          </p>

        </div>


        <div className="dashboard-category-grid">

          {categorias.map(
            (categoria) => (
              <button
                type="button"
                className="dashboard-category-card"
                key={categoria.valor}
                onClick={() =>
                  solicitar(categoria.valor)
                }
              >

                <span className="dashboard-category-icon">
                  {categoria.icone}
                </span>

                <span className="dashboard-category-name">
                  {categoria.nome}
                </span>

                <span className="dashboard-category-description">
                  {categoria.descricao}
                </span>

                <span className="dashboard-category-action">
                  Solicitar →
                </span>

              </button>
            )
          )}

        </div>

      </div>


      {/* =================================================
          ATALHOS
          ================================================= */}

      <div className="dashboard-grid">

        <div className="dashboard-card">

          <span className="card-icon">
            ⌕
          </span>

          <h2>
            Solicitar um serviço
          </h2>

          <p>
            Descreva o que precisa e receba
            propostas de profissionais.
          </p>

          <button
            type="button"
            className="dashboard-card-button"
            onClick={() => solicitar()}
          >
            Criar solicitação →
          </button>

        </div>


        <div className="dashboard-card">

          <span className="card-icon">
            ◷
          </span>

          <h2>
            Meus serviços
          </h2>

          <p>
            Acompanhe suas solicitações e
            serviços em andamento.
          </p>

          <Link
            to="/meus-servicos"
            className="dashboard-card-button"
          >
            Ver meus serviços →
          </Link>

        </div>


        <div className="dashboard-card">

          <span className="card-icon">
            ★
          </span>

          <h2>
            Propostas recebidas
          </h2>

          <p>
            Compare profissionais, valores e
            avaliações antes de contratar.
          </p>

          <Link
            to="/propostas-recebidas"
            className="dashboard-card-button"
          >
            Ver propostas →
          </Link>

        </div>

      </div>


      {/* =================================================
          COMO FUNCIONA
          ================================================= */}

      <div
        className="dashboard-how"
        id="como-funciona"
      >

        <div className="dashboard-section-heading compact">

          <div>

            <span>
              COMO FUNCIONA
            </span>

            <h2>
              Resolver pode ser{' '}
              <strong>
                simples.
              </strong>
            </h2>

          </div>

          <p>
            Você solicita, profissionais enviam
            propostas e você escolhe quem contratar.
          </p>

        </div>


        <div className="dashboard-how-grid">

          <div className="dashboard-how-card">

            <span>
              01
            </span>

            <strong>
              Solicite
            </strong>

            <p>
              Conte o que você precisa resolver.
            </p>

          </div>


          <div className="dashboard-how-card">

            <span>
              02
            </span>

            <strong>
              Compare
            </strong>

            <p>
              Receba propostas e compare as opções.
            </p>

          </div>


          <div className="dashboard-how-card">

            <span>
              03
            </span>

            <strong>
              Contrate
            </strong>

            <p>
              Escolha o profissional ideal.
            </p>

          </div>


          <div className="dashboard-how-card">

            <span>
              04
            </span>

            <strong>
              Avalie
            </strong>

            <p>
              Avalie o serviço após sua conclusão.
            </p>

          </div>

        </div>

      </div>


      {/* =================================================
          ATIVIDADE RECENTE
          ================================================= */}

      {servicos.length === 0 ? (

        <div className="dashboard-empty">

          <span>
            SEUS SERVIÇOS
          </span>

          <h2>
            Você ainda não possui
            <br />
            solicitações.
          </h2>

          <p>
            Quando você solicitar um serviço,
            ele aparecerá aqui para acompanhar
            propostas e andamento.
          </p>

          <button
            type="button"
            className="dashboard-button"
            onClick={() => solicitar()}
          >
            Solicitar meu primeiro serviço →
          </button>

        </div>

      ) : (

        <div className="dashboard-recent">

          <div className="dashboard-section-heading compact">

            <div>

              <span>
                ATIVIDADE RECENTE
              </span>

              <h2>
                Seus últimos{' '}
                <strong>
                  serviços.
                </strong>
              </h2>

            </div>

            <Link to="/meus-servicos">
              Ver todos →
            </Link>

          </div>


          <div className="dashboard-recent-list">

            {servicos
              .slice(0, 4)
              .map((servico) => (

                <Link
                  to="/meus-servicos"
                  className="dashboard-recent-item"
                  key={servico.id}
                >

                  <span className="dashboard-recent-icon">
                    {iconeCategoria(
                      servico.categoria
                    )}
                  </span>


                  <div className="dashboard-recent-info">

                    <small>
                      {nomeCategoria(
                        servico.categoria
                      )}
                    </small>

                    <strong>
                      {servico.titulo ||
                        'Solicitação de serviço'}
                    </strong>

                  </div>


                  <span
                    className={
                      `dashboard-recent-status ` +
                      `status-${servico.status || 'aberta'}`
                    }
                  >
                    {statusTexto(
                      servico.status
                    )}
                  </span>

                  <span className="dashboard-recent-arrow">
                    →
                  </span>

                </Link>

              ))}

          </div>

        </div>

      )}

    </section>
  )
}

export default Dashboard