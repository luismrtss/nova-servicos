import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../../firebase/config'

const categorias = [
  {
    valor: 'eletrica',
    nome: 'Elétrica',
    descricao: 'Instalações e reparos elétricos',
    icone: '⚡',
  },
  {
    valor: 'hidraulica',
    nome: 'Hidráulica',
    descricao: 'Encanamento e vazamentos',
    icone: '🔧',
  },
  {
    valor: 'limpeza',
    nome: 'Limpeza',
    descricao: 'Limpeza residencial e comercial',
    icone: '✦',
  },
  {
    valor: 'pintura',
    nome: 'Pintura',
    descricao: 'Pintura de ambientes',
    icone: '◈',
  },
  {
    valor: 'manutencao',
    nome: 'Manutenção',
    descricao: 'Reparos e manutenção geral',
    icone: '🛠',
  },
  {
    valor: 'climatizacao',
    nome: 'Climatização',
    descricao: 'Ar-condicionado e ventilação',
    icone: '❄',
  },
  {
    valor: 'outros',
    nome: 'Outro serviço',
    descricao: 'Não encontrou sua categoria?',
    icone: '+',
  },
]

function SolicitarServico() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [categoria, setCategoria] = useState(
    searchParams.get('categoria') || ''
  )

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [localizacao, setLocalizacao] = useState('')
  const [orcamento, setOrcamento] = useState('')
  const [dataDesejada, setDataDesejada] = useState('')

  const [carregando, setCarregando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const categoriaUrl = searchParams.get('categoria')

    if (categoriaUrl) {
      setCategoria(categoriaUrl)
    }
  }, [searchParams])

  async function handleSubmit(event) {
    event.preventDefault()

    setErro('')
    setSucesso(false)

    if (!categoria) {
      setErro('Escolha uma categoria para o serviço.')
      return
    }

    if (!titulo.trim()) {
      setErro('Informe um título para sua solicitação.')
      return
    }

    if (!descricao.trim()) {
      setErro('Descreva o serviço que você precisa.')
      return
    }

    if (!localizacao.trim()) {
      setErro('Informe onde o serviço será realizado.')
      return
    }

    try {
      setCarregando(true)

      const user = await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(
          auth,
          (currentUser) => {
            unsubscribe()
            resolve(currentUser)
          }
        )
      })

      if (!user) {
        navigate('/login')
        return
      }

      await addDoc(
        collection(db, 'requests'),
        {
          usuarioId: user.uid,
          categoria,
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          localizacao: localizacao.trim(),
          orcamento: orcamento
            ? Number(orcamento)
            : null,
          dataDesejada: dataDesejada || null,
          status: 'aberta',
          criadoEm: serverTimestamp(),
        }
      )

      setTitulo('')
      setDescricao('')
      setLocalizacao('')
      setOrcamento('')
      setDataDesejada('')

      setSucesso(true)

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (error) {
      console.error(
        'Erro ao criar solicitação:',
        error
      )

      setErro(
        'Não foi possível criar sua solicitação. Tente novamente.'
      )
    } finally {
      setCarregando(false)
    }
  }

  return (
    <section className="request-page">

      <div className="request-container">

        {/* =================================================
            CABEÇALHO
            ================================================= */}

        <div className="request-page-header">

          <button
            type="button"
            className="request-back"
            onClick={() => navigate('/solicitante')}
          >
            ← Voltar para minha área
          </button>

          <span className="request-eyebrow">
            NOVA SOLICITAÇÃO
          </span>

          <h1>
            O que você precisa
            <br />
            <strong>resolver?</strong>
          </h1>

          <p>
            Conte para nós o que precisa ser feito.
            Profissionais poderão analisar sua solicitação
            e enviar propostas.
          </p>

        </div>


        {/* =================================================
            MENSAGEM DE SUCESSO
            ================================================= */}

        {sucesso && (
          <div className="request-success">

            <div className="request-success-icon">
              ✓
            </div>

            <div>
              <strong>
                Solicitação publicada!
              </strong>

              <p>
                Agora profissionais poderão visualizar
                sua solicitação e enviar propostas.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate('/propostas-recebidas')
              }
            >
              Ver propostas →
            </button>

          </div>
        )}


        {/* =================================================
            FORMULÁRIO
            ================================================= */}

        <form
          className="request-form"
          onSubmit={handleSubmit}
        >

          {/* CATEGORIA */}

          <div className="request-form-section">

            <div className="request-form-heading">

              <span>
                01
              </span>

              <div>
                <h2>
                  Qual serviço você precisa?
                </h2>

                <p>
                  Escolha a categoria que melhor descreve
                  sua necessidade.
                </p>
              </div>

            </div>


            <div className="request-category-grid">

              {categorias.map(
                (item) => (
                  <button
                    type="button"
                    key={item.valor}
                    className={
                      categoria === item.valor
                        ? 'request-category active'
                        : 'request-category'
                    }
                    onClick={() =>
                      setCategoria(item.valor)
                    }
                  >

                    <span className="request-category-icon">
                      {item.icone}
                    </span>

                    <span className="request-category-info">

                      <strong>
                        {item.nome}
                      </strong>

                      <small>
                        {item.descricao}
                      </small>

                    </span>

                    <span className="request-category-check">
                      {categoria === item.valor
                        ? '✓'
                        : ''}
                    </span>

                  </button>
                )
              )}

            </div>

          </div>


          {/* DETALHES */}

          <div className="request-form-section">

            <div className="request-form-heading">

              <span>
                02
              </span>

              <div>
                <h2>
                  Conte mais sobre o serviço
                </h2>

                <p>
                  Quanto mais detalhes você fornecer,
                  melhor o profissional poderá entender sua necessidade.
                </p>
              </div>

            </div>


            <div className="request-fields">

              <div className="request-field">

                <label htmlFor="titulo">
                  Título da solicitação
                </label>

                <input
                  id="titulo"
                  type="text"
                  placeholder="Ex.: Instalação de chuveiro"
                  value={titulo}
                  onChange={(event) =>
                    setTitulo(event.target.value)
                  }
                  maxLength={100}
                />

                <small>
                  Dê um nome simples e objetivo ao serviço.
                </small>

              </div>


              <div className="request-field">

                <label htmlFor="descricao">
                  Descrição
                </label>

                <textarea
                  id="descricao"
                  placeholder="Explique o que precisa ser feito, detalhes do problema, quantidade de itens, materiais envolvidos..."
                  value={descricao}
                  onChange={(event) =>
                    setDescricao(event.target.value)
                  }
                  rows={6}
                  maxLength={1000}
                />

                <small>
                  {descricao.length}/1000 caracteres
                </small>

              </div>

            </div>

          </div>


          {/* LOCAL E ORÇAMENTO */}

          <div className="request-form-section">

            <div className="request-form-heading">

              <span>
                03
              </span>

              <div>
                <h2>
                  Onde e quando?
                </h2>

                <p>
                  Informe o local e, se souber,
                  quando gostaria que o serviço fosse realizado.
                </p>
              </div>

            </div>


            <div className="request-fields request-fields-two">

              <div className="request-field">

                <label htmlFor="localizacao">
                  Local do serviço
                </label>

                <input
                  id="localizacao"
                  type="text"
                  placeholder="Ex.: Aracaju - SE"
                  value={localizacao}
                  onChange={(event) =>
                    setLocalizacao(event.target.value)
                  }
                />

              </div>


              <div className="request-field">

                <label htmlFor="dataDesejada">
                  Data desejada
                </label>

                <input
                  id="dataDesejada"
                  type="date"
                  value={dataDesejada}
                  onChange={(event) =>
                    setDataDesejada(event.target.value)
                  }
                />

              </div>

            </div>


            <div className="request-field request-budget">

              <label htmlFor="orcamento">
                Orçamento disponível
              </label>

              <div className="request-money-input">

                <span>
                  R$
                </span>

                <input
                  id="orcamento"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex.: 250"
                  value={orcamento}
                  onChange={(event) =>
                    setOrcamento(event.target.value)
                  }
                />

              </div>

              <small>
                Opcional. Você também pode deixar este campo vazio
                e analisar os valores enviados pelos profissionais.
              </small>

            </div>

          </div>


          {/* ERRO */}

          {erro && (
            <div className="request-error">
              {erro}
            </div>
          )}


          {/* ENVIO */}

          <div className="request-submit-area">

            <div>

              <strong>
                Pronto para publicar?
              </strong>

              <span>
                Sua solicitação ficará disponível para profissionais.
              </span>

            </div>

            <button
              type="submit"
              className="request-submit"
              disabled={carregando}
            >
              {carregando
                ? 'Publicando...'
                : 'Publicar solicitação →'}
            </button>

          </div>

        </form>

      </div>

    </section>
  )
}

export default SolicitarServico