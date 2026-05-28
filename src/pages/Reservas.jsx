import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

export default function Reservas() {
  const { userProfile } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Configuração das áreas
  const areasConfig = {
    salao_festas: { nome: "Salão de Festas", unidades: 1 },
    churrasqueira: { nome: "Churrasqueira", unidades: 3 },
    quadra: { nome: "Quadra Esportiva", unidades: 1 },
    espaco_gourmet: { nome: "Espaço Gourmet", unidades: 1 },
    academia: { nome: "Academia", unidades: 1 }
  };

  const [formData, setFormData] = useState({
    area: "",
    unidade: "1",
    data: "",
    horarioInicio: "",
    horarioFim: "",
    observacoes: ""
  });

  const handleAreaChange = (e) => {
    const area = e.target.value;
    setFormData({ ...formData, area, unidade: "1" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação de disponibilidade
      const areaCompleta = formData.area === "churrasqueira" 
        ? `${formData.area}_${formData.unidade}` 
        : formData.area;

      const dataReserva = new Date(formData.data + "T00:00:00");
      const inicioReserva = Timestamp.fromDate(dataReserva);
      const fimReserva = Timestamp.fromDate(new Date(dataReserva.getTime() + 86400000));

      const q = query(
        collection(db, "reservas"),
        where("area", "==", areaCompleta),
        where("data", ">=", inicioReserva),
        where("data", "<", fimReserva)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        alert("Esta área/unidade já está reservada para a data selecionada!");
        setLoading(false);
        return;
      }

      // Criar reserva
      await addDoc(collection(db, "reservas"), {
        area: areaCompleta,
        areaNome: areasConfig[formData.area].nome + (formData.area === "churrasqueira" ? ` ${formData.unidade}` : ""),
        data: inicioReserva,
        horarioInicio: formData.horarioInicio,
        horarioFim: formData.horarioFim,
        observacoes: formData.observacoes,
        morador: userProfile.nome || "Não informado",
        apartamento: userProfile.apartamento || "Não informado",
        status: "confirmada",
        criadoEm: Timestamp.now()
      });

      alert("Reserva realizada com sucesso!");
      setFormData({
        area: "",
        unidade: "1",
        data: "",
        horarioInicio: "",
        horarioFim: "",
        observacoes: ""
      });
      carregarReservas();
    } catch (error) {
      console.error("Erro ao criar reserva:", error);
      alert("Erro ao criar reserva: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const carregarReservas = async () => {
    try {
      const snapshot = await getDocs(collection(db, "reservas"));
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReservas(lista.sort((a, b) => b.data.seconds - a.data.seconds));
    } catch (error) {
      console.error("Erro ao carregar reservas:", error);
    }
  };

  useEffect(() => {
    carregarReservas();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reservas de Áreas Comuns</h1>

      {/* Formulário */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Nova Reserva</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Área */}
            <div>
              <label className="block text-sm font-medium mb-1">Área *</label>
              <select
                value={formData.area}
                onChange={handleAreaChange}
                required
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Selecione...</option>
                {Object.entries(areasConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.nome}</option>
                ))}
              </select>
            </div>

            {/* Unidade (só aparece se for churrasqueira) */}
            {formData.area === "churrasqueira" && (
              <div>
                <label className="block text-sm font-medium mb-1">Unidade *</label>
                <select
                  value={formData.unidade}
                  onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                  required
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="01">Churrasqueira 01</option>
                  <option value="02">Churrasqueira 02</option>
                  <option value="03">Churrasqueira 03</option>
                </select>
              </div>
            )}

            {/* Data */}
            <div>
              <label className="block text-sm font-medium mb-1">Data *</label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* Horário Início */}
            <div>
              <label className="block text-sm font-medium mb-1">Horário Início *</label>
              <input
                type="time"
                value={formData.horarioInicio}
                onChange={(e) => setFormData({ ...formData, horarioInicio: e.target.value })}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* Horário Fim */}
            <div>
              <label className="block text-sm font-medium mb-1">Horário Fim *</label>
              <input
                type="time"
                value={formData.horarioFim}
                onChange={(e) => setFormData({ ...formData, horarioFim: e.target.value })}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows="3"
              className="w-full border rounded px-3 py-2"
              placeholder="Informações adicionais..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Salvando..." : "Criar Reserva"}
          </button>
        </form>
      </div>

      {/* Lista de Reservas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Reservas Realizadas</h2>
        <div className="space-y-3">
          {reservas.map((reserva) => (
            <div key={reserva.id} className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{reserva.areaNome}</h3>
                  <p className="text-sm text-gray-600">
                    📅 {reserva.data?.toDate().toLocaleDateString("pt-BR")} | 
                    ⏰ {reserva.horarioInicio} - {reserva.horarioFim}
                  </p>
                  <p className="text-sm text-gray-600">
                    🏠 {reserva.apartamento} — {reserva.morador}
                  </p>
                  {reserva.observacoes && (
                    <p className="text-sm text-gray-500 mt-1">💬 {reserva.observacoes}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded text-sm ${
                  reserva.status === "confirmada" ? "bg-green-100 text-green-800" : "bg-gray-100"
                }`}>
                  {reserva.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}