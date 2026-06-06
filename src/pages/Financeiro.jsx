import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection, addDoc, getDocs, orderBy, query, serverTimestamp, doc, deleteDoc,
} from "firebase/firestore";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function Financeiro() {
  const [lancamentos, setLancamentos] = useState([]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("receita");
  const [categoria, setCategoria] = useState("Taxa de condominio");
  const [salvando, setSalvando] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const agora = new Date();
  const [filtroMes, setFiltroMes] = useState(agora.getMonth());
  const [filtroAno, setFiltroAno] = useState(agora.getFullYear());

  const categoriasReceita = ["Taxa de condominio", "Fundo de reserva", "Multa", "Outro"];
  const categoriasDespesa = ["Manutencao", "Limpeza", "Seguranca", "Agua", "Energia", "Administracao", "Outro"];

  const anos = Array.from({ length: 5 }, (_, i) => agora.getFullYear() - i);
  const nomeMeses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  useEffect(() => { carregarLancamentos(); }, []);

  async function carregarLancamentos() {
    const q = query(collection(db, "financeiro"), orderBy("criado_em", "desc"));
    const snap = await getDocs(q);
    setLancamentos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function excluirLancamento(id) {
    await deleteDoc(doc(db, "financeiro", id));
    carregarLancamentos();
  }

  async function adicionarLancamento() {
    if (!descricao || !valor) return;
    setSalvando(true);
    await addDoc(collection(db, "financeiro"), {
      descricao, valor: parseFloat(valor), tipo, categoria, criado_em: serverTimestamp(),
    });
    setDescricao(""); setValor(""); setTipo("receita"); setCategoria("Taxa de condominio");
    setSalvando(false);
    carregarLancamentos();
  }

  function formatarMoeda(v) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  // Lançamentos do período filtrado
  const lancamentosFiltrados = lancamentos.filter((l) => {
    if (!l.criado_em) return false;
    const d = l.criado_em.toDate ? l.criado_em.toDate() : new Date(l.criado_em);
    const mesOk = d.getMonth() === filtroMes && d.getFullYear() === filtroAno;
    const tipoOk = filtroTipo === "todos" || l.tipo === filtroTipo;
    return mesOk && tipoOk;
  });

  // Totais globais (para os cards de resumo)
  const totalReceitas = lancamentos.filter((l) => l.tipo === "receita").reduce((acc, l) => acc + l.valor, 0);
  const totalDespesas = lancamentos.filter((l) => l.tipo === "despesa").reduce((acc, l) => acc + l.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  // Totais do período (para o PDF)
  const receitasPeriodo = lancamentosFiltrados.filter((l) => l.tipo === "receita").reduce((acc, l) => acc + l.valor, 0);
  const despesasPeriodo = lancamentosFiltrados.filter((l) => l.tipo === "despesa").reduce((acc, l) => acc + l.valor, 0);
  const saldoPeriodo = receitasPeriodo - despesasPeriodo;

  // Gráfico barras — últimos 6 meses
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    meses.push({ mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }), ano: d.getFullYear(), mesNum: d.getMonth(), receitas: 0, despesas: 0 });
  }
  lancamentos.forEach((l) => {
    if (!l.criado_em) return;
    const d = l.criado_em.toDate ? l.criado_em.toDate() : new Date(l.criado_em);
    const entry = meses.find((m) => m.ano === d.getFullYear() && m.mesNum === d.getMonth());
    if (!entry) return;
    if (l.tipo === "receita") entry.receitas += l.valor;
    if (l.tipo === "despesa") entry.despesas += l.valor;
  });

  // Gráfico pizza
  const porCategoria = {};
  lancamentos.filter((l) => l.tipo === "despesa").forEach((l) => {
    porCategoria[l.categoria] = (porCategoria[l.categoria] || 0) + l.valor;
  });
  const dadosPizza = Object.entries(porCategoria).map(([name, value]) => ({ name, value }));

  const CORES = ["#38bdf8","#22c55e","#f59e0b","#a78bfa","#ef4444","#ec4899","#06b6d4"];
  const tooltipStyle = { contentStyle: { background: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }, labelStyle: { color: "#f1f5f9" } };

  function exportarPDF() {
    if (lancamentosFiltrados.length === 0) {
      alert("Nenhum lançamento no período selecionado.");
      return;
    }
    const periodo = `${nomeMeses[filtroMes]} ${filtroAno}`;
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text("Relatório Financeiro — CondoFácil", 14, 20);
    pdf.setFontSize(11);
    pdf.text(`Período: ${periodo}`, 14, 30);
    pdf.text(`Receitas: ${formatarMoeda(receitasPeriodo)}`, 14, 40);
    pdf.text(`Despesas: ${formatarMoeda(despesasPeriodo)}`, 14, 48);
    pdf.text(`Saldo: ${formatarMoeda(saldoPeriodo)}`, 14, 56);
    autoTable(pdf, {
      startY: 66,
      head: [["Descrição", "Categoria", "Tipo", "Valor", "Data"]],
      body: lancamentosFiltrados.map((l) => [
        l.descricao,
        l.categoria,
        l.tipo === "receita" ? "Receita" : "Despesa",
        (l.tipo === "receita" ? "+" : "-") + formatarMoeda(l.valor),
        l.criado_em?.toDate().toLocaleDateString("pt-BR") || "—",
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [56, 189, 248] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });
    pdf.save(`financeiro-${nomeMeses[filtroMes].toLowerCase()}-${filtroAno}.pdf`);
  }
  function exportarExcel() {
    if (lancamentosFiltrados.length === 0) {
      alert("Nenhum lançamento no período selecionado.");
      return;
    }
    const periodo = `${nomeMeses[filtroMes]}_${filtroAno}`;
    const dados = lancamentosFiltrados.map((l) => ({
      Descrição: l.descricao,
      Categoria: l.categoria,
      Tipo: l.tipo === "receita" ? "Receita" : "Despesa",
      Valor: l.tipo === "receita" ? l.valor : -l.valor,
      Data: l.criado_em?.toDate().toLocaleDateString("pt-BR") || "—",
    }));

    // Linha de totais
    dados.push({});
    dados.push({ Descrição: "TOTAL RECEITAS", Valor: receitasPeriodo });
    dados.push({ Descrição: "TOTAL DESPESAS", Valor: -despesasPeriodo });
    dados.push({ Descrição: "SALDO", Valor: saldoPeriodo });

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financeiro");
    XLSX.writeFile(wb, `financeiro-${periodo}.xlsx`);
  }

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <h2 style={{ color: "#38bdf8", margin: 0 }}>Financeiro</h2>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button style={btn} onClick={exportarPDF}>⬇️ Exportar PDF</button>
          <button style={{ ...btn, background: "#22c55e" }} onClick={exportarExcel}>📊 Exportar Excel</button>
        </div>
      </div>

      {/* Resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", borderTop: "3px solid #22c55e" }}>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Total Receitas</p>
          <h3 style={{ color: "#22c55e", margin: "8px 0 0" }}>{formatarMoeda(totalReceitas)}</h3>
        </div>
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", borderTop: "3px solid #ef4444" }}>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Total Despesas</p>
          <h3 style={{ color: "#ef4444", margin: "8px 0 0" }}>{formatarMoeda(totalDespesas)}</h3>
        </div>
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", borderTop: `3px solid ${saldo >= 0 ? "#38bdf8" : "#ef4444"}` }}>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Saldo</p>
          <h3 style={{ color: saldo >= 0 ? "#38bdf8" : "#ef4444", margin: "8px 0 0" }}>{formatarMoeda(saldo)}</h3>
        </div>
      </div>

      {/* Gráfico mensal */}
      <div style={{ background: "#1e293b", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
        <h3 style={{ color: "#f1f5f9", margin: "0 0 20px" }}>Receitas vs Despesas — últimos 6 meses</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={meses} barGap={4}>
            <XAxis dataKey="mes" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip {...tooltipStyle} formatter={(v) => formatarMoeda(v)} />
            <Legend wrapperStyle={{ color: "#94a3b8" }} />
            <Bar dataKey="receitas" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico pizza */}
      {dadosPizza.length > 0 && (
        <div style={{ background: "#1e293b", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ color: "#f1f5f9", margin: "0 0 20px" }}>Despesas por categoria</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dadosPizza} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${formatarMoeda(value)}`}>
                {dadosPizza.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v) => formatarMoeda(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Formulário */}
      <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
        <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>Novo lançamento</h3>
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
          <button onClick={() => { setTipo("receita"); setCategoria("Taxa de condominio"); }} style={{ ...btnTipo, background: tipo === "receita" ? "#22c55e" : "transparent", color: tipo === "receita" ? "#0f172a" : "#94a3b8", border: `1px solid ${tipo === "receita" ? "#22c55e" : "#334155"}` }}>Receita</button>
          <button onClick={() => { setTipo("despesa"); setCategoria("Manutencao"); }} style={{ ...btnTipo, background: tipo === "despesa" ? "#ef4444" : "transparent", color: tipo === "despesa" ? "#fff" : "#94a3b8", border: `1px solid ${tipo === "despesa" ? "#ef4444" : "#334155"}` }}>Despesa</button>
        </div>
        <input style={inp} placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        <input style={inp} type="number" placeholder="Valor (ex: 1500.00)" value={valor} onChange={(e) => setValor(e.target.value)} />
        <select style={inp} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {(tipo === "receita" ? categoriasReceita : categoriasDespesa).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button style={btn} onClick={adicionarLancamento} disabled={salvando}>{salvando ? "Salvando..." : "Adicionar lançamento"}</button>
      </div>

      {/* Extrato com filtros */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "12px" }}>
        <h3 style={{ color: "#f1f5f9", margin: 0 }}>Extrato — {nomeMeses[filtroMes]} {filtroAno}</h3>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <select style={inpSmall} value={filtroMes} onChange={(e) => setFiltroMes(Number(e.target.value))}>
            {nomeMeses.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select style={inpSmall} value={filtroAno} onChange={(e) => setFiltroAno(Number(e.target.value))}>
            {anos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select style={inpSmall} value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
          </select>
        </div>
      </div>

      {/* Totais do período */}
      <div style={{ background: "#1e293b", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
        <span style={{ color: "#22c55e", fontSize: "0.9rem" }}>Receitas: <strong>{formatarMoeda(receitasPeriodo)}</strong></span>
        <span style={{ color: "#ef4444", fontSize: "0.9rem" }}>Despesas: <strong>{formatarMoeda(despesasPeriodo)}</strong></span>
        <span style={{ color: saldoPeriodo >= 0 ? "#38bdf8" : "#ef4444", fontSize: "0.9rem" }}>Saldo: <strong>{formatarMoeda(saldoPeriodo)}</strong></span>
      </div>

      {lancamentosFiltrados.length === 0 && <p style={{ color: "#64748b", textAlign: "center" }}>Nenhum lançamento neste período.</p>}
      {lancamentosFiltrados.map((l) => (
        <div key={l.id} style={{ background: "#1e293b", padding: "16px 20px", borderRadius: "12px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `4px solid ${l.tipo === "receita" ? "#22c55e" : "#ef4444"}` }}>
          <div>
            <p style={{ color: "#f1f5f9", margin: 0, fontWeight: "500" }}>{l.descricao}</p>
            <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "0.85rem" }}>{l.categoria}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: l.tipo === "receita" ? "#22c55e" : "#ef4444", margin: 0, fontWeight: "bold" }}>
              {l.tipo === "receita" ? "+" : "-"}{formatarMoeda(l.valor)}
            </p>
            <p style={{ color: "#475569", margin: "4px 0 0", fontSize: "0.8rem" }}>{l.criado_em?.toDate().toLocaleDateString("pt-BR")}</p>
            <button onClick={() => excluirLancamento(l.id)} style={{ marginTop: "6px", padding: "3px 10px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem" }}>Excluir</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const inp = { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: "1rem", boxSizing: "border-box" };
const inpSmall = { padding: "6px 10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: "0.85rem" };
const btn = { padding: "10px 24px", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem", marginTop: "8px" };
const btnTipo = { padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.9rem" };