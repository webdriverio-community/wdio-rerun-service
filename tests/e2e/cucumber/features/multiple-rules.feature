Feature: Multiple Rules

  Rule: First Rule

    Scenario: Scenario in first rule
      Given I am on Google
      Then the page title should be "First rule failure"

  Rule: Second Rule

    Scenario: Scenario in second rule
      Given I am on Google
      Then the page title should be "Second rule failure"
