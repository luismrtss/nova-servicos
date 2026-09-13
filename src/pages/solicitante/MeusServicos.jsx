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

function MeusServicos() {
  const [usuario, setUsuario] = useState(null)
  const [servicos, setServicos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    let unsubscribeServicos = null

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setUsuario(null)
        setServicos([])
        setCarregando(false)
        navigate('/login')
        return
      }

      setUsuario(user)

      const servicosQuery = query(
        collection(db, 'requests'),
        where('usuarioId', '==', user.uid)
      )

      unsubscribeServicos = onSnapshot(
        servicosQuery,
        (snapshot) => {
          const lista = snapshot.docs.map((documento) => ({
            id: documento.id,
            ...documento.data(),
          }))

          lista.sort((a, b) => {
            const dataA = a.criadoEm?.toDate
              ? a.criadoEm.toDate()
              : new Date(0)

            const dataB = b.criadoEm?.toDate
              ? b.criadoEm.toDate()
              : new Date(0)

            return dataB - dataA
          })

          setServicos(lista)
          setCarregando(false)
          setErro('')
        },
        (error) => {
          console.error(
            'Erro ao carregar serviços:',
            error
          )

          setErro(
            'Não foi possível carregar seus serviços.'
          )

          setCarregando(false)
        }
      )
    })

    return () => {
      unsubscribeAuth()

      if (unsubscribeServicos) {
        unsubscribeServicos()
      }
    }
  }, [navigate])

  function formatarData(timestamp) {
    if (!timestamp?.toDate) {
      return 'Data não informada'
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

    return Number(valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  function obterNomeCategoria(categoria) {
    const categorias = {
      eletrica: 'Elétrica',
      hidraulica: 'Hidráulica',
      limpeza: 'Limpeza',
      pintura: 'Pintura',
      manutencao: 'Manutenção',
      climatizacao: 'Climatização',
    }

    return categorias[categoria] || categoria || 'Serviço'
  }

  function obterIconeCategoria(categoria) {
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

  function obterStatus(status) {
    const statusMap = {
      aberta: {
        nome: 'Aberta',
        classe: 'aberta',
      },

      contratada: {
        nome: 'Contratada',
        classe: 'contratada',
      },

      em_andamento: {
        nome: 'Em andamento',
        classe: 'andamento',
      },

      concluida: {
        nome: 'Concluída',
        classe: 'concluida',
      },

      cancelada: {
        nome: 'Cancelada',
        classe: 'cancelada',
      },
    }

    return (
      statusMap[status] || {
        nome: status || 'Aberta',
        classe: 'aberta',
      }
    )
  }

  function contarStatus(status) {
    return servicos.filter(
      (servico) => servico.status === status
    ).length
  }

  function abrirDetalhes(servico) {
    navigate(`/meus-servicos/${servico.id}`)
  }

  if (carregando) {
    return (
      <section className="my-services-page">
        <div className="my-services-container">
          <div className="my-services-loading">
            <div className="loading-spinner"></div>

            <p>
              Carregando seus serviços...
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="my-services-page">
      <div className="my-services-container">

        <div className="my-services-header">
          <div>
            <span className="section-eyebrow">
              MINHAS SOLICITAÇÕES
            </span>

            <h1>
              Serviços que você
              <br />
              <strong>precisa resolver.</strong>
            </h1>

            <p>
              Acompanhe suas solicitações e veja
              o andamento de cada serviço.
            </p>
          </div>

          <Link
            to="/solicitar"
            className="my-services-new-button"
          >
            <span>+</span>
            Solicitar serviço
          </Link>
        </div>


        <div className="my-services-stats">

          <div className="my-services-stat-card">
            <span className="my-services-stat-icon">
              ◉
            </span>

            <div>
              <strong>{servicos.length}</strong>
              <span>Total de serviços</span>
            </div>
          </div>

          <div className="my-services-stat-card">
            <span className="my-services-stat-icon">
              ◇
            </span>

            <div>
              <strong>
                {contarStatus('aberta')}
              </strong>

              <span>
                Solicitações abertas
              </span>
            </div>
          </div>

          <div className="my-services-stat-card">
            <span className="my-services-stat-icon">
              ✓
            </span>

            <div>
              <strong>
                {contarStatus('concluida')}
              </strong>

              <span>
                Serviços concluídos
              </span>
            </div>
          </div>

        </div>


        {erro && (
          <div className="my-services-error">
            <strong>Ops!</strong>
            <p>{erro}</p>
          </div>
        )}


        {servicos.length === 0 ? (

          <div className="my-services-empty">

            <div className="my-services-empty-icon">
              +
            </div>

            <h2>
              Você ainda não solicitou nenhum serviço.
            </h2>

            <p>
              Conte o que precisa resolver e encontre
              profissionais preparados para ajudar.
            </p>

            <Link
              to="/solicitar"
              className="my-services-empty-button"
            >
              Solicitar meu primeiro serviço
              <span>→</span>
            </Link>

          </div>

        ) : (

          <div className="my-services-content">

            <div className="my-services-list-header">
              <div>
                <h2>
                  Suas solicitações
                </h2>

                <span>
                  {servicos.length}{' '}
                  {servicos.length === 1
                    ? 'serviço'
                    : 'serviços'}
                </span>
              </div>
            </div>


            <div className="my-services-list">

              {servicos.map((servico) => {

                const status = obterStatus(
                  servico.status
                )

                return (
                  <article
                    key={servico.id}
                    className="my-service-card"
                  >

                    <div className="my-service-main">

                      <div className="my-service-icon">
                        {obterIconeCategoria(
                          servico.categoria
                        )}
                      </div>

                      <div className="my-service-info">

                        <div className="my-service-category">
                          {obterNomeCategoria(
                            servico.categoria
                          )}
                        </div>

                        <h3>
                          {servico.titulo ||
                            'Solicitação de serviço'}
                        </h3>

                        <p>
                          {servico.descricao ||
                            'Nenhuma descrição informada.'}
                        </p>

                        <div className="my-service-details">

                          {servico.localizacao && (
                            <span>
                              📍 {servico.localizacao}
                            </span>
                          )}

                          <span>
                            📅{' '}
                            {formatarData(
                              servico.criadoEm
                            )}
                          </span>

                          <span>
                            💰{' '}
                            {formatarValor(
                              servico.orcamento
                            )}
                          </span>

                        </div>

                      </div>

                    </div>


                    <div className="my-service-side">

                      <span
                        className={`my-service-status ${status.classe}`}
                      >
                        {status.nome}
                      </span>


                      {/* ABERTA */}

                      {servico.status === 'aberta' && (
                        <div className="my-service-actions">

                          <Link
                            to="/propostas-recebidas"
                            className="my-service-action"
                          >
                            Ver propostas
                            <span>→</span>
                          </Link>

                          <button
                            type="button"
                            className="my-service-action"
                            onClick={() =>
                              abrirDetalhes(servico)
                            }
                          >
                            Ver detalhes
                            <span>→</span>
                          </button>

                        </div>
                      )}


                      {/* CONTRATADA */}

                      {servico.status === 'contratada' && (
                        <button
                          type="button"
                          className="my-service-action"
                          onClick={() =>
                            abrirDetalhes(servico)
                          }
                        >
                          Ver serviço
                          <span>→</span>
                        </button>
                      )}


                      {/* EM ANDAMENTO */}

                      {servico.status === 'em_andamento' && (
                        <button
                          type="button"
                          className="my-service-action"
                          onClick={() =>
                            abrirDetalhes(servico)
                          }
                        >
                          Acompanhar
                          <span>→</span>
                        </button>
                      )}


                      {/* CONCLUÍDA */}

                      {servico.status === 'concluida' && (
                        <button
                          type="button"
                          className="my-service-action"
                          onClick={() =>
                            abrirDetalhes(servico)
                          }
                        >
                          Ver detalhes
                          <span>→</span>
                        </button>
                      )}


                      {/* CANCELADA */}

                      {servico.status === 'cancelada' && (
                        <button
                          type="button"
                          className="my-service-action"
                          onClick={() =>
                            abrirDetalhes(servico)
                          }
                        >
                          Ver detalhes
                          <span>→</span>
                        </button>
                      )}

                    </div>

                  </article>
                )
              })}

            </div>

          </div>

        )}

      </div>
    </section>
  )
}

export default MeusServicos