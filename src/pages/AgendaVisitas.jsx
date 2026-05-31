import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

export default function AgendaVisitas() {
  const [visitas, setVisitas] = useState([]);
  const [nomeVisitante, setNomeVisitante] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [filtro, setFiltro] = useState("hoje");

  useEffect(() => { carregarVisitas(); }, []);

  async function carregarVisitas() {
    const q = query(collection(db, "agenda_visitas"), orderBy("criado_em", "desc"));
    const snap = await getDocs(q);
    setVisitas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function agendarVisita() {
    if (!nomeVisitante || !apartamento || !data) return;
    setSalvando(true);
    await addDoc(collection(db, "agenda_visitas"), {
      nomeVisitante,
      apartamento,
      data,
      horario,
      motivo,
      status: "aguardando",
      criado_em: serverTimestamp(),
    });
    setNomeVisitante("");
    setApartamento("");
    setData("");
    setHorario("");
    setMotivo("");
    setSucesso("Visita agendada com sucesso!");
    setSalvando(false);
    carregarVisitas();
    setTimeout(() => setSucesso(""), 3000);
  }

  async function confirmarChegada(id) {
    await updateDoc(doc(db, "agenda_visitas", id), { status: "chegou" });
    carregarVisitas();
  }

  async function cancelarVisita(id) {
    await updateDoc(doc(db, "agenda_visitas", id), { status: "cancelada" });
    carregarVisitas();
  }

  async function excluirVisita(id) {
    await deleteDoc(doc(db, "agenda_visitas", id));
    carregarVisitas();
  }

  const hoje = new Date().toISOString().split("T")[0];

  const visitasFiltradas = visitas.filter((v) => {
    if (filtro === "hoje") return v.data === hoje;
    if (filtro === "aguardando") return v.status === "aguardando";
    return true;
  });

  const corStatus = {
    aguardando: "#f59e0b",
    chegou: "#22c55e",
    cancelada: "#ef4444",
  };

  const labelStatus = {
    aguardando: "Aguardando",
    chegou: "Chegou",
    cancelada: "Cancelada",
  };

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ color: "#38bdf8", marginBottom: "20px" }}>Agenda de Visitas</h2>

      <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
        <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>Agendar visita</h3>

        <input style={inp} placeholder="Nome do visitante *" value={nomeVisitante} onChange={(e) => setNomeVisitante(e.target.value)} />
        <input style={inp} placeholder="Apartamento destino *" value={apartamento} onChange={(e) => setApartamento(e.target.value)} />
        <input 
  type="date" 
  value={data} 
  onChange={(e) => setData(e.target.value)}
  style={{ ...inp, colorScheme: "dark" }}
/>

       <input 
  type="time" 
  value={horario} 
  onChange={(e) => setHorario(e.target.value)}
  style={{ ...inp, colorScheme: "dark" }}
/>
        <input style={inp} placeholder="Motivo da visita (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />

        {sucesso && <p style={{ color: "#22c55e", fontSize: "0.9rem", marginBottom: "8px" }}>{sucesso}</p>}

        <button style={btn} onClick={agendarVisita} disabled={salvando}>
          {salvando ? "Agendando..." : "Agendar visita"}
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {["hoje", "aguardando", "todas"].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{ padding: "6px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem", background: filtro === f ? "#38bdf8" : "#1e293b", color: filtro === f ? "#0f172a" : "#94a3b8" }}
          >
            {f === "h <inoje" ? "Hoje" : f === "aguardando" ? "Aguardando" : "Todas"}
          </button>
        ))}
      </div>

      <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>
        Visitas agendadas ({visitasFiltradas.length})
      </h3>

      {visitasFiltradas.length === 0 && (
        <p style={{ color: "#64748b", textAlign: "center" }}>Nenhuma visita encontrada.</p>
      )}

      {visitasFiltradas.map((v) => (
        <div key={v.id} style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "12px", borderLeft: `4px solid ${corStatus[v.status] || "#38bdf8"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <div>
              <h4 style={{ color: "#f1f5f9", margin: "0 0 4px" }}>{v.nomeVisitante}</h4>
              <p style={{ color: "#94a3b8", margin: "0 0 4px", fontSize: "0.9rem" }}>
                Apto {v.apartamento}{v.motivo ? ` — ${v.motivo}` : ""}
              </p>
              <p style={{ color: "#64748b", margin: 0, fontSize: "0.85rem" }}>
                📅 {v.data ? v.data.split("-").reverse().join("/") : ""}{v.horario ? ` às ${v.horario}` : ""}
              </p>
            </div>
            <span style={{ background: (corStatus[v.status] || "#38bdf8") + "22", color: corStatus[v.status] || "#38bdf8", padding: "4px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold", whiteSpace: "nowrap" }}>
              {labelStatus[v.status] || v.status}
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
            {v.status === "aguardando" && (
              <>
                <button onClick={() => confirmarChegada(v.id)} style={{ padding: "4px 12px", background: "#22c55e", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>
                  Confirmar chegada
                </button>
                <button onClick={() => cancelarVisita(v.id)} style={{ padding: "4px 12px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>
                  Cancelar
                </button>
              </>
            )}
            <button onClick={() => excluirVisita(v.id)} style={{ padding: "4px 12px", background: "transparent", color: "#475569", border: "1px solid #475569", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>
              Excluir
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const inp = { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: "1rem", boxSizing: "border-box" };
const btn = { padding: "10px 24px", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem", marginTop: "8px" };