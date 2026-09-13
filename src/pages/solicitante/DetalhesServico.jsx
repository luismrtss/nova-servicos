import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore'
import { auth, db } from '../../firebase/config'

function DetalhesServico() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(null)
  const [servico, setServico] = useState(null)
  const [prestador, setPrestador] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [acaoModal, setAcaoModal] = useState('')
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    let unsubscribeServico = null

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

          if (!perfilSnapshot.exists()) {
            navigate('/login')
            return
          }

          const perfil = perfilSnapshot.data()

          if (perfil.tipo !== 'solicitante') {
            navigate('/prestador')
            return
          }

          unsubscribeServico = onSnapshot(
            doc(db, 'requests', id),
            async (snapshot) => {
              if (!snapshot.exists()) {
                setErro('Este serviço não foi encontrado.')
                setCarregando(false)
                return
              }

              const dadosServico = {
                id: snapshot.id,
                ...snapshot.data(),
              }

              if (dadosServico.usuarioId !== user.uid) {
                setErro(
                  'Você não tem permissão para visualizar este serviço.'
                )
                setCarregando(false)
                return
              }

              setServico(dadosServico)

              if (dadosServico.prestadorId) {
                try {
                  const prestadorSnapshot = await getDoc(
                    doc(
                      db,
                      'users',
                      dadosServico.prestadorId
                    )
                  )

                  if (prestadorSnapshot.exists()) {
                    setPrestador(
                      prestadorSnapshot.data()
                    )
                  }
                } catch (error) {
                  console.error(
                    'Erro ao carregar prestador:',
                    error
                  )
                }
              } else {
                setPrestador(null)
              }

              setCarregando(false)
            },
            (error) => {
              console.error(
                'Erro ao acompanhar serviço:',
                error
              )

              setErro(
                'Não foi possível carregar este serviço.'
              )

              setCarregando(false)
            }
          )
        } catch (error) {
          console.error(
            'Erro ao carregar serviço:',
            error
          )

          setErro(
            'Não foi possível carregar os dados do serviço.'
          )

          setCarregando(false)
        }
      }
    )

    return () => {
      unsubscribeAuth()

      if (unsubscribeServico) {
        unsubscribeServico()
      }
    }
  }, [id, navigate])

  function formatarData(timestamp) {
    if (!timestamp) {
      return '—'
    }

    let data = null

    if (timestamp?.toDate) {
      data = timestamp.toDate()
    } else if (timestamp instanceof Date) {
      data = timestamp
    } else {
      data = new Date(timestamp)
    }

    if (Number.isNaN(data.getTime())) {
      return '—'
    }

    return data.toLocaleDateString(
      'pt-BR',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }
    )
  }

  function formatarDataHora(timestamp) {
    if (!timestamp) {
      return '—'
    }

    let data = null

    if (timestamp?.toDate) {
      data = timestamp.toDate()
    } else if (timestamp instanceof Date) {
      data = timestamp
    } else {
      data = new Date(timestamp)
    }

    if (Number.isNaN(data.getTime())) {
      return '—'
    }

    return data.toLocaleString(
      'pt-BR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    )
  }

  function formatarValor(valor) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ''
    ) {
      return 'A combinar'
    }

    const numero = Number(valor)

    if (Number.isNaN(numero)) {
      return 'A combinar'
    }

    return numero.toLocaleString(
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

    return categorias[categoria] || categoria || 'Serviço'
  }

  function obterIcone(categoria) {
    const icones = {
      eletrica: '⚡',
      hidraulica: '◈',
      limpeza: '✦',
      pintura: '◒',
      manutencao: '⚙',
      climatizacao: '❄',
    }

    return icones[categoria] || '◈'
  }

  function obterStatusTexto(status) {
    const statusMap = {
      aberta: 'Aberta',
      contratada: 'Contratada',
      em_andamento: 'Em andamento',
      concluida: 'Concluída',
    }

    return statusMap[status] || 'Em análise'
  }

  function abrirConfirmacao(acao) {
    setAcaoModal(acao)
    setModalAberto(true)
  }

  function fecharModal() {
    if (processando) {
      return
    }

    setModalAberto(false)
    setAcaoModal('')
  }

  async function confirmarAcao() {
    if (!servico || processando) {
      return
    }

    setProcessando(true)
    setErro('')

    try {
      if (acaoModal === 'inicio') {
        const atualizacoes = {
          inicioConfirmadoSolicitante: true,
          inicioConfirmadoSolicitanteEm: new Date(),
        }

        if (servico.inicioConfirmadoPrestador) {
          atualizacoes.status = 'em_andamento'
          atualizacoes.iniciadoEm =
            servico.iniciadoEm || new Date()
        }

        await updateDoc(
          doc(db, 'requests', servico.id),
          atualizacoes
        )
      }

      if (acaoModal === 'conclusao') {
        const atualizacoes = {
          conclusaoConfirmadaSolicitante: true,
          conclusaoConfirmadaSolicitanteEm: new Date(),
        }

        if (
          servico.conclusaoConfirmadaPrestador
        ) {
          atualizacoes.status = 'concluida'
          atualizacoes.concluidoEm =
            servico.concluidoEm || new Date()
        }

        await updateDoc(
          doc(db, 'requests', servico.id),
          atualizacoes
        )
      }

      setModalAberto(false)
      setAcaoModal('')
    } catch (error) {
      console.error(
        'Erro ao atualizar serviço:',
        error
      )

      setErro(
        'Não foi possível atualizar o serviço. Tente novamente.'
      )
    } finally {
      setProcessando(false)
    }
  }

  function obterEtapaAtual() {
    if (!servico) {
      return 0
    }

    if (servico.status === 'concluida') {
      return 3
    }

    if (
      servico.inicioConfirmadoPrestador &&
      servico.inicioConfirmadoSolicitante
    ) {
      return 2
    }

    if (servico.status === 'contratada') {
      return 1
    }

    if (servico.status === 'em_andamento') {
      return 2
    }

    return 0
  }

  const etapaAtual = obterEtapaAtual()

  const inicioSolicitanteConfirmado =
    Boolean(
      servico?.inicioConfirmadoSolicitante
    )

  const inicioPrestadorConfirmado =
    Boolean(
      servico?.inicioConfirmadoPrestador
    )

  const ambosConfirmaramInicio =
    inicioSolicitanteConfirmado &&
    inicioPrestadorConfirmado

  const conclusaoSolicitanteConfirmada =
    Boolean(
      servico?.conclusaoConfirmadaSolicitante
    )

  const conclusaoPrestadorConfirmada =
    Boolean(
      servico?.conclusaoConfirmadaPrestador
    )

  const ambosConfirmaramConclusao =
    conclusaoSolicitanteConfirmada &&
    conclusaoPrestadorConfirmada

  if (carregando) {
    return (
      <section className="requester-service-detail-page">
        <div className="requester-service-detail-container">
          <div className="provider-loading">
            <div className="loading-spinner"></div>

            <p>
              Carregando serviço...
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (erro && !servico) {
    return (
      <section className="requester-service-detail-page">
        <div className="requester-service-detail-container">

          <div className="requester-detail-error">

            <div className="requester-detail-error-icon">
              !
            </div>

            <h2>
              Não foi possível carregar
            </h2>

            <p>
              {erro}
            </p>

            <Link
              to="/meus-servicos"
              className="requester-detail-primary-button"
            >
              Voltar para meus serviços
            </Link>

          </div>

        </div>
      </section>
    )
  }

  return (
    <section className="requester-service-detail-page">

      <div className="requester-service-detail-container">

        {/* VOLTAR */}

        <Link
          to="/meus-servicos"
          className="requester-detail-back"
        >
          <span>←</span>
          Voltar para meus serviços
        </Link>


        {/* CABEÇALHO */}

        <div className="requester-detail-header">

          <div className="requester-detail-title-area">

            <div className="requester-detail-category-icon">
              {obterIcone(servico.categoria)}
            </div>

            <div>

              <span className="requester-detail-category">
                {obterCategoria(
                  servico.categoria
                )}
              </span>

              <h1>
                {servico.titulo}
              </h1>

              <p>
                Acompanhe o andamento do seu serviço.
              </p>

            </div>

          </div>

          <span
            className={`requester-detail-status status-${servico.status}`}
          >
            {obterStatusTexto(
              servico.status
            )}
          </span>

        </div>


        {erro && (
          <div className="proposals-error">
            <span>!</span>
            {erro}
          </div>
        )}


        {/* ACOMPANHAMENTO */}

        <div className="requester-detail-card">

          <div className="requester-detail-card-header">

            <div>

              <span className="section-eyebrow">
                ACOMPANHAMENTO
              </span>

              <h2>
                Andamento do serviço
              </h2>

            </div>

            <span className="requester-detail-step-counter">
              {etapaAtual === 3
                ? 'Serviço finalizado'
                : `Etapa ${etapaAtual} de 3`}
            </span>

          </div>


          <div className="requester-detail-timeline">

            {/* ETAPA 1 */}

            <div
              className={`requester-detail-timeline-item ${
                etapaAtual >= 1
                  ? 'completed'
                  : ''
              } ${
                etapaAtual === 1
                  ? 'current'
                  : ''
              }`}
            >

              <div className="requester-detail-timeline-marker">
                {etapaAtual >= 1
                  ? '✓'
                  : '1'}
              </div>

              <div className="requester-detail-timeline-content">

                <strong>
                  Serviço contratado
                </strong>

                <span>
                  Você contratou o prestador
                  para realizar este serviço.
                </span>

                {servico.contratadoEm && (
                  <small>
                    {formatarDataHora(
                      servico.contratadoEm
                    )}
                  </small>
                )}

              </div>

            </div>


            <div
              className={`requester-detail-timeline-line ${
                etapaAtual >= 2
                  ? 'active'
                  : ''
              }`}
            ></div>


            {/* ETAPA 2 */}

            <div
              className={`requester-detail-timeline-item ${
                etapaAtual >= 2
                  ? 'completed'
                  : ''
              } ${
                etapaAtual === 2
                  ? 'current'
                  : ''
              }`}
            >

              <div className="requester-detail-timeline-marker">
                {etapaAtual >= 2
                  ? '✓'
                  : '2'}
              </div>

              <div className="requester-detail-timeline-content">

                <strong>
                  Início confirmado
                </strong>

                <span>
                  O serviço só avança quando
                  você e o prestador confirmarem
                  o início.
                </span>

                <div className="requester-confirmation-status">

                  <span
                    className={
                      inicioSolicitanteConfirmado
                        ? 'confirmed'
                        : ''
                    }
                  >
                    {inicioSolicitanteConfirmado
                      ? '✓ Você confirmou'
                      : '○ Aguardando sua confirmação'}
                  </span>

                  <span
                    className={
                      inicioPrestadorConfirmado
                        ? 'confirmed'
                        : ''
                    }
                  >
                    {inicioPrestadorConfirmado
                      ? '✓ Prestador confirmou'
                      : '○ Aguardando prestador'}
                  </span>

                </div>

                {servico.iniciadoEm && (
                  <small>
                    Início registrado em{' '}
                    {formatarDataHora(
                      servico.iniciadoEm
                    )}
                  </small>
                )}

              </div>

            </div>


            <div
              className={`requester-detail-timeline-line ${
                etapaAtual >= 3
                  ? 'active'
                  : ''
              }`}
            ></div>


            {/* ETAPA 3 */}

            <div
              className={`requester-detail-timeline-item ${
                etapaAtual >= 3
                  ? 'completed'
                  : ''
              } ${
                etapaAtual === 3
                  ? 'current'
                  : ''
              }`}
            >

              <div className="requester-detail-timeline-marker">
                {etapaAtual >= 3
                  ? '✓'
                  : '3'}
              </div>

              <div className="requester-detail-timeline-content">

                <strong>
                  Conclusão
                </strong>

                <span>
                  Depois que os dois confirmarem
                  o início, vocês poderão confirmar
                  a conclusão do serviço.
                </span>

                <div className="requester-confirmation-status">

                  <span
                    className={
                      conclusaoSolicitanteConfirmada
                        ? 'confirmed'
                        : ''
                    }
                  >
                    {conclusaoSolicitanteConfirmada
                      ? '✓ Você confirmou'
                      : '○ Aguardando sua confirmação'}
                  </span>

                  <span
                    className={
                      conclusaoPrestadorConfirmada
                        ? 'confirmed'
                        : ''
                    }
                  >
                    {conclusaoPrestadorConfirmada
                      ? '✓ Prestador confirmou'
                      : '○ Aguardando prestador'}
                  </span>

                </div>

                {servico.concluidoEm && (
                  <small>
                    Finalizado em{' '}
                    {formatarDataHora(
                      servico.concluidoEm
                    )}
                  </small>
                )}

              </div>

            </div>

          </div>


          {/* AÇÃO DE INÍCIO */}

          {servico.status === 'contratada' &&
            !inicioSolicitanteConfirmado && (

            <div className="requester-detail-action-box">

              <div className="requester-detail-action-icon">
                ▶
              </div>

              <div className="requester-detail-action-content">

                <strong>
                  O serviço começou?
                </strong>

                <p>
                  Confirme quando o prestador
                  realmente iniciar o trabalho.
                  O serviço só avançará depois
                  que os dois confirmarem.
                </p>

              </div>

              <button
                type="button"
                className="requester-detail-primary-button"
                onClick={() =>
                  abrirConfirmacao('inicio')
                }
              >
                Confirmar início
                <span>→</span>
              </button>

            </div>
          )}


          {/* AGUARDANDO PRESTADOR */}

          {servico.status === 'contratada' &&
            inicioSolicitanteConfirmado &&
            !inicioPrestadorConfirmado && (

            <div className="requester-detail-waiting-box">

              <div className="requester-detail-waiting-icon">
                ◷
              </div>

              <div>

                <strong>
                  Aguardando o prestador
                </strong>

                <p>
                  Você já confirmou o início.
                  Agora falta o prestador confirmar
                  para o serviço entrar em andamento.
                </p>

              </div>

            </div>
          )}


          {/* SERVIÇO EM ANDAMENTO */}

          {ambosConfirmaramInicio &&
            servico.status === 'em_andamento' &&
            !conclusaoSolicitanteConfirmada && (

            <div className="requester-detail-action-box">

              <div className="requester-detail-action-icon">
                ✓
              </div>

              <div className="requester-detail-action-content">

                <strong>
                  O serviço foi finalizado?
                </strong>

                <p>
                  Se o trabalho foi concluído,
                  confirme o término. A conclusão
                  só será registrada quando você
                  e o prestador confirmarem.
                </p>

              </div>

              <button
                type="button"
                className="requester-detail-primary-button"
                onClick={() =>
                  abrirConfirmacao('conclusao')
                }
              >
                Confirmar conclusão
                <span>→</span>
              </button>

            </div>
          )}


          {/* AGUARDANDO PRESTADOR NA CONCLUSÃO */}

          {ambosConfirmaramInicio &&
            servico.status === 'em_andamento' &&
            conclusaoSolicitanteConfirmada &&
            !conclusaoPrestadorConfirmada && (

            <div className="requester-detail-waiting-box">

              <div className="requester-detail-waiting-icon">
                ◷
              </div>

              <div>

                <strong>
                  Aguardando o prestador
                </strong>

                <p>
                  Você já confirmou a conclusão.
                  O serviço será finalizado quando
                  o prestador também confirmar.
                </p>

              </div>

            </div>
          )}


          {/* CONCLUÍDO */}

          {servico.status === 'concluida' && (
            <div className="requester-detail-completed-box">

              <div className="requester-detail-completed-icon">
                ✓
              </div>

              <div>

                <strong>
                  Serviço concluído
                </strong>

                <p>
                  Os dois lados confirmaram a
                  conclusão. Agora você pode avaliar
                  sua experiência com o prestador.
                </p>

              </div>

              <button
                type="button"
                className="requester-detail-secondary-button"
                onClick={() =>
                  navigate(
                    `/meus-servicos/${servico.id}/avaliar`
                  )
                }
              >
                Avaliar prestador
                <span>→</span>
              </button>

            </div>
          )}

        </div>


        {/* INFORMAÇÕES */}

        <div className="requester-detail-grid">

          <div className="requester-detail-info-card">

            <div className="requester-detail-info-header">
              <span>
                DETALHES DO SERVIÇO
              </span>
            </div>

            <div className="requester-detail-info-list">

              <div>
                <span>Descrição</span>

                <strong>
                  {servico.descricao ||
                    'Nenhuma descrição informada.'}
                </strong>
              </div>

              <div>
                <span>Localização</span>

                <strong>
                  {servico.localizacao ||
                    'Não informado'}
                </strong>
              </div>

              <div>
                <span>Data desejada</span>

                <strong>
                  {servico.dataDesejada
                    ? formatarData(
                        servico.dataDesejada
                      )
                    : 'Não definida'}
                </strong>
              </div>

              <div>
                <span>Valor contratado</span>

                <strong>
                  {formatarValor(
                    servico.valorContratado ??
                      servico.orcamento
                  )}
                </strong>
              </div>

            </div>

          </div>


          <div className="requester-detail-info-card">

            <div className="requester-detail-info-header">
              <span>
                PRESTADOR
              </span>
            </div>

            {prestador ? (

              <div className="requester-detail-provider">

                <div className="requester-detail-provider-avatar">
                  {prestador.nome
                    ?.charAt(0)
                    .toUpperCase() || 'P'}
                </div>

                <div className="requester-detail-provider-data">

                  <strong>
                    {prestador.nome ||
                      'Prestador'}
                  </strong>

                  <span>
                    {prestador.cidade ||
                      'Localização não informada'}
                  </span>

                  {prestador.telefone && (
                    <span>
                      {prestador.telefone}
                    </span>
                  )}

                </div>

                <Link
                  to="/perfil"
                  className="requester-detail-provider-link"
                >
                  Perfil
                  <span>→</span>
                </Link>

              </div>

            ) : (

              <div className="requester-detail-no-provider">

                <span>—</span>

                <p>
                  Nenhum prestador vinculado
                  a este serviço.
                </p>

              </div>

            )}

          </div>

        </div>


        <div className="requester-detail-request-info">

          <span>
            Solicitação criada em
          </span>

          <strong>
            {formatarDataHora(
              servico.criadoEm
            )}
          </strong>

        </div>

      </div>


      {/* MODAL */}

      {modalAberto && (

        <div
          className="requester-detail-modal-overlay"
          onClick={fecharModal}
        >

          <div
            className="requester-detail-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="requester-detail-modal-icon">
              {acaoModal === 'inicio'
                ? '▶'
                : '✓'}
            </div>

            <h3>
              {acaoModal === 'inicio'
                ? 'Confirmar início?'
                : 'Confirmar conclusão?'}
            </h3>

            <p>
              {acaoModal === 'inicio'
                ? 'Confirme apenas se o prestador realmente iniciou o serviço. O serviço avançará quando os dois lados confirmarem.'
                : 'Confirme apenas se o serviço foi realmente concluído. A conclusão será registrada quando os dois lados confirmarem.'}
            </p>

            <div className="requester-detail-modal-actions">

              <button
                type="button"
                className="requester-detail-modal-cancel"
                onClick={fecharModal}
                disabled={processando}
              >
                Voltar
              </button>

              <button
                type="button"
                className="requester-detail-modal-confirm"
                onClick={confirmarAcao}
                disabled={processando}
              >
                {processando
                  ? 'Salvando...'
                  : 'Sim, confirmar'}
              </button>

            </div>

          </div>

        </div>
      )}

    </section>
  )
}

export default DetalhesServico