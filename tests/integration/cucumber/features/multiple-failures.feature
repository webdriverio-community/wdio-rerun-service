Feature: Multiple Failures

  Scenario: First failing scenario
    Given I am on Google
    Then the page title should be "First failure"

  Scenario: Second failing scenario
    Given I am on Google
    Then the page title should be "Second failure"
