Feature: Scenario Under Rule

  Rule: Business rule that groups scenarios

    Scenario: Failing scenario under rule
      Given I am on Google
      Then the page title should be "This will not match"
