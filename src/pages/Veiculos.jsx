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
  deleteDoc,
} from "firebase/firestore";

export default function Veiculos({ perfil }) {
  const podeGerenciar = perfil === "sindico" || perfil === "admin_geral";
  const [veiculos, setVeiculos] = useState([]);
  const [proprietario, setProprietario] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [modelo, setModelo] = useState("");
  const [cor, setCor] = useState("");
  const [placa, setPlaca] = useState("");
  const [vaga, setVaga] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

  useEffect(() => { carregarVeiculos(); }, []);

  async function carregarVeiculos() {
    const q = query(collection(db, "veiculos"), orderBy("criado_em", "desc"));
    const snap = await getDocs(q);
    setVeiculos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function cadastrarVeiculo() {
    if (!proprietario || !placa || !apartamento) {
      setErro("Nome, apartamento e placa sao obrigatorios.");
      return;
    }
    setErro("");
    setSalvando(true);
    await addDoc(collection(db, "veiculos"), {
      proprietario,
      apartamento,
      modelo,
      cor,
      placa: placa.toUpperCase(),
      vaga,
      criado_em: serverTimestamp(),
    });
    setProprietario("");
    setApartamento("");
    setModelo("");
    setCor("");
    setPlaca("");
    setVaga("");
    setSucesso("Veiculo cadastrado com sucesso!");
    setSalvando(false);
    carregarVeiculos();
    setTimeout(() => setSucesso(""), 3000);
  }

  async function excluirVeiculo(id) {
    await deleteDoc(doc(db, "veiculos", id));
    carregarVeiculos();
  }

  const veiculosFiltrados = veiculos.filter((v) =>
    busca === "" ||
    v.placa?.toLowerCase().includes(busca.toLowerCase()) ||
    v.proprietario?.toLowerCase().includes(busca.toLowerCase()) ||
    v.apartamento?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ color: "#38bdf8", marginBottom: "20px" }}>Veiculos dos Moradores</h2>

      {podeGerenciar && (
        <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
          <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>Cadastrar veiculo</h3>

          <input style={inp} placeholder="Nome do proprietario *" value={proprietario} onChange={(e) => setProprietario(e.target.value)} />
          <input style={inp} placeholder="Apartamento *" value={apartamento} onChange={(e) => setApartamento(e.target.value)} />
          <input style={inp} placeholder="Modelo (ex: Honda Civic)" value={modelo} onChange={(e) => setModelo(e.target.value)} />
          <input style={inp} placeholder="Cor (ex: Prata)" value={cor} onChange={(e) => setCor(e.target.value)} />
          <input style={inp} placeholder="Placa *" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} />
          <input style={inp} placeholder="Numero da vaga (ex: 12)" value={vaga} onChange={(e) => setVaga(e.target.value)} />

          {erro && <p style={{ color: "#ef4444", fontSize: "0.9rem", marginBottom: "8px" }}>{erro}</p>}
          {sucesso && <p style={{ color: "#22c55e", fontSize: "0.9rem", marginBottom: "8px" }}>{sucesso}</p>}

          <button style={btn} onClick={cadastrarVeiculo} disabled={salvando}>
            {salvando ? "Cadastrando..." : "Cadastrar veiculo"}
          </button>
        </div>
      )}

      {/* Busca */}
      <input
        style={{ ...inp, marginBottom: "16px" }}
        placeholder="Buscar por placa, nome ou apartamento..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>
        Veiculos cadastrados ({veiculosFiltrados.length})
      </h3>

      {veiculosFiltrados.length === 0 && (
        <p style={{ color: "#64748b", textAlign: "center" }}>Nenhum veiculo encontrado.</p>
      )}

      {veiculosFiltrados.map((v) => (
        <div key={v.id} style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "8px", borderLeft: "4px solid #38bdf8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h4 style={{ color: "#f1f5f9", margin: "0 0 4px" }}>{v.placa}</h4>
              <p style={{ color: "#94a3b8", margin: "0 0 4px", fontSize: "0.9rem" }}>
                {v.proprietario} — Apto {v.apartamento}
              </p>
              {v.modelo && (
                <p style={{ color: "#94a3b8", margin: "0 0 4px", fontSize: "0.85rem" }}>
                  🚗 {v.modelo} {v.cor ? `— ${v.cor}` : ""}
                </p>
              )}
              {v.vaga && (
                <p style={{ color: "#64748b", margin: 0, fontSize: "0.85rem" }}>
                  🅿️ Vaga {v.vaga}
                </p>
              )}
            </div>
            {podeGerenciar && (
              <button
                onClick={() => excluirVeiculo(v.id)}
                style={{ padding: "4px 12px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}
              >
                Excluir
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