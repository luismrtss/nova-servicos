import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { auth, db } from '../../firebase/config'

function PrestadorDashboard() {
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [servicos, setServicos] = useState([])
  const [propostas, setPropostas] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let unsubscribeServicos = null
    let unsubscribePropostas = null

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          setUsuario(null)
          setCarregando(false)
          navigate('/login')
          return
        }

        setUsuario(user)

        try {
          const { doc, getDoc } = await import(
            'firebase/firestore'
          )

          const perfilSnapshot = await getDoc(
            doc(db, 'users', user.uid)
          )

          if (perfilSnapshot.exists()) {
            const dadosPerfil =
              perfilSnapshot.data()

            if (
              dadosPerfil.tipo !== 'prestador'
            ) {
              navigate('/solicitante')
              return
            }

            setPerfil(dadosPerfil)
          }
        } catch (error) {
          console.error(
            'Erro ao carregar perfil:',
            error
          )
        }

        const servicosQuery = query(
          collection(db, 'requests'),
          where('status', '==', 'aberta')
        )

        unsubscribeServicos = onSnapshot(
          servicosQuery,
          (snapshot) => {
            const lista = snapshot.docs.map(
              (documento) => ({
                id: documento.id,
                ...documento.data(),
              })
            )

            lista.sort((a, b) => {
              const dataA =
                a.criadoEm?.toDate
                  ? a.criadoEm.toDate()
                  : new Date(0)

              const dataB =
                b.criadoEm?.toDate
                  ? b.criadoEm.toDate()
                  : new Date(0)

              return dataB - dataA
            })

            setServicos(lista)
            setCarregando(false)
          },
          (error) => {
            console.error(
              'Erro ao carregar serviços:',
              error
            )

            setCarregando(false)
          }
        )

        const propostasQuery = query(
          collection(db, 'proposals'),
          where(
            'prestadorId',
            '==',
            user.uid
          )
        )

        unsubscribePropostas = onSnapshot(
          propostasQuery,
          (snapshot) => {
            const lista = snapshot.docs.map(
              (documento) => ({
                id: documento.id,
                ...documento.data(),
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

      if (unsubscribeServicos) {
        unsubscribeServicos()
      }

      if (unsubscribePropostas) {
        unsubscribePropostas()
      }
    }
  }, [navigate])

  function formatarData(timestamp) {
    if (!timestamp?.toDate) {
      return ''
    }

    return timestamp
      .toDate()
      .toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
  }

  function formatarValor(valor) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ''
    ) {
      return 'A combinar'
    }

    return Number(valor).toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL',
      }
    )
  }

  function obterCategoria(categoria) {
    const categorias = {
      eletrica: 'Elétrica',
      hidraulica: 'Hidráulica',
      limpeza: 'Limpeza',
      pintura: 'Pintura',
      manutencao: 'Manutenção',
      climatizacao: 'Climatização',
    }

    return (
      categorias[categoria] ||
      categoria ||
      'Serviço'
    )
  }

  function obterIcone(categoria) {
    const icones = {
      eletrica: '⚡',
      hidraulica: '🔧',
      limpeza: '✦',
      pintura: '◈',
      manutencao: '🛠',
      climatizacao: '❄',
    }

    return icones[categoria] || '◉'
  }

  const propostasEnviadas =
    propostas.filter(
      (proposta) =>
        proposta.status !== 'recusada'
    ).length

  const propostasAceitas =
    propostas.filter(
      (proposta) =>
        proposta.status === 'aceita'
    ).length

  const servicosRecentes =
    servicos.slice(0, 3)

  if (carregando) {
    return (
      <section className="provider-dashboard-page">
        <div className="provider-dashboard-container">

          <div className="provider-loading">

            <div className="loading-spinner"></div>

            <p>
              Carregando sua área...
            </p>

          </div>

        </div>
      </section>
    )
  }

  return (
    <section className="provider-dashboard-page">

      <div className="provider-dashboard-container">

        {/* =====================================================
            BOAS-VINDAS
            ===================================================== */}

        <div className="provider-welcome">

          <div>

            <span className="section-eyebrow">
              ÁREA DO PROFISSIONAL
            </span>

            <h1>
              Olá,
              <br />
              <strong>
                {perfil?.nome ||
                  usuario?.displayName ||
                  'profissional'}
                .
              </strong>
            </h1>

            <p>
              Encontre novas oportunidades e
              acompanhe seus serviços pela NOVA.
            </p>

          </div>

          <Link
            to="/prestador/servicos"
            className="provider-primary-button"
          >
            Encontrar serviços
            <span>→</span>
          </Link>

        </div>


        {/* =====================================================
            RESUMO
            ===================================================== */}

        <div className="provider-stats">

          <div className="provider-stat-card">

            <div className="provider-stat-icon">
              ◇
            </div>

            <div>
              <strong>
                {servicos.length}
              </strong>

              <span>
                Serviços disponíveis
              </span>
            </div>

          </div>


          <div className="provider-stat-card">

            <div className="provider-stat-icon">
              ↑
            </div>

            <div>
              <strong>
                {propostasEnviadas}
              </strong>

              <span>
                Propostas enviadas
              </span>
            </div>

          </div>


          <div className="provider-stat-card">

            <div className="provider-stat-icon">
              ✓
            </div>

            <div>
              <strong>
                {propostasAceitas}
              </strong>

              <span>
                Serviços contratados
              </span>
            </div>

          </div>

        </div>


        {/* =====================================================
            AÇÕES RÁPIDAS
            ===================================================== */}

        <div className="provider-section-heading">

          <div>

            <span className="section-eyebrow">
              ACESSO RÁPIDO
            </span>

            <h2>
              O que você quer fazer?
            </h2>

          </div>

        </div>


        <div className="provider-quick-actions">

          <Link
            to="/prestador/servicos"
            className="provider-action-card"
          >

            <div className="provider-action-icon">
              ◇
            </div>

            <div>

              <strong>
                Encontrar serviços
              </strong>

              <span>
                Veja solicitações próximas a você
                e encontre novas oportunidades.
              </span>

            </div>

            <span className="provider-action-arrow">
              →
            </span>

          </Link>


          <Link
            to="/prestador/minhas-propostas"
            className="provider-action-card"
          >

            <div className="provider-action-icon">
              ↑
            </div>

            <div>

              <strong>
                Minhas propostas
              </strong>

              <span>
                Acompanhe as propostas que você
                enviou aos clientes.
              </span>

            </div>

            <span className="provider-action-arrow">
              →
            </span>

          </Link>


          <Link
            to="/prestador/meus-servicos"
            className="provider-action-card"
          >

            <div className="provider-action-icon">
              ✓
            </div>

            <div>

              <strong>
                Meus serviços
              </strong>

              <span>
                Acompanhe os serviços que você
                conquistou.
              </span>

            </div>

            <span className="provider-action-arrow">
              →
            </span>

          </Link>

        </div>


        {/* =====================================================
            SERVIÇOS DISPONÍVEIS
            ===================================================== */}

        <div className="provider-section-heading provider-services-heading">

          <div>

            <span className="section-eyebrow">
              OPORTUNIDADES
            </span>

            <h2>
              Serviços disponíveis
            </h2>

            <p>
              Solicitações que podem combinar
              com o que você oferece.
            </p>

          </div>

          <Link
            to="/prestador/servicos"
            className="provider-see-all"
          >
            Ver todos →
          </Link>

        </div>


        {servicosRecentes.length === 0 ? (

          <div className="provider-empty">

            <div className="provider-empty-icon">
              ◇
            </div>

            <h3>
              Nenhum serviço disponível no momento.
            </h3>

            <p>
              Novas solicitações aparecerão aqui
              assim que forem publicadas.
            </p>

          </div>

        ) : (

          <div className="provider-services-list">

            {servicosRecentes.map(
              (servico) => (

                <Link
                  key={servico.id}
                  to={`/prestador/servicos/${servico.id}`}
                  className="provider-service-card"
                >

                  <div className="provider-service-icon">
                    {obterIcone(
                      servico.categoria
                    )}
                  </div>


                  <div className="provider-service-info">

                    <span>
                      {obterCategoria(
                        servico.categoria
                      )}
                    </span>

                    <h3>
                      {servico.titulo ||
                        'Serviço solicitado'}
                    </h3>

                    <p>
                      {servico.descricao ||
                        'Nenhuma descrição informada.'}
                    </p>

                    <div className="provider-service-meta">

                      {servico.localizacao && (
                        <span>
                          📍{' '}
                          {servico.localizacao}
                        </span>
                      )}

                      {servico.criadoEm && (
                        <span>
                          📅{' '}
                          {formatarData(
                            servico.criadoEm
                          )}
                        </span>
                      )}

                    </div>

                  </div>


                  <div className="provider-service-value">

                    <span>
                      ORÇAMENTO
                    </span>

                    <strong>
                      {formatarValor(
                        servico.orcamento
                      )}
                    </strong>

                    <span className="provider-service-arrow">
                      →
                    </span>

                  </div>

                </Link>

              )
            )}

          </div>

        )}

      </div>

    </section>
  )
}

export default PrestadorDashboard