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
  const [solicitante, setSolicitante] = useState(null)
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

          if (perfil.tipo !== 'prestador') {
            navigate('/solicitante')
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

              if (dadosServico.prestadorId !== user.uid) {
                setErro(
                  'Você não tem permissão para visualizar este serviço.'
                )
                setCarregando(false)
                return
              }

              setServico(dadosServico)

              if (dadosServico.usuarioId) {
                try {
                  const solicitanteSnapshot = await getDoc(
                    doc(
                      db,
                      'users',
                      dadosServico.usuarioId
                    )
                  )

                  if (solicitanteSnapshot.exists()) {
                    setSolicitante(
                      solicitanteSnapshot.data()
                    )
                  }
                } catch (error) {
                  console.error(
                    'Erro ao carregar solicitante:',
                    error
                  )
                }
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
          inicioConfirmadoPrestador: true,
          inicioConfirmadoPrestadorEm: new Date(),
        }

        if (
          servico.inicioConfirmadoSolicitante
        ) {
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
          conclusaoConfirmadaPrestador: true,
          conclusaoConfirmadaPrestadorEm: new Date(),
        }

        if (
          servico.conclusaoConfirmadaSolicitante
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

  const inicioPrestadorConfirmado =
    Boolean(
      servico?.inicioConfirmadoPrestador
    )

  const inicioSolicitanteConfirmado =
    Boolean(
      servico?.inicioConfirmadoSolicitante
    )

  const ambosConfirmaramInicio =
    inicioPrestadorConfirmado &&
    inicioSolicitanteConfirmado

  const conclusaoPrestadorConfirmada =
    Boolean(
      servico?.conclusaoConfirmadaPrestador
    )

  const conclusaoSolicitanteConfirmada =
    Boolean(
      servico?.conclusaoConfirmadaSolicitante
    )

  if (carregando) {
    return (
      <section className="provider-service-detail-page">

        <div className="provider-service-detail-container">

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
      <section className="provider-service-detail-page">

        <div className="provider-service-detail-container">

          <div className="provider-service-detail-error">

            <div className="provider-service-detail-error-icon">
              !
            </div>

            <h2>
              Não foi possível carregar
            </h2>

            <p>
              {erro}
            </p>

            <Link
              to="/prestador/meus-servicos"
              className="provider-service-detail-primary-button"
            >
              Voltar para meus serviços
            </Link>

          </div>

        </div>

      </section>
    )
  }

  return (
    <section className="provider-service-detail-page">

      <div className="provider-service-detail-container">

        {/* VOLTAR */}

        <Link
          to="/prestador/meus-servicos"
          className="provider-service-detail-back"
        >
          <span>←</span>
          Voltar para meus serviços
        </Link>


        {/* CABEÇALHO */}

        <div className="provider-service-detail-header">

          <div className="provider-service-detail-title-area">

            <div className="provider-service-detail-category-icon">
              {obterIcone(servico.categoria)}
            </div>

            <div>

              <span className="provider-service-detail-category">
                {obterCategoria(
                  servico.categoria
                )}
              </span>

              <h1>
                {servico.titulo}
              </h1>

              <p>
                Acompanhe e atualize o andamento
                deste serviço.
              </p>

            </div>

          </div>

          <span
            className={`provider-service-detail-status status-${servico.status}`}
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

        <div className="provider-service-detail-card">

          <div className="provider-service-detail-card-header">

            <div>

              <span className="section-eyebrow">
                ACOMPANHAMENTO
              </span>

              <h2>
                Andamento do serviço
              </h2>

            </div>

            <span className="provider-service-detail-step-counter">
              {etapaAtual === 3
                ? 'Serviço finalizado'
                : `Etapa ${etapaAtual} de 3`}
            </span>

          </div>


          <div className="provider-service-detail-timeline">

            {/* CONTRATADO */}

            <div
              className={`provider-service-detail-timeline-item ${
                etapaAtual >= 1
                  ? 'completed'
                  : ''
              } ${
                etapaAtual === 1
                  ? 'current'
                  : ''
              }`}
            >

              <div className="provider-service-detail-timeline-marker">
                {etapaAtual >= 1
                  ? '✓'
                  : '1'}
              </div>

              <div className="provider-service-detail-timeline-content">

                <strong>
                  Serviço contratado
                </strong>

                <span>
                  O cliente escolheu sua proposta
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
              className={`provider-service-detail-timeline-line ${
                etapaAtual >= 2
                  ? 'active'
                  : ''
              }`}
            ></div>


            {/* INÍCIO */}

            <div
              className={`provider-service-detail-timeline-item ${
                etapaAtual >= 2
                  ? 'completed'
                  : ''
              } ${
                etapaAtual === 2
                  ? 'current'
                  : ''
              }`}
            >

              <div className="provider-service-detail-timeline-marker">
                {etapaAtual >= 2
                  ? '✓'
                  : '2'}
              </div>

              <div className="provider-service-detail-timeline-content">

                <strong>
                  Início confirmado
                </strong>

                <span>
                  O serviço só entra em andamento
                  depois que os dois lados confirmarem
                  o início.
                </span>

                <div className="provider-confirmation-status">

                  <span
                    className={
                      inicioPrestadorConfirmado
                        ? 'confirmed'
                        : ''
                    }
                  >
                    {inicioPrestadorConfirmado
                      ? '✓ Você confirmou'
                      : '○ Aguardando sua confirmação'}
                  </span>

                  <span
                    className={
                      inicioSolicitanteConfirmado
                        ? 'confirmed'
                        : ''
                    }
                  >
                    {inicioSolicitanteConfirmado
                      ? '✓ Cliente confirmou'
                      : '○ Aguardando cliente'}
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
              className={`provider-service-detail-timeline-line ${
                etapaAtual >= 3
                  ? 'active'
                  : ''
              }`}
            ></div>


            {/* CONCLUSÃO */}

            <div
              className={`provider-service-detail-timeline-item ${
                etapaAtual >= 3
                  ? 'completed'
                  : ''
              } ${
                etapaAtual === 3
                  ? 'current'
                  : ''
              }`}
            >

              <div className="provider-service-detail-timeline-marker">
                {etapaAtual >= 3
                  ? '✓'
                  : '3'}
              </div>

              <div className="provider-service-detail-timeline-content">

                <strong>
                  Conclusão
                </strong>

                <span>
                  Depois que os dois confirmarem
                  o início, vocês poderão confirmar
                  a conclusão do serviço.
                </span>

                <div className="provider-confirmation-status">

                  <span
                    className={
                      conclusaoPrestadorConfirmada
                        ? 'confirmed'
                        : ''
                    }
                  >
                    {conclusaoPrestadorConfirmada
                      ? '✓ Você confirmou'
                      : '○ Aguardando sua confirmação'}
                  </span>

                  <span
                    className={
                      conclusaoSolicitanteConfirmada
                        ? 'confirmed'
                        : ''
                    }
                  >
                    {conclusaoSolicitanteConfirmada
                      ? '✓ Cliente confirmou'
                      : '○ Aguardando cliente'}
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


          {/* CONFIRMAR INÍCIO */}

          {servico.status === 'contratada' &&
            !inicioPrestadorConfirmado && (

            <div className="provider-service-detail-action-box">

              <div className="provider-service-detail-action-icon">
                ▶
              </div>

              <div className="provider-service-detail-action-content">

                <strong>
                  Vai iniciar o serviço?
                </strong>

                <p>
                  Confirme quando você realmente
                  começar o trabalho. O serviço só
                  entrará em andamento depois que
                  o cliente também confirmar.
                </p>

              </div>

              <button
                type="button"
                className="provider-service-detail-primary-button"
                onClick={() =>
                  abrirConfirmacao('inicio')
                }
              >
                Confirmar início
                <span>→</span>
              </button>

            </div>
          )}


          {/* AGUARDANDO CLIENTE */}

          {servico.status === 'contratada' &&
            inicioPrestadorConfirmado &&
            !inicioSolicitanteConfirmado && (

            <div className="provider-service-detail-waiting-box">

              <div className="provider-service-detail-waiting-icon">
                ◷
              </div>

              <div>

                <strong>
                  Aguardando o cliente
                </strong>

                <p>
                  Você já confirmou o início.
                  Agora falta o cliente confirmar
                  para o serviço entrar em andamento.
                </p>

              </div>

            </div>
          )}


          {/* CONFIRMAR CONCLUSÃO */}

          {ambosConfirmaramInicio &&
            servico.status === 'em_andamento' &&
            !conclusaoPrestadorConfirmada && (

            <div className="provider-service-detail-action-box">

              <div className="provider-service-detail-action-icon">
                ✓
              </div>

              <div className="provider-service-detail-action-content">

                <strong>
                  Serviço finalizado?
                </strong>

                <p>
                  Se você terminou o trabalho,
                  confirme a conclusão. O serviço
                  será encerrado quando o cliente
                  também confirmar.
                </p>

              </div>

              <button
                type="button"
                className="provider-service-detail-primary-button"
                onClick={() =>
                  abrirConfirmacao('conclusao')
                }
              >
                Confirmar conclusão
                <span>→</span>
              </button>

            </div>
          )}


          {/* AGUARDANDO CLIENTE NA CONCLUSÃO */}

          {ambosConfirmaramInicio &&
            servico.status === 'em_andamento' &&
            conclusaoPrestadorConfirmada &&
            !conclusaoSolicitanteConfirmada && (

            <div className="provider-service-detail-waiting-box">

              <div className="provider-service-detail-waiting-icon">
                ◷
              </div>

              <div>

                <strong>
                  Aguardando o cliente
                </strong>

                <p>
                  Você já confirmou a conclusão.
                  O serviço será finalizado quando
                  o cliente também confirmar.
                </p>

              </div>

            </div>
          )}


          {/* CONCLUÍDO */}

          {servico.status === 'concluida' && (

            <div className="provider-service-detail-completed-box">

              <div className="provider-service-detail-completed-icon">
                ✓
              </div>

              <div>

                <strong>
                  Serviço concluído
                </strong>

                <p>
                  Os dois lados confirmaram a
                  conclusão. Agora você poderá
                  avaliar o cliente.
                </p>

              </div>

              <button
                type="button"
                className="provider-service-detail-secondary-button"
                onClick={() =>
                  navigate(
                    `/prestador/meus-servicos/${servico.id}/avaliar`
                  )
                }
              >
                Avaliar cliente
                <span>→</span>
              </button>

            </div>
          )}

        </div>


        {/* INFORMAÇÕES */}

        <div className="provider-service-detail-grid">

          <div className="provider-service-detail-info-card">

            <div className="provider-service-detail-info-header">
              <span>
                DETALHES DO SERVIÇO
              </span>
            </div>

            <div className="provider-service-detail-info-list">

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


          {/* CLIENTE */}

          <div className="provider-service-detail-info-card">

            <div className="provider-service-detail-info-header">
              <span>
                CLIENTE
              </span>
            </div>

            {solicitante ? (

              <div className="provider-service-detail-client">

                <div className="provider-service-detail-client-avatar">
                  {solicitante.nome
                    ?.charAt(0)
                    .toUpperCase() || 'C'}
                </div>

                <div className="provider-service-detail-client-data">

                  <strong>
                    {solicitante.nome ||
                      'Cliente'}
                  </strong>

                  <span>
                    {solicitante.cidade ||
                      'Localização não informada'}
                  </span>

                  {solicitante.telefone && (
                    <span>
                      {solicitante.telefone}
                    </span>
                  )}

                </div>

              </div>

            ) : (

              <div className="provider-service-detail-no-client">

                <span>—</span>

                <p>
                  Não foi possível carregar
                  os dados do cliente.
                </p>

              </div>

            )}

          </div>

        </div>


        <div className="provider-service-detail-request-info">

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
          className="provider-service-detail-modal-overlay"
          onClick={fecharModal}
        >

          <div
            className="provider-service-detail-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="provider-service-detail-modal-icon">
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
                ? 'Confirme apenas se você realmente iniciou o serviço. O serviço entrará em andamento quando o cliente também confirmar.'
                : 'Confirme apenas se o serviço foi realmente concluído. O serviço será encerrado quando o cliente também confirmar.'}
            </p>

            <div className="provider-service-detail-modal-actions">

              <button
                type="button"
                className="provider-service-detail-modal-cancel"
                onClick={fecharModal}
                disabled={processando}
              >
                Voltar
              </button>

              <button
                type="button"
                className="provider-service-detail-modal-confirm"
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