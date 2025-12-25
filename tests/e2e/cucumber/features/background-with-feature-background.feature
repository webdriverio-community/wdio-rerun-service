Feature: Background at Feature and Rule Level

  Background:
    Given I am on Google

  Rule: Rule with its own background

    Background:
      Given I am on Google

    Scenario: Scenario with two backgrounds
      Then the page title should be "This will not match"
