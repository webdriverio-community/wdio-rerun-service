@feature-tag
Feature: Generate line number for Scenario Outlines nested under Rules
  As a rerun service user
  I want to generate line numbers for scenario outlines inside Rule blocks
  So that I can rerun failing cases with specific example data

  Rule: Example data validation
    Scenario Outline: Testing with different data sets
      Given I use the "<testData>" for "<testCase>"
      Then I validate the result

      Examples: Primary data
        | testCase | testData |
        | case1    | value1   |
        | case2    | value2   |

      Examples: Secondary data
        | testCase | testData |
        | case3    | value3   |
