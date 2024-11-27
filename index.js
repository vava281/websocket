const { Client, GatewayIntentBits, Partials } = require('discord.js');
const WebSocket = require('ws'); // Utilisé pour WebSocket côté serveur
const http = require('http'); // Module pour serveur HTTP classique

// Création d'une instance du client Discord.js
const client = new Client({
    intents: [3276799], 
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction]
});

// Stocke l'heure de démarrage pour calculer l'uptime
let botStartTime;

// Connexion au bot Discord
client.login("MTA3Nzk1MDk0NjM2NzI1NDU2MQ.GyCzA4.XsBff_Qj8HJxDjh6oyIRgDKo7ShfXfvg3szp6Y");

// Événement 'ready' pour signaler que le bot est prêt
client.on("ready", async () => {
    botStartTime = Date.now(); // Stocke le temps UNIX au démarrage du bot
    console.log(`${client.user.tag} est en ligne !`);

    // Créer un serveur HTTP
    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Serveur WebSocket en ligne !');
    });

    // Créer un serveur WebSocket
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log("Un client s'est connecté via WebSocket.");

        // Fonction pour convertir le temps en hh:mm:ss
        const formatTime = (seconds) => {
            const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
            const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            return `${hours}:${minutes}:${secs}`;
        };

        // Fonction pour calculer la latence API et envoyer le statut
        const sendBotStatus = async () => {
            const uptimeSeconds = Math.floor((Date.now() - botStartTime) / 1000);

            // Latence entre le bot et l'API Discord
            const apiLatency = client.ws.ping;

            // Latence globale (envoi d'un message sur un canal et réception de l'acknowledgment)
            const startTime = Date.now();
            let globalLatency = "Calcul en cours...";
            try {
                const sentMessage = await client.channels.cache.first().send('Ping test !'); // Envoie un message sur le premier canal
                globalLatency = `${Date.now() - startTime} ms`; // Temps total entre envoi et réception
                await sentMessage.delete(); // Supprime le message après le test
            } catch (err) {
                console.error("Erreur lors du test de latence globale :", err);
                globalLatency = "Erreur lors du test";
            }

            const data = {
                status: "Bot en ligne",
                uptime: formatTime(uptimeSeconds), // Temps au format hh:mm:ss
                ping: apiLatency, // Latence de l'API
                globalLatency // Latence globale calculée
            };
            ws.send(JSON.stringify(data));
        };

        // Envoyer le statut initial au client
        sendBotStatus();

        // Mettre à jour les clients toutes les 10 secondes
        const interval = setInterval(sendBotStatus, 10000);

        // Gérer les messages entrants
        ws.on('message', (message) => {
            console.log("Message reçu :", message);
        });

        // Nettoyage lorsque le client se déconnecte
        ws.on('close', () => {
            console.log("Un client s'est déconnecté.");
            clearInterval(interval); // Arrêter l'envoi des mises à jour
        });
    });

    // Lancer le serveur HTTP + WebSocket
    const PORT = 3180;
    server.listen(PORT, () => {
        console.log(`Serveur HTTP lancé sur http://test.airbot.adkynet.eu:${PORT}`);
    });
});
