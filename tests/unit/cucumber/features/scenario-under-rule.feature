@feature-tag
Feature: Generate line number for Scenarios nested under Rules
  As a rerun service user
  I want to generate line numbers for scenarios inside Rule blocks
  So that I can rerun failing cases that use the Rule keyword

  Rule: Business validation rule
    Scenario: This scenario is inside a Rule
      Given I am testing rule scenarios
      And I fail the test
