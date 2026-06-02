// AgendaVisitas.jsx — Agendamento pelo morador + link QR via WhatsApp
// Depende da coleção "visitas" no Firestore (compartilhada com Visitantes)
// Instalar: npm install qrcode.react

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
  where,
} from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";

// Props esperadas: perfil (string), user (objeto Firebase Auth)
export default function AgendaVisitas({ perfil, user }) {
  const [visitas, setVisitas] = useState([]);
  const [nomeVisitante, setNomeVisitante] = useState("");
  const [rg, setRg] = useState("");
  const [acompanhantes, setAcompanhantes] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [motivo, setMotivo] = useState("");
  const [placa, setPlaca] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [visitaCriada, setVisitaCriada] = useState(null);
  const [filtro, setFiltro] = useState("proximas");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    carregarVisitas();
  }, []);

  async function carregarVisitas() {
    let q;
    if (perfil === "morador" && user) {
      q = query(
        collection(db, "visitas"),
        where("criadoPor", "==", user.uid),
        orderBy("dataHoraAgendada", "desc")
      );
    } else {
      q = query(
        collection(db, "visitas"),
        where("dataHoraAgendada", "!=", null),
        orderBy("dataHoraAgendada", "desc")
      );
    }
    const snap = await getDocs(q);
    setVisitas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function agendarVisita() {
    if (!nomeVisitante || !apartamento || !data) return;
    setSalvando(true);

    const uuid = crypto.randomUUID();
    const dataHoraAgendada = new Date(`${data}T${horario || "00:00"}`);
    const link = `https://condofacil-lemon.vercel.app/v/${uuid}`;

    async function agendarVisita() {
  if (!nomeVisitante || !apartamento || !data) return;
  setSalvando(true);

  const uuid = crypto.randomUUID();
  const dataHoraAgendada = new Date(`${data}T${horario || "00:00"}`);

  const docRef = await addDoc(collection(db, "visitas"), {
    uuid,
    nome: nomeVisitante,
    rg: rg || null,
    acompanhantes: acompanhantes || null,
    apartamento,
    motivo: motivo || null,
    placa: placa || null,
    dataHoraAgendada,
    dataHoraEntrada: null,
    dataHoraSaida: null,
    status: "agendado",
    origem: "agendamento",
    criadoPor: user?.uid || null,
    criado_em: serverTimestamp(),
  });

  const link = `https://condofacil-lemon.vercel.app/v/${docRef.id}`;
  setVisitaCriada({ uuid, link, nome: nomeVisitante, apartamento });
  setNomeVisitante(""); setRg(""); setAcompanhantes(""); setApartamento("");
  setMotivo(""); setPlaca(""); setData(""); setHorario("");
  setSalvando(false);
  setMostrarFormulario(false);
  carregarVisitas();
}

    setVisitaCriada({ uuid, link, nome: nomeVisitante, apartamento });
    setNomeVisitante(""); setRg(""); setAcompanhantes(""); setApartamento("");
    setMotivo(""); setPlaca(""); setData(""); setHorario("");
    setSalvando(false);
    setMostrarFormulario(false);
    carregarVisitas();
  }

  async function cancelarVisita(id) {
    await updateDoc(doc(db, "visitas", id), { status: "cancelado" });
    carregarVisitas();
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const visitasFiltradas = visitas.filter((v) => {
    const dataVisita = v.dataHoraAgendada?.toDate
      ? v.dataHoraAgendada.toDate()
      : v.dataHoraAgendada
      ? new Date(v.dataHoraAgendada)
      : null;

    if (filtro === "proximas") {
      return dataVisita && dataVisita >= hoje && v.status === "agendado";
    }
    if (filtro === "historico") {
      return v.status === "finalizado" || v.status === "cancelado" || v.status === "expirado" ||
        (dataVisita && dataVisita < hoje);
    }
    return true;
  });

  function formatarDataHora(campo) {
    if (!campo) return "—";
    const d = campo.toDate ? campo.toDate() : new Date(campo);
    return d.toLocaleDateString("pt-BR") + " às " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  const corStatus = {
    agendado: "#f59e0b",
    dentro: "#22c55e",
    finalizado: "#475569",
    cancelado: "#ef4444",
    expirado: "#64748b",
  };

  const labelStatus = {
    agendado: "Agendado",
    dentro: "Dentro",
    finalizado: "Realizada",
    cancelado: "Cancelada",
    expirado: "Expirada",
  };

  function enviarWhatsApp(link, nome, apartamento, dataHora) {
    const texto = encodeURIComponent(
      `Olá! Sua visita ao apartamento ${apartamento} foi agendada.\n` +
      `${dataHora ? `Data/hora: ${dataHora}\n` : ""}` +
      `Mostre este QR code na portaria: ${link}`
    );
    window.open(`https://wa.me/?text=${texto}`, "_blank");
  }

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <h2 style={{ color: "#38bdf8", margin: 0 }}>Agenda de Visitas</h2>
        {(perfil === "morador" || perfil === "sindico" || perfil === "admin_geral") && (
          <button style={btnAzul} onClick={() => { setMostrarFormulario(!mostrarFormulario); setVisitaCriada(null); }}>
            + Nova visita
          </button>
        )}
      </div>

      {mostrarFormulario && (
        <div style={cardStyle}>
          <h3 style={{ color: "#f1f5f9", marginBottom: "16px" }}>Agendar visita</h3>
          <input style={inp} placeholder="Nome do visitante *" value={nomeVisitante} onChange={(e) => setNomeVisitante(e.target.value)} />
          <input style={inp} placeholder="RG (opcional)" value={rg} onChange={(e) => setRg(e.target.value)} />
          <input style={inp} placeholder="Acompanhantes (opcional)" value={acompanhantes} onChange={(e) => setAcompanhantes(e.target.value)} />
          <input style={inp} placeholder="Apartamento destino *" value={apartamento} onChange={(e) => setApartamento(e.target.value)} />
          <input style={inp} placeholder="Motivo (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <input style={inp} placeholder="Placa do veículo (opcional)" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} />
          <div style={{ display: "flex", gap: "12px" }}>
            <input style={{ ...inp, flex: 1 }} type="date" value={data} onChange={(e) => setData(e.target.value)} />
            <input style={{ ...inp, flex: 1 }} type="time" value={horario} onChange={(e) => setHorario(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button style={btnAzul} onClick={agendarVisita} disabled={salvando}>
              {salvando ? "Agendando..." : "Salvar e gerar QR"}
            </button>
            <button style={btnSecundario} onClick={() => setMostrarFormulario(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {visitaCriada && (
        <div style={{ ...cardStyle, borderLeft: "4px solid #22c55e", textAlign: "center" }}>
          <h3 style={{ color: "#22c55e", marginBottom: "8px" }}>✅ Visita agendada!</h3>
          <p style={{ color: "#94a3b8", marginBottom: "16px", fontSize: "0.9rem" }}>
            Envie o QR code abaixo para <strong style={{ color: "#f1f5f9" }}>{visitaCriada.nome}</strong>
          </p>
          <div style={{ display: "inline-block", background: "#fff", padding: "16px", borderRadius: "12px", marginBottom: "16px" }}>
            <QRCodeSVG value={visitaCriada.link} size={200} />
          </div>
          <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "16px", wordBreak: "break-all" }}>
            {visitaCriada.link}
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <button style={btnVerde} onClick={() => enviarWhatsApp(visitaCriada.link, visitaCriada.nome, visitaCriada.apartamento, null)}>
              📲 Enviar via WhatsApp
            </button>
            <button style={btnSecundario} onClick={() => { navigator.clipboard.writeText(visitaCriada.link); }}>
              📋 Copiar link
            </button>
            <button style={btnSecundario} onClick={() => setVisitaCriada(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["proximas", "historico", "todas"].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: "6px 16px", borderRadius: "8px", border: "none", cursor: "pointer",
              fontWeight: "bold", fontSize: "0.85rem",
              background: filtro === f ? "#38bdf8" : "#1e293b",
              color: filtro === f ? "#0f172a" : "#94a3b8",
            }}
          >
            {f === "proximas" ? "Próximas" : f === "historico" ? "Histórico" : "Todas"}
          </button>
        ))}
      </div>

      <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "12px" }}>
        {visitasFiltradas.length} visita{visitasFiltradas.length !== 1 ? "s" : ""}
      </p>

      {visitasFiltradas.length === 0 && (
        <p style={{ color: "#64748b", textAlign: "center", marginTop: "32px" }}>Nenhuma visita encontrada.</p>
      )}

      {visitasFiltradas.map((v) => {
        const link = v.uuid ? `https://condofacil-lemon.vercel.app/v/${v.uuid}` : null;
        return (
          <div key={v.id} style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "12px", borderLeft: `4px solid ${corStatus[v.status] || "#38bdf8"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div>
                <h4 style={{ color: "#f1f5f9", margin: "0 0 4px" }}>{v.nome}</h4>
                <p style={infoStyle}>Apto {v.apartamento}{v.motivo ? ` — ${v.motivo}` : ""}</p>
                {v.dataHoraAgendada && <p style={infoStyle}>📅 {formatarDataHora(v.dataHoraAgendada)}</p>}
                {v.placa && <p style={infoStyle}>🚗 {v.placa}</p>}
                {v.dataHoraEntrada && <p style={infoStyle}>⬇️ Entrada: {formatarDataHora(v.dataHoraEntrada)}</p>}
                {v.dataHoraSaida && <p style={infoStyle}>⬆️ Saída: {formatarDataHora(v.dataHoraSaida)}</p>}
              </div>
              <span style={{ background: (corStatus[v.status] || "#38bdf8") + "22", color: corStatus[v.status] || "#38bdf8", padding: "4px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold", whiteSpace: "nowrap" }}>
                {labelStatus[v.status] || v.status}
              </span>
            </div>
            {v.status === "agendado" && link && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                <button style={btnPequeno} onClick={() => enviarWhatsApp(link, v.nome, v.apartamento, formatarDataHora(v.dataHoraAgendada))}>
                  📲 Enviar link
                </button>
                <button style={{ ...btnPequeno, color: "#ef4444", borderColor: "#ef4444" }} onClick={() => cancelarVisita(v.id)}>
                  Cancelar
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const cardStyle = { background: "#1e293b", padding: "24px", borderRadius: "12px", marginBottom: "20px" };
const infoStyle = { color: "#94a3b8", margin: "0 0 4px", fontSize: "0.9rem" };
const inp = { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: "1rem", boxSizing: "border-box" };
const btnAzul = { padding: "10px 20px", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" };
const btnVerde = { padding: "10px 20px", background: "#22c55e", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" };
const btnSecundario = { padding: "10px 20px", background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.95rem" };
const btnPequeno = { padding: "4px 12px", background: "transparent", color: "#38bdf8", border: "1px solid #38bdf8", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };