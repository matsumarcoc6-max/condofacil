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

export default function Pets({ perfil }) {
  const podeGerenciar = perfil === "sindico" || perfil === "admin_geral";
  const [pets, setPets] = useState([]);
  const [nome, setNome] = useState("");
  const [especie, setEspecie] = useState("Cachorro");
  const [raca, setRaca] = useState("");
  const [porte, setPorte] = useState("Pequeno");
  const [cor, setCor] = useState("");
  const [proprietario, setProprietario] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [vacinado, setVacinado] = useState(true);
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => { carregarPets(); }, []);

  async function carregarPets() {
    const q = query(collection(db, "pets"), orderBy("criado_em", "desc"));
    const snap = await getDocs(q);
    setPets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function cadastrarPet() {
    if (!nome || !proprietario || !apartamento) {
      setErro("Nome do pet, proprietario e apartamento sao obrigatorios.");
      return;
    }
    setErro("");
    setSalvando(true);
    await addDoc(collection(db, "pets"), {
      nome,
      especie,
      raca,
      porte,
      cor,
      proprietario,
      apartamento,
      vacinado,
      observacao,
      criado_em: serverTimestamp(),
    });
    setNome("");
    setEspecie("Cachorro");
    setRaca("");
    setPorte("Pequeno");
    setCor("");
    setProprietario("");
    setApartamento("");
    setVacinado(true);
    setObservacao("");
    setSucesso("Pet cadastrado com sucesso!");
    setSalvando(false);
    carregarPets();
    setTimeout(() => setSucesso(""), 3000);
  }

  async function excluirPet(id) {
    await deleteDoc(doc(db, "pets", id));
    carregarPets();
  }

  const iconeEspecie = { Cachorro: "🐶", Gato: "🐱", Ave: "🐦", Outro: "🐾" };
  const corPorte = { Pequeno: "#22c55e", Medio: "#f59e0b", Grande: "#ef4444" };

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ color: "#38bdf8", marginBottom: "20px" }}>Animais de Estimacao</h2>

      <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
        <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>Cadastrar animal</h3>

        <input style={inp} placeholder="Nome do animal *" value={nome} onChange={(e) => setNome(e.target.value)} />

        <select style={inp} value={especie} onChange={(e) => setEspecie(e.target.value)}>
          <option value="Cachorro">🐶 Cachorro</option>
          <option value="Gato">🐱 Gato</option>
          <option value="Ave">🐦 Ave</option>
          <option value="Outro">🐾 Outro</option>
        </select>

        <input style={inp} placeholder="Raca (ex: Golden Retriever)" value={raca} onChange={(e) => setRaca(e.target.value)} />

        <select style={inp} value={porte} onChange={(e) => setPorte(e.target.value)}>
          <option value="Pequeno">Pequeno</option>
          <option value="Medio">Medio</option>
          <option value="Grande">Grande</option>
        </select>

        <input style={inp} placeholder="Cor (ex: Caramelo)" value={cor} onChange={(e) => setCor(e.target.value)} />
        <input style={inp} placeholder="Nome do proprietario *" value={proprietario} onChange={(e) => setProprietario(e.target.value)} />
        <input style={inp} placeholder="Apartamento *" value={apartamento} onChange={(e) => setApartamento(e.target.value)} />

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
          <label style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Vacinacao em dia:</label>
          <button
            onClick={() => setVacinado(!vacinado)}
            style={{ padding: "6px 16px", background: vacinado ? "#22c55e" : "#ef4444", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}
          >
            {vacinado ? "Sim" : "Nao"}
          </button>
        </div>

        <textarea
          style={{ ...inp, resize: "vertical" }}
          placeholder="Observacoes (opcional — ex: animal agressivo, necessita focinheira)"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={2}
        />

        {erro && <p style={{ color: "#ef4444", fontSize: "0.9rem", marginBottom: "8px" }}>{erro}</p>}
        {sucesso && <p style={{ color: "#22c55e", fontSize: "0.9rem", marginBottom: "8px" }}>{sucesso}</p>}

        <button style={btn} onClick={cadastrarPet} disabled={salvando}>
          {salvando ? "Cadastrando..." : "Cadastrar animal"}
        </button>
      </div>

      <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>
        Animais cadastrados ({pets.length})
      </h3>

      {pets.length === 0 && (
        <p style={{ color: "#64748b", textAlign: "center" }}>Nenhum animal cadastrado ainda.</p>
      )}

      {pets.map((p) => (
        <div key={p.id} style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "8px", borderLeft: `4px solid ${corPorte[p.porte] || "#38bdf8"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h4 style={{ color: "#f1f5f9", margin: "0 0 4px" }}>
                {iconeEspecie[p.especie] || "🐾"} {p.nome}
              </h4>
              <p style={{ color: "#94a3b8", margin: "0 0 4px", fontSize: "0.9rem" }}>
                {p.raca ? `${p.raca} — ` : ""}{p.cor || ""}
              </p>
              <p style={{ color: "#94a3b8", margin: "0 0 4px", fontSize: "0.9rem" }}>
                {p.proprietario} — Apto {p.apartamento}
              </p>
              <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                <span style={{ background: (corPorte[p.porte] || "#38bdf8") + "22", color: corPorte[p.porte] || "#38bdf8", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "bold" }}>
                  {p.porte}
                </span>
                <span style={{ background: p.vacinado ? "#22c55e22" : "#ef444422", color: p.vacinado ? "#22c55e" : "#ef4444", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "bold" }}>
                  {p.vacinado ? "✓ Vacinado" : "✗ Vacina pendente"}
                </span>
              </div>
              {p.observacao && (
                <p style={{ color: "#64748b", margin: "6px 0 0", fontSize: "0.8rem" }}>
                  ⚠️ {p.observacao}
                </p>
              )}
            </div>
            {podeGerenciar && (
              <button
                onClick={() => excluirPet(p.id)}
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