import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  query,
  serverTimestamp,
  where,
  getDocs,
} from 'firebase/firestore'

import { auth, db } from '../../firebase/config'

function AvaliarCliente() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(null)
  const [servico, setServico] = useState(null)
  const [cliente, setCliente] = useState(null)

  const [nota, setNota] = useState(0)
  const [comentario, setComentario] = useState('')

  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)

  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const [jaAvaliou, setJaAvaliou] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          navigate('/login')
          return
        }

        setUsuario(user)

        try {
          /* PERFIL DO PRESTADOR */

          const perfilSnapshot = await getDoc(
            doc(db, 'users', user.uid)
          )

          if (!perfilSnapshot.exists()) {
            navigate('/perfil')
            return
          }

          const perfil = perfilSnapshot.data()

          if (perfil.tipo !== 'prestador') {
            navigate('/solicitante')
            return
          }

          /* SERVIÇO */

          const servicoSnapshot = await getDoc(
            doc(db, 'requests', id)
          )

          if (!servicoSnapshot.exists()) {
            setErro('Este serviço não foi encontrado.')
            setCarregando(false)
            return
          }

          const dadosServico = {
            id: servicoSnapshot.id,
            ...servicoSnapshot.data(),
          }

          /* CONFIRMAÇÕES DE SEGURANÇA */

          if (dadosServico.prestadorId !== user.uid) {
            setErro(
              'Você não tem permissão para avaliar este serviço.'
            )
            setCarregando(false)
            return
          }

          if (dadosServico.status !== 'concluida') {
            setErro(
              'A avaliação só pode ser feita após a conclusão do serviço.'
            )
            setCarregando(false)
            return
          }

          if (!dadosServico.usuarioId) {
            setErro(
              'Não foi possível identificar o cliente deste serviço.'
            )
            setCarregando(false)
            return
          }

          setServico(dadosServico)

          /* CLIENTE */

          const clienteSnapshot = await getDoc(
            doc(db, 'users', dadosServico.usuarioId)
          )

          if (clienteSnapshot.exists()) {
            setCliente(clienteSnapshot.data())
          }

          /* VERIFICA SE JÁ AVALIOU */

          const avaliacaoQuery = query(
            collection(db, 'ratings'),
            where('avaliadorId', '==', user.uid),
            where('solicitacaoId', '==', id),
            where('tipo', '==', 'cliente')
          )

          const avaliacaoSnapshot =
            await getDocs(avaliacaoQuery)

          if (!avaliacaoSnapshot.empty) {
            setJaAvaliou(true)
          }

          setCarregando(false)
        } catch (error) {
          console.error(
            'Erro ao carregar avaliação:',
            error
          )

          setErro(
            'Não foi possível carregar os dados da avaliação.'
          )

          setCarregando(false)
        }
      }
    )

    return () => unsubscribe()
  }, [id, navigate])

  function selecionarNota(valor) {
    if (enviando || jaAvaliou) {
      return
    }

    setNota(valor)
    setErro('')
  }

  async function enviarAvaliacao(event) {
    event.preventDefault()

    if (enviando) {
      return
    }

    setErro('')
    setSucesso('')

    if (!nota) {
      setErro(
        'Selecione uma nota de 1 a 5 estrelas.'
      )
      return
    }

    if (!servico || !usuario) {
      setErro(
        'Não foi possível identificar o serviço.'
      )
      return
    }

    setEnviando(true)

    try {
      /* VERIFICA NOVAMENTE PARA EVITAR DUPLICIDADE */

      const avaliacaoQuery = query(
        collection(db, 'ratings'),
        where('avaliadorId', '==', usuario.uid),
        where('solicitacaoId', '==', servico.id),
        where('tipo', '==', 'cliente')
      )

      const avaliacaoSnapshot =
        await getDocs(avaliacaoQuery)

      if (!avaliacaoSnapshot.empty) {
        setJaAvaliou(true)

        setErro(
          'Você já avaliou este cliente para este serviço.'
        )

        setEnviando(false)
        return
      }

      /* SALVA A AVALIAÇÃO */

      await addDoc(collection(db, 'ratings'), {
        avaliadorId: usuario.uid,
        avaliadoId: servico.usuarioId,
        solicitacaoId: servico.id,
        nota,
        comentario: comentario.trim(),
        tipo: 'cliente',
        criadoEm: serverTimestamp(),
      })

      setSucesso(
        'Avaliação enviada com sucesso!'
      )

      setJaAvaliou(true)

      setTimeout(() => {
        navigate(
          `/prestador/meus-servicos/${servico.id}`
        )
      }, 1200)
    } catch (error) {
      console.error(
        'Erro ao enviar avaliação:',
        error
      )

      setErro(
        'Não foi possível enviar sua avaliação. Tente novamente.'
      )
    } finally {
      setEnviando(false)
    }
  }

  function obterInicial() {
    if (!cliente?.nome) {
      return 'C'
    }

    return cliente.nome
      .charAt(0)
      .toUpperCase()
  }

  if (carregando) {
    return (
      <section className="provider-rating-page">
        <div className="provider-rating-container">
          <div className="provider-rating-loading">
            <div className="loading-spinner"></div>

            <p>
              Carregando avaliação...
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (erro && !servico) {
    return (
      <section className="provider-rating-page">
        <div className="provider-rating-container">

          <Link
            to="/prestador/meus-servicos"
            className="provider-rating-back"
          >
            ← Voltar para meus serviços
          </Link>

          <div className="provider-rating-error">
            <div className="provider-rating-error-icon">
              !
            </div>

            <h2>
              Não foi possível continuar
            </h2>

            <p>
              {erro}
            </p>

            <Link
              to="/prestador/meus-servicos"
              className="provider-rating-primary-button"
            >
              Voltar para meus serviços
            </Link>
          </div>

        </div>
      </section>
    )
  }

  return (
    <section className="provider-rating-page">
      <div className="provider-rating-container">

        {/* VOLTAR */}

        <Link
          to={`/prestador/meus-servicos/${id}`}
          className="provider-rating-back"
        >
          ← Voltar para o serviço
        </Link>

        {/* CABEÇALHO */}

        <div className="provider-rating-header">

          <span className="provider-rating-eyebrow">
            AVALIAÇÃO
          </span>

          <h1>
            Avaliar cliente
          </h1>

          <p>
            Conte como foi sua experiência com o cliente
            durante este serviço.
          </p>

        </div>

        {/* CARD */}

        <div className="provider-rating-card">

          {/* CLIENTE */}

          <div className="provider-rating-client">

            <div className="provider-rating-avatar">
              {obterInicial()}
            </div>

            <div className="provider-rating-client-info">

              <span>
                CLIENTE
              </span>

              <strong>
                {cliente?.nome || 'Cliente'}
              </strong>

              <p>
                {cliente?.cidade ||
                  'Localização não informada'}
              </p>

            </div>

          </div>

          <div className="provider-rating-divider"></div>

          {/* SERVIÇO */}

          <div className="provider-rating-service">

            <span>
              SERVIÇO
            </span>

            <strong>
              {servico?.titulo ||
                'Serviço realizado'}
            </strong>

            <p>
              {servico?.categoria ||
                'Serviço'}
            </p>

          </div>

          <div className="provider-rating-divider"></div>

          {jaAvaliou ? (

            <div className="provider-rating-already">

              <div className="provider-rating-already-icon">
                ✓
              </div>

              <h2>
                Cliente já avaliado
              </h2>

              <p>
                Você já enviou uma avaliação para este
                cliente neste serviço.
              </p>

              <Link
                to={`/prestador/meus-servicos/${id}`}
                className="provider-rating-primary-button"
              >
                Voltar para o serviço
              </Link>

            </div>

          ) : (

            <form
              className="provider-rating-form"
              onSubmit={enviarAvaliacao}
            >

              <div className="provider-rating-question">
                Como foi sua experiência?
              </div>

              {/* ESTRELAS */}

              <div className="provider-rating-stars">

                {[1, 2, 3, 4, 5].map(
                  (estrela) => (
                    <button
                      key={estrela}
                      type="button"
                      className={
                        estrela <= nota
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        selecionarNota(estrela)
                      }
                      disabled={enviando}
                      aria-label={`${estrela} estrelas`}
                    >
                      ★
                    </button>
                  )
                )}

              </div>

              <div className="provider-rating-selected">

                {nota === 0 &&
                  'Selecione uma nota'}

                {nota === 1 &&
                  'Muito ruim'}

                {nota === 2 &&
                  'Ruim'}

                {nota === 3 &&
                  'Regular'}

                {nota === 4 &&
                  'Boa experiência'}

                {nota === 5 &&
                  'Excelente experiência'}

              </div>

              {/* COMENTÁRIO */}

              <div className="provider-rating-comment">

                <div className="provider-rating-label-row">

                  <label htmlFor="comentario">
                    Comentário
                  </label>

                  <span>
                    Opcional
                  </span>

                </div>

                <textarea
                  id="comentario"
                  value={comentario}
                  onChange={(event) =>
                    setComentario(
                      event.target.value.slice(
                        0,
                        500
                      )
                    )
                  }
                  placeholder="Conte brevemente como foi trabalhar com este cliente..."
                  rows={5}
                  disabled={enviando}
                />

                <small>
                  {comentario.length}/500
                </small>

              </div>

              {/* ERRO */}

              {erro && (
                <div className="provider-rating-form-error">
                  <span>!</span>
                  {erro}
                </div>
              )}

              {/* SUCESSO */}

              {sucesso && (
                <div className="provider-rating-success">
                  <span>✓</span>
                  {sucesso}
                </div>
              )}

              {/* ENVIAR */}

              <button
                type="submit"
                className="provider-rating-submit"
                disabled={enviando || !nota}
              >
                {enviando
                  ? 'Enviando avaliação...'
                  : 'Enviar avaliação'}
              </button>

            </form>

          )}

        </div>

        <div className="provider-rating-footer">
          Sua avaliação ajuda a manter a comunidade NOVA
          mais confiável para todos.
        </div>

      </div>
    </section>
  )
}

export default AvaliarCliente