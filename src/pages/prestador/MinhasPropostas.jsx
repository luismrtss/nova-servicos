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

function MinhasPropostas() {
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [propostas, setPropostas] = useState([])
  const [filtro, setFiltro] = useState('todas')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let unsubscribePropostas = null

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          navigate('/login')
          return
        }

        setUsuario(user)

        try {
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
            async (snapshot) => {
              try {
                const propostasBase =
                  snapshot.docs.map(
                    (documento) => ({
                      id: documento.id,
                      ...documento.data(),
                    })
                  )

                propostasBase.sort((a, b) => {
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

                const propostasComDados =
                  await Promise.all(
                    propostasBase.map(
                      async (proposta) => {
                        let solicitacao = null

                        if (
                          proposta.solicitacaoId
                        ) {
                          try {
                            const solicitacaoSnapshot =
                              await getDoc(
                                doc(
                                  db,
                                  'requests',
                                  proposta.solicitacaoId
                                )
                              )

                            if (
                              solicitacaoSnapshot.exists()
                            ) {
                              solicitacao = {
                                id:
                                  solicitacaoSnapshot.id,
                                ...solicitacaoSnapshot.data(),
                              }
                            }
                          } catch (error) {
                            console.error(
                              'Erro ao carregar solicitação:',
                              error
                            )
                          }
                        }

                        return {
                          ...proposta,
                          solicitacao,
                        }
                      }
                    )
                  )

                setPropostas(
                  propostasComDados
                )

                setCarregando(false)
              } catch (error) {
                console.error(
                  'Erro ao processar propostas:',
                  error
                )

                setErro(
                  'Não foi possível carregar suas propostas.'
                )

                setCarregando(false)
              }
            },
            (error) => {
              console.error(
                'Erro ao carregar propostas:',
                error
              )

              setErro(
                'Não foi possível carregar suas propostas.'
              )

              setCarregando(false)
            }
          )
        } catch (error) {
          console.error(
            'Erro ao carregar perfil:',
            error
          )

          setErro(
            'Não foi possível carregar sua área.'
          )

          setCarregando(false)
        }
      }
    )

    return () => {
      unsubscribeAuth()

      if (unsubscribePropostas) {
        unsubscribePropostas()
      }
    }
  }, [navigate])

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

  function obterStatus(status) {
    const statusMap = {
      pendente: {
        nome: 'Pendente',
        classe: 'pendente',
      },

      enviada: {
        nome: 'Pendente',
        classe: 'pendente',
      },

      aceita: {
        nome: 'Aceita',
        classe: 'aceita',
      },

      recusada: {
        nome: 'Recusada',
        classe: 'recusada',
      },
    }

    return (
      statusMap[status] || {
        nome: 'Pendente',
        classe: 'pendente',
      }
    )
  }

  const propostasPendentes =
    propostas.filter(
      (proposta) =>
        proposta.status !== 'aceita' &&
        proposta.status !== 'recusada'
    )

  const propostasAceitas =
    propostas.filter(
      (proposta) =>
        proposta.status === 'aceita'
    )

  const propostasRecusadas =
    propostas.filter(
      (proposta) =>
        proposta.status === 'recusada'
    )

  const propostasFiltradas =
    filtro === 'todas'
      ? propostas
      : filtro === 'pendentes'
        ? propostasPendentes
        : filtro === 'aceitas'
          ? propostasAceitas
          : propostasRecusadas

  if (carregando) {
    return (
      <section className="provider-my-proposals-page">
        <div className="provider-my-proposals-container">

          <div className="provider-loading">

            <div className="loading-spinner"></div>

            <p>
              Carregando suas propostas...
            </p>

          </div>

        </div>
      </section>
    )
  }

  return (
    <section className="provider-my-proposals-page">

      <div className="provider-my-proposals-container">

        {/* ==================================================
            CABEÇALHO
            ================================================== */}

        <div className="provider-my-proposals-header">

          <div>

            <span className="section-eyebrow">
              MINHAS PROPOSTAS
            </span>

            <h1>
              Acompanhe suas
              <br />
              <strong>oportunidades.</strong>
            </h1>

            <p>
              Veja as propostas que você enviou
              e acompanhe o retorno dos clientes.
            </p>

          </div>

          <Link
            to="/prestador/servicos"
            className="provider-my-proposals-back"
          >
            ← Encontrar serviços
          </Link>

        </div>


        {/* ==================================================
            RESUMO
            ================================================== */}

        <div className="provider-my-proposals-stats">

          <div className="provider-my-proposals-stat">

            <div className="provider-my-proposals-stat-icon">
              ◇
            </div>

            <div>
              <strong>
                {propostas.length}
              </strong>

              <span>
                Total enviadas
              </span>
            </div>

          </div>


          <div className="provider-my-proposals-stat">

            <div className="provider-my-proposals-stat-icon">
              ◷
            </div>

            <div>
              <strong>
                {propostasPendentes.length}
              </strong>

              <span>
                Aguardando resposta
              </span>
            </div>

          </div>


          <div className="provider-my-proposals-stat">

            <div className="provider-my-proposals-stat-icon">
              ✓
            </div>

            <div>
              <strong>
                {propostasAceitas.length}
              </strong>

              <span>
                Aceitas
              </span>
            </div>

          </div>

        </div>


        {erro && (
          <div className="proposals-error">
            <span>!</span>
            {erro}
          </div>
        )}


        {/* ==================================================
            FILTROS
            ================================================== */}

        <div className="provider-my-proposals-filters">

          <button
            type="button"
            className={
              filtro === 'todas'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFiltro('todas')
            }
          >
            Todas
            <span>
              {propostas.length}
            </span>
          </button>


          <button
            type="button"
            className={
              filtro === 'pendentes'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFiltro('pendentes')
            }
          >
            Pendentes
            <span>
              {propostasPendentes.length}
            </span>
          </button>


          <button
            type="button"
            className={
              filtro === 'aceitas'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFiltro('aceitas')
            }
          >
            Aceitas
            <span>
              {propostasAceitas.length}
            </span>
          </button>


          <button
            type="button"
            className={
              filtro === 'recusadas'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFiltro('recusadas')
            }
          >
            Recusadas
            <span>
              {propostasRecusadas.length}
            </span>
          </button>

        </div>


        {/* ==================================================
            LISTA
            ================================================== */}

        {propostasFiltradas.length ===
        0 ? (

          <div className="provider-my-proposals-empty">

            <div className="provider-empty-icon">
              ◇
            </div>

            <h2>
              {propostas.length === 0
                ? 'Você ainda não enviou propostas.'
                : 'Nenhuma proposta nesta categoria.'}
            </h2>

            <p>
              {propostas.length === 0
                ? 'Encontre serviços disponíveis e envie sua primeira proposta para começar.'
                : 'Altere o filtro para visualizar outras propostas.'}
            </p>

            {propostas.length === 0 && (
              <Link
                to="/prestador/servicos"
                className="provider-primary-button"
              >
                Encontrar serviços
                <span>→</span>
              </Link>
            )}

          </div>

        ) : (

          <div className="provider-my-proposals-list">

            {propostasFiltradas.map(
              (proposta) => {

                const status =
                  obterStatus(
                    proposta.status
                  )

                const servico =
                  proposta.solicitacao

                return (
                  <article
                    key={proposta.id}
                    className={`provider-my-proposal-card ${status.classe}`}
                  >

                    {/* TOPO */}

                    <div className="provider-my-proposal-top">

                      <div className="provider-my-proposal-service">

                        <div className="provider-my-proposal-icon">
                          {obterIcone(
                            servico?.categoria
                          )}
                        </div>

                        <div>

                          <span>
                            {obterCategoria(
                              servico?.categoria
                            )}
                          </span>

                          <h2>
                            {servico?.titulo ||
                              'Serviço solicitado'}
                          </h2>

                        </div>

                      </div>


                      <span
                        className={`provider-my-proposal-status ${status.classe}`}
                      >
                        {status.nome}
                      </span>

                    </div>


                    {/* CORPO */}

                    <div className="provider-my-proposal-body">

                      <div className="provider-my-proposal-info">

                        <div>

                          <span>
                            SUA PROPOSTA
                          </span>

                          <strong>
                            {formatarValor(
                              proposta.valor
                            )}
                          </strong>

                        </div>


                        <div>

                          <span>
                            DATA PREVISTA
                          </span>

                          <strong>
                            {proposta.data
                              ? formatarData({
                                  toDate: () =>
                                    new Date(
                                      `${proposta.data}T00:00:00`
                                    ),
                                })
                              : 'A combinar'}
                          </strong>

                        </div>


                        <div>

                          <span>
                            ENVIADA EM
                          </span>

                          <strong>
                            {formatarData(
                              proposta.criadoEm
                            ) ||
                              'Recentemente'}
                          </strong>

                        </div>

                      </div>


                      <div className="provider-my-proposal-budget">

                        <span>
                          ORÇAMENTO DO CLIENTE
                        </span>

                        <strong>
                          {formatarValor(
                            servico?.orcamento
                          )}
                        </strong>

                      </div>

                    </div>


                    {/* MENSAGEM */}

                    {proposta.mensagem && (
                      <div className="provider-my-proposal-message">

                        <span>
                          SUA MENSAGEM
                        </span>

                        <p>
                          “{proposta.mensagem}”
                        </p>

                      </div>
                    )}


                    {/* RODAPÉ */}

                    <div className="provider-my-proposal-footer">

                      <div className="provider-my-proposal-location">

                        {servico?.localizacao && (
                          <span>
                            📍{' '}
                            {servico.localizacao}
                          </span>
                        )}

                      </div>


                      {servico?.id && (
                        <Link
                          to={`/prestador/servicos/${servico.id}`}
                          className="provider-my-proposal-view"
                        >
                          Ver serviço
                          <span>→</span>
                        </Link>
                      )}

                    </div>

                  </article>
                )
              }
            )}

          </div>

        )}

      </div>

    </section>
  )
}

export default MinhasPropostas