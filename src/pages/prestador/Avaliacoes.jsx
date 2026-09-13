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

function Avaliacoes() {
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [avaliacoes, setAvaliacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let unsubscribeAvaliacoes = null

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        async (user) => {
          if (!user) {
            navigate('/login')
            return
          }

          setUsuario(user)

          try {
            const perfilSnapshot =
              await getDoc(
                doc(
                  db,
                  'users',
                  user.uid
                )
              )

            if (
              !perfilSnapshot.exists()
            ) {
              setErro(
                'Não foi possível encontrar seu perfil.'
              )
              setCarregando(false)
              return
            }

            const dadosPerfil =
              perfilSnapshot.data()

            if (
              dadosPerfil.tipo !==
              'prestador'
            ) {
              navigate('/solicitante')
              return
            }

            setPerfil(dadosPerfil)

            const avaliacoesQuery =
              query(
                collection(
                  db,
                  'ratings'
                ),
                where(
                  'avaliadoId',
                  '==',
                  user.uid
                )
              )

            unsubscribeAvaliacoes =
              onSnapshot(
                avaliacoesQuery,
                async (snapshot) => {
                  try {
                    const lista =
                      await Promise.all(
                        snapshot.docs.map(
                          async (
                            documento
                          ) => {
                            const avaliacao =
                              documento.data()

                            let avaliador =
                              null

                            if (
                              avaliacao.avaliadorId
                            ) {
                              const avaliadorSnapshot =
                                await getDoc(
                                  doc(
                                    db,
                                    'users',
                                    avaliacao.avaliadorId
                                  )
                                )

                              if (
                                avaliadorSnapshot.exists()
                              ) {
                                avaliador =
                                  avaliadorSnapshot.data()
                              }
                            }

                            return {
                              id: documento.id,
                              ...avaliacao,
                              avaliador,
                            }
                          }
                        )
                      )

                    lista.sort(
                      (a, b) => {
                        const dataA =
                          a.criadoEm?.toDate
                            ? a.criadoEm.toDate()
                            : new Date(0)

                        const dataB =
                          b.criadoEm?.toDate
                            ? b.criadoEm.toDate()
                            : new Date(0)

                        return (
                          dataB - dataA
                        )
                      }
                    )

                    setAvaliacoes(
                      lista
                    )
                    setCarregando(false)
                  } catch (error) {
                    console.error(
                      'Erro ao carregar avaliadores:',
                      error
                    )

                    setErro(
                      'Não foi possível carregar as avaliações.'
                    )

                    setCarregando(false)
                  }
                },
                (error) => {
                  console.error(
                    'Erro ao carregar avaliações:',
                    error
                  )

                  setErro(
                    'Não foi possível carregar as avaliações.'
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

  function obterNota(avaliacao) {
    const nota = Number(
      avaliacao?.nota
    )

    if (
      Number.isNaN(nota) ||
      nota < 1 ||
      nota > 5
    ) {
      return 0
    }

    return nota
  }

  function formatarData(timestamp) {
    if (!timestamp?.toDate) {
      return ''
    }

    return timestamp
      .toDate()
      .toLocaleDateString(
        'pt-BR',
        {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }
      )
  }

  function calcularMedia() {
    if (
      avaliacoes.length === 0
    ) {
      return 0
    }

    const notas =
      avaliacoes
        .map(obterNota)
        .filter(
          (nota) => nota > 0
        )

    if (notas.length === 0) {
      return 0
    }

    const soma =
      notas.reduce(
        (total, nota) =>
          total + nota,
        0
      )

    return Number(
      (
        soma / notas.length
      ).toFixed(1)
    )
  }

  function contarNotas(nota) {
    return avaliacoes.filter(
      (avaliacao) =>
        obterNota(avaliacao) ===
        nota
    ).length
  }

  function percentualNota(nota) {
    if (
      avaliacoes.length === 0
    ) {
      return 0
    }

    return Math.round(
      (contarNotas(nota) /
        avaliacoes.length) *
        100
    )
  }

  const media = calcularMedia()

  if (carregando) {
    return (
      <section className="provider-ratings-page">

        <div className="provider-ratings-container">

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
    <section className="provider-ratings-page">

      <div className="provider-ratings-container">

        {/* ==================================================
            CABEÇALHO
            ================================================== */}

        <div className="provider-ratings-header">

          <div>

            <span className="section-eyebrow">
              AVALIAÇÕES
            </span>

            <h1>
              Sua reputação
              <br />
              <strong>fala por você.</strong>
            </h1>

            <p>
              Veja como os clientes avaliam
              a experiência de trabalhar com você.
            </p>

          </div>

          <Link
            to="/perfil"
            className="provider-ratings-profile-link"
          >
            Ver meu perfil
            <span>→</span>
          </Link>

        </div>


        {erro && (
          <div className="proposals-error">
            <span>!</span>
            {erro}
          </div>
        )}


        {/* ==================================================
            RESUMO
            ================================================== */}

        <div className="provider-ratings-summary">

          {/* MÉDIA */}

          <div className="provider-ratings-score">

            <span className="provider-ratings-score-label">
              NOTA GERAL
            </span>

            <div className="provider-ratings-score-number">
              {avaliacoes.length > 0
                ? media.toFixed(1)
                : '—'}
            </div>

            <div className="provider-ratings-stars">

              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>

            </div>

            <p>
              {avaliacoes.length ===
              0
                ? 'Ainda não possui avaliações'
                : avaliacoes.length ===
                  1
                  ? '1 avaliação recebida'
                  : `${avaliacoes.length} avaliações recebidas`}
            </p>

          </div>


          {/* DISTRIBUIÇÃO */}

          <div className="provider-ratings-distribution">

            <span className="provider-ratings-score-label">
              DISTRIBUIÇÃO DAS NOTAS
            </span>

            {[5, 4, 3, 2, 1].map(
              (nota) => (
                <div
                  key={nota}
                  className="provider-rating-bar-row"
                >

                  <span className="provider-rating-bar-label">
                    {nota}
                    <span>★</span>
                  </span>

                  <div className="provider-rating-bar">
                    <div
                      className="provider-rating-bar-fill"
                      style={{
                        width: `${percentualNota(
                          nota
                        )}%`,
                      }}
                    ></div>
                  </div>

                  <span className="provider-rating-bar-count">
                    {contarNotas(nota)}
                  </span>

                </div>
              )
            )}

          </div>

        </div>


        {/* ==================================================
            LISTA DE AVALIAÇÕES
            ================================================== */}

        <div className="provider-ratings-list-section">

          <div className="provider-ratings-list-header">

            <div>

              <span className="section-eyebrow">
                FEEDBACK DOS CLIENTES
              </span>

              <h2>
                O que estão dizendo
              </h2>

            </div>

            <span className="provider-ratings-total">
              {avaliacoes.length}{' '}
              {avaliacoes.length ===
              1
                ? 'avaliação'
                : 'avaliações'}
            </span>

          </div>


          {avaliacoes.length ===
          0 ? (

            <div className="provider-ratings-empty">

              <div className="provider-ratings-empty-icon">
                ★
              </div>

              <h3>
                Sua primeira avaliação
              </h3>

              <p>
                Quando um cliente concluir
                um serviço com você e deixar
                uma avaliação, ela aparecerá
                aqui.
              </p>

              <Link
                to="/prestador/servicos"
                className="provider-primary-button"
              >
                Encontrar serviços
                <span>→</span>
              </Link>

            </div>

          ) : (

            <div className="provider-ratings-list">

              {avaliacoes.map(
                (avaliacao) => {

                  const nota =
                    obterNota(
                      avaliacao
                    )

                  const nomeAvaliador =
                    avaliacao
                      .avaliador
                      ?.nome ||
                    'Cliente'

                  const inicial =
                    nomeAvaliador
                      .charAt(0)
                      .toUpperCase()

                  return (
                    <article
                      key={
                        avaliacao.id
                      }
                      className="provider-rating-card"
                    >

                      <div className="provider-rating-card-top">

                        <div className="provider-rating-user">

                          <div className="provider-rating-avatar">
                            {inicial}
                          </div>

                          <div>

                            <strong>
                              {nomeAvaliador}
                            </strong>

                            <span>
                              Cliente
                            </span>

                          </div>

                        </div>


                        <div className="provider-rating-card-meta">

                          <div className="provider-rating-card-stars">

                            {[1, 2, 3, 4, 5].map(
                              (estrela) => (
                                <span
                                  key={
                                    estrela
                                  }
                                  className={
                                    estrela <=
                                    nota
                                      ? 'filled'
                                      : ''
                                  }
                                >
                                  ★
                                </span>
                              )
                            )}

                          </div>

                          <span>
                            {formatarData(
                              avaliacao.criadoEm
                            )}
                          </span>

                        </div>

                      </div>


                      {avaliacao.comentario ? (

                        <p className="provider-rating-comment">
                          “
                          {
                            avaliacao.comentario
                          }
                          ”
                        </p>

                      ) : (

                        <p className="provider-rating-no-comment">
                          O cliente avaliou o serviço
                          sem deixar um comentário.
                        </p>

                      )}

                    </article>
                  )
                }
              )}

            </div>

          )}

        </div>


        {/* ==================================================
            AVISO
            ================================================== */}

        <div className="provider-ratings-footer">

          <span>
            ✓
          </span>

          <p>
            As avaliações são vinculadas aos
            serviços realizados e ajudam a construir
            sua reputação dentro da NOVA.
          </p>

        </div>

      </div>

    </section>
  )
}

export default Avaliacoes