Feature: Ignored Tag Scenarios

  Scenario: Untagged failing scenario
    Given I am on Google
    Then the page title should be "This will not match"

  @skip-rerun
  Scenario: Tagged failing scenario that should be ignored
    Given I am on Google
    Then the page title should be "Also will not match"
