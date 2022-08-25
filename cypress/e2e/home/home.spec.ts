// import { TEST_ADDRESS_NEVER_USE, TEST_ADDRESS_NEVER_USE_SHORTENED } from '../../support/commands'

describe('Home Page', () => {
  beforeEach(() => cy.visit('/'))
  it('loads home page', () => {
    cy.get('#root')
  })
})
