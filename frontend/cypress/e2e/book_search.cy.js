describe('Book Search', () => {
  // generate a random username and password for the e2e tests
  const username = `searchuser${Math.floor(Math.random() * 1000)}`;
  const password = `searchpass${Math.floor(Math.random() * 1000)}`;
  const user = { username, password };

  before(() => {
    // Register user once before all tests
    cy.visit('http://localhost:5173');
    cy.contains('Create Account').click();
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password);
    cy.get('button#register').click();
    cy.contains('Registration successful! You can now log in.').should('exist');
  });

  beforeEach(() => {
    // Login before each test
    cy.visit('http://localhost:5173');
    cy.contains('Login').click();
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password);
    cy.get('button#login').click();
    cy.contains(`Hi, ${user.username}`).should('exist');
  });

  it('should navigate to search page from header', () => {
    cy.get('[data-testid="search-link"]').click();
    cy.url().should('include', '/search');
    cy.get('[data-testid="search-page-title"]').should(
      'contain',
      'Search Books'
    );
  });

  it('should display search form on search page', () => {
    cy.get('[data-testid="search-link"]').click();
    cy.get('[data-testid="search-input"]').should('be.visible');
    cy.get('[data-testid="search-button"]').should('be.visible');
    cy.get('[data-testid="clear-search-button"]').should('be.visible');
  });

  it('should search books by title', () => {
    cy.get('[data-testid="search-link"]').click();
    cy.get('[data-testid="search-input"]').type('Mockingbird');
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="search-results"]').should('be.visible');
    cy.get('[data-testid="search-result-item"]').should(
      'have.length.at.least',
      1
    );
    cy.get('[data-testid="search-result-item"]')
      .first()
      .should('contain', 'To Kill a Mockingbird');
    cy.get('[data-testid="search-result-item"]')
      .first()
      .should('contain', 'Harper Lee');
  });

  it('should search books by author', () => {
    cy.get('[data-testid="search-link"]').click();
    cy.get('[data-testid="search-input"]').type('George Orwell');
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="search-results"]').should('be.visible');
    cy.get('[data-testid="search-result-item"]').should(
      'have.length.at.least',
      1
    );
    cy.get('[data-testid="search-result-item"]')
      .first()
      .should('contain', '1984');
    cy.get('[data-testid="search-result-item"]')
      .first()
      .should('contain', 'George Orwell');
  });

  it('should perform case-insensitive search', () => {
    cy.get('[data-testid="search-link"]').click();
    cy.get('[data-testid="search-input"]').type('PRIDE');
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="search-results"]').should('be.visible');
    cy.get('[data-testid="search-result-item"]').should(
      'have.length.at.least',
      1
    );
    cy.get('[data-testid="search-result-item"]')
      .first()
      .should('contain', 'Pride and Prejudice');
    cy.get('[data-testid="search-result-item"]')
      .first()
      .should('contain', 'Jane Austen');
  });

  it('should search with partial matches', () => {
    cy.get('[data-testid="search-link"]').click();
    cy.get('[data-testid="search-input"]').type('Great');
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="search-results"]').should('be.visible');
    cy.get('[data-testid="search-result-item"]').should(
      'have.length.at.least',
      1
    );
    cy.get('[data-testid="search-result-item"]')
      .first()
      .should('contain', 'The Great Gatsby');
    cy.get('[data-testid="search-result-item"]')
      .first()
      .should('contain', 'F. Scott Fitzgerald');
  });

  it('should show no results message for non-matching search', () => {
    cy.get('[data-testid="search-link"]').click();
    cy.get('[data-testid="search-input"]').type('NonExistentBook');
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="search-no-results"]').should('be.visible');
    cy.get('[data-testid="search-no-results"]').should(
      'contain',
      'No books found'
    );
    cy.get('[data-testid="search-result-item"]').should('not.exist');
  });

  it('should clear search results when clear button is clicked', () => {
    cy.get('[data-testid="search-link"]').click();
    cy.get('[data-testid="search-input"]').type('Mockingbird');
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="search-results"]').should('be.visible');
    cy.get('[data-testid="clear-search-button"]').click();

    cy.get('[data-testid="search-input"]').should('have.value', '');
    cy.get('[data-testid="search-results"]').should('not.exist');
  });

  it('should allow adding search results to favorites', () => {
    cy.get('[data-testid="search-link"]').click();
    cy.get('[data-testid="search-input"]').type('1984');
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="search-result-item"]')
      .first()
      .within(() => {
        cy.get('[data-testid="add-favorite-button"]').click();
      });

    // Check that it was added to favorites
    cy.get('[data-testid="favorites-link"]').click();
    cy.get('[data-testid="favorite-item"]').should('contain', '1984');
  });

  it('should allow removing search results from favorites', () => {
    // First add to favorites
    cy.get('[data-testid="search-link"]').click();
    cy.get('[data-testid="search-input"]').type('Pride');
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="search-result-item"]')
      .first()
      .within(() => {
        cy.get('[data-testid="add-favorite-button"]').click();
      });

    // Then remove from favorites
    cy.get('[data-testid="search-result-item"]')
      .first()
      .within(() => {
        cy.get('[data-testid="remove-favorite-button"]').click();
      });

    // Check that it was removed from favorites
    cy.get('[data-testid="favorites-link"]').click();
    cy.get('[data-testid="favorite-item"]').should(
      'not.contain',
      'Pride and Prejudice'
    );
  });

  it('should display pagination controls for search results', () => {
    cy.get('[data-testid="search-link"]').click();
    cy.get('[data-testid="search-input"]').type('a'); // Search for 'a' to get multiple results
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="search-results"]').should('be.visible');
    cy.get('[data-testid="pagination-info"]').should('be.visible');
    cy.get('[data-testid="pagination-info"]').should('contain', 'Page');
  });

  it('should show loading state during search', () => {
    // generated-by-copilot: intercept and delay to reliably catch the loading state
    cy.intercept('GET', '**/api/books/search*', (req) => {
      req.reply((res) => {
        res.setDelay(500);
      });
    }).as('searchRequest');

    cy.get('[data-testid="search-link"]').click();
    cy.get('[data-testid="search-input"]').type('Mockingbird');
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="search-loading"]').should('exist');
    cy.wait('@searchRequest');
  });

  it('should show error state for search failures', () => {
    // This test would require mocking network failures
    // For now, it defines the expected behavior when search API fails
    cy.get('[data-testid="search-link"]').click();
    cy.get('[data-testid="search-input"]').type('test');

    // Intercept and fail the search request
    cy.intercept('GET', '**/api/books/search*', { statusCode: 500 });
    cy.get('[data-testid="search-button"]').click();

    cy.get('[data-testid="search-error"]').should('be.visible');
    cy.get('[data-testid="search-error"]').should(
      'contain',
      'Failed to search books'
    );
  });

  it('should handle empty search input validation', () => {
    cy.get('[data-testid="search-link"]').click();
    cy.get('[data-testid="search-button"]').click(); // Click search without entering text

    cy.get('[data-testid="search-input-error"]').should('be.visible');
    cy.get('[data-testid="search-input-error"]').should(
      'contain',
      'Please enter a search term'
    );
    cy.get('[data-testid="search-results"]').should('not.exist');
  });
});
