describe('Landing Page', () => {

    beforeEach(() => cy.visit('/'))

    it('loads landing page should be successfully', () => {
        cy.get('[data-id="root"]').should('be.visible')
    })

    it('loads landing page should fail', () => {
      cy.get('[data-id="root"]').should('not.be.visible')
    })
})
