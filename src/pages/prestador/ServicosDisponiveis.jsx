import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { auth, db } from '../../firebase/config'

function ServicosDisponiveis() {
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [servicos, setServicos] = useState([])
  const [filtroCategoria, setFiltroCategoria] = useState('todos')
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let unsubscribeServicos = null

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          setUsuario(null)
          setCarregando(false)
          navigate('/login')
          return
        }

        setUsuario(user)

        try {
          const { doc, getDoc } = await import(
            'firebase/firestore'
          )

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
        } catch (error) {
          console.error(
            'Erro ao carregar perfil:',
            error
          )
        }

        const servicosQuery = query(
          collection(db, 'requests'),
          where('status', '==', 'aberta')
        )

        unsubscribeServicos = onSnapshot(
          servicosQuery,
          (snapshot) => {
            const lista = snapshot.docs.map(
              (documento) => ({
                id: documento.id,
                ...documento.data(),
              })
            )

            lista.sort((a, b) => {
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

            setServicos(lista)
            setCarregando(false)
          },
          (error) => {
            console.error(
              'Erro ao carregar serviços:',
              error
            )

            setErro(
              'Não foi possível carregar os serviços disponíveis.'
            )

            setCarregando(false)
          }
        )
      }
    )

    return () => {
      unsubscribeAuth()

      if (unsubscribeServicos) {
        unsubscribeServicos()
      }
    }
  }, [navigate])

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

  const categorias = [
    {
      valor: 'todos',
      nome: 'Todos',
    },
    {
      valor: 'eletrica',
      nome: 'Elétrica',
    },
    {
      valor: 'hidraulica',
      nome: 'Hidráulica',
    },
    {
      valor: 'limpeza',
      nome: 'Limpeza',
    },
    {
      valor: 'pintura',
      nome: 'Pintura',
    },
    {
      valor: 'manutencao',
      nome: 'Manutenção',
    },
    {
      valor: 'climatizacao',
      nome: 'Climatização',
    },
  ]

  const servicosFiltrados =
    servicos.filter((servico) => {

      const correspondeCategoria =
        filtroCategoria === 'todos' ||
        servico.categoria ===
          filtroCategoria

      const termoBusca =
        busca.trim().toLowerCase()

      const correspondeBusca =
        !termoBusca ||
        servico.titulo
          ?.toLowerCase()
          .includes(termoBusca) ||
        servico.descricao
          ?.toLowerCase()
          .includes(termoBusca) ||
        servico.localizacao
          ?.toLowerCase()
          .includes(termoBusca)

      return (
        correspondeCategoria &&
        correspondeBusca
      )
    })

  if (carregando) {
    return (
      <section className="provider-services-page">
        <div className="provider-services-container">

          <div className="provider-loading">

            <div className="loading-spinner"></div>

            <p>
              Carregando serviços...
            </p>

          </div>

        </div>
      </section>
    )
  }

  return (
    <section className="provider-services-page">

      <div className="provider-services-container">

        {/* CABEÇALHO */}

        <div className="provider-services-header">

          <div>

            <span className="section-eyebrow">
              OPORTUNIDADES
            </span>

            <h1>
              Encontre serviços
              <br />
              <strong>para oferecer.</strong>
            </h1>

            <p>
              Encontre solicitações de clientes
              que combinam com o que você sabe fazer.
            </p>

          </div>

          <Link
            to="/prestador"
            className="provider-services-back"
          >
            ← Área do profissional
          </Link>

        </div>


        {/* BARRA DE BUSCA */}

        <div className="provider-search-box">

          <span className="provider-search-icon">
            ⌕
          </span>

          <input
            type="text"
            value={busca}
            onChange={(event) =>
              setBusca(event.target.value)
            }
            placeholder="Buscar por serviço, descrição ou localização..."
          />

          {busca && (
            <button
              type="button"
              className="provider-search-clear"
              onClick={() => setBusca('')}
            >
              ×
            </button>
          )}

        </div>


        {/* FILTROS */}

        <div className="provider-category-filters">

          {categorias.map(
            (categoria) => (
              <button
                key={categoria.valor}
                type="button"
                className={
                  filtroCategoria ===
                  categoria.valor
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setFiltroCategoria(
                    categoria.valor
                  )
                }
              >
                {categoria.nome}

                {categoria.valor ===
                  'todos' && (
                  <span>
                    {servicos.length}
                  </span>
                )}
              </button>
            )
          )}

        </div>


        {/* CABEÇALHO DA LISTA */}

        <div className="provider-results-header">

          <div>

            <h2>
              Serviços disponíveis
            </h2>

            <span>
              {servicosFiltrados.length}{' '}
              {servicosFiltrados.length ===
              1
                ? 'oportunidade encontrada'
                : 'oportunidades encontradas'}
            </span>

          </div>

        </div>


        {erro && (
          <div className="proposals-error">
            <span>!</span>
            {erro}
          </div>
        )}


        {/* LISTA */}

        {servicosFiltrados.length ===
        0 ? (

          <div className="provider-services-empty">

            <div className="provider-empty-icon">
              ◇
            </div>

            <h3>
              Nenhum serviço encontrado.
            </h3>

            <p>
              Tente mudar os filtros ou realizar
              uma nova busca.
            </p>

            {(busca ||
              filtroCategoria !==
                'todos') && (
              <button
                type="button"
                onClick={() => {
                  setBusca('')
                  setFiltroCategoria(
                    'todos'
                  )
                }}
              >
                Limpar filtros
              </button>
            )}

          </div>

        ) : (

          <div className="provider-opportunities-list">

            {servicosFiltrados.map(
              (servico) => (

                <Link
                  key={servico.id}
                  to={`/prestador/servicos/${servico.id}`}
                  className="provider-opportunity-card"
                >

                  {/* ÍCONE */}

                  <div className="provider-opportunity-icon">
                    {obterIcone(
                      servico.categoria
                    )}
                  </div>


                  {/* INFORMAÇÕES */}

                  <div className="provider-opportunity-info">

                    <div className="provider-opportunity-category">
                      {obterCategoria(
                        servico.categoria
                      )}
                    </div>

                    <h3>
                      {servico.titulo ||
                        'Serviço solicitado'}
                    </h3>

                    <p>
                      {servico.descricao ||
                        'O cliente não informou uma descrição.'}
                    </p>

                    <div className="provider-opportunity-meta">

                      {servico.localizacao && (
                        <span>
                          📍{' '}
                          {servico.localizacao}
                        </span>
                      )}

                      {servico.criadoEm && (
                        <span>
                          📅 Publicado em{' '}
                          {formatarData(
                            servico.criadoEm
                          )}
                        </span>
                      )}

                    </div>

                  </div>


                  {/* VALOR */}

                  <div className="provider-opportunity-budget">

                    <span>
                      ORÇAMENTO DO CLIENTE
                    </span>

                    <strong>
                      {formatarValor(
                        servico.orcamento
                      )}
                    </strong>

                    <span className="provider-opportunity-arrow">
                      →
                    </span>

                  </div>

                </Link>

              )
            )}

          </div>

        )}

      </div>

    </section>
  )
}

export default ServicosDisponiveis