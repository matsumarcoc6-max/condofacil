import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, orderBy, query, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function Moradores({ perfil: perfilLogado }) {
  const [moradores, setMoradores] = useState([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [bloco, setBloco] = useState("");
  const [perfil, setPerfil] = useState("morador");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState("todos");
  const [filtroBloco, setFiltroBloco] = useState("todos");

  useEffect(() => { carregarMoradores(); }, []);

  async function carregarMoradores() {
    const q = query(collection(db, "usuarios"), orderBy("criado_em", "desc"));
    const snap = await getDocs(q);
    setMoradores(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function cadastrarMorador() {
    if (!nome || !email || !senha) {
      setErro("Nome, e-mail e senha são obrigatorios.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setErro("");
    setSucesso("");
    setSalvando(true);

    try {
      const resultado = await createUserWithEmailAndPassword(auth, email, senha);
      const uid = resultado.user.uid;

      await setDoc(doc(db, "usuarios", uid), {
        uid,
        nome,
        email,
        apartamento,
        bloco,
        perfil,
        ativo: true,
        criado_em: serverTimestamp(),
      });

      setNome(""); setEmail(""); setSenha(""); setApartamento(""); setBloco(""); setPerfil("morador");
      setSucesso("Usuario cadastrado com sucesso!");
      carregarMoradores();
    } catch (e) {
      if (e.code === "auth/email-already-in-use") {
        setErro("Este e-mail ja esta cadastrado.");
      } else {
        setErro("Erro ao cadastrar: " + e.message);
      }
    }
    setSalvando(false);
  }

  const blocos = [...new Set(moradores.filter((m) => m.bloco).map((m) => m.bloco))].sort();

  const moradoresFiltrados = moradores.filter((m) => {
    const matchBusca = busca === "" ||
      m.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      m.apartamento?.toLowerCase().includes(busca.toLowerCase()) ||
      m.email?.toLowerCase().includes(busca.toLowerCase());
    const matchPerfil = filtroPerfil === "todos" || m.perfil === filtroPerfil;
    const matchBloco = filtroBloco === "todos" || m.bloco === filtroBloco;
    return matchBusca && matchPerfil && matchBloco;
  });

  const corPerfil = {
    morador: "#38bdf8",
    porteiro: "#f59e0b",
    sindico: "#a78bfa",
    admin_geral: "#22c55e",
  };

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ color: "#38bdf8", marginBottom: "20px" }}>Moradores e Usuarios</h2>

      <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
        <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>Cadastrar usuario</h3>
        <input style={inp} placeholder="Nome completo *" value={nome} onChange={(e) => setNome(e.target.value)} />
        <div style={{ display: "flex", gap: "8px" }}>
          <input style={{ ...inp, flex: 1 }} placeholder="Bloco (ex: A, B)" value={bloco} onChange={(e) => setBloco(e.target.value)} />
          <input style={{ ...inp, flex: 1 }} placeholder="Apartamento (ex: 302)" value={apartamento} onChange={(e) => setApartamento(e.target.value)} />
        </div>
        <input style={inp} type="email" placeholder="E-mail *" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div style={{ position: "relative", marginBottom: "10px" }}>
          <input
            style={{ ...inp, marginBottom: 0 }}
            type={mostrarSenha ? "text" : "password"}
            placeholder="Senha (minimo 6 caracteres) *"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <span onClick={() => setMostrarSenha(!mostrarSenha)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#64748b", fontSize: "1.1rem" }}>
            {mostrarSenha ? "🙈" : "👁️"}
          </span>
        </div>
        <select style={inp} value={perfil} onChange={(e) => setPerfil(e.target.value)}>
          <option value="morador">Morador</option>
          <option value="porteiro">Porteiro</option>
          {perfilLogado === "admin_geral" && <option value="sindico">Sindico</option>}
        </select>
        {erro && <p style={{ color: "#ef4444", fontSize: "0.9rem", marginBottom: "8px" }}>{erro}</p>}
        {sucesso && <p style={{ color: "#22c55e", fontSize: "0.9rem", marginBottom: "8px" }}>{sucesso}</p>}
        <button style={btn} onClick={cadastrarMorador} disabled={salvando}>
          {salvando ? "Cadastrando..." : "Cadastrar usuario"}
        </button>
      </div>

      <div style={{ background: "#1e293b", padding: "16px 20px", borderRadius: "12px", marginBottom: "16px" }}>
        <input style={{ ...inp, marginBottom: "12px" }} placeholder="Buscar por nome, apartamento ou e-mail..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <div>
            <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "6px" }}>Perfil</p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {["todos", "morador", "sindico", "porteiro", "admin_geral"].map((p) => (
                <button key={p} onClick={() => setFiltroPerfil(p)} style={{ padding: "4px 12px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold", background: filtroPerfil === p ? "#38bdf8" : "#0f172a", color: filtroPerfil === p ? "#0f172a" : "#94a3b8" }}>
                  {p === "todos" ? "Todos" : p}
                </button>
              ))}
            </div>
          </div>
          {blocos.length > 0 && (
            <div style={{ marginTop: "8px" }}>
              <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "6px" }}>Bloco</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {["todos", ...blocos].map((b) => (
                  <button key={b} onClick={() => setFiltroBloco(b)} style={{ padding: "4px 12px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold", background: filtroBloco === b ? "#38bdf8" : "#0f172a", color: filtroBloco === b ? "#0f172a" : "#94a3b8" }}>
                    {b === "todos" ? "Todos" : `Bloco ${b}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>Usuarios cadastrados ({moradoresFiltrados.length})</h3>

      {moradoresFiltrados.length === 0 && <p style={{ color: "#64748b", textAlign: "center" }}>Nenhum usuario encontrado.</p>}

      {moradoresFiltrados.map((m) => (
        <div key={m.id} style={{ background: "#1e293b", padding: "16px 20px", borderRadius: "12px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "4px solid " + (corPerfil[m.perfil] || "#94a3b8") }}>
          <div>
            <p style={{ color: "#f1f5f9", margin: 0, fontWeight: "500" }}>{m.nome}</p>
            <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "0.85rem" }}>
              {m.bloco ? `Bloco ${m.bloco} — ` : ""}{m.apartamento ? `Apto ${m.apartamento} — ` : ""}{m.email}
            </p>
          </div>
          <span style={{ background: (corPerfil[m.perfil] || "#94a3b8") + "22", color: corPerfil[m.perfil] || "#94a3b8", padding: "4px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>
            {m.perfil}
          </span>
        </div>
      ))}
    </div>
  );
}

const inp = { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: "1rem", boxSizing: "border-box" };
const btn = { padding: "10px 24px", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem", marginTop: "8px" };