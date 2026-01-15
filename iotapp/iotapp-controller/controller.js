/*****************************************************
 * IOTAPP CONTROLLER — AUTO-ADAPTIVE (RBAC FINAL)
 * - Observe Prometheus
 * - Detecte saturation
 * - Deploy encoder / decoder
 * - Active / désactive rerouting Istio
 *****************************************************/
if (process.env.SERVICE) {
  console.error("controller.js must not be used as a service runner");
  process.exit(1);
}

const axios = require("axios");
const fs = require("fs");
const yaml = require("js-yaml");
const k8s = require("@kubernetes/client-node");

// ================= PROMETHEUS =================
const PROMETHEUS_URL = "http://prometheus.istio-system:9090/api/v1/query";

// ================= SEUILS =====================
const CPU_THRESHOLD = 0.8;
const RAM_THRESHOLD_MB = 800;
const LATENCY_THRESHOLD = 200;
const THROUGHPUT_THRESHOLD = 50;

// ================= KUBERNETES CLIENT ==========
const kc = new k8s.KubeConfig();
kc.loadFromCluster();

const appsApi = kc.makeApiClient(k8s.AppsV1Api);
const coreApi = kc.makeApiClient(k8s.CoreV1Api);
const customApi = kc.makeApiClient(k8s.CustomObjectsApi);

// ================= PROMETHEUS QUERY ===========
async function queryPrometheus(query) {
  const res = await axios.get(PROMETHEUS_URL, { params: { query } });
  return res.data.data.result;
}

// ================= YAML APPLY =================
async function applyYaml(path) {
  const docs = yaml.loadAll(fs.readFileSync(path, "utf8"));

  for (const doc of docs) {
    if (!doc || !doc.kind) continue;

    try {
      if (doc.kind === "Deployment") {
        await appsApi.createNamespacedDeployment("default", doc);
      } else if (doc.kind === "Service") {
        await coreApi.createNamespacedService("default", doc);
      } else if (doc.kind === "VirtualService") {
        await customApi.createNamespacedCustomObject(
          "networking.istio.io",
          "v1beta1",
          "default",
          "virtualservices",
          doc
        );
      }
      console.log(`✔ ${doc.kind} '${doc.metadata.name}' applied`);
    } catch (err) {
      if (err.response?.statusCode === 409) {
        console.log(`ℹ ${doc.kind} '${doc.metadata.name}' already exists`);
      } else {
        console.error(`✖ Failed ${doc.kind}`, err.body || err);
      }
    }
  }
}

// ================= ISTIO STATE =================
async function isReroutingActive() {
  try {
    await customApi.getNamespacedCustomObject(
      "networking.istio.io",
      "v1beta1",
      "default",
      "virtualservices",
      "gwf1-to-encoder"
    );
    return true;
  } catch {
    return false;
  }
}

// ================= DEPLOY MIDDLEWARE ==========
async function enableMiddleware() {
  console.log("⚠ ACTION: Enable middleware + rerouting");

  await applyYaml("/app/encoder/encoder-deployment.yaml");
  await applyYaml("/app/encoder/encoder-service.yaml");

  await applyYaml("/app/decoder/decoder-deployment.yaml");
  await applyYaml("/app/decoder/decoder-service.yaml");

  await applyYaml("/app/K8s/istio-reroute.yaml");
}

// ================= ROLLBACK ====================
async function disableMiddleware() {
  console.log("ACTION: Rollback to nominal path");

  const vsList = ["gwf1-to-encoder", "gwi-to-decoder"];

  for (const vs of vsList) {
    try {
      await customApi.deleteNamespacedCustomObject(
        "networking.istio.io",
        "v1beta1",
        "default",
        "virtualservices",
        vs
      );
      console.log(`✔ VirtualService '${vs}' deleted`);
    } catch {
      console.log(`ℹ VirtualService '${vs}' already absent`);
    }
  }
}

// ================= METRICS =====================
async function collectMetrics() {
  try {
    const cpu = parseFloat((await queryPrometheus(`
      sum(rate(container_cpu_usage_seconds_total{namespace="default",pod=~"iotapp-.*"}[1m]))
    `))[0]?.value[1] || 0);

    const ram = parseFloat((await queryPrometheus(`
      sum(container_memory_working_set_bytes{namespace="default",pod=~"iotapp-.*"}) / 1024 / 1024
    `))[0]?.value[1] || 0);

    const latency = parseFloat((await queryPrometheus(`
      histogram_quantile(0.95,
        sum(rate(istio_request_duration_milliseconds_bucket{
          destination_service_name="iotapp-gwf1"
        }[1m])) by (le)
      )
    `))[0]?.value[1] || 0);

    const throughput = parseFloat((await queryPrometheus(`
      sum(rate(istio_requests_total{
        destination_service_name="iotapp-gwf1"
      }[1m]))
    `))[0]?.value[1] || 0);

    console.log("--------------------------------------------------");
    console.log(" METRICS");

    console.log(` CPU usage      : ${cpu.toFixed(4)} cores`);
    console.log(` RAM usage      : ${ram.toFixed(2)} MB`);
    console.log(` Latency p95    : ${latency.toFixed(2)} ms`);
    console.log(` Throughput     : ${throughput.toFixed(2)} req/s`);

    let reasons = [];
    if (cpu > CPU_THRESHOLD) reasons.push("CPU overload");
    if (ram > RAM_THRESHOLD_MB) reasons.push("RAM pressure");
    if (latency > LATENCY_THRESHOLD) reasons.push("High latency");
    if (throughput > THROUGHPUT_THRESHOLD) reasons.push("High throughput");

    const saturated = reasons.length > 0;

    if (saturated) {
      console.log(" STATE: SATURATED");
      reasons.forEach(r => console.log(`   ↳ Reason: ${r}`));
    } else {
      console.log(" STATE: NOMINAL");
    }


    console.log("--------------------------------------------------");


    const rerouting = await isReroutingActive();

    if (saturated && !rerouting) {
      await enableMiddleware();
    }

    if (!saturated && rerouting) {
      await disableMiddleware();
    }

    console.log("---------------------------------------------");

  } catch (err) {
    console.error(" Metrics error:", err.message);
  }
}

// ================= START ======================
console.log("iotapp-controller started (FINAL)");
setInterval(collectMetrics, 10000);
