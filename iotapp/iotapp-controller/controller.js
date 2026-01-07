const axios = require("axios");

const PROMETHEUS_URL = "http://prometheus.istio-system:9090/api/v1/query";

// -------- Seuils --------
const CPU_THRESHOLD = 0.8;          // cores
const RAM_THRESHOLD_MB = 800;       // MB
const LATENCY_THRESHOLD = 200;      // ms (p95)
const THROUGHPUT_THRESHOLD = 50;    // req/s (exemple)

async function queryPrometheus(query) {
  const response = await axios.get(PROMETHEUS_URL, {
    params: { query }
  });
  return response.data.data.result;
}

async function collectMetrics() {
  try {
    // CPU
    const cpuQuery = `
      sum(rate(container_cpu_usage_seconds_total{
        namespace="default",
        pod=~"iotapp-.*"
      }[1m]))
    `;

    // RAM
    const ramQuery = `
      sum(container_memory_working_set_bytes{
        namespace="default",
        pod=~"iotapp-.*"
      }) / 1024 / 1024
    `;

    // Latence p95 Istio
    const latencyQuery = `
      histogram_quantile(
        0.95,
        sum(rate(istio_request_duration_milliseconds_bucket{
          destination_service_name="iotapp-gwf1"
        }[1m])) by (le)
      )
    `;

    // Débit (req/s)
    const throughputQuery = `
      sum(rate(istio_requests_total{
        destination_service_name="iotapp-gwf1"
      }[1m]))
    `;

    const cpu = parseFloat((await queryPrometheus(cpuQuery))[0]?.value[1] || 0);
    const ram = parseFloat((await queryPrometheus(ramQuery))[0]?.value[1] || 0);
    const latency = parseFloat((await queryPrometheus(latencyQuery))[0]?.value[1] || 0);
    const throughput = parseFloat((await queryPrometheus(throughputQuery))[0]?.value[1] || 0);

    // Détection saturation
    const saturated =
      cpu > CPU_THRESHOLD ||
      ram > RAM_THRESHOLD_MB ||
      latency > LATENCY_THRESHOLD ||
      throughput > THROUGHPUT_THRESHOLD;

    console.log(" METRICS");
    console.log(` CPU usage      : ${cpu.toFixed(4)} cores`);
    console.log(` RAM usage      : ${ram.toFixed(2)} MB`);
    console.log(` Latency p95    : ${latency.toFixed(2)} ms`);
    console.log(` Throughput     : ${throughput.toFixed(2)} req/s`);

    if (saturated) {
      console.log(" STATE: SATURATED");
      if (cpu > CPU_THRESHOLD) console.log("   ↳ Reason: CPU overload");
      if (ram > RAM_THRESHOLD_MB) console.log("   ↳ Reason: RAM pressure");
      if (latency > LATENCY_THRESHOLD) console.log("   ↳ Reason: High latency");
      if (throughput > THROUGHPUT_THRESHOLD) console.log("   ↳ Reason: High throughput");
    } else {
      console.log(" STATE: NORMAL");
    }

    console.log("--------------------------------------------------");

  } catch (err) {
    console.error(" Error collecting metrics:", err.message);
  }
}

console.log("iotapp-controller started (full metrics + detection)");

setInterval(collectMetrics, 10000);
