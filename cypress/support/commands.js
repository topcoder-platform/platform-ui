// sets up the injected provider to be a mock ethereum provider with the given mnemonic/index
Cypress.Commands.overwrite('visit', (original, url, options) => {
  return original(url, {
    ...options,
    onBeforeLoad(win) {
      if (options && options.onBeforeLoad) {
        options.onBeforeLoad(win)
      }
      // win.localStorage.clear()
      // const provider = new JsonRpcProvider('https://bsc-dataseed.binance.org/', 56)
      // const signer = new Wallet(TEST_PRIVATE_KEY, provider)
      // // eslint-disable-next-line no-param-reassign
      // win.ethereum = new CustomizedBridge(signer, provider)
      // win.localStorage.setItem('connectorIdv2', 'injected')
    },
  })
})

Cypress.on('uncaught:exception', () => {
  // returning false here prevents Cypress from failing the test
  // Needed for trading competition page since it throws unhandled rejection error
  return false
})