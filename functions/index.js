const { onDocumentUpdated, onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

initializeApp();

exports.notificarMoradorVisita = onDocumentUpdated(
  "visitas/{visitaId}",
  async (event) => {
    const antes = event.data.before.data();
    const depois = event.data.after.data();

    if (antes.status === depois.status) return null;

    const novoStatus = depois.status;
    if (novoStatus !== "dentro" && novoStatus !== "finalizado") return null;

    const criadoPor = depois.criadoPor;
    if (!criadoPor) return null;

    const db = getFirestore();
    const usuarioDoc = await db.collection("usuarios").doc(criadoPor).get();
    if (!usuarioDoc.exists) return null;

    const fcmToken = usuarioDoc.data().fcmToken;
    if (!fcmToken) return null;

    const titulo = novoStatus === "dentro" ? "Visitante chegou! 🔔" : "Visitante saiu 👋";
    const corpo = novoStatus === "dentro"
      ? `${depois.nome} chegou ao condomínio.`
      : `${depois.nome} saiu do condomínio.`;

    await getMessaging().send({
      token: fcmToken,
      notification: { title: titulo, body: corpo },
      data: { visitaId: event.params.visitaId },
    });

    return null;
  }
);

exports.notificarNovaEnquete = onDocumentCreated(
  "enquetes/{enqueteId}",
  async (event) => {
    const enquete = event.data.data();
    if (!enquete) return null;

    const db = getFirestore();
    const snap = await db.collection("usuarios").get();
    const tokens = snap.docs.map((d) => d.data().fcmToken).filter(Boolean);

    if (tokens.length === 0) return null;

    const loteSize = 500;
    for (let i = 0; i < tokens.length; i += loteSize) {
      const lote = tokens.slice(i, i + loteSize);
      await getMessaging().sendEachForMulticast({
        tokens: lote,
        notification: {
          title: "Nova enquete disponível 📊",
          body: enquete.pergunta,
        },
        data: { enqueteId: event.params.enqueteId },
      });
    }

    return null;
  }
);

exports.cadastrarMoradoresEmLote = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    if (!request.auth) throw new Error("Não autorizado.");

    const db = getFirestore();
    const chamadorDoc = await db.collection("usuarios").doc(request.auth.uid).get();
    if (!chamadorDoc.exists) throw new Error("Usuário não encontrado.");

    const perfilChamador = chamadorDoc.data().perfil;
    if (perfilChamador !== "admin_geral" && perfilChamador !== "sindico") {
      throw new Error("Sem permissão para cadastrar em lote.");
    }

    const moradores = request.data.moradores;
    if (!Array.isArray(moradores) || moradores.length === 0) {
      throw new Error("Nenhum morador enviado.");
    }

    const resultados = { criados: [], falhas: [] };

    for (const m of moradores) {
      const { nome, email, senha, apartamento, bloco, perfil } = m;

      if (!nome || !email || !senha) {
        resultados.falhas.push({ email: email || "?", motivo: "Nome, email e senha são obrigatórios." });
        continue;
      }
      if (senha.length < 6) {
        resultados.falhas.push({ email, motivo: "Senha deve ter pelo menos 6 caracteres." });
        continue;
      }

      const perfilFinal = perfil === "sindico" && perfilChamador !== "admin_geral"
        ? "morador"
        : (perfil || "morador");

      try {
        const userRecord = await getAuth().createUser({ email, password: senha, displayName: nome });
        await db.collection("usuarios").doc(userRecord.uid).set({
          uid: userRecord.uid,
          nome,
          email,
          apartamento: apartamento || "",
          bloco: bloco || "",
          perfil: perfilFinal,
          ativo: true,
          criado_em: FieldValue.serverTimestamp(),
        });
        resultados.criados.push({ nome, email });
      } catch (e) {
        const motivo = e.code === "auth/email-already-exists"
          ? "E-mail já cadastrado."
          : e.message;
        resultados.falhas.push({ email, motivo });
      }
    }

    return resultados;
  }
);