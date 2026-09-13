import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  query,
  where,
} from 'firebase/firestore'
import { auth, db } from '../../firebase/config'

function Perfil() {
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cidade, setCidade] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categorias, setCategorias] = useState([])

  const [mediaAvaliacoes, setMediaAvaliacoes] = useState(0)
  const [totalAvaliacoes, setTotalAvaliacoes] = useState(0)

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const categoriasDisponiveis = [
    {
      valor: 'eletrica',
      nome: 'Elétrica',
      icone: '⚡',
    },
    {
      valor: 'hidraulica',
      nome: 'Hidráulica',
      icone: '🔧',
    },
    {
      valor: 'limpeza',
      nome: 'Limpeza',
      icone: '✦',
    },
    {
      valor: 'pintura',
      nome: 'Pintura',
      icone: '◈',
    },
    {
      valor: 'manutencao',
      nome: 'Manutenção',
      icone: '🛠',
    },
    {
      valor: 'climatizacao',
      nome: 'Climatização',
      icone: '❄',
    },
  ]

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
          const perfilRef = doc(
            db,
            'users',
            user.uid
          )

          const perfilSnapshot =
            await getDoc(perfilRef)

          if (!perfilSnapshot.exists()) {
            setErro(
              'Não foi possível encontrar seu perfil.'
            )

            setCarregando(false)
            return
          }

          const dados =
            perfilSnapshot.data()

          setPerfil(dados)

          setNome(dados.nome || '')

          setTelefone(
            dados.telefone || ''
          )

          setCidade(
            dados.cidade || ''
          )

          setDescricao(
            dados.descricao || ''
          )

          if (
            Array.isArray(
              dados.categorias
            )
          ) {
            setCategorias(
              dados.categorias
            )
          } else if (
            dados.categoria
          ) {
            setCategorias([
              dados.categoria,
            ])
          }

          /*
            ==================================================
            AVALIAÇÕES
            ==================================================

            O score agora funciona para os dois tipos
            de usuário:

            PRESTADOR:
            recebe avaliações com tipo: "prestador"

            SOLICITANTE:
            recebe avaliações com tipo: "cliente"

            Em ambos os casos usamos o campo:
            avaliadoId

            Dessa forma, o próprio usuário recebe
            o score das avaliações que recebeu.
          */

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
              (snapshot) => {
                const avaliacoes =
                  snapshot.docs.map(
                    (documento) =>
                      documento.data()
                  )

                if (
                  avaliacoes.length === 0
                ) {
                  setMediaAvaliacoes(0)
                  setTotalAvaliacoes(0)
                  return
                }

                const notas =
                  avaliacoes
                    .map(
                      (avaliacao) =>
                        Number(
                          avaliacao.nota
                        )
                    )
                    .filter(
                      (nota) =>
                        !Number.isNaN(
                          nota
                        )
                    )

                if (
                  notas.length === 0
                ) {
                  setMediaAvaliacoes(0)
                  setTotalAvaliacoes(0)
                  return
                }

                const soma =
                  notas.reduce(
                    (
                      total,
                      nota
                    ) =>
                      total + nota,
                    0
                  )

                const media =
                  soma /
                  notas.length

                setMediaAvaliacoes(
                  Number(
                    media.toFixed(1)
                  )
                )

                setTotalAvaliacoes(
                  notas.length
                )
              },
              (error) => {
                console.error(
                  'Erro ao carregar avaliações:',
                  error
                )

                setMediaAvaliacoes(0)
                setTotalAvaliacoes(0)
              }
            )

          setCarregando(false)
        } catch (error) {
          console.error(
            'Erro ao carregar perfil:',
            error
          )

          setErro(
            'Não foi possível carregar seu perfil.'
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

  function alternarCategoria(
    categoria
  ) {
    setCategorias((atual) => {
      if (
        atual.includes(categoria)
      ) {
        return atual.filter(
          (item) =>
            item !== categoria
        )
      }

      return [
        ...atual,
        categoria,
      ]
    })
  }

  async function salvarPerfil(event) {
    event.preventDefault()

    setErro('')
    setSucesso('')

    if (!nome.trim()) {
      setErro(
        'Informe seu nome.'
      )
      return
    }

    if (
      perfil?.tipo === 'prestador' &&
      categorias.length === 0
    ) {
      setErro(
        'Selecione pelo menos uma categoria de serviço.'
      )
      return
    }

    if (!usuario) {
      setErro(
        'Sua sessão expirou. Entre novamente.'
      )
      return
    }

    setSalvando(true)

    try {
      const perfilRef = doc(
        db,
        'users',
        usuario.uid
      )

      const dadosAtualizados = {
        nome: nome.trim(),
        telefone:
          telefone.trim(),
        cidade:
          cidade.trim(),
        descricao:
          descricao.trim(),
        categorias,
      }

      await updateDoc(
        perfilRef,
        dadosAtualizados
      )

      setPerfil((atual) => ({
        ...atual,
        ...dadosAtualizados,
      }))

      setSucesso(
        'Perfil atualizado com sucesso.'
      )

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (error) {
      console.error(
        'Erro ao salvar perfil:',
        error
      )

      setErro(
        'Não foi possível salvar suas alterações. Tente novamente.'
      )
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <section className="profile-page">
        <div className="profile-container">
          <div className="provider-loading">
            <div className="loading-spinner"></div>

            <p>
              Carregando seu perfil...
            </p>
          </div>
        </div>
      </section>
    )
  }

  const ehPrestador =
    perfil?.tipo === 'prestador'

  const nomeExibicao =
    nome.trim() || 'Usuário'

  const inicial =
    nomeExibicao
      .charAt(0)
      .toUpperCase()

  return (
    <section className="profile-page">
      <div className="profile-container">

        {/* ==================================================
            CABEÇALHO
            ================================================== */}

        <div className="profile-page-header">
          <div>
            <span className="section-eyebrow">
              MEU PERFIL
            </span>

            <h1>
              {ehPrestador
                ? 'Seu perfil profissional.'
                : 'Seu perfil.'}
            </h1>

            <p>
              Mantenha suas informações
              atualizadas para ter uma
              experiência melhor na NOVA.
            </p>
          </div>
        </div>

        {/* ==================================================
            MENSAGENS
            ================================================== */}

        {erro && (
          <div className="profile-message profile-message-error">
            <span>!</span>
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="profile-message profile-message-success">
            <span>✓</span>
            {sucesso}
          </div>
        )}

        <form
          className="profile-layout"
          onSubmit={salvarPerfil}
        >

          {/* ==================================================
              CARD DE IDENTIFICAÇÃO
              ================================================== */}

          <aside className="profile-sidebar">

            <div className="profile-user-card">

              <div className="profile-large-avatar">
                {inicial}
              </div>

              <h2>
                {nomeExibicao}
              </h2>

              <span className="profile-user-type">
                {ehPrestador
                  ? 'Prestador de serviço'
                  : 'Solicitante'}
              </span>

              {/* ==================================================
                  SCORE
                  ================================================== */}

              <div className="profile-rating-summary">

                <div className="profile-rating-score">
                  {totalAvaliacoes > 0
                    ? mediaAvaliacoes.toFixed(1)
                    : 'Novo'}
                </div>

                <div className="profile-rating-stars">

                  {totalAvaliacoes > 0
                    ? (
                      <>
                        <span>★</span>
                        <span>★</span>
                        <span>★</span>
                        <span>★</span>
                        <span>★</span>
                      </>
                    )
                    : (
                      <span className="profile-rating-new">
                        Ainda não possui avaliações
                      </span>
                    )}

                </div>

                {totalAvaliacoes > 0 && (
                  <span className="profile-rating-count">
                    {totalAvaliacoes === 1
                      ? '1 avaliação'
                      : `${totalAvaliacoes} avaliações`}
                  </span>
                )}

              </div>

              <div className="profile-user-divider"></div>

              <div className="profile-user-email">

                <span>
                  E-MAIL
                </span>

                <strong>
                  {usuario?.email ||
                    'Não informado'}
                </strong>

              </div>

            </div>

          </aside>

          {/* ==================================================
              FORMULÁRIO
              ================================================== */}

          <div className="profile-main">

            <div className="profile-card">

              <div className="profile-card-header">

                <div>

                  <span className="section-eyebrow">
                    INFORMAÇÕES PESSOAIS
                  </span>

                  <h2>
                    Seus dados
                  </h2>

                </div>

              </div>

              <div className="profile-form-grid">

                <div className="profile-form-group">

                  <label htmlFor="perfil-nome">
                    Nome completo
                  </label>

                  <input
                    id="perfil-nome"
                    type="text"
                    value={nome}
                    onChange={(event) =>
                      setNome(
                        event.target.value
                      )
                    }
                    placeholder="Seu nome completo"
                    autoComplete="name"
                  />

                </div>

                <div className="profile-form-group">

                  <label htmlFor="perfil-telefone">
                    Telefone
                  </label>

                  <input
                    id="perfil-telefone"
                    type="tel"
                    value={telefone}
                    onChange={(event) =>
                      setTelefone(
                        event.target.value
                      )
                    }
                    placeholder="(00) 00000-0000"
                    autoComplete="tel"
                  />

                </div>

                <div className="profile-form-group profile-form-full">

                  <label htmlFor="perfil-cidade">
                    Cidade / Região
                  </label>

                  <input
                    id="perfil-cidade"
                    type="text"
                    value={cidade}
                    onChange={(event) =>
                      setCidade(
                        event.target.value
                      )
                    }
                    placeholder="Ex.: Aracaju - SE"
                    autoComplete="address-level2"
                  />

                </div>

                <div className="profile-form-group profile-form-full">

                  <label htmlFor="perfil-descricao">

                    {ehPrestador
                      ? 'Sobre você e seu trabalho'
                      : 'Sobre você'}

                    <span>
                      opcional
                    </span>

                  </label>

                  <textarea
                    id="perfil-descricao"
                    value={descricao}
                    onChange={(event) =>
                      setDescricao(
                        event.target.value
                      )
                    }
                    placeholder={
                      ehPrestador
                        ? 'Conte um pouco sobre sua experiência, especialidades e seu trabalho...'
                        : 'Conte um pouco sobre você...'
                    }
                    rows="5"
                  />

                </div>

              </div>

            </div>

            {/* ==================================================
                CATEGORIAS DO PRESTADOR
                ================================================== */}

            {ehPrestador && (

              <div className="profile-card">

                <div className="profile-card-header">

                  <div>

                    <span className="section-eyebrow">
                      ÁREA DE ATUAÇÃO
                    </span>

                    <h2>
                      Serviços que você oferece
                    </h2>

                    <p>
                      Selecione todas as áreas
                      em que você trabalha.
                    </p>

                  </div>

                </div>

                <div className="profile-categories">

                  {categoriasDisponiveis.map(
                    (categoria) => {

                      const selecionada =
                        categorias.includes(
                          categoria.valor
                        )

                      return (
                        <button
                          key={
                            categoria.valor
                          }
                          type="button"
                          className={
                            selecionada
                              ? 'profile-category active'
                              : 'profile-category'
                          }
                          onClick={() =>
                            alternarCategoria(
                              categoria.valor
                            )
                          }
                        >

                          <span className="profile-category-icon">
                            {categoria.icone}
                          </span>

                          <span>
                            {categoria.nome}
                          </span>

                          <span className="profile-category-check">
                            {selecionada
                              ? '✓'
                              : ''}
                          </span>

                        </button>
                      )
                    }
                  )}

                </div>

              </div>

            )}

            {/* ==================================================
                AÇÕES
                ================================================== */}

            <div className="profile-actions">

              <button
                type="button"
                className="profile-cancel-button"
                onClick={() =>
                  navigate(
                    ehPrestador
                      ? '/prestador'
                      : '/solicitante'
                  )
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="profile-save-button"
                disabled={salvando}
              >

                {salvando
                  ? 'Salvando...'
                  : 'Salvar alterações'}

                {!salvando && (
                  <span>✓</span>
                )}

              </button>

            </div>

          </div>

        </form>

      </div>
    </section>
  )
}

export default Perfil