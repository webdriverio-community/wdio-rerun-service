Feature: Scenario Outline Under Rule

  Rule: Data validation rule

    Scenario Outline: Outline inside a Rule
      Given I am on Google
      Then the page title should be "<expected>"

      Examples:
        | expected            |
        | This will not match |
