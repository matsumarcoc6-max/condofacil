import { useState, useEffect } from "react";
import { db, storage } from "../firebase";
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function Documentos() {
  const [documentos, setDocumentos] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("Ata de Reuniao");
  const [arquivo, setArquivo] = useState(null);
  const [descricao, setDescricao] = useState("");
  const [progresso, setProgresso] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const categorias = ["Ata de Reuniao", "Regulamento Interno", "Balancete Financeiro", "Contrato", "Comunicado", "Outro"];

  useEffect(() => { carregarDocumentos(); }, []);

  async function carregarDocumentos() {
    const q = query(collection(db, "documentos"), orderBy("criado_em", "desc"));
    const snap = await getDocs(q);
    setDocumentos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function publicarDocumento() {
    if (!titulo || !arquivo) {
      setErro("Titulo e arquivo sao obrigatorios.");
      return;
    }
    setErro("");
    setSalvando(true);

    const storageRef = ref(storage, "documentos/" + Date.now() + "_" + arquivo.name);
    const uploadTask = uploadBytesResumable(storageRef, arquivo);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgresso(pct);
      },
      (error) => {
        setErro("Erro ao fazer upload: " + error.message);
        setSalvando(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        await addDoc(collection(db, "documentos"), {
          titulo,
          categoria,
          url,
          descricao,
          nomeArquivo: arquivo.name,
          criado_em: serverTimestamp(),
        });
        setTitulo("");
        setArquivo(null);
        setDescricao("");
        setCategoria("Ata de Reuniao");
        setProgresso(0);
        setSalvando(false);
        carregarDocumentos();
      }
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ color: "#38bdf8", marginBottom: "20px" }}>Documentos</h2>

      <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px" }}>
        <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>Publicar documento</h3>

        <input style={inp} placeholder="Titulo do documento" value={titulo} onChange={(e) => setTitulo(e.target.value)} />

        <select style={inp} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <textarea style={{ ...inp, resize: "vertical" }} placeholder="Descricao breve (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} />

        <div style={{ marginBottom: "10px" }}>
          <label style={{ color: "#94a3b8", fontSize: "0.9rem", display: "block", marginBottom: "6px" }}>
            Selecionar arquivo (PDF, Word, etc)
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
            onChange={(e) => setArquivo(e.target.files[0])}
            style={{ color: "#f1f5f9" }}
          />
          {arquivo && (
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "6px" }}>
              Arquivo selecionado: {arquivo.name}
            </p>
          )}
        </div>

        {salvando && (
          <div style={{ marginBottom: "10px" }}>
            <div style={{ background: "#0f172a", borderRadius: "8px", overflow: "hidden", height: "8px" }}>
              <div style={{ width: progresso + "%", background: "#38bdf8", height: "100%", transition: "width 0.3s" }} />
            </div>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "4px" }}>{progresso}% enviado</p>
          </div>
        )}

        {erro && <p style={{ color: "#ef4444", fontSize: "0.9rem" }}>{erro}</p>}

        <button style={btn} onClick={publicarDocumento} disabled={salvando}>
          {salvando ? "Enviando..." : "Publicar documento"}
        </button>
      </div>

      <div style={{ marginTop: "24px" }}>
        {documentos.length === 0 && (
          <p style={{ color: "#64748b", textAlign: "center" }}>Nenhum documento publicado ainda.</p>
        )}
        {documentos.map((d) => (
          <div key={d.id} style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "12px", borderLeft: "4px solid #38bdf8" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", gap: "12px" }}>
              <div>
                <h4 style={{ color: "#f1f5f9", margin: 0 }}>{d.titulo}</h4>
                {d.descricao && <p style={{ color: "#94a3b8", margin: "4px 0 0", fontSize: "0.9rem" }}>{d.descricao}</p>}
                {d.nomeArquivo && <p style={{ color: "#475569", margin: "4px 0 0", fontSize: "0.8rem" }}>Arquivo: {d.nomeArquivo}</p>}
              </div>
              <span style={{ background: "#38bdf822", color: "#38bdf8", padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold", whiteSpace: "nowrap" }}>
                {d.categoria}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#475569", fontSize: "0.85rem" }}>
                {d.criado_em?.toDate().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
              <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8", fontSize: "0.85rem", fontWeight: "bold", textDecoration: "none" }}>
                Ver documento
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inp = { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: "1rem", boxSizing: "border-box" };
const btn = { padding: "10px 24px", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem", marginTop: "8px" };