import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp, doc, updateDoc } from "firebase/firestore";

export default function Reservas() {
  const [reservas, setReservas] = useState([]);
  const [area, setArea] = useState("salao_festas");
  const [unidade, setUnidade] = useState("1");
  const [apartamento, setApartamento] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [data, setData] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [horarioFim, setHorarioFim] = useState("");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const areasConfig = {
    salao_festas: { nome: "Salão de Festas", unidades: 1 },
    churrasqueira: { nome: "Churrasqueira", unidades: 3 },
    quadra: { nome: "Quadra Esportiva", unidades: 1 },
    espaco_gourmet: { nome: "Espaço Gourmet", unidades: 1 },
    academia: { nome: "Academia", unidades: 1 },
    piscina: { nome: "Piscina", unidades: 1 },
  };

  useEffect(() => { carregarReservas(); }, []);

  async function carregarReservas() {
    const q = query(collection(db, "reservas"), orderBy("criado_em", "desc"));
    const snap = await getDocs(q);
    setReservas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  function getNomeArea() {
    const config = areasConfig[area];
    if (!config) return area;
    if (area === "churrasqueira") return `Churrasqueira ${unidade.padStart(2, "0")}`;
    return config.nome;
  }

  async function realizarReserva() {
    if (!apartamento || !responsavel || !data || !horarioInicio || !horarioFim) {
      setErro("Preencha todos os campos obrigatorios.");
      return;
    }
    const nomeArea = getNomeArea();
    const conflito = reservas.find(
      (r) => r.area === nomeArea && r.data === data && r.status !== "cancelada" &&
        !(horarioFim <= r.horarioInicio || horarioInicio >= r.horarioFim)
    );
    if (conflito) {
      setErro(`Conflito de horario com reserva existente (${conflito.horarioInicio} - ${conflito.horarioFim}).`);
      return;
    }
    setErro("");
    setSalvando(true);
    await addDoc(collection(db, "reservas"), {
      area: nomeArea,
      apartamento,
      responsavel,
      data,
      horarioInicio,
      horarioFim,
      observacao,
      status: "confirmada",
      criado_em: serverTimestamp(),
    });
    setApartamento(""); setResponsavel(""); setData("");
    setHorarioInicio(""); setHorarioFim(""); setObservacao("");
    setSalvando(false);
    carregarReservas();
  }

  async function cancelarReserva(id) {
    await updateDoc(doc(db, "reservas", id), { status: "cancelada" });
    carregarReservas();
  }

  const corStatus = { confirmada: "#22c55e", pendente: "#f59e0b", cancelada: "#ef4444" };

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ color: "#38bdf8", marginBottom: "20px" }}>Reservas</h2>

      <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
        <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>Nova reserva</h3>

        <select style={inp} value={area} onChange={(e) => { setArea(e.target.value); setUnidade("1"); }}>
          {Object.entries(areasConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.nome}</option>
          ))}
        </select>

        {area === "churrasqueira" && (
          <select style={inp} value={unidade} onChange={(e) => setUnidade(e.target.value)}>
            <option value="1">Churrasqueira 01</option>
            <option value="2">Churrasqueira 02</option>
            <option value="3">Churrasqueira 03</option>
          </select>
        )}

        <input style={inp} placeholder="Apartamento (ex: 302)" value={apartamento} onChange={(e) => setApartamento(e.target.value)} />
        <input style={inp} placeholder="Nome do responsavel" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
        <input style={inp} type="date" value={data} onChange={(e) => setData(e.target.value)} />

        <div style={{ display: "flex", gap: "8px" }}>
          <input style={{ ...inp, marginRight: "0" }} type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} />
          <input style={inp} type="time" value={horarioFim} onChange={(e) => setHorarioFim(e.target.value)} />
        </div>

        <input style={inp} placeholder="Observacao (opcional)" value={observacao} onChange={(e) => setObservacao(e.target.value)} />

        {erro && <p style={{ color: "#ef4444", fontSize: "0.9rem", marginBottom: "8px" }}>{erro}</p>}

        <button style={btn} onClick={realizarReserva} disabled={salvando}>
          {salvando ? "Reservando..." : "Confirmar reserva"}
        </button>
      </div>

      {reservas.length === 0 && <p style={{ color: "#64748b", textAlign: "center" }}>Nenhuma reserva registrada ainda.</p>}

      {reservas.map((r) => (
        <div key={r.id} style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "12px", borderLeft: "4px solid " + (corStatus[r.status] || "#38bdf8") }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <div>
              <h4 style={{ color: "#f1f5f9", margin: 0, marginBottom: "4px" }}>{r.area}</h4>
              <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.9rem" }}>Apto {r.apartamento} — {r.responsavel}</p>
            </div>
            <span style={{ background: (corStatus[r.status] || "#38bdf8") + "22", color: corStatus[r.status] || "#38bdf8", padding: "4px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold", textTransform: "capitalize" }}>
              {r.status}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <span style={{ color: "#475569", fontSize: "0.85rem" }}>
              {r.data} — {r.horarioInicio} às {r.horarioFim}
            </span>
            {r.observacao && <span style={{ color: "#64748b", fontSize: "0.85rem" }}>💬 {r.observacao}</span>}
            {r.status !== "cancelada" && (
              <button onClick={() => cancelarReserva(r.id)} style={{ padding: "4px 12px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const inp = { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: "1rem", boxSizing: "border-box" };
const btn = { padding: "10px 24px", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem", marginTop: "8px" };