import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection, addDoc, getDocs, updateDoc, doc, serverTimestamp
} from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";

export default function AgendaVisitas({ perfil, user }) {
  const [visitas, setVisitas] = useState([]);
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrSelecionado, setQrSelecionado] = useState(null);
  const [filtro, setFiltro] = useState("todas");

  const BASE_URL = window.location.origin;

  useEffect(() => { carregarVisitas(); }, []);

  async function carregarVisitas() {
    const snap = await getDocs(collection(db, "agendaVisitas"));
    const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    lista.sort((a, b) => (a.data > b.data ? 1 : -1));
    setVisitas(lista);
  }

  async function agendarVisita() {
    if (!nome || !data || !hora) return;
    setLoading(true);
    const uuid = crypto.randomUUID();
    await addDoc(collection(db, "agendaVisitas"), {
      nome, data, hora, observacao,
      status: "pendente",
      uuid,
      uid: user?.uid || "",
      criadoEm: serverTimestamp(),
    });
    setNome(""); setData(""); setHora(""); setObservacao("");
    await carregarVisitas();
    setLoading(false);
  }

  async function confirmarChegada(visita) {
    await updateDoc(doc(db, "agendaVisitas", visita.id), {
      status: "confirmado",
      confirmadoEm: serverTimestamp(),
    });
    await carregarVisitas();
  }

  async function cancelarVisita(visita) {
    await updateDoc(doc(db, "agendaVisitas", visita.id), { status: "cancelado" });
    await carregarVisitas();
  }

  const visitasFiltradas = visitas.filter(v =>
    filtro === "todas" ? true : v.status === filtro
  );

  const badgeColor = (s) => {
    if (s === "confirmado") return "#22c55e";
    if (s === "cancelado") return "#ef4444";
    return "#f59e0b";
  };

  const podeAgendar = ["admin_geral", "sindico", "morador"].includes(perfil);
  const podeConfirmar = ["admin_geral", "sindico", "porteiro"].includes(perfil);

  return (
    <div style={{ color: "#f1f5f9", maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ color: "#38bdf8", marginBottom: "4px" }}>📋 Agenda de Visitas</h2>
      <p style={{ color: "#94a3b8", marginBottom: "24px", fontSize: "0.9rem" }}>
        Gerencie visitas com QR code de entrada
      </p>

      {/* FORMULÁRIO */}
      {podeAgendar && (
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "24px" }}>
          <h3 style={{ color: "#e2e8f0", marginBottom: "16px", fontSize: "1rem" }}>Nova Visita</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <input style={inputStyle} placeholder="Nome do visitante" value={nome} onChange={e => setNome(e.target.value)} />
            <input style={inputStyle} type="date" value={data} onChange={e => setData(e.target.value)} />
            <input style={inputStyle} type="time" value={hora} onChange={e => setHora(e.target.value)} />
            <input style={inputStyle} placeholder="Observação (opcional)" value={observacao} onChange={e => setObservacao(e.target.value)} />
          </div>
          <button
            onClick={agendarVisita}
            disabled={loading || !nome || !data || !hora}
            style={{
              background: loading ? "#334155" : "#38bdf8",
              color: "#0f172a", border: "none", borderRadius: "8px",
              padding: "10px 20px", fontWeight: "bold", cursor: "pointer",
              opacity: (!nome || !data || !hora) ? 0.5 : 1,
            }}
          >
            {loading ? "Agendando..." : "Agendar Visita"}
          </button>
        </div>
      )}

      {/* FILTROS */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["todas", "pendente", "confirmado", "cancelado"].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: "6px 14px", borderRadius: "20px", border: "none",
            background: filtro === f ? "#38bdf8" : "#1e293b",
            color: filtro === f ? "#0f172a" : "#94a3b8",
            fontWeight: filtro === f ? "bold" : "normal",
            cursor: "pointer", fontSize: "0.85rem", textTransform: "capitalize",
          }}>
            {f === "todas" ? "Todas" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* LISTA */}
      {visitasFiltradas.length === 0 && (
        <p style={{ color: "#64748b", textAlign: "center", marginTop: "40px" }}>Nenhuma visita encontrada.</p>
      )}

      {visitasFiltradas.map(visita => (
        <div key={visita.id} style={{
          background: "#1e293b", borderRadius: "12px", padding: "16px",
          marginBottom: "12px", display: "flex", flexDirection: "column", gap: "8px",
        }}>
          {/* CABEÇALHO DO CARD */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <p style={{ fontWeight: "bold", fontSize: "1rem", margin: 0 }}>{visita.nome}</p>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "2px 0 0" }}>
                📅 {visita.data} às {visita.hora}
                {visita.observacao && ` — ${visita.observacao}`}
              </p>
            </div>
            <span style={{
              background: badgeColor(visita.status), color: "#0f172a",
              padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold",
            }}>
              {visita.status.toUpperCase()}
            </span>
          </div>

          {/* AÇÕES */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setQrSelecionado(qrSelecionado?.id === visita.id ? null : visita)}
              style={btnStyle("#334155", "#e2e8f0")}
            >
              🔲 QR Code
            </button>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Olá! Você foi agendado para visita no condomínio.\n\n👤 Nome: ${visita.nome}\n📅 Data: ${visita.data} às ${visita.hora}\n\n🔗 Seu link de entrada: ${BASE_URL}/v/${visita.uuid}`)}`}
              target="_blank" rel="noreferrer"
              style={{ ...btnStyle("#16a34a", "#fff"), textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            >
              📲 WhatsApp
            </a>

            {podeConfirmar && visita.status === "pendente" && (
              <button onClick={() => confirmarChegada(visita)} style={btnStyle("#22c55e", "#0f172a")}>
                ✅ Confirmar Chegada
              </button>
            )}

            {["admin_geral", "sindico"].includes(perfil) && visita.status === "pendente" && (
              <button onClick={() => cancelarVisita(visita)} style={btnStyle("#ef4444", "#fff")}>
                ✖ Cancelar
              </button>
            )}
          </div>

                    {/* QR EXPANDIDO */}
          {qrSelecionado?.id === visita.id && (
            <div style={{ marginTop: "12px", textAlign: "center", background: "#0f172a", borderRadius: "12px", padding: "20px" }}>
              {visita.uuid ? (
                <>
                  <QRCodeSVG
                    value={`${BASE_URL}/v/${visita.uuid}`}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                  />
                  <p style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "12px", wordBreak: "break-all" }}>
                    🔗 {BASE_URL}/v/{visita.uuid}
                  </p>
                </>
              ) : (
                 <p style={{ color: "#ef4444", fontSize: "0.85rem" }}>
                  ⚠️ Esta visita não possui UUID. Recrie-a para gerar o QR.
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: "8px",
  border: "1px solid #334155", background: "#0f172a",
  color: "#f1f5f9", fontSize: "0.95rem", boxSizing: "border-box",
};

const btnStyle = (bg, color) => ({
  background: bg, color, border: "none", borderRadius: "8px",
  padding: "8px 14px", fontSize: "0.85rem", fontWeight: "bold",
  cursor: "pointer",
});