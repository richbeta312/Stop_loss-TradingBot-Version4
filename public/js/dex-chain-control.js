const DEX_SUPPORTED_CHAINS = {
  cowswap: ["ethereum", "arbitrum", "optimism", "base"],
  "1inch": ["ethereum", "arbitrum", "optimism", "base"],
  velora: ["ethereum", "base"],
};

function updateAvailableChains() {
  const selectedDex = document.getElementById("dexAggregator").value;
  const chainSelect = document.getElementById("chain");
  const supportedChains = DEX_SUPPORTED_CHAINS[selectedDex] || [];

  Array.from(chainSelect.options).forEach((option) => {
    const chainValue = option.value;
    if (!supportedChains.includes(chainValue)) {
      option.style.display = "none";

      if (chainSelect.value === chainValue) {
        chainSelect.value = supportedChains[0] || "";
      }
    } else {
      option.style.display = "";
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const dexSelect = document.getElementById("dexAggregator");
  if (dexSelect) {
    updateAvailableChains();

    dexSelect.addEventListener("change", updateAvailableChains);
  }
});
