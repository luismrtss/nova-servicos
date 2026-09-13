import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { auth, db } from '../../firebase/config'

function AvaliarPrestador() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(null)
  const [servico, setServico] = useState(null)
  const [prestador, setPrestador] = useState(null)

  const [nota, setNota] = useState(0)
  const [comentario, setComentario] = useState('')

  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

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
          const perfilRef = doc(db, 'users', user.uid)
          const perfilSnapshot = await getDoc(perfilRef)

          if (!perfilSnapshot.exists()) {
            navigate('/perfil')
            return
          }

          const perfil = perfilSnapshot.data()

          if (perfil.tipo !== 'solicitante') {
            navigate('/prestador')
            return
          }

          const servicoRef = doc(db, 'requests', id)
          const servicoSnapshot = await getDoc(servicoRef)

          if (!servicoSnapshot.exists()) {
            setErro('Serviço não encontrado.')
            setCarregando(false)
            return
          }

          const dadosServico = {
            id: servicoSnapshot.id,
            ...servicoSnapshot.data(),
          }

          if (dadosServico.usuarioId !== user.uid) {
            setErro(
              'Você não tem permissão para avaliar este serviço.'
            )
            setCarregando(false)
            return
          }

          if (dadosServico.status !== 'concluida') {
            setErro(
              'Este serviço ainda não foi concluído.'
            )
            setCarregando(false)
            return
          }

          if (!dadosServico.prestadorId) {
            setErro(
              'Este serviço não possui um prestador vinculado.'
            )
            setCarregando(false)
            return
          }

          setServico(dadosServico)

          const prestadorRef = doc(
            db,
            'users',
            dadosServico.prestadorId
          )

          const prestadorSnapshot = await getDoc(
            prestadorRef
          )

          if (prestadorSnapshot.exists()) {
            setPrestador(prestadorSnapshot.data())
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

  async function enviarAvaliacao() {
    if (enviando) return

    setErro('')
    setSucesso(false)

    if (nota < 1) {
      setErro('Selecione uma nota de 1 a 5 estrelas.')
      return
    }

    setEnviando(true)

    try {
      if (!usuario || !servico?.prestadorId) {
        setErro(
          'Não foi possível identificar o prestador.'
        )
        setEnviando(false)
        return
      }

      const avaliacaoQuery = query(
        collection(db, 'ratings'),
        where('avaliadorId', '==', usuario.uid),
        where('solicitacaoId', '==', servico.id)
      )

      const avaliacaoSnapshot = await getDocs(
        avaliacaoQuery
      )

      if (!avaliacaoSnapshot.empty) {
        setErro(
          'Você já avaliou este serviço.'
        )
        setEnviando(false)
        return
      }

      await addDoc(collection(db, 'ratings'), {
        avaliadorId: usuario.uid,
        avaliadoId: servico.prestadorId,
        solicitacaoId: servico.id,
        nota,
        comentario: comentario.trim(),
        tipo: 'prestador',
        criadoEm: serverTimestamp(),
      })

      setSucesso(true)

      setTimeout(() => {
        navigate(`/meus-servicos/${servico.id}`)
      }, 1200)
    } catch (error) {
      console.error(
        'Erro ao enviar avaliação:',
        error
      )

      setErro(
        'Não foi possível enviar sua avaliação. Tente novamente.'
      )

      setEnviando(false)
    }
  }

  function voltar() {
    if (servico?.id) {
      navigate(`/meus-servicos/${servico.id}`)
      return
    }

    navigate('/meus-servicos')
  }

  if (carregando) {
    return (
      <section className="requester-rating-page">
        <div className="requester-rating-container">
          <div className="requester-rating-loading">
            <div className="requester-rating-loading-icon">
              ★
            </div>

            <p>Carregando avaliação...</p>
          </div>
        </div>
      </section>
    )
  }

  if (erro && !servico) {
    return (
      <section className="requester-rating-page">
        <div className="requester-rating-container">
          <div className="requester-rating-error">
            <div className="requester-rating-error-icon">
              !
            </div>

            <h2>Não foi possível avaliar</h2>

            <p>{erro}</p>

            <button
              type="button"
              className="requester-rating-back-button"
              onClick={voltar}
            >
              ← Voltar
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="requester-rating-page">
      <div className="requester-rating-container">

        <button
          type="button"
          className="requester-rating-back"
          onClick={voltar}
        >
          ← Voltar para o serviço
        </button>

        <div className="requester-rating-header">
          <span className="requester-rating-eyebrow">
            AVALIAÇÃO
          </span>

          <h1>
            Como foi sua experiência?
          </h1>

          <p>
            Sua avaliação ajuda outros usuários a
            encontrarem bons profissionais.
          </p>
        </div>

        <div className="requester-rating-card">

          <div className="requester-rating-provider">

            <div className="requester-rating-avatar">
              {prestador?.nome
                ?.charAt(0)
                .toUpperCase() || 'P'}
            </div>

            <div className="requester-rating-provider-info">
              <span>PRESTADOR</span>

              <strong>
                {prestador?.nome || 'Prestador'}
              </strong>

              {prestador?.cidade && (
                <p>
                  {prestador.cidade}
                </p>
              )}
            </div>

          </div>

          <div className="requester-rating-divider" />

          <div className="requester-rating-service">

            <span>Serviço realizado</span>

            <h2>
              {servico?.titulo}
            </h2>

            <p>
              {servico?.categoria}
            </p>

          </div>

          <div className="requester-rating-question">

            <span className="requester-rating-label">
              Sua nota
            </span>

            <div className="requester-rating-stars">
              {[1, 2, 3, 4, 5].map(
                (estrela) => (
                  <button
                    key={estrela}
                    type="button"
                    onClick={() =>
                      setNota(estrela)
                    }
                    className={
                      estrela <= nota
                        ? 'selected'
                        : ''
                    }
                    aria-label={`${estrela} estrelas`}
                  >
                    ★
                  </button>
                )
              )}
            </div>

            <span className="requester-rating-selected">
              {nota === 0
                ? 'Selecione uma nota'
                : nota === 1
                  ? '1 estrela'
                  : `${nota} estrelas`}
            </span>

          </div>

          <div className="requester-rating-comment">

            <div className="requester-rating-label-row">
              <span className="requester-rating-label">
                Comentário
              </span>

              <span>
                {comentario.length}/500
              </span>
            </div>

            <textarea
              value={comentario}
              onChange={(event) =>
                setComentario(
                  event.target.value
                )
              }
              placeholder="Conte como foi sua experiência com este prestador..."
              maxLength={500}
            />

          </div>

          {erro && (
            <div className="requester-rating-form-error">
              <span>!</span>
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="requester-rating-success">
              <span>✓</span>

              <div>
                <strong>
                  Avaliação enviada!
                </strong>

                <p>
                  Obrigado por compartilhar sua
                  experiência.
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            className="requester-rating-submit"
            onClick={enviarAvaliacao}
            disabled={
              nota < 1 ||
              enviando ||
              sucesso
            }
          >
            {enviando
              ? 'Enviando avaliação...'
              : sucesso
                ? 'Avaliação enviada ✓'
                : 'Enviar avaliação'}
          </button>

        </div>

        <p className="requester-rating-footer">
          Sua avaliação será vinculada a este serviço
          e ficará visível no perfil do prestador.
        </p>

      </div>
    </section>
  )
}

export default AvaliarPrestador