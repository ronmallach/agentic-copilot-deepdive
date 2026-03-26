// generated-by-copilot: Cypress E2E tests for the Book Stats page
describe('Book Stats Page', () => {
  it('navigates to /stats via nav link', () => {
    cy.visit('/');
    cy.get('a#stats-link').click();
    cy.url().should('include', '/stats');
  });

  it('displays the page heading', () => {
    cy.visit('/stats');
    cy.contains('h2', 'Book Stats').should('exist');
  });

  it('displays total books stat card', () => {
    cy.visit('/stats');
    cy.get('[data-cy="stat-total-books"]').should('be.visible');
    // generated-by-copilot: use invoke text to avoid CSS Modules hashed class name selectors
    cy.get('[data-cy="stat-total-books"]').invoke('text').then(text => {
      expect(Number(text.trim())).to.be.greaterThan(0);
    });
  });

  it('displays favorited books stat card', () => {
    cy.visit('/stats');
    cy.get('[data-cy="stat-favorited-books"]').should('be.visible');
  });

  it('stats page is accessible without login', () => {
    cy.visit('/stats');
    cy.contains('h2', 'Book Stats').should('exist');
  });
});
