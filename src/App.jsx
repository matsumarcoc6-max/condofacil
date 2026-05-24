import { useState } from "react";
import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import Avisos from "./pages/Avisos";
import Ocorrencias from "./pages/Ocorrencias";
import Visitantes from "./pages/Visitantes";
import Reservas from "./pages/Reservas";
import Documentos from "./pages/Documentos";
import Financeiro from "./pages/Financeiro";
import Enquetes from "./pages/Enquetes";
import Dashboard from "./pages/Dashboard";
import Moradores from "./pages/Moradores";
export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [esqueceuSenha, setEsqueceuSenha] = useState(false);
const [emailRecuperacao, setEmailRecuperacao] = useState("");
const [mensagemRecuperacao, setMensagemRecuperacao] = useState("");
  const [condominio, setCondominio] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [pagina, setPagina] = useState("dashboard");
  async function recuperarSenha() {
    if (!emailRecuperacao) {
      setMensagemRecuperacao("Digite seu e-mail para recuperar a senha.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, emailRecuperacao);
      setMensagemRecuperacao("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
    } catch (e) {
      setMensagemRecuperacao("E-mail não encontrado. Verifique e tente novamente.");
    }
  }
  async function login() {
    try {
      const resultado = await signInWithEmailAndPassword(auth, email, password);
      setUser(resultado.user);
      setErro("");
      carregarCondominio(resultado.user.uid);
    } catch (e) {
      setErro("E-mail ou senha incorretos.");
    }
  }

  async function carregarCondominio(uid) {
    const snap = await getDocs(collection(db, "condominios"));
    if (!snap.empty) {
      setCondominio(snap.docs[0].data());
    }

    const { doc, getDoc } = await import("firebase/firestore");
    const perfilDoc = await getDoc(doc(db, "usuarios", uid));
    if (perfilDoc.exists()) {
      setPerfil(perfilDoc.data().perfil);
    }
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
    setCondominio(null);
  }

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.titulo}>CondoFácil</h1>
          <p style={styles.subtitulo}>Acesse sua conta</p>
          <input
            style={styles.input}
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div style={{ position: "relative", marginBottom: "12px" }}>
            <input
              style={{ ...styles.input, marginBottom: 0 }}
              type={mostrarSenha ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              onClick={() => setMostrarSenha(!mostrarSenha)}
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#64748b", fontSize: "1.1rem" }}
            >
              {mostrarSenha ? "🙈" : "👁️"}
            </span>
          </div>
          {erro && <p style={styles.erro}>{erro}</p>}
          
          {!esqueceuSenha ? (
            <>
              <button style={styles.botao} onClick={login}>
                Entrar
              </button>
              <p
                onClick={() => { setEsqueceuSenha(true); setErro(""); }}
                style={{ color: "#38bdf8", fontSize: "0.85rem", cursor: "pointer", marginTop: "12px" }}
              >
                Esqueci minha senha
              </p>
            </>
          ) : (
            <>
              <input
                style={styles.input}
                type="email"
                placeholder="Digite seu e-mail"
                value={emailRecuperacao}
                onChange={(e) => setEmailRecuperacao(e.target.value)}
              />
              {mensagemRecuperacao && (
                <p style={{ color: "#22c55e", fontSize: "0.85rem", marginBottom: "8px" }}>
                  {mensagemRecuperacao}
                </p>
              )}
              <button style={styles.botao} onClick={recuperarSenha}>
                Enviar e-mail de recuperação
              </button>
              <p
                onClick={() => { setEsqueceuSenha(false); setMensagemRecuperacao(""); }}
                style={{ color: "#94a3b8", fontSize: "0.85rem", cursor: "pointer", marginTop: "12px" }}
              >
                Voltar ao login
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: "dashboard", label: "🏠 Dashboard", perfis: ["admin_geral", "sindico", "morador", "porteiro"] },
    { id: "avisos", label: "📢 Avisos", perfis: ["admin_geral", "sindico", "morador", "porteiro"] },
    { id: "ocorrencias", label: "🚨 Ocorrencias", perfis: ["admin_geral", "sindico", "morador"] },
    { id: "reservas", label: "📅 Reservas", perfis: ["admin_geral", "sindico", "morador"] },
    { id: "visitantes", label: "👥 Visitantes", perfis: ["admin_geral", "sindico", "porteiro"] },
    { id: "documentos", label: "📄 Documentos", perfis: ["admin_geral", "sindico", "morador"] },
    { id: "financeiro", label: "💰 Financeiro", perfis: ["admin_geral", "sindico"] },
    { id: "enquetes", label: "📊 Enquetes", perfis: ["admin_geral", "sindico", "morador"] },
    { id: "moradores", label: "🏘️ Moradores", perfis: ["admin_geral", "sindico"] },
  ];

  return (
    <div style={styles.appContainer}>
      {/* Menu lateral */}
      <div style={styles.sidebar}>
        <div>
          <h2 style={styles.logo}>CondoFácil</h2>
          {condominio && (
            <p style={styles.nomeCondominio}>{condominio.nome}</p>
          )}
        </div>
        <nav style={{ marginTop: "32px" }}>
          {menuItems
    .filter((item) => !perfil || item.perfis.includes(perfil))
    .map((item) => (
    <button
      key={item.id}
      style={{
        ...styles.menuItem,
        background: pagina === item.id ? "#38bdf8" : "transparent",
        color: pagina === item.id ? "#0f172a" : "#94a3b8",
      }}
      onClick={() => setPagina(item.id)}
    >
      {item.label}
    </button>
  ))}
        </nav>
        <button style={styles.botaoSair} onClick={logout}>
          Sair
        </button>
      </div>

      {/* Conteúdo principal */}
      <div style={styles.main}>
        {pagina === "dashboard" && <Dashboard condominio={condominio} />}
        {pagina === "avisos" && <Avisos />}
        {pagina === "ocorrencias" && <Ocorrencias />}
        {pagina === "reservas" && <Reservas />}
        {pagina === "visitantes" && <Visitantes />}
        {pagina === "documentos" && <Documentos />}
        {pagina === "financeiro" && <Financeiro />}
        {pagina === "enquetes" && <Enquetes />}
        {pagina === "moradores" && <Moradores />}
      </div>
    </div>
  );
}

function EmBreve({ modulo }) {
  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ color: "#38bdf8" }}>{modulo}</h2>
      <p style={{ color: "#64748b", marginTop: "12px" }}>
        Módulo em desenvolvimento. Em breve disponível.
      </p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "sans-serif",
  },
  card: {
    background: "#1e293b",
    padding: "40px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  titulo: { color: "#38bdf8", fontSize: "2rem", marginBottom: "4px" },
  subtitulo: { color: "#94a3b8", marginBottom: "24px" },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#f1f5f9",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  botao: {
    width: "100%",
    padding: "12px",
    background: "#38bdf8",
    color: "#0f172a",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "8px",
  },
  erro: { color: "#ef4444", marginBottom: "12px", fontSize: "0.9rem" },
  appContainer: {
    display: "flex",
    minHeight: "100vh",
    background: "#0f172a",
    fontFamily: "sans-serif",
  },
  sidebar: {
    width: "240px",
    background: "#1e293b",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "100vh",
  },
  logo: { color: "#38bdf8", fontSize: "1.4rem", marginBottom: "4px" },
  nomeCondominio: {
    color: "#64748b",
    fontSize: "0.8rem",
    marginTop: "4px",
  },
  menuItem: {
    display: "block",
    width: "100%",
    padding: "10px 16px",
    marginBottom: "4px",
    borderRadius: "8px",
    border: "none",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  botaoSair: {
    padding: "10px",
    background: "transparent",
    color: "#ef4444",
    border: "1px solid #ef4444",
    borderRadius: "8px",
    cursor: "pointer",
    width: "100%",
    fontSize: "0.9rem",
  },
  main: {
    flex: 1,
    overflowY: "auto",
  },
};