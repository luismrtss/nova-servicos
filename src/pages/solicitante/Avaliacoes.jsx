import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore'

import { auth, db } from '../../firebase/config'

function Avaliacoes() {
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(null)
  const [avaliacoes, setAvaliacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let unsubscribeAvaliacoes = null

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
            navigate('/perfil')
            return
          }

          const perfil = perfilSnapshot.data()

          if (perfil.tipo !== 'solicitante') {
            navigate('/prestador/avaliacoes')
            return
          }

          const avaliacoesQuery = query(
            collection(db, 'ratings'),
            where('avaliadorId', '==', user.uid),
            where('tipo', '==', 'prestador')
          )

          unsubscribeAvaliacoes = onSnapshot(
            avaliacoesQuery,
            async (snapshot) => {
              try {
                const lista = await Promise.all(
                  snapshot.docs.map(async (documento) => {
                    const dados = documento.data()

                    let prestador = null
                    let servico = null

                    if (dados.avaliadoId) {
                      const prestadorSnapshot = await getDoc(
                        doc(
                          db,
                          'users',
                          dados.avaliadoId
                        )
                      )

                      if (prestadorSnapshot.exists()) {
                        prestador = prestadorSnapshot.data()
                      }
                    }

                    if (dados.solicitacaoId) {
                      const servicoSnapshot = await getDoc(
                        doc(
                          db,
                          'requests',
                          dados.solicitacaoId
                        )
                      )

                      if (servicoSnapshot.exists()) {
                        servico = {
                          id: servicoSnapshot.id,
                          ...servicoSnapshot.data(),
                        }
                      }
                    }

                    return {
                      id: documento.id,
                      ...dados,
                      prestador,
                      servico,
                    }
                  })
                )

                lista.sort((a, b) => {
                  const dataA =
                    a.criadoEm?.toMillis?.() || 0

                  const dataB =
                    b.criadoEm?.toMillis?.() || 0

                  return dataB - dataA
                })

                setAvaliacoes(lista)
                setCarregando(false)
                setErro('')
              } catch (error) {
                console.error(
                  'Erro ao carregar dados das avaliações:',
                  error
                )

                setErro(
                  'Não foi possível carregar suas avaliações.'
                )

                setCarregando(false)
              }
            },
            (error) => {
              console.error(
                'Erro ao acompanhar avaliações:',
                error
              )

              setErro(
                'Não foi possível carregar suas avaliações.'
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
            'Não foi possível carregar sua área de avaliações.'
          )

          setCarregando(false)
        }
      }
    )

    return () => {
      unsubscribeAuth()

      if (unsubscribeAvaliacoes) {
        unsubscribeAvaliacoes()
      }
    }
  }, [navigate])

  function formatarData(timestamp) {
    if (!timestamp) {
      return 'Data não informada'
    }

    let data

    if (timestamp?.toDate) {
      data = timestamp.toDate()
    } else if (timestamp instanceof Date) {
      data = timestamp
    } else {
      data = new Date(timestamp)
    }

    if (Number.isNaN(data.getTime())) {
      return 'Data não informada'
    }

    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function calcularMedia() {
    if (avaliacoes.length === 0) {
      return 0
    }

    const soma = avaliacoes.reduce(
      (total, avaliacao) =>
        total + Number(avaliacao.nota || 0),
      0
    )

    return soma / avaliacoes.length
  }

  function contarNota(nota) {
    return avaliacoes.filter(
      (avaliacao) =>
        Number(avaliacao.nota) === nota
    ).length
  }

  const media = calcularMedia()

  if (carregando) {
    return (
      <section className="page-section requester-ratings-page">
        <div className="provider-container">
          <div className="provider-loading">
            <div className="loading-spinner"></div>

            <p>
              Carregando suas avaliações...
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="page-section requester-ratings-page">
      <div className="provider-container">

        {/* VOLTAR */}
        <Link
          to="/solicitante"
          className="provider-my-services-back"
        >
          ← Voltar para minha área
        </Link>

        {/* CABEÇALHO */}
        <div className="provider-page-header">
          <div>
            <span className="provider-eyebrow">
              HISTÓRICO
            </span>

            <h1>Avaliações</h1>

            <p>
              Veja as avaliações que você realizou
              para os prestadores.
            </p>
          </div>
        </div>

        {/* ERRO */}
        {erro && (
          <div className="proposals-error">
            <span>!</span>
            {erro}
          </div>
        )}

        {/* RESUMO */}
        <div className="ratings-overview">

          {/* MÉDIA */}
          <div className="ratings-main-card">

            <span className="ratings-main-label">
              Sua média
            </span>

            <strong>
              {media.toFixed(1)}
            </strong>

            <div className="ratings-main-stars">
              {[1, 2, 3, 4, 5].map(
                (estrela) => (
                  <span
                    key={estrela}
                    className={
                      estrela <= Math.round(media)
                        ? 'rating-star active'
                        : 'rating-star'
                    }
                  >
                    ★
                  </span>
                )
              )}
            </div>

            <span className="ratings-main-count">
              {avaliacoes.length}{' '}
              {avaliacoes.length === 1
                ? 'avaliação realizada'
                : 'avaliações realizadas'}
            </span>

          </div>

          {/* DISTRIBUIÇÃO */}
          <div className="ratings-distribution">

            {[5, 4, 3, 2, 1].map(
              (estrela) => {

                const quantidade =
                  contarNota(estrela)

                const porcentagem =
                  avaliacoes.length > 0
                    ? (quantidade /
                        avaliacoes.length) *
                      100
                    : 0

                return (
                  <div
                    className="rating-distribution-row"
                    key={estrela}
                  >

                    <span>
                      {estrela} ★
                    </span>

                    <div className="rating-bar">
                      <div
                        className="rating-bar-fill"
                        style={{
                          width: `${porcentagem}%`,
                        }}
                      />
                    </div>

                    <strong>
                      {quantidade}
                    </strong>

                  </div>
                )
              }
            )}

          </div>

        </div>

        {/* HISTÓRICO */}
        <div className="ratings-list-section">

          <div className="ratings-section-heading">

            <span className="provider-eyebrow">
              HISTÓRICO
            </span>

            <h2>
              Avaliações realizadas
            </h2>

            <p>
              Confira as notas e comentários que
              você deixou para os prestadores.
            </p>

          </div>

          {/* SEM AVALIAÇÕES */}
          {avaliacoes.length === 0 ? (

            <div className="ratings-empty">

              <div className="ratings-empty-icon">
                ★
              </div>

              <h3>
                Você ainda não fez avaliações
              </h3>

              <p>
                Quando um serviço for concluído,
                você poderá avaliar o prestador.
              </p>

              <Link
                to="/meus-servicos"
                className="rating-action-button"
              >
                Ver meus serviços
                <span>→</span>
              </Link>

            </div>

          ) : (

            /* LISTA */
            <div className="ratings-list">

              {avaliacoes.map(
                (avaliacao) => {

                  const nota =
                    Number(
                      avaliacao.nota || 0
                    )

                  const prestador =
                    avaliacao.prestador

                  const servico =
                    avaliacao.servico

                  return (
                    <article
                      className="rating-card"
                      key={avaliacao.id}
                    >

                      {/* TOPO */}
                      <div className="rating-card-top">

                        <div>

                          <span className="rating-card-category">
                            {servico?.categoria ||
                              'Serviço'}
                          </span>

                          <h3>
                            {servico?.titulo ||
                              'Serviço realizado'}
                          </h3>

                          <p className="rating-card-provider">
                            Prestador:{' '}
                            {prestador?.nome ||
                              'Prestador'}
                          </p>

                        </div>

                        <span className="rating-card-date">
                          {formatarData(
                            avaliacao.criadoEm
                          )}
                        </span>

                      </div>

                      {/* ESTRELAS */}
                      <div className="rating-card-stars">

                        {[1, 2, 3, 4, 5].map(
                          (estrela) => (
                            <span
                              key={estrela}
                              className={
                                estrela <= nota
                                  ? 'active'
                                  : ''
                              }
                            >
                              ★
                            </span>
                          )
                        )}

                      </div>

                      {/* COMENTÁRIO */}
                      {avaliacao.comentario && (
                        <p className="rating-card-comment">
                          “{avaliacao.comentario}”
                        </p>
                      )}

                    </article>
                  )
                }
              )}

            </div>

          )}

        </div>

      </div>
    </section>
  )
}

export default Avaliacoes