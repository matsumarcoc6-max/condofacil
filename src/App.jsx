import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { Routes, Route } from "react-router-dom";
import Avisos from "./pages/Avisos";
import Ocorrencias from "./pages/Ocorrencias";
import Visitantes from "./pages/Visitantes";
import Reservas from "./pages/Reservas";
import Documentos from "./pages/Documentos";
import Financeiro from "./pages/Financeiro";
import Enquetes from "./pages/Enquetes";
import Dashboard from "./pages/Dashboard";
import Moradores from "./pages/Moradores";
import Veiculos from "./pages/Veiculos";
import Pets from "./pages/Pets";
import AgendaVisitas from "./pages/AgendaVisitas";
import AchadosPerdidos from "./pages/AchadosPerdidos";
import TelefonesUteis from "./pages/TelefonesUteis";
import VisitaPublica from "./pages/VisitaPublica";

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
  const [menuAberto, setMenuAberto] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const verificar = () => setIsMobile(window.innerWidth <= 768);
    verificar();
    window.addEventListener("resize", verificar);
    return () => window.removeEventListener("resize", verificar);
  }, []);

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
    const perfilDoc = await getDoc(doc(db, "usuarios", uid));
    if (perfilDoc.exists()) {
      setPerfil(perfilDoc.data().perfil);
    }
    try {
      const { solicitarPermissaoNotificacao } = await import("./firebase");
      const token = await solicitarPermissaoNotificacao();
      if (token) {
        await updateDoc(doc(db, "usuarios", uid), { fcmToken: token });
      }
    } catch (e) {
      console.error("Erro FCM:", e);
    }
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
    setCondominio(null);
    setPerfil(null);
  }

  async function ativarNotificacoes() {
    if (!user) return;
    try {
      const { solicitarPermissaoNotificacao } = await import("./firebase");
      const token = await solicitarPermissaoNotificacao();
      if (token) {
        await updateDoc(doc(db, "usuarios", user.uid), { fcmToken: token });
        alert("Notificações ativadas!");
      }
    } catch (e) {
      console.error("Erro FCM:", e);
    }
  }

  const menuItems = [
    { id: "dashboard", label: "🏠 Dashboard", perfis: ["admin_geral", "sindico", "morador", "porteiro"] },
    { id: "avisos", label: "📢 Avisos", perfis: ["admin_geral", "sindico", "morador", "porteiro"] },
    { id: "ocorrencias", label: "🚨 Ocorrências", perfis: ["admin_geral", "sindico", "morador"] },
    { id: "reservas", label: "📅 Reservas", perfis: ["admin_geral", "sindico", "morador"] },
    { id: "visitantes", label: "👥 Visitantes", perfis: ["admin_geral", "sindico", "porteiro"] },
    { id: "agenda", label: "📋 Agenda Visitas", perfis: ["admin_geral", "sindico", "morador", "porteiro"] },
    { id: "documentos", label: "📄 Documentos", perfis: ["admin_geral", "sindico", "morador"] },
    { id: "financeiro", label: "💰 Financeiro", perfis: ["admin_geral", "sindico"] },
    { id: "enquetes", label: "📊 Enquetes", perfis: ["admin_geral", "sindico", "morador"] },
    { id: "moradores", label: "🏘️ Moradores", perfis: ["admin_geral", "sindico"] },
    { id: "veiculos", label: "🚗 Veículos", perfis: ["admin_geral", "sindico", "porteiro"] },
    { id: "pets", label: "🐾 Animais", perfis: ["admin_geral", "sindico", "morador"] },
    { id: "achados", label: "🔍 Achados e Perdidos", perfis: ["admin_geral", "sindico", "morador", "porteiro"] },
    { id: "telefones", label: "📞 Telefones Úteis", perfis: ["admin_geral", "sindico", "morador", "porteiro"] },
    { id: "qrcode", label: "📲 QR Code", perfis: ["admin_geral", "sindico"] },
  ];

  const renderPagina = () => {
    switch (pagina) {
      case "dashboard": return <Dashboard perfil={perfil} />;
      case "avisos": return <Avisos perfil={perfil} />;
      case "ocorrencias": return <Ocorrencias perfil={perfil} />;
      case "reservas": return <Reservas perfil={perfil} />;
      case "visitantes": return <Visitantes perfil={perfil} />;
      case "agenda": return <AgendaVisitas perfil={perfil} user={user} />;
      case "documentos": return <Documentos perfil={perfil} />;
      case "financeiro": return <Financeiro perfil={perfil} />;
      case "enquetes": return <Enquetes perfil={perfil} />;
      case "moradores": return <Moradores perfil={perfil} />;
      case "veiculos": return <Veiculos perfil={perfil} />;
      case "pets": return <Pets perfil={perfil} />;
      case "achados": return <AchadosPerdidos perfil={perfil} />;
      case "telefones": return <TelefonesUteis perfil={perfil} />;
      default: return <Dashboard perfil={perfil} />;
    }
  };

  return (
    <Routes>
      <Route path="/v/:id" element={<VisitaPublica />} />
      <Route path="*" element={
        !user ? (
          <div style={styles.container}>
            <div style={styles.card}>
              <h1 style={styles.titulo}>CondoFácil</h1>
              <p style={styles.subtitulo}>Acesse sua conta</p>
              <input style={styles.input} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
              <div style={{ position: "relative", marginBottom: "12px" }}>
                <input style={{ ...styles.input, marginBottom: 0 }} type={mostrarSenha ? "text" : "password"} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
                <span onClick={() => setMostrarSenha(!mostrarSenha)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#64748b", fontSize: "1.1rem" }}>
                  {mostrarSenha ? "🙈" : "👁️"}
                </span>
              </div>
              {erro && <p style={styles.erro}>{erro}</p>}
              {!esqueceuSenha ? (
                <>
                  <button style={styles.botao} onClick={login}>Entrar</button>
                  <p onClick={() => { setEsqueceuSenha(true); setErro(""); }} style={{ color: "#38bdf8", fontSize: "0.85rem", cursor: "pointer", marginTop: "12px" }}>Esqueci minha senha</p>
                </>
              ) : (
                <>
                  <input style={styles.input} type="email" placeholder="Digite seu e-mail" value={emailRecuperacao} onChange={(e) => setEmailRecuperacao(e.target.value)} />
                  {mensagemRecuperacao && <p style={{ color: "#22c55e", fontSize: "0.85rem", marginBottom: "8px" }}>{mensagemRecuperacao}</p>}
                  <button style={styles.botao} onClick={recuperarSenha}>Enviar e-mail de recuperação</button>
                  <p onClick={() => { setEsqueceuSenha(false); setMensagemRecuperacao(""); }} style={{ color: "#94a3b8", fontSize: "0.85rem", cursor: "pointer", marginTop: "12px" }}>Voltar ao login</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a", fontFamily: "sans-serif" }}>

            {isMobile && (
              <button onClick={() => setMenuAberto(!menuAberto)} style={{ position: "fixed", top: "12px", left: "12px", zIndex: 1001, background: "#1e293b", border: "none", color: "#38bdf8", fontSize: "24px", width: "44px", height: "44px", borderRadius: "8px", cursor: "pointer" }}>
                ☰
              </button>
            )}

            {isMobile && (
              <button onClick={ativarNotificacoes} style={{ position: "fixed", top: "12px", right: "12px", zIndex: 1001, background: "#22c55e", border: "none", color: "#fff", fontSize: "20px", width: "44px", height: "44px", borderRadius: "8px", cursor: "pointer" }}>
                🔔
              </button>
            )}

            {isMobile && menuAberto && (
              <div onClick={() => setMenuAberto(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999 }} />
            )}

            <div style={{ width: "240px", minWidth: "240px", background: "#1e293b", padding: "24px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "100vh", overflowY: "auto", position: isMobile ? "fixed" : "relative", top: 0, left: 0, zIndex: 1000, transform: isMobile ? (menuAberto ? "translateX(0)" : "translateX(-100%)") : "translateX(0)", transition: "transform 0.3s ease" }}>
              <div>
                <h2 style={{ color: "#38bdf8", marginBottom: "8px", fontSize: "1.3rem" }}>CondoFácil</h2>
                {condominio && <p style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: "24px" }}>{condominio.nome}</p>}
                <nav>
                  {menuItems.filter(item => item.perfis.includes(perfil)).map(item => (
                    <div key={item.id} onClick={() => { setPagina(item.id); if (isMobile) setMenuAberto(false); }} style={{ padding: "10px 12px", borderRadius: "8px", cursor: "pointer", marginBottom: "4px", background: pagina === item.id ? "#0f172a" : "transparent", color: pagina === item.id ? "#38bdf8" : "#cbd5e1", fontWeight: pagina === item.id ? "bold" : "normal", fontSize: "0.9rem" }}>
                      {item.label}
                    </div>
                  ))}
                </nav>
              </div>
              <div>
                <p style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: "8px" }}>{user.email}</p>
                <button onClick={logout} style={{ width: "100%", padding: "10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>Sair</button>
              </div>
            </div>

            <div style={{ flex: 1, padding: isMobile ? "64px 16px 24px" : "24px", overflowY: "auto" }}>
              {renderPagina()}
            </div>
          </div>
        )
      } />
    </Routes>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0f172a" },
  card: { background: "#1e293b", padding: "40px", borderRadius: "16px", width: "100%", maxWidth: "400px", textAlign: "center" },
  titulo: { color: "#38bdf8", marginBottom: "8px" },
  subtitulo: { color: "#94a3b8", marginBottom: "24px", fontSize: "0.9rem" },
  input: { width: "100%", padding: "12px", marginBottom: "12px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: "1rem", boxSizing: "border-box" },
  botao: { width: "100%", padding: "12px", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer" },
  erro: { color: "#f87171", marginBottom: "12px", fontSize: "0.85rem" },
};