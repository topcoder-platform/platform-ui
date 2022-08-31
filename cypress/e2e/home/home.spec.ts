describe('Landing Page', () => {

    beforeEach(() => cy.visit('/'))

    it('loads landing page should be successfully', () => {
        // TCA-60 temp add "not.be.visible" to test ci integration
        cy.get('[data-cy="root"]').should('not.be.visible')
    })
})
