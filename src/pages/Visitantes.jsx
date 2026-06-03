import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import jsQR from "jsqr";

export default function Visitantes() {
  const [visitantes, setVisitantes] = useState([]);
  const [aba, setAba] = useState("dentro");
  const [busca, setBusca] = useState("");
  const [escaneando, setEscaneando] = useState(false);
  const [dadosEscaneados, setDadosEscaneados] = useState(null);
  const [erroQR, setErroQR] = useState("");
  const [mostrarManual, setMostrarManual] = useState(false);
  const [nome, setNome] = useState("");
  const [rg, setRg] = useState("");
  const [acompanhantes, setAcompanhantes] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [motivo, setMotivo] = useState("");
  const [placa, setPlaca] = useState("");
  const [salvando, setSalvando] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);

  useEffect(() => {
    carregarVisitantes();
    return () => pararCamera();
  }, []);

  async function carregarVisitantes() {
    const q = query(collection(db, "visitas"), orderBy("dataHoraEntrada", "desc"));
    const snap = await getDocs(q);
    setVisitantes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function iniciarCamera() {
    setErroQR("");
    setEscaneando(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanLoopRef.current = requestAnimationFrame(escanearFrame);
      }
    } catch {
      setErroQR("Não foi possível acessar a câmera. Verifique as permissões.");
      setEscaneando(false);
    }
  }

  function escanearFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      scanLoopRef.current = requestAnimationFrame(escanearFrame);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);
    if (code) {
      pararCamera();
      processarQR(code.data);
    } else {
      scanLoopRef.current = requestAnimationFrame(escanearFrame);
    }
  }

  function pararCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    setEscaneando(false);
  }

  async function processarQR(conteudo) {
    const match = conteudo.match(/\/v\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      setErroQR("QR code inválido. Não é um código CondoFácil.");
      return;
    }
    const docId = match[1];
    const snap = await getDoc(doc(db, "visitas", docId));

    if (!snap.exists()) {
      setErroQR("Visita não encontrada no sistema.");
      return;
    }

    const visita = { id: snap.id, ...snap.data() };

    if (visita.status === "expirado" || visita.status === "cancelado") {
      setErroQR(`Visita ${visita.status}. Não pode ser utilizada.`);
      return;
    }
    if (visita.status === "dentro" || visita.status === "finalizado") {
      setErroQR("Este QR code já foi utilizado.");
      return;
    }
    if (visita.dataHoraAgendada) {
      const agendado = visita.dataHoraAgendada.toDate ? visita.dataHoraAgendada.toDate() : new Date(visita.dataHoraAgendada);
      const limiteEntrada = new Date(agendado.getTime() + 4 * 60 * 60 * 1000);
      if (new Date() > limiteEntrada) {
        await updateDoc(doc(db, "visitas", visita.id), { status: "expirado" });
        setErroQR("QR code expirado (mais de 4h após o horário agendado).");
        return;
      }
    }
    setDadosEscaneados(visita);
  }

  async function confirmarEntradaQR() {
    if (!dadosEscaneados) return;
    await updateDoc(doc(db, "visitas", dadosEscaneados.id), {
      status: "dentro",
      dataHoraEntrada: serverTimestamp(),
    });
    setDadosEscaneados(null);
    setErroQR("");
    carregarVisitantes();
  }

  async function registrarEntradaManual() {
    if (!nome || !apartamento) return;
    setSalvando(true);
    await addDoc(collection(db, "visitas"), {
      uuid: null,
      nome,
      rg: rg || null,
      acompanhantes: acompanhantes || null,
      apartamento,
      motivo: motivo || null,
      placa: placa || null,
      dataHoraAgendada: null,
      dataHoraEntrada: serverTimestamp(),
      dataHoraSaida: null,
      status: "dentro",
      origem: "manual",
    });
    setNome(""); setRg(""); setAcompanhantes(""); setApartamento(""); setMotivo(""); setPlaca("");
    setSalvando(false);
    setMostrarManual(false);
    carregarVisitantes();
  }

  async function registrarSaida(id) {
    await updateDoc(doc(db, "visitas", id), {
      dataHoraSaida: serverTimestamp(),
      status: "finalizado",
    });
    carregarVisitantes();
  }

  const dentro = visitantes.filter((v) =>
    v.status === "dentro" &&
    (busca === "" || v.nome?.toLowerCase().includes(busca.toLowerCase()) || v.apartamento?.includes(busca) || v.placa?.toLowerCase().includes(busca.toLowerCase()))
  );

  const historico = visitantes.filter((v) =>
    (v.status === "finalizado" || v.status === "expirado" || v.status === "cancelado") &&
    (busca === "" || v.nome?.toLowerCase().includes(busca.toLowerCase()) || v.apartamento?.includes(busca) || v.placa?.toLowerCase().includes(busca.toLowerCase()))
  );

  const lista = aba === "dentro" ? dentro : historico;

  function formatarHora(ts) {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function formatarData(ts) {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ color: "#38bdf8", marginBottom: "20px" }}>Portaria — Visitantes</h2>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button style={btnAzul} onClick={iniciarCamera} disabled={escaneando}>📷 Escanear QR</button>
        <button style={btnSecundario} onClick={() => { setMostrarManual(!mostrarManual); pararCamera(); }}>✏️ Entrada manual</button>
      </div>

      {escaneando && (
        <div style={cardStyle}>
          <p style={{ color: "#94a3b8", marginBottom: "12px" }}>Aponte a câmera para o QR code do visitante</p>
          <video ref={videoRef} style={{ width: "100%", borderRadius: "8px", maxHeight: "300px", objectFit: "cover" }} playsInline muted />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <button style={{ ...btnSecundario, marginTop: "12px" }} onClick={pararCamera}>Cancelar</button>
        </div>
      )}

      {erroQR && (
        <div style={{ ...cardStyle, borderLeft: "4px solid #ef4444", marginBottom: "16px" }}>
          <p style={{ color: "#ef4444", margin: 0 }}>⚠️ {erroQR}</p>
          <button style={{ ...btnSecundario, marginTop: "8px" }} onClick={() => setErroQR("")}>Fechar</button>
        </div>
      )}

      {dadosEscaneados && (
        <div style={{ ...cardStyle, borderLeft: "4px solid #22c55e", marginBottom: "20px" }}>
          <h3 style={{ color: "#22c55e", margin: "0 0 12px" }}>✅ Visitante encontrado</h3>
          <p style={info}><strong>Nome:</strong> {dadosEscaneados.nome}</p>
          <p style={info}><strong>Apartamento:</strong> {dadosEscaneados.apartamento}</p>
          {dadosEscaneados.rg && <p style={info}><strong>RG:</strong> {dadosEscaneados.rg}</p>}
          {dadosEscaneados.placa && <p style={info}><strong>Placa:</strong> {dadosEscaneados.placa}</p>}
          {dadosEscaneados.motivo && <p style={info}><strong>Motivo:</strong> {dadosEscaneados.motivo}</p>}
          {dadosEscaneados.dataHoraAgendada && <p style={info}><strong>Agendado para:</strong> {formatarData(dadosEscaneados.dataHoraAgendada)}</p>}
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button style={btnVerde} onClick={confirmarEntradaQR}>Registrar entrada</button>
            <button style={btnSecundario} onClick={() => setDadosEscaneados(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {mostrarManual && (
        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>Registrar entrada manual</h3>
          <input style={inp} placeholder="Nome do visitante *" value={nome} onChange={(e) => setNome(e.target.value)} />
          <input style={inp} placeholder="RG (opcional)" value={rg} onChange={(e) => setRg(e.target.value)} />
          <input style={inp} placeholder="Acompanhantes (opcional)" value={acompanhantes} onChange={(e) => setAcompanhantes(e.target.value)} />
          <input style={inp} placeholder="Apartamento destino *" value={apartamento} onChange={(e) => setApartamento(e.target.value)} />
          <input style={inp} placeholder="Motivo (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <input style={inp} placeholder="Placa do veículo (opcional)" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} />
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button style={btnAzul} onClick={registrarEntradaManual} disabled={salvando}>{salvando ? "Registrando..." : "Registrar entrada"}</button>
            <button style={btnSecundario} onClick={() => setMostrarManual(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <input style={{ ...inp, marginBottom: "16px" }} placeholder="🔍 Buscar por nome, apartamento ou placa" value={busca} onChange={(e) => setBusca(e.target.value)} />

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button style={{ ...btnAba, background: aba === "dentro" ? "#38bdf8" : "#1e293b", color: aba === "dentro" ? "#0f172a" : "#94a3b8" }} onClick={() => setAba("dentro")}>Dentro do condomínio ({dentro.length})</button>
        <button style={{ ...btnAba, background: aba === "historico" ? "#38bdf8" : "#1e293b", color: aba === "historico" ? "#0f172a" : "#94a3b8" }} onClick={() => setAba("historico")}>Histórico ({historico.length})</button>
      </div>

      {lista.length === 0 && (
        <p style={{ color: "#64748b", textAlign: "center", marginTop: "32px" }}>
          {aba === "dentro" ? "Nenhum visitante dentro do condomínio." : "Nenhum registro no histórico."}
        </p>
      )}

      {lista.map((v) => (
        <div key={v.id} style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "12px", borderLeft: `4px solid ${v.status === "dentro" ? "#22c55e" : "#475569"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <div>
              <h4 style={{ color: "#f1f5f9", margin: "0 0 4px" }}>{v.nome}</h4>
              {v.rg && <p style={info}>🪪 RG: {v.rg}</p>}
              {v.acompanhantes && <p style={info}>👥 {v.acompanhantes}</p>}
              <p style={info}>Apto {v.apartamento}{v.motivo ? ` — ${v.motivo}` : ""}</p>
              {v.placa && <p style={info}>🚗 {v.placa}</p>}
              {v.origem === "manual" && <p style={{ ...info, color: "#64748b" }}>Entrada manual</p>}
            </div>
            <span style={{ background: v.status === "dentro" ? "#22c55e22" : "#47556922", color: v.status === "dentro" ? "#22c55e" : "#94a3b8", padding: "4px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold", whiteSpace: "nowrap" }}>
              {v.status === "dentro" ? "● Dentro" : v.status === "finalizado" ? "● Saiu" : v.status}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", gap: "16px" }}>
              {v.dataHoraEntrada && <span style={{ color: "#475569", fontSize: "0.85rem" }}>Entrada: {formatarHora(v.dataHoraEntrada)}</span>}
              {v.dataHoraSaida && <span style={{ color: "#475569", fontSize: "0.85rem" }}>Saída: {formatarHora(v.dataHoraSaida)}</span>}
            </div>
            {v.status === "dentro" && <button onClick={() => registrarSaida(v.id)} style={btnSaida}>Registrar saída</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

const cardStyle = { background: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "16px" };
const info = { color: "#94a3b8", margin: "0 0 4px", fontSize: "0.9rem" };
const inp = { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: "1rem", boxSizing: "border-box" };
const btnAzul = { padding: "10px 20px", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" };
const btnVerde = { padding: "10px 20px", background: "#22c55e", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" };
const btnSecundario = { padding: "10px 20px", background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.95rem" };
const btnSaida = { padding: "6px 16px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem" };
const btnAba = { padding: "8px 16px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" };