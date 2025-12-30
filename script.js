const API_URL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies"
const COUNTRIES_API = "https://restcountries.com/v3.1/all"

const amountInput = document.getElementById("amount")
const fromSelect = document.getElementById("from-currency-select")
const toSelect = document.getElementById("to-currency-select")
const swapBtn = document.getElementById("swap-btn")
const themeToggle = document.getElementById("theme-toggle")
const resultContent = document.getElementById("result-content")
const resultContainer = document.getElementById("result-container")

let exchangeRates = {}
let currencies = []
let selectedFrom = "usd"
let selectedTo = "inr" 
async function init() {
  try {
    await fetchCountriesData()
    await updateExchangeRates()
  } catch (error) {
    console.error("Initialization failed:", error)
  }
}
async function fetchCountriesData() {
  const response = await fetch(COUNTRIES_API)
  const data = await response.json()

  const currencyMap = {}
  data.forEach((country) => {
    if (country.currencies) {
      const currCode = Object.keys(country.currencies)[0].toLowerCase()
      if (!currencyMap[currCode]) {
        currencyMap[currCode] = {
          code: currCode.toUpperCase(),
          name: country.currencies[Object.keys(country.currencies)[0]].name,
          flag: country.flags.svg,
        }
      }
    }
  })

  currencies = Object.values(currencyMap).sort((a, b) => a.code.localeCompare(b.code))
  populateDropdowns()
}

function populateDropdowns() {
  ;[fromSelect, toSelect].forEach((select) => {
    const list = select.querySelector(".options-list")
    list.innerHTML = ""

    currencies.forEach((curr) => {
      const option = document.createElement("div")
      option.className = "option-item"
      option.innerHTML = `
                <img src="${curr.flag}" alt="${curr.code}" class="flag-icon">
                <span>${curr.code} - ${curr.name}</span>
            `
      option.onclick = (e) => {
        e.stopPropagation()
        selectCurrency(select, curr)
      }
      list.appendChild(option)
    })

    select.onclick = () => {
      const isActive = select.classList.contains("active")
      closeAllSelects()
      if (!isActive) select.classList.add("active")
    }
  })
}

function selectCurrency(selectElement, currency) {
  const isFrom = selectElement.id === "from-currency-select"
  if (isFrom) selectedFrom = currency.code.toLowerCase()
  else selectedTo = currency.code.toLowerCase()

  const trigger = selectElement.querySelector(".select-trigger")
  trigger.querySelector("img").src = currency.flag
  trigger.querySelector(".selected-text").textContent = `${currency.code} - ${currency.name}`

  selectElement.classList.remove("active")
  updateExchangeRates()
}

function closeAllSelects() {
  document.querySelectorAll(".custom-select").forEach((s) => s.classList.remove("active"))
}

async function updateExchangeRates() {
  resultContent.classList.add("updating")
  try {
    const response = await fetch(`${API_URL}/${selectedFrom}.json`)
    const data = await response.json()
    exchangeRates = data[selectedFrom]
    calculateConversion()
  } catch (error) {
    console.error("Error fetching rates:", error)
  } finally {
    resultContent.classList.remove("updating")
  }
}

function calculateConversion() {
  const amount = Number.parseFloat(amountInput.value) || 0
  const rate = exchangeRates[selectedTo]
  const convertedAmount = (amount * rate).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const resultTitle = document.querySelector(".converted-amount")
  const baseAmountText = document.querySelector(".base-amount")
  const rateText = document.querySelector(".rate-text")
  const updateTime = document.querySelector(".update-time")

  baseAmountText.textContent = `${amount.toLocaleString()} ${selectedFrom.toUpperCase()} =`
  resultTitle.textContent = `${convertedAmount} ${selectedTo.toUpperCase()}`
  rateText.textContent = `1 ${selectedFrom.toUpperCase()} = ${rate.toFixed(4)} ${selectedTo.toUpperCase()}`
  updateTime.textContent = `Market rates as of ${new Date().toLocaleTimeString()}`

  resultContent.classList.remove("show")
  void resultContent.offsetWidth
  resultContent.classList.add("show")
}

amountInput.addEventListener("input", calculateConversion)
amountInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") updateExchangeRates()
})

swapBtn.onclick = () => {
  const tempFrom = selectedFrom
  const fromTrigger = fromSelect.querySelector(".select-trigger")
  const toTrigger = toSelect.querySelector(".select-trigger")

  const fromImg = fromTrigger.querySelector("img").src
  const fromTxt = fromTrigger.querySelector(".selected-text").textContent

  fromTrigger.querySelector("img").src = toTrigger.querySelector("img").src
  fromTrigger.querySelector(".selected-text").textContent = toTrigger.querySelector(".selected-text").textContent

  toTrigger.querySelector("img").src = fromImg
  toTrigger.querySelector(".selected-text").textContent = fromTxt

  selectedFrom = selectedTo
  selectedTo = tempFrom

  updateExchangeRates()
}

themeToggle.onclick = () => {
  document.body.classList.toggle("dark-theme")
  localStorage.setItem("theme", document.body.classList.contains("dark-theme") ? "dark" : "light")
}
document.onclick = (e) => {
  if (!e.target.closest(".custom-select")) closeAllSelects()
}

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-theme")
}

init()
