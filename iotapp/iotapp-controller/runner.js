/*****************************************************
 * IOTAPP RUNNER — GENERIC SERVICE LAUNCHER
 * - Lance un service métier (encoder, decoder, gateway, server)
 * - Ne contient AUCUNE logique de contrôle
 *****************************************************/

const path = require("path");

const service = process.env.SERVICE;
const args = process.env.ARGS || "";

if (!service) {
  console.error(" SERVICE environment variable is not defined");
  process.exit(1);
}

console.log(`▶ Starting service: ${service}`);
if (args) {
  console.log(`▶ With args: ${args}`);
}

// Inject args into process.argv (comme un vrai CLI)
process.argv = [
  "node",
  service,
  ...args.split(" ").filter(a => a.length > 0)
];

try {
  require(path.join(__dirname, service));
} catch (err) {
  console.error(` Failed to start service ${service}`);
  console.error(err);
  process.exit(1);
}
