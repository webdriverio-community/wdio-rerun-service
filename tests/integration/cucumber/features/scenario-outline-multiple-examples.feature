Feature: Scenario Outline with Multiple Examples

  Scenario Outline: Multiple example tables
    Given I am on Google
    Then the page title should be "<expected>"

    Examples: First set
      | expected      |
      | First failure |

    Examples: Second set
      | expected       |
      | Second failure |
