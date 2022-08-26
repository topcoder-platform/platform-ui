describe('Landing Page', () => {
  beforeEach(() => cy.visit('/'))
  it('loads landing page should be successfully', () => {
    cy.get('#root').should('be.visible')
  })
})
