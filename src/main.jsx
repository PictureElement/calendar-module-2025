import { StrictMode } from "react"
import ReactDOM from "react-dom"
import "normalize.css"
import "./styles.scss"
import "virtual:uno.css"
import App from "./App.jsx"

ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById('root')
);
