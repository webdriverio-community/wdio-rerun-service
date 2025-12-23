Feature: Ignored tag scenario test
  Test that scenarios with ignored tags are not added to re-run

  @skip
  Scenario: This scenario should be ignored
    Given I have a scenario with @skip tag
    When the test fails
    Then it should NOT be added to nonPassingItems
