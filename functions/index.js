const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const { getFirestore } = require("firebase-admin/firestore");

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

    const titulo = novoStatus === "dentro"
      ? "Visitante chegou! 🔔"
      : "Visitante saiu 👋";

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