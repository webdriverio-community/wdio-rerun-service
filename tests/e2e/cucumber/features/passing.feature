Feature: Passing Scenarios

  Scenario: Visit test page
    Given I am on Google
    Then the page title should contain "Test"
