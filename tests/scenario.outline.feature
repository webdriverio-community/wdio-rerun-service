@tag10
Feature: Generate line number at Example data line of the failing case rather than the Scenario Outline line
  As a rerun service user
  I want to gnerate line number at Example data line of the failing case rather than the Scenario Outline line
  So that I can rerun the failing scenario only 

  Scenario Outline: This is a scenario outline
    And I use the "<testData>" for "<testCase>"

    Examples:
      | testCase | testData |
      | case1    | value1   |
      