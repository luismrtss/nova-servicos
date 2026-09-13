import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { auth, db } from '../../firebase/config'

function SolicitacaoPrestador() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [servico, setServico] = useState(null)
  const [jaEnviouProposta, setJaEnviouProposta] =
    useState(false)

  const [valor, setValor] = useState('')
  const [data, setData] = useState('')
  const [mensagem, setMensagem] = useState('')

  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [aceitandoOrcamento, setAceitandoOrcamento] =
    useState(false)

  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    let unsubscribeServico = null
    let unsubscribeProposta = null

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

          const servicoRef = doc(
            db,
            'requests',
            id
          )

          unsubscribeServico = onSnapshot(
            servicoRef,
            (snapshot) => {
              if (!snapshot.exists()) {
                setErro(
                  'Esta solicitação não existe ou foi removida.'
                )

                setCarregando(false)
                return
              }

              setServico({
                id: snapshot.id,
                ...snapshot.data(),
              })

              setCarregando(false)
            },
            (error) => {
              console.error(
                'Erro ao carregar solicitação:',
                error
              )

              setErro(
                'Não foi possível carregar esta solicitação.'
              )

              setCarregando(false)
            }
          )

          const propostasQuery = query(
            collection(db, 'proposals'),
            where(
              'solicitacaoId',
              '==',
              id
            ),
            where(
              'prestadorId',
              '==',
              user.uid
            )
          )

          unsubscribeProposta = onSnapshot(
            propostasQuery,
            (snapshot) => {
              setJaEnviouProposta(
                !snapshot.empty
              )
            },
            (error) => {
              console.error(
                'Erro ao verificar proposta:',
                error
              )
            }
          )
        } catch (error) {
          console.error(
            'Erro ao carregar página:',
            error
          )

          setErro(
            'Não foi possível carregar esta solicitação.'
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

      if (unsubscribeProposta) {
        unsubscribeProposta()
      }
    }
  }, [id, navigate])

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

  function formatarValor(valorServico) {
    if (
      valorServico === null ||
      valorServico === undefined ||
      valorServico === ''
    ) {
      return 'A combinar'
    }

    return Number(valorServico).toLocaleString(
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

  function formatarDataDesejada(dataDesejada) {
    if (!dataDesejada) {
      return 'A combinar'
    }

    if (
      typeof dataDesejada === 'string' &&
      dataDesejada.includes('-')
    ) {
      const partes =
        dataDesejada.split('-')

      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`
      }
    }

    return dataDesejada
  }

  async function aceitarOrcamento() {
    setErro('')
    setSucesso(false)

    if (!usuario || !servico) {
      setErro(
        'Não foi possível identificar esta solicitação.'
      )
      return
    }

    if (servico.status !== 'aberta') {
      setErro(
        'Esta solicitação não está mais disponível.'
      )
      return
    }

    if (jaEnviouProposta) {
      setErro(
        'Você já enviou uma proposta para esta solicitação.'
      )
      return
    }

    if (
      servico.orcamento === null ||
      servico.orcamento === undefined ||
      servico.orcamento === '' ||
      Number(servico.orcamento) <= 0
    ) {
      setErro(
        'O cliente não informou um orçamento válido. Envie uma proposta personalizada.'
      )
      return
    }

    const valorOrcamento =
      Number(servico.orcamento)

    const confirmar = window.confirm(
      `Você aceita realizar este serviço pelo valor de ${formatarValor(valorOrcamento)}?`
    )

    if (!confirmar) {
      return
    }

    setAceitandoOrcamento(true)

    try {
      await addDoc(
        collection(db, 'proposals'),
        {
          solicitanteId:
            servico.usuarioId,

          prestadorId:
            usuario.uid,

          solicitacaoId:
            servico.id,

          valor:
            valorOrcamento,

          data:
            servico.dataDesejada || '',

          mensagem:
            'Aceito realizar o serviço pelo orçamento informado pelo cliente.',

          status:
            'pendente',

          tipo:
            'orcamento_aceito',

          criadoEm:
            serverTimestamp(),
        }
      )

      setSucesso(true)
      setJaEnviouProposta(true)

      setTimeout(() => {
        navigate(
          '/prestador/minhas-propostas'
        )
      }, 1200)
    } catch (error) {
      console.error(
        'Erro ao aceitar orçamento:',
        error
      )

      setErro(
        'Não foi possível aceitar o orçamento. Tente novamente.'
      )
    } finally {
      setAceitandoOrcamento(false)
    }
  }

  async function enviarProposta(event) {
    event.preventDefault()

    setErro('')
    setSucesso(false)

    if (!usuario) {
      setErro(
        'Você precisa estar logado para enviar uma proposta.'
      )
      return
    }

    if (!servico) {
      setErro(
        'Não foi possível identificar o serviço.'
      )
      return
    }

    if (servico.status !== 'aberta') {
      setErro(
        'Esta solicitação não está mais disponível.'
      )
      return
    }

    if (jaEnviouProposta) {
      setErro(
        'Você já enviou uma proposta para esta solicitação.'
      )
      return
    }

    if (!valor.trim()) {
      setErro(
        'Informe o valor da sua proposta.'
      )
      return
    }

    const valorNumerico = Number(
      valor.replace(',', '.')
    )

    if (
      !valorNumerico ||
      valorNumerico <= 0
    ) {
      setErro(
        'Informe um valor válido para sua proposta.'
      )
      return
    }

    if (!data) {
      setErro(
        'Informe uma data prevista para realizar o serviço.'
      )
      return
    }

    if (!mensagem.trim()) {
      setErro(
        'Escreva uma mensagem para o cliente.'
      )
      return
    }

    setEnviando(true)

    try {
      await addDoc(
        collection(db, 'proposals'),
        {
          solicitanteId:
            servico.usuarioId,

          prestadorId:
            usuario.uid,

          solicitacaoId:
            servico.id,

          valor:
            valorNumerico,

          data,

          mensagem:
            mensagem.trim(),

          status:
            'pendente',

          tipo:
            'personalizada',

          criadoEm:
            serverTimestamp(),
        }
      )

      setSucesso(true)
      setJaEnviouProposta(true)

      setTimeout(() => {
        navigate(
          '/prestador/minhas-propostas'
        )
      }, 1200)
    } catch (error) {
      console.error(
        'Erro ao enviar proposta:',
        error
      )

      setErro(
        'Não foi possível enviar sua proposta. Tente novamente.'
      )
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return (
      <section className="provider-request-page">
        <div className="provider-request-container">

          <div className="provider-loading">

            <div className="loading-spinner"></div>

            <p>
              Carregando solicitação...
            </p>

          </div>

        </div>
      </section>
    )
  }

  if (!servico) {
    return (
      <section className="provider-request-page">
        <div className="provider-request-container">

          <div className="provider-request-error-page">

            <div className="provider-empty-icon">
              !
            </div>

            <h2>
              Solicitação não encontrada.
            </h2>

            <p>
              {erro ||
                'Esta solicitação não está disponível.'}
            </p>

            <Link
              to="/prestador/servicos"
              className="provider-primary-button"
            >
              Voltar para serviços
              <span>→</span>
            </Link>

          </div>

        </div>
      </section>
    )
  }

  return (
    <section className="provider-request-page">

      <div className="provider-request-container">

        <Link
          to="/prestador/servicos"
          className="provider-request-back"
        >
          ← Voltar para serviços
        </Link>


        <div className="provider-request-header">

          <div className="provider-request-category">

            <div className="provider-request-category-icon">
              {obterIcone(
                servico.categoria
              )}
            </div>

            <span>
              {obterCategoria(
                servico.categoria
              )}
            </span>

          </div>

          <h1>
            {servico.titulo ||
              'Serviço solicitado'}
          </h1>

          <p>
            Analise os detalhes da solicitação
            antes de enviar sua proposta.
          </p>

        </div>


        <div className="provider-request-layout">


          {/* =================================================
              DETALHES
              ================================================= */}

          <div className="provider-request-details">

            <div className="provider-request-card">

              <div className="provider-request-card-header">

                <div>

                  <span className="section-eyebrow">
                    SOLICITAÇÃO
                  </span>

                  <h2>
                    O que o cliente precisa?
                  </h2>

                </div>

                <span className="provider-request-open">
                  Disponível
                </span>

              </div>


              <div className="provider-request-description">

                <p>
                  {servico.descricao ||
                    'O cliente não informou uma descrição.'}
                </p>

              </div>


              <div className="provider-request-information">

                <div className="provider-request-info-item">

                  <span>
                    📍 Localização
                  </span>

                  <strong>
                    {servico.localizacao ||
                      'Não informada'}
                  </strong>

                </div>


                <div className="provider-request-info-item">

                  <span>
                    📅 Data desejada
                  </span>

                  <strong>
                    {formatarDataDesejada(
                      servico.dataDesejada
                    )}
                  </strong>

                </div>


                <div className="provider-request-info-item">

                  <span>
                    💰 Orçamento
                  </span>

                  <strong>
                    {formatarValor(
                      servico.orcamento
                    )}
                  </strong>

                </div>


                <div className="provider-request-info-item">

                  <span>
                    🕐 Publicado em
                  </span>

                  <strong>
                    {formatarData(
                      servico.criadoEm
                    ) ||
                      'Recentemente'}
                  </strong>

                </div>

              </div>

            </div>


            <div className="provider-request-tip">

              <div className="provider-request-tip-icon">
                ✓
              </div>

              <div>

                <strong>
                  Dica para sua proposta
                </strong>

                <p>
                  Seja claro sobre o que você pode
                  oferecer, informe um valor justo e
                  explique por que o cliente deve
                  escolher você.
                </p>

              </div>

            </div>

          </div>


          {/* =================================================
              PROPOSTA
              ================================================= */}

          <div className="provider-proposal-card">

            <div className="provider-proposal-header">

              <span className="section-eyebrow">
                SUA PROPOSTA
              </span>

              <h2>
                Mostre que você
                <br />
                <strong>pode resolver.</strong>
              </h2>

              <p>
                Escolha como deseja responder ao
                cliente.
              </p>

            </div>


            {jaEnviouProposta ? (

              <div className="provider-proposal-already">

                <div className="provider-proposal-already-icon">
                  ✓
                </div>

                <h3>
                  Proposta enviada
                </h3>

                <p>
                  Você já enviou uma proposta para
                  esta solicitação.
                </p>

                <Link
                  to="/prestador/minhas-propostas"
                  className="provider-primary-button"
                >
                  Ver minhas propostas
                  <span>→</span>
                </Link>

              </div>

            ) : (

              <>

                {/* =================================================
                    ACEITAR ORÇAMENTO
                    ================================================= */}

                {servico.orcamento &&
                  Number(servico.orcamento) >
                    0 && (

                  <div className="provider-budget-option">

                    <div className="provider-budget-option-top">

                      <div>

                        <span>
                          RESPOSTA RÁPIDA
                        </span>

                        <strong>
                          Aceitar o orçamento
                        </strong>

                      </div>

                      <div className="provider-budget-value">
                        {formatarValor(
                          servico.orcamento
                        )}
                      </div>

                    </div>

                    <p>
                      Aceite o valor informado pelo
                      cliente e envie sua disponibilidade.
                    </p>

                    <button
                      type="button"
                      className="provider-budget-button"
                      onClick={
                        aceitarOrcamento
                      }
                      disabled={
                        aceitandoOrcamento ||
                        enviando
                      }
                    >
                      {aceitandoOrcamento
                        ? 'Enviando...'
                        : 'Aceitar este orçamento'}

                      {!aceitandoOrcamento && (
                        <span>
                          ✓
                        </span>
                      )}
                    </button>

                  </div>

                )}


                {/* DIVISOR */}

                {servico.orcamento &&
                  Number(servico.orcamento) >
                    0 && (

                  <div className="provider-proposal-divider">
                    <span>
                      OU ENVIE UMA PROPOSTA PERSONALIZADA
                    </span>
                  </div>

                )}


                {/* =================================================
                    PROPOSTA PERSONALIZADA
                    ================================================= */}

                <form
                  className="provider-proposal-form"
                  onSubmit={enviarProposta}
                >

                  <div className="provider-proposal-form-group">

                    <label htmlFor="valor">
                      Valor da proposta
                    </label>

                    <div className="provider-money-input">

                      <span>
                        R$
                      </span>

                      <input
                        id="valor"
                        type="number"
                        min="1"
                        step="0.01"
                        value={valor}
                        onChange={(event) =>
                          setValor(
                            event.target.value
                          )
                        }
                        placeholder="0,00"
                      />

                    </div>

                  </div>


                  <div className="provider-proposal-form-group">

                    <label htmlFor="data">
                      Data prevista para realizar
                    </label>

                    <input
                      id="data"
                      type="date"
                      value={data}
                      onChange={(event) =>
                        setData(
                          event.target.value
                        )
                      }
                      min={
                        new Date()
                          .toISOString()
                          .split('T')[0]
                      }
                    />

                  </div>


                  <div className="provider-proposal-form-group">

                    <label htmlFor="mensagem">
                      Mensagem para o cliente
                    </label>

                    <textarea
                      id="mensagem"
                      value={mensagem}
                      onChange={(event) =>
                        setMensagem(
                          event.target.value
                        )
                      }
                      placeholder="Explique sua experiência, como pretende realizar o serviço e qualquer informação importante para o cliente..."
                      rows="6"
                      maxLength="800"
                    />

                    <small>
                      {mensagem.length}/800
                    </small>

                  </div>


                  {erro && (
                    <div className="provider-proposal-error">
                      <span>!</span>
                      {erro}
                    </div>
                  )}


                  {sucesso && (
                    <div className="provider-proposal-success">
                      <span>✓</span>
                      Proposta enviada com sucesso!
                    </div>
                  )}


                  <button
                    type="submit"
                    className="provider-proposal-submit"
                    disabled={
                      enviando ||
                      aceitandoOrcamento
                    }
                  >
                    {enviando
                      ? 'Enviando proposta...'
                      : 'Enviar proposta personalizada'}

                    {!enviando && (
                      <span>
                        →
                      </span>
                    )}
                  </button>

                  <p className="provider-proposal-note">
                    O cliente poderá comparar sua
                    proposta com as de outros
                    profissionais antes de escolher.
                  </p>

                </form>

              </>

            )}

          </div>

        </div>

      </div>

    </section>
  )
}

export default SolicitacaoPrestador