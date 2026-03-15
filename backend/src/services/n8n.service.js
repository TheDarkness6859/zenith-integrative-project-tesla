import "dotenv/config";

// Base URL for n8n webhooks (stored in environment variables)
const N8N_BASE = process.env.N8N_WEBHOOK_BASE; // example: https://n8n-riwi.emausoft.com/webhook


const notifyN8n = async (path, payload) => {

    // Log the webhook endpoint and payload for debugging
    console.log(`[n8n] Calling: ${N8N_BASE}/${path}`);
    console.log(`[n8n] Payload:`, payload);

    try {
        // Send POST request to the webhook
        const res = await fetch(`${N8N_BASE}/${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        // Log response status
        console.log(`[n8n] Response:`, res.status);

    } catch (error) {
        // Log error without interrupting the main application flow
        console.error(`[n8n] Error:`, error.message);
    }
};

// Notify n8n when a user logs in
export const notifyLogin = (name, email) =>
    notifyN8n("Zenith-login", { name, email });

// NUEVO: Notify n8n to send the email confirmation with the token
export const notifyEmailConfirmation = (name, email, token) =>
    notifyN8n("Zenith-email", { name, email, token });