toastr.options = {
  closeButton: true,
  progressBar: false,
  positionClass: "toast-top-right",
  timeOut: "5000",
};

let isLoaded = false;
async function startBot() {
  const chainId = document.getElementById("chain").value;
  const stopLossPrice = document.getElementById("stopLoss").value;
  const initialAmount = document.getElementById("initialETH").value;
  const selectedStablecoin = document.getElementById("stablecoin").value;
  const slippage = document.getElementById("slippage").value;
  const gasPriority = document.getElementById("gas").value;
  const buffer = document.getElementById("buffer").value;
  const cooldown = document.getElementById("cooldown").value;
  const partialFill = document.getElementById("partialFillsToggle").checked;
  const dexAggregator = document.getElementById("dexAggregator").value;
  const wasSimulationEnabled = window.isSimulationMode;
  const simulatedPriceValue = document.getElementById("simulatedPrice").value;

  const trailingStopEnabled = document.getElementById(
    "trailingStopEnabled"
  ).checked;
  let trailingThreshold = 0;
  let trailingAmount = 0;

  if (trailingStopEnabled) {
    trailingThreshold = document.getElementById("trailingThreshold").value || 0;
    trailingAmount = document.getElementById("trailingAmount").value || 0;
  }

  if (!stopLossPrice || !initialAmount) {
    toastr.error("Please fill in all required fields");
    return;
  }

  const config = {
    chainId,
    stopLossPrice,
    initialAmount,
    selectedStablecoin,
    slippage,
    gasPriority,
    buffer,
    cooldown,
    isUSDMode: window.isUSDMode,
    trailingStopEnabled,
    trailingThreshold,
    trailingAmount,
    partialFill,
    dexAggregator,
    wasSimulationEnabled,
    simulatedPriceValue,
  };

  const hasEnoughBalance = await validateBalance(config);
  if (!hasEnoughBalance) {
    toastr.error("Bot start canceled due to insufficient balance");
    return false;
  }

  document.getElementById("startBot").style.display = "none";
  document.getElementById("stopBot").style.display = "block";
  document.getElementById("statusIndicator").className =
    "status-indicator active";
  document.getElementById("statusText").textContent = "Bot Active";

  try {
    const response = await fetch("/api/bot/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });

    toggleFormFields(false);

    const data = await response.json();
    if (data.success) {
      toastr.success(data.message);
    } else {
      toastr.error(data.error);
    }
  } catch (error) {
    console.error("Error starting bot:", error);
    toastr.error("Failed to start bot: " + error.message);
  }

  if (wasSimulationEnabled) {
    document.getElementById("simulationToggle").checked = true;
    document.getElementById("simulationInputs").style.display = "block";
    document.getElementById("simulatedPrice").value = simulatedPriceValue;
    window.isSimulationMode = true;
    setSimulatedPrice(simulatedPriceValue);
  }
}

async function initConfig() {
  const response = await fetch("/api/bot/config", {
    method: "GET",
  });

  const data = await response.json();

  if (data.isActive) {
    try {
      if (!isLoaded) {
        document.getElementById("startBot").style.display = "none";
        document.getElementById("stopBot").style.display = "block";
        document.getElementById("statusIndicator").className =
          "status-indicator active";
        document.getElementById("statusText").textContent = "Bot Active";
        document.getElementById("partialFillsToggle").checked =
          data.partialFill;
        document.querySelector("#startUSD input[type='checkbox']").checked =
          data.isUSDMode;
        window.isUSDMode = data.isUSDMode;
        document.getElementById("initialETH").value = data.initialAmount;
        document.getElementById("stablecoin").value = data.selectedStablecoin;
        document.getElementById("chain").value = data.chainId;
        document.getElementById("dexAggregator").value = data.dex;

        if (data.wasSimulationEnabled) {
          document.getElementById("simulationInputs").style.display = "block";
          document.getElementById("simulationToggle").checked = true;
          window.isSimulationMode = true;
          document.getElementById("simulatedPrice").value =
            data.simulatedPriceValue;
          setSimulatedPrice(data.simulatedPriceValue);
        } else {
          document.getElementById("simulationInputs").style.display = "none";
          document.getElementById("simulatedPrice").value = "";
        }

        document.getElementById("stopLoss").value = data.stopLossPrice;
        document.getElementById("buffer").value = data.buffer;
        document.getElementById("cooldown").value = data.cooldown;

        document.getElementById("slippage").value = data.slippage;
        document.getElementById("gas").value = data.gasPriority;

        isLoaded = true;
      }

      document.getElementById("trailingStopEnabled").checked =
        data.trailingStopEnabled;

      if (data.trailingStopEnabled) {
        const trailingStopLossInputs = document.getElementById(
          "trailingStopLossInputs"
        );
        const currentThreshold = document.getElementById("currentThreshold");

        trailingStopLossInputs.classList.add("active");
        currentThreshold.classList.add("active");

        if (data.newStopLossPrice > 0) {
          document.getElementById(
            "currentThreshold"
          ).textContent = `Live Threshold: $${data.newStopLossPrice.toFixed(
            2
          )}`;
        } else {
          document.getElementById(
            "currentThreshold"
          ).textContent = `Live Threshold: $${data.stopLossPrice.toFixed(2)}`;
        }
        document.getElementById("trailingThreshold").value =
          data.trailingThreshold;
        document.getElementById("trailingAmount").value = data.trailingAmount;
      }
    } catch (error) {
      console.error("Error initializing bot config:", error);
    }

    toggleFormFields(false);
  }
}
async function stopBot() {
  try {
    const response = await fetch("/api/bot/stop", {
      method: "POST",
    });
    const data = await response.json();
    if (data.success) {
      toastr.success(data.message);
    } else {
      toastr.error(data.error);
    }
  } catch (error) {
    console.error("Error stopping bot:", error);
    toastr.error("Failed to stop bot: " + error.message);
  }

  toggleFormFields(true);

  document.getElementById("startBot").style.display = "block";
  document.getElementById("stopBot").style.display = "none";
  document.getElementById("statusIndicator").className =
    "status-indicator paused";
  document.getElementById("statusText").textContent = "Bot Paused";

  try {
    const response = await fetch("/api/transactions/clear", {
      method: "DELETE",
    });
    const data = await response.json();
    if (data.success) {
      toastr.success(data.message);
    } else {
      toastr.error("Failed to clear transactions: " + data.error);
    }
  } catch (error) {
    console.error("Error clearing transactions:", error);
    toastr.error("Error clearing transactions: " + error.message);
  }
}

const toggleFormFields = (enabled) => {
  const inputFields = document.querySelectorAll("input, select, textarea");
  const excludedFieldIds = [
    "stopButton",
    "simulationToggle",
    "simulatedPrice",
    "applyPrice",
  ];

  inputFields.forEach((field) => {
    if (!excludedFieldIds.includes(field.id)) {
      field.disabled = !enabled;

      if (!enabled) {
        field.classList.add("disabled-input");
      } else {
        field.classList.remove("disabled-input");
      }
    }
  });

  const startButton = document.getElementById("startButton");
  const stopButton = document.getElementById("stopButton");

  if (startButton && stopButton) {
    startButton.style.display = enabled ? "block" : "none";
    stopButton.style.display = enabled ? "none" : "block";
  }
};

const validateBalance = async (config) => {
  try {
    const isUSDMode = config.isUSDMode || false;
    const initialAmount = parseFloat(config.initialAmount);
    const selectedStablecoin = config.selectedStablecoin;

    if (!window.currentBalances) {
      console.error("Cannot validate balance: currentBalances not available");
      return false;
    }

    let requiredToken, availableBalance;

    if (isUSDMode) {
      requiredToken = selectedStablecoin;
      availableBalance =
        parseFloat(window.currentBalances[selectedStablecoin.toLowerCase()]) ||
        0;
    } else {
      requiredToken = "WETH";
      availableBalance = parseFloat(window.currentBalances.weth) || 0;
    }
    if (availableBalance < initialAmount) {
      toastr.error(
        `Insufficient balance! You need at least ${initialAmount} ${requiredToken} but only have ${availableBalance.toFixed(
          6
        )} ${requiredToken}`
      );
      return false;
    }

    return true;
  } catch (error) {
    toastr.error("Failed to validate balance");
    return false;
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  await initConfig();
  await updateChainBalance();
});
