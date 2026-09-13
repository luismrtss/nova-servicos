import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase/config'

const categorias = [
  {
    valor: 'eletrica',
    nome: 'Elétrica',
    descricao: 'Instalações, reparos e manutenção',
    icone: '⚡',
  },
  {
    valor: 'hidraulica',
    nome: 'Hidráulica',
    descricao: 'Vazamentos, torneiras e encanamento',
    icone: '🔧',
  },
  {
    valor: 'limpeza',
    nome: 'Limpeza',
    descricao: 'Residencial, comercial e pós-obra',
    icone: '✦',
  },
  {
    valor: 'pintura',
    nome: 'Pintura',
    descricao: 'Ambientes internos e externos',
    icone: '◈',
  },
  {
    valor: 'manutencao',
    nome: 'Manutenção',
    descricao: 'Reparos e pequenos serviços',
    icone: '🛠',
  },
  {
    valor: 'climatizacao',
    nome: 'Climatização',
    descricao: 'Ar-condicionado e ventilação',
    icone: '❄',
  },
]

function Home() {
  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUsuario(null)
        setPerfil(null)
        return
      }

      setUsuario(user)

      try {
        const perfilRef = doc(db, 'users', user.uid)
        const perfilSnapshot = await getDoc(perfilRef)

        if (perfilSnapshot.exists()) {
          setPerfil(perfilSnapshot.data())
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error)
      }
    })

    return () => unsubscribe()
  }, [])

  function acessarCategoria(categoria) {
    if (!usuario) {
      navigate(`/cadastro?categoria=${categoria}`)
      return
    }

    if (perfil?.tipo === 'prestador') {
      navigate('/prestador/servicos')
      return
    }

    navigate(`/solicitar?categoria=${categoria}`)
  }

  function acessarSolicitacao() {
    if (!usuario) {
      navigate('/cadastro')
      return
    }

    if (perfil?.tipo === 'prestador') {
      navigate('/prestador/servicos')
      return
    }

    navigate('/solicitar')
  }

  function acessarPrestador() {
    if (!usuario) {
      navigate('/cadastro?tipo=prestador')
      return
    }

    if (perfil?.tipo === 'prestador') {
      navigate('/prestador')
      return
    }

    navigate('/cadastro?tipo=prestador')
  }

  return (
    <div className="public-home">

      {/* HERO */}
      <section className="hero" id="inicio">
        <div className="hero-content">

          <span className="hero-tag">
            SERVIÇOS MAIS SIMPLES
          </span>

          <h1>
            Encontre quem
            <br />
            <strong>resolve.</strong>
          </h1>

          <p>
            Conectamos você a profissionais para resolver
            <br />
            serviços do dia a dia com praticidade e segurança.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="hero-primary-button"
              onClick={acessarSolicitacao}
            >
              Preciso de um serviço
              <span>→</span>
            </button>

            <button
              type="button"
              className="hero-secondary-button"
              onClick={acessarPrestador}
            >
              Quero prestar serviços
            </button>
          </div>

          <div className="hero-trust">
            <span className="hero-trust-icon">✓</span>

            <div>
              <strong>Uma forma mais simples de contratar</strong>
              <span>Encontre profissionais para o que você precisa.</span>
            </div>
          </div>

        </div>

        <div className="hero-visual">

          <div className="hero-card hero-card-main">
            <div className="hero-card-top">
              <span className="hero-card-label">
                SUA SOLICITAÇÃO
              </span>

              <span className="hero-card-status">
                Aberta
              </span>
            </div>

            <div className="hero-request">
              <span className="hero-request-icon">
                ⚡
              </span>

              <div>
                <strong>
                  Preciso instalar um chuveiro
                </strong>

                <span>
                  Elétrica · Aracaju, SE
                </span>
              </div>
            </div>

            <div className="hero-card-divider"></div>

            <div className="hero-proposal">

              <div className="hero-proposal-avatar">
                J
              </div>

              <div className="hero-proposal-info">
                <strong>
                  João • Eletricista
                </strong>

                <span>
                  ★ 4,9 · 48 avaliações
                </span>
              </div>

              <strong className="hero-proposal-price">
                R$ 120
              </strong>

            </div>

            <div className="hero-card-footer">
              <span>
                ✓ Profissional verificado
              </span>

              <span>
                Ver proposta →
              </span>
            </div>
          </div>

          <div className="hero-floating-card hero-floating-card-top">
            <span className="floating-icon">
              ✓
            </span>

            <div>
              <strong>
                Proposta recebida
              </strong>

              <span>
                Há poucos minutos
              </span>
            </div>
          </div>

          <div className="hero-floating-card hero-floating-card-bottom">
            <div className="floating-stars">
              ★★★★★
            </div>

            <strong>
              Serviço concluído
            </strong>

            <span>
              Avalie sua experiência
            </span>
          </div>

        </div>
      </section>


      {/* CATEGORIAS */}
      <section
        className="home-section categories-section"
        id="servicos"
      >
        <div className="home-container">

          <div className="section-heading">
            <div>
              <span className="section-eyebrow">
                ENCONTRE UM PROFISSIONAL
              </span>

              <h2>
                O que você precisa
                <br />
                <strong>resolver?</strong>
              </h2>
            </div>

            <p>
              Escolha uma categoria para encontrar
              profissionais preparados para ajudar.
            </p>
          </div>

          <div className="category-grid">
            {categorias.map((categoria) => (
              <button
                key={categoria.valor}
                type="button"
                className="category-card"
                onClick={() => acessarCategoria(categoria.valor)}
              >
                <span className="category-icon">
                  {categoria.icone}
                </span>

                <div className="category-content">
                  <h3>{categoria.nome}</h3>

                  <p>{categoria.descricao}</p>
                </div>

                <span className="category-arrow">
                  →
                </span>
              </button>
            ))}
          </div>

          <div className="categories-bottom">
            <span>
              Não encontrou o que procura?
            </span>

            <button
              type="button"
              onClick={acessarSolicitacao}
            >
              Veja todas as possibilidades →
            </button>
          </div>

        </div>
      </section>


      {/* COMO FUNCIONA */}
      <section
        className="home-section how-section"
        id="como-funciona"
      >
        <div className="home-container">

          <div className="section-heading centered">
            <span className="section-eyebrow">
              COMO FUNCIONA
            </span>

            <h2>
              Resolver pode ser
              <br />
              <strong>mais simples.</strong>
            </h2>

            <p>
              Na NOVA, você descreve o que precisa,
              compara propostas e escolhe quem vai resolver.
            </p>
          </div>

          <div className="steps-grid">

            <div className="step-card">
              <span className="step-number">
                01
              </span>

              <div className="step-icon">
                +
              </div>

              <h3>
                Conte o que precisa
              </h3>

              <p>
                Explique o serviço que você precisa,
                informe o local e, se quiser, seu orçamento.
              </p>
            </div>

            <div className="step-line"></div>

            <div className="step-card">
              <span className="step-number">
                02
              </span>

              <div className="step-icon">
                ◇
              </div>

              <h3>
                Receba propostas
              </h3>

              <p>
                Profissionais interessados analisam
                sua solicitação e enviam suas propostas.
              </p>
            </div>

            <div className="step-line"></div>

            <div className="step-card">
              <span className="step-number">
                03
              </span>

              <div className="step-icon">
                ✓
              </div>

              <h3>
                Compare e escolha
              </h3>

              <p>
                Compare valores, avaliações e informações
                antes de escolher o profissional.
              </p>
            </div>

            <div className="step-line"></div>

            <div className="step-card">
              <span className="step-number">
                04
              </span>

              <div className="step-icon">
                ★
              </div>

              <h3>
                Resolva e avalie
              </h3>

              <p>
                Depois do serviço, avalie sua experiência
                e ajude outros usuários.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* PARA PROFISSIONAIS */}
      <section
        className="home-section professional-section"
        id="profissionais"
      >
        <div className="home-container">

          <div className="professional-box">

            <div className="professional-content">

              <span className="section-eyebrow">
                PARA PROFISSIONAIS
              </span>

              <h2>
                Transforme o que você
                <br />
                sabe fazer em <strong>oportunidades.</strong>
              </h2>

              <p>
                Encontre pessoas que precisam exatamente
                do serviço que você oferece. Apresente seu
                trabalho, envie propostas e conquiste novos clientes.
              </p>

              <button
                type="button"
                className="professional-button"
                onClick={acessarPrestador}
              >
                Quero prestar serviços
                <span>→</span>
              </button>

            </div>

            <div className="professional-visual">

              <div className="professional-stat-card">
                <span className="professional-stat-icon">
                  ↗
                </span>

                <div>
                  <strong>
                    Novas oportunidades
                  </strong>

                  <span>
                    Serviços próximos a você
                  </span>
                </div>
              </div>

              <div className="professional-mini-card">
                <span>
                  ★
                </span>

                <div>
                  <strong>
                    Sua reputação importa
                  </strong>

                  <small>
                    Construa seu perfil com avaliações.
                  </small>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>


      {/* SOBRE */}
      <section
        className="home-section about-section"
        id="sobre"
      >
        <div className="home-container">

          <div className="about-grid">

            <div className="about-label">
              <span className="section-eyebrow">
                SOBRE A NOVA
              </span>
            </div>

            <div className="about-content">

              <h2>
                Menos complicação.
                <br />
                Mais <strong>soluções.</strong>
              </h2>

              <p>
                A NOVA nasceu para tornar mais simples a conexão
                entre quem precisa resolver um problema e quem
                sabe exatamente como resolvê-lo.
              </p>

              <p>
                Nossa proposta é aproximar clientes e profissionais
                de forma clara, prática e transparente, permitindo
                que cada pessoa encontre a solução certa para sua
                necessidade.
              </p>

              <div className="about-values">

                <div>
                  <strong>
                    01
                  </strong>

                  <span>
                    Praticidade
                  </span>
                </div>

                <div>
                  <strong>
                    02
                  </strong>

                  <span>
                    Transparência
                  </span>
                </div>

                <div>
                  <strong>
                    03
                  </strong>

                  <span>
                    Confiança
                  </span>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* CTA FINAL */}
      <section className="home-cta">

        <div className="home-container">

          <span className="section-eyebrow">
            COMECE AGORA
          </span>

          <h2>
            Tem algo para resolver?
            <br />
            <strong>A NOVA ajuda.</strong>
          </h2>

          <p>
            Crie sua conta gratuitamente e encontre
            profissionais para o que você precisa.
          </p>

          <div className="cta-actions">

            <Link
              to="/cadastro"
              className="cta-primary-button"
            >
              Criar minha conta
              <span>→</span>
            </Link>

            <Link
              to="/login"
              className="cta-secondary-button"
            >
              Já tenho uma conta
            </Link>

          </div>

        </div>

      </section>

    </div>
  )
}

export default Home