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

function MeusServicos() {
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [servicos, setServicos] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let unsubscribeServicos = null

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

          const servicosQuery = query(
            collection(db, 'requests'),
            where(
              'prestadorId',
              '==',
              user.uid
            )
          )

          unsubscribeServicos = onSnapshot(
            servicosQuery,
            (snapshot) => {
              const lista =
                snapshot.docs.map(
                  (documento) => ({
                    id: documento.id,
                    ...documento.data(),
                  })
                )

              lista.sort((a, b) => {
                const dataA =
                  a.contratadoEm?.toDate
                    ? a.contratadoEm.toDate()
                    : a.criadoEm?.toDate
                      ? a.criadoEm.toDate()
                      : new Date(0)

                const dataB =
                  b.contratadoEm?.toDate
                    ? b.contratadoEm.toDate()
                    : b.criadoEm?.toDate
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
                'Não foi possível carregar seus serviços.'
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
            'Não foi possível carregar sua área.'
          )

          setCarregando(false)
        }
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

  function obterStatus(status) {
    const statusMap = {
      contratada: {
        nome: 'Contratado',
        classe: 'contratado',
      },

      em_andamento: {
        nome: 'Em andamento',
        classe: 'andamento',
      },

      concluida: {
        nome: 'Concluído',
        classe: 'concluido',
      },

      cancelada: {
        nome: 'Cancelado',
        classe: 'cancelado',
      },
    }

    return (
      statusMap[status] || {
        nome: 'Contratado',
        classe: 'contratado',
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
      return 'A combinar'
    }

    return timestamp
      .toDate()
      .toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
  }

  function formatarDataServico(data) {
    if (!data) {
      return 'A combinar'
    }

    if (
      typeof data === 'string' &&
      data.includes('-')
    ) {
      const partes = data.split('-')

      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`
      }
    }

    return data
  }

  const servicosContratados =
    servicos.filter(
      (servico) =>
        servico.status === 'contratada'
    )

  const servicosAndamento =
    servicos.filter(
      (servico) =>
        servico.status === 'em_andamento'
    )

  const servicosConcluidos =
    servicos.filter(
      (servico) =>
        servico.status === 'concluida'
    )

  const servicosFiltrados =
    filtro === 'todos'
      ? servicos
      : filtro === 'contratados'
        ? servicosContratados
        : filtro === 'andamento'
          ? servicosAndamento
          : servicosConcluidos

  if (carregando) {
    return (
      <section className="provider-my-services-page">
        <div className="provider-my-services-container">

          <div className="provider-loading">

            <div className="loading-spinner"></div>

            <p>
              Carregando seus serviços...
            </p>

          </div>

        </div>
      </section>
    )
  }

  return (
    <section className="provider-my-services-page">

      <div className="provider-my-services-container">

        {/* ==================================================
            CABEÇALHO
            ================================================== */}

        <div className="provider-my-services-header">

          <div>

            <span className="section-eyebrow">
              MEUS SERVIÇOS
            </span>

            <h1>
              Seus serviços
              <br />
              <strong>contratados.</strong>
            </h1>

            <p>
              Acompanhe os serviços que você foi
              escolhido para realizar.
            </p>

          </div>

          <Link
            to="/prestador/servicos"
            className="provider-my-services-back"
          >
            ← Encontrar oportunidades
          </Link>

        </div>


        {/* ==================================================
            RESUMO
            ================================================== */}

        <div className="provider-my-services-stats">

          <div className="provider-my-services-stat">

            <div className="provider-my-services-stat-icon">
              ◇
            </div>

            <div>
              <strong>
                {servicos.length}
              </strong>

              <span>
                Total de serviços
              </span>
            </div>

          </div>


          <div className="provider-my-services-stat">

            <div className="provider-my-services-stat-icon">
              ◷
            </div>

            <div>
              <strong>
                {servicosContratados.length +
                  servicosAndamento.length}
              </strong>

              <span>
                Em aberto
              </span>
            </div>

          </div>


          <div className="provider-my-services-stat">

            <div className="provider-my-services-stat-icon">
              ✓
            </div>

            <div>
              <strong>
                {servicosConcluidos.length}
              </strong>

              <span>
                Concluídos
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


        {/* ==================================================
            FILTROS
            ================================================== */}

        <div className="provider-my-services-filters">

          <button
            type="button"
            className={
              filtro === 'todos'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFiltro('todos')
            }
          >
            Todos

            <span>
              {servicos.length}
            </span>
          </button>


          <button
            type="button"
            className={
              filtro === 'contratados'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFiltro('contratados')
            }
          >
            Contratados

            <span>
              {servicosContratados.length}
            </span>
          </button>


          <button
            type="button"
            className={
              filtro === 'andamento'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFiltro('andamento')
            }
          >
            Em andamento

            <span>
              {servicosAndamento.length}
            </span>
          </button>


          <button
            type="button"
            className={
              filtro === 'concluidos'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFiltro('concluidos')
            }
          >
            Concluídos

            <span>
              {servicosConcluidos.length}
            </span>
          </button>

        </div>


        {/* ==================================================
            LISTA
            ================================================== */}

        {servicosFiltrados.length ===
        0 ? (

          <div className="provider-my-services-empty">

            <div className="provider-empty-icon">
              ◇
            </div>

            <h2>
              {servicos.length === 0
                ? 'Você ainda não possui serviços contratados.'
                : 'Nenhum serviço nesta categoria.'}
            </h2>

            <p>
              {servicos.length === 0
                ? 'Quando um cliente aceitar sua proposta, o serviço aparecerá aqui.'
                : 'Altere o filtro para visualizar outros serviços.'}
            </p>

            {servicos.length === 0 && (
              <Link
                to="/prestador/servicos"
                className="provider-primary-button"
              >
                Encontrar serviços
                <span>→</span>
              </Link>
            )}

          </div>

        ) : (

          <div className="provider-my-services-list">

            {servicosFiltrados.map(
              (servico) => {

                const status =
                  obterStatus(
                    servico.status
                  )

                return (
                  <article
                    key={servico.id}
                    className="provider-my-service-card"
                  >

                    {/* TOPO */}

                    <div className="provider-my-service-top">

                      <div className="provider-my-service-title">

                        <div className="provider-my-service-icon">
                          {obterIcone(
                            servico.categoria
                          )}
                        </div>

                        <div>

                          <span>
                            {obterCategoria(
                              servico.categoria
                            )}
                          </span>

                          <h2>
                            {servico.titulo ||
                              'Serviço contratado'}
                          </h2>

                        </div>

                      </div>


                      <span
                        className={`provider-my-service-status ${status.classe}`}
                      >
                        {status.nome}
                      </span>

                    </div>


                    {/* INFORMAÇÕES */}

                    <div className="provider-my-service-info">

                      <div>

                        <span>
                          VALOR CONTRATADO
                        </span>

                        <strong>
                          {formatarValor(
                            servico.valorContratado
                          )}
                        </strong>

                      </div>


                      <div>

                        <span>
                          DATA DO SERVIÇO
                        </span>

                        <strong>
                          {formatarDataServico(
                            servico.dataDesejada
                          )}
                        </strong>

                      </div>


                      <div>

                        <span>
                          LOCALIZAÇÃO
                        </span>

                        <strong>
                          {servico.localizacao ||
                            'Não informada'}
                        </strong>

                      </div>


                      <div>

                        <span>
                          CONTRATADO EM
                        </span>

                        <strong>
                          {formatarData(
                            servico.contratadoEm
                          )}
                        </strong>

                      </div>

                    </div>


                    {/* AÇÕES */}

                    <div className="provider-my-service-footer">

                      <div className="provider-my-service-client">

                        <span>
                          CLIENTE
                        </span>

                        <strong>
                          Solicitação #{servico.id.slice(0, 8)}
                        </strong>

                      </div>


                      <Link
                        to={`/prestador/meus-servicos/${servico.id}`}
                        className="provider-my-service-view"
                      >
                        Ver detalhes
                        <span>→</span>
                      </Link>

                    </div>

                  </article>
                )
              }
            )}

          </div>

        )}

      </div>

    </section>
  )
}

export default MeusServicos