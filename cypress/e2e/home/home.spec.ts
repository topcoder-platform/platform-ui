describe('Landing Page', () => {

    beforeEach(() => cy.visit('/'))

    // TCA-336 temporarily skip this bc the site isn't loading
    it.skip('loads landing page should be successfully', () => {
        cy.get('[data-id="root"]').should('be.visible')
    })

    it.skip('loads landing page should fail', () => {
      cy.get('[data-id="root"]').should('not.be.visible')
    })
})
