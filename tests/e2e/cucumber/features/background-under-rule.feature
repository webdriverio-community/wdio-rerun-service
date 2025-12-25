Feature: Background Under Rule

  Rule: Rule with background

    Background:
      Given I am on Google

    Scenario: Failing scenario after background
      Then the page title should be "This will not match"
