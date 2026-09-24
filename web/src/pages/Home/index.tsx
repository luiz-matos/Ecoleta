import { Link } from "react-router-dom"
import { FiLogIn, FiSearch } from "react-icons/fi"

import "./styles.css"
import logo from "../../assets/logo.svg"

const Home = () => {
  return (
    <div id="page-home">
      <div className="content">
        <header>
          <img src={logo} alt="Ecoleta" />
        </header>
        <main>
          <h1>Seu marketplace de coleta de resíduos.</h1>
          <p>
            Ajudamos pessoas a encontrarem pontos de coleta de forma eficiente
          </p>
          <Link to="/create-point">
            <span>
              <FiLogIn />
            </span>
            <strong>Cadastre um ponto de coleta</strong>
          </Link>
          <Link to="/points" className="secondary">
            <span>
              <FiSearch />
            </span>
            <strong>Encontre um ponto de coleta</strong>
          </Link>
        </main>
      </div>
    </div>
  )
}
export default Home
