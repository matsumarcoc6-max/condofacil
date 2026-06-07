import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, orderBy, query, serverTimestamp, setDoc, doc, where, deleteDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import * as XLSX from "xlsx";

export default function Moradores() {
  const [moradores, setMoradores] = useState([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [bloco, setBloco] = useState("");
  const [perfil, setPerfil] = useState("morador");
  const [salvando, setSalvando] = useState(false);
  const [aceiteLGPD, setAceiteLGPD] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState("todos");
  const [filtroBloco, setFiltroBloco] = useState("todos");
  const [importando, setImportando] = useState(false);
const [resultadoImport, setResultadoImport] = useState(null);
const [solicitacoes, setSolicitacoes] = useState([]);
const [executando, setExecutando] = useState("");

  useEffect(() => { carregarMoradores(); carregarSolicitacoes(); }, []);

  async function carregarMoradores() {
    const q = query(collection(db, "usuarios"), orderBy("criado_em", "desc"));
    const snap = await getDocs(q);
    setMoradores(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }
  async function carregarSolicitacoes() {
    const q = query(collection(db, "solicitacoes_exclusao"), where("status", "==", "pendente"), orderBy("criado_em", "desc"));
    const snap = await getDocs(q);
    setSolicitacoes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function executarExclusao(solicitacao) {
    if (!window.confirm(`Confirma a exclusão permanente dos dados de ${solicitacao.nome}?`)) return;
    setExecutando(solicitacao.id);
    try {
      await deleteDoc(doc(db, "usuarios", solicitacao.uid));
      await updateDoc(doc(db, "solicitacoes_exclusao", solicitacao.id), { status: "executado" });
      setSolicitacoes((prev) => prev.filter((s) => s.id !== solicitacao.id));
    } catch (e) {
      alert("Erro ao executar exclusão: " + e.message);
    }
    setExecutando("");
  }
  async function importarPlanilha(e) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    setImportando(true);
    setResultadoImport(null);

    try {
      const buffer = await arquivo.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const dados = XLSX.utils.sheet_to_json(ws);

      const moradores = dados.map((row) => ({
        nome: row["nome"] || row["Nome"] || "",
        email: row["email"] || row["Email"] || "",
        senha: String(row["senha"] || row["Senha"] || ""),
        apartamento: String(row["apartamento"] || row["Apartamento"] || ""),
        bloco: String(row["bloco"] || row["Bloco"] || ""),
        perfil: row["perfil"] || row["Perfil"] || "morador",
      }));

      const functions = getFunctions(undefined, "southamerica-east1");
      const cadastrar = httpsCallable(functions, "cadastrarMoradoresEmLote");
      const resultado = await cadastrar({ moradores });
      setResultadoImport(resultado.data);
      carregarMoradores();
    } catch (e) {
      setResultadoImport({ erro: e.message });
    }

    setImportando(false);
    e.target.value = "";
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
      setAceiteLGPD(false);
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

      {/* Importação em lote */}
<div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
  {/* Solicitações de exclusão */}
{solicitacoes.length > 0 && (
  <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", marginBottom: "24px", borderLeft: "4px solid #ef4444" }}>
    <h3 style={{ color: "#ef4444", marginBottom: "16px" }}>🗑️ Solicitações de exclusão de dados ({solicitacoes.length})</h3>
    {solicitacoes.map((s) => (
      <div key={s.id} style={{ background: "#0f172a", padding: "16px", borderRadius: "8px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <p style={{ color: "#f1f5f9", margin: 0, fontWeight: "500" }}>{s.nome}</p>
          <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "0.85rem" }}>
            {s.email} — {s.bloco ? `Bloco ${s.bloco} — ` : ""}{s.apartamento ? `Apto ${s.apartamento}` : ""}
          </p>
          <p style={{ color: "#475569", margin: "4px 0 0", fontSize: "0.8rem" }}>
            Solicitado em: {s.criado_em?.toDate().toLocaleDateString("pt-BR")}
          </p>
        </div>
        <button
          onClick={() => executarExclusao(s)}
          disabled={executando === s.id}
          style={{ padding: "6px 16px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold", opacity: executando === s.id ? 0.6 : 1 }}
        >
          {executando === s.id ? "Excluindo..." : "Executar exclusão"}
        </button>
      </div>
    ))}
  </div>
)}
  <h3 style={{ color: "#f1f5f9", marginBottom: "8px" }}>Importar moradores via planilha</h3>
  <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "12px" }}>
    Baixe o modelo, preencha e faça o upload. Campos: nome, email, senha, apartamento, bloco, perfil.
  </p>
  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
    <button
      style={{ ...btn, background: "transparent", color: "#38bdf8", border: "1px solid #38bdf8" }}
      onClick={() => {
        const modelo = [{ nome: "João Silva", email: "joao@email.com", senha: "123456", apartamento: "101", bloco: "A", perfil: "morador" }];
        const ws = XLSX.utils.json_to_sheet(modelo);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Moradores");
        XLSX.writeFile(wb, "modelo-moradores.xlsx");
      }}
    >
      ⬇️ Baixar modelo
    </button>
    <label style={{ ...btn, marginTop: "0", cursor: "pointer", opacity: importando ? 0.6 : 1 }}>
      {importando ? "Importando..." : "📂 Selecionar planilha"}
      <input type="file" accept=".xlsx,.xls,.csv" onChange={importarPlanilha} style={{ display: "none" }} disabled={importando} />
    </label>
  </div>
  {resultadoImport && !resultadoImport.erro && (
    <div>
      {resultadoImport.criados.length > 0 && (
        <p style={{ color: "#22c55e", fontSize: "0.9rem", margin: "0 0 4px" }}>
          ✅ {resultadoImport.criados.length} morador{resultadoImport.criados.length !== 1 ? "es" : ""} cadastrado{resultadoImport.criados.length !== 1 ? "s" : ""} com sucesso.
        </p>
      )}
      {resultadoImport.falhas.length > 0 && (
        <div>
          <p style={{ color: "#ef4444", fontSize: "0.9rem", margin: "0 0 4px" }}>
            ❌ {resultadoImport.falhas.length} falha{resultadoImport.falhas.length !== 1 ? "s" : ""}:
          </p>
          {resultadoImport.falhas.map((f, i) => (
            <p key={i} style={{ color: "#94a3b8", fontSize: "0.8rem", margin: "0 0 2px" }}>
              • {f.email}: {f.motivo}
            </p>
          ))}
        </div>
      )}
    </div>
  )}
  {resultadoImport?.erro && (
    <p style={{ color: "#ef4444", fontSize: "0.9rem", margin: 0 }}>❌ Erro: {resultadoImport.erro}</p>
  )}
</div>
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
          <option value="sindico">Sindico</option>
        </select>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px", padding: "12px", background: "#0f172a", borderRadius: "8px", border: "1px solid #334155" }}>
          <input
            type="checkbox"
            id="aceiteLGPD"
            checked={aceiteLGPD}
            onChange={(e) => setAceiteLGPD(e.target.checked)}
            style={{ width: "16px", height: "16px", marginTop: "2px", cursor: "pointer", flexShrink: 0 }}
          />
          <label htmlFor="aceiteLGPD" style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: "1.5", cursor: "pointer" }}>
            Li e aceito a{" "}
            <span
              onClick={() => window.open("/privacidade", "_blank")}
              style={{ color: "#38bdf8", textDecoration: "underline", cursor: "pointer" }}
            >
              Política de Privacidade
            </span>
            {" "}e autorizo o tratamento dos meus dados conforme a LGPD.
          </label>
        </div>

        {erro && <p style={{ color: "#ef4444", fontSize: "0.9rem", marginBottom: "8px" }}>{erro}</p>}
        {sucesso && <p style={{ color: "#22c55e", fontSize: "0.9rem", marginBottom: "8px" }}>{sucesso}</p>}
        <button style={btn} onClick={cadastrarMorador} disabled={salvando || !aceiteLGPD}>
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