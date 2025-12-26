Feature: Scenario Outline Failure

  Scenario Outline: Intentional outline failure
    Given I am on Google
    Then the page title should be "<expected>"

    Examples:
      | expected           |
      | This will not match |
