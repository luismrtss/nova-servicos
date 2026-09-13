import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { auth, db } from '../../firebase/config'

function PropostasRecebidas() {
  const [usuario, setUsuario] = useState(null)
  const [propostas, setPropostas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(null)
  const [erro, setErro] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    let unsubscribePropostas = null

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          setUsuario(null)
          setPropostas([])
          setCarregando(false)

          navigate('/login')
          return
        }

        setUsuario(user)

        const propostasQuery = query(
          collection(db, 'proposals'),
          where('solicitanteId', '==', user.uid)
        )

        unsubscribePropostas = onSnapshot(
          propostasQuery,
          async (snapshot) => {
            try {
              const propostasBase =
                snapshot.docs.map((documento) => ({
                  id: documento.id,
                  ...documento.data(),
                }))

              propostasBase.sort((a, b) => {
                const dataA = a.criadoEm?.toDate
                  ? a.criadoEm.toDate()
                  : a.data?.toDate
                    ? a.data.toDate()
                    : new Date(0)

                const dataB = b.criadoEm?.toDate
                  ? b.criadoEm.toDate()
                  : b.data?.toDate
                    ? b.data.toDate()
                    : new Date(0)

                return dataB - dataA
              })

              const propostasComDados =
                await Promise.all(
                  propostasBase.map(
                    async (proposta) => {
                      let solicitacao = null
                      let profissional = null

                      if (proposta.solicitacaoId) {
                        try {
                          const solicitacaoRef =
                            doc(
                              db,
                              'requests',
                              proposta.solicitacaoId
                            )

                          const solicitacaoSnapshot =
                            await getDoc(
                              solicitacaoRef
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

                      if (proposta.prestadorId) {
                        try {
                          const profissionalRef =
                            doc(
                              db,
                              'users',
                              proposta.prestadorId
                            )

                          const profissionalSnapshot =
                            await getDoc(
                              profissionalRef
                            )

                          if (
                            profissionalSnapshot.exists()
                          ) {
                            profissional = {
                              id:
                                profissionalSnapshot.id,
                              ...profissionalSnapshot.data(),
                            }
                          }
                        } catch (error) {
                          console.error(
                            'Erro ao carregar profissional:',
                            error
                          )
                        }
                      }

                      return {
                        ...proposta,
                        solicitacao,
                        profissional,
                      }
                    }
                  )
                )

              setPropostas(propostasComDados)
              setCarregando(false)
            } catch (error) {
              console.error(
                'Erro ao carregar propostas:',
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
              'Erro no listener de propostas:',
              error
            )

            setErro(
              'Não foi possível carregar suas propostas.'
            )

            setCarregando(false)
          }
        )
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

  function obterNomeCategoria(categoria) {
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

  function obterStatusProposta(status) {
    const statusMap = {
      pendente: {
        nome: 'Pendente',
        classe: 'pendente',
      },

      enviada: {
        nome: 'Enviada',
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

  async function aceitarProposta(proposta) {
    if (processando) {
      return
    }

    if (!proposta.solicitacaoId) {
      setErro(
        'Não foi possível identificar a solicitação desta proposta.'
      )
      return
    }

    const solicitacao = proposta.solicitacao

    if (
      solicitacao &&
      solicitacao.status !== 'aberta'
    ) {
      setErro(
        'Esta solicitação não está mais disponível para contratação.'
      )
      return
    }

    const confirmar = window.confirm(
      `Deseja contratar ${proposta.profissional?.nome || 'este profissional'} por ${formatarValor(proposta.valor)}?`
    )

    if (!confirmar) {
      return
    }

    setErro('')
    setProcessando(proposta.id)

    try {
      const propostaRef = doc(
        db,
        'proposals',
        proposta.id
      )

      const solicitacaoRef = doc(
        db,
        'requests',
        proposta.solicitacaoId
      )

      await updateDoc(
        propostaRef,
        {
          status: 'aceita',
          aceitaEm: serverTimestamp(),
        }
      )

      await updateDoc(
        solicitacaoRef,
        {
          status: 'contratada',
          prestadorId:
            proposta.prestadorId,
          propostaAceitaId:
            proposta.id,
          valorContratado:
            Number(proposta.valor) || 0,
          contratadoEm:
            serverTimestamp(),
        }
      )

      const propostasDaMesmaSolicitacao =
        propostas.filter(
          (item) =>
            item.solicitacaoId ===
            proposta.solicitacaoId &&
            item.id !== proposta.id &&
            item.status !== 'recusada'
        )

      await Promise.all(
        propostasDaMesmaSolicitacao.map(
          async (item) => {
            const outraPropostaRef =
              doc(
                db,
                'proposals',
                item.id
              )

            await updateDoc(
              outraPropostaRef,
              {
                status: 'recusada',
                recusadaAutomaticamente: true,
                recusadaEm:
                  serverTimestamp(),
              }
            )
          }
        )
      )

      navigate('/meus-servicos')
    } catch (error) {
      console.error(
        'Erro ao aceitar proposta:',
        error
      )

      setErro(
        'Não foi possível contratar este profissional. Tente novamente.'
      )
    } finally {
      setProcessando(null)
    }
  }

  async function recusarProposta(proposta) {
    if (processando) {
      return
    }

    const confirmar = window.confirm(
      'Deseja recusar esta proposta?'
    )

    if (!confirmar) {
      return
    }

    setErro('')
    setProcessando(proposta.id)

    try {
      const propostaRef = doc(
        db,
        'proposals',
        proposta.id
      )

      await updateDoc(
        propostaRef,
        {
          status: 'recusada',
          recusadaEm:
            serverTimestamp(),
        }
      )
    } catch (error) {
      console.error(
        'Erro ao recusar proposta:',
        error
      )

      setErro(
        'Não foi possível recusar a proposta.'
      )
    } finally {
      setProcessando(null)
    }
  }

  function calcularReputacao(proposta) {
    const profissionalId =
      proposta.prestadorId

    if (!profissionalId) {
      return null
    }

    const propostasDoProfissional =
      propostas.filter(
        (item) =>
          item.prestadorId ===
          profissionalId
      )

    let totalAvaliacoes = 0
    let somaNotas = 0

    propostasDoProfissional.forEach(
      (item) => {
        const nota =
          item.profissional?.notaMedia

        if (nota) {
          somaNotas += Number(nota)
          totalAvaliacoes++
        }
      }
    )

    if (!totalAvaliacoes) {
      return null
    }

    return (
      somaNotas / totalAvaliacoes
    ).toFixed(1)
  }

  const propostasPendentes =
    propostas.filter(
      (proposta) =>
        proposta.status !== 'recusada' &&
        proposta.status !== 'aceita'
    )

  const propostasAceitas =
    propostas.filter(
      (proposta) =>
        proposta.status === 'aceita'
    )

  if (carregando) {
    return (
      <section className="proposals-page">
        <div className="proposals-container">

          <div className="proposals-loading">

            <div className="loading-spinner"></div>

            <p>
              Carregando propostas...
            </p>

          </div>

        </div>
      </section>
    )
  }

  return (
    <section className="proposals-page">

      <div className="proposals-container">

        {/* CABEÇALHO */}

        <div className="proposals-header">

          <div>

            <span className="section-eyebrow">
              PROPOSTAS RECEBIDAS
            </span>

            <h1>
              Encontre quem vai
              <br />
              <strong>resolver para você.</strong>
            </h1>

            <p>
              Compare profissionais, valores e
              informações antes de escolher.
            </p>

          </div>

          <Link
            to="/meus-servicos"
            className="proposals-back-button"
          >
            ← Meus serviços
          </Link>

        </div>


        {/* RESUMO */}

        <div className="proposals-summary">

          <div className="proposals-summary-card">

            <span className="proposals-summary-icon">
              ◇
            </span>

            <div>
              <strong>
                {propostasPendentes.length}
              </strong>

              <span>
                Propostas disponíveis
              </span>
            </div>

          </div>


          <div className="proposals-summary-card">

            <span className="proposals-summary-icon">
              ✓
            </span>

            <div>
              <strong>
                {propostasAceitas.length}
              </strong>

              <span>
                Propostas aceitas
              </span>
            </div>

          </div>


          <div className="proposals-summary-card">

            <span className="proposals-summary-icon">
              ◉
            </span>

            <div>
              <strong>
                {propostas.length}
              </strong>

              <span>
                Total recebido
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


        {propostas.length === 0 ? (

          /* ESTADO VAZIO */

          <div className="proposals-empty">

            <div className="proposals-empty-icon">
              ◇
            </div>

            <h2>
              Você ainda não recebeu propostas.
            </h2>

            <p>
              Quando profissionais analisarem suas
              solicitações e enviarem propostas,
              elas aparecerão aqui.
            </p>

            <Link
              to="/meus-servicos"
              className="proposals-empty-button"
            >
              Voltar para meus serviços
              <span>→</span>
            </Link>

          </div>

        ) : (

          /* LISTA */

          <div className="proposals-content">

            <div className="proposals-list-header">

              <div>

                <h2>
                  Propostas
                </h2>

                <span>
                  Compare as opções antes de escolher.
                </span>

              </div>

            </div>


            <div className="proposals-list">

              {propostas.map((proposta) => {

                const status =
                  obterStatusProposta(
                    proposta.status
                  )

                const reputacao =
                  calcularReputacao(
                    proposta
                  )

                const nomeProfissional =
                  proposta.profissional?.nome ||
                  'Profissional'

                const inicial =
                  nomeProfissional
                    .charAt(0)
                    .toUpperCase()

                const nomeServico =
                  proposta.solicitacao?.titulo ||
                  'Serviço solicitado'

                const categoria =
                  proposta.solicitacao?.categoria

                const podeAceitar =
                  proposta.status !== 'aceita' &&
                  proposta.status !== 'recusada' &&
                  proposta.solicitacao?.status ===
                    'aberta'

                return (
                  <article
                    key={proposta.id}
                    className={`proposal-card ${status.classe}`}
                  >

                    {/* TOPO */}

                    <div className="proposal-card-top">

                      <div className="proposal-service">

                        <div className="proposal-service-icon">
                          {obterIconeCategoria(
                            categoria
                          )}
                        </div>

                        <div>

                          <span>
                            {obterNomeCategoria(
                              categoria
                            )}
                          </span>

                          <h3>
                            {nomeServico}
                          </h3>

                        </div>

                      </div>


                      <span
                        className={`proposal-status ${status.classe}`}
                      >
                        {status.nome}
                      </span>

                    </div>


                    {/* CORPO */}

                    <div className="proposal-card-body">

                      <div className="proposal-professional">

                        <div className="proposal-avatar">
                          {proposta.profissional?.fotoUrl ? (
                            <img
                              src={
                                proposta
                                  .profissional
                                  .fotoUrl
                              }
                              alt={
                                nomeProfissional
                              }
                            />
                          ) : (
                            inicial
                          )}
                        </div>

                        <div className="proposal-professional-info">

                          <strong>
                            {nomeProfissional}
                          </strong>

                          <span>
                            {proposta.profissional?.profissao ||
                              'Profissional'}
                          </span>

                          <div className="proposal-rating">

                            <span>
                              ★
                            </span>

                            <strong>
                              {reputacao ||
                                proposta.profissional?.notaMedia ||
                                'Novo'}
                            </strong>

                            {proposta.profissional?.totalAvaliacoes && (
                              <small>
                                ·{' '}
                                {
                                  proposta
                                    .profissional
                                    .totalAvaliacoes
                                }{' '}
                                avaliações
                              </small>
                            )}

                          </div>

                        </div>

                      </div>


                      <div className="proposal-price">

                        <span>
                          PROPOSTA
                        </span>

                        <strong>
                          {formatarValor(
                            proposta.valor
                          )}
                        </strong>

                      </div>

                    </div>


                    {/* MENSAGEM */}

                    {proposta.mensagem && (
                      <div className="proposal-message">

                        <span className="proposal-message-label">
                          Mensagem do profissional
                        </span>

                        <p>
                          “{proposta.mensagem}”
                        </p>

                      </div>
                    )}


                    {/* DETALHES */}

                    <div className="proposal-details">

                      {proposta.solicitacao?.localizacao && (
                        <span>
                          📍{' '}
                          {
                            proposta
                              .solicitacao
                              .localizacao
                          }
                        </span>
                      )}

                      {proposta.data && (
                        <span>
                          📅 Enviada em{' '}
                          {formatarData(
                            proposta.data
                          )}
                        </span>
                      )}

                    </div>


                    {/* AÇÕES */}

                    {podeAceitar && (
                      <div className="proposal-actions">

                        <button
                          type="button"
                          className="proposal-reject-button"
                          disabled={
                            processando !== null
                          }
                          onClick={() =>
                            recusarProposta(
                              proposta
                            )
                          }
                        >
                          {processando ===
                          proposta.id
                            ? 'Aguarde...'
                            : 'Recusar'}
                        </button>

                        <button
                          type="button"
                          className="proposal-accept-button"
                          disabled={
                            processando !== null
                          }
                          onClick={() =>
                            aceitarProposta(
                              proposta
                            )
                          }
                        >
                          {processando ===
                          proposta.id
                            ? 'Contratando...'
                            : 'Contratar profissional'}

                          <span>
                            →
                          </span>
                        </button>

                      </div>
                    )}

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

export default PropostasRecebidas