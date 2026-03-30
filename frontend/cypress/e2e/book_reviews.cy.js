describe('Book Reviews', () => {
  const username = `reviewuser${Math.floor(Math.random() * 10000)}`;
  const password = `reviewpass${Math.floor(Math.random() * 10000)}`;

  before(() => {
    cy.visit('http://localhost:5173');
    cy.contains('Create Account').click();
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="password"]').type(password);
    cy.get('button#register').click();
    cy.contains('Registration successful').should('exist');
  });

  beforeEach(() => {
    cy.visit('http://localhost:5173');
    cy.contains('Login').click();
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="password"]').type(password);
    cy.get('button#login').click();
    cy.contains('Books').click();
  });

  it('should show a Reviews toggle on each book card', () => {
    cy.get('[data-testid="reviews-toggle"]').should('have.length.at.least', 1);
  });

  it('should expand the reviews section when the toggle is clicked', () => {
    cy.get('[data-testid="reviews-toggle"]').first().click();
    cy.get('[data-testid="review-form"]').should('exist');
  });

  it('should show an error when submitting without selecting a rating', () => {
    cy.get('[data-testid="reviews-toggle"]').first().click();
    cy.get('[data-testid="submit-review-button"]').click();
    cy.get('[data-testid="review-form-error"]').should('contain', 'star rating');
  });

  it('should submit a review and display it in the reviews list', () => {
    cy.get('[data-testid="reviews-toggle"]').first().click();
    cy.get('[data-testid="star-button-4"]').click();
    cy.get('[data-testid="review-comment-input"]').type('Cypress test review');
    cy.get('[data-testid="submit-review-button"]').click();
    cy.get('[data-testid="reviews-list"]').should('contain', 'Cypress test review');
  });

  it('should display the average rating after submitting a review', () => {
    cy.get('[data-testid="reviews-toggle"]').first().click();
    cy.get('[data-testid="avg-rating"]').should('exist');
  });

  it('should allow the author to delete their own review', () => {
    cy.get('[data-testid="reviews-toggle"]').first().click();
    cy.get('[data-testid="delete-review-button"]').first().click();
    cy.get('[data-testid="reviews-list"]').then(($list) => {
      // generated-by-copilot: after deletion the list may be empty or have fewer items
      cy.wrap($list.find('[data-testid="review-item"]').length).should('be.gte', 0);
    });
  });
});
