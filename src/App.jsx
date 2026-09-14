import './App.css'
import './pages/solicitante/Solicitante.css'
import './pages/prestador/Prestador.css'

import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'

import Header from './components/Header'
import Footer from './components/Footer'

// =====================================================
// PÚBLICO
// =====================================================

import Home from './pages/public/Home'
import Login from './pages/public/Login'
import Cadastro from './pages/public/Cadastro'

// =====================================================
// SOLICITANTE
// =====================================================

import SolicitanteDashboard from './pages/solicitante/Dashboard'
import SolicitarServico from './pages/solicitante/SolicitarServico'
import MeusServicos from './pages/solicitante/MeusServicos'
import PropostasRecebidas from './pages/solicitante/PropostasRecebidas'
import SolicitanteDetalhesServico from './pages/solicitante/DetalhesServico'
import SolicitanteAvaliacoes from './pages/solicitante/Avaliacoes'
import AvaliarPrestador from './pages/solicitante/AvaliarPrestador'

// =====================================================
// PRESTADOR
// =====================================================

import PrestadorDashboard from './pages/prestador/Dashboard'
import ServicosDisponiveis from './pages/prestador/ServicosDisponiveis'
import SolicitacaoPrestador from './pages/prestador/SolicitacaoPrestador'
import MinhasPropostas from './pages/prestador/MinhasPropostas'
import PrestadorMeusServicos from './pages/prestador/MeusServicos'
import PrestadorDetalhesServico from './pages/prestador/DetalhesServico'
import AvaliarCliente from './pages/prestador/AvaliarCliente'
import PrestadorAvaliacoes from './pages/prestador/Avaliacoes'

// =====================================================
// COMPARTILHADO
// =====================================================

import Perfil from './pages/compartilhado/Perfil'


function App() {
  return (
    <BrowserRouter>

      <Header />

      <main>

        <Routes>

          {/* =================================================
              PÚBLICO
              ================================================= */}

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/cadastro"
            element={<Cadastro />}
          />


          {/* =================================================
              SOLICITANTE
              ================================================= */}

          <Route
            path="/solicitante"
            element={<SolicitanteDashboard />}
          />

          <Route
            path="/solicitar"
            element={<SolicitarServico />}
          />

          <Route
            path="/meus-servicos"
            element={<MeusServicos />}
          />

          <Route
            path="/meus-servicos/:id"
            element={<SolicitanteDetalhesServico />}
          />

          <Route
            path="/meus-servicos/:id/avaliar"
            element={<AvaliarPrestador />}
          />

          <Route
            path="/propostas-recebidas"
            element={<PropostasRecebidas />}
          />

          <Route
            path="/solicitante/avaliacoes"
            element={<SolicitanteAvaliacoes />}
          />


          {/* =================================================
              PRESTADOR
              ================================================= */}

          <Route
            path="/prestador"
            element={<PrestadorDashboard />}
          />

          <Route
            path="/prestador/servicos"
            element={<ServicosDisponiveis />}
          />

          <Route
            path="/prestador/servicos/:id"
            element={<SolicitacaoPrestador />}
          />

          <Route
            path="/prestador/minhas-propostas"
            element={<MinhasPropostas />}
          />

          <Route
            path="/prestador/meus-servicos"
            element={<PrestadorMeusServicos />}
          />

          <Route
            path="/prestador/meus-servicos/:id"
            element={<PrestadorDetalhesServico />}
          />

          {/* NOVA — AVALIAR CLIENTE */}

          <Route
            path="/prestador/meus-servicos/:id/avaliar"
            element={<AvaliarCliente />}
          />

          <Route
            path="/prestador/avaliacoes"
            element={<PrestadorAvaliacoes />}
          />


          {/* =================================================
              COMPARTILHADO
              ================================================= */}

          <Route
            path="/perfil"
            element={<Perfil />}
          />

        </Routes>

      </main>

      <Footer />

    </BrowserRouter>
  )
}

export default App