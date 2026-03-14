const N8N_BASE = process.env.N8N_WEBHOOK_BASE; // ej: https://n8n-riwi.emausoft.com/webhook
 
/**
 * Llama a un webhook de n8n enviando datos del usuario.
 * Si falla, solo loguea el error — nunca bloquea el flujo principal.
 */
const notifyN8n = async (path, payload) => {
    console.log(`[n8n] Llamando a: ${process.env.N8N_WEBHOOK_BASE}/${path}`);
    console.log(`[n8n] Payload:`, payload);
    try {
        const res = await fetch(`${process.env.N8N_WEBHOOK_BASE}/${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        console.log(`[n8n] Respuesta:`, res.status);
    } catch (error) {
        console.error(`[n8n] Error:`, error.message);
    }
};
 
export const notifyRegister = (name, email) =>
    notifyN8n("zenith-register", { name, email });
 
export const notifyLogin = (name, email) =>
    notifyN8n("zenith-login", { name, email });
 