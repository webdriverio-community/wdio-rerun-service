@feature-tag
Feature: Scenario Outline with Multiple Examples
  As a rerun service user
  I want to test scenario outlines with multiple Examples tables
  So that I can ensure line numbers are captured correctly

  Scenario Outline: Check multiple examples
    Given I have a value "<value>"
    When I process it
    Then I should get "<result>"

    Examples: First set
      | value | result |
      | foo   | FOO    |
      | bar   | BAR    |

    Examples: Second set
      | value | result |
      | baz   | BAZ    |
      | qux   | QUX    |
