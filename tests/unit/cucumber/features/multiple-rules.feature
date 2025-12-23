Feature: Multiple Rules test
  Test that scenarios under different Rules are correctly matched

  Rule: First Rule
    Scenario: Scenario in first rule
      Given I am in the first rule
      When something happens
      Then it should work

  Rule: Second Rule
    Scenario: Scenario in second rule
      Given I am in the second rule
      When something fails
      Then it should be added to rerun
