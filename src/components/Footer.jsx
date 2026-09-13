function Footer() {
  const anoAtual = new Date().getFullYear()

  function voltarAoTopo() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <footer className="footer">
      <div className="footer-main">

        {/* MARCA */}

        <div className="footer-brand">
          <button
            type="button"
            className="footer-logo"
            onClick={voltarAoTopo}
          >
            NOVA<span>.</span>
          </button>

          <p>
            Conectando quem precisa
            <br />
            a quem sabe resolver.
          </p>
        </div>


        {/* NAVEGAÇÃO */}

        <div className="footer-column">
          <h3>Navegação</h3>

          <button
            type="button"
            onClick={voltarAoTopo}
          >
            Início
          </button>

          <a href="/#como-funciona">
            Como funciona
          </a>

          <a href="/#servicos">
            Serviços
          </a>

          <a href="/#sobre">
            Sobre a NOVA
          </a>
        </div>


        {/* PARA QUEM PRECISA */}

        <div className="footer-column">
          <h3>Para clientes</h3>

          <a href="/cadastro">
            Criar conta
          </a>

          <a href="/login">
            Entrar
          </a>

          <a href="/solicitar">
            Solicitar serviço
          </a>
        </div>


        {/* PARA PROFISSIONAIS */}

        <div className="footer-column">
          <h3>Para profissionais</h3>

          <a href="/cadastro">
            Quero prestar serviços
          </a>

          <a href="/login">
            Área do profissional
          </a>
        </div>

      </div>


      {/* PARTE INFERIOR */}

      <div className="footer-bottom">

        <span>
          © {anoAtual} NOVA. Todos os direitos reservados.
        </span>

        <div className="footer-legal">
          <button type="button">
            Privacidade
          </button>

          <button type="button">
            Termos de uso
          </button>
        </div>

      </div>
    </footer>
  )
}

export default Footer