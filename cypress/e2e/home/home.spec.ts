describe('Landing Page', () => {
  beforeEach(() => cy.visit('/'))
  it('loads landing page should be successfully', () => {
    cy.get('[data-cy="root"]').should('be.visible')
  })
})
