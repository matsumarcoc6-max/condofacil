import { useState, useEffect } from "react";
import { db, storage } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function Ocorrencias() {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("media");
  const [foto, setFoto] = useState(null);
  const [progresso, setProgresso] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => { carregarOcorrencias(); }, []);

  async function carregarOcorrencias() {
    const q = query(collection(db, "ocorrencias"), orderBy("criado_em", "desc"));
    const snap = await getDocs(q);
    setOcorrencias(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  }

  async function registrarOcorrencia() {
    if (!titulo || !descricao) { setErro("Titulo e descricao sao obrigatorios."); return; }
    setErro("");
    setSalvando(true);

    let fotoUrl = null;

    if (foto) {
      const storageRef = ref(storage, "ocorrencias/" + Date.now() + "_" + foto.name);
      const uploadTask = uploadBytesResumable(storageRef, foto);
      fotoUrl = await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            setProgresso(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
          },
          reject,
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });
    }

    await addDoc(collection(db, "ocorrencias"), {
      titulo,
      descricao,
      prioridade,
      fotoUrl,
      status: "aberta",
      criado_em: serverTimestamp(),
    });

    setTitulo(""); setDescricao(""); setPrioridade("media"); setFoto(null); setProgresso(0);
    setSalvando(false);
    carregarOcorrencias();
  }

  async function resolverOcorrencia(id) {
    await updateDoc(doc(db, "ocorrencias", id), { status: "resolvida" });
    carregarOcorrencias();
  }

  const corPrioridade = { alta: "#ef4444", media: "#f59e0b", baixa: "#22c55e" };
  const labelPrioridade = { alta: "Alta", media: "Média", baixa: "Baixa" };

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ color: "#38bdf8", marginBottom: "20px" }}>Ocorrências</h2>

      <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px" }}>
        <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>Registrar ocorrência</h3>

        <input style={inp} placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <textarea style={{ ...inp, resize: "vertical" }} placeholder="Descrição detalhada" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} />

        <select style={inp} value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
          <option value="baixa">🟢 Prioridade Baixa</option>
          <option value="media">🟡 Prioridade Média</option>
          <option value="alta">🔴 Prioridade Alta</option>
        </select>

        <div style={{ marginBottom: "10px" }}>
          <label style={{ color: "#94a3b8", fontSize: "0.9rem", display: "block", marginBottom: "6px" }}>
            Foto da ocorrência (opcional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFoto(e.target.files[0])}
            style={{ color: "#f1f5f9" }}
          />
          {foto && <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "4px" }}>📷 {foto.name}</p>}
        </div>

        {salvando && foto && (
          <div style={{ marginBottom: "10px" }}>
            <div style={{ background: "#0f172a", borderRadius: "8px", overflow: "hidden", height: "8px" }}>
              <div style={{ width: progresso + "%", background: "#38bdf8", height: "100%", transition: "width 0.3s" }} />
            </div>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "4px" }}>{progresso}% enviado</p>
          </div>
        )}

        {erro && <p style={{ color: "#ef4444", fontSize: "0.9rem", marginBottom: "8px" }}>{erro}</p>}

        <button style={btn} onClick={registrarOcorrencia} disabled={salvando}>
          {salvando ? "Registrando..." : "Registrar ocorrência"}
        </button>
      </div>

      <div style={{ marginTop: "24px" }}>
        {ocorrencias.length === 0 && <p style={{ color: "#64748b", textAlign: "center" }}>Nenhuma ocorrência registrada ainda.</p>}
        {ocorrencias.map((oc) => (
          <div key={oc.id} style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "12px", borderLeft: "4px solid " + (corPrioridade[oc.prioridade] || "#38bdf8") }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <h4 style={{ color: "#f1f5f9", margin: 0 }}>{oc.titulo}</h4>
              <span style={{ background: (corPrioridade[oc.prioridade] || "#38bdf8") + "22", color: corPrioridade[oc.prioridade] || "#38bdf8", padding: "4px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>
                {labelPrioridade[oc.prioridade] || oc.prioridade}
              </span>
            </div>

            <p style={{ color: "#94a3b8", marginBottom: "8px" }}>{oc.descricao}</p>

            {oc.fotoUrl && (
              <div style={{ marginBottom: "12px" }}>
                <img
                  src={oc.fotoUrl}
                  alt="Foto da ocorrência"
                  style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px", objectFit: "cover", cursor: "pointer" }}
                  onClick={() => window.open(oc.fotoUrl, "_blank")}
                />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: oc.status === "resolvida" ? "#22c55e" : "#f59e0b", fontSize: "0.85rem" }}>
                ● {oc.status}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: "#475569", fontSize: "0.85rem" }}>
                  {oc.criado_em?.toDate().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
                {oc.status === "aberta" && (
                  <button onClick={() => resolverOcorrencia(oc.id)} style={{ padding: "4px 12px", background: "#22c55e", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>
                    Resolver
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inp = { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: "1rem", boxSizing: "border-box" };
const btn = { padding: "10px 24px", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem", marginTop: "8px" };