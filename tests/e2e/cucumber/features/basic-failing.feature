Feature: Basic Failing Scenario

  Scenario: Intentional failure
    Given I am on Google
    Then the page title should be "This will never match"
