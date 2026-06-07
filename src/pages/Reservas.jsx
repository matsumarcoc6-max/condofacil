import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection, addDoc, getDocs, orderBy, query,
  serverTimestamp, doc, updateDoc, where,
} from "firebase/firestore";

export default function Reservas({ perfil }) {
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
  const [ocupados, setOcupados] = useState([]);
  const [filtroPeriodo, setFiltroPeriodo] = useState("proximas");

  const areasConfig = {
    salao_festas: { nome: "Salão de Festas", unidades: 1 },
    churrasqueira: { nome: "Churrasqueira", unidades: 3 },
    quadra: { nome: "Quadra Esportiva", unidades: 1 },
    espaco_gourmet: { nome: "Espaço Gourmet", unidades: 1 },
    academia: { nome: "Academia", unidades: 1 },
    piscina: { nome: "Piscina", unidades: 1 },
  };

  useEffect(() => { carregarReservas(); }, []);

  // Atualiza horários ocupados quando muda área ou data
  useEffect(() => {
    if (data) buscarOcupados();
    else setOcupados([]);
  }, [area, unidade, data]);

  async function carregarReservas() {
    const q = query(collection(db, "reservas"), orderBy("criado_em", "desc"));
    const snap = await getDocs(q);
    setReservas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function buscarOcupados() {
    const nomeArea = getNomeArea();
    const q = query(
      collection(db, "reservas"),
      where("area", "==", nomeArea),
      where("data", "==", data),
      where("status", "!=", "cancelada")
    );
    const snap = await getDocs(q);
    setOcupados(snap.docs.map((d) => d.data()));
  }

  function getNomeArea() {
    const config = areasConfig[area];
    if (!config) return area;
    if (area === "churrasqueira") return `Churrasqueira ${unidade.padStart(2, "0")}`;
    return config.nome;
  }

  function temConflito(inicioNovo, fimNovo, reservasExistentes) {
    return reservasExistentes.some(
      (r) => !(fimNovo <= r.horarioInicio || inicioNovo >= r.horarioFim)
    );
  }

  async function realizarReserva() {
    if (!apartamento || !responsavel || !data || !horarioInicio || !horarioFim) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    if (horarioFim <= horarioInicio) {
      setErro("O horário de fim deve ser após o horário de início.");
      return;
    }

    // Busca conflitos diretamente no banco (dados sempre atualizados)
    const nomeArea = getNomeArea();
    const q = query(
      collection(db, "reservas"),
      where("area", "==", nomeArea),
      where("data", "==", data),
      where("status", "!=", "cancelada")
    );
    const snap = await getDocs(q);
    const reservasAtuais = snap.docs.map((d) => d.data());

    if (temConflito(horarioInicio, horarioFim, reservasAtuais)) {
      const conflito = reservasAtuais.find(
        (r) => !(horarioFim <= r.horarioInicio || horarioInicio >= r.horarioFim)
      );
      setErro(`Horário conflita com reserva existente: ${conflito.horarioInicio} às ${conflito.horarioFim} (Apto ${conflito.apartamento}).`);
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
    setOcupados([]);
    setSalvando(false);
    carregarReservas();
  }

  async function cancelarReserva(id) {
    if (!window.confirm("Confirma o cancelamento desta reserva?")) return;
    await updateDoc(doc(db, "reservas", id), { status: "cancelada" });
    carregarReservas();
  }

  const corStatus = { confirmada: "#22c55e", pendente: "#f59e0b", cancelada: "#ef4444" };

  const hoje = new Date().toISOString().split("T")[0];
  const reservasFiltradas = reservas.filter((r) => {
    if (filtroPeriodo === "proximas") return r.data >= hoje && r.status !== "cancelada";
    if (filtroPeriodo === "historico") return r.data < hoje || r.status === "cancelada";
    return true;
  });

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
        <input style={inp} placeholder="Nome do responsável" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
        <input style={inp} type="date" value={data} min={hoje} onChange={(e) => setData(e.target.value)} />

        {/* Horários ocupados */}
        {data && ocupados.length > 0 && (
          <div style={{ background: "#0f172a", borderRadius: "8px", padding: "12px", marginBottom: "10px", border: "1px solid #f59e0b" }}>
            <p style={{ color: "#f59e0b", fontSize: "0.85rem", margin: "0 0 6px", fontWeight: "bold" }}>
              ⚠️ Horários já reservados nesta data:
            </p>
            {ocupados.map((o, i) => (
              <p key={i} style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "2px 0" }}>
                • {o.horarioInicio} às {o.horarioFim} — Apto {o.apartamento}
              </p>
            ))}
          </div>
        )}

        {data && ocupados.length === 0 && (
          <div style={{ background: "#0f172a", borderRadius: "8px", padding: "10px", marginBottom: "10px", border: "1px solid #22c55e" }}>
            <p style={{ color: "#22c55e", fontSize: "0.85rem", margin: 0 }}>
              ✅ Nenhuma reserva nesta data — todos os horários disponíveis.
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: "8px" }}>
          <input style={{ ...inp, flex: 1 }} type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} />
          <input style={{ ...inp, flex: 1 }} type="time" value={horarioFim} onChange={(e) => setHorarioFim(e.target.value)} />
        </div>

        <input style={inp} placeholder="Observação (opcional)" value={observacao} onChange={(e) => setObservacao(e.target.value)} />

        {erro && <p style={{ color: "#ef4444", fontSize: "0.9rem", marginBottom: "8px" }}>{erro}</p>}

        <button style={btn} onClick={realizarReserva} disabled={salvando}>
          {salvando ? "Reservando..." : "Confirmar reserva"}
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {[
          { id: "proximas", label: "Próximas" },
          { id: "historico", label: "Histórico" },
          { id: "todas", label: "Todas" },
        ].map((f) => (
          <button key={f.id} onClick={() => setFiltroPeriodo(f.id)} style={{ padding: "6px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem", background: filtroPeriodo === f.id ? "#38bdf8" : "#1e293b", color: filtroPeriodo === f.id ? "#0f172a" : "#94a3b8" }}>
            {f.label}
          </button>
        ))}
      </div>

      <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "12px" }}>
        {reservasFiltradas.length} reserva{reservasFiltradas.length !== 1 ? "s" : ""}
      </p>

      {reservasFiltradas.length === 0 && (
        <p style={{ color: "#64748b", textAlign: "center" }}>Nenhuma reserva encontrada.</p>
      )}

      {reservasFiltradas.map((r) => (
        <div key={r.id} style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "12px", borderLeft: "4px solid " + (corStatus[r.status] || "#38bdf8") }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <div>
              <h4 style={{ color: "#f1f5f9", margin: 0, marginBottom: "4px" }}>{r.area}</h4>
              <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.9rem" }}>Apto {r.apartamento} — {r.responsavel}</p>
              <p style={{ color: "#475569", margin: "4px 0 0", fontSize: "0.85rem" }}>
                📅 {r.data} — {r.horarioInicio} às {r.horarioFim}
              </p>
              {r.observacao && <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "0.85rem" }}>💬 {r.observacao}</p>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
              <span style={{ background: (corStatus[r.status] || "#38bdf8") + "22", color: corStatus[r.status] || "#38bdf8", padding: "4px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold", textTransform: "capitalize" }}>
                {r.status}
              </span>
              {r.status !== "cancelada" && (
                <button onClick={() => cancelarReserva(r.id)} style={{ padding: "4px 12px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const inp = { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: "1rem", boxSizing: "border-box" };
const btn = { padding: "10px 24px", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem", marginTop: "8px" };