const CHAINS = {
  ethereum: 1,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
};

let isSimulationMode = false;
let simulatedPrice = null;
let currentPrice = 0;
let isTrading = false;
let initialETHAmount = 0;
window.isSimulationMode = isSimulationMode;
window.simulatedPrice = simulatedPrice;

function setSimulatedPrice(price) {
  currentPrice = parseFloat(price);
  window.simulatedPrice = currentPrice;

  document.querySelector(
    ".currentPrice span"
  ).textContent = `${currentPrice.toFixed(2)} (Simulated)`;

  return currentPrice;
}
async function getETHPrice() {
  try {
    if (isSimulationMode) {
      document.querySelector(
        ".currentPrice span"
      ).textContent = `${currentPrice.toFixed(2)} (Simulated)`;

      return currentPrice;
    }

    const chainId = CHAINS[document.getElementById("chain").value];
    const selectedStablecoin = document.getElementById("stablecoin").value;

    const response = await fetch(
      `/api/price?chainId=${chainId}&stablecoin=${selectedStablecoin}`
    );
    const responseData = await response.json();

    currentPrice = parseFloat(responseData);
    document.querySelector(
      ".currentPrice span"
    ).textContent = `WETH/${selectedStablecoin} Price: $${currentPrice.toFixed(
      2
    )}`;

    return currentPrice;
  } catch (error) {
    console.log("Error fetching ETH price:", error);
    return null;
  }
}

function updateStablecoinOptions() {
  const selectedChain = document.getElementById("chain").value;
  const stablecoinSelect = document.getElementById("stablecoin");
  const dexAggregatorSelect = document.getElementById("dexAggregator");

  if (!stablecoinSelect || !dexAggregatorSelect) return;

  stablecoinSelect.innerHTML = "";
  stablecoinSelect.add(new Option("USDT", "USDT"));
  stablecoinSelect.add(new Option("USDC", "USDC"));
  stablecoinSelect.add(new Option("DAI", "DAI"));

  if (selectedChain === "optimism") {
    dexAggregatorSelect.querySelector('option[value="cowswap"]').style.display =
      "none";
    dexAggregatorSelect.value = "1inch";
  } else {
    dexAggregatorSelect.querySelector('option[value="cowswap"]').style.display =
      "block";
  }
}

async function updateLogStatus(id) {
  try {
    await fetch(`/api/logs/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
  } catch (error) {
    console.log("Error updating log status:", error);
  }
}
async function fetchLogsFromBackend() {
  try {
    const response = await fetch("/api/logs");
    const { data } = await response.json();

    const logContainer = document.getElementById("log");
    const noLogsMessage = document.getElementById("noLogsMessage");

    logContainer.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      if (noLogsMessage) {
        noLogsMessage.style.display = "block";
      }
      return;
    }

    if (noLogsMessage) {
      noLogsMessage.style.display = "none";
    }

    data.forEach(async (log) => {
      if (!log.isRead) {
        toastr.success(log.message);
        const countdownElement = document.getElementById("countdown");
        countdownElement.style.display = "block";
        countdownCooldown();
        updateLogStatus(log._id);
      }
      const logItem = document.createElement("p");
      logItem.className = "log-item";

      let timestamp = new Date(log.timestamp).toUTCString();
      timestamp = timestamp.replace("GMT", "UTC");
      logItem.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${log.message}`;

      logContainer.appendChild(logItem);
    });
  } catch (error) {
    console.error("Error fetching logs from backend:", error);
  }
}

async function getPriceandLog() {
  await initConfig();
  if (!window.isSimulationMode) {
    await getETHPrice();
  }
  await fetchLogsFromBackend();
}

document
  .getElementById("chain")
  .addEventListener("change", updateStablecoinOptions);
document
  .getElementById("dexAggregator")
  .addEventListener("change", getETHPrice);
document.addEventListener("DOMContentLoaded", () => {
  getPriceandLog();
  const simulationToggle = document.getElementById("simulationToggle");
  const simulationInputs = document.getElementById("simulationInputs");
  const simulatedPrice = document.getElementById("simulatedPrice");
  const applyPrice = document.getElementById("applyPrice");

  simulationToggle.addEventListener("change", async function () {
    isSimulationMode = this.checked;
    window.isSimulationMode = isSimulationMode;
    simulationInputs.style.display = this.checked ? "block" : "none";

    if (this.checked) {
      if (simulatedPrice.value) {
        setSimulatedPrice(simulatedPrice.value);
      }
    } else {
      window.simulatedPrice = null;
      await enableSimulation();
      getETHPrice();
    }
  });

  applyPrice.addEventListener("click", async function () {
    if (simulatedPrice.value) {
      setSimulatedPrice(simulatedPrice.value);
      await enableSimulation();
    }
  });

  simulatedPrice.addEventListener("keyup", function (event) {
    if (event.key === "Enter" && this.value) {
      setSimulatedPrice(this.value);
    }
  });
});

async function countdownCooldown() {
  const countdownElement = document.getElementById("countdown");
  let remainingTime = document.getElementById("cooldown").value;
  while (remainingTime > 0) {
    countdownElement.innerText = `Cooldown: ${remainingTime} seconds`;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    remainingTime--;
  }
  countdownElement.style.display = "none";
}
async function enableSimulation() {
  await fetch(`/api/simulation/enable`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      wasSimulationEnabled: window.isSimulationMode,
      simulationPrice: document.getElementById("simulatedPrice").value,
    }),
  });
}

setInterval(getPriceandLog, 5000);
