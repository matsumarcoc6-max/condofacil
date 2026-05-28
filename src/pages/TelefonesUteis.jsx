import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

const categorias = ["Emergência", "Manutenção", "Administração", "Outros"];

export default function TelefonesUteis() {
  const [contatos, setContatos] = useState([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [categoria, setCategoria] = useState("Emergência");
  const [filtro, setFiltro] = useState("Todos");
  const [loading, setLoading] = useState(false);

  const carregar = async () => {
    const q = query(collection(db, "telefonesUteis"), orderBy("criadoEm", "desc"));
    const snap = await getDocs(q);
    setContatos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { carregar(); }, []);

  const publicar = async () => {
    if (!nome.trim() || !telefone.trim()) return;
    setLoading(true);
    await addDoc(collection(db, "telefonesUteis"), {
      nome,
      telefone,
      categoria,
      criadoEm: serverTimestamp(),
    });
    setNome("");
    setTelefone("");
    setCategoria("Emergência");
    await carregar();
    setLoading(false);
  };

  const excluir = async (id) => {
    await deleteDoc(doc(db, "telefonesUteis", id));
    await carregar();
  };

  const filtrados =
    filtro === "Todos" ? contatos : contatos.filter((c) => c.categoria === filtro);

  const corCategoria = (cat) => {
    const cores = {
      Emergência: "bg-red-100 text-red-700",
      Manutenção: "bg-yellow-100 text-yellow-700",
      Administração: "bg-blue-100 text-blue-700",
      Outros: "bg-gray-100 text-gray-700",
    };
    return cores[cat] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📞 Telefones Úteis</h1>

      {/* Formulário */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6 space-y-3">
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Nome do contato (ex: Portaria, Bombeiros...)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Telefone (ex: (11) 99999-9999)"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
        <select
          className="w-full border rounded-lg px-3 py-2 text-sm"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          {categorias.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={publicar}
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 transition"
        >
          {loading ? "Salvando..." : "Adicionar contato"}
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["Todos", ...categorias].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
              filtro === f
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtrados.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">Nenhum contato cadastrado.</p>
        )}
        {filtrados.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl shadow p-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${corCategoria(c.categoria)}`}>
                  {c.categoria}
                </span>
              </div>
              <p className="font-semibold text-gray-800">{c.nome}</p>
              <p className="text-blue-600 font-medium text-sm">{c.telefone}</p>
            </div>
            <button
              onClick={() => excluir(c.id)}
              className="text-red-400 hover:text-red-600 text-xs font-medium transition"
            >
              Excluir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}