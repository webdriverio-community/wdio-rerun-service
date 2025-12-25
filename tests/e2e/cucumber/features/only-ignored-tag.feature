Feature: Only Ignored Tag Scenario

  @skip-rerun
  Scenario: Only failing scenario has ignored tag
    Given I am on Google
    Then the page title should be "This will not match"
